import { test, expect } from '@playwright/test';
import { RegisterPage } from './pages/register.page';
import { LoginPage } from './pages/login.page';
import { TEST_CREDENTIALS, generateUniqueEmail } from './config/test-credentials';
// TODO: Migrate to use TEST_USERS from './config/test-users' once all tests updated

/**
 * E2E tests for Authentication
 * Based on TestSprite test plan TC001-TC005
 * 
 * Pre-requisitos:
 * - Usuario estático creado en Supabase: playwright-test@example.com / PlaywrightTest123!
 * - Email confirmation DISABLED en Supabase (Dashboard → Authentication → Email Auth)
 * - RLS policies configuradas correctamente
 */

test.describe('User Registration', () => {
  test('TC001: User registration with valid details', async ({ page }) => {
    const registerPage = new RegisterPage(page);
    const email = generateUniqueEmail();
    const password = 'Test123456';
    
    await registerPage.goto();
    await registerPage.registerQuick(email, password);
    
    // Wait for success message or redirect
    await page.waitForURL('/products', { timeout: 10000 }).catch(() => {});
    
    // Verify registration succeeded (either success message or redirect to products)
    const isOnProducts = page.url().includes('/products');
    const hasSuccess = await registerPage.hasSuccess();
    
    expect(isOnProducts || hasSuccess).toBeTruthy();
  });

  test('TC002: User registration input validation', async ({ page }) => {
    const registerPage = new RegisterPage(page);
    
    await registerPage.goto();
    
    // Fill with invalid data (short password)
    await registerPage.emailInput.fill('test@example.com');
    await registerPage.passwordInput.fill('12345');
    await registerPage.confirmPasswordInput.fill('12345');
    
    // Verify submit button is disabled (Angular validation prevents submission)
    const submitButton = registerPage.submitButton;
    await expect(submitButton).toBeDisabled();
    
    // Alternatively, verify error message appears (if shown)
    // Note: Angular Material may not show mat-error until field is touched and blurred
  });

  test.skip('TC002b: Password confirmation mismatch', async ({ page }) => {
    const registerPage = new RegisterPage(page);
    
    await registerPage.goto();
    
    // Enter mismatched passwords
    await registerPage.register('test@example.com', 'Password123', 'DifferentPassword123');
    
    // Verify error message
    const errorText = await page.locator('mat-error').textContent();
    expect(errorText).toContain('no coinciden');
  });
});

test.describe('User Login', () => {
  /**
   * Tests use static TEST_CREDENTIALS (playwright-test@example.com)
   * This user must be created in Supabase before running tests
   */

  test('TC003: User login with correct credentials', async ({ page }) => {
    const loginPage = new LoginPage(page);
    
    await loginPage.goto();
    await loginPage.login(TEST_CREDENTIALS.email, TEST_CREDENTIALS.password);
    
    // Verify redirect to products after login
    await expect(page).toHaveURL('/products', { timeout: 10000 });
    
    // Verify user menu button appears (icon button)
    const userMenuButton = page.getByTestId('user-menu-button');
    await expect(userMenuButton).toBeVisible();
  });

  test('TC004: User login with incorrect credentials', async ({ page }) => {
    const loginPage = new LoginPage(page);
    
    await loginPage.goto();
    await loginPage.login('wrong@example.com', 'wrongpassword');
    
    // Verify error message is displayed
    await page.waitForTimeout(2000); // Wait for error to appear
    const hasError = await loginPage.hasError();
    expect(hasError).toBeTruthy();
  });

  test('TC005: User logout', async ({ page }) => {
    const loginPage = new LoginPage(page);
    
    // Login first with static test credentials
    await loginPage.goto();
    await loginPage.login(TEST_CREDENTIALS.email, TEST_CREDENTIALS.password);
    await page.waitForURL('/products');
    
    // Click user menu button
    await page.getByTestId('user-menu-button').click();
    
    // Wait for menu to open and click logout
    await page.waitForTimeout(500);
    await page.getByTestId('logout-button').click();
    
    // Verify logout occurred (login button should appear)
    const loginButton = page.getByTestId('navbar-login-button');
    await expect(loginButton).toBeVisible();
  });
});
