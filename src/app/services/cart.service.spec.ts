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

    const supabaseClientMock = jasmine.createSpyObj('SupabaseClient', ['from']);
    const fromMock = jasmine.createSpyObj('QueryBuilder', [
      'select',
      'insert',
      'update',
      'delete',
      'order',
      'eq',
    ]);

    supabaseClientMock.from.and.returnValue(fromMock);
    fromMock.select.and.returnValue(fromMock);
    fromMock.insert.and.returnValue(fromMock);
    fromMock.update.and.returnValue(fromMock);
    fromMock.delete.and.returnValue(fromMock);
    fromMock.order.and.returnValue(fromMock);
    fromMock.eq.and.returnValue(fromMock);

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

      const insertSpy = service['supabase'].client.from('cart_items').insert as jasmine.Spy;
      insertSpy.and.returnValue(Promise.resolve({ error: null }));

      await service.addToCart(mockProduct);

      expect(insertSpy).toHaveBeenCalled();
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

      const clientMock = supabaseMock.client as any;
      const fromResult = clientMock.from();
      fromResult.eq.and.returnValue(Promise.resolve({ error: null }));

      await service.removeFromCart(mockProduct.id);

      expect(fromResult.delete).toHaveBeenCalled();
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

      const clientMock = supabaseMock.client as any;
      const fromResult = clientMock.from();
      fromResult.eq.and.returnValue(Promise.resolve({ error: null }));

      await service.updateQuantity(mockProduct.id, 3);

      expect(fromResult.update).toHaveBeenCalled();
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

      const clientMock = supabaseMock.client as any;
      const fromResult = clientMock.from();
      fromResult.eq.and.returnValue(Promise.resolve({ error: null }));

      await service.clearCart();

      expect(fromResult.delete).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should rollback on insert error', async () => {
      supabaseMock.isAuthenticated.and.returnValue(true);
      supabaseMock.getCurrentUser.and.returnValue({ id: 'user-123', email: 'test@test.com' });

      const insertSpy = service['supabase'].client.from('cart_items').insert as jasmine.Spy;
      insertSpy.and.returnValue(Promise.resolve({ error: { message: 'Insert failed' } }));

      await service.addToCart(mockProduct);

      // Should rollback and remove the optimistically added item
      expect(service.items().length).toBe(0);
    });

    it('should rollback on update error', async () => {
      supabaseMock.isAuthenticated.and.returnValue(false);
      await service.addToCart(mockProduct);

      supabaseMock.isAuthenticated.and.returnValue(true);
      const clientMock = supabaseMock.client as any;
      const fromResult = clientMock.from();
      fromResult.eq.and.returnValue(Promise.resolve({ error: { message: 'Update failed' } }));

      await service.updateQuantity(mockProduct.id, 5);

      // Should rollback to original quantity
      expect(service.items()[0].quantity).toBe(1);
    });
  });
});
