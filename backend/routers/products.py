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
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from typing import List, Union
import shutil
import os

router = APIRouter(prefix="/products", tags=["Products"])

UPLOAD_DIR = "static/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/upload-image/")
def upload_images(
    files: Union[List[UploadFile], UploadFile] = File(...),
    admin: models.UserModel = Depends(get_current_admin_user)
):
    # Ensure it's treated as a list even if a single file is uploaded
    if not isinstance(files, list):
        files = [files]

    uploaded_urls = []
    for file in files:
        file_path = os.path.join(UPLOAD_DIR, file.filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        uploaded_urls.append(f"http://127.0.0.1:8000/{file_path}")
    
    return {
        "image_url": uploaded_urls[0] if uploaded_urls else "",
        "image_urls": uploaded_urls
    }

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

@router.put("/{product_id}", response_model=schemas.ProductResponse)
def update_product(
    product_id: int, 
    product_update: schemas.ProductCreate, 
    db: Session = Depends(get_db), 
    admin: models.UserModel = Depends(get_current_admin_user)
):
    db_product = db.query(models.ProductModel).filter(models.ProductModel.id == product_id).first()
    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    for key, value in product_update.dict().items():
        setattr(db_product, key, value)
        
    db.commit()
    db.refresh(db_product)
    return db_product