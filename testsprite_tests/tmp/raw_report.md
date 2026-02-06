
# TestSprite AI Testing Report(MCP)

---

## 1️⃣ Document Metadata
- **Project Name:** shopping-cart
- **Date:** 2026-02-04
- **Prepared by:** TestSprite AI Team

---

## 2️⃣ Requirement Validation Summary

#### Test TC001 User Registration Success
- **Test Code:** [TC001_User_Registration_Success.py](./TC001_User_Registration_Success.py)
- **Test Error:** Registration verification result:
- Inputs used: email=testuser+001@example.com, password=password123, confirm password=password123.
- Actions performed: navigated to /register, filled email and both password fields, attempted submission via click (1) and Enter (1).
- Observed outcome: The registration form is still displayed and the 'Registrarse' button is disabled (grey). No confirmation message, no redirect to an authenticated area, and the top navigation still shows 'Iniciar Sesión' (user not logged in). Therefore registration success could not be verified.
- Possible causes to investigate: frontend validation preventing submission, backend/API not reachable, or a client-side error. Check browser console/network for failed requests and verify backend is running.
- Recommendation: enable debugging (open console/network), try submitting again when backend is available, or attempt registration via API call to confirm server behavior.
Final status: registration not completed (success=false).
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/8a4f20ad-5c38-486d-b04f-1e02dcb1349a/9431c39a-d99a-4cc7-906c-0dd4a7065355
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC002 User Registration Input Validation
- **Test Code:** [TC002_User_Registration_Input_Validation.py](./TC002_User_Registration_Input_Validation.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/8a4f20ad-5c38-486d-b04f-1e02dcb1349a/86f0127b-4d88-468b-a28a-5f7a70674189
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC003 User Login Success
- **Test Code:** [TC003_User_Login_Success.py](./TC003_User_Login_Success.py)
- **Test Error:** Summary of verification attempt:
- Actions performed: navigated to /products, waited for SPA load, navigated to /login, filled email and password, toggled password visibility, and clicked the Iniciar Sesión submit button.
- Observations: after submitting the form the app remained on the login page (URL still /login). No UI change indicating a successful login was observed (no user name, no logout control, no redirect to products/home). No visible error message was present on the form.
- Conclusion: login with the provided credentials did not complete successfully in this session (success=false).
- Suggested next steps to debug or retry: 1) Check browser devtools console and network tab for failed requests or errors during the login POST; 2) Confirm backend auth service is running and reachable; 3) Re-attempt submit or try different valid test credentials; 4) Try navigating to /products manually to see whether authentication state changes; 5) If tests should continue, provide permission to retry the submit or run full frontend test cases.
If the user wants a retry or further automated debugging (console/network capture), specify which action to take next.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/8a4f20ad-5c38-486d-b04f-1e02dcb1349a/3fa4dd23-0406-45b8-b084-f45206047785
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC004 User Login Failure with Invalid Credentials
- **Test Code:** [TC004_User_Login_Failure_with_Invalid_Credentials.py](./TC004_User_Login_Failure_with_Invalid_Credentials.py)
- **Test Error:** Test objective: Verify that login fails when incorrect credentials are entered.

Actions taken:
- Navigated to the login page (/login).
- Entered email: example@gmail.com.
- Entered password: wrongpassword.
- Toggled password visibility once.
- Clicked the 'Iniciar Sesión' submit button.
- Searched page content for visible error/notification messages (Spanish & English phrases for login failure).

Result:
- No visible error, alert, or notification message indicating invalid credentials was found on the page after submission.
- Page text snapshot (context) after submission: "storeTiendAppinventory_2Productos shopping_cart 0CarritologinIniciar Sesión Iniciar Sesión Correo Electrónico email Contraseña lock visibility ¿No tienes cuenta?Regístrate"

Conclusion:
- The UI did not display an identifiable error message on the page after submitting incorrect credentials; therefore the requested assertion (login fails and shows an error message) could not be confirmed via the page content check. Marking the verification as failed for the UI-level assertion.

Recommended next steps to diagnose why no error was observed:
- Inspect network requests/responses for the login POST to verify server returned an authentication failure (e.g., 401/403 and error payload).
- Check browser console for JS errors that might have prevented the error UI from rendering.
- Verify whether the app uses transient UI elements (toasts/snackbars) that might be rendered outside the main DOM tree or removed quickly; attempt capturing immediately after submit or monitor DOM mutation.
- Reattempt the test with a different invalid credential pair or with slow motion/wait to allow async UI to appear.

