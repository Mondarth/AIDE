/**
 * The Electron main window and its navigation rules.
 *
 * @packageDocumentation
 */
import type { BrowserWindowConstructorOptions } from 'electron';

/** The parts of Electron's `BrowserWindow` this module uses; lets the window logic be tested without Electron. */
export interface AppWindow {
  once(event: 'ready-to-show', listener: () => void): unknown;
  show(): void;
  loadURL(url: string): Promise<void>;
  readonly webContents: {
    setWindowOpenHandler(handler: (details: { url: string }) => { action: 'deny' }): void;
    on(event: 'will-navigate', listener: (event: { url: string; preventDefault(): void }) => void): unknown;
  };
}

/** Opens a URL in the user's default browser (Electron's `shell.openExternal`). */
export type OpenExternal = (url: string) => Promise<void>;

/**
 * Window options. The page is untrusted web content: it runs sandboxed, isolated from the
 * preload context, and without Node.js.
 */
export function windowOptions(title: string): BrowserWindowConstructorOptions {
  return {
    title,
    width: 1280,
    height: 800,
    minWidth: 640,
    minHeight: 480,
    show: false,
    webPreferences: {
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
      webSecurity: true,
    },
  };
}

/** Whether `target` is a page of the app itself, served from `appUrl`'s origin. */
export function isAppUrl(target: string, appUrl: URL): boolean {
  return URL.canParse(target) && new URL(target).origin === appUrl.origin;
}

/** Whether `target` is an ordinary web link that may be handed to the system browser. */
export function isWebUrl(target: string): boolean {
  return URL.canParse(target) && ['http:', 'https:'].includes(new URL(target).protocol);
}

/**
 * Prepares a window to show the app: it appears once rendered, keeps navigation inside the
 * app, and sends web links to the system browser. Anything else is blocked.
 */
export function showApp(window: AppWindow, appUrl: URL, openExternal: OpenExternal): Promise<void> {
  const openOutside = (target: string): void => {
    if (isWebUrl(target)) void openExternal(target);
  };

  window.once('ready-to-show', () => {
    window.show();
  });
  window.webContents.setWindowOpenHandler(({ url }) => {
    openOutside(url);
    return { action: 'deny' };
  });
  window.webContents.on('will-navigate', event => {
    if (!isAppUrl(event.url, appUrl)) {
      event.preventDefault();
      openOutside(event.url);
    }
  });
  return window.loadURL(appUrl.href);
}
