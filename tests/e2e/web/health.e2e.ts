import { expect, test } from '../fixtures.js';

test('the health endpoint reports the running version', async ({ request }) => {
  const response = await request.get('/healthz');

  expect(response.status()).toBe(200);
  expect(response.headers()['cache-control']).toBe('no-store');
  expect(await response.json()).toEqual({ status: 'ok', version: expect.stringMatching(/^\d+\.\d+\.\d+/) as unknown });
});
