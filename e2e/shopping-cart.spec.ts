import { test, expect } from '@playwright/test';
import { ProductListPage } from './pages/product-list.page';
import { CartPage } from './pages/cart.page';
import { LoginPage } from './pages/login.page';
import { TEST_CREDENTIALS } from './config/test-users';
import { clearCartDirectly, clearAllCartItems } from './helpers/database.helper';

/**
 * E2E tests for Product Catalog and Shopping Cart
 * Based on TestSprite test plan TC006-TC013
 * 
 * Pre-requisitos:
 * - Usuario autenticado (algunos tests pueden requerir login)
 * - Productos inicializados en la base de datos (6 productos esperados)
 */

test.describe('Product Catalog', () => {
  // Authenticate before each test in this suite
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(TEST_CREDENTIALS.email, TEST_CREDENTIALS.password);
    await page.waitForURL('/products', { timeout: 10000 });
  });

  test('TC006: Display all products in product catalog', async ({ page }) => {
    const productList = new ProductListPage(page);
    
    // Already on products page from beforeEach
    
    // Verify exactly 6 products are displayed
    const productCount = await productList.getProductCount();
    expect(productCount).toBe(6);
    
    // Verify first product has correct details
    const productName = await productList.getProductName(1);
    expect(productName).toContain('Laptop Premium');
  });
});

test.describe.serial('Shopping Cart Operations', () => {
  // Authenticate before each test and clear cart (best effort)
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    
    // Best-effort: Try to clear all cart items
    try {
      await clearAllCartItems(TEST_CREDENTIALS.email, TEST_CREDENTIALS.password);
    } catch (error) {
      console.log('⚠️  Cart clear failed, continuing anyway:', error);
    }
    
    // Navigate to app and clear storage
    await loginPage.goto();
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    
    // Login to UI
    await page.reload();
    await loginPage.login(TEST_CREDENTIALS.email, TEST_CREDENTIALS.password);
    await page.waitForURL('/products', { timeout: 10000 });
  });

  test('TC008: Add product to shopping cart', async ({ page }) => {
    const productList = new ProductListPage(page);
    const cart = new CartPage(page);
    
    await productList.goto();
    
    // Add first product to cart
    await productList.addProductToCart(1);
    
    // Wait for Supabase sync to complete (optimistic update + DB insert)
    await page.waitForTimeout(2000);
    
    // Navigate to cart and verify item is there
    await cart.goto();
    await page.waitForTimeout(1000); // Wait for cart to load from DB
    
    const itemCount = await cart.getItemCount();
    expect(itemCount).toBe(1);
  });

  test('TC009: Update product quantity in cart', async ({ page }) => {
    const productList = new ProductListPage(page);
    const cart = new CartPage(page);
    
    // Add product to cart
    await productList.goto();
    await productList.addProductToCart(1);
    
    // Wait for Supabase sync to complete
    await page.waitForTimeout(2000);
    
    // Go to cart
    await cart.goto();
    await page.waitForTimeout(1000); // Wait for cart to load from DB
    
    // Get initial quantity
    const initialQty = await cart.getItemQuantity(1);
    expect(initialQty).toBe(1);
    
    // Increase quantity
    await cart.increaseQuantity(1);
    await page.waitForTimeout(1000); // Wait for quantity update to sync
    
    // Verify quantity updated
    const newQty = await cart.getItemQuantity(1);
    expect(newQty).toBe(2);
    
    // Decrease quantity
    await cart.decreaseQuantity(1);
    await page.waitForTimeout(1000); // Wait for quantity update to sync
    const finalQty = await cart.getItemQuantity(1);
    expect(finalQty).toBe(1);
  });

  test('TC010: Remove product from cart', async ({ page }) => {
    const productList = new ProductListPage(page);
    const cart = new CartPage(page);
    
    // Add product
    await productList.goto();
    await productList.addProductToCart(1);
    
    // Wait for Supabase sync to complete
    await page.waitForTimeout(2000);
    
    // Go to cart
    await cart.goto();
    await page.waitForTimeout(1000); // Wait for cart to load from DB
    expect(await cart.getItemCount()).toBe(1);
    
    // Remove item
    await cart.removeItem(1);
    await page.waitForTimeout(1000); // Wait for removal to sync
    
    // Verify cart is empty
    expect(await cart.isCartEmpty()).toBeTruthy();
  });

  test('TC011: Clear entire shopping cart', async ({ page }) => {
    const productList = new ProductListPage(page);
    const cart = new CartPage(page);
    
    // Add multiple products
    await productList.goto();
    await productList.addProductToCart(1);
    await page.waitForTimeout(1000);
    await productList.addProductToCart(2);
    
    // Wait for both products to sync to Supabase
    await page.waitForTimeout(2000);
    
    // Go to cart
    await cart.goto();
    await page.waitForTimeout(1000); // Wait for cart to load from DB
    expect(await cart.getItemCount()).toBe(2);
    
    // Clear cart
    await cart.clearCart();
    await page.waitForTimeout(1000); // Wait for clear to sync
    
    // Verify cart is empty
    expect(await cart.isCartEmpty()).toBeTruthy();
  });

  test('TC012: Cart total price calculation', async ({ page }) => {
    const productList = new ProductListPage(page);
    const cart = new CartPage(page);
    
    // Add product (Laptop Premium - $1,299.99)
    await productList.goto();
    await productList.addProductToCart(1);
    
    // Wait for Supabase sync to complete
    await page.waitForTimeout(2000);
    
    // Go to cart
    await cart.goto();
    await page.waitForTimeout(1000); // Wait for cart to load from DB
    
    // Verify initial total
    let total = await cart.getTotal();
    expect(total).toBe(1299.99);
    
    // Increase quantity to 2
    await cart.increaseQuantity(1);
    await page.waitForTimeout(1000); // Wait for quantity update to sync
    
    // Verify total doubled
    total = await cart.getTotal();
    expect(total).toBe(2599.98);
  });

  test('TC013: Checkout process', async ({ page }) => {
    const productList = new ProductListPage(page);
    const cart = new CartPage(page);
    
    // Add product
    await productList.goto();
    await productList.addProductToCart(1);
    
    // Wait for Supabase sync to complete
    await page.waitForTimeout(2000);
    
    // Go to cart
    await cart.goto();
    await page.waitForTimeout(1000); // Wait for cart to load from DB
    
    // Listen for alert dialog
    page.on('dialog', async dialog => {
      expect(dialog.message()).toContain('Total');
      await dialog.accept();
    });
    
    // Click checkout
    await cart.checkout();
    await page.waitForTimeout(1000); // Wait for checkout to complete and cart to clear
    
    // Verify cart is cleared after checkout
    expect(await cart.isCartEmpty()).toBeTruthy();
  });
});

test.describe('Navigation', () => {
  // Authenticate before navigation tests
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(TEST_CREDENTIALS.email, TEST_CREDENTIALS.password);
    await page.waitForURL('/products', { timeout: 10000 });
  });

  test('TC014: Navigation between pages', async ({ page }) => {
    // Already on products page from beforeEach
    await expect(page).toHaveURL('/products');
    
    // Navigate to cart
    await page.getByTestId('navbar-cart-button').click();
    await expect(page).toHaveURL('/cart');
    
    // Navigate back to products
    await page.getByTestId('navbar-products-button').click();
    await expect(page).toHaveURL('/products');
  });

  test('TC015: Root path redirects to products', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL('/products');
  });
});
