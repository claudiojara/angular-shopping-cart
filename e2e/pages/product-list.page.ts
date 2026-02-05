import { Page, Locator } from '@playwright/test';

/**
 * Page Object for Product List page
 * Uses data-testid selectors for robustness and maintainability
 */
export class ProductListPage {
  readonly page: Page;
  readonly productGrid: Locator;
  readonly productCards: Locator;
  readonly addToCartButtons: Locator;
  readonly cartBadge: Locator;

  constructor(page: Page) {
    this.page = page;
    
    // Use data-testid selectors for all product interactions
    this.productGrid = page.getByTestId('product-grid');
    this.productCards = page.locator('[data-testid^="product-card-"]');
    this.addToCartButtons = page.locator('[data-testid^="add-to-cart-"]');
    this.cartBadge = page.locator('[data-testid="cart-badge"]');
  }

  async goto() {
    await this.page.goto('/products');
    // Auto-waiting: Playwright waits for network idle
  }

  async getProductCount() {
    return await this.productCards.count();
  }

  async addProductToCart(productId: number) {
    await this.page.getByTestId(`add-to-cart-${productId}`).click();
  }

  async getCartItemCount() {
    const badge = await this.cartBadge.textContent();
    return badge ? parseInt(badge) : 0;
  }

  async getProductName(productId: number) {
    return await this.page.getByTestId(`product-name-${productId}`).textContent();
  }

  async getProductPrice(productId: number) {
    const priceText = await this.page.getByTestId(`product-price-${productId}`).textContent();
    return priceText;
  }

  async getProductDescription(productId: number) {
    return await this.page.getByTestId(`product-description-${productId}`).textContent();
  }

  async getProductCategory(productId: number) {
    return await this.page.getByTestId(`product-category-${productId}`).textContent();
  }

  async getProductImage(productId: number) {
    return this.page.getByTestId(`product-image-${productId}`);
  }

  async waitForProducts() {
    await this.productGrid.waitFor({ state: 'visible' });
  }
}
