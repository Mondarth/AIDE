# Development Workflow

## Branches

```{mermaid}
gitGraph
    commit id: "v1.0.0"
    branch dev
    checkout dev
    branch feat/maps
    commit id: "feat(maps): …"
    checkout dev
    merge feat/maps
    checkout main
    merge dev tag: "v1.1.0"
    checkout dev
    merge main id: "chore(release)"
```

- **`dev`** is the integration branch. Feature and fix branches start from it and come back to it through pull requests. Every push and pull request runs **Dev CI**.
- **`main`** holds released code only. Merging `dev` into `main` (through a pull request) triggers the **Release** workflow. That workflow reruns Dev CI, then cuts a release if the commits call for one.
- After a release, the workflow brings `dev` up to date with the release commit, or opens a pull request when it cannot fast-forward.

Name branches after the change: `feat/…`, `fix/…`, `docs/…`, `refactor/…`.

## Test first

Every change comes with tests, and a bug fix starts with a test that reproduces the bug. See {doc}`testing`.

## Commits

Commits follow [Conventional Commits](https://www.conventionalcommits.org) and are checked by commitlint. The rules are stricter than the conventional defaults:

- a **scope is required**: `feat(cli): …`, not `feat: …`;
- the header is at most **72 characters**;
- the subject is in the **imperative mood**: "add", not "added", "adds" or "adding" (a heuristic check).

The type decides the next release:

| Commit                                                              | Release |
| ------------------------------------------------------------------- | ------- |
| `fix(…)`                                                            | patch   |
| `feat(…)`                                                           | minor   |
| `!` after the scope, or a `BREAKING CHANGE:` footer                 | major   |
| `docs`, `test`, `refactor`, `style`, `build`, `ci`, `chore`, `perf` | none    |

Reference issues with `Closes #N` in the body so that the release notes link to them.

`git commit` in a terminal opens the Commitizen prompt; `pnpm commit` does the same explicitly.

## Git hooks

Installed by `pnpm install` (Husky):

- **pre-commit** runs lint-staged on the staged files: ESLint (fixing what it can), Prettier, the type check, and the tests related to the changed files.
- **prepare-commit-msg** opens the Commitizen prompt when committing from a terminal without `-m`.
- **commit-msg** runs commitlint.

The emergency bypass procedure is in `CONTRIBUTING.md`.
