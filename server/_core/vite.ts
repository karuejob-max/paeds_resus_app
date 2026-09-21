import express, { type Express } from "express";
import fs from "fs";
import { type Server } from "http";
import { nanoid } from "nanoid";
import path from "path";
import { createServer as createViteServer } from "vite";
import viteConfig from "../../vite.config";

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "../..",
        "client",
        "index.html"
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

const ANONYMOUS_SPA_ROUTES = new Set([
  "/",
  "/home",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/about",
  "/resources",
  "/resources/bls-certification-cost-kenya",
  "/resources/hospital-emergency-readiness-checklist",
  "/resources/paediatric-shock-recognition-first-actions",
  "/help",
  "/verify",
  "/privacy",
  "/terms",
  "/legal/cookies",
  "/legal/care-signal",
  "/legal/clinical-use",
  "/legal/subprocessors",
  "/legal/data-request",
  "/legal/care-signal-appeal",
  "/legal/code-signal",
  "/parent-safe-truth",
  "/safe-truth",
  "/institutional",
  "/micro-courses",
  "/aha-courses",
  "/training",
  "/training/bls",
  "/training/acls",
  "/training/pals",
  "/training/nrp",
  "/for-providers",
  "/for-institutions",
  "/for-parents",
  "/programs/nerp-acls",
  "/programs/ierp",
  "/fellowship",
  "/iers/orientation",
  "/contact",
]);

function requestPath(req: express.Request) {
  return req.path.replace(/\/$/, "") || "/";
}

export function serveStatic(app: Express) {
  const distPath =
    process.env.NODE_ENV === "development"
      ? path.resolve(import.meta.dirname, "../..", "dist", "public")
      : path.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    console.error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }

  const prerenderedRoutes = [
    "/",
    "/for-institutions",
    "/for-providers",
    "/institutional",
    "/about",
    "/resources",
    "/resources/bls-certification-cost-kenya",
    "/resources/hospital-emergency-readiness-checklist",
    "/resources/paediatric-shock-recognition-first-actions",
    "/training",
    "/aha-courses",
    "/fellowship",
    "/for-parents",
    "/programs/nerp-acls",
    "/programs/ierp",
  ];

  for (const route of prerenderedRoutes) {
    app.get(route, (req, res, next) => {
      const spaShell = path.resolve(distPath, "index.html");
      if (req.headers.cookie) {
        res.sendFile(spaShell);
        return;
      }
      const prerenderedFile = path.resolve(
        distPath,
        route === "/" ? "index.html" : route.slice(1),
        route === "/" ? "" : "index.html"
      );
      if (fs.existsSync(prerenderedFile)) {
        res.sendFile(prerenderedFile);
        return;
      }
      next();
    });
  }

  app.use(express.static(distPath));

  // Authenticated routes retain the SPA shell because role gates resolve them
  // after the session is read. Anonymous unknown paths must return a real 404
  // so crawlers do not mistake dead legacy URLs for live pages.
  app.use("*", (req, res) => {
    const hasSession = Boolean(req.headers.cookie);
    if (!hasSession && !ANONYMOUS_SPA_ROUTES.has(requestPath(req))) {
      res.status(404).sendFile(path.resolve(distPath, "index.html"));
      return;
    }
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