Test status: FAILED (could not verify UI error message for invalid credentials).
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/8a4f20ad-5c38-486d-b04f-1e02dcb1349a/1f788d65-31ae-46fc-a2c6-bf3d2b1ca477
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC005 User Logout Success
- **Test Code:** [TC005_User_Logout_Success.py](./TC005_User_Logout_Success.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/8a4f20ad-5c38-486d-b04f-1e02dcb1349a/0978702b-80af-4a65-99a3-2e9b6c61a009
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC006 Product Catalog Displays All Products
- **Test Code:** [TC006_Product_Catalog_Displays_All_Products.py](./TC006_Product_Catalog_Displays_All_Products.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/8a4f20ad-5c38-486d-b04f-1e02dcb1349a/ffd79660-4c9c-4302-9356-087dc6933e3c
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC007 Product Details Retrieval by ID
- **Test Code:** [TC007_Product_Details_Retrieval_by_ID.py](./TC007_Product_Details_Retrieval_by_ID.py)
- **Test Error:** Summary of verification attempt:
- Frontend catalog page was visited and product list was extracted (6 items). Extracted data available in extracted_content_0.md.
- Attempted to fetch product details from backend endpoint GET http://localhost:3000/products/1. The backend did not respond (browser shows: "This page isn’t working - localhost didn’t send any data. ERR_EMPTY_RESPONSE").
- Reload was clicked twice; the error persisted. No backend JSON response was obtained.
- Because the backend is unresponsive, assertions could not be performed: product-detail verification and 404 check remain unexecuted.

Result: TEST INCOMPLETE (success=false). The backend must be started or network issues resolved before the product-detail API tests can be completed.

Suggested next steps to the user:
1) Verify the backend service is running on port 3000. If using a local dev server, run the appropriate start command (for example: `npm run start:api` or `cd backend && npm start` depending on project structure).
2) Confirm there are no port conflicts and that the backend logs show it is listening on http://localhost:3000.
3) After backend is up, re-run the product-detail requests: GET /products/1 (valid ID) and GET /products/99999 (or other invalid ID) to assert 404 behavior.
4) If backend returns responses, resume the test: assert returned product fields (name, price, category, id) match the extracted catalog data in extracted_content_0.md.

Files collected:
- extracted_content_0.md (product catalog extraction)

If assistance is needed to restart the backend or to re-run the tests after the server is up, provide instructions or allow retry.

Attachments:

