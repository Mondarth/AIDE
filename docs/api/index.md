# API Reference

This reference is generated from the TSDoc comments in the source by [TypeDoc](https://typedoc.org) and [typedoc-plugin-markdown](https://typedoc-plugin-markdown.org). It covers:

- `src/lib`: the library shared by the web application's pages (`#lib`).
- `host/*`: the Node host that serves the application, used by the `aide` command, the Docker image and the desktop app.

Svelte components are documented in [Storybook](https://mondarth.github.io/AIDE/storybook/), where each one can be seen and tried out.

Do not edit the pages under `reference/`: `pnpm docs:api` regenerates them, and they are not committed.

```{toctree}
:maxdepth: 2

reference/index
```

```{toctree}
:hidden:
:glob:

reference/**
```
