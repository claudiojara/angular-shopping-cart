import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/login.page';
import { ProductListPage } from './pages/product-list.page';
import { CartPage } from './pages/cart.page';
import { TEST_USERS } from './config/test-users';
import { clearAllCartItems } from './helpers/database.helper';

/**
 * Test simple para diagnosticar el problema de agregado de productos
 */

test('Debug: Add single product and verify', async ({ page }) => {
  const loginPage = new LoginPage(page);
  const productList = new ProductListPage(page);
  const cart = new CartPage(page);

  // Capturar logs del navegador
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    if (type === 'log' || type === 'error' || type === 'warning') {
      console.log(`[BROWSER ${type.toUpperCase()}] ${text}`);
    }
  });

  // Limpiar carrito
  await clearAllCartItems(TEST_USERS.user1.email, TEST_USERS.user1.password);
  console.log('✓ Cart cleared');

  // Login
  await loginPage.goto();
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.reload();
  await loginPage.login(TEST_USERS.user1.email, TEST_USERS.user1.password);
  await page.waitForURL('/products', { timeout: 10000 });
  console.log('✓ User 1 logged in');

  // Verificar carrito vacío
  await cart.goto();
  await page.waitForTimeout(1500);
  const initialCount = await cart.getItemCount();
  console.log(`📊 Initial cart count: ${initialCount}`);
  expect(initialCount).toBe(0);

  // Ver cuántos productos hay en el catálogo
  await productList.goto();
  const productCount = await productList.getProductCount();
  console.log(`📦 Total products in catalog: ${productCount}`);

  // Obtener nombres de los primeros 3 productos
  for (let i = 1; i <= Math.min(3, productCount); i++) {
    const name = await productList.getProductName(i);
    console.log(`   Product ${i}: ${name}`);
  }

  // Agregar SOLO producto 1
  console.log('\n🔵 Clicking add-to-cart for product ID 1...');
  await productList.addProductToCart(1);
  await page.waitForTimeout(2000); // Esperar sincronización

  // Verificar que se agregó SOLO 1 item
  await cart.goto();
  await page.waitForTimeout(1500);
  const afterAddCount = await cart.getItemCount();
  console.log(`📊 After adding product 1: ${afterAddCount} items`);

  // Listar todos los items en el carrito
  if (afterAddCount > 0) {
    console.log('\n📋 Cart contents:');
    const items = page.locator('[data-testid^="cart-item-"]');
    const count = await items.count();
    
    for (let i = 0; i < count; i++) {
      const item = items.nth(i);
      const testId = await item.getAttribute('data-testid');
      const nameLocator = item.locator('[data-testid^="cart-item-name-"]');
      const name = await nameLocator.textContent();
      console.log(`   - ${testId}: ${name}`);
    }
  }

  expect(afterAddCount).toBe(1);
});
