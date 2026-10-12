/// <reference types="vitest/config" />
import { getViteConfig } from "astro/config";

// Astro's Vite config gives tests the `~` alias and Svelte support.
export default getViteConfig({
  test: {
    include: ["src/**/*.test.ts", "tests/*.test.ts"],
  },
});
