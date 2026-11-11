# 🛍️ MidOnline - Full-Stack E-Commerce Web Application

MidOnline is a modern, feature-rich full-stack e-commerce platform built with a **FastAPI** backend and a **React.js** frontend. It supports robust role-based access control (RBAC), database migrations with Alembic, automated testing, CSV bulk operations, live order tracking, customer profile management, and ReportLab PDF invoice generation.

---

## 🚀 Key Features

### 🛒 Storefront & Shopping Experience
- **Interactive Product Catalog**: Browse products with live filtering, sorting, pagination, and multi-image quick-view galleries.
- **Cart & Checkout Flow**: Seamless cart management, automatic user profile and shipping address pre-filling, and secure order placement with live stock reduction.
- **Customer Account Dashboard**: 
  - Live order tracking timelines (Placed ➔ Processing ➔ Delivered).
  - Profile and shipping address management.
  - Order cancellation for pending orders.
  - Quick **Reorder** functionality to instantly add past order items back into the cart.
  - Downloadable PDF invoices generated via ReportLab.

### 🛠️ Admin Dashboard & Management
- **Product Management**: Complete CRUD operations, local image file uploads, and bulk **CSV Import/Export**.
- **Category Management**: Full CRUD support for product categories.
- **Customer & Order Management**: Review customer profiles, examine detailed order history breakdowns, and manage order statuses.

### ⚙️ Backend & DevOps
- **FastAPI Backend**: Modern SQLAlchemy 2.0 ORM, Pydantic data validation schemas, and SQLite database with Alembic migration support.
- **Automated Testing**: Comprehensive `pytest` test suites integrated with GitHub Actions CI workflows.

---

## 🛠️ Tech Stack

- **Backend**: Python, FastAPI, SQLAlchemy, Alembic, Pydantic, ReportLab, SQLite, Pytest
- **Frontend**: React.js, React Router, Tailwind CSS, Lucide Icons, Axios
- **DevOps & CI/CD**: Git, GitHub Actions, Docker Compose

---

## 📦 Project Structure

```text
online-shop/
├── backend/
│   ├── alembic/              # Database migration scripts
│   ├── routers/              # FastAPI routers (auth, products, categories, orders)
│   ├── static/uploads/       # Local product image storage
│   ├── tests/                # Pytest automated test suites
│   ├── main.py               # FastAPI application entry point
│   ├── models.py             # SQLAlchemy database models
│   ├── schemas.py            # Pydantic data validation schemas
│   └── seed.py               # Database seeding script
└── frontend/
    ├── src/
    │   ├── components/       # Reusable UI components
    │   ├── pages/            # Storefront, Checkout, Account, Admin Dashboard
    │   ├── services/         # Axios API service configuration
    │   ├── App.jsx           # Main React router and layout container
    │   └── main.jsx          # React entry point
    └── package.json          # Frontend dependencies & scripts

⚙️ Getting Started & Installation
Prerequisites

    Python 3.10+

    Node.js & npm

1. Backend Setup

Navigate to the backend directory, create a virtual environment, install dependencies, and run the server:
Bash

cd backend
python -m venv venv
source venv/bin/activate  # On Windows use: venv\Scripts\activate
pip install -r requirements.txt

# Run database migrations and seed data
alembic upgrade head
python seed.py

# Start FastAPI development server
uvicorn main:app --reload --port 8000

2. Frontend Setup

Open a new terminal window, navigate to the frontend directory, install dependencies, and start the development server:
Bash

cd frontend
npm install
npm run dev

The application will be accessible at http://localhost:5173 (Frontend) and http://localhost:8000 (Backend API).
🧪 Running Tests

To run the backend automated test suite using pytest:
Bash

cd backend
source venv/bin/activate
pytest




