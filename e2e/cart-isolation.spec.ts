import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/login.page';
import { ProductListPage } from './pages/product-list.page';
import { CartPage } from './pages/cart.page';
import { TEST_USERS } from './config/test-users';
import { clearAllCartItems } from './helpers/database.helper';

/**
 * Test de aislamiento de carritos entre usuarios
 * Verifica que cada usuario vea solo sus propios items en el carrito
 * 
 * Pre-requisitos:
 * - Ambos usuarios deben existir en Supabase (user1 y user2)
 * - Email confirmation debe estar deshabilitado
 */

test.describe('Cart Isolation Between Users', () => {
  test.beforeAll(async () => {
    // Limpiar TODOS los carritos antes de empezar
    try {
      await clearAllCartItems(TEST_USERS.user1.email, TEST_USERS.user1.password);
      console.log('✓ All carts cleared before test suite');
    } catch (error) {
      console.log('⚠️  Cart clear failed:', error);
    }
  });

  test('Should isolate cart items between different users', async ({ page, context }) => {
    const loginPage = new LoginPage(page);
    const productList = new ProductListPage(page);
    const cart = new CartPage(page);

    // ========================================
    // PARTE 1: Usuario 1 agrega productos
    // ========================================
    console.log('\n📍 STEP 1: User 1 logs in and adds products');
    
    // Limpiar storage y hacer login como User 1
    await loginPage.goto();
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.reload();
    await loginPage.login(TEST_USERS.user1.email, TEST_USERS.user1.password);
    await page.waitForURL('/products', { timeout: 10000 });

    // User 1 agrega 2 productos al carrito
    await productList.goto();
    await productList.addProductToCart(1); // Laptop Premium
    await page.waitForTimeout(1500);
    await productList.addProductToCart(2); // Smartphone Pro
    await page.waitForTimeout(1500);

    // Verificar que User 1 tiene 2 items
    await cart.goto();
    await page.waitForTimeout(1500);
    const user1ItemCount = await cart.getItemCount();
    console.log(`✓ User 1 has ${user1ItemCount} items in cart`);
    expect(user1ItemCount).toBe(2);

    // Verificar productos específicos
    const user1Product1Name = await productList.getProductName(1);
    const user1Product2Name = await productList.getProductName(2);
    console.log(`✓ User 1 cart contains: ${user1Product1Name}, ${user1Product2Name}`);

    // ========================================
    // PARTE 2: Usuario 1 hace logout
    // ========================================
    console.log('\n📍 STEP 2: User 1 logs out');
    
    await page.getByTestId('user-menu-button').click();
    await page.waitForTimeout(500);
    await page.getByTestId('logout-button').click();
    await page.waitForURL('/login', { timeout: 10000 });
    console.log('✓ User 1 logged out successfully');

    // ========================================
    // PARTE 3: Usuario 2 hace login
    // ========================================
    console.log('\n📍 STEP 3: User 2 logs in');
    
    // Limpiar storage antes de login de User 2
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.reload();
    await loginPage.login(TEST_USERS.user2.email, TEST_USERS.user2.password);
    await page.waitForURL('/products', { timeout: 10000 });
    console.log('✓ User 2 logged in successfully');

    // Verificar que User 2 tiene carrito VACÍO (no ve items de User 1)
    await cart.goto();
    await page.waitForTimeout(2000); // Esperar carga desde DB
    const user2ItemCount = await cart.getItemCount();
    const user2CartEmpty = await cart.isCartEmpty();
    
    console.log(`✓ User 2 cart is empty: ${user2CartEmpty} (${user2ItemCount} items)`);
    expect(user2CartEmpty).toBeTruthy();
    expect(user2ItemCount).toBe(0);

    // ========================================
    // PARTE 4: Usuario 2 agrega productos diferentes
    // ========================================
    console.log('\n📍 STEP 4: User 2 adds different products');
    
    await productList.goto();
    await productList.addProductToCart(3); // Tablet Ultra
    await page.waitForTimeout(1500);

    await cart.goto();
    await page.waitForTimeout(1500);
    const user2NewItemCount = await cart.getItemCount();
    console.log(`✓ User 2 now has ${user2NewItemCount} item in cart`);
    expect(user2NewItemCount).toBe(1);

    // ========================================
    // PARTE 5: Volver a Usuario 1 y verificar
    // ========================================
    console.log('\n📍 STEP 5: Switch back to User 1');
    
    // Logout User 2
    await page.getByTestId('user-menu-button').click();
    await page.waitForTimeout(500);
    await page.getByTestId('logout-button').click();
    await page.waitForURL('/login', { timeout: 10000 });
    console.log('✓ User 2 logged out');

    // Login User 1 nuevamente
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.reload();
    await loginPage.login(TEST_USERS.user1.email, TEST_USERS.user1.password);
    await page.waitForURL('/products', { timeout: 10000 });
    console.log('✓ User 1 logged back in');

    // Verificar que User 1 TODAVÍA tiene sus 2 items originales
    await cart.goto();
    await page.waitForTimeout(2000);
    const user1FinalItemCount = await cart.getItemCount();
    console.log(`✓ User 1 still has ${user1FinalItemCount} items (should be 2)`);
    expect(user1FinalItemCount).toBe(2);

    // ========================================
    // RESUMEN
    // ========================================
    console.log('\n✅ CART ISOLATION TEST PASSED');
    console.log('- User 1 cart: 2 items (Laptop + Smartphone)');
    console.log('- User 2 cart: 1 item (Tablet)');
    console.log('- No interference between users');
  });

  test('Should clear cart only for current user', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const productList = new ProductListPage(page);
    const cart = new CartPage(page);

    console.log('\n📍 TEST: Clear cart isolation');

    // Login como User 1
    await loginPage.goto();
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.reload();
    await loginPage.login(TEST_USERS.user1.email, TEST_USERS.user1.password);
    await page.waitForURL('/products', { timeout: 10000 });

    // Verificar items de User 1 (deben ser 2 del test anterior)
    await cart.goto();
    await page.waitForTimeout(1500);
    const beforeClearCount = await cart.getItemCount();
    console.log(`✓ User 1 has ${beforeClearCount} items before clear`);
    expect(beforeClearCount).toBeGreaterThan(0);

    // User 1 vacía su carrito
    await cart.clearCart();
    await page.waitForTimeout(2000);
    const afterClearCount = await cart.getItemCount();
    const isEmpty = await cart.isCartEmpty();
    console.log(`✓ User 1 cart after clear: ${afterClearCount} items, empty=${isEmpty}`);
    expect(isEmpty).toBeTruthy();
    expect(afterClearCount).toBe(0);

    // Logout y cambiar a User 2
    await page.getByTestId('user-menu-button').click();
    await page.waitForTimeout(500);
    await page.getByTestId('logout-button').click();
    await page.waitForURL('/login', { timeout: 10000 });

    // Login como User 2
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.reload();
    await loginPage.login(TEST_USERS.user2.email, TEST_USERS.user2.password);
    await page.waitForURL('/products', { timeout: 10000 });

    // Verificar que User 2 TODAVÍA tiene su item (no fue borrado)
    await cart.goto();
    await page.waitForTimeout(2000);
    const user2Count = await cart.getItemCount();
    console.log(`✓ User 2 still has ${user2Count} item (should be 1)`);
    expect(user2Count).toBe(1);

    console.log('\n✅ CLEAR CART ISOLATION TEST PASSED');
    console.log('- User 1 cleared their cart (0 items)');
    console.log('- User 2 cart unaffected (1 item)');
  });
});
