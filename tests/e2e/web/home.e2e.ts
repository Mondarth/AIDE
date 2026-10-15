import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '../fixtures.js';

test.describe('home page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('shows the product name and version', async ({ page }) => {
    await expect(page).toHaveTitle('AIDE');
    await expect(page.getByRole('heading', { level: 1, name: 'AIDE' })).toBeVisible();
    await expect(page.getByText('Adventure Integrated Development Environment')).toBeVisible();
    await expect(page.getByText(/^Version \d+\.\d+\.\d+/)).toBeVisible();
  });

  test('declares the page language', async ({ page }) => {
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
  });

  test('has no detectable accessibility violations', async ({ page }) => {
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    expect(results.violations).toEqual([]);
  });
});
