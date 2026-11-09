def test_register_user(client):
    response = client.post(
        "/auth/register",
        json={
            "email": "testuser@example.com",
            "password": "SecurePassword123!",
            "first_name": "Test",
            "last_name": "User",
            "role": "customer"
        }
    )
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "testuser@example.com"
    assert data["role"] == "customer"
    assert "id" in data

def test_login_and_get_token(client):
    # Register first
    client.post(
        "/auth/register",
        json={
            "email": "loginuser@example.com",
            "password": "SecurePassword123!",
            "first_name": "Login",
            "last_name": "User",
            "role": "customer"
        }
    )
    
    # Attempt login
    response = client.post(
        "/auth/login",
        json={
            "email": "loginuser@example.com",
            "password": "SecurePassword123!"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"

def test_unauthorized_product_creation(client):
    # Trying to create a product without an auth token should fail (401 or 403)
    response = client.post(
        "/products/",
        json={
            "title": "Test Hoodie",
            "price": 29.99,
            "stock": 10
        }
    )
    assert response.status_code in [401, 403]

def test_get_all_customers_as_admin(client, admin_token_headers):
    response = client.get("/auth/admin/customers", headers=admin_token_headers)
    
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_get_all_customers_unauthorized(client):
    # Requesting without headers should fail with 401 or 403
    response = client.get("/auth/admin/customers")
    assert response.status_code in [401, 403]