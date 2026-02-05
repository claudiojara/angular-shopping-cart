import { Page, Locator } from '@playwright/test';

/**
 * Page Object for Registration page
 * Handles user registration with validation using data-testid selectors
 */
export class RegisterPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly confirmPasswordInput: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;
  readonly successMessage: Locator;
  readonly loginLink: Locator;
  readonly togglePasswordButton: Locator;
  readonly toggleConfirmPasswordButton: Locator;

  constructor(page: Page) {
    this.page = page;
    
    // Use data-testid as primary selector (more stable than text/role selectors)
    this.emailInput = page.getByTestId('register-email-input');
    this.passwordInput = page.getByTestId('register-password-input');
    this.confirmPasswordInput = page.getByTestId('register-confirm-password-input');
    this.submitButton = page.getByTestId('register-submit-button');
    this.errorMessage = page.getByTestId('register-error-message');
    this.successMessage = page.getByTestId('register-success-message');
    this.togglePasswordButton = page.getByTestId('register-toggle-password');
    this.toggleConfirmPasswordButton = page.getByTestId('register-toggle-confirm-password');
    
    // Keep semantic selectors for elements without data-testid
    this.loginLink = page.getByRole('link', { name: /iniciar sesión/i });
  }

  async goto() {
    await this.page.goto('/register');
  }

  async register(email: string, password: string, confirmPassword: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.confirmPasswordInput.fill(confirmPassword);
    await this.submitButton.click();
  }

  async registerQuick(email: string, password: string) {
    await this.register(email, password, password);
  }

  async hasError() {
    return await this.errorMessage.isVisible();
  }

  async hasSuccess() {
    return await this.successMessage.isVisible();
  }

  async goToLogin() {
    await this.loginLink.click();
  }

  async togglePasswordVisibility() {
    await this.togglePasswordButton.click();
  }

  async toggleConfirmPasswordVisibility() {
    await this.toggleConfirmPasswordButton.click();
  }
}
