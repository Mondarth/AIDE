(typescript-compilers)=

# TypeScript

All source is strict TypeScript. Besides `strict`, the compiler enforces `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitOverride`, `noImplicitReturns` and `noFallthroughCasesInSwitch`. ESLint adds typescript-eslint's `strict-type-checked` and `stylistic-type-checked` rule sets, so `any` cannot leak in unnoticed.

There are two TypeScript configurations:

- `tsconfig.json` covers the web app, tests, scripts and configuration files. It extends the configuration SvelteKit generates (`$app/tsconfig`).
- `host/tsconfig.json` covers the Node host. It uses Node's module resolution and has no DOM types.

## Two compilers

[TypeScript 7](https://devblogs.microsoft.com/typescript/) is the native (Go) port and is much faster. Not every tool can use it yet, so the project installs both:

| Package name  | Resolves to                       | Binary |
| ------------- | --------------------------------- | ------ |
| `typescript7` | `typescript@7`                    | `tsc`  |
| `typescript`  | `@typescript/typescript6` (alias) | `tsc6` |

Tools that `import 'typescript'` get version 6. Tools that run `tsc` get version 7.

| Stage                                  | Compiler                                  |
| -------------------------------------- | ----------------------------------------- |
| `pnpm typecheck` (pre-commit hook, CI) | 7                                         |
| `pnpm typecheck:fallback` (CI)         | 6                                         |
| `svelte-check`                         | 6 (needs the compiler API)                |
| typescript-eslint                      | 6 (supports `<6.1`)                       |
| Vite, Vitest, Storybook                | neither: esbuild/Rolldown strip the types |
| TypeDoc                                | 6                                         |
| semantic-release                       | none                                      |

Remove the fallback once svelte-check, typescript-eslint and TypeDoc support TypeScript 7.
