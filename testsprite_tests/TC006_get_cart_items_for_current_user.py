import requests
import uuid

BASE_URL = "http://localhost:4200"
TIMEOUT = 30

def test_get_cart_items_for_current_user():
    # Setup: Register and sign in a new user, add a product to cart, then test getting cart items
    email = f"testuser_{uuid.uuid4().hex}@example.com"
    password = "StrongPass123"
    headers = {"Content-Type": "application/json"}

    session = requests.Session()

    try:
        # Register new user
        signup_resp = session.post(f"{BASE_URL}/auth/signup",
                                   json={"email": email, "password": password},
                                   headers=headers,
                                   timeout=TIMEOUT)
        assert signup_resp.status_code == 200, "Signup failed"

        # Sign in user
        signin_resp = session.post(f"{BASE_URL}/auth/signin",
                                   json={"email": email, "password": password},
                                   headers=headers,
                                   timeout=TIMEOUT)
        assert signin_resp.status_code == 200, "Signin failed"

        # Get all products to pick one for cart addition
        products_resp = session.get(f"{BASE_URL}/products", timeout=TIMEOUT)
        assert products_resp.status_code == 200, "Failed to get products"
        products = products_resp.json()
        assert isinstance(products, list) and len(products) > 0, "Products list empty"
        product = products[0]
        product_id = product.get("id")
        assert isinstance(product_id, int), "Invalid product id"

        # Add product to cart
        add_cart_resp = session.post(f"{BASE_URL}/cart/items",
                                     json={"product_id": product_id, "quantity": 2},
                                     headers=headers,
                                     timeout=TIMEOUT)
        assert add_cart_resp.status_code == 201, "Failed to add item to cart"

        # GET /cart/items for current user
        cart_resp = session.get(f"{BASE_URL}/cart/items", timeout=TIMEOUT)
        assert cart_resp.status_code == 200, "Failed to get cart items"
        cart_items = cart_resp.json()
        assert isinstance(cart_items, list), "Cart items response not a list"

        # Validate the added product is in the cart with correct quantity
        matched_items = [item for item in cart_items if item.get("product_id") == product_id]
        assert len(matched_items) == 1, "Added product not found in cart items"
        item = matched_items[0]
        assert item.get("quantity") == 2, "Quantity in cart does not match added quantity"
        assert "id" in item and isinstance(item["id"], int), "Cart item id missing or invalid"
        assert "user_id" in item and isinstance(item["user_id"], str) and item["user_id"], "Cart item user_id missing or invalid"
        assert "created_at" in item and isinstance(item["created_at"], str), "Cart item created_at missing or invalid"
        assert "updated_at" in item and isinstance(item["updated_at"], str), "Cart item updated_at missing or invalid"
    finally:
        # Cleanup: Clear the cart and sign out
        session.delete(f"{BASE_URL}/cart/items", timeout=TIMEOUT)
        session.post(f"{BASE_URL}/auth/signout", timeout=TIMEOUT)
        session.close()

test_get_cart_items_for_current_user()