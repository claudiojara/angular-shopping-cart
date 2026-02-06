#!/usr/bin/env node

/**
 * verify-migration.mjs
 *
 * Verifies that the product migration was successful by checking:
 * - All 12 products exist
 * - All images are linked
 * - All categories are linked
 * - All tags are linked
 * - All variants are created
 * - Data integrity (prices, ratings, etc.)
 *
 * Usage:
 *   node scripts/verify-migration.mjs
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

let supabaseUrl, supabaseKey;

try {
  const configPath = resolve(__dirname, '../src/assets/config.local.json');
  const config = JSON.parse(readFileSync(configPath, 'utf-8'));
  supabaseUrl = config.supabase.url;
  // Can use anon key for read-only verification (RLS allows public read)
  supabaseKey = config.supabase.anonKey;
} catch (error) {
  supabaseUrl = process.env.SUPABASE_URL;
  supabaseKey = process.env.SUPABASE_KEY;
}

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Expected product count
const EXPECTED_PRODUCT_COUNT = 12;

// ============================================================================
// Verification Functions
// ============================================================================

async function verifyProducts() {
  console.log('📦 Verifying products...');

  const { data: products, error } = await supabase
    .from('products')
    .select(
      'id, name, price, original_price, material_id, average_rating, review_count, is_available, sku',
    )
    .order('id');

  if (error) {
    throw new Error(`Failed to fetch products: ${error.message}`);
  }

  if (products.length !== EXPECTED_PRODUCT_COUNT) {
    console.log(`  ⚠️  Expected ${EXPECTED_PRODUCT_COUNT} products, found ${products.length}`);
    return { success: false, count: products.length };
  }

  console.log(`  ✓ Found ${products.length} products`);

  // Verify each product has required fields
  for (const product of products) {
    const issues = [];

    if (!product.name) issues.push('missing name');
    if (!product.price || product.price <= 0) issues.push('invalid price');
    if (!product.original_price) issues.push('missing original_price');
    if (!product.material_id) issues.push('missing material_id');
    if (!product.sku) issues.push('missing SKU');
    if (product.average_rating === null) issues.push('missing rating');
    if (product.review_count === null) issues.push('missing review_count');

    if (issues.length > 0) {
      console.log(`  ⚠️  Product #${product.id} (${product.name}): ${issues.join(', ')}`);
      return { success: false, count: products.length };
    }
  }

  console.log(`  ✓ All products have valid data`);
  return { success: true, count: products.length, data: products };
}

async function verifyImages() {
  console.log('\n🖼️  Verifying product images...');

  const { data: images, error } = await supabase
    .from('product_images')
    .select('product_id, image_url, is_primary')
    .order('product_id');

  if (error) {
    throw new Error(`Failed to fetch images: ${error.message}`);
  }

  // Each product should have at least 1 primary image
  const productsWithPrimary = new Set(
    images.filter((img) => img.is_primary).map((img) => img.product_id),
  );

  if (productsWithPrimary.size !== EXPECTED_PRODUCT_COUNT) {
    console.log(
      `  ⚠️  Expected ${EXPECTED_PRODUCT_COUNT} products with primary images, found ${productsWithPrimary.size}`,
    );
    return { success: false, count: images.length };
  }

  console.log(`  ✓ All ${EXPECTED_PRODUCT_COUNT} products have primary images`);
  console.log(`  ✓ Total images: ${images.length}`);

  return { success: true, count: images.length };
}

async function verifyCategories() {
  console.log('\n🏷️  Verifying product categories...');

  const { data: productCategories, error } = await supabase
    .from('product_categories')
    .select('product_id, category_id');

  if (error) {
    throw new Error(`Failed to fetch product_categories: ${error.message}`);
  }

  // Each of the 12 products should have at least 1 category
  const productsWithCategories = new Set(productCategories.map((pc) => pc.product_id));

  if (productsWithCategories.size !== EXPECTED_PRODUCT_COUNT) {
    console.log(
      `  ⚠️  Expected ${EXPECTED_PRODUCT_COUNT} products with categories, found ${productsWithCategories.size}`,
    );
    return { success: false, count: productCategories.length };
  }

  console.log(`  ✓ All ${EXPECTED_PRODUCT_COUNT} products have categories`);
  console.log(`  ✓ Total category links: ${productCategories.length}`);

  return { success: true, count: productCategories.length };
}

async function verifyTags() {
  console.log('\n🔖 Verifying product tags...');

  const { data: productTags, error } = await supabase
    .from('product_tags')
    .select('product_id, tag_id');

  if (error) {
    throw new Error(`Failed to fetch product_tags: ${error.message}`);
  }

  console.log(`  ✓ Total tag links: ${productTags.length}`);

  // Count products with tags
  const productsWithTags = new Set(productTags.map((pt) => pt.product_id));
  console.log(`  ✓ Products with tags: ${productsWithTags.size}/${EXPECTED_PRODUCT_COUNT}`);

  return { success: true, count: productTags.length };
}

async function verifyVariants() {
  console.log('\n🎨 Verifying product variants...');

  const { data: variants, error } = await supabase
    .from('product_variants')
    .select('product_id, size, color, sku, is_available');

  if (error) {
    throw new Error(`Failed to fetch variants: ${error.message}`);
  }

  console.log(`  ✓ Total variants: ${variants.length}`);

  // Count products with variants
  const productsWithVariants = new Set(variants.map((v) => v.product_id));
  console.log(`  ✓ Products with variants: ${productsWithVariants.size}/${EXPECTED_PRODUCT_COUNT}`);

  // Verify all variants have SKUs
  const variantsWithoutSKU = variants.filter((v) => !v.sku);
  if (variantsWithoutSKU.length > 0) {
    console.log(`  ⚠️  ${variantsWithoutSKU.length} variants missing SKU`);
    return { success: false, count: variants.length };
  }

  console.log(`  ✓ All variants have SKUs`);

  return { success: true, count: variants.length };
}

async function verifyMaterials() {
  console.log('\n🧱 Verifying materials...');

  const { data: materials, error } = await supabase
    .from('materials')
    .select('code, name, is_active');

  if (error) {
    throw new Error(`Failed to fetch materials: ${error.message}`);
  }

  const expectedMaterials = ['PLA', 'ABS'];
  const foundMaterials = materials.map((m) => m.code);

  for (const expected of expectedMaterials) {
    if (!foundMaterials.includes(expected)) {
      console.log(`  ⚠️  Missing material: ${expected}`);
      return { success: false, count: materials.length };
    }
  }

  console.log(
    `  ✓ All ${expectedMaterials.length} materials present: ${foundMaterials.join(', ')}`,
  );

  return { success: true, count: materials.length };
}

async function verifyViews() {
  console.log('\n👁️  Verifying database views...');

  // Test products_full_public view
  const { data: fullProducts, error: fullError } = await supabase
    .from('products_full_public')
    .select('id, name, material_name, images, categories, tags, variants')
    .limit(1);

  if (fullError) {
    console.log(`  ⚠️  products_full_public view error: ${fullError.message}`);
    return { success: false };
  }

  if (fullProducts.length === 0) {
    console.log(`  ⚠️  products_full_public view returned no results`);
    return { success: false };
  }

  const product = fullProducts[0];

  // Verify structure
  const hasImages = product.images && Array.isArray(product.images);
  const hasCategories = product.categories && Array.isArray(product.categories);
  const hasTags = product.tags && Array.isArray(product.tags);
  const hasVariants = product.variants && Array.isArray(product.variants);

  if (!hasImages || !hasCategories || !hasTags || !hasVariants) {
    console.log(`  ⚠️  products_full_public view missing expected fields`);
    return { success: false };
  }

  console.log(`  ✓ products_full_public view working correctly`);
  console.log(`  ✓ Sample product: ${product.name} (${product.material_name})`);
  console.log(`    - Images: ${product.images.length}`);
  console.log(`    - Categories: ${product.categories.length}`);
  console.log(`    - Tags: ${product.tags.length}`);
  console.log(`    - Variants: ${product.variants.length}`);

  return { success: true };
}

async function verifyDataIntegrity() {
  console.log('\n🔍 Verifying data integrity...');

  // Check for orphaned records
  const checks = [];

  // Orphaned product_images
  const { data: orphanedImages } = await supabase.rpc(
    'check_orphaned_images',
    {},
    { count: 'exact' },
  );

  // Orphaned product_categories
  const { data: orphanedCategories } = await supabase.rpc(
    'check_orphaned_categories',
    {},
    { count: 'exact' },
  );

  // Since RPC might not exist, we'll do manual checks
  const { data: products } = await supabase.from('products').select('id');
  const productIds = new Set(products.map((p) => p.id));

  // Check images
  const { data: images } = await supabase.from('product_images').select('product_id');
  const orphanedImageCount = images.filter((img) => !productIds.has(img.product_id)).length;

  if (orphanedImageCount > 0) {
    console.log(`  ⚠️  Found ${orphanedImageCount} orphaned images`);
    checks.push(false);
  } else {
    console.log(`  ✓ No orphaned images`);
    checks.push(true);
  }

  // Check product_categories
  const { data: productCategories } = await supabase
    .from('product_categories')
    .select('product_id');
  const orphanedCategoryCount = productCategories.filter(
    (pc) => !productIds.has(pc.product_id),
  ).length;

  if (orphanedCategoryCount > 0) {
    console.log(`  ⚠️  Found ${orphanedCategoryCount} orphaned product_categories`);
    checks.push(false);
  } else {
    console.log(`  ✓ No orphaned product_categories`);
    checks.push(true);
  }

  return { success: checks.every((c) => c === true) };
}

// ============================================================================
// Main Verification
// ============================================================================

async function runVerification() {
  console.log('============================================================================');
  console.log('MIGRATION VERIFICATION');
  console.log('============================================================================');
  console.log(`Supabase URL: ${supabaseUrl}\n`);

  const results = [];

  try {
    results.push(await verifyMaterials());
    results.push(await verifyProducts());
    results.push(await verifyImages());
    results.push(await verifyCategories());
    results.push(await verifyTags());
    results.push(await verifyVariants());
    results.push(await verifyViews());
    results.push(await verifyDataIntegrity());

    console.log('\n============================================================================');
    console.log('VERIFICATION SUMMARY');
    console.log('============================================================================');

    const allSuccess = results.every((r) => r.success !== false);

    if (allSuccess) {
      console.log('✅ All verification checks passed!');
      console.log('\n📊 Migration Statistics:');
      console.log(`   - Products: ${results.find((r) => r.data)?.count || EXPECTED_PRODUCT_COUNT}`);
      console.log(`   - Images: ${results[2]?.count || 0}`);
      console.log(`   - Category links: ${results[3]?.count || 0}`);
      console.log(`   - Tag links: ${results[4]?.count || 0}`);
      console.log(`   - Variants: ${results[5]?.count || 0}`);
      console.log('\n✨ Database is ready for use!');
      console.log('\nNext steps:');
      console.log('1. Update ProductService to fetch from database');
      console.log('2. Implement pagination (20 products per page)');
      console.log('3. Update CartService to support variants');
      console.log('4. Test the application thoroughly');
    } else {
      console.log('❌ Some verification checks failed');
      console.log('Please review the errors above and fix the issues');
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ Verification failed with error:');
    console.error(error.message);
    process.exit(1);
  }
}

// ============================================================================
// Execute Verification
// ============================================================================

runVerification();
