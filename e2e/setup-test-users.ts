import { createClient } from '@supabase/supabase-js';

/**
 * Script para verificar y crear usuarios de prueba en Supabase
 * 
 * Ejecutar: node e2e/setup-test-users.js (después de compilar)
 */

const TEST_USERS = {
  user1: {
    email: 'playwright-test@example.com',
    password: 'PlaywrightTest123!',
    name: 'Test User 1'
  },
  user2: {
    email: 'playwright-test2@example.com',
    password: 'PlaywrightTest123!',
    name: 'Test User 2'
  }
};

const SUPABASE_URL = 'https://owewtzddyykyraxkkorx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im93ZXd0emRkeXlreXJheGtrb3J4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyNDE3MTcsImV4cCI6MjA4NTgxNzcxN30.E5M6cIwnJTt1Y04pApmvLNqpV5yQSOcNJHlCM_JDBRE';

async function setupTestUsers() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  console.log('🚀 Setting up test users...\n');

  for (const [key, user] of Object.entries(TEST_USERS)) {
    console.log(`📧 Checking ${user.name} (${user.email})...`);

    try {
      // Intentar hacer login para verificar si existe
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: user.password
      });

      if (signInData.user) {
        console.log(`   ✅ User exists and can login`);
        console.log(`   📍 User ID: ${signInData.user.id}`);
        console.log(`   📧 Email confirmed: ${signInData.user.email_confirmed_at ? 'Yes' : 'No'}`);
        
        // Logout después de verificar
        await supabase.auth.signOut();
      } else if (signInError) {
        console.log(`   ❌ Login failed: ${signInError.message}`);
        console.log(`   💡 Action needed: Create user manually in Supabase Dashboard`);
        console.log(`      - Email: ${user.email}`);
        console.log(`      - Password: ${user.password}`);
        console.log(`      - Auto-confirm: YES`);
      }
    } catch (error: any) {
      console.log(`   ⚠️  Error checking user: ${error.message}`);
    }

    console.log('');
  }

  console.log('📋 Summary:');
  console.log('   - Both users MUST exist in Supabase');
  console.log('   - Email confirmation MUST be disabled');
  console.log('   - RLS policies MUST allow user-specific cart access');
  console.log('\n✨ If users don\'t exist, create them in Supabase Dashboard:');
  console.log('   Dashboard → Authentication → Users → Add User\n');
}

setupTestUsers().catch(console.error);
