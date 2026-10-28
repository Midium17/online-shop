from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.dependencies import get_current_user

from app import models, schemas
from app.database import get_db

router = APIRouter(
    prefix="/orders",
    tags=["Orders"]
)

@router.post("/", response_model=schemas.OrderResponse, status_code=status.HTTP_201_CREATED)
def create_order(order_data: schemas.OrderCreate, db: Session = Depends(get_db)):
    if not order_data.items:
        raise HTTPException(status_code=400, detail="Cannot place an order with an empty cart.")

    total_amount = 0.0
    order_items_to_create = []

    for item in order_data.items:
        product = db.query(models.ProductModel).filter(models.ProductModel.id == item.product_id).first()
        if not product:
            raise HTTPException(status_code=404, detail=f"Product with ID {item.product_id} not found.")
        if product.stock < item.quantity:
            raise HTTPException(status_code=400, detail=f"Insufficient stock for product: {product.title}")

        product.stock -= item.quantity
        total_amount += product.price * item.quantity

        order_items_to_create.append(
            models.OrderItemModel(
                product_id=product.id,
                quantity=item.quantity,
                price=product.price
            )
        )

    new_order = models.OrderModel(
        customer_email=order_data.customer_email,
        first_name=order_data.first_name,
        last_name=order_data.last_name,
        phone=order_data.phone,
        address=order_data.address,
        city=order_data.city,
        postal_code=order_data.postal_code,
        country=order_data.country,
        total_amount=total_amount + 10.00,
        status="Pending"
    )
    db.add(new_order)
    db.commit()
    db.refresh(new_order)

    for order_item in order_items_to_create:
        order_item.order_id = new_order.id
        db.add(order_item)

    db.commit()
    db.refresh(new_order)
    return new_order

@router.get("/", response_model=List[schemas.OrderResponse])
def get_orders(db: Session = Depends(get_db)):
    orders = db.query(models.OrderModel).all()
    return orders

@router.patch("/{order_id}/status", response_model=schemas.OrderResponse)
def update_order_status(
    order_id: int, 
    status_update: schemas.OrderStatusUpdate, 
    db: Session = Depends(get_db)
):
    order = db.query(models.OrderModel).filter(models.OrderModel.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found.")
    
    order.status = status_update.status
    db.commit()
    db.refresh(order)
    return order

@router.get("/my-orders", response_model=List[schemas.OrderResponse])
def get_my_orders(
    current_user: models.UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    orders = db.query(models.OrderModel).filter(
        models.OrderModel.customer_email == current_user.email
    ).all()
    return orders