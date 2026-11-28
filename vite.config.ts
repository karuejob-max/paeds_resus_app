import { jsxLocPlugin } from "@builder.io/vite-plugin-jsx-loc";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import fs from "node:fs";
import path from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss(), jsxLocPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  envDir: path.resolve(import.meta.dirname),
  root: path.resolve(import.meta.dirname, "client"),
  publicDir: path.resolve(import.meta.dirname, "client", "public"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    /** Render/Vite: large clinical bundles; warning only — prefer code-splitting over failing CI noise */
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          // Match the real package name only. With pnpm, the directory name of
          // any package that lists react-dom as a peer (every Radix package,
          // for example) contains the text "react-dom", so a substring match
          // pulled them all into one ~770 KB eagerly loaded chunk.
          const segments = id.split("node_modules/");
          const pkg = segments[segments.length - 1].split("/").slice(0, id.includes("node_modules/@") && segments[segments.length - 1].startsWith("@") ? 2 : 1).join("/");
          if (pkg === "react-dom" || pkg === "scheduler" || pkg === "react" || pkg === "react/jsx-runtime") return "vendor-react-dom";
          if (pkg === "@tanstack/react-query" || pkg === "@tanstack/query-core") return "vendor-rq";
          if (pkg.startsWith("@trpc/")) return "vendor-trpc";
          if (pkg === "lucide-react") return "vendor-icons";
        },
      },
    },
  },
  server: {
    host: true,
    allowedHosts: [
      "localhost",
      "127.0.0.1",
    ],
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
