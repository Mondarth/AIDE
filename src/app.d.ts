// See https://svelte.dev/docs/kit/types#app.d.ts for information about these interfaces.
declare global {
  namespace App {
    // interface Error {}
    // interface Locals {}
    // interface PageData {}
    // interface PageState {}
    // interface Platform {}
  }

  /** The package version, injected at build time (see vite.config.ts). */
  const __AIDE_VERSION__: string;
}

export {};
