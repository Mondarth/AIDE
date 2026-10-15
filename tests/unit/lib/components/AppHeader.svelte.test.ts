import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import AppHeader from '#lib/components/AppHeader.svelte';

describe('AppHeader', () => {
  it('shows the title as the page heading, and the subtitle', async () => {
    await render(AppHeader, { title: 'AIDE', subtitle: 'Adventure Integrated Development Environment' });

    await expect.element(page.getByRole('heading', { level: 1 })).toHaveTextContent('AIDE');
    await expect.element(page.getByText('Adventure Integrated Development Environment')).toBeVisible();
  });

  it('shows a tagline when given one', async () => {
    await render(AppHeader, { title: 'AIDE', subtitle: 'Subtitle', tagline: 'Build adventures.' });

    await expect.element(page.getByText('Build adventures.')).toBeVisible();
  });

  it('omits the tagline otherwise', async () => {
    const screen = await render(AppHeader, { title: 'AIDE', subtitle: 'Subtitle' });

    await expect.element(page.getByRole('banner')).toBeVisible();
    expect(screen.container.querySelector('.tagline')).toBeNull();
  });

  it('leaves nothing behind when unmounted', async () => {
    const screen = await render(AppHeader, { title: 'AIDE', subtitle: 'Subtitle' });
    await expect.element(page.getByRole('banner')).toBeVisible();

    await screen.unmount();
    expect(screen.container.innerHTML).toBe('');
  });
});
