import { execFileSync } from 'node:child_process';
import { copyFileSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import config, { bumpVersionCmd } from '../../../release.config.mjs';

/**
 * package.json declares pnpm in devEngines with onFail: error, so npm refuses to run in this
 * repository. @semantic-release/npm bumps the version with `npm version` and so fails the
 * release; the bump has to go through pnpm instead.
 */

const pluginNames = (config.plugins ?? []).map(plugin => (Array.isArray(plugin) ? plugin[0] : plugin));

describe('release version bump', () => {
  let dir: string | undefined;

  afterEach(() => {
    if (dir) rmSync(dir, { recursive: true, force: true });
    dir = undefined;
  });

  it('does not use @semantic-release/npm, which runs npm', () => {
    expect(pluginNames).not.toContain('@semantic-release/npm');
  });

  it('sets the version in package.json and changes nothing else', () => {
    dir = mkdtempSync(join(tmpdir(), 'aide-release-'));
    copyFileSync('package.json', join(dir, 'package.json'));
    const before = readFileSync(join(dir, 'package.json'), 'utf8');

    execFileSync('sh', ['-c', bumpVersionCmd.replaceAll('${nextRelease.version}', '9.8.7')], {
      cwd: dir,
      stdio: 'pipe',
    });

    const after = readFileSync(join(dir, 'package.json'), 'utf8');
    expect(JSON.parse(after)).toMatchObject({ version: '9.8.7' });
    expect(after).toBe(before.replace(/"version": "[^"]*"/, '"version": "9.8.7"'));
  });
});
