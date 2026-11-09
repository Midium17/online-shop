from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional, List

# ==================== USER SCHEMAS ====================
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    role: Optional[str] = "customer"


class UserResponse(BaseModel):
    id: int
    email: EmailStr
    role: str
    first_name: Optional[str] = "N/A"
    last_name: Optional[str] = "N/A"
    total_orders: Optional[int] = 0
    total_spent: Optional[float] = 0.0

    model_config = ConfigDict(from_attributes=True)

class UserLogin(BaseModel):
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[EmailStr] = None
    role: Optional[str] = None


# ==================== CATEGORY SCHEMAS ====================
class CategoryBase(BaseModel):
    name: str
    description: Optional[str] = None

class CategoryCreate(CategoryBase):
    pass

class CategoryResponse(CategoryBase):
    id: int

    model_config = ConfigDict(from_attributes=True)


# ==================== PRODUCT SCHEMAS ====================
class ProductBase(BaseModel):
    title: str
    description: Optional[str] = None
    price: float
    stock: int
    image_url: Optional[str] = None
    image_urls: Optional[List[str]] = []
    sizes: Optional[List[str]] = ["S", "M", "L", "XL"]
    colors: Optional[List[str]] = ["Black", "White", "Navy"]
    category_id: Optional[int] = None

class ProductCreate(ProductBase):
    pass

class ProductResponse(ProductBase):
    id: int
    category: Optional[CategoryResponse] = None

    model_config = ConfigDict(from_attributes=True)


# ==================== ORDER SCHEMAS ====================
class OrderItemCreate(BaseModel):
    product_id: int
    quantity: int

class OrderCreate(BaseModel):
    customer_email: EmailStr
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    postal_code: Optional[str] = None
    country: Optional[str] = None
    items: List[OrderItemCreate]

class OrderItemResponse(BaseModel):
    id: int
    product_id: int
    quantity: int
    price: float

    model_config = ConfigDict(from_attributes=True)

class OrderResponse(BaseModel):
    id: int
    customer_email: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    postal_code: Optional[str] = None
    country: Optional[str] = None
    total_amount: float
    status: str
    items: List[OrderItemResponse] = []

    model_config = ConfigDict(from_attributes=True)

class OrderStatusUpdate(BaseModel):
    status: str



class CustomerAnalyticsResponse(BaseModel):
    id: int
    email: EmailStr
    total_orders: int
    total_spent: float
    has_ordered_before: bool
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class UserRoleUpdate(BaseModel):
    role: str

class RolePermissionsUpdate(BaseModel):
    permissions: List[str]