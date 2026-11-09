import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app.main import app
from app.models import UserModel
from app.security import get_password_hash

# In-memory SQLite database for fast testing
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(autouse=True)
def setup_database():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

@pytest.fixture
def db_session():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

@pytest.fixture
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            db_session.close()
    
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture
def admin_token_headers(db_session):
    # 1. Create a test admin user in the database
    admin_email = "admin_test@midonline.com"
    hashed_pwd = get_password_hash("AdminPass123!")
    
    admin_user = UserModel(
        email=admin_email,
        hashed_password=hashed_pwd,
        role="admin",
        first_name="Test",
        last_name="Admin"
    )
    db_session.add(admin_user)
    db_session.commit()
    
    # 2. Simulate login to obtain the access token
    from fastapi.testclient import TestClient
    from app.main import app
    
    with TestClient(app) as client:
        response = client.post(
            "/auth/login",
            json={"email": admin_email, "password": "AdminPass123!"}
        )
        token = response.json()["access_token"]
        
    # 3. Return authorization headers ready for test requests
    return {"Authorization": f"Bearer {token}"}