// Debug script - Run this in browser console to check authentication
console.log('=== SUPABASE AUTH DEBUG ===');

// Check if user is logged in
const checkAuth = async () => {
  const { createClient } = window.supabase || {};

  if (!createClient) {
    console.error('❌ Supabase client not available');
    return;
  }

  // Get config
  const config = JSON.parse(localStorage.getItem('app-config') || '{}');
  console.log('📋 Config:', config);

  // Create client
  const supabase = createClient(config.supabase?.url, config.supabase?.anonKey);

  // Check session
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) {
    console.error('❌ Error getting session:', error);
    return;
  }

  if (session) {
    console.log('✅ User authenticated');
    console.log('User ID:', session.user.id);
    console.log('User Email:', session.user.email);
    console.log('Access Token (first 50 chars):', session.access_token.substring(0, 50) + '...');
    console.log('Token expires at:', new Date(session.expires_at * 1000));
  } else {
    console.error('❌ No active session found');
  }
};

checkAuth();
