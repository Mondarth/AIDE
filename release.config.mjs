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
 * @type {import('semantic-release').GlobalConfig}
 */
export default {
  branches: ['main'],
  plugins: [
    ['@semantic-release/commit-analyzer', { preset: 'conventionalcommits' }],
    ['@semantic-release/release-notes-generator', { preset: 'conventionalcommits' }],
    ['@semantic-release/changelog', { changelogFile: 'CHANGELOG.md' }],
    // Bumps the version in package.json. Flip npmPublish when the package is ready for the registry.
    ['@semantic-release/npm', { npmPublish: false }],
    [
      '@semantic-release/exec',
      {
        // Runs after package.json has been bumped, so the build carries the new version.
        prepareCmd: [
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
