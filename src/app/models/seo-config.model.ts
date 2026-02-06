/**
 * Configuration for SEO meta tags
 */
export interface SeoConfig {
  /** Page title (max 60 chars recommended) */
  title: string;

  /** Meta description (max 160 chars recommended) */
  description: string;

  /** Meta keywords (optional, not heavily weighted by search engines) */
  keywords?: string[];

  /** Open Graph / Twitter Card image URL */
  image?: string;

  /** Open Graph type */
  type?: 'website' | 'product' | 'article';

  /** Product price (for product pages) */
  price?: number;

  /** Product currency (for product pages) */
  currency?: string;

  /** Canonical URL (optional, defaults to current URL) */
  canonicalUrl?: string;

  /** Noindex flag (prevent search engine indexing) */
  noindex?: boolean;

  /** Nofollow flag (prevent search engines from following links) */
  nofollow?: boolean;
}

/**
 * Schema.org structured data types
 */
export type SchemaType = 'Product' | 'Organization' | 'WebSite' | 'BreadcrumbList';

/**
 * Schema.org structured data configuration
 */
export interface SchemaConfig {
  '@context': string;
  '@type': SchemaType;
  [key: string]: unknown;
}
