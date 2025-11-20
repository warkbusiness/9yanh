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

# =======================
#   CORS
# =======================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],      # يمكنك تضييقها لاحقاً على دومين معيّن
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


class ItemUpdate(BaseModel):
    # للتعديل الجزئي (عنوان ووصف فقط)
    title: Optional[str] = Field(None, min_length=3, max_length=200)
    description: Optional[str] = None


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
# =======================

fake_users_db: List[User] = [
    User(id=1, name="Admin"),
    User(id=2, name="TestUser"),
]

items_db: List[Item] = []
bids_db: List[Bid] = []

item_id_counter = 1
bid_id_counter = 1


def get_user_by_id(user_id: int) -> Optional[User]:
    for u in fake_users_db:
        if u.id == user_id:
            return u
    return None


def get_item_by_id(item_id: int) -> Optional[Item]:
    for it in items_db:
        if it.id == item_id:
            return it
    return None


# =======================
#     Endpoints
# =======================


@app.get("/health")
def health_check():
    return {"status": "ok", "message": "API is running"}


@app.get("/users", response_model=List[User])
def list_users():
    return fake_users_db


@app.get("/items", response_model=List[Item])
def list_items(only_active: bool = True):
    if only_active:
        return [it for it in items_db if it.is_active]
    return items_db


@app.post("/items", response_model=Item, status_code=201)
def create_item(
    item_data: ItemCreate,
    x_user_id: int = Header(..., alias="X-User-Id"),
):
    """
    إنشاء إعلان جديد (سلعة للمزاد).
    نستخدم الهيدر X-User-Id كمستخدم افتراضي بدلاً عن نظام تسجيل دخول حقيقي.
    """
    global item_id_counter

    user = get_user_by_id(x_user_id)
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    new_item = Item(
        id=item_id_counter,
        title=item_data.title,
        description=item_data.description,
        starting_price=item_data.starting_price,
        current_price=item_data.starting_price,
        is_active=True,
        owner_id=user.id,
    )
    items_db.append(new_item)
    item_id_counter += 1
    return new_item


@app.get("/items/{item_id}", response_model=Item)
def get_item(item_id: int):
    item = get_item_by_id(item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return item


@app.put("/items/{item_id}", response_model=Item)
def update_item(
    item_id: int,
    item_data: ItemUpdate,
    x_user_id: int = Header(..., alias="X-User-Id"),
):
    """
    تعديل منتج (العنوان / الوصف فقط) من قبل مالكه.
    """
    item = get_item_by_id(item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    # السماح فقط للمالك بالتعديل
    if item.owner_id != x_user_id:
        raise HTTPException(status_code=403, detail="Not allowed to edit this item")

    if item_data.title is not None:
        item.title = item_data.title

    if item_data.description is not None:
        item.description = item_data.description

    return item


@app.post("/items/{item_id}/bids", response_model=Bid, status_code=201)
def place_bid(
    item_id: int,
    bid_data: BidCreate,
    x_user_id: int = Header(..., alias="X-User-Id"),
):
    """
    تقديم عرض (Bid) على سلعة.
    """
    global bid_id_counter

    user = get_user_by_id(x_user_id)
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    item = get_item_by_id(item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    if not item.is_active:
        raise HTTPException(status_code=400, detail="Item is not active")

    if bid_data.amount <= item.current_price:
        raise HTTPException(
            status_code=400,
            detail=f"Bid must be higher than current price ({item.current_price})",
        )

    new_bid = Bid(
        id=bid_id_counter,
        item_id=item.id,
        bidder_id=user.id,
        amount=bid_data.amount,
        created_at=datetime.utcnow(),
    )
    bids_db.append(new_bid)

    # تحديث السعر الحالي للسلعة
    item.current_price = bid_data.amount

    bid_id_counter += 1
    return new_bid


@app.get("/items/{item_id}/bids", response_model=List[Bid])
def list_bids_for_item(item_id: int):
    item = get_item_by_id(item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    return [b for b in bids_db if b.item_id == item.id]


@app.post("/items/{item_id}/close")
def close_item(
    item_id: int,
    x_user_id: int = Header(..., alias="X-User-Id"),
):
    """
    إغلاق المزاد على السلعة (إيقاف استقبال عروض جديدة).
    """
    item = get_item_by_id(item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    if item.owner_id != x_user_id:
        raise HTTPException(status_code=403, detail="Not allowed to close this item")

    item.is_active = False
    return {"status": "closed", "item_id": item.id, "final_price": item.current_price}
