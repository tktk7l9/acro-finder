import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@": import.meta.dirname },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    include: ["**/*.test.{ts,tsx}"],
    coverage: {
      provider: "v8",
      include: ["lib/**/*.ts", "components/**/*.tsx"],
      exclude: ["components/InteractiveMap.tsx", "lib/types.ts", "lib/site.ts", "**/*.test.*"],
      reporter: ["text", "json-summary"],
    },
  },
});
