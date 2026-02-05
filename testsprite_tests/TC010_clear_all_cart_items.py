import requests
import uuid

BASE_URL = "http://localhost:4200"
TIMEOUT = 30

def test_clear_all_cart_items():
    session = requests.Session()
    email = f"testuser_{uuid.uuid4().hex[:8]}@example.com"
    password = "TestPass123!"

    # Sign up the user
    signup_payload = {"email": email, "password": password}
    signup_resp = session.post(f"{BASE_URL}/auth/signup", json=signup_payload, timeout=TIMEOUT)
    assert signup_resp.status_code == 200 or signup_resp.status_code == 201, f"Signup failed: {signup_resp.text}"

    # Sign in the user
    signin_payload = {"email": email, "password": password}
    signin_resp = session.post(f"{BASE_URL}/auth/signin", json=signin_payload, timeout=TIMEOUT)
    assert signin_resp.status_code == 200, f"Signin failed: {signin_resp.text}"

    # Add an item to the cart first to ensure cart is not empty
    # Fetch products to get a valid product_id
    products_resp = session.get(f"{BASE_URL}/products", timeout=TIMEOUT)
    assert products_resp.status_code == 200, f"Failed to get products: {products_resp.text}"
    products = products_resp.json()
    assert isinstance(products, list) and len(products) > 0, "Products list is empty or invalid"
    product_id = products[0]["id"]

    add_item_payload = {"product_id": product_id, "quantity": 1}
    add_item_resp = session.post(f"{BASE_URL}/cart/items", json=add_item_payload, timeout=TIMEOUT)
    assert add_item_resp.status_code == 201, f"Failed to add item to cart: {add_item_resp.text}"

    try:
        # Delete all cart items
        delete_resp = session.delete(f"{BASE_URL}/cart/items", timeout=TIMEOUT)
        assert delete_resp.status_code == 200, f"Failed to clear cart items: {delete_resp.text}"

        # Verify cart is empty
        cart_resp = session.get(f"{BASE_URL}/cart/items", timeout=TIMEOUT)
        assert cart_resp.status_code == 200, f"Failed to get cart items after clearing: {cart_resp.text}"
        cart_items = cart_resp.json()
        assert isinstance(cart_items, list), "Cart items response is not a list"
        assert len(cart_items) == 0, "Cart is not empty after clearing"
    finally:
        # Clean up: sign out user
        session.post(f"{BASE_URL}/auth/signout", timeout=TIMEOUT)

test_clear_all_cart_items()