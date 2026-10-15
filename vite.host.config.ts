/**
 * Builds the Node host: the `aide` CLI and the Electron main process. Both bundle the shared
 * HTTP server (host/server.ts) and the compiled messages, and load the SvelteKit app from
 * `build/` at run time.
 */
import { readFileSync } from 'node:fs';
import { builtinModules } from 'node:module';
import { paraglideVitePlugin } from '@inlang/paraglide-js';
import { defineConfig } from 'vite';

const pkg: unknown = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));
const version = typeof pkg === 'object' && pkg !== null && 'version' in pkg ? String(pkg.version) : '0.0.0';

export default defineConfig({
  define: {
    __AIDE_VERSION__: JSON.stringify(version),
  },
  plugins: [
    paraglideVitePlugin({
      project: './project.inlang',
      outdir: './src/lib/paraglide',
      emitTsDeclarations: true,
    }),
  ],
  build: {
    ssr: true,
    target: 'node24',
    outDir: 'dist/host',
    emptyOutDir: true,
    sourcemap: process.env.E2E_COVERAGE === '1',
    rollupOptions: {
      input: {
        cli: 'host/cli.ts',
        'electron/main': 'host/electron/main.ts',
      },
      external: ['electron', ...builtinModules, ...builtinModules.map(name => `node:${name}`)],
      output: {
        format: 'es',
        entryFileNames: '[name].js',
        chunkFileNames: 'chunks/[name]-[hash].js',
      },
    },
  },
  ssr: {
    // Bundle everything: the host has no run-time dependencies of its own.
    noExternal: true,
  },
});
