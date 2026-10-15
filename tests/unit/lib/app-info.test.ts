import { describe, expect, it } from 'vitest';
import { appInfo } from '#lib/app-info.js';

describe('appInfo', () => {
  it('reports the version injected at build time', () => {
    expect(appInfo().version).toBe(__AIDE_VERSION__);
  });

  it('reports a semantic version', () => {
    expect(appInfo().version).toMatch(/^\d+\.\d+\.\d+(?:-[\w.]+)?$/);
  });
});
