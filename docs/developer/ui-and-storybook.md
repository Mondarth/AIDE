# UI Components and Storybook

Components live in `src/lib/components`. Each component has:

- the component, `Name.svelte`, using Svelte 5 runes (`$props`, `$state`, `$derived`, `$effect`) and a typed `Props` interface;
- a story, `Name.stories.svelte`, in [Svelte CSF](https://github.com/storybookjs/addon-svelte-csf);
- a test, `tests/unit/lib/components/Name.svelte.test.ts`.

```shell
pnpm storybook        # http://localhost:6006
pnpm build:storybook  # static build in storybook-static/
```

Stories double as tests (see {doc}`testing`). The published Storybook is at [/storybook/](https://mondarth.github.io/AIDE/storybook/), next to this documentation.

## Styling

- Scoped `<style>` blocks in the component; no global class names.
- Colours, fonts, spacing and radii come from the `--aide-*` custom properties in `src/app.css`, which also define the dark theme. Do not hard-code values.
- Components should pass the accessibility checks (they run on every story).

## State and data

Components receive data through props and report changes through callback props. They do not reach into global state or fetch data themselves. That keeps them easy to show in Storybook and to test.
