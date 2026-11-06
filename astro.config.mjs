import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://eduardocr90.github.io/",
  base: "/canaryburger-restaurant",
  output: "static",
  trailingSlash: "always",
  prefetch: { prefetchAll: false, defaultStrategy: "hover" },
});
