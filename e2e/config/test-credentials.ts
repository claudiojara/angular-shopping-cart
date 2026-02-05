/**
 * Credenciales estáticas para pruebas E2E
 * 
 * Pre-requisito: Usuario creado en Supabase con las siguientes credenciales:
 * - Email: playwright-test@example.com
 * - Password: PlaywrightTest123!
 * 
 * Configuración de Supabase:
 * - Email confirmation: DISABLED (Dashboard → Authentication → Email Auth)
 * - RLS policies: Configuradas para permitir operaciones del usuario
 * 
 * Este usuario debe existir antes de ejecutar las pruebas E2E.
 */
export const TEST_CREDENTIALS = {
  email: 'playwright-test@example.com',
  password: 'PlaywrightTest123!',
} as const;

/**
 * Genera un email único para pruebas de registro
 * Útil para tests que requieren crear nuevos usuarios
 */
export const generateUniqueEmail = (): string => {
  return `test-${Date.now()}@example.com`;
};
