# GitHub Setup

What the repository needs on GitHub for the workflows in {doc}`ci-cd` to work.

## Branches

- Create `dev` from `main` and make it the default branch, so that pull requests target it.
- Protect `main` and `dev`: require pull requests, and require the **CI passed** status check.

## Secrets

| Secret                  | Used by | Purpose                                                                                                                                                                                                  |
| ----------------------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `PERSONAL_ACCESS_TOKEN` | Release | Pushes the release commit and tag to the protected `main`, creates the release, and updates `dev`. Needs `contents: write` and `pull-requests: write` on this repository (a fine-grained token is best). |
| `CODECOV_TOKEN`         | Dev CI  | Uploads coverage to [Codecov](https://about.codecov.io). Optional: without it the upload is skipped and CI still passes.                                                                                 |

`GITHUB_TOKEN` covers everything else, including pushing the image to GHCR.

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
