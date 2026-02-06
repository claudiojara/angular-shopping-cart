/**
 * Product model for design lamps
 * Aligned with Supabase database schema
 */
export interface Product {
  id: number;
  name: string;
  slug: string;
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
  sku?: string;
  stockQuantity?: number;
  isAvailable?: boolean;
  isFeatured?: boolean;
}

/**
 * Database response from products_full_public view
 */
export interface ProductFromDB {
  id: number;
  name: string;
  slug: string;
  description: string;
  short_description: string | null;
  price: number;
  original_price: number | null;
  sku: string | null;
  stock_quantity: number;
  low_stock_threshold: number;
  average_rating: number;
  review_count: number;
  is_available: boolean;
  is_featured: boolean;
  material_name: string | null;
  material_code: string | null;
  images: Array<{
    image_url: string;
    alt_text: string | null;
    is_primary: boolean;
  }>;
  categories: Array<{
    category_id: number;
    name: string;
    slug: string;
  }>;
  tags: Array<{
    tag_id: number;
    name: string;
    slug: string;
  }>;
  variants: Array<{
    id: number;
    size: string | null;
    color: string | null;
    price_adjustment: number;
    stock_quantity: number;
    sku: string | null;
  }>;
  created_at: string;
  updated_at: string;
}
