import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Database helper for direct Supabase operations in E2E tests
 * Bypasses the UI to ensure clean test state
 */

const SUPABASE_URL = 'https://owewtzddyykyraxkkorx.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_EMV7TVY9I85fSZndebqPRA_rFti1dM7';

let supabaseClient: SupabaseClient | null = null;

/**
 * Get or create Supabase client
 */
export function getSupabaseClient(): SupabaseClient {
  if (!supabaseClient) {
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return supabaseClient;
}

/**
 * Sign in a user and return the authenticated client
 */
export async function signInUser(email: string, password: string): Promise<SupabaseClient> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) {
    throw new Error(`Failed to sign in: ${error?.message || 'Unknown error'}`);
  }

  return supabase;
}

/**
 * Delete all cart items for the current authenticated user
 * This bypasses the UI and directly manipulates the database
 */
export async function clearCartDirectly(email: string, password: string): Promise<void> {
  const supabase = await signInUser(email, password);

  const { data: user } = await supabase.auth.getUser();
  if (!user.user) {
    throw new Error('No authenticated user found');
  }

  console.log(`🔍 User ID: ${user.user.id}`);

  // Get count before deletion
  const { count: beforeCount, data: beforeData } = await supabase
    .from('cart_items')
    .select('*', { count: 'exact' })
    .eq('user_id', user.user.id);

  console.log(`📊 Before delete: ${beforeCount} items for user ${user.user.id}`);
  if (beforeData && beforeData.length > 0) {
    console.log(`📦 Sample item:`, beforeData[0]);
  }

  // Delete all cart items for this user
  const { error } = await supabase.from('cart_items').delete().eq('user_id', user.user.id);

  if (error) {
    console.error('Error clearing cart directly:', error);
    throw error;
  }

  // Verify deletion
  const { count: afterCount } = await supabase
    .from('cart_items')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.user.id);

  console.log(
    `✓ Cart cleared directly for user ${user.user.email} (${beforeCount} → ${afterCount} items)`,
  );

  if (afterCount && afterCount > 0) {
    throw new Error(`Failed to clear cart: ${afterCount} items remaining after delete`);
  }
}

/**
 * Delete ALL cart items in the database (for all users) - DANGEROUS! Only for E2E testing
 * This is a nuclear option to ensure cart tests start clean
 */
export async function clearAllCartItems(email: string, password: string): Promise<void> {
  const supabase = await signInUser(email, password);

  // Get ALL cart items (no user filter)
  const { count: beforeCount, data: allItems } = await supabase
    .from('cart_items')
    .select('*', { count: 'exact' });

  console.log(`🧹 NUCLEAR CLEAR: Found ${beforeCount} total cart items across ALL users`);

  if (allItems && allItems.length > 0) {
    // Show user IDs
    const uniqueUsers = [...new Set(allItems.map((item) => item.user_id))];
    console.log(`👥 Items belong to ${uniqueUsers.length} different users:`, uniqueUsers);
  }

  // Delete ALL cart items (this may fail due to RLS, but let's try)
  const { error } = await supabase.from('cart_items').delete().neq('id', 0); // Trick to delete all rows

  if (error) {
    console.error('⚠️  Cannot delete all items (RLS protection):', error.message);
    console.log('Falling back to user-specific delete...');
    return clearCartDirectly(email, password);
  }

  const { count: afterCount } = await supabase
    .from('cart_items')
    .select('*', { count: 'exact', head: true });

  console.log(`✓ Nuclear clear complete: ${beforeCount} → ${afterCount} items`);
}
