import { describe, expect, it, vi } from 'vitest';
import {
  DEFAULT_HOST,
  DEFAULT_PORT,
  ExitCode,
  parseCommand,
  parsePort,
  run,
  UsageError,
  type CliDeps,
} from '../../../host/cli.js';
import type { RunningServer, ServerOptions } from '../../../host/server.js';
import { writeHandlerModule } from './helpers.js';

describe('parsePort', () => {
  it.each(['0', '80', '3000', '65535'])('accepts %s', value => {
    expect(parsePort(value)).toBe(Number(value));
  });

  it.each(['', 'abc', '-1', '1.5', '65536', '123456', ' 80'])('rejects %j', value => {
    expect(() => parsePort(value)).toThrow(UsageError);
  });
});

describe('parseCommand', () => {
  it('serves on the defaults when nothing is given', () => {
    expect(parseCommand([], {})).toEqual({ kind: 'serve', host: DEFAULT_HOST, port: DEFAULT_PORT });
  });

  it('takes the address from HOST and PORT', () => {
    expect(parseCommand([], { HOST: '0.0.0.0', PORT: '8080' })).toEqual({ kind: 'serve', host: '0.0.0.0', port: 8080 });
  });

  it('prefers options over the environment', () => {
    expect(parseCommand(['--host', '::1', '-p', '9000'], { HOST: '0.0.0.0', PORT: '8080' })).toEqual({
      kind: 'serve',
      host: '::1',
      port: 9000,
    });
  });

  it.each([
    [['--help'], 'help'],
    [['-h'], 'help'],
    [['--version'], 'version'],
    [['-v'], 'version'],
    [['--help', '--version'], 'help'],
  ])('recognises %j', (argv, kind) => {
    expect(parseCommand(argv, {}).kind).toBe(kind);
  });

  it.each([[['--bogus']], [['positional']], [['--port']]])('rejects %j as a usage error', argv => {
    expect(() => parseCommand(argv, {})).toThrow(UsageError);
  });

  it('rejects an invalid PORT', () => {
    expect(() => parseCommand([], { PORT: 'eighty' })).toThrow('Invalid port "eighty"');
  });
});

describe('run', () => {
  const setup = (startServer?: (options: ServerOptions) => Promise<RunningServer>) => {
    const out = vi.fn<(text: string) => void>();
    const err = vi.fn<(text: string) => void>();
    const close = vi.fn(() => Promise.resolve());
    const shutdown: (() => void)[] = [];
    const deps: CliDeps = {
      io: { out, err },
      env: {},
      handlerUrl: new URL('file:///app/build/handler.js'),
      startServer: startServer ?? (() => Promise.resolve({ url: new URL('http://127.0.0.1:3000/'), close })),
      onShutdown: listener => shutdown.push(listener),
    };
    return { deps, out, err, close, shutdown };
  };

  it('prints the usage for --help', async () => {
    const { deps, out } = setup();
    expect(await run(['--help'], deps)).toBe(ExitCode.ok);
    expect(out).toHaveBeenCalledWith(expect.stringContaining('Usage: aide [options]'));
    expect(out).toHaveBeenCalledWith(expect.stringContaining(`default: ${DEFAULT_PORT}`));
  });

  it('prints the version for --version', async () => {
    const { deps, out } = setup();
    expect(await run(['--version'], deps)).toBe(ExitCode.ok);
    expect(out).toHaveBeenCalledWith(__AIDE_VERSION__);
  });

  it('reports usage errors with exit code 2', async () => {
    const { deps, err } = setup();
    expect(await run(['--bogus'], deps)).toBe(ExitCode.usage);
    expect(err).toHaveBeenCalledWith(expect.stringMatching(/^aide: .*--bogus/));
  });

  it('starts the server, announces it and stops on shutdown', async () => {
    const startServer = vi.fn<(options: ServerOptions) => Promise<RunningServer>>();
    const { deps, out, close, shutdown } = setup(startServer);
    startServer.mockResolvedValue({ url: new URL('http://127.0.0.1:4000/'), close });

    expect(await run(['--port', '4000'], deps)).toBe(ExitCode.ok);
    expect(startServer).toHaveBeenCalledWith(expect.objectContaining({ host: DEFAULT_HOST, port: 4000 }));
    expect(out).toHaveBeenCalledWith(`AIDE ${__AIDE_VERSION__} is running at http://127.0.0.1:4000/`);

    expect(shutdown).toHaveLength(1);
    shutdown[0]?.();
    expect(out).toHaveBeenLastCalledWith('Stopping AIDE…');
    expect(close).toHaveBeenCalledOnce();
  });

  it('loads the built handler from the configured location', async () => {
    const startServer = vi.fn<(options: ServerOptions) => Promise<RunningServer>>();
    const { deps } = setup(startServer);
    startServer.mockImplementation(async options => {
      await expect(options.loadHandler()).resolves.toBeTypeOf('function');
      return { url: new URL('http://127.0.0.1:3000/'), close: () => Promise.resolve() };
    });

    expect(await run([], { ...deps, handlerUrl: await writeHandlerModule() })).toBe(ExitCode.ok);
    expect(startServer).toHaveBeenCalledOnce();
  });

  it('reports a failure to close', async () => {
    const { deps, err, close, shutdown } = setup();
    close.mockRejectedValueOnce(new Error('stuck'));

    await run([], deps);
    shutdown[0]?.();
    await vi.waitFor(() => {
      expect(err).toHaveBeenCalledWith('aide: stuck');
    });
  });

  it('reports a failure to start with exit code 1', async () => {
    const { deps, err } = setup(() => Promise.reject(new Error('listen EADDRINUSE: address already in use')));
    expect(await run([], deps)).toBe(ExitCode.failure);
    expect(err).toHaveBeenCalledWith('aide: listen EADDRINUSE: address already in use');
  });
});
