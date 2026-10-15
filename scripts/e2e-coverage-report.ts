/**
 * Merges the browser and server coverage of an e2e run into one report under coverage/e2e.
 * Run by `pnpm test:e2e:coverage` after Playwright, once the server has stopped and written
 * its V8 coverage.
 */
import { existsSync } from 'node:fs';
import { CoverageReport } from 'monocart-coverage-reports';
import { coverageOptions, E2E_SERVER_COVERAGE_DIR } from '../tests/e2e/coverage.ts';

const report = new CoverageReport(coverageOptions);
if (existsSync(E2E_SERVER_COVERAGE_DIR)) await report.addFromDir(E2E_SERVER_COVERAGE_DIR);
await report.generate();
