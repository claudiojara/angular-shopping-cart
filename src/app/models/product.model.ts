/**
 * Product model for design lamps
 */
export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: string;
  rating: number;
  reviewCount: number;
  variants?: string[];
  badge?: string;
  material?: string;
}
