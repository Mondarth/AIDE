# Contributing to AIDE

Thank you for your interest. This project is at an early stage, so expect things to move around.

The [developer documentation](https://mondarth.github.io/AIDE/developer/) (sources in [`docs/developer/`](docs/developer/)) covers the design and tooling in depth. This file is the short version.

## Getting set up

You need Node.js 24.15 or later, [pnpm](https://pnpm.io) 12 and Docker.

```shell
git clone <URL of your fork>
cd AIDE
git switch dev
pnpm install
pnpm exec playwright install
```

`pnpm install` also installs the git hooks described below. The project only accepts pnpm; npm installs are refused.

## Workflow

1. Create a short-lived branch from **`dev`**, named for the change: `feat/...`, `fix/...`, `docs/...`.
2. Write a failing test first, then the change. A bug fix starts with a test that reproduces the bug.
3. Run the checks (below).
4. Commit using Conventional Commits.
5. Open a pull request against **`dev`**. The **CI passed** check must be green before it is merged.

`main` only receives merges from `dev`; each merge may produce a release. Keep pull requests small and focused, and update the documentation and stories alongside the code.

## Checks

| Command                       | What it checks                                                         |
| ----------------------------- | ---------------------------------------------------------------------- |
| `pnpm typecheck`              | Types, with TypeScript 7 (`pnpm typecheck:fallback` uses TypeScript 6) |
| `pnpm check`                  | Svelte components (`svelte-check`)                                     |
| `pnpm lint`                   | ESLint; warnings fail                                                  |
| `pnpm format:check`           | Formatting (`pnpm format` fixes it)                                    |
| `pnpm test:coverage`          | Unit, component and story tests, with the coverage thresholds          |
| `pnpm build && pnpm test:e2e` | End-to-end tests in Chromium, Firefox and WebKit                       |
| `pnpm test:e2e:electron`      | End-to-end tests of the desktop app (needs a display, or `xvfb-run`)   |
| `pnpm build:docs`             | The documentation builds with no warnings                              |

CI runs all of these, and also builds and tests the Docker image.

## Code standards

- All source is strict TypeScript. No JavaScript source files, no `any`, no `@ts-ignore`.
- Every module has tests: unit tests in `tests/unit/` mirroring the source tree (`*.test.ts`), component tests next to them (`*.svelte.test.ts`), and a story for every UI component (`*.stories.svelte`).
- User-facing text goes in `messages/en.json`, never hard-coded.
- Public functions in `src/lib` and `host` have TSDoc comments; they become the API reference.
- Components use the design tokens (`--aide-*`) in scoped styles, and must pass the accessibility checks.

## Commit messages

Commits must follow [Conventional Commits](https://www.conventionalcommits.org), with these extra rules:

- a scope is required: `fix(cli): …`;
- the header is at most 72 characters;
- the subject is in the imperative mood: "add", not "added" or "adds".

The type decides the next version number, so choose it with care:

| Type                                                                | Release |
| ------------------------------------------------------------------- | ------- |
| `fix`                                                               | patch   |
| `feat`                                                              | minor   |
| `!` after the scope, or a `BREAKING CHANGE:` footer                 | major   |
| `docs`, `test`, `refactor`, `style`, `perf`, `build`, `ci`, `chore` | none    |

When you commit from a terminal, Commitizen prompts you for the parts of the message (or run `pnpm commit`). commitlint then rejects any message that does not conform. Reference issues with `Closes #N` in the body so that the release notes link to them.

Releases are fully automated. Never edit the version number or `CHANGELOG.md` by hand.

## Git hooks

The pre-commit hook runs ESLint, Prettier, the type check and the tests related to your staged files. The commit-msg hook runs commitlint.

### Emergency bypass

Do not bypass the hooks as a matter of routine. If you genuinely must, for example to save work when a hook itself is broken:

```shell
git commit --no-verify -m "fix(scope): describe the change"
```

Before you push, fix whatever blocked the hooks, then revalidate:

```shell
pnpm format:check && pnpm lint && pnpm typecheck && pnpm check && pnpm test
git commit --amend --no-edit
```

The first line repeats the pre-commit checks by hand. The amend alone would not, because the hook only looks at staged files. The amend does re-run commitlint on the message. If either step fails, fix the problem and repeat until both pass. Say in the pull request that the hooks were bypassed and why. CI runs the same checks regardless, so a bypassed commit that does not pass will not be merged.

## AI Disclosure

Parts of this project, including code, tests, configuration and documentation, were produced with AI assistance. All changes are human-reviewed before they are merged. If you use AI tools for a contribution, review the output yourself before submitting it; you are responsible for what you submit.
