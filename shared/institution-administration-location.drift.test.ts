import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(__dirname, "..");
const scanRoots = ["client/src", "server"];
const ignored = new Set([
  path.join(repoRoot, "shared", "institution-administration-location.ts"),
  path.join(repoRoot, "shared", "institution-administration-location.test.ts"),
  path.join(repoRoot, "shared", "institution-administration-location.drift.test.ts"),
]);

function filesUnder(directory: string): string[] {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) return filesUnder(full);
    return /\.(ts|tsx)$/.test(entry.name) ? [full] : [];
  });
}

describe("People & Access URL drift guard", () => {
  it("does not allow new hand-written adminTab or peopleTab query literals", () => {
    const violations: string[] = [];
    for (const root of scanRoots.flatMap(relative => filesUnder(path.join(repoRoot, relative)))) {
      if (ignored.has(root)) continue;
      const text = fs.readFileSync(root, "utf8");
      if (/[?&](?:adminTab|peopleTab)=/.test(text)) {
        violations.push(path.relative(repoRoot, root));
      }
    }
    expect(violations).toEqual([]);
  });
});
