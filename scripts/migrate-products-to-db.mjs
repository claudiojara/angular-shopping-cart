#!/usr/bin/env node

/**
 * migrate-products-to-db.mjs
 *
 * Migrates the 12 hardcoded products from ProductService to Supabase database.
 *
 * Prerequisites:
 * - SQL scripts 01-12 must be executed first
 * - Supabase credentials in .env or config.local.json
 *
 * Usage:
 *   node scripts/migrate-products-to-db.mjs
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ============================================================================
// Load Configuration
// ============================================================================

let supabaseUrl, supabaseServiceRoleKey;

try {
  // Try to load from config.local.json first (development)
  const configPath = resolve(__dirname, '../src/assets/config.local.json');
  const config = JSON.parse(readFileSync(configPath, 'utf-8'));
  supabaseUrl = config.supabase.url;
  // For migration, we need service_role key (has admin access, bypasses RLS)
  supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || config.supabase.serviceRoleKey;
} catch (error) {
  // Fallback to environment variables
  supabaseUrl = process.env.SUPABASE_URL;
  supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
}

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Error: Missing Supabase credentials');
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables');
  console.error('Or add serviceRoleKey to src/assets/config.local.json');
  process.exit(1);
}

// Create Supabase client with service_role key (bypasses RLS)
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

// ============================================================================
// Product Data (from ProductService)
// ============================================================================

const products = [
  {
    id: 1,
    name: 'Lunora',
    description:
      'Lámpara de mesa impresa en 3D con diseño geométrico. Luz cálida perfecta para crear ambientes acogedores.',
    price: 30166,
    originalPrice: 35490,
    image: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=600&h=600&fit=crop&q=80',
    category: 'Lámparas de Mesa',
    rating: 5.0,
    reviewCount: 3,
    variants: ['+4', '+6'],
    badge: '-15%',
    material: 'PLA',
    tags: ['geométrico', 'moderno', 'iluminación-ambiental'],
  },
  {
    id: 2,
    name: 'Velora',
    description:
      'Lámpara decorativa de luz cálida ideal para mesas y veladores. Diseño orgánico inspirado en formas naturales.',
    price: 25491,
    originalPrice: 29990,
    image: 'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=600&h=600&fit=crop&q=80',
    category: 'Lámparas de Velador',
    rating: 5.0,
    reviewCount: 7,
    variants: ['+2', '+4'],
    badge: '-15%',
    material: 'PLA',
    tags: ['orgánico', 'elegante', 'compacto'],
  },
  {
    id: 3,
    name: 'Swoola',
    description:
      'Lámpara de mesa con estilo nórdico. Elegante y funcional, perfecta para espacios modernos.',
    price: 31016,
    originalPrice: 36490,
    image: 'https://images.unsplash.com/photo-1517991104123-1d56a6e81ed9?w=600&h=600&fit=crop&q=80',
    category: 'Lámparas de Mesa',
    rating: 5.0,
    reviewCount: 2,
    variants: ['+1', '+3'],
    badge: '-15%',
    material: 'PLA',
    tags: ['escandinavo', 'elegante', 'moderno'],
  },
  {
    id: 4,
    name: 'Prism',
    description:
      'Lámpara de mesa y velador con diseño prismático único. Crea efectos de luz espectaculares.',
    price: 30591,
    originalPrice: 35990,
    image: 'https://images.unsplash.com/photo-1565814329452-e1efa11c5b89?w=600&h=600&fit=crop&q=80',
    category: 'Lámparas de Velador',
    rating: 4.8,
    reviewCount: 5,
    variants: ['+2'],
    badge: '-15%',
    material: 'PLA',
    tags: ['geométrico', 'futurista', 'compacto'],
  },
  {
    id: 5,
    name: 'Brimora',
    description:
      'Lámpara vanguardista de diseño contemporáneo. Pieza de conversación para espacios audaces.',
    price: 29316,
    originalPrice: 34490,
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=600&fit=crop&q=80',
    category: 'Lámparas de Mesa',
    rating: 5.0,
    reviewCount: 3,
    badge: '-15%',
    material: 'ABS',
    tags: ['futurista', 'moderno', 'artesanal'],
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
    tags: ['minimalista', 'geométrico', 'moderno'],
  },
  {
    id: 7,
    name: 'Lumis',
    description:
      'Lámpara de mesa y velador con diseño cilíndrico elegante. Iluminación difusa perfecta.',
    price: 26341,
    originalPrice: 30990,
    image: 'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=600&h=600&fit=crop&q=80',
    category: 'Lámparas de Velador',
    rating: 5.0,
    reviewCount: 2,
    variants: ['+1'],
    badge: '-15%',
    material: 'PLA',
    tags: ['elegante', 'minimalista', 'compacto'],
  },
  {
    id: 8,
    name: 'Lunor',
    description: 'Lámpara decorativa de luz cálida para mesas y veladores. Diseño atemporal.',
    price: 25066,
    originalPrice: 29490,
    image: 'https://images.unsplash.com/photo-1517991104123-1d56a6e81ed9?w=600&h=600&fit=crop&q=80',
    category: 'Lámparas de Mesa',
    rating: 4.7,
    reviewCount: 8,
    variants: ['+2', '+4'],
    badge: '-15%',
    material: 'PLA',
    tags: ['elegante', 'iluminación-ambiental'],
  },
  {
    id: 9,
    name: 'Luvia',
    description:
      'Lámpara de mesa inspirada en las lámparas de lava. Efecto visual relajante y único.',
    price: 25066,
    originalPrice: 29490,
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=600&fit=crop&q=80',
    category: 'Colección Malla',
    rating: 5.0,
    reviewCount: 5,
    variants: ['+5', '+7'],
    badge: '-15%',
    material: 'PLA',
    tags: ['orgánico', 'texturizado', 'artesanal'],
  },
  {
    id: 10,
    name: 'Aluma',
    description: 'Lámpara de mesa elegante y atemporal. Diseño clásico con toque moderno.',
    price: 24641,
    originalPrice: 28990,
    image: 'https://images.unsplash.com/photo-1565814329452-e1efa11c5b89?w=600&h=600&fit=crop&q=80',
    category: 'Lámparas de Mesa',
    rating: 5.0,
    reviewCount: 3,
    variants: ['+3', '+5'],
    badge: '-15%',
    material: 'PLA',
    tags: ['elegante', 'moderno'],
  },
  {
    id: 11,
    name: 'Orlo',
    description: 'Lámpara decorativa de luz cálida para mesas y veladores. Diseño escandinavo.',
    price: 24216,
    originalPrice: 28490,
    image: 'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=600&h=600&fit=crop&q=80',
    category: 'Colección Líneas',
    rating: 5.0,
    reviewCount: 6,
    variants: ['+1', '+3'],
    badge: '-15%',
    material: 'PLA',
    tags: ['escandinavo', 'minimalista', 'iluminación-ambiental'],
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
    tags: ['minimalista', 'moderno', 'elegante'],
  },
];

// ============================================================================
// Helper Functions
// ============================================================================

function generateSKU(name, id) {
  const prefix = name.substring(0, 3).toUpperCase();
  const padded = String(id).padStart(4, '0');
  return `${prefix}-${padded}`;
}

function calculateIsFeatured(rating, reviewCount) {
  // Featured if rating >= 4.9 AND reviewCount >= 5
  return rating >= 4.9 && reviewCount >= 5;
}

function generateStockQuantity(id) {
  // Random stock between 5-20 for demo purposes
  return Math.floor(Math.random() * 16) + 5;
}

function generateSlug(name) {
  // Convert product name to SEO-friendly slug
  return name
    .toLowerCase()
    .normalize('NFD') // Normalize to decomposed form
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

// ============================================================================
// Migration Functions
// ============================================================================

async function getMaterialId(materialCode) {
  const { data, error } = await supabase
    .from('materials')
    .select('id')
    .eq('code', materialCode)
    .single();

  if (error) throw new Error(`Failed to get material ${materialCode}: ${error.message}`);
  return data.id;
}

async function getCategoryId(categoryName) {
  const { data, error } = await supabase
    .from('categories')
    .select('id')
    .eq('name', categoryName)
    .single();

  if (error) throw new Error(`Failed to get category ${categoryName}: ${error.message}`);
  return data.id;
}

async function getTagId(tagName) {
  const { data, error } = await supabase.from('tags').select('id').eq('name', tagName).single();

  if (error) throw new Error(`Failed to get tag ${tagName}: ${error.message}`);
  return data.id;
}

async function insertProduct(product) {
  console.log(`\n📦 Migrating product #${product.id}: ${product.name}`);

  // Get material_id
  const materialId = await getMaterialId(product.material);
  console.log(`  ✓ Material: ${product.material} (ID: ${materialId})`);

  // Prepare product data
  const productData = {
    id: product.id,
    name: product.name,
    slug: generateSlug(product.name),
    description: product.description,
    price: product.price,
    original_price: product.originalPrice,
    material_id: materialId,
    is_available: true,
    is_featured: calculateIsFeatured(product.rating, product.reviewCount),
    average_rating: product.rating,
    review_count: product.reviewCount,
    stock_quantity: generateStockQuantity(product.id),
    sku: generateSKU(product.name, product.id),
  };

  // Insert product
  const { data: insertedProduct, error: productError } = await supabase
    .from('products')
    .insert(productData)
    .select()
    .single();

  if (productError) {
    throw new Error(`Failed to insert product ${product.name}: ${productError.message}`);
  }
  console.log(`  ✓ Product inserted (SKU: ${productData.sku})`);

  // Insert primary image
  const { error: imageError } = await supabase.from('product_images').insert({
    product_id: insertedProduct.id,
    image_url: product.image,
    alt_text: `${product.name} - Lámpara 3D`,
    is_primary: true,
    display_order: 1,
  });

  if (imageError) {
    throw new Error(`Failed to insert image for ${product.name}: ${imageError.message}`);
  }
  console.log(`  ✓ Primary image added`);

  // Link to category
  const categoryId = await getCategoryId(product.category);
  const { error: categoryError } = await supabase.from('product_categories').insert({
    product_id: insertedProduct.id,
    category_id: categoryId,
  });

  if (categoryError) {
    throw new Error(`Failed to link category for ${product.name}: ${categoryError.message}`);
  }
  console.log(`  ✓ Category linked: ${product.category} (ID: ${categoryId})`);

  // Link to tags
  if (product.tags && product.tags.length > 0) {
    const tagLinks = [];
    for (const tagName of product.tags) {
      const tagId = await getTagId(tagName);
      tagLinks.push({
        product_id: insertedProduct.id,
        tag_id: tagId,
      });
    }

    const { error: tagsError } = await supabase.from('product_tags').insert(tagLinks);

    if (tagsError) {
      throw new Error(`Failed to link tags for ${product.name}: ${tagsError.message}`);
    }
    console.log(`  ✓ Tags linked: ${product.tags.join(', ')}`);
  }

  // Create variants (interpret variants array as size options)
  if (product.variants && product.variants.length > 0) {
    const variantRecords = product.variants.map((variant, index) => ({
      product_id: insertedProduct.id,
      size: variant, // e.g., "+4", "+6"
      color: null, // No color variants in original data
      price_adjustment: 0, // No price difference in original data
      stock_quantity: generateStockQuantity(product.id),
      sku: `${productData.sku}-${variant.replace('+', 'V')}`,
      is_available: true,
    }));

    const { error: variantsError } = await supabase.from('product_variants').insert(variantRecords);

    if (variantsError) {
      throw new Error(`Failed to insert variants for ${product.name}: ${variantsError.message}`);
    }
    console.log(`  ✓ Variants created: ${product.variants.join(', ')}`);
  }

  console.log(`✅ Product ${product.name} migrated successfully\n`);
}

async function migrateAllProducts() {
  console.log('============================================================================');
  console.log('PRODUCT MIGRATION TO SUPABASE');
  console.log('============================================================================');
  console.log(`Products to migrate: ${products.length}`);
  console.log(`Supabase URL: ${supabaseUrl}`);
  console.log('');

  let successCount = 0;
  let failureCount = 0;

  for (const product of products) {
    try {
      await insertProduct(product);
      successCount++;
    } catch (error) {
      console.error(`❌ Failed to migrate product #${product.id}: ${product.name}`);
      console.error(`   Error: ${error.message}`);
      failureCount++;
    }
  }

  console.log('============================================================================');
  console.log('MIGRATION SUMMARY');
  console.log('============================================================================');
  console.log(`✅ Successful: ${successCount}/${products.length}`);
  console.log(`❌ Failed: ${failureCount}/${products.length}`);

  if (failureCount === 0) {
    console.log('\n🎉 All products migrated successfully!');
    console.log('\nNext steps:');
    console.log('1. Run verification: node scripts/verify-migration.mjs');
    console.log('2. Update Angular ProductService to fetch from database');
    console.log('3. Test product listing and details pages');
  } else {
    console.log('\n⚠️ Some products failed to migrate. Please review errors above.');
    process.exit(1);
  }
}

// ============================================================================
// Main Execution
// ============================================================================

migrateAllProducts().catch((error) => {
  console.error('\n❌ Fatal error during migration:');
  console.error(error);
  process.exit(1);
});
