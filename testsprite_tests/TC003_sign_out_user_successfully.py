import requests
import uuid

BASE_URL = "http://localhost:3000"
TIMEOUT = 30

def test_sign_out_user_successfully():
    # Create a unique user to sign in and then sign out
    email = f"testuser_{uuid.uuid4()}@example.com"
    password = "TestPass123"

    signup_url = f"{BASE_URL}/auth/signup"
    signin_url = f"{BASE_URL}/auth/signin"
    signout_url = f"{BASE_URL}/auth/signout"

    headers = {"Content-Type": "application/json"}

    try:
        # Register user
        signup_resp = requests.post(
            signup_url,
            json={"email": email, "password": password},
            headers=headers,
            timeout=TIMEOUT
        )
        assert signup_resp.status_code == 200, f"Signup failed: {signup_resp.text}"

        # Sign in user
        signin_resp = requests.post(
            signin_url,
            json={"email": email, "password": password},
            headers=headers,
            timeout=TIMEOUT
        )
        assert signin_resp.status_code == 200, f"Signin failed: {signin_resp.text}"

        # Extract auth token/cookie if any for sign out authorization (if needed)
        # Here assuming auth token comes back in JSON under 'token' or similar
        # As PRD doesn't specify, we check if token available, else signout without auth

        token = None
        try:
            token = signin_resp.json().get("token")
        except Exception:
            token = None

        signout_headers = headers.copy()
        if token:
            signout_headers["Authorization"] = f"Bearer {token}"

        # Sign out user
        signout_resp = requests.post(
            signout_url,
            headers=signout_headers,
            timeout=TIMEOUT
        )
        assert signout_resp.status_code == 200, f"Signout failed: {signout_resp.text}"

    finally:
        # No cleanup endpoint for user removal provided in PRD
        pass

test_sign_out_user_successfully()
