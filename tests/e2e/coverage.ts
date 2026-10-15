/**
 * End-to-end coverage, collected with monocart-coverage-reports.
 *
 * - Browser: Chromium's V8 coverage of the client bundle, collected per test (see fixtures.ts).
 * - Server: Node's V8 coverage of the CLI and the server bundle (`NODE_V8_COVERAGE`), written
 *   when the server stops.
 *
 * Both are cached under `coverage/e2e` and merged by `scripts/e2e-coverage-report.ts`, which
 * maps them back to the TypeScript and Svelte sources through the build's source maps.
 */
import type { CoverageReportOptions } from 'monocart-coverage-reports';

/** Whether this run collects coverage (`pnpm test:e2e:coverage`). */
export const isE2eCoverage = process.env.E2E_COVERAGE === '1';

/** Where Node writes the server's raw V8 coverage. */
export const E2E_SERVER_COVERAGE_DIR = 'coverage/e2e/.v8-server';

/** Options shared by every process that adds to or generates the e2e report. */
export const coverageOptions: CoverageReportOptions = {
  name: 'AIDE end-to-end coverage',
  outputDir: 'coverage/e2e',
  reports: ['v8', 'lcovonly', 'json-summary', 'console-summary'],
  // App code only: the client bundle served by the app, and the built server and host.
  entryFilter: {
    '**/node_modules/**': false,
    '**/_app/immutable/**': true,
    '**/build/server/**': true,
    '**/dist/host/**': true,
  },
  sourceFilter: {
    '**/node_modules/**': false,
    '**/src/lib/paraglide/**': false,
    '**/.svelte-kit/**': false,
    '**/src/**': true,
    '**/host/**': true,
  },
};
