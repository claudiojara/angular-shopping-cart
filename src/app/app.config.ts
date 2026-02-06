import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
  APP_INITIALIZER,
} from '@angular/core';
import { provideRouter, withHashLocation } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideHttpClient, withFetch } from '@angular/common/http';

import { routes } from './app.routes';
import { ConfigService } from './core/config.service';

/**
 * Initialize application configuration before bootstrap
 * Loads config from /assets/config.json or /assets/config.local.json
 */
export function initializeApp(configService: ConfigService) {
  return (): Promise<void> => {
    return configService
      .loadConfig()
      .then(() => {
        console.log('✅ Application configuration loaded successfully');
      })
      .catch((error) => {
        console.error('❌ Failed to load application configuration:', error);
        throw error;
      });
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withHashLocation()), // Use hash location strategy for Flow POST redirects
    provideAnimationsAsync(),
    provideHttpClient(withFetch()),
    {
      provide: APP_INITIALIZER,
      useFactory: initializeApp,
      deps: [ConfigService],
      multi: true,
    },
  ],
};
