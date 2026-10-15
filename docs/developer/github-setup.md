# GitHub Setup

What the repository needs on GitHub for the workflows in {doc}`ci-cd` to work.

## Branches

- Create `dev` from `main` and make it the default branch, so that pull requests target it.
- Protect both branches with a ruleset (Settings → Rules → Rulesets), targeting `dev` and `main`:
  - **Require a pull request before merging**, with **0** required approvals (you cannot approve your own pull request). Allow merge commits: merge `dev` into `main` with a merge commit, never a squash, so that semantic-release sees every commit and the branches do not diverge.
  - **Require status checks to pass**: **CI passed**.
  - **Bypass list**: the release App (below), mode **Always**. Nobody else, not even administrators, so every human change goes through a pull request.

(release-app)=

## The release App

The release workflow pushes to the protected branches: semantic-release pushes the release commit and tag to `main`, and the _Bring dev up to date_ job fast-forwards `dev`. It does this as a GitHub App, which is the only actor allowed to bypass the rulesets. Each run gets a token that expires within an hour; there is no long-lived token to rotate.

To set it up:

1. **Create the App**: organisation (or account) Settings → Developer settings → GitHub Apps → **New GitHub App**.
   - Name: anything unique, for example `mondarth-aide-release`. Homepage URL: the repository's URL.
   - Webhook: untick **Active**.
   - Repository permissions: **Contents**, **Pull requests** and **Issues**, all **Read and write** (Metadata: read-only is added automatically).
   - Where can this App be installed: **Only on this account**.
2. **Generate a private key** on the App's page (a `.pem` file downloads), and note the **Client ID** (in the _About_ section at the top of the App's _General_ page; it starts with `Iv`).
3. **Install the App** (Install App → your organisation → **Only select repositories** → this repository).
4. **Store the credentials** in the repository (Settings → Secrets and variables → Actions): the Client ID as the _variable_ `RELEASE_APP_CLIENT_ID`, and the whole `.pem` file as the _secret_ `RELEASE_APP_PRIVATE_KEY`. Then delete the downloaded file.
5. **Add the App to the rulesets' bypass list** (above).

Release commits are authored by `<app-name>[bot]`. If the private key leaks, revoke it on the App's page and generate a new one.

If the push to `dev` is refused, or `dev` has moved on since the release, the workflow opens a pull request from `main` to `dev` instead; merge it with a merge commit.

## Secrets and variables

| Name                      | Kind     | Used by | Purpose                                                                                                                  |
| ------------------------- | -------- | ------- | ------------------------------------------------------------------------------------------------------------------------ |
| `RELEASE_APP_CLIENT_ID`   | Variable | Release | The release App's Client ID (see {ref}`release-app`).                                                                    |
| `RELEASE_APP_PRIVATE_KEY` | Secret   | Release | The release App's private key.                                                                                           |
| `CODECOV_TOKEN`           | Secret   | Dev CI  | Uploads coverage to [Codecov](https://about.codecov.io). Optional: without it the upload is skipped and CI still passes. |

`GITHUB_TOKEN` covers everything else, including pushing the image to GHCR and attaching the installers to the release.

## Settings

- **Pages**: Settings → Pages → Source: **GitHub Actions**.
- **Packages**: after the first release, make the `aide` container package public (Package settings → Change visibility) if the image should be pullable without logging in.
- **Code security**: enable Dependabot alerts and security updates, and code scanning (the CodeQL workflow uploads its results).

## First release

semantic-release finds the previous version from git tags. With no tag, the first release is `1.0.0`. To start at `0.1.0` instead, tag the current `main` before the first release:

```shell
git tag v0.0.0 && git push origin v0.0.0
```

The next `feat` commit then releases `0.1.0`.

## Signing (future)

The desktop installers are unsigned. To sign them, add the certificates as secrets (`CSC_LINK`, `CSC_KEY_PASSWORD`; for macOS also `APPLE_ID`, `APPLE_APP_SPECIFIC_PASSWORD`, `APPLE_TEAM_ID`), pass them to the _Desktop installers_ job, and remove `CSC_IDENTITY_AUTO_DISCOVERY: 'false'`.
