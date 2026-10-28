import os
import uuid
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from typing import List

from app import models, schemas
from app.database import get_db
from app.dependencies import get_current_admin_user

router = APIRouter(
    prefix="/products",
    tags=["Products"]
)

# IMAGE UPLOAD ENDPOINT (Protected: Admin only)
@router.post("/upload-image/", status_code=status.HTTP_201_CREATED)
async def upload_product_image(
    file: UploadFile = File(...),
    current_user: models.UserModel = Depends(get_current_admin_user)
):
    # Validate file type
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image.")

    # Generate a unique filename using UUID to prevent naming collisions
    file_extension = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    file_path = os.path.join("static/uploads", unique_filename)

    # Save file to disk
    with open(file_path, "wb") as buffer:
        buffer.write(await file.read())

    # Return full static URL for the image
    image_url = f"http://127.0.0.1:8000/static/uploads/{unique_filename}"
    return {"image_url": image_url}

# ... keep existing create_product, get_products, get_product, delete_product routes below

# 1. CREATE a new product (Protected: Admin only)
@router.post("/", response_model=schemas.ProductResponse, status_code=status.HTTP_201_CREATED)
def create_product(
    product: schemas.ProductCreate, 
    db: Session = Depends(get_db),
    current_user: models.UserModel = Depends(get_current_admin_user)
):
    db_product = models.ProductModel(**product.dict())
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product

# 2. READ all products (Public)
@router.get("/", response_model=List[schemas.ProductResponse])
def get_products(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    products = db.query(models.ProductModel).offset(skip).limit(limit).all()
    return products

# 3. READ a single product by ID (Public)
@router.get("/{product_id}", response_model=schemas.ProductResponse)
def get_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(models.ProductModel).filter(models.ProductModel.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

# 4. DELETE a product by ID (Protected: Admin only)
@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(
    product_id: int, 
    db: Session = Depends(get_db),
    current_user: models.UserModel = Depends(get_current_admin_user)
):
    product = db.query(models.ProductModel).filter(models.ProductModel.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    db.delete(product)
    db.commit()
    return None