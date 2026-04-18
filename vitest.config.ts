import { defineConfig } from 'vitest/config';
import MergifyReporter from '@mergifyio/vitest';

export default defineConfig({
  test: {
    // 'default' shows results in your terminal
    // MergifyReporter sends them to the Mergify dashboard
    reporters: ['default', new MergifyReporter()],
  },
});
