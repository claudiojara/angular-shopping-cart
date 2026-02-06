import { signal } from '@angular/core';
import { AppConfig } from './config.model';

/**
 * Mock ConfigService for testing
 * Provides a pre-loaded configuration so tests don't need to fetch config files
 */
export class MockConfigService {
  private mockConfig: AppConfig = {
    production: false,
    supabase: {
      url: 'https://test.supabase.co',
      anonKey: 'test-anon-key-for-testing',
    },
    environment: 'local',
    features: {
      enableDebugMode: true,
    },
  };

  private config = signal<AppConfig | null>(this.mockConfig);
  private loaded = signal<boolean>(true);

  readonly config$ = this.config.asReadonly();
  readonly isLoaded$ = this.loaded.asReadonly();

  async loadConfig(): Promise<AppConfig> {
    return this.mockConfig;
  }

  getConfig(): AppConfig {
    return this.mockConfig;
  }

  isProduction(): boolean {
    return this.mockConfig.production;
  }

  getEnvironment(): string {
    return this.mockConfig.environment;
  }

  // Test helper to update config
  setConfig(config: Partial<AppConfig>): void {
    this.mockConfig = { ...this.mockConfig, ...config };
    this.config.set(this.mockConfig);
  }
}
