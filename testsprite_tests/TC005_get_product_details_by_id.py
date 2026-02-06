import requests

BASE_URL = "http://localhost:4200"
TIMEOUT = 30

def safe_json_response(response):
    try:
        return response.json()
    except requests.exceptions.JSONDecodeError:
        assert False, f"Response from {response.url} is not valid JSON or is empty"


def test_get_product_details_by_id():
    try:
        # Step 1: Get the list of all products to select a valid product ID
        resp_all = requests.get(f"{BASE_URL}/products", timeout=TIMEOUT)
        assert resp_all.status_code == 200, f"Expected 200 OK from /products, got {resp_all.status_code}"
        products = safe_json_response(resp_all)
        assert isinstance(products, list) and len(products) > 0, "Expected non-empty products list"

        valid_product = products[0]
        valid_id = valid_product.get("id")
        assert isinstance(valid_id, int), "Product id should be an integer"

        # Step 2: Get product details by valid ID
        resp_valid = requests.get(f"{BASE_URL}/products/{valid_id}", timeout=TIMEOUT)
        assert resp_valid.status_code == 200, f"Expected 200 OK for valid product ID, got {resp_valid.status_code}"
        product_details = safe_json_response(resp_valid)
        # Validate returned product matches the ID and details
        assert product_details.get("id") == valid_id, "Returned product ID does not match requested ID"
        assert "name" in product_details and isinstance(product_details["name"], str), "Product name missing or invalid"
        assert "description" in product_details and isinstance(product_details["description"], str), "Product description missing or invalid"
        assert "price" in product_details and (isinstance(product_details["price"], float) or isinstance(product_details["price"], int)), "Product price missing or invalid"
        assert "image" in product_details and isinstance(product_details["image"], str), "Product image missing or invalid"
        assert "category" in product_details and isinstance(product_details["category"], str), "Product category missing or invalid"

        # Step 3: Get product details by invalid ID - use an ID that's clearly not valid
        invalid_id = -999999
        resp_invalid = requests.get(f"{BASE_URL}/products/{invalid_id}", timeout=TIMEOUT)
        assert resp_invalid.status_code == 404, f"Expected 404 Not Found for invalid product ID, got {resp_invalid.status_code}"

    except (requests.RequestException, AssertionError) as e:
        raise AssertionError(f"Test failed: {e}")


test_get_product_details_by_id()
