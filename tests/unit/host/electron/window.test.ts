import { describe, expect, it, vi } from 'vitest';
import { isAppUrl, isWebUrl, showApp, windowOptions, type AppWindow } from '../../../../host/electron/window.js';

type OpenHandler = Parameters<AppWindow['webContents']['setWindowOpenHandler']>[0];
type NavigateListener = Parameters<AppWindow['webContents']['on']>[1];

/** A stand-in for Electron's BrowserWindow that records the handlers registered on it. */
function fakeWindow() {
  const handlers: { readyToShow?: () => void; open?: OpenHandler; navigate?: NavigateListener } = {};
  const window = {
    once: vi.fn((_event: 'ready-to-show', listener: () => void) => {
      handlers.readyToShow = listener;
    }),
    show: vi.fn(),
    loadURL: vi.fn(() => Promise.resolve()),
    webContents: {
      setWindowOpenHandler: vi.fn((handler: OpenHandler) => {
        handlers.open = handler;
      }),
      on: vi.fn((_event: 'will-navigate', listener: NavigateListener) => {
        handlers.navigate = listener;
      }),
    },
  } satisfies AppWindow;
  return { window, handlers };
}

const appUrl = new URL('http://127.0.0.1:41234/');

describe('windowOptions', () => {
  it('isolates and sandboxes the page', () => {
    expect(windowOptions('AIDE')).toMatchObject({
      title: 'AIDE',
      show: false,
      webPreferences: { contextIsolation: true, sandbox: true, nodeIntegration: false, webSecurity: true },
    });
  });
});

describe('isAppUrl', () => {
  it.each([
    ['http://127.0.0.1:41234/projects', true],
    ['http://127.0.0.1:41235/', false],
    ['https://127.0.0.1:41234/', false],
    ['https://example.com/', false],
    ['not a url', false],
  ])('%s → %s', (target, expected) => {
    expect(isAppUrl(target, appUrl)).toBe(expected);
  });
});

describe('isWebUrl', () => {
  it.each([
    ['https://example.com/', true],
    ['http://example.com/', true],
    ['file:///etc/passwd', false],
    ['javascript:alert(1)', false],
    ['not a url', false],
  ])('%s → %s', (target, expected) => {
    expect(isWebUrl(target)).toBe(expected);
  });
});

describe('showApp', () => {
  it('loads the app and shows the window once it has rendered', async () => {
    const { window, handlers } = fakeWindow();
    await showApp(window, appUrl, vi.fn());

    expect(window.loadURL).toHaveBeenCalledWith(appUrl.href);
    expect(window.show).not.toHaveBeenCalled();
    handlers.readyToShow?.();
    expect(window.show).toHaveBeenCalledOnce();
  });

  it('opens new-window links in the system browser, never in the app', async () => {
    const { window, handlers } = fakeWindow();
    const openExternal = vi.fn(() => Promise.resolve());
    await showApp(window, appUrl, openExternal);

    expect(handlers.open?.({ url: 'https://example.com/' })).toEqual({ action: 'deny' });
    expect(openExternal).toHaveBeenCalledWith('https://example.com/');

    expect(handlers.open?.({ url: 'file:///etc/passwd' })).toEqual({ action: 'deny' });
    expect(openExternal).toHaveBeenCalledOnce();
  });

  it('keeps navigation inside the app', async () => {
    const { window, handlers } = fakeWindow();
    const openExternal = vi.fn(() => Promise.resolve());
    await showApp(window, appUrl, openExternal);

    const internal = { url: 'http://127.0.0.1:41234/next', preventDefault: vi.fn() };
    handlers.navigate?.(internal);
    expect(internal.preventDefault).not.toHaveBeenCalled();

    const external = { url: 'https://example.com/', preventDefault: vi.fn() };
    handlers.navigate?.(external);
    expect(external.preventDefault).toHaveBeenCalledOnce();
    expect(openExternal).toHaveBeenCalledWith('https://example.com/');
  });
});
