-- ============================================================================
-- 10-create-functions.sql
-- Database functions and triggers for automation
-- ============================================================================
-- Execute after: 09-create-rls-policies.sql
-- ============================================================================

-- ============================================================================
-- FUNCTION 1: Update updated_at timestamp automatically
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables with updated_at column
DROP TRIGGER IF EXISTS update_materials_updated_at ON materials;
CREATE TRIGGER update_materials_updated_at
  BEFORE UPDATE ON materials
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_categories_updated_at ON categories;
CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_tags_updated_at ON tags;
CREATE TRIGGER update_tags_updated_at
  BEFORE UPDATE ON tags
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_product_images_updated_at ON product_images;
CREATE TRIGGER update_product_images_updated_at
  BEFORE UPDATE ON product_images
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_product_variants_updated_at ON product_variants;
CREATE TRIGGER update_product_variants_updated_at
  BEFORE UPDATE ON product_variants
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_reviews_updated_at ON reviews;
CREATE TRIGGER update_reviews_updated_at
  BEFORE UPDATE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_cart_items_updated_at ON cart_items;
CREATE TRIGGER update_cart_items_updated_at
  BEFORE UPDATE ON cart_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- FUNCTION 2: Update product average rating and review count
-- ============================================================================

CREATE OR REPLACE FUNCTION update_product_rating()
RETURNS TRIGGER AS $$
DECLARE
  product_id_to_update INTEGER;
BEGIN
  -- Determine which product to update
  IF TG_OP = 'DELETE' THEN
    product_id_to_update := OLD.product_id;
  ELSE
    product_id_to_update := NEW.product_id;
  END IF;

  -- Update the product's average_rating and review_count
  UPDATE products
  SET 
    average_rating = (
      SELECT AVG(rating)::NUMERIC(3,2)
      FROM reviews
      WHERE product_id = product_id_to_update
        AND is_approved = true
    ),
    review_count = (
      SELECT COUNT(*)::INTEGER
      FROM reviews
      WHERE product_id = product_id_to_update
        AND is_approved = true
    )
  WHERE id = product_id_to_update;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger after insert, update, or delete of reviews
DROP TRIGGER IF EXISTS update_product_rating_after_review_change ON reviews;
CREATE TRIGGER update_product_rating_after_review_change
  AFTER INSERT OR UPDATE OF rating, is_approved OR DELETE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_product_rating();

-- ============================================================================
-- FUNCTION 3: Ensure only one primary image per product
-- ============================================================================

CREATE OR REPLACE FUNCTION ensure_single_primary_image()
RETURNS TRIGGER AS $$
BEGIN
  -- If setting an image as primary, unset all other primary images for this product
  IF NEW.is_primary = true THEN
    UPDATE product_images
    SET is_primary = false
    WHERE product_id = NEW.product_id
      AND id != NEW.id
      AND is_primary = true;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger before insert or update of product_images
DROP TRIGGER IF EXISTS ensure_single_primary_image_trigger ON product_images;
CREATE TRIGGER ensure_single_primary_image_trigger
  BEFORE INSERT OR UPDATE OF is_primary ON product_images
  FOR EACH ROW
  WHEN (NEW.is_primary = true)
  EXECUTE FUNCTION ensure_single_primary_image();

-- ============================================================================
-- FUNCTION 4: Validate cart item constraints
-- ============================================================================

CREATE OR REPLACE FUNCTION validate_cart_item()
RETURNS TRIGGER AS $$
DECLARE
  product_available BOOLEAN;
  variant_available BOOLEAN;
  variant_belongs_to_product BOOLEAN;
BEGIN
  -- Check if product is available
  SELECT is_available INTO product_available
  FROM products
  WHERE id = NEW.product_id;

  IF NOT product_available THEN
    RAISE EXCEPTION 'Cannot add unavailable product to cart (product_id: %)', NEW.product_id;
  END IF;

  -- If variant is specified, validate it
  IF NEW.variant_id IS NOT NULL THEN
    -- Check if variant exists and is available
    SELECT is_available INTO variant_available
    FROM product_variants
    WHERE id = NEW.variant_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Variant does not exist (variant_id: %)', NEW.variant_id;
    END IF;

    IF NOT variant_available THEN
      RAISE EXCEPTION 'Cannot add unavailable variant to cart (variant_id: %)', NEW.variant_id;
    END IF;

    -- Check if variant belongs to the product
    SELECT EXISTS (
      SELECT 1 FROM product_variants
      WHERE id = NEW.variant_id AND product_id = NEW.product_id
    ) INTO variant_belongs_to_product;

    IF NOT variant_belongs_to_product THEN
      RAISE EXCEPTION 'Variant % does not belong to product %', NEW.variant_id, NEW.product_id;
    END IF;
  END IF;

  -- Quantity must be positive
  IF NEW.quantity <= 0 THEN
    RAISE EXCEPTION 'Cart item quantity must be positive (quantity: %)', NEW.quantity;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger before insert or update of cart_items
DROP TRIGGER IF EXISTS validate_cart_item_trigger ON cart_items;
CREATE TRIGGER validate_cart_item_trigger
  BEFORE INSERT OR UPDATE ON cart_items
  FOR EACH ROW
  EXECUTE FUNCTION validate_cart_item();

-- ============================================================================
-- FUNCTION 5: Snapshot product price when adding to cart
-- ============================================================================

