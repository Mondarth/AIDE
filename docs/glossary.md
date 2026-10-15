# Glossary

```{glossary}
Adapter
  The SvelteKit adapter (`@sveltejs/adapter-node`) that turns the app into a Node.js server in `build/`.

Continuous Integration
CI
  Building and testing every change automatically. Here: the `Dev CI` workflow.

Host
  The Node.js process that serves the built app: the `aide` command, the Docker image's entry point, or the Electron main process. See `host/`.

Story
  One rendered state of a UI component, written for Storybook. Every story is also run as a test.
```
