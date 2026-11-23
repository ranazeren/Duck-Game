import { defineConfig } from 'vitest/config';

export default defineConfig({
  build: {
    // Phaser is one large chunk; raise the limit so the build stays warning-free.
    chunkSizeWarningLimit: 4000,
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
});
