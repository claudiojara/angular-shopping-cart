import { Injectable, signal } from '@angular/core';
import { Product } from '../models/product.model';

/**
 * Product service providing lamp catalog
 * All products are design lamps inspired by minimalist aesthetics
 * Images from Unsplash - optimized for web performance
 */
@Injectable({
  providedIn: 'root',
})
export class ProductService {
  private products = signal<Product[]>([
    {
      id: 1,
      name: 'Lunora',
      description:
        'Lámpara de mesa impresa en 3D con diseño geométrico. Luz cálida perfecta para crear ambientes acogedores.',
      price: 30166,
      originalPrice: 35490,
      image:
        'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=600&h=600&fit=crop&q=80',
      category: 'Lámparas de Mesa',
      rating: 5.0,
      reviewCount: 3,
      variants: ['+4', '+6'],
      badge: '-15%',
      material: 'PLA',
    },
    {
      id: 2,
      name: 'Velora',
      description:
        'Lámpara decorativa de luz cálida ideal para mesas y veladores. Diseño orgánico inspirado en formas naturales.',
      price: 25491,
      originalPrice: 29990,
      image:
        'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=600&h=600&fit=crop&q=80',
      category: 'Lámparas de Velador',
      rating: 5.0,
      reviewCount: 7,
      variants: ['+2', '+4'],
      badge: '-15%',
      material: 'PLA',
    },
    {
      id: 3,
      name: 'Swoola',
      description:
        'Lámpara de mesa con estilo nórdico. Elegante y funcional, perfecta para espacios modernos.',
      price: 31016,
      originalPrice: 36490,
      image:
        'https://images.unsplash.com/photo-1517991104123-1d56a6e81ed9?w=600&h=600&fit=crop&q=80',
      category: 'Lámparas de Mesa',
      rating: 5.0,
      reviewCount: 2,
      variants: ['+1', '+3'],
      badge: '-15%',
      material: 'PLA',
    },
    {
      id: 4,
      name: 'Prism',
      description:
        'Lámpara de mesa y velador con diseño prismático único. Crea efectos de luz espectaculares.',
      price: 30591,
      originalPrice: 35990,
      image:
        'https://images.unsplash.com/photo-1565814329452-e1efa11c5b89?w=600&h=600&fit=crop&q=80',
      category: 'Lámparas de Velador',
      rating: 4.8,
      reviewCount: 5,
      variants: ['+2'],
      badge: '-15%',
      material: 'PLA',
    },
    {
      id: 5,
      name: 'Brimora',
      description:
        'Lámpara vanguardista de diseño contemporáneo. Pieza de conversación para espacios audaces.',
      price: 29316,
      originalPrice: 34490,
      image:
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=600&fit=crop&q=80',
      category: 'Lámparas de Mesa',
      rating: 5.0,
      reviewCount: 3,
      badge: '-15%',
      material: 'ABS',
    },
    {
      id: 6,
      name: 'Fold',
      description: 'Lámpara moderna con diseño plegable inspirado en origami. Ligera y versátil.',
      price: 28891,
      originalPrice: 33990,
      image: 'https://images.unsplash.com/photo-1543198126-a8ad8e47fb22?w=600&h=600&fit=crop&q=80',
      category: 'Colección Líneas',
      rating: 4.9,
      reviewCount: 4,
      variants: ['+2'],
      badge: '-15%',
      material: 'PLA',
    },
    {
      id: 7,
      name: 'Lumis',
      description:
        'Lámpara de mesa y velador con diseño cilíndrico elegante. Iluminación difusa perfecta.',
      price: 26341,
      originalPrice: 30990,
      image:
        'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=600&h=600&fit=crop&q=80',
      category: 'Lámparas de Velador',
      rating: 5.0,
      reviewCount: 2,
      variants: ['+1'],
      badge: '-15%',
      material: 'PLA',
    },
    {
      id: 8,
      name: 'Lunor',
      description: 'Lámpara decorativa de luz cálida para mesas y veladores. Diseño atemporal.',
      price: 25066,
      originalPrice: 29490,
      image:
        'https://images.unsplash.com/photo-1517991104123-1d56a6e81ed9?w=600&h=600&fit=crop&q=80',
      category: 'Lámparas de Mesa',
      rating: 4.7,
      reviewCount: 8,
      variants: ['+2', '+4'],
      badge: '-15%',
      material: 'PLA',
    },
    {
      id: 9,
      name: 'Luvia',
      description:
        'Lámpara de mesa inspirada en las lámparas de lava. Efecto visual relajante y único.',
      price: 25066,
      originalPrice: 29490,
      image:
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=600&fit=crop&q=80',
      category: 'Colección Malla',
      rating: 5.0,
      reviewCount: 5,
      variants: ['+5', '+7'],
      badge: '-15%',
      material: 'PLA',
    },
    {
      id: 10,
      name: 'Aluma',
      description: 'Lámpara de mesa elegante y atemporal. Diseño clásico con toque moderno.',
      price: 24641,
      originalPrice: 28990,
      image:
        'https://images.unsplash.com/photo-1565814329452-e1efa11c5b89?w=600&h=600&fit=crop&q=80',
      category: 'Lámparas de Mesa',
      rating: 5.0,
      reviewCount: 3,
      variants: ['+3', '+5'],
      badge: '-15%',
      material: 'PLA',
    },
    {
      id: 11,
      name: 'Orlo',
      description: 'Lámpara decorativa de luz cálida para mesas y veladores. Diseño escandinavo.',
      price: 24216,
      originalPrice: 28490,
      image:
        'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=600&h=600&fit=crop&q=80',
      category: 'Colección Líneas',
      rating: 5.0,
      reviewCount: 6,
      variants: ['+1', '+3'],
      badge: '-15%',
      material: 'PLA',
    },
    {
      id: 12,
      name: 'Lunari',
      description: 'Lámpara minimalista con diseño limpio. Perfecta para espacios contemporáneos.',
      price: 21666,
      originalPrice: 25490,
      image: 'https://images.unsplash.com/photo-1543198126-a8ad8e47fb22?w=600&h=600&fit=crop&q=80',
      category: 'Edición Limitada',
      rating: 5.0,
      reviewCount: 5,
      badge: '-15%',
      material: 'ABS',
    },
  ]);

  readonly getProducts = this.products.asReadonly();

  getProductById(id: number): Product | undefined {
    return this.products().find((product) => product.id === id);
  }

  getCategories(): string[] {
    const categories = new Set(this.products().map((p) => p.category));
    return Array.from(categories);
  }

  getProductsByCategory(category: string): Product[] {
    return this.products().filter((p) => p.category === category);
  }
}
