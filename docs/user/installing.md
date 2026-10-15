# Installing

Pick whichever suits you. Each [release](https://github.com/Mondarth/AIDE/releases) provides all three.

## Desktop app

Download the installer for your system from the latest release:

| System  | File                                                      |
| ------- | --------------------------------------------------------- |
| Windows | `AIDE-Setup-<version>.exe`                                |
| macOS   | `AIDE-<version>-arm64.dmg` (Apple silicon), or the `.zip` |
| Linux   | `AIDE-<version>.AppImage`, or `aide_<version>_amd64.deb`  |

:::{warning}
The installers are not yet code-signed. Windows SmartScreen and macOS Gatekeeper will warn that the publisher is unknown. On macOS, open the app the first time with right-click → **Open**.
:::

## Node.js

Requires [Node.js](https://nodejs.org) 24.15 or later. Install the package attached to the release:

```shell
npm install --global https://github.com/Mondarth/AIDE/releases/download/v<version>/mondarth-aide-<version>.tgz
```

This gives you the `aide` command; see {doc}`running`.

## Docker

```shell
docker run --rm -p 3000:3000 ghcr.io/mondarth/aide:latest
```

Then open <http://localhost:3000>. Images are tagged with the full version (`1.2.3`), the minor version (`1.2`), the major version (`1`) and `latest`, and are built for `linux/amd64` and `linux/arm64`.
