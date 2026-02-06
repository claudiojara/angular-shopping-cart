import { Provider } from '@angular/core';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { ConfigService } from '../core/config.service';
import { MockConfigService } from '../core/config.service.mock';
import { of } from 'rxjs';

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

/**
 * Provides RouterModule for testing (required for routerLink directives)
 * Use this for components that use routerLink in templates
 * @example
 * TestBed.configureTestingModule({
 *   imports: [MyComponent, ...getRouterTestingModules()],
 *   providers: [provideConfigMock()],
 * });
 */
export function getRouterTestingModules() {
  return [RouterModule.forRoot([])];
}

/**
 * Provides mock ActivatedRoute for components that use routing
 * @example
 * TestBed.configureTestingModule({
 *   providers: [provideActivatedRouteMock()],
 * });
 */
export function provideActivatedRouteMock(): Provider {
  return {
    provide: ActivatedRoute,
    useValue: {
      params: of({}),
      queryParams: of({}),
      snapshot: { params: {}, queryParams: {} },
    },
  };
}
