from fastapi import APIRouter, HTTPException, Depends
from app.models import ItemLog, UpdateItem
from app.database import items_collection
from app.auth import get_current_user
from datetime import datetime, timezone, timedelta

router = APIRouter(tags=["Items"])

IST_OFFSET = timedelta(hours=5, minutes=30)


def ist_now() -> datetime:
    return datetime.now(timezone(IST_OFFSET))


def format_ist(dt: datetime) -> str:
    if dt is None:
        return None
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    ist = dt.astimezone(timezone(IST_OFFSET))
    return ist.strftime("%d/%m/%Y %I:%M %p IST")


def make_history_entry(location: str, log_type: str, note: str = None) -> dict:
    entry = {"location": location, "log_type": log_type, "timestamp": ist_now()}
    if note:
        entry["note"] = note
    return entry


# ---------- Log Item ----------
@router.post("/log_item", status_code=201)
def log_item(item: ItemLog, current_user: dict = Depends(get_current_user)):
    existing = items_collection.find_one({
        "item_name": {"$regex": f"^{item.item_name.strip()}$", "$options": "i"},
        "user_email": current_user["email"],
    })

    now           = ist_now()
    history_entry = make_history_entry(item.location, "manual")

    if existing:
        items_collection.update_one(
            {"_id": existing["_id"]},
            {
                "$set":  {"location": item.location, "timestamp": now, "log_type": "manual"},
                "$push": {"history": history_entry},
            }
        )
        return {
            "message":  f"'{item.item_name}' already existed — location updated!",
            "location": item.location,
            "saved_on": format_ist(now),
        }

    item_dict               = item.model_dump()
    item_dict["timestamp"]  = now
    item_dict["user_email"] = current_user["email"]
    item_dict["history"]    = [history_entry]

    result = items_collection.insert_one(item_dict)
    return {
        "message":  f"'{item.item_name}' saved successfully",
        "id":       str(result.inserted_id),
        "location": item.location,
        "saved_on": format_ist(now),
    }


# ---------- Search Item ----------
@router.get("/search_item/{item_name}")
def search_item(item_name: str, current_user: dict = Depends(get_current_user)):
    item = items_collection.find_one(
        {
            "item_name": {"$regex": item_name, "$options": "i"},
            "user_email": current_user["email"],
        },
        sort=[("timestamp", -1)],
    )
    if not item:
        raise HTTPException(status_code=404, detail="Item not found. Try saving it first.")
    return {
        "item_name": item["item_name"],
        "location":  item["location"],
        "saved_on":  format_ist(item["timestamp"]),
        "log_type":  item["log_type"],
    }


# ---------- Update Item ----------
@router.put("/update_item/{item_name}")
def update_item(item_name: str, data: UpdateItem, current_user: dict = Depends(get_current_user)):
    new_time      = ist_now()
    history_entry = make_history_entry(data.location, "manual")

    result = items_collection.find_one_and_update(
        {
            "item_name": {"$regex": f"^{item_name.strip()}$", "$options": "i"},
            "user_email": current_user["email"],
        },
        {
            "$set":  {"location": data.location, "timestamp": new_time},
            "$push": {"history": history_entry},
        },
        sort=[("timestamp", -1)],
    )
    if not result:
        raise HTTPException(status_code=404, detail=f"Item '{item_name}' not found.")
    return {
        "message":    f"'{item_name}' updated to: {data.location}",
        "updated_on": format_ist(new_time),
    }


# ---------- Delete Item ----------
@router.delete("/delete_item/{item_name}")
def delete_item(item_name: str, current_user: dict = Depends(get_current_user)):
    result = items_collection.delete_one({
        "item_name": {"$regex": f"^{item_name.strip()}$", "$options": "i"},
        "user_email": current_user["email"],
    })
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Item not found.")
    return {"message": f"'{item_name}' deleted successfully."}


# ---------- All Items ----------
@router.get("/all_items")
def get_all_items(current_user: dict = Depends(get_current_user)):
    items = list(
        items_collection.find(
            {"user_email": current_user["email"]},
            {"_id": 0, "history": 0},
        ).sort("timestamp", -1)
    )
    for item in items:
        item["timestamp"] = format_ist(item.get("timestamp"))
    return items
