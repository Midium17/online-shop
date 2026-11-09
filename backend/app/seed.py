from sqlalchemy.orm import Session
from app import models
from app.security import get_password_hash
from app.database import SessionLocal

def seed_database():
    db: Session = SessionLocal()
    try:
        # 1. Seed Default Admin User
        admin_email = "admin@shop.com"
        existing_admin = db.query(models.UserModel).filter(models.UserModel.email == admin_email).first()
        
        if not existing_admin:
            admin_user = models.UserModel(
                email=admin_email,
                hashed_password=get_password_hash("admin123"),
                role="admin",
                first_name="System",
                last_name="Administrator"
            )
            db.add(admin_user)
            print("Seeding default admin user: admin@midonline.com")

        # 2. Seed Default Test Products (if table is empty)
        product_count = db.query(models.ProductModel).count()
        if product_count == 0:
            sample_products = [
                models.ProductModel(
                    title="Classic Black Hoodie",
                    description="Comfortable organic cotton fleece hoodie for everyday wear.",
                    price=45.99,
                    stock=50,
                    image_url="https://images.unsplash.com/photo-1556905055-8f358a7a47b2"
                ),
                models.ProductModel(
                    title="Minimalist Leather Watch",
                    description="Water-resistant analog watch with genuine leather strap.",
                    price=120.00,
                    stock=25,
                    image_url="https://images.unsplash.com/photo-1523275335684-37898b6baf30"
                )
            ]
            db.add_all(sample_products)
            print("Seeding default test products...")

        db.commit()
    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
    finally:
        db.close()