/**
 * Application configuration model
 * Loaded at runtime from /assets/config.json or /assets/config.local.json
 */
export interface AppConfig {
  production: boolean;
  supabase: {
    url: string;
    anonKey: string;
    serviceRoleKey?: string; // Optional - only in local config, never in production
  };
  environment: 'local' | 'development' | 'staging' | 'production';
  features?: {
    enableDebugMode?: boolean;
    enableAnalytics?: boolean;
  };
}
