from fastapi import APIRouter, HTTPException
from app.models import ItemLog
from app.database import items_collection
from datetime import datetime
from zoneinfo import ZoneInfo

from datetime import datetime
from zoneinfo import ZoneInfo


# def get_ist_time():
#     # Get current time in IST
#     ist_now = datetime.now(ZoneInfo("Asia/Kolkata"))
#     # Format as DD/MM/YYYY, HH:MM
#     # return ist_now.strftime("%d/%m/%Y, %H:%M")

router = APIRouter()

# Home
@router.get("/")
def read_root():
    return {"message": "Smart Memory Assistant API Running 🚀"}

# Save item
from pydantic import BaseModel

class UpdateItem(BaseModel):
    location: str

@router.post("/log_item")
def log_item(item: ItemLog):
    item_dict = item.dict()

    if not item_dict.get("timestamp"):
        item_dict["timestamp"] = datetime.now(ZoneInfo("Asia/Kolkata"))

    result = items_collection.insert_one(item_dict)

    return {
        "message": f"{item.item_name} saved successfully",
        "id": str(result.inserted_id),
        "location": item.location
    }

# Search item
@router.get("/search_item/{item_name}")
def search_item(item_name: str):
    item = items_collection.find_one(
        {"item_name": {"$regex": item_name, "$options": "i"}},
        sort=[("timestamp", -1)]
    )

    if not item:
        raise HTTPException(status_code=404, detail="Item not found, Try saving it first.")

    return {
        "item_name": item["item_name"],
        "location": item["location"],
        "saved_on": item["timestamp"],
        "log_type": item["log_type"]
    }


# Update item
@router.put("/update_item/{item_name}")
def update_item(item_name: str, data: UpdateItem):
    query = {
        "item_name": {"$regex": f"^{item_name.strip()}$", "$options": "i"}
    }

    result = items_collection.find_one_and_update(
        query,
        {
            "$set": {
                "location": data.location,
                "timestamp": datetime.now(ZoneInfo("Asia/Kolkata"))
            }
        },
        sort=[("timestamp", -1)]
    )

    if not result:
        # show as a standard 404 error in frontend
        raise HTTPException(status_code=404, detail=f"Item '{item_name}' not found. Try saving it first.")

    return {
        "message": f"Success! {item_name} updated to: {data.location}"
    }

# Delete item
@router.delete("/delete_item/{item_name}")
def delete_item(item_name: str):
    result = items_collection.delete_one(
        {"item_name": {"$regex": f"^{item_name}$", "$options": "i"}}
    )

    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Item not found")

    return {"message": "Deleted successfully"}

# List all items
@router.get("/all_items")
def get_all_items():
    items = list(items_collection.find())

    for item in items:
        item["_id"] = str(item["_id"])

    return items