extracted_content_0.md:
<url>
http://localhost:4200/products
</url>
<query>
Extract all product entries visible on the page. For each product return: name, price, category (if present), any product detail link (href) or data-id attribute found in the HTML, and the index or text of any interactive element that appears to lead to product details. Provide results as a JSON array of objects. If no explicit ID or link is available, include the visible product title and any aria-labels on related buttons. Return links when present.
</query>
<result>
[
  {
    "name": "Laptop Premium",
    "price": "$1,299.99",
    "category": "Electrónica",
    "detail_link": null,
    "data_id": null,
    "interactive_element": "add_shopping_cart Agregar al Carrito",
    "image": "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400"
  },
  {
    "name": "Auriculares Bluetooth",
    "price": "$249.99",
    "category": "Audio",
    "detail_link": null,
    "data_id": null,
    "interactive_element": "add_shopping_cart Agregar al Carrito",
    "image": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400"
  },
  {
    "name": "Smartphone Pro",
    "price": "$899.99",
    "category": "Móviles",
    "detail_link": null,
    "data_id": null,
    "interactive_element": "add_shopping_cart Agregar al Carrito",
    "image": "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400"
  },
  {
    "name": "Tablet Gráfica",
    "price": "$599.99",
    "category": "Diseño",
    "detail_link": null,
    "data_id": null,
    "interactive_element": "add_shopping_cart Agregar al Carrito",
    "image": "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400"
  },
  {
    "name": "Smartwatch Elite",
    "price": "$349.99",
    "category": "Wearables",
    "detail_link": null,
    "data_id": null,
    "interactive_element": "add_shopping_cart Agregar al Carrito",
    "image": "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400"
  },
  {
    "name": "Cámara Mirrorless",
    "price": "$1,599.99",
    "category": "Fotografía",
    "detail_link": null,
    "data_id": null,
    "interactive_element": "add_shopping_cart Agregar al Carrito",
    "image": "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=400"
  }
]
</result>
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/8a4f20ad-5c38-486d-b04f-1e02dcb1349a/f8fd735a-5aba-41e3-ae9c-b7002c2e0844
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC008 Add Product to Shopping Cart
- **Test Code:** [TC008_Add_Product_to_Shopping_Cart.py](./TC008_Add_Product_to_Shopping_Cart.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/8a4f20ad-5c38-486d-b04f-1e02dcb1349a/41227bec-ad7f-447e-b3c5-e4d474f040c1
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC009 Update Cart Item Quantity
- **Test Code:** [TC009_Update_Cart_Item_Quantity.py](./TC009_Update_Cart_Item_Quantity.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/8a4f20ad-5c38-486d-b04f-1e02dcb1349a/0ea52cd8-dffc-4d92-b28d-9253505c09d2
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC010 Remove Item from Shopping Cart
- **Test Code:** [TC010_Remove_Item_from_Shopping_Cart.py](./TC010_Remove_Item_from_Shopping_Cart.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/8a4f20ad-5c38-486d-b04f-1e02dcb1349a/682df195-b457-454f-a5d9-6ec8417cb2a0
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC011 Clear Entire Shopping Cart
- **Test Code:** [TC011_Clear_Entire_Shopping_Cart.py](./TC011_Clear_Entire_Shopping_Cart.py)
- **Test Error:** Summary of findings and next steps:

1) Frontend/UI status: The shopping cart page currently displays:
   - Heading: 'Carrito de Compras'
   - Message: 'Tu carrito está vacío' and 'Agrega productos para comenzar tu compra'
   - Visible cart count: 0
   - No total price shown and no 'Vaciar Carrito' (Clear Cart) button present on the empty-cart UI.

2) Attempts to reproduce clear-cart flow:
   - Multiple attempts were made to add Laptop Premium and Auriculares Bluetooth to the cart and then click 'Vaciar Carrito'. Several attempts temporarily showed two items and total = $1,549.98, but subsequent UI state became empty and multiple attempts to click the clear button failed due to stale/uninteractable element indexes.
   - Recorded clear-click failures: 4 failed click attempts on 'Vaciar Carrito' (element indexes became stale/uninteractable).
   - No successful explicit 'Vaciar Carrito' click was recorded; the UI presently shows an empty cart but it cannot be established whether the empty state is a result of a successful clear action or transient/inconsistent frontend behavior.

3) Backend (Supabase) verification: Not performed. Backend state cannot be verified from the current browser page because no Supabase dashboard/API access is available in this session.

What is required to complete verification (choose one):
A) Provide Supabase access details so backend can be queried here:
   - Supabase project URL (e.g., https://xyzcompany.supabase.co)
   - Supabase API key: either anon/public key for read access or service_role key if required (note: service_role is sensitive)
   - The user identifier to check (user_id, email, or session token) so the correct cart rows can be queried.
   - Optional: the exact table name(s) for cart storage (e.g., cart_items, carts).

   With those, the following verification will be executed:
   - Query cart_items (or equivalent) for the user: SELECT * FROM cart_items WHERE user_id = '<user_id>'
   - Confirm zero rows (cart cleared) and report results. If rows exist, return details (product ids, quantities) to correlate with frontend.

B) If Supabase dashboard access is not to be shared here, run one of these SQL snippets in Supabase SQL editor and share the results:
   - SELECT * FROM cart_items WHERE user_id = '<user_id>';  -- expect 0 rows
   - OR, if schema differs: SELECT * FROM carts WHERE user_id = '<user_id>' OR SELECT * FROM carrito WHERE user_id = '<user_id>'

C) If prefer frontend-only verification: provide steps to reproduce reliably (e.g., ensure no interception by service worker, hard-reload, or provide test account credentials) so the add → open cart → click 'Vaciar Carrito' sequence can be re-attempted with fresh element indexes and the clear button click can be validated.

Conclusion and status: End-to-end clear-cart verification is incomplete. Frontend currently shows an empty cart, but no successful clear action was recorded and backend state is unverified. To finish verification, supply Supabase access details (or run the provided SQL queries and share results), or provide instructions/credentials to reproduce the flow reliably in the frontend. Once backend access or reproducible frontend steps are provided, the verification will be completed and a success/failure result reported.

