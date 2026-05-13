import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    passWithNoTests: true,
    setupFiles: ["./src/test/setup.ts"],
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
