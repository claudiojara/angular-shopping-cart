import { Page, Locator } from '@playwright/test';

/**
 * Page Object for Shopping Cart page
 * Uses data-testid selectors for robust cart operations
 */
export class CartPage {
  readonly page: Page;
  readonly cartTitle: Locator;
  readonly cartItemCount: Locator;
  readonly cartItems: Locator;
  readonly cartItemsList: Locator;
  readonly emptyCartMessage: Locator;
  readonly cartSummary: Locator;
  readonly totalAmount: Locator;
  readonly checkoutButton: Locator;
  readonly clearCartButton: Locator;

  constructor(page: Page) {
    this.page = page;
    
    // Use data-testid selectors for all cart interactions
    this.cartTitle = page.getByTestId('cart-title');
    this.cartItemCount = page.getByTestId('cart-item-count');
    this.cartItemsList = page.getByTestId('cart-items-list');
    // ✅ Only select the mat-list-item elements (exact match for cart-item-{number})
    this.cartItems = page.locator('mat-list-item[data-testid^="cart-item-"]');
    this.emptyCartMessage = page.getByTestId('empty-cart-message');
    this.cartSummary = page.getByTestId('cart-summary');
    this.totalAmount = page.getByTestId('cart-total-amount');
    this.checkoutButton = page.getByTestId('checkout-button');
    this.clearCartButton = page.getByTestId('clear-cart-button');
  }

  async goto() {
    await this.page.goto('/cart');
  }

  async getItemCount() {
    return await this.cartItems.count();
  }

  async isCartEmpty() {
    return await this.emptyCartMessage.isVisible();
  }

  async getTotal() {
    const text = await this.totalAmount.textContent();
    // Extract number from currency format (e.g., "$1,299.99")
    return text ? parseFloat(text.replace(/[$,]/g, '')) : 0;
  }

  async increaseQuantity(productId: number) {
    await this.page.getByTestId(`increase-quantity-${productId}`).click();
  }

  async decreaseQuantity(productId: number) {
    await this.page.getByTestId(`decrease-quantity-${productId}`).click();
  }

  async removeItem(productId: number) {
    await this.page.getByTestId(`remove-item-${productId}`).click();
  }

  async clearCart() {
    await this.clearCartButton.click();
  }

  async checkout() {
    await this.checkoutButton.click();
  }

  async getItemQuantity(productId: number) {
    const text = await this.page.getByTestId(`quantity-${productId}`).textContent();
    return text ? parseInt(text) : 0;
  }

  async getItemName(productId: number) {
    return await this.page.getByTestId(`cart-item-name-${productId}`).textContent();
  }

  async getItemPrice(productId: number) {
    return await this.page.getByTestId(`cart-item-price-${productId}`).textContent();
  }

  async getItemSubtotal(productId: number) {
    return await this.page.getByTestId(`cart-item-subtotal-${productId}`).textContent();
  }

  async getItemImage(productId: number) {
    return this.page.getByTestId(`cart-item-image-${productId}`);
  }

  async waitForCartUpdate() {
    // Wait for any cart updates to complete
    await this.page.waitForTimeout(500);
  }
}
