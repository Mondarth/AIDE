<script lang="ts">
  import { appInfo } from '#lib/app-info.js';
  import AppHeader from '#lib/components/AppHeader.svelte';
  import { m } from '#lib/paraglide/messages.js';

  const { version } = appInfo();
</script>

<AppHeader title={m.app_name()} subtitle={m.app_full_name()} tagline={m.app_tagline()} />

<main>
  <p class="version">{m.app_version({ version })}</p>
</main>

<style>
  main {
    padding: var(--aide-space-3);
  }

  .version {
    font-family: var(--aide-font-mono);
    color: var(--aide-color-text-muted);
  }
</style>
