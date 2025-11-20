from fastapi import FastAPI, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

app = FastAPI(
    title="Soum-like API",
    description="منظومة مزادات بسيطة كنواة لمشروع يشبه Soum",
    version="0.1.0",
)

# السماح بطلبات من أي واجهة Frontend في البداية
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =======================
#  نماذج البيانات Models
# =======================

class User(BaseModel):
    id: int
    name: str


class ItemCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=200)
    description: Optional[str] = None
    starting_price: float = Field(..., gt=0)


class Item(ItemCreate):
    id: int
    current_price: float
    is_active: bool = True
    owner_id: int


class BidCreate(BaseModel):
    amount: float = Field(..., gt=0)


class Bid(BaseModel):
    id: int
    item_id: int
    bidder_id: int
    amount: float
    created_at: datetime


# =======================
#  تخزين مؤقت In-Memory
#  (لاحقاً نبدلها Database)
# =======================

fake_users_db: List[User] = [
    User(id=1, name="Admin"),
    User(id=2, name="TestUser"),
]

items_db: List[Item]()_

