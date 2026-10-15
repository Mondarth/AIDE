import path from 'node:path';
import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import { defineConfig, includeIgnoreFile } from 'eslint/config';
import jsdoc from 'eslint-plugin-jsdoc';
import playwright from 'eslint-plugin-playwright';
import svelte from 'eslint-plugin-svelte';
import globals from 'globals';
import ts from 'typescript-eslint';

const gitignorePath = path.resolve(import.meta.dirname, '.gitignore');

export default defineConfig(
  includeIgnoreFile(gitignorePath),
  { ignores: ['static/**', 'docs/**', 'CHANGELOG.md'] },

  js.configs.recommended,
  ts.configs.strictTypeChecked,
  ts.configs.stylisticTypeChecked,
  svelte.configs.recommended,
  prettier,
  svelte.configs.prettier,

  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
        extraFileExtensions: ['.svelte'],
      },
    },
    linterOptions: { reportUnusedDisableDirectives: 'error' },
    rules: {
      // typescript-eslint recommend turning no-undef off for TypeScript; the compiler does the job better.
      'no-undef': 'off',
      'no-console': 'error',
      eqeqeq: ['error', 'always'],
      '@typescript-eslint/consistent-type-imports': ['error', { fixStyle: 'inline-type-imports' }],
      '@typescript-eslint/consistent-type-exports': 'error',
      '@typescript-eslint/no-import-type-side-effects': 'error',
      '@typescript-eslint/explicit-module-boundary-types': 'error',
      '@typescript-eslint/switch-exhaustiveness-check': 'error',
      '@typescript-eslint/restrict-template-expressions': ['error', { allowNumber: true }],
    },
  },

  {
    files: ['**/*.svelte', '**/*.svelte.ts'],
    languageOptions: {
      parserOptions: { parser: ts.parser },
    },
  },

  // The public API (src/lib and host) is documented for TypeDoc.
  {
    files: ['src/lib/**/*.ts', 'host/**/*.ts'],
    ignores: ['src/lib/paraglide/**'],
    ...jsdoc.configs['flat/recommended-typescript-error'],
    rules: {
      ...jsdoc.configs['flat/recommended-typescript-error'].rules,
      'jsdoc/require-jsdoc': [
        'error',
        { publicOnly: true, require: { FunctionDeclaration: true, ClassDeclaration: true, MethodDefinition: true } },
      ],
      // TSDoc style: a blank line between the description and the tags.
      'jsdoc/tag-lines': ['error', 'any', { startLines: 1 }],
      'jsdoc/check-tag-names': ['error', { definedTags: ['packageDocumentation', 'remarks', 'category'] }],
      'jsdoc/require-param': 'off',
      'jsdoc/require-returns': 'off',
    },
  },

  {
    files: ['tests/**/*.ts'],
    rules: {
      // Asserting on mocked methods (`expect(app.quit)`) is the point of a test, not a `this` bug.
      '@typescript-eslint/unbound-method': 'off',
    },
  },

  {
    files: ['tests/e2e/**/*.ts'],
    ...playwright.configs['flat/recommended'],
  },

  // semantic-release only reads JavaScript configuration; it is outside the TypeScript project.
  {
    files: ['**/*.mjs'],
    ...ts.configs.disableTypeChecked,
  },

  // Configuration files and scripts run in Node only; untyped JSON parsing is checked at run time there.
  {
    files: ['*.config.ts', 'vite.host.config.ts', 'scripts/**/*.ts'],
    rules: { 'no-console': 'off' },
  },
);
