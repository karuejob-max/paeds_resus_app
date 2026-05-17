import path from "path";
import { defineConfig } from "vitest/config";

/**
 * Clinical engine tests — no DATABASE_URL required.
 * Run: `pnpm run test:clinical`
 * Excludes integration/voice/offline suites that need DB or heavy mocks.
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
    name: "clinical",
    environment: "node",
    include: [
      "client/src/lib/resus/**/*.test.ts",
      "client/src/__tests__/abcde-engine.test.ts",
    ],
    exclude: [
      "client/src/lib/voice/**",
      "client/src/lib/offline/**",
      "client/src/lib/predictive/**",
      "**/integration.test.ts",
      "**/resusGPS.test.ts",
      "**/sbar-integration.test.ts",
      "**/node_modules/**",
      "**/dist/**",
    ],
  },
});
