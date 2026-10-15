import { readFileSync } from 'node:fs';
import path from 'node:path';
import { paraglideVitePlugin } from '@inlang/paraglide-js';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import adapter from '@sveltejs/adapter-node';
import { sveltekit } from '@sveltejs/kit/vite';
import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vitest/config';

const pkg: unknown = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));
const version = typeof pkg === 'object' && pkg !== null && 'version' in pkg ? String(pkg.version) : '0.0.0';

/** Source maps are only emitted for the instrumented e2e coverage build. */
const e2eCoverage = process.env.E2E_COVERAGE === '1';

export default defineConfig({
  define: {
    __AIDE_VERSION__: JSON.stringify(version),
  },
  build: {
    sourcemap: e2eCoverage,
  },
  plugins: [
    sveltekit({
      compilerOptions: {
        // Force runes mode for the project, except for libraries. Can be removed in Svelte 6.
        runes: ({ filename }) => (filename.split(/[/\\]/).includes('node_modules') ? undefined : true),
      },
      adapter: adapter(),
    }),
    paraglideVitePlugin({
      project: './project.inlang',
      outdir: './src/lib/paraglide',
      emitTsDeclarations: true,
    }),
  ],
  test: {
    expect: { requireAssertions: true },
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,svelte}', 'host/**/*.ts', 'scripts/**/*.ts'],
      exclude: [
        'src/lib/paraglide/**',
        '**/*.d.ts',
        '**/*.stories.svelte',
        // Exercised by `pnpm test:e2e:coverage`, whose report it writes.
        'scripts/e2e-coverage-report.ts',
      ],
      reporter: ['text', 'html', 'lcov', 'json-summary'],
      reportsDirectory: './coverage/unit',
      // Set just below the measured level. Ratchet upward as tests are added; never lower them.
      thresholds: { statements: 98, branches: 95, functions: 98, lines: 98 },
    },
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          environment: 'node',
          include: ['tests/unit/**/*.test.ts'],
          exclude: ['tests/unit/**/*.svelte.test.ts'],
        },
      },
      {
        extends: true,
        test: {
          name: 'component',
          include: ['tests/unit/**/*.svelte.test.ts'],
          browser: {
            enabled: true,
            headless: true,
            provider: playwright(),
            instances: [{ browser: 'chromium' }],
          },
        },
      },
      {
        extends: true,
        // Runs every story as a test, including the accessibility checks (see .storybook/preview.ts).
        plugins: [storybookTest({ configDir: path.join(import.meta.dirname, '.storybook') })],
        test: {
          name: 'storybook',
          browser: {
            enabled: true,
            headless: true,
            provider: playwright(),
            instances: [{ browser: 'chromium' }],
          },
        },
      },
    ],
  },
});
