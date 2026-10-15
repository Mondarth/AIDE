import { describe, expect, it } from 'vitest';
import {
  ELECTRON_RELEASES_URL,
  findCandidate,
  isElectronReleases,
  isNodeReleases,
  latestStableElectron,
  majorOf,
  NODE_RELEASES_URL,
  run,
  toMarkdown,
  type ElectronRelease,
  type NodeRelease,
} from '../../../scripts/node-baseline.js';

const node24: NodeRelease = { version: 'v24.21.0', lts: 'Krypton' };
const node26Current: NodeRelease = { version: 'v26.12.0', lts: false };
const node26Lts = { version: 'v26.13.0', lts: 'Lithium' } satisfies NodeRelease;
const node26LtsOlder = { version: 'v26.9.0', lts: 'Lithium' } satisfies NodeRelease;
const node28Lts = { version: 'v28.1.0', lts: 'Nitrogen' } satisfies NodeRelease;

const electronOn24: ElectronRelease = { version: '45.2.0', node: '24.21.0' };
const electronOn26: ElectronRelease = { version: '47.0.1', node: '26.13.0' };
const electronNightlyOn26: ElectronRelease = { version: '48.0.0-nightly.20270101', node: '26.14.0' };

describe('majorOf', () => {
  it.each([
    ['v26.12.0', 26],
    ['24.21.0', 24],
  ])('reads the major of %s', (version, major) => {
    expect(majorOf(version)).toBe(major);
  });
});

describe('isNodeReleases', () => {
  it('accepts releases with an LTS codename or false', () => {
    expect(isNodeReleases([node24, node26Current])).toBe(true);
  });

  it.each([
    ['an object', {}],
    ['null entries', [null]],
    ['a missing version', [{ lts: false }]],
    ['a malformed lts', [{ version: 'v1.0.0', lts: true }]],
  ])('rejects %s', (_label, value) => {
    expect(isNodeReleases(value)).toBe(false);
  });
});

describe('isElectronReleases', () => {
  it('accepts releases with a bundled Node.js version', () => {
    expect(isElectronReleases([electronOn24])).toBe(true);
  });

  it.each([
    ['an object', {}],
    ['a missing node', [{ version: '1.0.0' }]],
  ])('rejects %s', (_label, value) => {
    expect(isElectronReleases(value)).toBe(false);
  });
});

describe('latestStableElectron', () => {
  it('picks the newest release, ignoring prereleases', () => {
    const releases = [{ version: '45.10.0', node: '24.21.0' }, electronNightlyOn26, electronOn24];
    expect(latestStableElectron(releases)).toEqual({ version: '45.10.0', node: '24.21.0' });
  });

  it('orders by patch when major and minor match', () => {
    expect(latestStableElectron([electronOn24, { version: '45.2.3', node: '24.21.0' }])?.version).toBe('45.2.3');
  });

  it('finds nothing without stable releases', () => {
    expect(latestStableElectron([electronNightlyOn26])).toBeUndefined();
  });
});

describe('findCandidate', () => {
  it('finds nothing while the newer major is not LTS', () => {
    expect(findCandidate(24, [node26Current, node24], [electronOn26])).toBeUndefined();
  });

  it('finds nothing while stable Electron still bundles the baseline', () => {
    expect(findCandidate(24, [node26Lts, node24], [electronOn24, electronNightlyOn26])).toBeUndefined();
  });

  it('finds nothing without a stable Electron', () => {
    expect(findCandidate(24, [node26Lts], [electronNightlyOn26])).toBeUndefined();
  });

  it('proposes the newer major once it is LTS and bundled by stable Electron', () => {
    expect(findCandidate(24, [node26LtsOlder, node26Lts, node26Current, node24], [electronOn24, electronOn26])).toEqual(
      { major: 26, node: node26Lts, electron: electronOn26 },
    );
  });

  it('skips majors newer than the one Electron bundles', () => {
    expect(findCandidate(24, [node28Lts, node26Lts], [electronOn26])?.major).toBe(26);
  });

  it('finds nothing once the baseline has moved', () => {
    expect(findCandidate(26, [node26Lts], [electronOn26])).toBeUndefined();
  });
});

describe('toMarkdown', () => {
  it('reports that the baseline stays', () => {
    expect(toMarkdown(24, undefined)).toContain('Node.js 24 is still the baseline');
  });

  it('lists the evidence and the steps for a candidate', () => {
    const report = toMarkdown(24, { major: 26, node: node26Lts, electron: electronOn26 });
    expect(report).toMatch(/^### Node\.js baseline: 26 is a candidate\n/);
    expect(report).toContain('Node.js 26 is LTS ("Lithium"); the newest release is v26.13.0.');
    expect(report).toContain('Electron 47.0.1, the newest stable release, bundles Node.js 26.13.0.');
    expect(report).toContain('- [ ] `electron` to a release that bundles Node.js 26');
    expect(report).toContain('`node:26-slim`');
  });
});

describe('run', () => {
  const feeds = (node: unknown, electron: unknown) => (url: string) =>
    Promise.resolve(url === NODE_RELEASES_URL ? node : url === ELECTRON_RELEASES_URL ? electron : undefined);

  it('reads the baseline from .nvmrc and reports a candidate', async () => {
    const { candidate, report } = await run('24\n', feeds([node26Lts], [electronOn26]));
    expect(candidate?.major).toBe(26);
    expect(report).toContain('26 is a candidate');
  });

  it('reports no candidate', async () => {
    const { candidate } = await run('24', feeds([node26Current], [electronOn24]));
    expect(candidate).toBeUndefined();
  });

  it('rejects a baseline that is not a major', async () => {
    await expect(run('lts/*', feeds([], []))).rejects.toThrow('.nvmrc must hold a Node.js major, not "lts/*"');
  });

  it('rejects malformed Node.js releases', async () => {
    await expect(run('24', feeds({}, []))).rejects.toThrow('is not a list of Node.js releases');
  });

  it('rejects malformed Electron releases', async () => {
    await expect(run('24', feeds([], {}))).rejects.toThrow('is not a list of Electron releases');
  });
});
