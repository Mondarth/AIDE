/**
 * Checks whether the project can move to a newer Node.js major.
 *
 * The baseline (.nvmrc, `engines`, the Docker image, `@types/node`) has to be a Node.js major that
 * every delivery runs: the CLI and Docker image use Node.js itself, the desktop app uses the
 * Node.js built into Electron. So a newer major is a candidate only once it is an LTS release
 * **and** the latest stable Electron bundles it.
 *
 *   node scripts/node-baseline.ts
 *
 * Prints a Markdown report. With GITHUB_OUTPUT set it also writes `candidate=<major>`, empty when
 * there is none; the node-baseline workflow opens an issue from that.
 */
import { appendFileSync, readFileSync } from 'node:fs';

export const NODE_RELEASES_URL = 'https://nodejs.org/dist/index.json';
export const ELECTRON_RELEASES_URL = 'https://releases.electronjs.org/releases.json';

/** A Node.js release, as listed in nodejs.org/dist/index.json. */
export interface NodeRelease {
  /** For example `v26.12.0`. */
  readonly version: string;
  /** The LTS codename, or false for a release that is not LTS. */
  readonly lts: string | false;
}

/** An Electron release, as listed in releases.electronjs.org/releases.json. */
export interface ElectronRelease {
  /** For example `45.1.0` or `46.0.0-nightly.20261015`. */
  readonly version: string;
  /** The bundled Node.js version, for example `24.21.0`. */
  readonly node: string;
}

/** A Node.js major the project can move to. */
export interface Candidate {
  readonly major: number;
  /** The newest release of that major and its LTS codename. */
  readonly node: NodeRelease & { readonly lts: string };
  /** The newest stable Electron, which bundles that major or newer. */
  readonly electron: ElectronRelease;
}

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;

/** Narrows parsed JSON to a list of Node.js releases. */
export function isNodeReleases(value: unknown): value is NodeRelease[] {
  return (
    Array.isArray(value) &&
    value.every(
      release =>
        isRecord(release) &&
        typeof release.version === 'string' &&
        (typeof release.lts === 'string' || release.lts === false),
    )
  );
}

/** Narrows parsed JSON to a list of Electron releases. */
export function isElectronReleases(value: unknown): value is ElectronRelease[] {
  return (
    Array.isArray(value) &&
    value.every(release => isRecord(release) && typeof release.version === 'string' && typeof release.node === 'string')
  );
}

/** The numeric parts of a version such as `v26.1.0` or `45.0.0`; NaN parts for anything else. */
function parts(version: string): [number, number, number] {
  const [major = '', minor = '', patch = ''] = version.replace(/^v/, '').split('.');
  return [Number(major), Number(minor), Number(patch)];
}

/** The major of a version such as `v26.1.0` or `24.21.0`. */
export const majorOf = (version: string): number => parts(version)[0];

/** Orders versions newest first. */
function newestFirst(a: string, b: string): number {
  const [x, y] = [parts(a), parts(b)];
  return y[0] - x[0] || y[1] - x[1] || y[2] - x[2];
}

/** The newest stable (not prerelease) Electron release. */
export function latestStableElectron(releases: readonly ElectronRelease[]): ElectronRelease | undefined {
  return releases
    .filter(release => /^\d+\.\d+\.\d+$/.test(release.version))
    .toSorted((a, b) => newestFirst(a.version, b.version))[0];
}

/**
 * The newest Node.js major above the baseline that is LTS and that the newest stable Electron
 * bundles (Electron's Node.js major is the same or newer), if there is one.
 */
export function findCandidate(
  baseline: number,
  nodeReleases: readonly NodeRelease[],
  electronReleases: readonly ElectronRelease[],
): Candidate | undefined {
  const electron = latestStableElectron(electronReleases);
  if (electron === undefined) return undefined;
  const electronMajor = majorOf(electron.node);

  const node = nodeReleases
    .filter((release): release is NodeRelease & { lts: string } => release.lts !== false)
    .filter(release => majorOf(release.version) > baseline && majorOf(release.version) <= electronMajor)
    .toSorted((a, b) => newestFirst(a.version, b.version))[0];

  return node === undefined ? undefined : { major: majorOf(node.version), node, electron };
}

/** Formats the result as Markdown, for the job summary and the issue body. */
export function toMarkdown(baseline: number, candidate: Candidate | undefined): string {
  if (candidate === undefined) {
    return `### Node.js baseline\n\nNode.js ${baseline} is still the baseline: no newer LTS major is bundled by a stable Electron yet.\n`;
  }
  const { major, node, electron } = candidate;
  return [
    `### Node.js baseline: ${major} is a candidate`,
    '',
    `- Node.js ${major} is LTS ("${node.lts}"); the newest release is ${node.version}.`,
    `- Electron ${electron.version}, the newest stable release, bundles Node.js ${electron.node}.`,
    '',
    `To move from Node.js ${baseline} to ${major}, update together:`,
    '',
    `- [ ] \`electron\` to a release that bundles Node.js ${major}`,
    `- [ ] \`.nvmrc\` and \`engines.node\` in package.json`,
    `- [ ] the \`node:${major}-slim\` image (and its digest) in the Dockerfile`,
    `- [ ] \`@types/node\` to ${major}, and the Node.js prerequisites in README.md and CONTRIBUTING.md`,
    '',
  ].join('\n');
}

/**
 * Reads the baseline, fetches both release lists and decides.
 *
 * @throws {Error} If the baseline or either release list is malformed.
 */
export async function run(
  nvmrc: string,
  fetchJson: (url: string) => Promise<unknown>,
): Promise<{ candidate: Candidate | undefined; report: string }> {
  const baseline = Number(nvmrc.trim());
  if (!Number.isInteger(baseline)) throw new Error(`.nvmrc must hold a Node.js major, not "${nvmrc.trim()}"`);

  const [nodeReleases, electronReleases] = await Promise.all([
    fetchJson(NODE_RELEASES_URL),
    fetchJson(ELECTRON_RELEASES_URL),
  ]);
  if (!isNodeReleases(nodeReleases)) throw new Error(`${NODE_RELEASES_URL} is not a list of Node.js releases`);
  if (!isElectronReleases(electronReleases)) {
    throw new Error(`${ELECTRON_RELEASES_URL} is not a list of Electron releases`);
  }

  const candidate = findCandidate(baseline, nodeReleases, electronReleases);
  return { candidate, report: toMarkdown(baseline, candidate) };
}

/* v8 ignore start -- process wiring */
if (import.meta.main) {
  const fetchJson = async (url: string): Promise<unknown> => {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`${url}: HTTP ${String(response.status)}`);
    return response.json();
  };
  const { candidate, report } = await run(readFileSync('.nvmrc', 'utf8'), fetchJson);
  process.stdout.write(report);
  if (process.env.GITHUB_OUTPUT) {
    appendFileSync(process.env.GITHUB_OUTPUT, `candidate=${candidate === undefined ? '' : String(candidate.major)}\n`);
  }
}
/* v8 ignore stop */
