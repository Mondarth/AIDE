import type { Preview } from '@storybook/sveltekit';
import '../src/app.css';

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    // Accessibility violations fail the story tests (`pnpm test:stories`) and so CI.
    a11y: { test: 'error' },
  },
};

export default preview;
