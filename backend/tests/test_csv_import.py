def test_import_products_csv(client, admin_token_headers):
    csv_content = (
        "title,description,price,stock,image_url\n"
        "Test Item 1,A great test product,19.99,10,https://example.com/img1.jpg\n"
        "Test Item 2,Another test product,29.99,5,https://example.com/img2.jpg"
    )
    
    response = client.post(
        "/products/import-csv",
        files={"file": ("products.csv", csv_content, "text/csv")},
        headers=admin_token_headers
    )
    
    assert response.status_code == 201
    data = response.json()
    assert "Successfully imported 2 products" in data["message"]

    def test_export_products_csv(client, admin_token_headers):
    # First, create a sample product to ensure data exists
    client.post(
        "/products/",
        json={
            "title": "Export Test Item",
            "description": "Testing CSV export functionality",
            "price": 49.99,
            "stock": 15,
            "image_url": "https://example.com/export.jpg"
        },
        headers=admin_token_headers
    )
    
    # Request the CSV export
    response = client.get("/products/export-csv", headers=admin_token_headers)
    
    assert response.status_code == 200
    assert response.headers["content-type"] == "text/csv; charset=utf-8"
    assert "attachment; filename=products_export.csv" in response.headers["content-disposition"]
    
    # Verify CSV content contains headers and data
    csv_data = response.text
    assert "id,title,description,price,stock,image_url" in csv_data
    assert "Export Test Item" in csv_data
    assert "49.99" in csv_data