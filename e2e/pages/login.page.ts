import { Page, Locator } from '@playwright/test';

/**
 * Page Object for Login page
 * Handles authentication flow using data-testid selectors for robustness
 */
export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;
  readonly registerLink: Locator;
  readonly togglePasswordButton: Locator;

  constructor(page: Page) {
    this.page = page;
    
    // Use data-testid as primary selector (more stable than text/role selectors)
    this.emailInput = page.getByTestId('login-email-input');
    this.passwordInput = page.getByTestId('login-password-input');
    this.submitButton = page.getByTestId('login-submit-button');
    this.errorMessage = page.getByTestId('login-error-message');
    this.togglePasswordButton = page.getByTestId('login-toggle-password');
    
    // Keep semantic selectors for elements without data-testid
    this.registerLink = page.getByRole('link', { name: /registrarse/i });
  }

  async goto() {
    await this.page.goto('/login');
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  async hasError() {
    return await this.errorMessage.isVisible();
  }

  async goToRegister() {
    await this.registerLink.click();
  }

  async togglePasswordVisibility() {
    await this.togglePasswordButton.click();
  }
}
