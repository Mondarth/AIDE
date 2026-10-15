# Documentation

This site combines the user guide, the developer guide, an API reference generated from the source, and the Storybook. It is published to GitHub Pages on every push to `main`.

## Sphinx

The guides are Markdown pages ([MyST](https://myst-parser.readthedocs.io)) in `docs/`, built by [Sphinx](https://www.sphinx-doc.org) with the [Furo](https://pradyunsg.me/furo/) theme. Diagrams use [Mermaid](https://mermaid.js.org).

All Python tooling lives in a Docker image (`docs/Dockerfile`, pinned `docs/requirements.txt`); nothing Python is installed on your machine or in the Node project.

```shell
pnpm build:docs     # docs/_build/html
pnpm devserve:docs  # live preview on http://localhost:8088
```

Any Sphinx warning fails the build (`-W`), so broken links and missing pages are caught in CI.

## API reference

[TypeDoc](https://typedoc.org) with [typedoc-plugin-markdown](https://typedoc-plugin-markdown.org) turns the TSDoc comments of the public modules into Markdown under `docs/api/reference/`. Sphinx then builds those pages along with the guides. `pnpm docs:api` runs TypeDoc on its own; `pnpm build:docs` runs it first. The entry points are listed in `typedoc.json`, and TypeDoc warnings fail the build.

Public functions, classes and methods in `src/lib` and `host` must have TSDoc comments; ESLint (`eslint-plugin-jsdoc`) enforces this.

## Published site layout

| Path          | Content            |
| ------------- | ------------------ |
| `/`           | This documentation |
| `/api/`       | API reference      |
| `/storybook/` | Storybook          |
