/**
 * Facts about the running application.
 *
 * @packageDocumentation
 */

/** Identifying details of this build of AIDE. */
export interface AppInfo {
  /** Semantic version of the build, for example `1.4.0`. */
  readonly version: string;
}

/**
 * Returns the details of this build.
 *
 * @example
 * ```ts
 * appInfo().version; // '1.4.0'
 * ```
 */
export function appInfo(): AppInfo {
  return { version: __AIDE_VERSION__ };
}
