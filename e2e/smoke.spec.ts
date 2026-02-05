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

  test('SMOKE-01: User can login and navigate to products', async ({ page }) => {
    await loginPage.goto();
    await loginPage.login(TEST_USER.email, TEST_USER.password);

    // Verify successful redirect to products page
    // This is the critical check - if login fails, redirect won't happen
    await expect(page).toHaveURL(/\/products/, { timeout: 10000 });

    // Wait for page to stabilize
    await page.waitForTimeout(2000);

    // Verify we're on a valid page (not error page)
    const pageContent = await page.content();
    expect(pageContent).not.toContain('Error');
    expect(pageContent).not.toContain('404');
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
