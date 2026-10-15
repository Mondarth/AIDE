import { createRawSnippet } from 'svelte';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import Layout from '../../../src/routes/+layout.svelte';

describe('root layout', () => {
  const children = createRawSnippet(() => ({ render: () => '<p>page content</p>' }));

  it('renders the page inside it', async () => {
    await render(Layout, { children, data: {}, params: {} });

    await expect.element(page.getByText('page content')).toBeVisible();
  });

  it('sets the document title and icon', async () => {
    await render(Layout, { children, data: {}, params: {} });

    await expect.poll(() => document.title).toBe('AIDE');
    expect(document.head.querySelector('link[rel="icon"]')).not.toBeNull();
  });
});
