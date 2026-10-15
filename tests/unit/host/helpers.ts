import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

/**
 * Writes a stand-in for the adapter's `build/handler.js` to a temporary directory, so the
 * real loader can be exercised without building the app.
 */
export async function writeHandlerModule(
  source = 'export const handler = (req, res) => res.end("stub");',
): Promise<URL> {
  const directory = await mkdtemp(path.join(tmpdir(), 'aide-handler-'));
  const file = path.join(directory, 'handler.js');
  await writeFile(file, source);
  return pathToFileURL(file);
}
