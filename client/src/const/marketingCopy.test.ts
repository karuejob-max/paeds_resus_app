import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  ACLS_PRICE,
  BLS_PRICE,
  IERP_FULL_PRICE,
  IERP_SAVINGS,
  ILSP_PRICE_PER_STAFF,
  ILSP_RENEWAL_YEARS,
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

  it("computes the IERP bundle saving from canonical prices", () => {
    expect(IERP_SAVINGS).toBe(BLS_PRICE + ACLS_PRICE - IERP_FULL_PRICE);
    expect(formatIerpValueLine()).toContain(`${formatKes(IERP_SAVINGS)}`);
  });

  it("keeps the NERP installment structure explicit", () => {
    expect(formatNerpValueLine()).toContain(
      `${formatKes(NERP_INSTALLMENT)} x ${NERP_INSTALLMENT_COUNT}`
    );
    expect(formatNerpValueLine()).toContain(
      `${formatKes(NERP_TOTAL_PRICE)} total`
    );
  });

  it("keeps the ILSP renewal price canonical", () => {
    expect(formatIlspPriceLine()).toBe(
      `${formatKes(ILSP_PRICE_PER_STAFF)} per staff member, renewable every ${ILSP_RENEWAL_YEARS} years`
    );
  });
});
