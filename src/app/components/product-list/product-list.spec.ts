import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProductList } from './product-list';
import { ProductService } from '../../services/product.service';
import { CartService } from '../../services/cart.service';
import { signal } from '@angular/core';
import { Product } from '../../models/product.model';
import { provideConfigMock } from '../../testing/test-helpers';

xdescribe('ProductList', () => {
  let component: ProductList;
  let fixture: ComponentFixture<ProductList>;
  let productServiceMock: jasmine.SpyObj<ProductService>;
  let cartServiceMock: jasmine.SpyObj<CartService>;

  const mockProducts: Product[] = [
    {
      id: 1,
      name: 'Test Product 1',
      slug: 'test-product-1',
      description: 'Description 1',
      price: 100,
      image: 'https://test.com/1.jpg',
      category: 'Test',
      rating: 4.5,
      reviewCount: 5,
      sku: 'TEST-001',
      stockQuantity: 10,
      isAvailable: true,
      isFeatured: false,
    },
    {
      id: 2,
      name: 'Test Product 2',
      slug: 'test-product-2',
      description: 'Description 2',
      price: 200,
      image: 'https://test.com/2.jpg',
      category: 'Test',
      rating: 5.0,
      reviewCount: 8,
      sku: 'TEST-002',
      stockQuantity: 5,
      isAvailable: true,
      isFeatured: true,
    },
  ];

  beforeEach(async () => {
    const productsSignal = signal(mockProducts);
    const loadingSignal = signal(false);
    const errorSignal = signal<string | null>(null);

    productServiceMock = jasmine.createSpyObj(
      'ProductService',
      ['loadProducts', 'getProductBySlug'],
      {
        products: productsSignal.asReadonly(),
        loading: loadingSignal.asReadonly(),
        error: errorSignal.asReadonly(),
      },
    );

    cartServiceMock = jasmine.createSpyObj('CartService', ['addToCart']);

    await TestBed.configureTestingModule({
      imports: [ProductList],
      providers: [
        provideConfigMock(),
        { provide: ProductService, useValue: productServiceMock },
        { provide: CartService, useValue: cartServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProductList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display products from service', () => {
    expect(component.productService.products()).toEqual(mockProducts);
  });

  it('should call cartService.addToCart when addToCart is called', () => {
    const product = mockProducts[0];
    component.addToCart(product);

    expect(cartServiceMock.addToCart).toHaveBeenCalledWith(product);
  });

  it('should render product cards', () => {
    const compiled = fixture.nativeElement;
    const cards = compiled.querySelectorAll('mat-card');

    expect(cards.length).toBe(mockProducts.length);
  });

  it('should display product names', () => {
    const compiled = fixture.nativeElement;
    const productTitles = compiled.querySelectorAll('mat-card-title');

    expect(productTitles[0].textContent).toContain('Test Product 1');
    expect(productTitles[1].textContent).toContain('Test Product 2');
  });

  it('should have add to cart buttons', () => {
    const compiled = fixture.nativeElement;
    const buttons = compiled.querySelectorAll('button[data-testid*="add-to-cart"]');

    expect(buttons.length).toBeGreaterThan(0);
  });
});
