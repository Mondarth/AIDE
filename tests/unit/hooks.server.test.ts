import type { RequestEvent } from '@sveltejs/kit';
import { describe, expect, it, vi } from 'vitest';
import { handle } from '../../src/hooks.server.js';

type Resolve = Parameters<typeof handle>[0]['resolve'];

const template = '<html lang="%paraglide.lang%" dir="%paraglide.dir%"></html>';

describe('handle', () => {
  it('writes the locale and text direction into the page', async () => {
    const resolve = vi.fn<Resolve>(async (_event, options) => {
      const html = await options?.transformPageChunk?.({ html: template, done: true });
      return new Response(html);
    });
    // Only the request is read; the rest of the event is passed through untouched.
    const event = { request: new Request('http://localhost/') } as RequestEvent;

    const response = await handle({ event, resolve });

    expect(await response.text()).toBe('<html lang="en" dir="ltr"></html>');
    expect(resolve).toHaveBeenCalledOnce();
  });
});
