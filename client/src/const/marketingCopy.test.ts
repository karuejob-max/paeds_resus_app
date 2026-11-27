import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  IERP_FULL_PRICE,
  IERP_ENROLLMENT_CUTOFF,
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
    expect(llms).toContain("one optional KES 18,000 add-on requests both AHA BLS and AHA ACLS certification");
    expect(llms).toContain("combined ILSP-plus-AHA-add-on total is KES 25,000 per provider");
  });

  it("states the IERP standard fee, included certificates, and enrolment cutoff", () => {
    const copy = formatIerpValueLine();

    expect(copy).toContain(`Standard fee: ${formatKes(IERP_FULL_PRICE)}`);
    expect(copy).toContain(
      "Includes AHA ACLS certification plus Paeds Resus BLS certification"
    );
    expect(copy).toContain(`Enrolment cutoff: ${IERP_ENROLLMENT_CUTOFF}`);
    expect(copy).toContain("not a payment deadline");
    expect(copy).not.toMatch(/save|one-time|offer deadline/i);
  });

  it("states the confirmed ILSP price and bundled AHA top-up on the training page", () => {
    const trainingHub = readFileSync(
      resolve(process.cwd(), "client/src/pages/TrainingHub.tsx"),
      "utf8"
    );

    expect(trainingHub).toContain(
      "Paeds Resus BLS and ACLS certification · KES 7,000 per provider"
    );
    expect(trainingHub).toContain(
      "The KES 7,000 fee covers Paeds Resus BLS and ACLS certification."
    );
    expect(trainingHub).toContain("One optional KES 18,000 top-up requests both AHA BLS and AHA ACLS certification");
    expect(trainingHub).toContain("the combined total is KES 25,000 per provider");
    expect(trainingHub).toContain("within 90 days after programme certification");
    expect(trainingHub).not.toContain("KES 10,000 per provider");
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
