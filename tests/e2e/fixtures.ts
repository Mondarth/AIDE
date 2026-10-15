/**
 * The shared test fixtures. Every web e2e test imports `test` and `expect` from here.
 *
 * - Fails any test that logs a browser console error or throws an uncaught page error:
 *   pages can look right while failing silently.
 * - Collects Chromium coverage when `E2E_COVERAGE=1`.
 */
import { test as base, expect } from '@playwright/test';
import { CoverageReport } from 'monocart-coverage-reports';
import { coverageOptions, isE2eCoverage } from './coverage.js';

interface Fixtures {
  /** Console and page errors seen during the test; must be empty when it ends. */
  pageErrors: string[];
}

export const test = base.extend<Fixtures>({
  page: async ({ page, browserName }, use) => {
    const collect = isE2eCoverage && browserName === 'chromium';
    if (collect) await page.coverage.startJSCoverage({ resetOnNavigation: false });
    await use(page);
    if (collect) {
      const coverage = await page.coverage.stopJSCoverage();
      // Tests that never load a page (API-only tests) have nothing to add.
      if (coverage.length > 0) await new CoverageReport(coverageOptions).add(coverage);
    }
  },

  pageErrors: [
    async ({ page }, use) => {
      const errors: string[] = [];
      page.on('console', message => {
        if (message.type() === 'error') errors.push(message.text());
      });
      page.on('pageerror', error => errors.push(error.message));
      await use(errors);
      expect(errors, 'the page logged errors').toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };
