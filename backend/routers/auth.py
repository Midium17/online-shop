from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.dependencies import get_current_user, get_current_admin_user
from typing import List
from app import models, schemas
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
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = get_password_hash(user.password)
    db_user = models.UserModel(
        email=user.email,
        hashed_password=hashed_password,
        is_admin=user.is_admin
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

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


@router.get("/admin/customers", response_model=List[schemas.CustomerAnalyticsResponse])
def get_customers_analytics(
    db: Session = Depends(get_db),
    admin: models.UserModel = Depends(get_current_admin_user)
):
    users = db.query(models.UserModel).filter(models.UserModel.is_admin == False).all()
    customer_data = []

    for user in users:
        orders = db.query(models.OrderModel).filter(models.OrderModel.customer_email == user.email).all()
        total_spent = sum(o.total_amount for o in orders if o.total_amount)
        order_count = len(orders)
        
        # Grab details from the latest order if available
        latest_order = orders[-1] if orders else None

        customer_data.append({
            "id": user.id,
            "email": user.email,
            "total_orders": order_count,
            "total_spent": total_spent,
            "has_ordered_before": order_count > 0,
            "first_name": latest_order.first_name if latest_order else "N/A",
            "last_name": latest_order.last_name if latest_order else "",
            "phone": latest_order.phone if latest_order else "N/A",
            "address": latest_order.address if latest_order else "N/A",
            "city": latest_order.city if latest_order else "N/A",
            "country": latest_order.country if latest_order else "N/A",
        })

    return customer_data