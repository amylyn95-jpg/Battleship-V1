import { defineConfig } from "vitest/config";

// Playwright owns everything under e2e/; Vitest must not try to collect it.
export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    globals: true,
  },
});
