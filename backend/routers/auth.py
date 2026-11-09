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


@router.get("/admin/customers", response_model=List[schemas.CustomerAnalyticsResponse])
def get_all_customers(db: Session = Depends(get_db), current_user: models.UserModel = Depends(get_current_user)):
    if current_user.role not in [models.UserRole.ADMIN.value, "order_manager"]:
        raise HTTPException(status_code=403, detail="Unauthorized access to customer directory")
    
    users = db.query(models.UserModel).filter(models.UserModel.role == "customer").all()
    
    customer_analytics = []
    for user in users:
        orders = db.query(models.OrderModel).filter(models.OrderModel.customer_email == user.email).all()
        
        total_orders = len(orders)
        total_spent = sum(order.total_amount for order in orders)
        latest_order = orders[-1] if orders else None
        
        customer_analytics.append({
            "id": user.id,
            "email": user.email,
            "role": user.role,
            "first_name": user.first_name or (latest_order.first_name if latest_order else None),
            "last_name": user.last_name or (latest_order.last_name if latest_order else None),
            "phone": latest_order.phone if latest_order else None,
            "address": latest_order.address if latest_order else None,
            "city": latest_order.city if latest_order else None,
            "country": latest_order.country if latest_order else None,
            "total_orders": total_orders,
            "total_spent": total_spent,
            "has_ordered_before": total_orders > 0
        })
        
    return customer_analytics


@router.put("/admin/customers/{customer_id}", response_model=schemas.UserResponse)
def update_customer(
    customer_id: int,
    user_update: schemas.UserUpdate,
    db: Session = Depends(get_db),
    current_user: models.UserModel = Depends(get_current_user)
):
    if current_user.role not in [models.UserRole.ADMIN.value, "order_manager"]:
        raise HTTPException(status_code=403, detail="Unauthorized")
    
    customer = db.query(models.UserModel).filter(models.UserModel.id == customer_id, models.UserModel.role == "customer").first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    if user_update.first_name is not None:
        customer.first_name = user_update.first_name
    if user_update.last_name is not None:
        customer.last_name = user_update.last_name
    if user_update.email is not None:
        customer.email = user_update.email
        
    db.commit()
    db.refresh(customer)
    return customer


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