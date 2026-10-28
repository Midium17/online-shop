from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app import models, schemas
from app.database import get_db
from app.dependencies import get_current_admin_user

router = APIRouter(
    prefix="/categories",
    tags=["Categories"]
)

# CREATE a category (Protected: Admin only)
@router.post("/", response_model=schemas.CategoryResponse, status_code=status.HTTP_201_CREATED)
def create_category(
    category: schemas.CategoryCreate, 
    db: Session = Depends(get_db),
    current_user: models.UserModel = Depends(get_current_admin_user)
):
    existing = db.query(models.CategoryModel).filter(models.CategoryModel.name == category.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Category name already exists.")
    
    db_category = models.CategoryModel(name=category.name, description=category.description)
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    return db_category

# READ all categories (Public)
@router.get("/", response_model=List[schemas.CategoryResponse])
def get_categories(db: Session = Depends(get_db)):
    return db.query(models.CategoryModel).all()

# DELETE a category (Protected: Admin only)
@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_category(
    category_id: int, 
    db: Session = Depends(get_db),
    current_user: models.UserModel = Depends(get_current_admin_user)
):
    category = db.query(models.CategoryModel).filter(models.CategoryModel.id == category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found.")
    db.delete(category)
    db.commit()
    return None