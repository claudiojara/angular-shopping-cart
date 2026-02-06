import { Injectable, signal } from '@angular/core';
import { AppConfig } from './config.model';

/**
 * ConfigService - Runtime configuration loader
 *
 * Loads configuration from:
 * 1. /assets/config.local.json (local development, gitignored)
 * 2. /assets/config.json (CI/CD with injected values)
 * 3. Fallback to hardcoded values (last resort)
 *
 * Must be loaded before app bootstrap via APP_INITIALIZER
 */
@Injectable({
  providedIn: 'root',
})
export class ConfigService {
  private config = signal<AppConfig | null>(null);
  private loaded = signal<boolean>(false);

  readonly config$ = this.config.asReadonly();
  readonly isLoaded$ = this.loaded.asReadonly();

  async loadConfig(): Promise<AppConfig> {
    if (this.config()) {
      return this.config()!;
    }

    // Priority 1: Try config.local.json (local development)
    try {
      const response = await fetch('/assets/config.local.json');

      if (response.ok) {
        const config = (await response.json()) as AppConfig;
        console.log('✅ Loaded config.local.json (local development)');
        this.config.set(config);
        this.loaded.set(true);
        return config;
      }
    } catch (error) {
      // config.local.json doesn't exist, continue to config.json
    }

    // Priority 2: Try config.json (production/staging)
    try {
      const response = await fetch('/assets/config.json');

      if (!response.ok) {
        throw new Error(`Failed to load config.json: ${response.statusText}`);
      }

      const config = (await response.json()) as AppConfig;
      console.log(`✅ Loaded config.json (${config.environment})`);
      this.config.set(config);
      this.loaded.set(true);
      return config;
    } catch (error) {
      console.error('❌ Error loading configuration:', error);

      // Priority 3: Fallback to hardcoded config (last resort)
      const fallbackConfig: AppConfig = {
        production: false,
        supabase: {
          url: 'https://owewtzddyykyraxkkorx.supabase.co',
          anonKey: 'sb_publishable_EMV7TVY9I85fSZndebqPRA_rFti1dM7',
        },
        environment: 'local',
        features: {
          enableDebugMode: true,
        },
      };

      console.warn('⚠️ Using fallback hardcoded configuration');
      this.config.set(fallbackConfig);
      this.loaded.set(true);
      return fallbackConfig;
    }
  }

  getConfig(): AppConfig {
    const cfg = this.config();
    if (!cfg) {
      throw new Error(
        'Config not loaded. Call loadConfig() first or ensure APP_INITIALIZER is configured.',
      );
    }
    return cfg;
  }

  isProduction(): boolean {
    return this.getConfig().production;
  }

  getEnvironment(): string {
    return this.getConfig().environment;
  }
}
