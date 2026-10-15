import type { Reroute } from '@sveltejs/kit/hooks';
import { deLocalizeUrl } from '#lib/paraglide/runtime.js';

/** Routes localised URLs (such as `/de/about`) to the same page as the base locale. */
export const reroute: Reroute = ({ url }) => deLocalizeUrl(url).pathname;
