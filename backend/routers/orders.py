from fastapi import APIRouter, Depends, HTTPException, status, Response
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
import io
import datetime
from sqlalchemy.orm import Session
from typing import List, Optional
from app.dependencies import get_current_user
from app.permissions import Permission
from app.dependencies import require_permission

from app import models, schemas
from app.database import get_db

router = APIRouter(
    prefix="/orders",
    tags=["Orders"]
)

# Optional user dependency helper to allow guests or logged-in users
def get_optional_current_user(db: Session = Depends(get_db)) -> Optional[models.UserModel]:
    try:
        from fastapi.security import OAuth2PasswordBearer
        # If token exists, resolve current user, else return None
        return None # Handled via token dependency if configured, or fallback below
    except Exception:
        return None

@router.post("/", response_model=schemas.OrderResponse, status_code=status.HTTP_201_CREATED)
def create_order(
    order_data: schemas.OrderCreate, 
    db: Session = Depends(get_db),
    current_user: Optional[models.UserModel] = Depends(get_current_user)
):
    if not order_data.items:
        raise HTTPException(status_code=400, detail="Cannot place an order with an empty cart.")

    # If user is logged in, auto-save/sync their submitted shipping details to their profile
    if current_user:
        current_user.first_name = order_data.first_name or current_user.first_name
        current_user.last_name = order_data.last_name or current_user.last_name
        current_user.phone = order_data.phone or current_user.phone
        current_user.address = order_data.address or current_user.address
        current_user.city = order_data.city or current_user.city
        current_user.postal_code = order_data.postal_code or current_user.postal_code
        current_user.country = order_data.country or current_user.country
        db.commit()

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
                product_title=product.title,  # <--- Automatically store product title for order history & invoices
                quantity=item.quantity,
                price=product.price
            )
        )

    new_order = models.OrderModel(
        user_id=current_user.id if current_user else None,
        customer_email=order_data.customer_email,
        first_name=order_data.first_name,
        last_name=order_data.last_name,
        phone=order_data.phone,
        address=order_data.address,
        city=order_data.city,
        postal_code=order_data.postal_code,
        country=order_data.country,
        total_amount=total_amount + 10.00, # Including delivery or shipping fee
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
def get_orders(
    db: Session = Depends(get_db),
    user: models.UserModel = Depends(require_permission(Permission.ORDERS_READ))
):
    """Requires 'orders:read' permission (Admin & Order Manager)"""
    orders = db.query(models.OrderModel).all()
    return orders

@router.patch("/{order_id}/status", response_model=schemas.OrderResponse)
def update_order_status(
    order_id: int, 
    status_update: schemas.OrderStatusUpdate, 
    db: Session = Depends(get_db),
    user: models.UserModel = Depends(require_permission(Permission.ORDERS_UPDATE_STATUS))
):
    """Requires 'orders:update_status' permission (Admin & Order Manager)"""
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
    """Retrieve all orders placed by the currently logged-in user safely."""
    try:
        orders = db.query(models.OrderModel).filter(
            (models.OrderModel.user_id == current_user.id) | 
            (models.OrderModel.customer_email == current_user.email)
        ).order_by(models.OrderModel.created_at.desc() if hasattr(models.OrderModel, 'created_at') else models.OrderModel.id.desc()).all()
        
        return orders
    except Exception as e:
        print(f"Error fetching my-orders: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.patch("/{order_id}/cancel", response_model=schemas.OrderResponse)
def cancel_my_order(
    order_id: int,
    current_user: models.UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Allow a logged-in customer to cancel their own pending order."""
    order = db.query(models.OrderModel).filter(
        models.OrderModel.id == order_id,
        (models.OrderModel.user_id == current_user.id) | (models.OrderModel.customer_email == current_user.email)
    ).first()
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found.")
    
    if order.status.lower() != "pending":
        raise HTTPException(status_code=400, detail="Only pending orders can be cancelled.")
    
    order.status = "Cancelled"
    db.commit()
    db.refresh(order)
    return order

@router.get("/{order_id}/invoice")
def download_order_invoice(
    order_id: int,
    current_user: models.UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Generate and stream a safe PDF invoice for a specific customer order."""
    order = db.query(models.OrderModel).filter(
        models.OrderModel.id == order_id,
        (models.OrderModel.user_id == current_user.id) | (models.OrderModel.customer_email == current_user.email)
    ).first()

    if not order:
        raise HTTPException(status_code=404, detail="Order not found.")

    try:
        buffer = io.BytesIO()
        p = canvas.Canvas(buffer, pagesize=letter)
        width, height = letter

        # Header
        p.setFont("Helvetica-Bold", 20)
        p.drawString(50, height - 50, "MidOnline Invoice")
        
        p.setFont("Helvetica", 10)
        p.drawString(50, height - 70, f"Order ID: #{order.id}")
        
        date_str = order.created_at.strftime('%Y-%m-%d %H:%M') if getattr(order, 'created_at', None) else 'N/A'
        p.drawString(50, height - 85, f"Date: {date_str}")
        p.drawString(50, height - 100, f"Status: {order.status or 'Pending'}")

        # Shipping Details
        p.setFont("Helvetica-Bold", 12)
        p.drawString(50, height - 135, "Shipping Address:")
        p.setFont("Helvetica", 10)
        p.drawString(50, height - 150, f"{order.first_name or ''} {order.last_name or ''}")
        p.drawString(50, height - 165, f"{order.address or 'N/A'}, {order.city or ''}")
        p.drawString(50, height - 180, f"{order.country or ''} (Phone: {order.phone or 'N/A'})")

        # Table Header
        p.setFont("Helvetica-Bold", 10)
        p.drawString(50, height - 220, "Product")
        p.drawString(300, height - 220, "Qty")
        p.drawString(380, height - 220, "Price")
        p.drawString(460, height - 220, "Total")
        p.line(50, height - 225, 550, height - 225)

        # Table Items
        y = height - 245
        p.setFont("Helvetica", 10)
        for item in order.items:
            # Safely resolve title and price
            title = getattr(item, 'title', None) or getattr(item, 'product_title', None) or f"Product #{item.product_id}"
            price = float(getattr(item, 'price', 0.0) or 0.0)
            qty = int(getattr(item, 'quantity', 1) or 1)
            
            p.drawString(50, y, str(title)[:40])
            p.drawString(300, y, str(qty))
            p.drawString(380, y, f"${price:.2f}")
            p.drawString(460, y, f"${(price * qty):.2f}")
            y -= 20
            
            # Prevent overflow if too many items
            if y < 50:
                p.showPage()
                y = height - 50

        # Total Amount
        p.line(50, y - 5, 550, y - 5)
        p.setFont("Helvetica-Bold", 12)
        total_amt = float(getattr(order, 'total_amount', 0.0) or 0.0)
        p.drawString(380, y - 25, "Total Amount:")
        p.drawString(460, y - 25, f"${total_amt:.2f}")

        p.showPage()
        p.save()
        buffer.seek(0)

        return Response(
            buffer.getvalue(),
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename=invoice_order_{order.id}.pdf"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PDF Generation Error: {str(e)}")