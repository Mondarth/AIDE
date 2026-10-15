/**
 * Sets the release version in package.json. This replaces @semantic-release/npm, which runs
 * `npm version`: package.json requires pnpm through devEngines, so npm refuses to run here.
 * Bring that plugin back (with pnpm) only when the package is published to a registry.
 */
export const bumpVersionCmd = 'pnpm pkg set version=${nextRelease.version}';

/**
 * semantic-release configuration.
 *
 * Releases are cut from `main` only; day-to-day work lands on `dev`. Version numbers follow
 * strict SemVer derived from Conventional Commits: `fix` -> patch, `feat` -> minor,
 * `BREAKING CHANGE:` / `!` -> major.
 *
 * The Docker image and the desktop installers are built by later jobs of the release workflow,
 * from the tag this creates.
 *
 * @type {import('semantic-release').Options}
 */
export default {
  branches: ['main'],
  plugins: [
    ['@semantic-release/commit-analyzer', { preset: 'conventionalcommits' }],
    ['@semantic-release/release-notes-generator', { preset: 'conventionalcommits' }],
    ['@semantic-release/changelog', { changelogFile: 'CHANGELOG.md' }],
    [
      '@semantic-release/exec',
      {
        // Bumps package.json first, so the build carries the new version.
        prepareCmd: [
          bumpVersionCmd,
          `sed -i "s/^release = .*/release = '\${nextRelease.version}'/" docs/conf.py`,
          'pnpm build',
          'mkdir -p releases',
          'pnpm pack --pack-destination releases',
        ].join(' && '),
        // Hands the version to the later jobs of the release workflow.
        successCmd: 'echo "version=${nextRelease.version}" >> "$GITHUB_OUTPUT"',
      },
    ],
    [
      '@semantic-release/git',
      {
        assets: ['CHANGELOG.md', 'package.json', 'docs/conf.py'],
        message: 'chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}',
      },
    ],
    [
      '@semantic-release/github',
      {
        assets: [{ path: 'releases/*.tgz', label: 'Node.js package (npm install -g <file>)' }],
      },
    ],
  ],
};
