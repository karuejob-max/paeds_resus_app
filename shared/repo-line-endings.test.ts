import { readdir, readFile } from "node:fs/promises";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

const REPOSITORY_ROOT = join(import.meta.dirname, "..");
const CHECK_ROOTS = ["client/src", "server", "shared", "docs", "scripts"];
const CHECKED_EXTENSIONS = new Set([".ts", ".tsx", ".md", ".mjs"]);

async function listFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const absolutePath = join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listFiles(absolutePath)));
    } else if (CHECKED_EXTENSIONS.has(entry.name.slice(entry.name.lastIndexOf(".")))) {
      files.push(absolutePath);
    }
  }
  return files;
}

describe("repository line endings", () => {
  it("keeps source, documentation, and migration scripts free of CRLF", async () => {
    const files = (
      await Promise.all(CHECK_ROOTS.map((root) => listFiles(join(REPOSITORY_ROOT, root))))
    ).flat();
    const filesWithCrLf: string[] = [];

    for (const file of files) {
      const content = await readFile(file);
      if (content.includes(Buffer.from("\r\n"))) {
        filesWithCrLf.push(relative(REPOSITORY_ROOT, file));
      }
    }

    expect(filesWithCrLf).toEqual([]);
  });
});
