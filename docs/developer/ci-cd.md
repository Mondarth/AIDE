# CI/CD

Workflows live in `.github/workflows`; the shared set-up steps (pnpm, Node.js, dependencies, Playwright browsers) are in the composite action `.github/actions/setup`.

(dev-ci)=

## Dev CI (`dev.yml`)

Runs on every push to `dev`, on every pull request to `dev` or `main`, and as the first stage of a release. Its jobs run in parallel:

| Job                             | Checks                                                                          |
| ------------------------------- | ------------------------------------------------------------------------------- |
| Commit messages                 | commitlint over the pull request's commits (pull requests only)                 |
| Typecheck                       | TypeScript 7, the TypeScript 6 fallback, and `svelte-check`                     |
| Lint                            | ESLint (warnings fail) and Prettier                                             |
| Unit, component and story tests | the coverage gate; uploads the unit coverage                                    |
| Build                           | builds and smoke-tests the CLI                                                  |
| Storybook                       | builds the static Storybook                                                     |
| E2E (chromium, firefox, webkit) | Playwright in each browser; Chromium also measures e2e coverage                 |
| E2E (Electron)                  | the desktop suite under `xvfb-run`, then packages the app                       |
| Docker image                    | builds the image, waits for it to be healthy, and runs the e2e suite against it |
| Docs                            | calls the Docs workflow                                                         |
| CI passed                       | succeeds only if all of the above passed; use it as the required status check   |

Superseded runs of the same pull request are cancelled.

## Docs (`docs.yml`)

Generates the API reference, builds the Sphinx image (cached) and the site, and keeps the HTML as an artifact. Called by Dev CI and Release; can also be started by hand.

(release-workflow)=

## Release (`release.yml`)

Runs on every push to `main`:

1. **CI**: the whole of Dev CI.
2. **Semantic release** (`release.config.mjs`):
   1. works out the next version from the commits since the last tag, and stops if none warrants a release;
   2. writes the release notes and `CHANGELOG.md`;
   3. sets the version in `package.json` and `docs/conf.py`, builds, and packs the npm package;
   4. commits `chore(release): <version> [skip ci]` to `main` and tags it `v<version>`;
   5. creates the GitHub release with the npm package attached.
3. If a release was cut, in parallel:
   - **Docker image**: built for `linux/amd64` and `linux/arm64` with provenance and an SBOM, and pushed to `ghcr.io/mondarth/aide` as `<version>`, `<major>.<minor>`, `<major>` and `latest`.
   - **Desktop installers**: built on Linux, Windows and macOS and attached to the release.
   - **Bring dev up to date**: fast-forwards `dev` to the release commit, or opens a pull request from `main` to `dev` if it cannot.
4. **Pages**: builds the documentation and the Storybook for the released tag (or for `main`, if nothing was released) and deploys them to GitHub Pages.

The jobs that push to the protected branches authenticate as the release App (see {ref}`release-app`).

`pnpm release:dry-run` checks the semantic-release configuration locally without releasing anything.

## Other workflows

- **CodeQL** (`codeql.yml`): code scanning of the TypeScript and of the workflows themselves, on pushes, pull requests and weekly.
- **Dependency review** (`dependency-review.yml`): fails pull requests that add dependencies with known vulnerabilities.
- **Dependabot** (`.github/dependabot.yml`): weekly grouped updates for npm, Docker images, the documentation's Python requirements and the GitHub Actions, raised against `dev`.
