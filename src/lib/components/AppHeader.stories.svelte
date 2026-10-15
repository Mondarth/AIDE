<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import AppHeader from './AppHeader.svelte';

  const { Story } = defineMeta({
    title: 'Layout/AppHeader',
    component: AppHeader,
    tags: ['autodocs'],
    args: {
      title: 'AIDE',
      subtitle: 'Adventure Integrated Development Environment',
    },
  });
</script>

<Story name="Default" />

<Story name="With tagline" args={{ tagline: 'Design, build and test your adventures in one place.' }} />
