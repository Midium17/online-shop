import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.seed import seed_database
from contextlib import asynccontextmanager
from app.database import engine, Base
from routers import products, categories, auth, orders

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables if they don't exist (or rely on Alembic)
    Base.metadata.create_all(bind=engine)
    # Run seed script on startup
    seed_database()
    yield

app = FastAPI(title="MidOnline E-Commerce API", lifespan=lifespan)

# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure static/uploads directory exists
os.makedirs("static/uploads", exist_ok=True)

# Mount the static files directory
app.mount("/static", StaticFiles(directory="static"), name="static")

# Include Routers
app.include_router(products.router)
app.include_router(categories.router)
app.include_router(auth.router)
app.include_router(orders.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to the E-Commerce API!"}