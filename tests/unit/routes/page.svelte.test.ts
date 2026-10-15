import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import Page from '../../../src/routes/+page.svelte';

describe('home page', () => {
  it('introduces the product', async () => {
    await render(Page);

    await expect.element(page.getByRole('heading', { level: 1, name: 'AIDE' })).toBeVisible();
    await expect.element(page.getByText('Adventure Integrated Development Environment')).toBeVisible();
    await expect.element(page.getByText('Design, build and test your adventures in one place.')).toBeVisible();
  });

  it('shows the version', async () => {
    await render(Page);

    await expect.element(page.getByText(`Version ${__AIDE_VERSION__}`)).toBeVisible();
  });
});
