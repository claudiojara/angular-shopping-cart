import { TestBed } from '@angular/core/testing';
import { ProductService } from './product.service';

describe('ProductService', () => {
  let service: ProductService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ProductService]
    });
    service = TestBed.inject(ProductService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return all products', () => {
    const products = service.getProducts;
    expect(products().length).toBe(6);
  });

  it('should return product by id', () => {
    const product = service.getProductById(1);
    expect(product).toBeTruthy();
    expect(product?.id).toBe(1);
    expect(product?.name).toBe('Laptop Premium');
  });

  it('should return undefined for non-existent product', () => {
    const product = service.getProductById(999);
    expect(product).toBeUndefined();
  });

  it('should have all required product properties', () => {
    const products = service.getProducts;
    products().forEach((product: any) => {
      expect(product.id).toBeDefined();
      expect(product.name).toBeDefined();
      expect(product.description).toBeDefined();
      expect(product.price).toBeGreaterThan(0);
      expect(product.image).toBeDefined();
      expect(product.category).toBeDefined();
    });
  });

  it('should have products in correct categories', () => {
    const products = service.getProducts;
    const categories = products().map((p: any) => p.category);
    
    expect(categories).toContain('Electrónica');
    expect(categories).toContain('Audio');
    expect(categories).toContain('Móviles');
    expect(categories).toContain('Diseño');
    expect(categories).toContain('Wearables');
    expect(categories).toContain('Fotografía');
  });
});
