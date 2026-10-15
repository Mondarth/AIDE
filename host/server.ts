/**
 * The HTTP host for the AIDE web application.
 *
 * Every distribution runs the app through this module: the `aide` command (installed from npm
 * and used as the Docker entry point) and the Electron main process. It serves the SvelteKit
 * app that `@sveltejs/adapter-node` builds into `build/`.
 *
 * @packageDocumentation
 */
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import type { AddressInfo } from 'node:net';

/** A Node request listener, as exported by the adapter's `build/handler.js`. */
export type RequestHandler = (req: IncomingMessage, res: ServerResponse) => void;

/** Imports a module by URL. Replaceable so the loader can be tested without a build. */
export type ModuleImporter = (specifier: string) => Promise<unknown>;

/** Options for {@link startServer}. */
export interface ServerOptions {
  /** Address to listen on, such as `127.0.0.1` or `0.0.0.0`. */
  readonly host: string;
  /** Port to listen on; `0` lets the operating system choose a free one. */
  readonly port: number;
  /** Supplies the request handler, normally {@link loadBuiltHandler}. */
  readonly loadHandler: () => Promise<RequestHandler>;
}

/** A server started by {@link startServer}. */
export interface RunningServer {
  /** The address the app can be reached at. */
  readonly url: URL;
  /** Stops accepting connections, drops idle ones and resolves once the server has closed. */
  close(): Promise<void>;
}

/**
 * The request header the adapter reads the protocol from.
 *
 * Without an `ORIGIN`, the adapter assumes every request arrived over HTTPS, so form posts
 * from a plain-HTTP local install would fail its CSRF check. The host sets this header to
 * `http` unless a reverse proxy has already set it.
 */
export const PROTOCOL_HEADER = 'x-forwarded-proto';

/**
 * Tells the adapter where to find the request protocol, unless the operator has configured
 * `ORIGIN` (or `PROTOCOL_HEADER`) themselves. Must run before the handler module is imported,
 * because the adapter reads its environment once, at import.
 */
export function configureAdapterEnv(env: NodeJS.ProcessEnv): void {
  if (env.ORIGIN === undefined) {
    env.PROTOCOL_HEADER ??= PROTOCOL_HEADER;
  }
}

/** Wraps a handler so that requests without a protocol header are marked as plain HTTP. */
export function withDefaultProtocol(handler: RequestHandler): RequestHandler {
  return (req, res) => {
    req.headers[PROTOCOL_HEADER] ??= 'http';
    handler(req, res);
  };
}

/** Narrows a module namespace to one that exports a request `handler`. */
export function hasRequestHandler(module: unknown): module is { handler: RequestHandler } {
  return typeof module === 'object' && module !== null && 'handler' in module && typeof module.handler === 'function';
}

/**
 * Loads the request handler of the built web app.
 *
 * @param handlerUrl - Location of the adapter's `handler.js`.
 * @param env - Environment the adapter reads its settings from.
 * @param importModule - Module loader; defaults to a dynamic `import()`.
 * @throws {Error} If the module does not export a handler (usually because the app is not built).
 */
export async function loadBuiltHandler(
  handlerUrl: URL,
  env: NodeJS.ProcessEnv,
  importModule: ModuleImporter = specifier => import(/* @vite-ignore */ specifier),
): Promise<RequestHandler> {
  configureAdapterEnv(env);
  const module = await importModule(handlerUrl.href);
  if (!hasRequestHandler(module)) {
    throw new Error(`${handlerUrl.href} does not export a request handler`);
  }
  return module.handler;
}

/** Formats a listen address for use in a URL: wildcards become `localhost`, IPv6 gets brackets. */
export function urlHost(host: string): string {
  if (host === '0.0.0.0' || host === '::' || host === '') return 'localhost';
  return host.includes(':') ? `[${host}]` : host;
}

/**
 * Starts the web app on an HTTP server.
 *
 * @throws {Error} If the handler cannot be loaded or the address cannot be bound (for example `EADDRINUSE`).
 */
export async function startServer(options: ServerOptions): Promise<RunningServer> {
  const server = createServer(withDefaultProtocol(await options.loadHandler()));

  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(options.port, options.host, () => {
      server.off('error', reject);
      resolve();
    });
  });

  // Listening on a host and port always yields an AddressInfo (strings are for pipes and sockets).
  const { port } = server.address() as AddressInfo;

  return {
    url: new URL(`http://${urlHost(options.host)}:${port}/`),
    close: () =>
      new Promise<void>((resolve, reject) => {
        server.close(error => {
          if (error) reject(error);
          else resolve();
        });
        server.closeIdleConnections();
      }),
  };
}
