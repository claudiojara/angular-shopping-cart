import requests
import uuid

BASE_URL = "http://localhost:4200"
TIMEOUT = 30

def test_register_new_user_with_valid_data():
    url = f"{BASE_URL}/auth/signup"
    # Generate a unique email to avoid conflict on repeated test runs
    unique_email = f"testuser_{uuid.uuid4().hex}@example.com"
    payload = {
        "email": unique_email,
        "password": "ValidPass123"
    }
    headers = {
        "Content-Type": "application/json"
    }
    try:
        response = requests.post(url, json=payload, headers=headers, timeout=TIMEOUT)
        assert response.status_code == 200, f"Expected status code 200, got {response.status_code}"
        # Additional check can be to verify response content if any
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

test_register_new_user_with_valid_data()