CREATE OR REPLACE FUNCTION snapshot_cart_item_price()
RETURNS TRIGGER AS $$
DECLARE
  product_price INTEGER;
  variant_price_adjustment INTEGER;
BEGIN
  -- Get the product's current price
  SELECT price INTO product_price
  FROM products
  WHERE id = NEW.product_id;

  -- If variant is specified, get its price adjustment
  IF NEW.variant_id IS NOT NULL THEN
    SELECT COALESCE(price_adjustment, 0) INTO variant_price_adjustment
    FROM product_variants
    WHERE id = NEW.variant_id;
  ELSE
    variant_price_adjustment := 0;
  END IF;

  -- Calculate and store the snapshot price (only on INSERT, not UPDATE)
  IF TG_OP = 'INSERT' THEN
    NEW.price_snapshot := product_price + variant_price_adjustment;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger before insert of cart_items
DROP TRIGGER IF EXISTS snapshot_cart_item_price_trigger ON cart_items;
CREATE TRIGGER snapshot_cart_item_price_trigger
  BEFORE INSERT ON cart_items
  FOR EACH ROW
  EXECUTE FUNCTION snapshot_cart_item_price();

-- ============================================================================
-- FUNCTION 6: Prevent duplicate cart items (user + product + variant)
-- ============================================================================

CREATE OR REPLACE FUNCTION prevent_duplicate_cart_items()
RETURNS TRIGGER AS $$
DECLARE
  existing_item_id INTEGER;
BEGIN
  -- Check if cart item already exists (same user, product, and variant)
  SELECT id INTO existing_item_id
  FROM cart_items
  WHERE user_id = NEW.user_id
    AND product_id = NEW.product_id
    AND (
      (variant_id IS NULL AND NEW.variant_id IS NULL)
      OR variant_id = NEW.variant_id
    )
    AND id != COALESCE(NEW.id, 0);  -- Exclude current item on UPDATE

  IF FOUND THEN
    RAISE EXCEPTION 'Cart item already exists. Use UPDATE to change quantity. (existing_id: %)', existing_item_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger before insert or update of cart_items
DROP TRIGGER IF EXISTS prevent_duplicate_cart_items_trigger ON cart_items;
CREATE TRIGGER prevent_duplicate_cart_items_trigger
  BEFORE INSERT OR UPDATE ON cart_items
  FOR EACH ROW
  EXECUTE FUNCTION prevent_duplicate_cart_items();

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Query to verify all functions were created
SELECT 
  routine_schema,
  routine_name,
  routine_type,
  data_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'update_updated_at_column',
    'update_product_rating',
    'ensure_single_primary_image',
    'validate_cart_item',
    'snapshot_cart_item_price',
    'prevent_duplicate_cart_items'
  )
ORDER BY routine_name;

-- Query to verify all triggers were created
SELECT 
  trigger_schema,
  trigger_name,
  event_object_table,
  action_timing,
  event_manipulation
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND event_object_table IN (
    'materials', 'categories', 'tags', 'products',
    'product_images', 'product_variants', 'reviews', 'cart_items'
  )
ORDER BY event_object_table, trigger_name;

-- ============================================================================
-- NOTES
-- ============================================================================
-- Functions Summary:
-- 
-- 1. update_updated_at_column()
--    - Automatically updates updated_at timestamp on any UPDATE
--    - Applied to: materials, categories, tags, products, product_images,
--                  product_variants, reviews, cart_items
-- 
-- 2. update_product_rating()
--    - Recalculates average_rating and review_count for products
--    - Triggered by: INSERT, UPDATE (rating/is_approved), DELETE on reviews
--    - Only counts approved reviews
-- 
-- 3. ensure_single_primary_image()
--    - Ensures only one image is primary per product
--    - When setting an image as primary, unsets all others
--    - Triggered by: INSERT, UPDATE (is_primary) on product_images
-- 
-- 4. validate_cart_item()
--    - Validates product availability
--    - Validates variant availability and ownership
--    - Ensures quantity > 0
--    - Triggered by: INSERT, UPDATE on cart_items
-- 
-- 5. snapshot_cart_item_price()
--    - Captures product price + variant adjustment when adding to cart
--    - Prevents price changes from affecting existing cart items
--    - Triggered by: INSERT on cart_items (not UPDATE)
-- 
-- 6. prevent_duplicate_cart_items()
--    - Prevents duplicate (user + product + variant) combinations
--    - Forces using UPDATE to change quantity instead of INSERT
--    - Triggered by: INSERT, UPDATE on cart_items
-- 
-- Benefits:
-- - Data integrity: Automatic validation and consistency
-- - Performance: Denormalized rating/count updated automatically
-- - User experience: Price snapshots preserve cart accuracy
-- - Developer experience: Less manual validation code in application
-- 
-- Testing:
-- -- Test rating update
-- INSERT INTO reviews (product_id, user_id, rating, comment, is_approved) 
-- VALUES (1, 'user-uuid', 5, 'Great product!', true);
-- SELECT average_rating, review_count FROM products WHERE id = 1;
-- 
-- -- Test duplicate prevention
-- INSERT INTO cart_items (user_id, product_id, quantity) VALUES ('user-uuid', 1, 1);
-- INSERT INTO cart_items (user_id, product_id, quantity) VALUES ('user-uuid', 1, 1);  -- Should fail
-- ============================================================================
