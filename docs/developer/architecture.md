# Architecture

AIDE is one SvelteKit application delivered three ways. Every delivery runs the same server code, so a feature written once works everywhere.

```{mermaid}
flowchart LR
    subgraph app [Web application]
      routes[src/routes] --> lib[src/lib]
    end
    app -- "vite build (adapter-node)" --> build[build/handler.js]
    subgraph host [Node host: host/]
      server[server.ts] --> build
      cli[cli.ts] --> server
      main[electron/main.ts] --> server
    end
    cli --> npm[npm package: aide command]
    cli --> docker[Docker image: ENTRYPOINT]
    main --> desktop[Electron desktop app]
```

## The web application (`src/`)

A [SvelteKit](https://svelte.dev/docs/kit) app with Svelte 5 runes, built by `@sveltejs/adapter-node` into `build/`. SvelteKit 3 has no `svelte.config.js`: the framework options are in `vite.config.ts`.

- `src/routes`: pages and endpoints. `GET /healthz` is the liveness probe used by Docker and monitoring.
- `src/lib`: code shared by routes, imported as `#lib/...` (Node subpath imports, see `package.json`).
- `src/lib/components`: UI components, each with a story (`*.stories.svelte`) and a test.
- `src/app.css`: design tokens (`--aide-*` custom properties). Components style themselves with scoped `<style>` blocks that use these tokens, never literal colours.

## The host (`host/`)

Node code that serves the built app. `vite.host.config.ts` bundles it into `dist/host/`.

- `server.ts`: starts an HTTP server around the adapter's request handler. Every distribution goes through it.
- `cli.ts`: the `aide` command. Parses options, starts the server, stops it on `SIGINT`/`SIGTERM`.
- `electron/main.ts`: the Electron main process. Starts the server on a random loopback port and opens a window on it.
- `electron/window.ts`: window options and navigation rules. The page is sandboxed, context-isolated and has no Node.js access. Links to other sites open in the system browser, and every other kind of URL is blocked.

Side effects stay at the edges. Each entry point ends with a short block that wires in the real process, Electron or file system; everything else receives these as parameters. That is what makes the host unit-testable.

## The three deliveries

| Delivery     | Built by               | Entry point                  | Defaults                                                   |
| ------------ | ---------------------- | ---------------------------- | ---------------------------------------------------------- |
| npm package  | `pnpm pack` (release)  | `aide` → `dist/host/cli.js`  | `127.0.0.1:3000`                                           |
| Docker image | `Dockerfile`           | `node dist/host/cli.js`      | `0.0.0.0:3000`, runs as `node`, health check on `/healthz` |
| Desktop app  | `electron-builder.yml` | `dist/host/electron/main.js` | `127.0.0.1`, random port                                   |
