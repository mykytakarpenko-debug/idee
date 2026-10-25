import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    include: ["tests/unit/**/*.test.ts"],
    environment: "node",
    // Fuso orario fisso: i test sulle date sono deterministici su ogni macchina/CI.
    env: { TZ: "Europe/Rome" },
  },
});
