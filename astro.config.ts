import { defineConfig } from "astro/config";
import svelte from "@astrojs/svelte";
import { satteri } from "@astrojs/markdown-satteri";
import { baseUrlPlugin } from "./src/plugins/base-url";

const base = "/rules";

export default defineConfig({
  site: "https://nathan-long.com",
  base,
  trailingSlash: "always",
  build: { format: "directory" },
  integrations: [svelte()],
  markdown: {
    syntaxHighlight: false,
    processor: satteri({
      features: {
        definitionList: true,
        // Off to match Eleventy: it would also curl quotes inside raw HTML, e.g. an inline SVG <style>.
        smartPunctuation: false,
        // Parse raw HTML (<img>, <details>, <figure>…) into elements so plugins can see it.
        rawHtml: true,
      },
      hastPlugins: [baseUrlPlugin(base)],
    }),
  },
});
