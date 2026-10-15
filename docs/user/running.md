# Running AIDE

## The desktop app

Start AIDE from your applications menu. It runs a private copy of the AIDE server that only your own computer can reach, and closes it when you quit.

## The `aide` command

```shell
aide
```

prints the address AIDE is running at, by default <http://127.0.0.1:3000/>. Open it in your browser. Press {kbd}`Ctrl+C` to stop.

```text
Usage: aide [options]

Options:
  -H, --host <address>  Address to listen on (default: 127.0.0.1, env: HOST)
  -p, --port <number>   Port to listen on (default: 3000, env: PORT)
  -v, --version         Print the version and exit
  -h, --help            Print this help and exit
```

:::{important}
By default AIDE only accepts connections from your own computer. `--host 0.0.0.0` makes it reachable from your network. AIDE has no login yet, so only do that on a network you trust.
:::

Exit codes: `0` success, `1` failure (for example, the port is already in use), `2` invalid options.

## Docker

The image runs the same `aide` command, listening on port 3000 on all of the container's interfaces:

```shell
docker run --rm -p 3000:3000 ghcr.io/mondarth/aide:latest
```

The container reports its health to Docker (`docker ps` shows `healthy`) and stops promptly on `docker stop`.
