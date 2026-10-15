#!/usr/bin/env node
/**
 * The `aide` command: starts the AIDE web application.
 *
 * This is the entry point of the npm package and of the Docker image.
 *
 * @packageDocumentation
 */
import { parseArgs } from 'node:util';
import { m } from '../src/lib/paraglide/messages.js';
import { errorMessage } from './errors.js';
import { loadBuiltHandler, startServer, type RunningServer, type ServerOptions } from './server.js';

/** Address the server listens on unless told otherwise. Loopback only: AIDE is a local tool. */
export const DEFAULT_HOST = '127.0.0.1';

/** Port the server listens on unless told otherwise. */
export const DEFAULT_PORT = 3000;

/** Exit codes, following the usual shell conventions. */
export const ExitCode = { ok: 0, failure: 1, usage: 2 } as const;

/** What the command line asks for. */
export type CliCommand =
  | { readonly kind: 'help' }
  | { readonly kind: 'version' }
  | { readonly kind: 'serve'; readonly host: string; readonly port: number };

/** A mistake in the command line or environment, reported with the usage exit code. */
export class UsageError extends Error {
  override readonly name = 'UsageError';
}

/** Where the command writes its output. */
export interface CliIo {
  out(text: string): void;
  err(text: string): void;
}

/** Everything {@link run} needs from the outside world. */
export interface CliDeps {
  readonly io: CliIo;
  readonly env: NodeJS.ProcessEnv;
  /** Location of the built app's request handler. */
  readonly handlerUrl: URL;
  readonly startServer: (options: ServerOptions) => Promise<RunningServer>;
  /** Registers a callback for when the process is asked to stop. */
  readonly onShutdown: (listener: () => void) => void;
}

/**
 * Parses a port number.
 *
 * @throws {UsageError} Unless the value is a whole number from 0 to 65535.
 */
export function parsePort(value: string): number {
  const port = /^\d{1,5}$/.test(value) ? Number(value) : Number.NaN;
  if (!(port <= 65535)) throw new UsageError(m.cli_invalid_port({ value }));
  return port;
}

/**
 * Works out what to do from the arguments, falling back to the `HOST` and `PORT` environment
 * variables and then to the defaults.
 *
 * @throws {UsageError} For unknown options or an invalid port.
 */
export function parseCommand(argv: readonly string[], env: NodeJS.ProcessEnv): CliCommand {
  let values;
  try {
    ({ values } = parseArgs({
      args: [...argv],
      strict: true,
      allowPositionals: false,
      options: {
        host: { type: 'string', short: 'H' },
        port: { type: 'string', short: 'p' },
        help: { type: 'boolean', short: 'h' },
        version: { type: 'boolean', short: 'v' },
      },
    }));
  } catch (error) {
    throw new UsageError(errorMessage(error));
  }

  if (values.help) return { kind: 'help' };
  if (values.version) return { kind: 'version' };
  return {
    kind: 'serve',
    host: values.host ?? env.HOST ?? DEFAULT_HOST,
    port: parsePort(values.port ?? env.PORT ?? String(DEFAULT_PORT)),
  };
}

/**
 * Runs the command. For `serve` it resolves once the server is listening; the open server
 * keeps the process alive until a shutdown signal arrives.
 *
 * @returns The exit code to use if the process ends now.
 */
export async function run(argv: readonly string[], deps: CliDeps): Promise<number> {
  const { io } = deps;
  try {
    const command = parseCommand(argv, deps.env);
    switch (command.kind) {
      case 'help':
        io.out(m.cli_usage({ host: DEFAULT_HOST, port: DEFAULT_PORT }));
        return ExitCode.ok;
      case 'version':
        io.out(__AIDE_VERSION__);
        return ExitCode.ok;
      case 'serve': {
        const server = await deps.startServer({
          host: command.host,
          port: command.port,
          loadHandler: () => loadBuiltHandler(deps.handlerUrl, deps.env),
        });
        io.out(m.cli_listening({ version: __AIDE_VERSION__, url: server.url.href }));
        deps.onShutdown(() => {
          io.out(m.cli_stopping());
          server.close().catch((error: unknown) => {
            io.err(m.cli_error({ message: errorMessage(error) }));
          });
        });
        return ExitCode.ok;
      }
    }
  } catch (error) {
    io.err(m.cli_error({ message: errorMessage(error) }));
    return error instanceof UsageError ? ExitCode.usage : ExitCode.failure;
  }
}

/* v8 ignore start -- process wiring; exercised by the e2e suite, which runs the built CLI. */
if (import.meta.main) {
  process.exitCode = await run(process.argv.slice(2), {
    io: {
      out: text => process.stdout.write(`${text}\n`),
      err: text => process.stderr.write(`${text}\n`),
    },
    env: process.env,
    handlerUrl: new URL('../../build/handler.js', import.meta.url),
    startServer,
    onShutdown: listener => {
      process.once('SIGINT', listener);
      process.once('SIGTERM', listener);
    },
  });
}
/* v8 ignore stop */
