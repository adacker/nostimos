// Architecture: build tooling — Svelte compiler config (no behavioral contract).
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

export default {
  preprocess: vitePreprocess(),
};
