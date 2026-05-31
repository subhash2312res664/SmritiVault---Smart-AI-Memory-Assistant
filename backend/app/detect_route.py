from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from app.auth import get_current_user
from app.database import items_collection
from app.routes import ist_now, format_ist
from ultralytics import YOLO
from PIL import Image
import io
import base64
import cv2
import numpy as np

detect_router = APIRouter(tags=["AI Detection"])

# ---------- Load YOLO model once ----------
# Downloads yolov8n.pt automatically on first run (~6MB)
model = YOLO("yolov8n.pt")

# ---------- Items we track ----------
# Maps YOLO class names → friendly display names
TRACKED_ITEMS = {
    "cell phone":   "Phone",
    "laptop":       "Laptop",
    "keyboard":     "Keyboard",
    "mouse":        "Mouse",
    "book":         "Book",
    "backpack":     "Backpack",
    "handbag":      "Handbag",
    "suitcase":     "Suitcase",
    "umbrella":     "Umbrella",
    "bottle":       "Bottle",
    "cup":          "Cup",
    "scissors":     "Scissors",
    "remote":       "Remote",
    "clock":        "Clock",
    "wallet":       "Wallet",
    "key":          "Keys",
    "tie":          "Tie",
    "glasses":      "Glasses",
    "watch":        "Watch",
    "vase":         "Vase",
    "toothbrush":   "Toothbrush",
    "hair drier":   "Hair Dryer",
    "person":       None,   # ignore people
}

CONFIDENCE_THRESHOLD = 0.45


# ---------- Detect endpoint ----------
@detect_router.post("/detect_items")
async def detect_items(
    location: str,
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
):
    # Validate file type
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image files are accepted.")

    # Read image
    contents = await file.read()
    image_pil = Image.open(io.BytesIO(contents)).convert("RGB")

    # Convert to numpy for OpenCV annotation
    image_np = np.array(image_pil)
    image_cv = cv2.cvtColor(image_np, cv2.COLOR_RGB2BGR)

    # Run YOLO detection
    results = model(image_pil, verbose=False)

    detected    = []
    seen_labels = set()   # avoid duplicate detections of same object

    for result in results:
        for box in result.boxes:
            yolo_label  = model.names[int(box.cls)]
            confidence  = float(box.conf)
            coords      = box.xyxy[0].tolist()   # [x1, y1, x2, y2]

            # Skip if not tracked, ignored, or low confidence
            if yolo_label not in TRACKED_ITEMS:
                continue
            display_name = TRACKED_ITEMS[yolo_label]
            if display_name is None:
                continue
            if confidence < CONFIDENCE_THRESHOLD:
                continue
            if display_name in seen_labels:
                continue

            seen_labels.add(display_name)

            # Draw bounding box on image
            x1, y1, x2, y2 = map(int, coords)
            cv2.rectangle(image_cv, (x1, y1), (x2, y2), (26, 107, 82), 2)
            cv2.putText(
                image_cv,
                f"{display_name} {confidence:.0%}",
                (x1, y1 - 8),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.55, (26, 107, 82), 2
            )

            # Save/update item in MongoDB
            now = ist_now()
            items_collection.update_one(
                {
                    "item_name":  display_name,
                    "user_email": current_user["email"],
                },
                {
                    "$set": {
                        "location":   location,
                        "timestamp":  now,
                        "log_type":   "ai_detected",
                        "confidence": round(confidence, 2),
                        "user_email": current_user["email"],
                    }
                },
                upsert=True,
            )

            detected.append({
                "item":       display_name,
                "confidence": f"{round(confidence * 100)}%",
                "location":   location,
                "logged_at":  format_ist(now),
            })

    # Encode annotated image as base64 to send back to frontend
    _, buffer = cv2.imencode(".jpg", image_cv)
    annotated_b64 = base64.b64encode(buffer).decode("utf-8")

    return {
        "detected_count": len(detected),
        "items":          detected,
        "annotated_image": f"data:image/jpeg;base64,{annotated_b64}",
        "message": (
            f"{len(detected)} item(s) detected and logged automatically!"
            if detected else
            "No recognizable items found. Try better lighting or move closer."
        ),
    }


# ---------- Detection history endpoint ----------
@detect_router.get("/detection_history")
def detection_history(current_user: dict = Depends(get_current_user)):
    """Return all AI-detected items for this user."""
    items = list(
        items_collection.find(
            {
                "user_email": current_user["email"],
                "log_type":   "ai_detected",
            },
            {"_id": 0},
        ).sort("timestamp", -1)
    )
    for item in items:
        item["timestamp"] = format_ist(item.get("timestamp"))
    return items
