import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  assetsInclude: ["**/*.md"],
  test: {
    environment: "jsdom",
    globals: true,
    passWithNoTests: true,
    testTimeout: 30000,
    setupFiles: ["./src/test/setup.ts"],
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
