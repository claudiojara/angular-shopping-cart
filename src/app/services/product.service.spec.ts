import { TestBed } from '@angular/core/testing';
import { ProductService } from './product.service';
import { SupabaseService } from './supabase.service';
import { provideConfigMock } from '../testing/test-helpers';

describe('ProductService', () => {
  let service: ProductService;
  let supabaseMock: jasmine.SpyObj<SupabaseService>;

  beforeEach(() => {
    // Create a chainable query builder mock
    const createQueryBuilderChain = () => {
      const chain: any = {
        select: jasmine.createSpy('select'),
        eq: jasmine.createSpy('eq'),
        order: jasmine.createSpy('order'),
      };

      chain.select.and.returnValue(chain);
      chain.eq.and.returnValue(chain);
      chain.order.and.returnValue(Promise.resolve({ data: [], error: null }));

      return chain;
    };

    const supabaseClientMock = jasmine.createSpyObj('SupabaseClient', ['from']);
    supabaseClientMock.from.and.callFake(() => createQueryBuilderChain());

    supabaseMock = jasmine.createSpyObj('SupabaseService', ['getCurrentUser'], {
      client: supabaseClientMock,
    });

    TestBed.configureTestingModule({
      providers: [
        provideConfigMock(),
        ProductService,
        { provide: SupabaseService, useValue: supabaseMock },
      ],
    });
    service = TestBed.inject(ProductService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize with empty products', () => {
    expect(service.products()).toEqual([]);
  });

  it('should have loading signal', async () => {
    // Wait for initial load to complete
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(service.loading()).toBe(false);
  });

  it('should have error signal', () => {
    expect(service.error()).toBeNull();
  });

  it('should compute categories from products', () => {
    expect(service.categories()).toEqual([]);
  });
});
