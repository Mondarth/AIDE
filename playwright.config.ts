import { defineConfig, devices, type PlaywrightTestConfig } from '@playwright/test';
import { E2E_SERVER_COVERAGE_DIR, isE2eCoverage } from './tests/e2e/coverage.js';

const isCI = process.env.CI !== undefined;
const port = 4173;

/** Set to test an app that is already running, such as the Docker image in CI. */
const externalBaseUrl = process.env.PLAYWRIGHT_BASE_URL;

/** Starts the built app with the real CLI, so the e2e suite tests what users run. Run `pnpm build` first. */
const webServer: PlaywrightTestConfig['webServer'] = {
  command: `node dist/host/cli.js --port ${port}`,
  url: `http://127.0.0.1:${port}/healthz`,
  reuseExistingServer: !isCI,
  stdout: 'pipe',
  // A graceful stop lets Node write its V8 coverage data on exit.
  gracefulShutdown: { signal: 'SIGTERM', timeout: 5000 },
  env: isE2eCoverage ? { NODE_V8_COVERAGE: E2E_SERVER_COVERAGE_DIR } : {},
};

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: '**/*.e2e.ts',
  outputDir: './test-results',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  reporter: isCI
    ? [['github'], ['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]]
    : [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],
  globalSetup: './tests/e2e/global-setup.ts',
  use: {
    baseURL: externalBaseUrl ?? `http://127.0.0.1:${port}`,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', testDir: './tests/e2e/web', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', testDir: './tests/e2e/web', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', testDir: './tests/e2e/web', use: { ...devices['Desktop Safari'] } },
    // Launches the desktop app itself; needs a display (CI uses xvfb-run).
    { name: 'electron', testDir: './tests/e2e/electron' },
  ],
  ...(externalBaseUrl === undefined && { webServer }),
});
