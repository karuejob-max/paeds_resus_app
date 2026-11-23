import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  ACLS_PRICE,
  BLS_PRICE,
  IERP_FULL_PRICE,
  ILSP_PRICE_PER_STAFF,
  ILSP_LIST_PRICE_PER_STAFF,
  NERP_INSTALLMENT,
  NERP_INSTALLMENT_COUNT,
  NERP_TOTAL_PRICE,
  COHORT_LABEL,
  formatIerpValueLine,
  formatIlspPriceLine,
  formatNerpValueLine,
  formatKes,
} from "./marketingCopy";

describe("public marketing copy", () => {
  it("keeps the generated AI-readable cohort phrasing aligned", () => {
    const llms = readFileSync(
      resolve(process.cwd(), "client/public/llms.txt"),
      "utf8"
    );
    expect(llms).toContain(`for ${COHORT_LABEL}`);
  });

  it("states the confirmed IERP bundle without unsupported savings", () => {
    expect(formatIerpValueLine()).toBe(
      `${formatKes(IERP_FULL_PRICE)} one-time for AHA ACLS + Paeds Resus BLS`
    );
    expect(formatIerpValueLine()).not.toContain("save");
  });

  it("keeps the NERP installment structure explicit", () => {
    expect(formatNerpValueLine()).toContain(
      `${formatKes(NERP_INSTALLMENT)} x ${NERP_INSTALLMENT_COUNT}`
    );
    expect(formatNerpValueLine()).toContain(
      `${formatKes(NERP_TOTAL_PRICE)} total`
    );
  });

  it("keeps the ILSP list and institutional cohort prices canonical", () => {
    expect(formatIlspPriceLine()).toBe(
      `${formatKes(ILSP_LIST_PRICE_PER_STAFF)} list price; ${formatKes(ILSP_PRICE_PER_STAFF)} per provider for institution-paid cohorts`
    );
  });
});
