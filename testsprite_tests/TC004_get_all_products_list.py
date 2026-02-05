import requests

def test_get_all_products_list():
    base_url = "http://localhost:4200"
    endpoint = "/products"
    url = base_url + endpoint
    headers = {
        "Accept": "application/json"
    }
    try:
        response = requests.get(url, headers=headers, timeout=30)
        response.raise_for_status()
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"
    
    assert response.status_code == 200, f"Expected status code 200 but got {response.status_code}"
    try:
        products = response.json()
    except ValueError:
        assert False, "Response is not valid JSON"

    assert isinstance(products, list), "Products response should be a list"
    assert len(products) == 6, f"Expected 6 products but got {len(products)}"

    required_keys = {"id", "name", "description", "price", "image", "category"}

    for product in products:
        assert isinstance(product, dict), "Each product should be a dictionary"
        product_keys = set(product.keys())
        missing_keys = required_keys - product_keys
        assert not missing_keys, f"Product missing keys: {missing_keys}"

        # Validate types
        assert isinstance(product["id"], int), f"Product id should be int, got {type(product['id'])}"
        assert isinstance(product["name"], str) and product["name"], "Product name should be non-empty string"
        assert isinstance(product["description"], str), "Product description should be string"
        assert isinstance(product["price"], (int, float)), "Product price should be a number"
        assert isinstance(product["image"], str) and product["image"], "Product image should be non-empty string"
        assert isinstance(product["category"], str) and product["category"], "Product category should be non-empty string"

test_get_all_products_list()