import path from "path";
import { defineConfig } from "vitest/config";

/**
 * Fast, DB-optional gate: pure lib / domain tests only.
 * Run: `pnpm run test:unit` (safe with DATABASE_URL unset in CI).
 */
const templateRoot = path.resolve(import.meta.dirname);

export default defineConfig({
  esbuild: { jsx: "automatic" },
  root: templateRoot,
  resolve: {
    alias: {
      "@": path.resolve(templateRoot, "client", "src"),
      "@shared": path.resolve(templateRoot, "shared"),
      "@assets": path.resolve(templateRoot, "attached_assets"),
    },
  },
  test: {
    name: "unit",
    setupFiles: ["./vitest.setup.ts"],
    environment: "node",
    environmentMatchGlobs: [["client/src/components/**", "jsdom"]],
    include: [
      "client/src/lib/**/*.test.ts",
      "client/src/lib/**/*.test.tsx",
      "client/src/const/**/*.test.ts",
      "client/src/components/**/*.test.tsx",
      "shared/**/*.test.ts",
      "server/routers/events.trackEvent.test.ts",
      "server/lib/**/*.test.ts",
      "server/routers/fellowship-care-signal-streak.test.ts",
      "server/routers/platform-feedback.test.ts",
      "server/_core/**/*.test.ts",
    ],
    exclude: [
      "client/src/lib/voice/**",
      "client/src/lib/resus/**",
      "client/src/lib/offline/**",
      "client/src/lib/predictive/**",
      "**/node_modules/**",
      "**/dist/**",
    ],
  },
});
