/**
 * Usuarios de prueba para E2E tests
 * Ambos usuarios deben existir en Supabase con email confirmado
 */

export const TEST_USERS = {
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
} as const;

// Backward compatibility
export const TEST_CREDENTIALS = TEST_USERS.user1;
