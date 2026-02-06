import requests

BASE_URL = "http://localhost:4200"
TIMEOUT = 30
HEADERS = {"Content-Type": "application/json"}


def test_TC008_update_cart_item_quantity():
    # Step 1: Get products to use a valid product_id
    try:
        products_resp = requests.get(f"{BASE_URL}/products", headers=HEADERS, timeout=TIMEOUT)
        assert products_resp.status_code == 200, f"Failed to get products: {products_resp.text}"
        products = products_resp.json()
        assert isinstance(products, list) and len(products) > 0, "Product list is empty"
        product_id = products[0]["id"]
    except Exception as e:
        raise AssertionError(f"Cannot fetch products for setup: {e}")

    # Step 2: Add the product to cart to be able to update it
    cart_item_id = None
    try:
        add_payload = {"product_id": product_id, "quantity": 1}
        add_resp = requests.post(f"{BASE_URL}/cart/items", json=add_payload, headers=HEADERS, timeout=TIMEOUT)
        assert add_resp.status_code == 201, f"Failed to add item to cart: {add_resp.text}"

        # Step 3: Update the quantity of the added cart item
        update_payload = {"quantity": 5}
        patch_resp = requests.patch(f"{BASE_URL}/cart/items/{product_id}", json=update_payload, headers=HEADERS, timeout=TIMEOUT)
        assert patch_resp.status_code == 200, f"Failed to update cart item quantity: {patch_resp.text}"

        # Verify the update by fetching the cart items and checking the quantity
        cart_resp = requests.get(f"{BASE_URL}/cart/items", headers=HEADERS, timeout=TIMEOUT)
        assert cart_resp.status_code == 200, f"Failed to get cart items: {cart_resp.text}"
        cart_items = cart_resp.json()
        updated_items = [item for item in cart_items if item["product_id"] == product_id]
        assert len(updated_items) == 1, "Updated cart item not found"
        assert updated_items[0]["quantity"] == 5, f"Quantity not updated properly: {updated_items[0]['quantity']}"

        # Step 4: Test update on non-existing cart item - expect 404
        non_existing_product_id = 999999999
        patch_resp_not_found = requests.patch(
            f"{BASE_URL}/cart/items/{non_existing_product_id}",
            json={"quantity": 2},
            headers=HEADERS,
            timeout=TIMEOUT,
        )
        assert patch_resp_not_found.status_code == 404, "Expected 404 for updating non-existing cart item"
    finally:
        # Clean up: Remove the added cart item
        requests.delete(f"{BASE_URL}/cart/items/{product_id}", headers=HEADERS, timeout=TIMEOUT)


test_TC008_update_cart_item_quantity()