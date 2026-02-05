import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/login.page';
import { ProductListPage } from './pages/product-list.page';
import { TEST_USERS } from './config/test-users';

const TEST_USER = TEST_USERS.user1;

/**
 * E2E Smoke Tests - Minimal test suite for CI/CD
 * Only 2 critical tests to verify deployment health
 */

test.describe('CI/CD Smoke Tests', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
  });

  test('SMOKE-01: User can login successfully', async ({ page }) => {
    await loginPage.goto();
    await loginPage.login(TEST_USER.email, TEST_USER.password);

    // Verify redirect to products page
    await expect(page).toHaveURL(/\/products/, { timeout: 10000 });

    // Verify user is logged in (check for logout button or user menu)
    await page.waitForTimeout(1000);
    const isLoggedIn = await page
      .locator('[data-testid="user-menu"]')
      .isVisible()
      .catch(() => page.locator('text=/cerrar sesión/i').isVisible());

    expect(isLoggedIn).toBeTruthy();
  });

  test('SMOKE-02: Products page loads correctly', async ({ page }) => {
    const productListPage = new ProductListPage(page);

    // Login first
    await loginPage.goto();
    await loginPage.login(TEST_USER.email, TEST_USER.password);
    await page.waitForURL(/\/products/, { timeout: 10000 });

    // Wait for products to load
    await page.waitForTimeout(2000);

    // Verify at least one product is displayed
    const productCount = await productListPage.getProductCount();
    expect(productCount).toBeGreaterThan(0);

    // Verify add to cart button exists
    const firstAddButton = page.locator('[data-testid^="add-to-cart-"]').first();
    await expect(firstAddButton).toBeVisible();
  });
});
