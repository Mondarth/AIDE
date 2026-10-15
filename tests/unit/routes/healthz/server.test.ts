import { describe, expect, it } from 'vitest';
import { GET } from '../../../../src/routes/healthz/+server.js';

describe('GET /healthz', () => {
  it('reports that the app is up, and its version', async () => {
    const response = GET();

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: 'ok', version: __AIDE_VERSION__ });
  });

  it('is never cached', () => {
    expect(GET().headers.get('cache-control')).toBe('no-store');
  });
});
