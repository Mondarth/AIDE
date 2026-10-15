# Setting Up

## Requirements

- [Node.js](https://nodejs.org) 24.15 or later (`.nvmrc` names the major version).
- [pnpm](https://pnpm.io) 12. `package.json` pins the exact version in `packageManager`; `pnpm self-update` brings yours in line. npm is refused (`devEngines`).
- [Docker](https://www.docker.com), for the documentation build and the container image.
- For the Electron e2e tests on a machine without a display: `xvfb-run`.

## First steps

```shell
git clone https://github.com/Mondarth/AIDE.git
cd AIDE
git switch dev
pnpm install                 # also compiles the messages, syncs SvelteKit and installs the git hooks
pnpm exec playwright install # browsers for the component, story and e2e tests
pnpm dev                     # http://localhost:5173 with hot reload
```

## Everyday commands

| Command                     | What it does                                                       |
| --------------------------- | ------------------------------------------------------------------ |
| `pnpm dev`                  | Development server with hot module reload                          |
| `pnpm storybook`            | Storybook on <http://localhost:6006>                               |
| `pnpm build`                | Builds the web app (`build/`) and the host (`dist/host/`)          |
| `pnpm start`                | Runs the built app with the `aide` CLI                             |
| `pnpm electron:dev`         | Builds, then opens the desktop app                                 |
| `pnpm electron:pack`        | Packages the desktop app, unpacked, into `dist/electron`           |
| `pnpm docker:build`         | Builds the container image `aide:local`; `pnpm docker:run` runs it |
| `pnpm typecheck`            | Type check with TypeScript 7 (`typecheck:fallback` uses 6)         |
| `pnpm check`                | `svelte-check` over the Svelte components                          |
| `pnpm lint` / `pnpm format` | ESLint / Prettier                                                  |
| `pnpm test`                 | All unit, component and story tests                                |
| `pnpm test:coverage`        | The same, with the coverage gate                                   |
| `pnpm test:e2e`             | E2E suite in Chromium, Firefox and WebKit (run `pnpm build` first) |
| `pnpm test:e2e:coverage`    | Instrumented build, Chromium e2e run and merged coverage report    |
| `pnpm test:e2e:electron`    | E2E suite against the desktop app                                  |
| `pnpm build:docs`           | API reference and Sphinx site, in Docker                           |
| `pnpm devserve:docs`        | Live documentation preview on <http://localhost:8088>              |
| `pnpm commit`               | Commitizen prompt for a Conventional Commit                        |
