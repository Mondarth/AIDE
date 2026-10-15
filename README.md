# AIDE: Adventure Integrated Development Environment

<!-- Build & quality -->

[![Dev CI](https://github.com/Mondarth/AIDE/actions/workflows/dev.yml/badge.svg?branch=dev)](https://github.com/Mondarth/AIDE/actions/workflows/dev.yml)
[![Release](https://github.com/Mondarth/AIDE/actions/workflows/release.yml/badge.svg?branch=main)](https://github.com/Mondarth/AIDE/actions/workflows/release.yml)
[![CodeQL](https://github.com/Mondarth/AIDE/actions/workflows/codeql.yml/badge.svg?branch=dev)](https://github.com/Mondarth/AIDE/actions/workflows/codeql.yml)
[![Unit coverage](https://img.shields.io/codecov/c/github/Mondarth/AIDE/dev?flag=unit&label=unit%20coverage&logo=codecov)](https://app.codecov.io/gh/Mondarth/AIDE/tree/dev?flags%5B0%5D=unit)
[![E2E coverage](https://img.shields.io/codecov/c/github/Mondarth/AIDE/dev?flag=e2e&label=e2e%20coverage&logo=codecov)](https://app.codecov.io/gh/Mondarth/AIDE/tree/dev?flags%5B0%5D=e2e)

<!-- Distribution -->

[![Latest release](https://img.shields.io/github/v/release/Mondarth/AIDE?logo=github)](https://github.com/Mondarth/AIDE/releases/latest)
[![Docker image](https://img.shields.io/badge/ghcr.io-aide-2496ED?logo=docker&logoColor=white)](https://github.com/Mondarth/AIDE/pkgs/container/aide)
[![Desktop app](https://img.shields.io/badge/desktop-Windows%20%7C%20macOS%20%7C%20Linux-47848F?logo=electron&logoColor=white)](https://github.com/Mondarth/AIDE/releases/latest)
[![Docs](https://img.shields.io/badge/docs-GitHub%20Pages-blue?logo=readthedocs&logoColor=white)](https://mondarth.github.io/AIDE/)
[![Storybook](https://img.shields.io/badge/storybook-components-FF4785?logo=storybook&logoColor=white)](https://mondarth.github.io/AIDE/storybook/)
[![License: MIT](https://img.shields.io/github/license/Mondarth/AIDE)](LICENSE)

<!-- Stack & conventions -->

[![Node.js](https://img.shields.io/badge/node-%3E%3D24.15-5FA04E?logo=node.js&logoColor=white)](package.json)
[![TypeScript: strict](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)](tsconfig.json)
[![SvelteKit](https://img.shields.io/badge/SvelteKit-3-FF3E00?logo=svelte&logoColor=white)](https://svelte.dev/docs/kit)
[![Electron](https://img.shields.io/badge/Electron-44-47848F?logo=electron&logoColor=white)](https://www.electronjs.org)
[![pnpm](https://img.shields.io/badge/pnpm-12-F69220?logo=pnpm&logoColor=white)](https://pnpm.io)
[![Tested with Vitest](https://img.shields.io/badge/tested%20with-Vitest-6E9F18?logo=vitest&logoColor=white)](https://vitest.dev)
[![Tested with Playwright](https://img.shields.io/badge/e2e-Playwright-2EAD33?logo=playwright&logoColor=white)](https://playwright.dev)
[![ESLint](https://img.shields.io/badge/lint-ESLint-4B32C3?logo=eslint&logoColor=white)](eslint.config.ts)
[![Code style: Prettier](https://img.shields.io/badge/code%20style-Prettier-F7B93E?logo=prettier&logoColor=black)](prettier.config.ts)
[![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-FE5196?logo=conventionalcommits&logoColor=white)](https://www.conventionalcommits.org)
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](https://commitizen.github.io/cz-cli/)
[![semantic-release](https://img.shields.io/badge/semantic--release-conventionalcommits-E10079?logo=semantic-release)](https://github.com/semantic-release/semantic-release)
[![Dependabot](https://img.shields.io/badge/Dependabot-enabled-025E8C?logo=dependabot&logoColor=white)](.github/dependabot.yml)

AIDE is a tool for designing, building and testing adventures. It is a web application that you can run in three ways:

- **Desktop app** for Windows, macOS and Linux;
- **Node.js** package, providing the `aide` command;
- **Docker** image.

All three run the same application.

> **Status: early development.** The development framework, tests and release pipeline are in place; the adventure features are still to come.

## Quick start

**Desktop:** download the installer for your system from the [latest release](https://github.com/Mondarth/AIDE/releases/latest).

**Docker:**

```shell
docker run --rm -p 3000:3000 ghcr.io/mondarth/aide:latest
```

**Node.js** (24.15 or later): install the `.tgz` attached to the [latest release](https://github.com/Mondarth/AIDE/releases/latest), then run `aide`:

```shell
npm install --global ./mondarth-aide-<version>.tgz
aide            # http://127.0.0.1:3000
aide --help
```

See the [user documentation](https://mondarth.github.io/AIDE/user/) for options and configuration.

## Development

You need Node.js 24.15+, pnpm 12 and Docker.

```shell
git clone https://github.com/Mondarth/AIDE.git
cd AIDE && git switch dev
pnpm install
pnpm exec playwright install
pnpm dev
```

| Area               | Tooling                                                                                                                                   |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| App                | SvelteKit 3, Svelte 5 (runes), TypeScript (strict), Paraglide i18n                                                                        |
| Distribution       | `@sveltejs/adapter-node` + a shared Node host: npm CLI, Docker, Electron (electron-builder)                                               |
| Tests              | Vitest (unit; browser-mode component tests), Storybook story tests with a11y checks, Playwright e2e (Chromium, Firefox, WebKit, Electron) |
| Coverage           | V8 via Vitest (unit), monocart-coverage-reports (e2e client and server), Codecov                                                          |
| Quality            | TypeScript 7 with a TypeScript 6 fallback, svelte-check, ESLint (typescript-eslint strict), Prettier, CodeQL                              |
| Commits & releases | Husky, lint-staged, Commitizen, commitlint, semantic-release                                                                              |
| Docs               | Sphinx (MyST, Furo) in Docker, TypeDoc API reference, Storybook, published to GitHub Pages                                                |

The [developer documentation](https://mondarth.github.io/AIDE/developer/) covers the architecture, the testing approach, and the `dev` → `main` CI/CD flow in detail.

## Documentation

Published at <https://mondarth.github.io/AIDE/>, with the component library at [/storybook/](https://mondarth.github.io/AIDE/storybook/). The sources are in [`docs/`](docs/). `pnpm build:docs` builds them, and `pnpm devserve:docs` serves a live preview on <http://localhost:8088>. Both run in Docker; no Python is needed on your machine.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Report security issues as described in [SECURITY.md](SECURITY.md).

## License

[MIT](LICENSE)

## AI Disclosure

Parts of this project, including code, tests, configuration and documentation, were produced with AI assistance. All changes are human-reviewed before they are merged.
