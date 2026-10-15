import type { IncomingMessage, ServerResponse } from 'node:http';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  configureAdapterEnv,
  hasRequestHandler,
  loadBuiltHandler,
  PROTOCOL_HEADER,
  startServer,
  urlHost,
  withDefaultProtocol,
  type RequestHandler,
  type RunningServer,
} from '../../../host/server.js';
import { writeHandlerModule } from './helpers.js';

/** A handler that answers with the protocol header the app would see. */
const echoProtocol: RequestHandler = (req, res) => {
  res.end(String(req.headers[PROTOCOL_HEADER]));
};

describe('configureAdapterEnv', () => {
  it('points the adapter at the protocol header when no ORIGIN is set', () => {
    const env: NodeJS.ProcessEnv = {};
    configureAdapterEnv(env);
    expect(env.PROTOCOL_HEADER).toBe(PROTOCOL_HEADER);
  });

  it('leaves an explicit ORIGIN alone', () => {
    const env: NodeJS.ProcessEnv = { ORIGIN: 'https://aide.example' };
    configureAdapterEnv(env);
    expect(env.PROTOCOL_HEADER).toBeUndefined();
  });

  it('keeps a PROTOCOL_HEADER the operator chose', () => {
    const env: NodeJS.ProcessEnv = { PROTOCOL_HEADER: 'x-scheme' };
    configureAdapterEnv(env);
    expect(env.PROTOCOL_HEADER).toBe('x-scheme');
  });
});

describe('withDefaultProtocol', () => {
  const call = (headers: IncomingMessage['headers']): IncomingMessage['headers'] => {
    const inner = vi.fn<RequestHandler>();
    const req = { headers } as IncomingMessage;
    withDefaultProtocol(inner)(req, {} as ServerResponse);
    expect(inner).toHaveBeenCalledWith(req, {});
    return req.headers;
  };

  it('marks requests without a protocol header as plain HTTP', () => {
    expect(call({})[PROTOCOL_HEADER]).toBe('http');
  });

  it('keeps the protocol a reverse proxy reported', () => {
    expect(call({ [PROTOCOL_HEADER]: 'https' })[PROTOCOL_HEADER]).toBe('https');
  });
});

describe('hasRequestHandler', () => {
  it.each([
    ['a module exporting a handler function', { handler: () => undefined }, true],
    ['a module whose handler is not a function', { handler: 'nope' }, false],
    ['a module without a handler', {}, false],
    ['null', null, false],
    ['a primitive', 'module', false],
  ])('accepts %s: %s', (_label, module, expected) => {
    expect(hasRequestHandler(module)).toBe(expected);
  });
});

describe('loadBuiltHandler', () => {
  it('imports the handler from the given module', async () => {
    const handlerUrl = await writeHandlerModule();
    const handler = await loadBuiltHandler(handlerUrl, {});
    expect(handler).toBeTypeOf('function');
  });

  it('configures the adapter environment before importing', async () => {
    const env: NodeJS.ProcessEnv = {};
    const importModule = vi.fn(() => {
      expect(env.PROTOCOL_HEADER).toBe(PROTOCOL_HEADER);
      return Promise.resolve({ handler: echoProtocol });
    });
    await loadBuiltHandler(new URL('file:///app/build/handler.js'), env, importModule);
    expect(importModule).toHaveBeenCalledWith('file:///app/build/handler.js');
  });

  it('rejects a module without a handler', async () => {
    await expect(
      loadBuiltHandler(new URL('file:///app/build/handler.js'), {}, () => Promise.resolve({})),
    ).rejects.toThrow('file:///app/build/handler.js does not export a request handler');
  });
});

describe('urlHost', () => {
  it.each([
    ['0.0.0.0', 'localhost'],
    ['::', 'localhost'],
    ['', 'localhost'],
    ['127.0.0.1', '127.0.0.1'],
    ['::1', '[::1]'],
    ['aide.local', 'aide.local'],
  ])('formats %j as %j', (host, expected) => {
    expect(urlHost(host)).toBe(expected);
  });
});

describe('startServer', () => {
  const servers: RunningServer[] = [];
  const start = async (handler: RequestHandler = echoProtocol, port = 0): Promise<RunningServer> => {
    const server = await startServer({ host: '127.0.0.1', port, loadHandler: () => Promise.resolve(handler) });
    servers.push(server);
    return server;
  };

  afterEach(async () => {
    await Promise.allSettled(servers.splice(0).map(server => server.close()));
  });

  it('serves the app on a free port and reports its URL', async () => {
    const server = await start();

    expect(server.url.hostname).toBe('127.0.0.1');
    expect(Number(server.url.port)).toBeGreaterThan(0);
    const response = await fetch(server.url);
    expect(await response.text()).toBe('http');
  });

  it('fails when the port is taken', async () => {
    const first = await start();
    await expect(start(echoProtocol, Number(first.url.port))).rejects.toThrow(/EADDRINUSE/);
  });

  it('closes, and refuses to close twice', async () => {
    const server = await start();
    await server.close();
    await expect(fetch(server.url)).rejects.toThrow();
    await expect(server.close()).rejects.toThrow(/not running/i);
  });
});
