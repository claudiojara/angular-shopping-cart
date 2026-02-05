import { Provider } from '@angular/core';
import { ConfigService } from '../core/config.service';
import { MockConfigService } from '../core/config.service.mock';

/**
 * Common test providers
 * Include these in TestBed.configureTestingModule() to fix ConfigService dependency issues
 */
export const TEST_PROVIDERS: Provider[] = [{ provide: ConfigService, useClass: MockConfigService }];

/**
 * Helper function to quickly provide MockConfigService in tests
 * @example
 * beforeEach(() => {
 *   TestBed.configureTestingModule({
 *     imports: [MyComponent],
 *     providers: [provideConfigMock()],
 *   });
 * });
 */
export function provideConfigMock(): Provider {
  return { provide: ConfigService, useClass: MockConfigService };
}
