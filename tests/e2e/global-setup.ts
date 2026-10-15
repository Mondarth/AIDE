import { CoverageReport } from 'monocart-coverage-reports';
import { coverageOptions, isE2eCoverage } from './coverage.js';

/** Starts every coverage run from an empty cache. */
export default function globalSetup(): void {
  if (isE2eCoverage) new CoverageReport(coverageOptions).cleanCache();
}
