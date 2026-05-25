from fastapi import APIRouter, HTTPException, Depends
from app.models import ItemLog, UpdateItem
from app.database import items_collection
from app.auth import get_current_user
from datetime import datetime
from zoneinfo import ZoneInfo
from datetime import datetime, timezone

router = APIRouter(tags=["Items"])

IST = ZoneInfo("Asia/Kolkata")


def ist_now() -> datetime:
    return datetime.now(IST)

def format_ist(dt: datetime) -> str:
    if dt is None:
        return None
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    ist = dt.astimezone(ZoneInfo("Asia/Kolkata"))
    return ist.strftime("%d/%m/%Y %I:%M %p IST")


# ─── Log Item ──────────────────────────────────────────────

@router.post("/log_item", status_code=201)
def log_item(item: ItemLog, current_user: dict = Depends(get_current_user)):
    existing = items_collection.find_one({
        "item_name": {"$regex": f"^{item.item_name.strip()}$", "$options": "i"},
        "user_email": current_user["email"],
    })

    if existing:
        # Item exists → auto update location
        new_time = ist_now()
        items_collection.update_one(
            {"_id": existing["_id"]},
            {"$set": {
                "location": item.location,
                "timestamp": new_time,
            }}
        )
        return {
            "message": f"✅ '{item.item_name}' already existed — location updated!",
            "location": item.location,
            "saved_on": format_ist(new_time),
        }

    # Item does not exist → save new
    item_dict = item.model_dump()
    item_dict["timestamp"] = ist_now()
    item_dict["user_email"] = current_user["email"]
    result = items_collection.insert_one(item_dict)

    return {
        "message": f"✅ '{item.item_name}' saved successfully",
        "id": str(result.inserted_id),
        "location": item.location,
        "saved_on": format_ist(item_dict["timestamp"]),
    }


# ─── Search Item ───────────────────────────────────────────

@router.get("/search_item/{item_name}")
def search_item(item_name: str, current_user: dict = Depends(get_current_user)):
    item = items_collection.find_one(
        {
            "item_name": {"$regex": item_name, "$options": "i"},
            "user_email": current_user["email"],       # only own items
        },
        sort=[("timestamp", -1)],
    )

    if not item:
        raise HTTPException(status_code=404, detail="Item not found. Try saving it first.")

    return {
        "item_name": item["item_name"],
        "location": item["location"],
        "saved_on": format_ist(item["timestamp"]),
        "log_type": item["log_type"],
    }


# ─── Update Item ───────────────────────────────────────────

@router.put("/update_item/{item_name}")
def update_item(
    item_name: str,
    data: UpdateItem,
    current_user: dict = Depends(get_current_user),
):
    new_time = ist_now()
    result = items_collection.find_one_and_update(
        {
            "item_name": {"$regex": f"^{item_name.strip()}$", "$options": "i"},
            "user_email": current_user["email"],
        },
        {"$set": {"location": data.location, "timestamp": new_time}},
        sort=[("timestamp", -1)],
    )

    if not result:
        raise HTTPException(
            status_code=404,
            detail=f"Item '{item_name}' not found. Try saving it first.",
        )

    return {"message": f"✅ '{item_name}' updated to: {data.location} updated on:{format_ist(new_time)}"}


# ─── Delete Item ───────────────────────────────────────────

@router.delete("/delete_item/{item_name}")
def delete_item(item_name: str, current_user: dict = Depends(get_current_user)):
    # FIX: was missing user_email filter & anchor regex was inconsistent
    result = items_collection.delete_one(
        {
            "item_name": {"$regex": f"^{item_name.strip()}$", "$options": "i"},
            "user_email": current_user["email"],
        }
    )

    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Item not found.")

    return {"message": f"🗑️ '{item_name}' deleted successfully."}


# ─── List All Items ────────────────────────────────────────

@router.get("/all_items")
def get_all_items(current_user: dict = Depends(get_current_user)):
    items = list(
        items_collection.find(
            {"user_email": current_user["email"]},
            {"_id": 0},   # exclude Mongo _id from response
        ).sort("timestamp", -1)
    )
    for item in items:                                        # ← add this
        item["timestamp"] = format_ist(item["timestamp"])
    return items
