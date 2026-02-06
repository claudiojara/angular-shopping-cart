#!/bin/bash

# Test Azure Functions webhook locally
# This simulates a Flow webhook POST request

echo "Testing Azure Functions webhook at http://localhost:7071/api/flow-webhook"
echo ""

# Test 1: Invalid signature (should return 401)
echo "Test 1: Invalid signature"
curl -X POST http://localhost:7071/api/flow-webhook \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "token=TEST123&commerceOrder=1&status=2&s=invalidsignature"
echo ""
echo ""

# Test 2: Missing parameters (should return 400)
echo "Test 2: Missing parameters"
curl -X POST http://localhost:7071/api/flow-webhook \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "token=TEST123"
echo ""
echo ""

# Test 3: Valid signature with success status (status=2)
# Flow signature format: concatenate sorted keys+values WITHOUT separators
# Example: "commerceOrder1status2tokenTEST123"
echo "Test 3: Valid signature with successful payment (status=2)"
# String to sign (alphabetically sorted): commerceOrder + 1 + status + 2 + token + TEST123
SIGNATURE=$(echo -n "commerceOrder1status2tokenTEST123" | openssl dgst -sha256 -hmac "f7a9d57a82f11c393ab3310e2d833f182c2b7d52" | cut -d' ' -f2)
echo "Calculated signature: $SIGNATURE"
curl -X POST http://localhost:7071/api/flow-webhook \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "token=TEST123&commerceOrder=1&status=2&s=$SIGNATURE"
echo ""
echo ""

echo "Tests complete!"
