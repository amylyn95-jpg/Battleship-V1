import { defineConfig } from "vite";

// GitHub Pages serves the project at /<repo>/, so the built asset URLs need
// that prefix. Local dev and preview stay at the root.
export default defineConfig({
  base: process.env.PAGES_BASE ?? "/",
  build: { outDir: "dist", sourcemap: true },
});
