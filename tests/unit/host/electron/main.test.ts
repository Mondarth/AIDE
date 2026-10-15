import { describe, expect, it, vi } from 'vitest';
import type { RunningServer, ServerOptions } from '../../../../host/server.js';
import type { AppWindow } from '../../../../host/electron/window.js';
import { writeHandlerModule } from '../helpers.js';

// The real module only exists inside Electron. `bootstrap` receives everything through its
// parameters; the import just has to resolve.
vi.mock('electron', () => ({ app: {}, BrowserWindow: vi.fn(), shell: {} }));

const { bootstrap } = await import('../../../../host/electron/main.js');
type ElectronDeps = Parameters<typeof bootstrap>[0];
type AppEvent = Parameters<ElectronDeps['app']['on']>[0];

function setup(platform: NodeJS.Platform = 'linux') {
  const listeners = new Map<AppEvent, () => void>();
  const close = vi.fn(() => Promise.resolve());
  const server: RunningServer = { url: new URL('http://127.0.0.1:41234/'), close };
  const windows: AppWindow[] = [];
  const deps = {
    app: {
      whenReady: vi.fn(() => Promise.resolve()),
      on: vi.fn((event: AppEvent, listener: () => void) => listeners.set(event, listener)),
      quit: vi.fn(),
    },
    createWindow: vi.fn(() => {
      const window: AppWindow = {
        once: vi.fn(),
        show: vi.fn(),
        loadURL: vi.fn(() => Promise.resolve()),
        webContents: { setWindowOpenHandler: vi.fn(), on: vi.fn() },
      };
      windows.push(window);
      return window;
    }),
    windowCount: vi.fn(() => windows.length),
    openExternal: vi.fn(() => Promise.resolve()),
    startServer: vi.fn<(options: ServerOptions) => Promise<RunningServer>>(() => Promise.resolve(server)),
    handlerUrl: new URL('file:///app/build/handler.js'),
    env: {},
    platform,
  } satisfies ElectronDeps;
  const emit = (event: AppEvent): void => {
    listeners.get(event)?.();
  };
  return { deps, windows, close, emit };
}

describe('bootstrap', () => {
  it('starts a loopback server on a free port once Electron is ready', async () => {
    const { deps } = setup();
    await bootstrap(deps);

    expect(deps.app.whenReady).toHaveBeenCalledOnce();
    expect(deps.startServer).toHaveBeenCalledWith(expect.objectContaining({ host: '127.0.0.1', port: 0 }));
  });

  it('loads the built handler from the configured location', async () => {
    const { deps } = setup();
    await bootstrap({ ...deps, handlerUrl: await writeHandlerModule() });

    const options = deps.startServer.mock.calls[0]?.[0];
    await expect(options?.loadHandler()).resolves.toBeTypeOf('function');
  });

  it('opens a window titled with the product name and showing the app', async () => {
    const { deps, windows } = setup();
    await bootstrap(deps);

    expect(deps.createWindow).toHaveBeenCalledWith(expect.objectContaining({ title: 'AIDE' }));
    expect(windows[0]?.loadURL).toHaveBeenCalledWith('http://127.0.0.1:41234/');
  });

  it('quits when the last window closes, except on macOS', async () => {
    const linux = setup('linux');
    await bootstrap(linux.deps);
    linux.emit('window-all-closed');
    expect(linux.deps.app.quit).toHaveBeenCalledOnce();

    const mac = setup('darwin');
    await bootstrap(mac.deps);
    mac.emit('window-all-closed');
    expect(mac.deps.app.quit).not.toHaveBeenCalled();
  });

  it('reopens a window when activated without one', async () => {
    const { deps, windows, emit } = setup('darwin');
    await bootstrap(deps);

    emit('activate');
    expect(windows).toHaveLength(1);

    windows.length = 0;
    emit('activate');
    expect(deps.createWindow).toHaveBeenCalledTimes(2);
  });

  it('stops the server when the app quits', async () => {
    const { deps, close, emit } = setup();
    await bootstrap(deps);

    emit('will-quit');
    expect(close).toHaveBeenCalledOnce();
  });
});
