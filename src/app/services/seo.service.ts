import { Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { SeoConfig, SchemaConfig } from '../models/seo-config.model';

/**
 * Service for managing SEO meta tags and structured data
 * Implements dynamic SEO updates for Angular SPA
 */
@Injectable({
  providedIn: 'root',
})
export class SeoService {
  private meta = inject(Meta);
  private title = inject(Title);

  private readonly defaultConfig: SeoConfig = {
    title: 'Forja del Destino - Lámparas de Diseño Minimalista | Impresas en 3D Chile',
    description:
      'Descubre nuestra colección de lámparas de diseño minimalista impresas en 3D. Ilumina tus espacios con piezas únicas, sostenibles y hechas en Chile. Envío gratis en compras sobre $45.000.',
    keywords: [
      'lámparas de diseño',
      'lámparas minimalistas',
      'lámparas 3D',
      'iluminación decorativa',
      'veladores modernos',
      'decoración Chile',
      'lámparas impresas 3D',
    ],
    type: 'website',
  };

  /**
   * Update page title and all meta tags
   */
  updateSeo(config: Partial<SeoConfig> = {}): void {
    const mergedConfig = { ...this.defaultConfig, ...config };

    this.updateTitle(mergedConfig.title);
    this.updateDescription(mergedConfig.description);
    this.updateKeywords(mergedConfig.keywords);
    this.updateOpenGraph(mergedConfig);
    this.updateTwitterCard(mergedConfig);

    if (mergedConfig.canonicalUrl) {
      this.updateCanonicalUrl(mergedConfig.canonicalUrl);
    }

    if (mergedConfig.noindex) {
      this.meta.updateTag({ name: 'robots', content: 'noindex, nofollow' });
    } else {
      this.meta.removeTag("name='robots'");
    }
  }

  /**
   * Update page title with brand suffix
   */
  updateTitle(pageTitle: string): void {
    const fullTitle = pageTitle.includes('Forja del Destino')
      ? pageTitle
      : `${pageTitle} | Forja del Destino`;
    this.title.setTitle(fullTitle);
    this.meta.updateTag({ property: 'og:title', content: fullTitle });
    this.meta.updateTag({ name: 'twitter:title', content: fullTitle });
  }

  /**
   * Update meta description
   */
  updateDescription(description: string): void {
    this.meta.updateTag({ name: 'description', content: description });
    this.meta.updateTag({ property: 'og:description', content: description });
    this.meta.updateTag({ name: 'twitter:description', content: description });
  }

  /**
   * Update meta keywords
   */
  updateKeywords(keywords?: string[]): void {
    if (keywords && keywords.length > 0) {
      this.meta.updateTag({ name: 'keywords', content: keywords.join(', ') });
    }
  }

  /**
   * Update Open Graph meta tags
   */
  private updateOpenGraph(config: SeoConfig): void {
    this.meta.updateTag({ property: 'og:type', content: config.type || 'website' });
    this.meta.updateTag({ property: 'og:site_name', content: 'Forja del Destino' });

    const image =
      config.image ||
      'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=1200&h=630&fit=crop';
    this.meta.updateTag({ property: 'og:image', content: image });
    this.meta.updateTag({ property: 'og:image:width', content: '1200' });
    this.meta.updateTag({ property: 'og:image:height', content: '630' });
    this.meta.updateTag({ property: 'og:locale', content: 'es_CL' });
  }

  /**
   * Update Twitter Card meta tags
   */
  private updateTwitterCard(config: SeoConfig): void {
    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:site', content: '@lumina_cl' });

    const image =
      config.image ||
      'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=1200&h=630&fit=crop';
    this.meta.updateTag({ name: 'twitter:image', content: image });
  }

  /**
   * Update canonical URL
   */
  updateCanonicalUrl(url: string): void {
    // Remove existing canonical link if any
    const existingCanonical = document.querySelector('link[rel="canonical"]');
    if (existingCanonical) {
      existingCanonical.remove();
    }

    // Create and append new canonical link
    const link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    link.setAttribute('href', url);
    document.head.appendChild(link);
  }

  /**
   * Add JSON-LD structured data
   */
  addStructuredData(schema: SchemaConfig): void {
    // Remove existing structured data with same type
    const existingScript = document.querySelector(`script[data-schema-type="${schema['@type']}"]`);
    if (existingScript) {
      existingScript.remove();
    }

    const script = document.createElement('script');
    script.setAttribute('type', 'application/ld+json');
    script.setAttribute('data-schema-type', schema['@type']);
    script.textContent = JSON.stringify(schema);
    document.head.appendChild(script);
  }

  /**
   * Remove structured data by type
   */
  removeStructuredData(type: string): void {
    const existingScript = document.querySelector(`script[data-schema-type="${type}"]`);
    if (existingScript) {
      existingScript.remove();
    }
  }

  /**
   * Add Organization structured data
   */
  addOrganizationSchema(): void {
    const organizationSchema = {
      '@context': 'https://schema.org',
      '@type': 'Organization' as const,
      name: 'Forja del Destino',
      url: 'https://lumina.cl',
      logo: 'https://lumina.cl/assets/logo.svg',
      description: 'Lámparas de diseño minimalista impresas en 3D. Piezas únicas hechas en Chile.',
      contactPoint: {
        '@type': 'ContactPoint',
        telephone: '+56-9-XXXX-XXXX',
        contactType: 'customer service',
        areaServed: 'CL',
        availableLanguage: 'Spanish',
      },
      sameAs: ['https://www.instagram.com/lumina.cl', 'https://www.facebook.com/lumina.cl'],
    };

    this.addStructuredData(organizationSchema as SchemaConfig);
  }

  /**
   * Add Product structured data for a product
   */
  addProductSchema(product: {
    id: number;
    name: string;
    description: string;
    price: number;
    originalPrice?: number;
    image: string;
    rating: number;
    reviewCount: number;
  }): void {
    const productSchema = {
      '@context': 'https://schema.org',
      '@type': 'Product' as const,
      name: product.name,
      image: product.image,
      description: product.description,
      brand: {
        '@type': 'Brand',
        name: 'Forja del Destino',
      },
      offers: {
        '@type': 'Offer',
        url: `https://lumina.cl/products/${product.id}`,
        price: product.price.toString(),
        priceCurrency: 'CLP',
        priceValidUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0],
        availability: 'https://schema.org/InStock',
        itemCondition: 'https://schema.org/NewCondition',
        ...(product.originalPrice && {
          priceSpecification: {
            '@type': 'PriceSpecification',
            price: product.originalPrice.toString(),
            priceCurrency: 'CLP',
          },
        }),
      },
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: product.rating.toString(),
        reviewCount: product.reviewCount.toString(),
        bestRating: '5',
        worstRating: '1',
      },
    };

    this.addStructuredData(productSchema as SchemaConfig);
  }

  /**
   * Add WebSite structured data for search
   */
  addWebSiteSchema(): void {
    const webSiteSchema = {
      '@context': 'https://schema.org',
      '@type': 'WebSite' as const,
      name: 'Forja del Destino - Lámparas de Diseño',
      url: 'https://lumina.cl',
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: 'https://lumina.cl/products?search={search_term_string}',
        },
        'query-input': 'required name=search_term_string',
      },
    };

    this.addStructuredData(webSiteSchema as SchemaConfig);
  }

  /**
   * Reset to default SEO configuration
   */
  resetToDefault(): void {
    this.updateSeo(this.defaultConfig);
  }
}
