import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { COHORT_LABEL } from "./marketingCopy";

describe("public marketing copy", () => {
  it("keeps the generated AI-readable cohort phrasing aligned", () => {
    const llms = readFileSync(resolve(process.cwd(), "client/public/llms.txt"), "utf8");
    expect(llms).toContain(`for ${COHORT_LABEL}`);
  });
});
