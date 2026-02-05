import requests
import uuid

BASE_URL = "http://localhost:4200"
TIMEOUT = 30

def test_add_item_to_cart_with_valid_input():
    headers = {
        "Content-Type": "application/json"
    }
    product_id = None
    try:
        # Step 1: Get all products to obtain a valid product_id
        products_response = requests.get(f"{BASE_URL}/products", headers=headers, timeout=TIMEOUT)
        assert products_response.status_code == 200, f"Expected 200 OK from /products, got {products_response.status_code}"
        products = products_response.json()
        assert isinstance(products, list) and len(products) > 0, "Products list should not be empty"
        product_id = products[0]['id']

        # Step 2: Add item to cart with valid product_id and quantity
        add_payload = {
            "product_id": product_id,
            "quantity": 1
        }
        add_response = requests.post(f"{BASE_URL}/cart/items", headers=headers, json=add_payload, timeout=TIMEOUT)
        assert add_response.status_code == 201, f"Expected 201 Created from POST /cart/items, got {add_response.status_code}"

        # Step 3: Verify the item exists in cart by retrieving cart items
        cart_response = requests.get(f"{BASE_URL}/cart/items", headers=headers, timeout=TIMEOUT)
        assert cart_response.status_code == 200, f"Expected 200 OK from GET /cart/items, got {cart_response.status_code}"
        cart_items = cart_response.json()
        assert any(item.get('product_id') == product_id and item.get('quantity') == 1 for item in cart_items), "Added item not found in cart items"

    finally:
        # Clean up - remove the added item if it was created
        if product_id is not None:
            requests.delete(f"{BASE_URL}/cart/items/{product_id}", headers=headers, timeout=TIMEOUT)

test_add_item_to_cart_with_valid_input()
