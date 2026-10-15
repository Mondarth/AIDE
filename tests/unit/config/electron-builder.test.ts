import { readFileSync } from 'node:fs';
import { parse } from 'yaml';
import { describe, expect, it } from 'vitest';
import pkg from '../../../package.json' with { type: 'json' };

/**
 * electron-builder names some installers after the package name by default (the deb target uses
 * `${name}_${version}_${arch}.${ext}`). Ours is scoped, `@mondarth/aide`, so the slash turns the
 * file name into a directory that does not exist and the build fails. Every target that would
 * fall back to `${name}` needs an explicit artifactName.
 */

interface TargetOptions {
  artifactName?: string;
}

const config = parse(readFileSync('electron-builder.yml', 'utf8')) as Record<string, TargetOptions | undefined>;

/** Targets whose default artifactName includes `${name}`. */
const targetsNamedAfterPackage = ['deb', 'rpm', 'snap', 'pacman', 'apk', 'freebsd', 'p5p'];

const configuredTargets = ['linux', 'win', 'mac']
  .flatMap(platform => (config[platform] as { target?: string[] } | undefined)?.target ?? [])
  .map(target => target.toLowerCase());

describe('electron-builder artifact names', () => {
  it('are needed because the package name is scoped', () => {
    expect(pkg.name).toContain('/');
  });

  it.each(configuredTargets.filter(target => targetsNamedAfterPackage.includes(target)))(
    'are set explicitly for the %s target',
    target => {
      expect(config[target]?.artifactName).toBeDefined();
    },
  );

  it('never use the package name', () => {
    const names = Object.values(config).flatMap(value =>
      typeof value?.artifactName === 'string' ? [value.artifactName] : [],
    );
    for (const name of names) expect(name).not.toContain('${name}');
  });
});
