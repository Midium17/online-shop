from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.dependencies import get_current_user, get_current_admin_user
from typing import List
from app import models, schemas
from app.permissions import ROLE_PERMISSIONS, ALL_PERMISSIONS 
from app.database import get_db
from app.security import get_password_hash, verify_password, create_access_token

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)

@router.post("/register", response_model=schemas.UserResponse, status_code=status.HTTP_201_CREATED)
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(models.UserModel).filter(models.UserModel.email == user.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    hashed_password = get_password_hash(user.password)
    user_role = user.role if user.role else models.UserRole.CUSTOMER.value

    new_user = models.UserModel(
        email=user.email,
        hashed_password=hashed_password,
        role=user_role,
        first_name=getattr(user, "first_name", None),
        last_name=getattr(user, "last_name", None)
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.post("/login", response_model=schemas.Token)
def login(credentials: schemas.UserLogin, db: Session = Depends(get_db)):
    user = db.query(models.UserModel).filter(models.UserModel.email == credentials.email).first()
    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=schemas.UserResponse)
def get_me(current_user: models.UserModel = Depends(get_current_user)):
    return current_user


# READ ALL USERS (Staff & Admin list)
@router.get("/admin/users", response_model=List[schemas.UserResponse])
def get_all_users(db: Session = Depends(get_db), current_user: models.UserModel = Depends(get_current_user)):
    if current_user.role != models.UserRole.ADMIN.value:
        raise HTTPException(status_code=403, detail="Admin access required")
    return db.query(models.UserModel).all()


# CREATE USER WITH ROLE
@router.post("/admin/users", response_model=schemas.UserResponse, status_code=status.HTTP_201_CREATED)
def admin_create_user(user: schemas.UserCreate, db: Session = Depends(get_db), current_user: models.UserModel = Depends(get_current_user)):
    if current_user.role != models.UserRole.ADMIN.value:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    if db.query(models.UserModel).filter(models.UserModel.email == user.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    new_user = models.UserModel(
        email=user.email,
        hashed_password=get_password_hash(user.password),
        role=user.role if user.role else models.UserRole.CUSTOMER.value,
        first_name=getattr(user, "first_name", None),
        last_name=getattr(user, "last_name", None)
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


# UPDATE USER ROLE
@router.patch("/admin/users/{user_id}/role", response_model=schemas.UserResponse)
def update_user_role(user_id: int, role_update: schemas.UserRoleUpdate, db: Session = Depends(get_db), current_user: models.UserModel = Depends(get_current_user)):
    if current_user.role != models.UserRole.ADMIN.value:
        raise HTTPException(status_code=403, detail="Admin access required")

    target_user = db.query(models.UserModel).filter(models.UserModel.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    target_user.role = role_update.role
    db.commit()
    db.refresh(target_user)
    return target_user


# DELETE USER
@router.delete("/admin/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(user_id: int, db: Session = Depends(get_db), current_user: models.UserModel = Depends(get_current_user)):
    if current_user.role != models.UserRole.ADMIN.value:
        raise HTTPException(status_code=403, detail="Admin access required")

    if current_user.id == user_id:
        raise HTTPException(status_code=400, detail="Cannot delete your own account")

    target_user = db.query(models.UserModel).filter(models.UserModel.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    db.delete(target_user)
    db.commit()
    return None


# GET ALL ROLE PERMISSIONS
@router.get("/admin/permissions")
def get_role_permissions(current_user: models.UserModel = Depends(get_current_user)):
    if current_user.role != models.UserRole.ADMIN.value:
        raise HTTPException(status_code=403, detail="Admin access required")
    return {
        "permissions": list(ALL_PERMISSIONS),
        "role_permissions": ROLE_PERMISSIONS
    }


# UPDATE PERMISSIONS FOR A ROLE
@router.put("/admin/permissions/{role}")
def update_role_permissions(
    role: str,
    permissions_payload: schemas.RolePermissionsUpdate,
    current_user: models.UserModel = Depends(get_current_user)
):
    if current_user.role != models.UserRole.ADMIN.value:
        raise HTTPException(status_code=403, detail="Admin access required")

    if role not in ROLE_PERMISSIONS:
        raise HTTPException(status_code=404, detail="Role not found")

    ROLE_PERMISSIONS[role] = set(permissions_payload.permissions)
    return {"message": f"Permissions updated for role: {role}", "permissions": list(ROLE_PERMISSIONS[role])}


# GET ALL CUSTOMERS WITH FULL ORDER BREAKDOWN & PURCHASED ITEMS
@router.get("/admin/customers")
def get_all_customers(db: Session = Depends(get_db), current_user: models.UserModel = Depends(get_current_user)):
    # Allow any admin or staff role to view customer analytics
    if current_user.role not in [models.UserRole.ADMIN.value, "order_manager", "inventory_manager", "manager"]:
        raise HTTPException(status_code=403, detail="Unauthorized access to customer directory")
    
    # Fetch all users whose role is 'customer' or anyone who isn't staff
    users = db.query(models.UserModel).filter(
        (models.UserModel.role == "customer") | (models.UserModel.role == None)
    ).all()
    
    customer_analytics = []
    for user in users:
        # Safely fetch orders matching either user_id or customer_email
        orders = []
        try:
            orders = db.query(models.OrderModel).filter(
                (models.OrderModel.user_id == user.id) | (models.OrderModel.customer_email == user.email)
            ).all()
        except Exception:
            # Fallback if user_id column doesn't exist on OrderModel yet
            try:
                orders = db.query(models.OrderModel).filter(models.OrderModel.customer_email == user.email).all()
            except Exception:
                orders = []
        
        total_orders = len(orders)
        total_spent = sum(float(getattr(order, "total_amount", 0) or getattr(order, "total", 0) or 0) for order in orders)
        latest_order = orders[-1] if orders else None
        
        formatted_orders = []
        for o in orders:
            order_items = []
            items_source = getattr(o, "items", []) or []
            for item in items_source:
                prod = getattr(item, "product", None)
                order_items.append({
                    "title": getattr(item, "product_title", None) or (prod.title if prod else "Product"),
                    "quantity": int(getattr(item, "quantity", 1) or 1),
                    "price": float(getattr(item, "price", 0.0) or 0.0),
                    "image_url": getattr(item, "image_url", None) or (prod.image_url if prod else None)
                })
            
            formatted_orders.append({
                "id": o.id,
                "status": getattr(o, "status", "Completed"),
                "total_amount": float(getattr(o, "total_amount", 0) or getattr(o, "total", 0) or 0),
                "items": order_items
            })

        customer_analytics.append({
            "id": user.id,
            "email": user.email,
            "role": user.role or "customer",
            "first_name": getattr(user, "first_name", None) or (latest_order.first_name if latest_order else None) or "N/A",
            "last_name": getattr(user, "last_name", None) or (latest_order.last_name if latest_order else None) or "N/A",
            "phone": getattr(user, "phone", None) or (latest_order.phone if latest_order else None) or "No phone provided",
            "address": getattr(user, "address", None) or (latest_order.address if latest_order else None) or "N/A",
            "city": getattr(user, "city", None) or (latest_order.city if latest_order else None) or "N/A",
            "country": getattr(user, "country", None) or (latest_order.country if latest_order else None) or "N/A",
            "total_orders": total_orders,
            "total_spent": total_spent,
            "orders": formatted_orders
        })
        
    return customer_analytics

# UPDATE CUSTOMER PROFILE
@router.put("/admin/customers/{customer_id}", response_model=schemas.UserResponse)
def update_customer(
    customer_id: int,
    user_update: dict,
    db: Session = Depends(get_db),
    current_user: models.UserModel = Depends(get_current_user)
):
    if current_user.role not in [models.UserRole.ADMIN.value, "order_manager"]:
        raise HTTPException(status_code=403, detail="Unauthorized")
    
    customer = db.query(models.UserModel).filter(models.UserModel.id == customer_id, models.UserModel.role == "customer").first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    for key, value in user_update.items():
        if hasattr(customer, key) and value is not None:
            setattr(customer, key, value)
        
    db.commit()
    db.refresh(customer)
    return customer


# DELETE CUSTOMER
@router.delete("/admin/customers/{customer_id}")
def delete_customer(
    customer_id: int,
    db: Session = Depends(get_db),
    current_user: models.UserModel = Depends(get_current_user)
):
    if current_user.role != models.UserRole.ADMIN.value:
        raise HTTPException(status_code=403, detail="Admin privileges required to delete customers")
    
    customer = db.query(models.UserModel).filter(models.UserModel.id == customer_id, models.UserModel.role == "customer").first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
        
    db.delete(customer)
    db.commit()
    return {"message": f"Customer #{customer_id} deleted successfully"}

@router.patch("/me", response_model=schemas.UserResponse)
def update_my_profile(
    profile_update: schemas.UserProfileUpdate,
    current_user: models.UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update logged-in customer's profile and default shipping address."""
    if profile_update.first_name is not None:
        current_user.first_name = profile_update.first_name
    if profile_update.last_name is not None:
        current_user.last_name = profile_update.last_name
    if profile_update.phone is not None:
        current_user.phone = profile_update.phone
    if profile_update.address is not None:
        current_user.address = profile_update.address
    if profile_update.city is not None:
        current_user.city = profile_update.city
    if profile_update.postal_code is not None:
        current_user.postal_code = profile_update.postal_code
    if profile_update.country is not None:
        current_user.country = profile_update.country

    db.commit()
    db.refresh(current_user)
    return current_user