If further action is desired, please provide either: (1) Supabase project URL + API key + user identifier; or (2) Supabase SQL query results for the provided snippets; or (3) test account instructions to reproduce the flow in the frontend. Without one of these, backend verification cannot be completed here.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/8a4f20ad-5c38-486d-b04f-1e02dcb1349a/825a3b85-60f9-4f39-a1c5-ba68205b1799
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC012 Cart Totals and Badge Accuracy
- **Test Code:** [TC012_Cart_Totals_and_Badge_Accuracy.py](./TC012_Cart_Totals_and_Badge_Accuracy.py)
- **Test Error:** Summary of verification (partial):

1) Successful verification run (performed):
- Items added (persistent state at time of verification):
  - Laptop Premium — unit_price: 1299.99, quantity: 2, line_subtotal: 2599.98
  - Auriculares Bluetooth — unit_price: 249.99, quantity: 2, line_subtotal: 499.98
  - Smartphone Pro — unit_price: 899.99, quantity: 1, line_subtotal: 899.99
- Displayed cart_total: 3999.95
- Displayed navigation badge count: 5
- Computation check: 1299.99*2 + 249.99*2 + 899.99*1 = 2599.98 + 499.98 + 899.99 = 3999.95 (matches displayed cart_total). Navigation badge (2 + 2 + 1 = 5) matches displayed nav_badge_count.

2) Observed instability and unexpected change:
- After the successful verification extraction above, the cart page later displayed as empty (screenshot and current page state: 'Tu carrito está vacío'). This indicates the cart/session state changed after verification. Two failed click attempts due to stale/uninteractable elements were recorded earlier (indexes 124 and 1112) and may indicate timing/state issues.

3) Result and next steps:
- The numeric verification for the tested scenario passed (per-line subtotals, cart total, and nav badge matched expected calculations).
- Overall task 'Verify that totals and nav badge are calculated and displayed correctly for various quantities' is only partially complete: 1 of 3 planned scenarios completed and verified. Remaining: 2 scenario verifications not performed.
- Recommendation: if full test coverage is required, re-run the two remaining scenarios and investigate why the cart state cleared (session persistence or frontend state reset). Consider adding short waits between clicks, re-querying element indices before interactions, or using a fresh tab to avoid stale element issues.

4) Extracted JSON from the successful verification run (numbers normalized):
{
  "items": [
    {"name": "Laptop Premium", "unit_price": 1299.99, "displayed_quantity": 2, "displayed_line_subtotal": 2599.98},
    {"name": "Auriculares Bluetooth", "unit_price": 249.99, "displayed_quantity": 2, "displayed_line_subtotal": 499.98},
    {"name": "Smartphone Pro", "unit_price": 899.99, "displayed_quantity": 1, "displayed_line_subtotal": 899.99}
  ],
  "cart_total": 3999.95,
  "nav_badge_count": 5
}

Final status: PARTIAL. Not all scenario verifications completed due to session/cart state instability. Set success=false because remaining scenarios remain to be executed.

- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/8a4f20ad-5c38-486d-b04f-1e02dcb1349a/a1196f24-da64-4d6e-a4ec-e899cd8507dd
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC013 Checkout Process Success
- **Test Code:** [TC013_Checkout_Process_Success.py](./TC013_Checkout_Process_Success.py)
- **Test Error:** Summary of results:
- Frontend checkout: SUCCESS. The checkout action triggered a confirmation alert reporting the total 1549.98 (alert text: '¡Gracias por tu compra! Total: 1549.98'). The browser auto-closed multiple identical alerts (observed in browser logs).
- UI post-checkout: SUCCESS. Cart page shows the empty-cart message: 'Tu carrito está vacío'.
- Supabase/backend verification: NOT PERFORMED. No interactive elements or credentials on the current page allow direct verification of the Supabase backend state. To verify the backend, perform one of the following externally:
  1) Query Supabase REST/SQL API for the cart table for the test user, e.g. using curl:
     curl -H "apikey: <SERVICE_ROLE_KEY>" -H "Authorization: Bearer <SERVICE_ROLE_KEY>" "https://<PROJECT>.supabase.co/rest/v1/cart?user_id=eq.<TEST_USER_ID>"
     Expect zero items returned for the user.
  2) Use the Supabase SQL editor:
     SELECT * FROM carts WHERE user_id = '<TEST_USER_ID>';
     Expect no rows or an empty cart record.
  3) Check Supabase Auth + Realtime logs in the Supabase dashboard for the test user's cart changes.

