import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright CI configuration - Smoke tests only
 * Fast deployment validation with minimal test coverage
 */
export default defineConfig({
  testDir: './e2e',

  // Only run smoke tests in CI
  testMatch: '**/smoke.spec.ts',

  // Run tests in files in parallel
  fullyParallel: true,

  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: true,

  // Retry failed tests once
  retries: 1,

  // Run with 1 worker for stability
  workers: 1,

  // Reporter to use
  reporter: [
    ['html', { outputFolder: 'playwright-report-ci' }],
    ['list'],
    ['json', { outputFile: 'test-results/smoke-results.json' }],
  ],

  // Shared settings
  use: {
    // Base URL will be set by CI workflow (staging or production)
    baseURL: process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:4200',

    // Collect trace on first retry
    trace: 'on-first-retry',

    // Screenshot on failure
    screenshot: 'only-on-failure',

    // Video on failure
    video: 'retain-on-failure',

    // Shorter timeout for smoke tests
    actionTimeout: 10000,
    navigationTimeout: 30000,
  },

  // Timeouts
  timeout: 60000, // 1 minute per test (smoke tests should be fast)
  expect: {
    timeout: 10000,
  },

  // Configure projects for major browsers
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Don't start local server - tests run against deployed environment
  // CI workflow sets PLAYWRIGHT_TEST_BASE_URL to staging/production URL
});
