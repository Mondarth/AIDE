# Testing

| Layer               | Tool                                                    | Where                            | Command                  |
| ------------------- | ------------------------------------------------------- | -------------------------------- | ------------------------ |
| Unit                | Vitest, Node environment                                | `tests/unit/**/*.test.ts`        | `pnpm test:unit`         |
| Component           | Vitest browser mode (Chromium), `vitest-browser-svelte` | `tests/unit/**/*.svelte.test.ts` | `pnpm test:unit`         |
| Story               | Storybook's Vitest addon (Chromium)                     | `src/**/*.stories.svelte`        | `pnpm test:stories`      |
| End-to-end, web     | Playwright: Chromium, Firefox, WebKit                   | `tests/e2e/web`                  | `pnpm test:e2e`          |
| End-to-end, desktop | Playwright's Electron support                           | `tests/e2e/electron`             | `pnpm test:e2e:electron` |

`pnpm test` runs the first three; `pnpm test:coverage` adds the coverage gate.

## Unit and component tests

Tests mirror the source tree under `tests/unit` (`src/lib/app-info.ts` → `tests/unit/lib/app-info.test.ts`). Vitest is configured with `expect.requireAssertions`, so a test that asserts nothing fails.

Component tests run in a real browser, not a simulated DOM. Render with `await render(Component, props)`, then query with `page.getByRole(...)` and assert with `await expect.element(...)`. Test what the user sees, and that the component cleans up after itself when unmounted.

Host code takes its dependencies (process, Electron, server) as parameters; tests pass in fakes typed against the real interfaces.

## Story tests

Every story is rendered and checked by the Storybook Vitest addon, including an accessibility audit (axe). An accessibility violation fails the test (`a11y.test: 'error'` in `.storybook/preview.ts`).

## End-to-end tests

The web suite runs against the **built** app, started through the real `aide` CLI, so it tests what users run. Build first:

```shell
pnpm build && pnpm test:e2e
```

- Import `test` and `expect` from `tests/e2e/fixtures.ts`. Any browser console error or uncaught page error fails the test.
- Use role- and text-based locators (`getByRole`, `getByText`), not CSS selectors.
- `PLAYWRIGHT_BASE_URL=http://host:port` runs the suite against an app that is already running. CI does this against the Docker image.
- Failed tests keep a trace, screenshot and video in `test-results/`. `pnpm exec playwright show-report` opens the HTML report.

The Electron suite launches the desktop app from `dist/` and needs a display; on a headless machine use `xvfb-run pnpm test:e2e:electron`.

## Coverage

| Report     | Produced by                                          | Location        |
| ---------- | ---------------------------------------------------- | --------------- |
| Unit       | `pnpm test:coverage` (V8 via `@vitest/coverage-v8`)  | `coverage/unit` |
| End-to-end | `pnpm test:e2e:coverage` (monocart-coverage-reports) | `coverage/e2e`  |

The unit report covers `src`, `host` and `scripts`, including `.svelte` files. It fails below the thresholds in `vite.config.ts`. Those are set just under the measured level: raise them as coverage improves, and never lower them.

The e2e report merges two sources: Chromium's coverage of the client code, and Node's coverage of the server (`NODE_V8_COVERAGE`). Both are mapped back to the `.ts` and `.svelte` sources through the source maps of an instrumented build (`E2E_COVERAGE=1`).

CI uploads both reports to Codecov (flags `unit` and `e2e`), adds a summary to each run, and keeps the HTML reports as artifacts.

Code that only wires a real process together (for example, the `if (import.meta.main)` block in `host/cli.ts`) is marked `/* v8 ignore */` with the reason; the e2e suite covers it.
