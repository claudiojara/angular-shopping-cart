import requests

BASE_URL = "http://localhost:4200"

def test_signin_user_with_correct_credentials():
    signin_url = f"{BASE_URL}/auth/signin"
    # Use a valid user to test sign in
    valid_email = "testuser@example.com"
    valid_password = "validPass123"

    payload = {
        "email": valid_email,
        "password": valid_password
    }
    headers = {
        "Content-Type": "application/json"
    }

    try:
        response = requests.post(signin_url, json=payload, headers=headers, timeout=30)
        response.raise_for_status()
    except requests.exceptions.RequestException as e:
        assert False, f"HTTP Request failed: {e}"

    assert response.status_code == 200, f"Expected status code 200, got {response.status_code}"
    # Optionally check for token or success message in response body if exists
    try:
        data = response.json()
    except ValueError:
        assert False, "Response is not valid JSON"

    assert "access_token" in data or "token" in data or len(data) > 0, "Response JSON does not contain expected auth token or data"

test_signin_user_with_correct_credentials()