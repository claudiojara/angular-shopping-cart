import { TestBed } from '@angular/core/testing';
import { CartService } from './cart.service';
import { SupabaseService } from './supabase.service';
import { ProductService } from './product.service';
import { Product } from '../models/product.model';
import { BehaviorSubject } from 'rxjs';

describe('CartService', () => {
  let service: CartService;
  let supabaseMock: jasmine.SpyObj<SupabaseService>;
  let productServiceMock: jasmine.SpyObj<ProductService>;
  let currentUserSubject: BehaviorSubject<any>;

  const mockProduct: Product = {
    id: 1,
    name: 'Test Product',
    description: 'Test Description',
    price: 99.99,
    image: 'https://test.com/image.jpg',
    category: 'Test',
  };

  const mockDbCartItems = [
    {
      id: 1,
      user_id: 'user-123',
      product_id: 1,
      quantity: 2,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
  ];

  beforeEach(() => {
    currentUserSubject = new BehaviorSubject<any>(null);

    // Create a chainable query builder mock that returns promises at the end
    const createQueryBuilderChain = () => {
      const chain: any = {
        select: jasmine.createSpy('select'),
        insert: jasmine.createSpy('insert'),
        update: jasmine.createSpy('update'),
        delete: jasmine.createSpy('delete'),
        order: jasmine.createSpy('order'),
        eq: jasmine.createSpy('eq'),
        single: jasmine.createSpy('single'),
      };

      // Make all methods chainable
      chain.select.and.returnValue(chain);
      chain.insert.and.returnValue(chain);
      chain.update.and.returnValue(chain);
      chain.delete.and.returnValue(chain);
      chain.order.and.returnValue(chain);
      chain.eq.and.returnValue(Promise.resolve({ data: null, error: null }));
      chain.single.and.returnValue(Promise.resolve({ data: null, error: null }));

      return chain;
    };

    const supabaseClientMock = jasmine.createSpyObj('SupabaseClient', ['from']);
    supabaseClientMock.from.and.callFake(() => createQueryBuilderChain());

    supabaseMock = jasmine.createSpyObj('SupabaseService', ['getCurrentUser', 'isAuthenticated'], {
      currentUser$: currentUserSubject.asObservable(),
      client: supabaseClientMock,
    });

    productServiceMock = jasmine.createSpyObj('ProductService', ['getProductById']);
    productServiceMock.getProductById.and.returnValue(mockProduct);

    TestBed.configureTestingModule({
      providers: [
        CartService,
        { provide: SupabaseService, useValue: supabaseMock },
        { provide: ProductService, useValue: productServiceMock },
      ],
    });

    service = TestBed.inject(CartService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Signal State', () => {
    it('should initialize with empty cart', () => {
      expect(service.items()).toEqual([]);
      expect(service.itemCount()).toBe(0);
      expect(service.total()).toBe(0);
    });

    it('should calculate itemCount correctly', async () => {
      supabaseMock.isAuthenticated.and.returnValue(false);
      await service.addToCart(mockProduct);
      await service.addToCart(mockProduct);

      expect(service.itemCount()).toBe(2);
    });

    it('should calculate total correctly', async () => {
      supabaseMock.isAuthenticated.and.returnValue(false);
      await service.addToCart(mockProduct);

      expect(service.total()).toBe(99.99);
    });
  });

  describe('addToCart', () => {
    it('should add new product to cart', async () => {
      supabaseMock.isAuthenticated.and.returnValue(false);

      await service.addToCart(mockProduct);

      expect(service.items().length).toBe(1);
      expect(service.items()[0].product).toEqual(mockProduct);
      expect(service.items()[0].quantity).toBe(1);
    });

    it('should increase quantity if product already exists', async () => {
      supabaseMock.isAuthenticated.and.returnValue(false);

      await service.addToCart(mockProduct);
      await service.addToCart(mockProduct);

      expect(service.items().length).toBe(1);
      expect(service.items()[0].quantity).toBe(2);
    });

    it('should sync to Supabase when authenticated', async () => {
      supabaseMock.isAuthenticated.and.returnValue(true);
      supabaseMock.getCurrentUser.and.returnValue({ id: 'user-123', email: 'test@test.com' });

      await service.addToCart(mockProduct);

      expect(supabaseMock.client.from).toHaveBeenCalledWith('cart_items');
      expect(service.items().length).toBe(1);
    });
  });

  describe('removeFromCart', () => {
    beforeEach(async () => {
      supabaseMock.isAuthenticated.and.returnValue(false);
      await service.addToCart(mockProduct);
    });

    it('should remove product from cart', async () => {
      await service.removeFromCart(mockProduct.id);

      expect(service.items().length).toBe(0);
    });

    it('should sync deletion to Supabase when authenticated', async () => {
      supabaseMock.isAuthenticated.and.returnValue(true);
      supabaseMock.getCurrentUser.and.returnValue({ id: 'user-123', email: 'test@test.com' });

      await service.removeFromCart(mockProduct.id);

      expect(supabaseMock.client.from).toHaveBeenCalledWith('cart_items');
      expect(service.items().length).toBe(0);
    });
  });

  describe('updateQuantity', () => {
    beforeEach(async () => {
      supabaseMock.isAuthenticated.and.returnValue(false);
      await service.addToCart(mockProduct);
    });

    it('should update product quantity', async () => {
      await service.updateQuantity(mockProduct.id, 5);

      expect(service.items()[0].quantity).toBe(5);
    });

    it('should remove product if quantity is 0', async () => {
      await service.updateQuantity(mockProduct.id, 0);

      expect(service.items().length).toBe(0);
    });

    it('should sync update to Supabase when authenticated', async () => {
      supabaseMock.isAuthenticated.and.returnValue(true);
      supabaseMock.getCurrentUser.and.returnValue({ id: 'user-123', email: 'test@test.com' });

      await service.updateQuantity(mockProduct.id, 3);

      expect(supabaseMock.client.from).toHaveBeenCalledWith('cart_items');
      expect(service.items()[0].quantity).toBe(3);
    });
  });

  describe('clearCart', () => {
    beforeEach(async () => {
      supabaseMock.isAuthenticated.and.returnValue(false);
      await service.addToCart(mockProduct);
    });

    it('should clear all items from cart', async () => {
      await service.clearCart();

      expect(service.items().length).toBe(0);
      expect(service.itemCount()).toBe(0);
    });

    it('should sync clear to Supabase when authenticated', async () => {
      supabaseMock.isAuthenticated.and.returnValue(true);
      supabaseMock.getCurrentUser.and.returnValue({ id: 'user-123', email: 'test@test.com' });

      await service.clearCart();

      expect(supabaseMock.client.from).toHaveBeenCalledWith('cart_items');
      expect(service.items().length).toBe(0);
    });
  });

  describe('Error Handling', () => {
    it('should rollback on insert error', async () => {
      supabaseMock.isAuthenticated.and.returnValue(true);
      supabaseMock.getCurrentUser.and.returnValue({ id: 'user-123', email: 'test@test.com' });

      // Override the client mock to return an error
      const errorChain: any = {
        select: jasmine.createSpy('select'),
        insert: jasmine.createSpy('insert'),
        eq: jasmine.createSpy('eq'),
      };
      errorChain.insert.and.returnValue(errorChain);
      errorChain.eq.and.returnValue(errorChain);
      errorChain.select.and.returnValue(
        Promise.resolve({ data: null, error: { message: 'Insert failed' } }),
      );

      supabaseMock.client.from = jasmine.createSpy('from').and.returnValue(errorChain);

      await service.addToCart(mockProduct);

      // Should rollback and remove the optimistically added item
      expect(service.items().length).toBe(0);
    });

    it('should rollback on update error', async () => {
      supabaseMock.isAuthenticated.and.returnValue(false);
      await service.addToCart(mockProduct);

      supabaseMock.isAuthenticated.and.returnValue(true);
      supabaseMock.getCurrentUser.and.returnValue({ id: 'user-123', email: 'test@test.com' });

      // Override the client mock to return an error
      const errorChain: any = {
        update: jasmine.createSpy('update'),
        eq: jasmine.createSpy('eq'),
      };
      errorChain.update.and.returnValue(errorChain);
      errorChain.eq.and.returnValue(errorChain); // Make eq chainable
      // Last eq returns promise with error
      errorChain.eq.and.returnValues(
        errorChain,
        Promise.resolve({ data: null, error: { message: 'Update failed' } }),
      );

      supabaseMock.client.from = jasmine.createSpy('from').and.returnValue(errorChain);

      await service.updateQuantity(mockProduct.id, 5);

      // Should rollback to original quantity
      expect(service.items()[0].quantity).toBe(1);
    });
  });
});
