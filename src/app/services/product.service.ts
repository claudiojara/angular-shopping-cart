import { Injectable, signal } from '@angular/core';
import { Product } from '../models/product.model';

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  private products = signal<Product[]>([
    {
      id: 1,
      name: 'Laptop Premium',
      description: 'Laptop de alto rendimiento con procesador de última generación',
      price: 1299.99,
      image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400',
      category: 'Electrónica',
    },
    {
      id: 2,
      name: 'Auriculares Bluetooth',
      description: 'Auriculares inalámbricos con cancelación de ruido activa',
      price: 249.99,
      image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400',
      category: 'Audio',
    },
    {
      id: 3,
      name: 'Smartphone Pro',
      description: 'Teléfono inteligente con cámara profesional y 5G',
      price: 899.99,
      image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400',
      category: 'Móviles',
    },
    {
      id: 4,
      name: 'Tablet Gráfica',
      description: 'Tablet para diseño digital con stylus incluido',
      price: 599.99,
      image: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400',
      category: 'Diseño',
    },
    {
      id: 5,
      name: 'Smartwatch Elite',
      description: 'Reloj inteligente con monitoreo de salud avanzado',
      price: 349.99,
      image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400',
      category: 'Wearables',
    },
    {
      id: 6,
      name: 'Cámara Mirrorless',
      description: 'Cámara profesional 4K con lentes intercambiables',
      price: 1599.99,
      image: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=400',
      category: 'Fotografía',
    },
  ]);

  getProducts = this.products.asReadonly();

  getProductById(id: number): Product | undefined {
    return this.products().find((product) => product.id === id);
  }
}
