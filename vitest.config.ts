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
      include: ["lib/**/*.ts", "components/**/*.tsx", "app/**/*.{ts,tsx}"],
      exclude: [
        // Leaflet needs a real DOM layout engine and canvas — covered by the browser check, not jsdom.
        "components/InteractiveMap.tsx",
        // next/og ImageResponse renders with Satori/resvg; nothing to assert in jsdom.
        "app/opengraph-image.tsx",
        "app/twitter-image.tsx",
        "app/apple-icon.tsx",
        "lib/types.ts",
        "lib/site.ts",
        "**/*.test.*",
      ],
      reporter: ["text", "json-summary"],
      // Two points under what three consecutive runs measured on 2026-09-30
      // (lines 99.67 / statements 98.88 / functions 98.9 / branches 96.7), so a
      // change that drops a component's tests fails `npm run test:cov`.
      thresholds: { lines: 97, statements: 96, functions: 96, branches: 94 },
    },
  },
});
