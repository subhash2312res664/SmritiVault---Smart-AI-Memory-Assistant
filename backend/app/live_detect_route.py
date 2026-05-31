from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, Query
from app.database import items_collection
from app.routes import ist_now, format_ist
from app.auth import decode_token
from ultralytics import YOLO
from PIL import Image
import asyncio
import base64
import io
import cv2
import numpy as np
import json

live_router = APIRouter(tags=["Live Detection"])

# Load YOLO once
model = YOLO("yolov8n.pt")

CONFIDENCE_THRESHOLD = 0.50

# Items we track — YOLO label → display name
TRACKED_ITEMS = {
    "cell phone":  "Phone",
    "laptop":      "Laptop",
    "keyboard":    "Keyboard",
    "mouse":       "Mouse",
    "book":        "Book",
    "backpack":    "Backpack",
    "handbag":     "Handbag",
    "bottle":      "Bottle",
    "cup":         "Cup",
    "scissors":    "Scissors",
    "remote":      "Remote",
    "clock":       "Clock",
    "umbrella":    "Umbrella",
    "suitcase":    "Suitcase",
    "tie":         "Tie",
    "vase":        "Vase",
}

# How many consecutive frames an item must be
# seen/unseen before we log a state change
STABLE_FRAMES = 3


def run_yolo(image_pil):
    """Run YOLO and return dict of {display_name: confidence}."""
    results  = model(image_pil, verbose=False)
    detected = {}
    for result in results:
        for box in result.boxes:
            label      = model.names[int(box.cls)]
            confidence = float(box.conf)
            if label not in TRACKED_ITEMS:
                continue
            name = TRACKED_ITEMS[label]
            if confidence < CONFIDENCE_THRESHOLD:
                continue
            # Keep highest confidence if same item seen twice
            if name not in detected or detected[name]["conf"] < confidence:
                coords = list(map(int, box.xyxy[0].tolist()))
                detected[name] = {"conf": confidence, "box": coords}
    return detected


def draw_boxes(image_np, detected):
    """Draw bounding boxes on image, return base64 jpeg."""
    img = cv2.cvtColor(image_np, cv2.COLOR_RGB2BGR)
    for name, info in detected.items():
        x1, y1, x2, y2 = info["box"]
        conf = info["conf"]
        cv2.rectangle(img, (x1, y1), (x2, y2), (26, 107, 82), 2)
        label = f"{name} {conf:.0%}"
        (tw, th), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.55, 2)
        cv2.rectangle(img, (x1, y1 - th - 8), (x1 + tw + 6, y1), (26, 107, 82), -1)
        cv2.putText(img, label, (x1 + 3, y1 - 4),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.55, (255, 255, 255), 2)
    _, buf = cv2.imencode(".jpg", img, [cv2.IMWRITE_JPEG_QUALITY, 75])
    return "data:image/jpeg;base64," + base64.b64encode(buf).decode()


def auto_log(item_name, location, event, user_email, confidence):
    """Save state change to MongoDB."""
    now   = ist_now()
    entry = {
        "location":  location,
        "log_type":  "ai_detected",
        "event":     f"live_{event}",    # live_placed / live_picked_up
        "timestamp": now,
        "note":      f"Auto-detected via live camera ({event.replace('_', ' ')})",
    }

    if event == "placed":
        # Item appeared → update location and push history
        items_collection.update_one(
            {"item_name": item_name, "user_email": user_email},
            {
                "$set": {
                    "location":   location,
                    "timestamp":  now,
                    "log_type":   "ai_detected",
                    "event":      "live_placed",
                    "confidence": round(confidence, 2),
                    "user_email": user_email,
                },
                "$push": {"history": entry},
            },
            upsert=True,
        )
    else:
        # Item disappeared → just push to history (don't change location)
        items_collection.update_one(
            {"item_name": item_name, "user_email": user_email},
            {"$push": {"history": entry}},
        )

    return format_ist(now)


@live_router.websocket("/ws/live_detect")
async def live_detect_ws(
    websocket: WebSocket,
    token:     str = Query(...),
    location:  str = Query(default="Unknown Location"),
):
    """
    WebSocket endpoint for live camera detection.

    Client sends JSON: { "frame": "<base64 jpeg>" }
    Server sends JSON: {
        "annotated": "<base64 jpeg>",
        "detected":  [{"name": ..., "conf": ...}],
        "events":    [{"item": ..., "event": "placed"|"picked_up", "time": ...}]
    }
    """
    # Authenticate via token in query param
    try:
        payload    = decode_token(token)
        user_email = payload.get("sub")
        if not user_email:
            await websocket.close(code=1008)
            return
    except Exception:
        await websocket.close(code=1008)
        return

    await websocket.accept()

    # Tracking state
    # prev_state: {item_name: frames_count}
    # positive = seen for N frames, negative = unseen for N frames
    frame_count  = {}   # {name: int}  positive=present, negative=absent
    logged_state = {}   # {name: "present"|"absent"}  last logged state

    try:
        while True:
            # Receive frame from client
            data = await asyncio.wait_for(websocket.receive_text(), timeout=10.0)
            msg  = json.loads(data)

            if msg.get("type") == "ping":
                await websocket.send_text(json.dumps({"type": "pong"}))
                continue

            frame_b64 = msg.get("frame")
            if not frame_b64:
                continue

            # Decode base64 → PIL image
            img_bytes = base64.b64decode(frame_b64.split(",")[-1])
            image_pil = Image.open(io.BytesIO(img_bytes)).convert("RGB")
            image_np  = np.array(image_pil)

            # Run YOLO
            detected = run_yolo(image_pil)

            # Update frame counts
            all_tracked = set(frame_count.keys()) | set(detected.keys())
            events = []

            for name in all_tracked:
                if name in detected:
                    # Item visible this frame
                    frame_count[name] = max(1, frame_count.get(name, 0) + 1)
                else:
                    # Item not visible this frame
                    frame_count[name] = min(-1, frame_count.get(name, 0) - 1)

                count = frame_count[name]
                conf  = detected.get(name, {}).get("conf", 0.0)

                # Placed down — seen for STABLE_FRAMES consecutive frames
                if count >= STABLE_FRAMES and logged_state.get(name) != "present":
                    logged_state[name] = "present"
                    ts = auto_log(name, location, "placed", user_email, conf)
                    events.append({
                        "item":  name,
                        "event": "placed",
                        "label": f"{name} placed at {location}",
                        "time":  ts,
                        "conf":  f"{round(conf * 100)}%",
                    })

                # Picked up — unseen for STABLE_FRAMES consecutive frames
                elif count <= -STABLE_FRAMES and logged_state.get(name) != "absent":
                    logged_state[name] = "absent"
                    ts = auto_log(name, location, "picked_up", user_email, conf)
                    events.append({
                        "item":  name,
                        "event": "picked_up",
                        "label": f"{name} picked up from {location}",
                        "time":  ts,
                        "conf":  "",
                    })

            # Draw boxes and encode annotated frame
            annotated = draw_boxes(image_np, detected)

            # Send response
            response = {
                "annotated": annotated,
                "detected":  [
                    {"name": n, "conf": f"{round(i['conf']*100)}%"}
                    for n, i in detected.items()
                ],
                "events": events,
            }
            await websocket.send_text(json.dumps(response))

    except asyncio.TimeoutError:
        pass
    except WebSocketDisconnect:
        pass
    except Exception as e:
        print(f"LiveDetect error: {e}")
    finally:
        try:
            await websocket.close()
        except Exception:
            pass
