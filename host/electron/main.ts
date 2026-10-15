/**
 * The Electron main process: starts the AIDE host on a private loopback port and shows it
 * in a desktop window.
 *
 * @packageDocumentation
 */
import { app, BrowserWindow, shell, type BrowserWindowConstructorOptions } from 'electron';
import { m } from '../../src/lib/paraglide/messages.js';
import { errorMessage } from '../errors.js';
import { loadBuiltHandler, startServer, type RunningServer, type ServerOptions } from '../server.js';
import { showApp, windowOptions, type AppWindow, type OpenExternal } from './window.js';

/** The parts of Electron's `app` this module uses. */
export interface ElectronApp {
  whenReady(): Promise<void>;
  on(event: 'window-all-closed' | 'activate' | 'will-quit', listener: () => void): unknown;
  quit(): void;
}

/** Everything {@link bootstrap} needs from Electron and the host. */
export interface ElectronDeps {
  readonly app: ElectronApp;
  readonly createWindow: (options: BrowserWindowConstructorOptions) => AppWindow;
  readonly windowCount: () => number;
  readonly openExternal: OpenExternal;
  readonly startServer: (options: ServerOptions) => Promise<RunningServer>;
  readonly handlerUrl: URL;
  readonly env: NodeJS.ProcessEnv;
  readonly platform: NodeJS.Platform;
}

/** Starts the server once Electron is ready, opens the main window, and ties the server's life to the app's. */
export async function bootstrap(deps: ElectronDeps): Promise<void> {
  await deps.app.whenReady();

  // Loopback and a free port: the app is reachable from this machine only.
  const server = await deps.startServer({
    host: '127.0.0.1',
    port: 0,
    loadHandler: () => loadBuiltHandler(deps.handlerUrl, deps.env),
  });

  const openWindow = (): Promise<void> =>
    showApp(deps.createWindow(windowOptions(m.app_name())), server.url, deps.openExternal);

  deps.app.on('window-all-closed', () => {
    // On macOS an app stays active, without windows, until the user quits it explicitly.
    if (deps.platform !== 'darwin') deps.app.quit();
  });
  deps.app.on('activate', () => {
    if (deps.windowCount() === 0) void openWindow();
  });
  deps.app.on('will-quit', () => {
    void server.close();
  });

  await openWindow();
}

/* v8 ignore start -- Electron wiring; exercised by the Electron e2e suite. */
// `import.meta.main` is always false under Electron's loader; `process.type` marks its main process.
if (process.type === 'browser') {
  // Not awaited: Electron emits `ready` only after the main module has finished evaluating.
  bootstrap({
    app,
    createWindow: options => new BrowserWindow(options),
    windowCount: () => BrowserWindow.getAllWindows().length,
    openExternal: url => shell.openExternal(url),
    startServer,
    handlerUrl: new URL('../../../build/handler.js', import.meta.url),
    env: process.env,
    platform: process.platform,
  }).catch((error: unknown) => {
    process.stderr.write(`${m.cli_error({ message: errorMessage(error) })}\n`);
    app.exit(1);
  });
}
/* v8 ignore stop */
