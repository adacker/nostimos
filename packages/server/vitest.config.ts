// Architecture: build tooling — Vitest config for @nostimos/server (no behavioral contract).
// node:sqlite is a new built-in that Vite's bundled builtins list doesn't yet
// recognise, so we externalise it explicitly to let Node require it at runtime.
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    server: {
      deps: {
        external: [/node:sqlite/],
      },
    },
  },
  ssr: {
    external: ['node:sqlite'],
  },
});
