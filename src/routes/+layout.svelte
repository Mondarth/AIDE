<script lang="ts">
  import '../app.css';
  import favicon from '#lib/assets/favicon.svg';
  import { m } from '#lib/paraglide/messages.js';
  import type { LayoutProps } from './$types';

  const { children }: LayoutProps = $props();
</script>

<svelte:head>
  <title>{m.app_name()}</title>
  <link rel="icon" href={favicon} />
</svelte:head>

{@render children()}
