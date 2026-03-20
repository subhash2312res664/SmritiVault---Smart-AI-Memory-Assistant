from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

class ItemLog(BaseModel):
    item_name: str = Field(..., min_length=2, max_length=50)
    location: str = Field(..., min_length=2, max_length=100)
    log_type: str = Field(default="manual")
    timestamp: Optional[datetime] = None