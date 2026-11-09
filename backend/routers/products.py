import os
import shutil
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from typing import List, Union
from app.permissions import Permission
from app import models, schemas
from app.database import get_db
from app.dependencies import require_permission

router = APIRouter(
    prefix="/products",
    tags=["Products"]
)

UPLOAD_DIR = "static/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# 0. IMAGE UPLOAD ENDPOINT (Protected: Requires Inventory Create permission)
@router.post("/upload-image/")
def upload_images(
    files: Union[List[UploadFile], UploadFile] = File(...),
    user: models.UserModel = Depends(require_permission(Permission.INVENTORY_CREATE))
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

# 1. CREATE a new product (Protected: Requires inventory:create permission)
@router.post("/", response_model=schemas.ProductResponse, status_code=status.HTTP_201_CREATED)
def create_product(
    product: schemas.ProductCreate, 
    db: Session = Depends(get_db), 
    user: models.UserModel = Depends(require_permission(Permission.INVENTORY_CREATE))
):
    product_data = product.dict()
    
    if "image_urls" in product_data:
        image_urls = product_data.pop("image_urls")
        if not product_data.get("image_url") and image_urls:
            product_data["image_url"] = image_urls[0]

    product_data.pop("sizes", None)
    product_data.pop("colors", None)

    db_product = models.ProductModel(**product_data)
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

# 4. UPDATE a product by ID (Protected: Requires inventory:update permission)
@router.put("/{product_id}", response_model=schemas.ProductResponse)
def update_product(
    product_id: int, 
    product_update: schemas.ProductCreate, 
    db: Session = Depends(get_db), 
    user: models.UserModel = Depends(require_permission(Permission.INVENTORY_UPDATE))
):
    db_product = db.query(models.ProductModel).filter(models.ProductModel.id == product_id).first()
    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    update_data = product_update.dict()
    update_data.pop("sizes", None)
    update_data.pop("colors", None)

    for key, value in update_data.items():
        setattr(db_product, key, value)
        
    db.commit()
    db.refresh(db_product)
    return db_product

# 5. DELETE a product by ID (Protected: Requires inventory:delete permission - Admin only)
@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(
    product_id: int, 
    db: Session = Depends(get_db),
    user: models.UserModel = Depends(require_permission(Permission.INVENTORY_DELETE))
):
    product = db.query(models.ProductModel).filter(models.ProductModel.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    db.delete(product)
    db.commit()
    return None