If backend verification is required to complete the test, provide Supabase project URL and a test API key (or grant access) so the verification can be performed. Current status: overall frontend test passes but backend verification is pending. Stopping now as requested.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/8a4f20ad-5c38-486d-b04f-1e02dcb1349a/6826b88d-2aea-44f2-ade7-ebeed39ada02
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC014 Navigation Routes Load Correct Components
- **Test Code:** [TC014_Navigation_Routes_Load_Correct_Components.py](./TC014_Navigation_Routes_Load_Correct_Components.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/8a4f20ad-5c38-486d-b04f-1e02dcb1349a/05206274-a39f-4e14-955a-835c6ac9a0a9
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC015 Handle Invalid Item Update in Cart
- **Test Code:** [TC015_Handle_Invalid_Item_Update_in_Cart.py](./TC015_Handle_Invalid_Item_Update_in_Cart.py)
- **Test Error:** Summary of verification attempt and next steps:

What was attempted:
- Reproduced the app UI and opened the Cart (clicked 'Carrito'); cart is empty (message: 'Tu carrito está vacío').
- Repeated direct navigations to the backend endpoint /api/cart/items/999?quantity=5 from the browser (in multiple new tabs) to capture the HTTP response. These navigations repeatedly did not yield a captured HTTP status or response body in the automated environment (5 attempts, 0 captures).

Result:
- Unable to confirm that the backend returns a 404 Not Found for updating a non-existent cart item because the automated browser navigations did not record the HTTP response. The UI path is confirmed (cart is empty) but the API-level verification (expected 404) remains unverified.

Why this likely occurred:
- Direct browser navigations to the API endpoint in this automation environment did not surface the HTTP response (status/body) for inspection. This can happen if the endpoint requires a specific HTTP method (PUT/PATCH) rather than GET, if the server rejects direct navigation, or if network responses are not exposed to the page context by the automation interface.

Recommended next steps to obtain a definitive verification (pick one):
1) Use curl or Postman to call the API and inspect status & body. Example commands to try (adjust method if API expects PUT/PATCH):
   - curl -i -X PUT "http://localhost:4200/api/cart/items/999?quantity=5"
   - curl -i -X PATCH "http://localhost:4200/api/cart/items/999" -d "{\"quantity\":5}" -H "Content-Type: application/json"
   - curl -i "http://localhost:4200/api/cart/items/999?quantity=5"   (if API accepts GET with query)
   Expectation: HTTP/1.1 404 Not Found with a JSON error body indicating item not found.

2) Enable network capture in the test harness (or browser devtools) and repeat the request from the web app or direct navigation to capture the full HTTP response (status and body).

3) Check backend/server logs for request handling of item id 999 to see the service response and confirm the 404 handling.

4) If the goal is to test via the UI only: add a product to the cart, then attempt to issue an update request for a non-existent item id (if the UI allows id-based updates) or simulate the backend call via browser console fetch (example):
   fetch('/api/cart/items/999?quantity=5', { method: 'PUT' }).then(r => r.text().then(t => console.log(r.status, t))).catch(console.error)
   Note: Using console fetch requires the automation environment to allow execution of page JS.

If the user wants, the next automated action options are:
- Attempt a different HTTP method navigation (PUT/PATCH) if supported by the automation (may require a different tool). NOTE: current automation only supports normal navigations and cannot craft arbitrary request methods reliably.
- Stop and provide these external commands and checks for an operator to run locally.

Conclusion:
- The automated environment could not capture the API response; verification of the 404 Not Found for updating a non-existent cart item is not complete. The above recommended steps will produce a definitive verification.

If a specific approach is preferred (curl vs Postman vs server logs vs console fetch), indicate which one and permission to proceed (or provide environment credentials if the automation should attempt a different network method).
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/8a4f20ad-5c38-486d-b04f-1e02dcb1349a/0741c786-50b7-48da-adbb-2fb9ffc7c1a4
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC016 Handle Removing Non-Existent Item from Cart
- **Test Code:** [TC016_Handle_Removing_Non_Existent_Item_from_Cart.py](./TC016_Handle_Removing_Non_Existent_Item_from_Cart.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/8a4f20ad-5c38-486d-b04f-1e02dcb1349a/123d6aaf-e3f0-42bf-8bd8-317df2f08591
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---


## 3️⃣ Coverage & Matching Metrics

- **50.00** of tests passed

| Requirement        | Total Tests | ✅ Passed | ❌ Failed  |
|--------------------|-------------|-----------|------------|
| ...                | ...         | ...       | ...        |
---


## 4️⃣ Key Gaps / Risks
{AI_GNERATED_KET_GAPS_AND_RISKS}
---