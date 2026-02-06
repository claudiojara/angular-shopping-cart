import requests

BASE_URL = "http://localhost:4200"
TIMEOUT = 30
HEADERS = {"Content-Type": "application/json"}

def test_remove_item_from_cart():
    product_id = None
    try:
        # Step 1: Get list of products to select a product_id
        products_resp = requests.get(f"{BASE_URL}/products", headers=HEADERS, timeout=TIMEOUT)
        assert products_resp.status_code == 200, f"Failed to get products list: {products_resp.text}"
        # Check if response content is not empty
        if not products_resp.content or products_resp.content.strip() == b'':
            assert False, "Products response body is empty"
        try:
            products = products_resp.json()
        except Exception as e:
            assert False, f"Failed to parse products JSON response: {e}"
        assert isinstance(products, list), "Products response is not a list"
        assert len(products) > 0, "No products available to add to cart"
        product_id = products[0].get("id")
        assert isinstance(product_id, int), "Product ID is not a valid integer"

        # Step 2: Add the selected product to the cart (quantity 1)
        add_payload = {"product_id": product_id, "quantity": 1}
        add_resp = requests.post(f"{BASE_URL}/cart/items", json=add_payload, headers=HEADERS, timeout=TIMEOUT)
        assert add_resp.status_code == 201, f"Failed to add item to cart: {add_resp.text}"

        # Step 3: Remove the item from the cart
        remove_resp = requests.delete(f"{BASE_URL}/cart/items/{product_id}", headers=HEADERS, timeout=TIMEOUT)
        assert remove_resp.status_code == 200, f"Failed to remove item from cart: {remove_resp.text}"

        # Step 4: Attempt to remove same item again (should return 404)
        remove_again_resp = requests.delete(f"{BASE_URL}/cart/items/{product_id}", headers=HEADERS, timeout=TIMEOUT)
        assert remove_again_resp.status_code == 404, f"Expected 404 when removing non-existing item but got {remove_again_resp.status_code}"

    finally:
        if product_id is not None:
            # Cleanup: Ensure the item is removed from the cart if still present
            requests.delete(f"{BASE_URL}/cart/items/{product_id}", headers=HEADERS, timeout=TIMEOUT)

test_remove_item_from_cart()
