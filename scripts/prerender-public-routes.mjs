import { mkdir, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { resolve } from "node:path";
import { chromium } from "@playwright/test";

const root = resolve(new URL("..", import.meta.url).pathname);
const routes = [
  "/",
  "/for-institutions",
  "/for-providers",
  "/institutional",
  "/about",
  "/training",
  "/aha-courses",
  "/fellowship",
  "/for-parents",
  "/programs/nerp-acls",
  "/programs/ierp",
];
const port = 4173;
const server = spawn(
  "pnpm",
  ["exec", "vite", "preview", "--host", "127.0.0.1", "--port", String(port)],
  {
    cwd: root,
    stdio: "ignore",
  }
);

async function waitForServer() {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      await fetch(`http://127.0.0.1:${port}/`);
      return;
    } catch {
      await new Promise(resolvePromise => setTimeout(resolvePromise, 250));
    }
  }
  throw new Error("Vite preview server did not start in time");
}

try {
  await waitForServer();
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1280, height: 900 },
  });
  for (const route of routes) {
    await page.goto(`http://127.0.0.1:${port}${route}`, {
      waitUntil: "networkidle",
    });
    const target = resolve(
      root,
      "dist/public",
      route === "/" ? "index.html" : `${route.slice(1)}/index.html`
    );
    await mkdir(resolve(target, ".."), { recursive: true });
    await writeFile(target, await page.content(), "utf8");
    console.log(`Prerendered ${route}`);
  }
  await browser.close();
} finally {
  server.kill("SIGTERM");
}
