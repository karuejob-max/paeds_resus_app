import path from "path";
import { defineConfig } from "vitest/config";

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
    environment: "node",
    // RTL + component tests under `client/src/components` use jsdom; server + `client/src/lib` stay on node.
    environmentMatchGlobs: [["client/src/components/**", "jsdom"]],
    include: [
      "server/**/*.test.ts",
      "server/**/*.spec.ts",
      "client/src/**/*.test.ts",
      "client/src/**/*.spec.ts",
      "client/src/**/*.test.tsx",
      "client/src/**/*.spec.tsx",
    ],
  },
});
