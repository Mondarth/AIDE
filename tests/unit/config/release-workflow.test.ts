import { readFileSync } from 'node:fs';
import { parse } from 'yaml';
import { describe, expect, it } from 'vitest';

/**
 * GitHub Pages names a deployment after its commit. When the first deployment of v0.0.2 stalled
 * and was cancelled, re-running the job could not help: the re-run found the first attempt's
 * `github-pages` artifact as well as its own, and then the deployment for that commit was already
 * cancelled. Publishing again needs a run on a new commit, or a manual run, and re-runs need an
 * artifact of their own.
 */

interface Step {
  uses?: string;
  with?: Record<string, string>;
}

interface Workflow {
  on: Record<string, unknown>;
  jobs: Record<string, { if?: string; steps?: Step[] }>;
}

const workflow = parse(readFileSync('.github/workflows/release.yml', 'utf8')) as Workflow;

/** The `with` inputs of the pages job's step that uses the given action. */
function inputsOf(action: string): Record<string, string> {
  const step = workflow.jobs.pages?.steps?.find(candidate => candidate.uses?.startsWith(`${action}@`));
  if (step === undefined) throw new Error(`the pages job does not use ${action}`);
  return step.with ?? {};
}

describe('release workflow', () => {
  it('can be started by hand', () => {
    expect(workflow.on).toHaveProperty('workflow_dispatch');
  });

  it('runs only on main, whichever way it is started', () => {
    expect(workflow.jobs.ci?.if).toBe("github.ref == 'refs/heads/main'");
  });

  it('gives each attempt its own Pages artifact', () => {
    const uploaded = inputsOf('actions/upload-pages-artifact').name;
    expect(uploaded).toContain('${{ github.run_attempt }}');
    expect(inputsOf('actions/deploy-pages').artifact_name).toBe(uploaded);
  });
});
