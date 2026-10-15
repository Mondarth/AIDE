import { appInfo } from '#lib/app-info.js';
import type { RequestHandler } from './$types';

/**
 * Liveness probe for the Docker health check, the Electron shell and monitoring.
 * Responds with `{ "status": "ok", "version": "<version>" }`.
 */
export const GET = (() =>
  Response.json(
    { status: 'ok', version: appInfo().version },
    { headers: { 'cache-control': 'no-store' } },
  )) satisfies RequestHandler;
