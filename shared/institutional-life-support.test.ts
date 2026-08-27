import { describe, expect, it } from "vitest";
import {
  PAEDS_RESUS_ILS_AHA_ADD_ON_PRICES_KES,
  PAEDS_RESUS_ILS_AHA_FULL_TRAINING_PRICES_KES,
  PAEDS_RESUS_ILS_BASE_PRICE_KES,
  PAEDS_RESUS_ILS_CREDENTIALING_WINDOW_DAYS,
  PAEDS_RESUS_ILS_DELIVERY_MODEL,
  getAhaCredentialingPriceKes,
  getAhaFullTrainingPriceKes,
  getCredentialingDeadline,
  isCredentialingWindowOpen,
} from "./institutional-life-support";

describe("Institutional Life Support business rules", () => {
  const certificateDate = new Date("2026-01-01T00:00:00.000Z");

  it("defines ILS as an institution-paid cohort product", () => {
    expect(PAEDS_RESUS_ILS_DELIVERY_MODEL).toBe("institution_paid_cohort");
  });

  it("keeps the published provider and AHA prices", () => {
    expect(PAEDS_RESUS_ILS_BASE_PRICE_KES).toBe(10_000);
    expect(PAEDS_RESUS_ILS_AHA_ADD_ON_PRICES_KES).toEqual({
      bls: 7_500,
      acls: 10_000,
    });
    expect(PAEDS_RESUS_ILS_AHA_FULL_TRAINING_PRICES_KES).toEqual({
      bls: 10_000,
      acls: 20_000,
    });
  });

  it("opens the add-on window for 90 days from certificate issue", () => {
    expect(getCredentialingDeadline(certificateDate).toISOString()).toBe(
      "2026-04-01T00:00:00.000Z"
    );
    expect(
      isCredentialingWindowOpen(
        certificateDate,
        new Date("2026-03-31T23:59:59.999Z")
      )
    ).toBe(true);
    expect(
      isCredentialingWindowOpen(
        certificateDate,
        new Date("2026-04-01T00:00:00.000Z")
      )
    ).toBe(false);
    expect(PAEDS_RESUS_ILS_CREDENTIALING_WINDOW_DAYS).toBe(90);
  });

  it("uses add-on pricing before the cutoff and full-training pricing after it", () => {
    expect(
      getAhaCredentialingPriceKes(
        "bls",
        certificateDate,
        new Date("2026-02-01T00:00:00.000Z")
      )
    ).toBe(7_500);
    expect(
      getAhaCredentialingPriceKes(
        "acls",
        certificateDate,
        new Date("2026-02-01T00:00:00.000Z")
      )
    ).toBe(10_000);
    expect(
      getAhaCredentialingPriceKes(
        "bls",
        certificateDate,
        new Date("2026-04-01T00:00:00.000Z")
      )
    ).toBeNull();
    expect(getAhaFullTrainingPriceKes("bls")).toBe(10_000);
    expect(getAhaFullTrainingPriceKes("acls")).toBe(20_000);
  });
});
