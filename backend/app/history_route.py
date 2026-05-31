from fastapi import APIRouter, HTTPException, Depends
from app.database import items_collection
from app.auth import get_current_user
from app.routes import format_ist

history_router = APIRouter(tags=["History"])


@history_router.get("/item_history/{item_name}")
def get_item_history(item_name: str, current_user: dict = Depends(get_current_user)):
    """Return full location history for a specific item."""
    item = items_collection.find_one(
        {
            "item_name": {"$regex": f"^{item_name.strip()}$", "$options": "i"},
            "user_email": current_user["email"],
        }
    )
    if not item:
        raise HTTPException(status_code=404, detail=f"Item '{item_name}' not found.")

    history = item.get("history", [])
    formatted = []
    for entry in reversed(history):
        formatted.append({
            "location":  entry.get("location"),
            "log_type":  entry.get("log_type", "manual"),
            "timestamp": format_ist(entry.get("timestamp")),
            "note":      entry.get("note", None),
        })

    return {
        "item_name":        item["item_name"],
        "current_location": item["location"],
        "total_moves":      len(history),
        "history":          formatted,
    }


@history_router.get("/all_history")
def get_all_history(current_user: dict = Depends(get_current_user)):
    """Return latest entry for every item — for activity feed."""
    items = list(
        items_collection.find(
            {"user_email": current_user["email"]},
            {"_id": 0, "item_name": 1, "location": 1,
             "timestamp": 1, "log_type": 1, "history": 1}
        ).sort("timestamp", -1)
    )
    feed = []
    for item in items:
        history = item.get("history", [])
        last    = history[-1] if history else None
        feed.append({
            "item_name":   item["item_name"],
            "location":    item["location"],
            "log_type":    item.get("log_type", "manual"),
            "timestamp":   format_ist(item.get("timestamp")),
            "last_action": format_ist(last["timestamp"]) if last else None,
            "total_moves": len(history),
        })
    return feed
