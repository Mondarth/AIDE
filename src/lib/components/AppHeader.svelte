<!--
  @component
  The application banner: the product name, its expansion and an optional tagline.
-->
<script lang="ts">
  interface Props {
    /** The short product name, shown as the page heading. */
    title: string;
    /** The expanded name, shown under the heading. */
    subtitle: string;
    /** An optional one-line description. */
    tagline?: string;
  }

  const { title, subtitle, tagline }: Props = $props();
</script>

<header class="app-header">
  <h1>{title}</h1>
  <p class="subtitle">{subtitle}</p>
  {#if tagline}
    <p class="tagline">{tagline}</p>
  {/if}
</header>

<style>
  .app-header {
    padding: var(--aide-space-4) var(--aide-space-3);
    border-bottom: 1px solid var(--aide-color-border);
    background: var(--aide-color-surface);
  }

  h1 {
    margin: 0;
    font-size: 2.5rem;
    letter-spacing: 0.08em;
    color: var(--aide-color-accent);
  }

  .subtitle {
    margin: var(--aide-space-1) 0 0;
    font-weight: 600;
  }

  .tagline {
    margin: var(--aide-space-2) 0 0;
    color: var(--aide-color-text-muted);
  }
</style>
