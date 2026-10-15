import { _electron as electron, expect, test, type ElectronApplication } from '@playwright/test';

test.describe.configure({ mode: 'serial' });

let app: ElectronApplication;

test.beforeAll(async () => {
  // Chromium's setuid sandbox is unavailable in most CI containers.
  app = await electron.launch({ args: ['--no-sandbox', '.'] });
});

test.afterAll(async () => {
  await app.close();
});

test('opens the app in a window', async () => {
  const window = await app.firstWindow();

  await expect(window).toHaveTitle('AIDE');
  await expect(window.getByRole('heading', { level: 1, name: 'AIDE' })).toBeVisible();
});

test('serves the app from a private loopback address', async () => {
  const window = await app.firstWindow();

  expect(new URL(window.url()).hostname).toBe('127.0.0.1');
});

test('runs the page without Node.js access', async () => {
  const window = await app.firstWindow();

  expect(await window.evaluate(() => typeof (globalThis as { require?: unknown }).require)).toBe('undefined');
});
