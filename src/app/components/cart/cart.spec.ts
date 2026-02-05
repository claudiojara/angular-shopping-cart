import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Cart } from './cart';
import { CartService } from '../../services/cart.service';
import { signal, computed } from '@angular/core';
import { CartItem } from '../../models/cart-item.model';
import { Product } from '../../models/product.model';

describe('Cart', () => {
  let component: Cart;
  let fixture: ComponentFixture<Cart>;
  let cartServiceMock: jasmine.SpyObj<CartService>;

  const mockProduct: Product = {
    id: 1,
    name: 'Test Product',
    description: 'Test Description',
    price: 99.99,
    image: 'https://test.com/image.jpg',
    category: 'Test',
  };

  const mockCartItems: CartItem[] = [{ product: mockProduct, quantity: 2 }];

  beforeEach(async () => {
    const itemsSignal = signal(mockCartItems);
    const totalSignal = computed(() => 199.98);
    const itemCountSignal = computed(() => 2);

    cartServiceMock = jasmine.createSpyObj(
      'CartService',
      ['updateQuantity', 'removeFromCart', 'clearCart'],
      {
        items: itemsSignal.asReadonly(),
        total: totalSignal,
        itemCount: itemCountSignal,
      },
    );

    await TestBed.configureTestingModule({
      imports: [Cart],
      providers: [{ provide: CartService, useValue: cartServiceMock }],
    }).compileComponents();

    fixture = TestBed.createComponent(Cart);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display items from cart service', () => {
    expect(component.items()).toEqual(mockCartItems);
  });

  it('should display total from cart service', () => {
    expect(component.total()).toBe(199.98);
  });

  it('should display item count from cart service', () => {
    expect(component.itemCount()).toBe(2);
  });

  it('should call updateQuantity on cartService', () => {
    component.updateQuantity(1, 3);
    expect(cartServiceMock.updateQuantity).toHaveBeenCalledWith(1, 3);
  });

  it('should call removeFromCart on cartService', () => {
    component.removeItem(1);
    expect(cartServiceMock.removeFromCart).toHaveBeenCalledWith(1);
  });

  it('should call clearCart on cartService', () => {
    component.clearCart();
    expect(cartServiceMock.clearCart).toHaveBeenCalled();
  });

  it('should not remove item if it does not exist', () => {
    const emptyItemsSignal = signal([]);
    Object.defineProperty(cartServiceMock, 'items', {
      value: emptyItemsSignal.asReadonly(),
    });

    component.removeItem(999);

    expect(cartServiceMock.removeFromCart).not.toHaveBeenCalled();
  });

  it('should show alert and clear cart on checkout', () => {
    spyOn(window, 'alert');

    component.checkout();

    expect(window.alert).toHaveBeenCalledWith('¡Gracias por tu compra! Total: 199.98');
    expect(cartServiceMock.clearCart).toHaveBeenCalled();
  });

  it('should render cart items', () => {
    const compiled = fixture.nativeElement;
    const items = compiled.querySelectorAll('mat-list-item');

    expect(items.length).toBeGreaterThan(0);
  });

  it('should display total in template', () => {
    const compiled = fixture.nativeElement;
    const totalElement = compiled.querySelector('[data-testid="cart-total"]');

    if (totalElement) {
      expect(totalElement.textContent).toContain('199.98');
    }
  });
});
