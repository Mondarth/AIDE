# Configuration

AIDE is configured with environment variables. Command-line options, where they exist, take precedence.

| Variable          | Default                           | Purpose                                                                                                     |
| ----------------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `HOST`            | `127.0.0.1` (`0.0.0.0` in Docker) | Address to listen on. Same as `--host`.                                                                     |
| `PORT`            | `3000`                            | Port to listen on. Same as `--port`.                                                                        |
| `ORIGIN`          | _(derived)_                       | The public URL of AIDE, for example `https://aide.example.com`. Set it when AIDE is behind a reverse proxy. |
| `PROTOCOL_HEADER` | `x-forwarded-proto`               | Header a reverse proxy uses to report the original protocol. Ignored when `ORIGIN` is set.                  |
| `BODY_SIZE_LIMIT` | `512K`                            | Largest request body accepted.                                                                              |

AIDE is served by the SvelteKit Node adapter, so the adapter's other [environment variables](https://svelte.dev/docs/kit/adapter-node#Environment-variables) work too.

## Behind a reverse proxy

Either set `ORIGIN` to the address users visit, or have the proxy send `X-Forwarded-Proto` (most do by default). Without either, AIDE assumes plain HTTP.
