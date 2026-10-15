import { describe, expect, it } from 'vitest';
import { reroute } from '../../src/hooks.js';

describe('reroute', () => {
  it('routes base-locale paths unchanged', async () => {
    expect(await reroute({ url: new URL('http://localhost/projects/1'), fetch })).toBe('/projects/1');
  });
});
