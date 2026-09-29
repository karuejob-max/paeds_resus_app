import { describe, expect, it } from "vitest";
import {
  formatIcpdPublicPriceLine,
  formatIersPublicPriceLine,
  formatIlspPublicPriceLine,
  ICPD_PUBLIC_TIERS,
  IERS_PUBLIC_PRICES,
} from "./institutional-public-pricing";
import {
  ICPD_STANDARD_KES_PER_STAFF,
  IERS_STANDARD_KES_BY_LEVEL,
} from "./institutional-pricing";
import {
  PAEDS_RESUS_ILS_BASE_PRICE_KES,
  PAEDS_RESUS_ILS_INSTITUTIONAL_PRICE_KES,
} from "./institutional-life-support";

describe("institutional public pricing display", () => {
  it("derives IERS display values from the executable pricing source", () => {
    expect(IERS_PUBLIC_PRICES.map(item => item.amountKes)).toEqual([
      IERS_STANDARD_KES_BY_LEVEL.level_4,
      IERS_STANDARD_KES_BY_LEVEL.level_5,
      IERS_STANDARD_KES_BY_LEVEL.level_6,
    ]);
    expect(formatIersPublicPriceLine()).toContain("Level 4: KES 200,000");
    expect(formatIersPublicPriceLine()).toContain("Level 6: KES 600,000");
  });

  it("derives every ICPD staff tier from the executable source", () => {
    expect(ICPD_PUBLIC_TIERS.map(item => item.amountKesPerStaff)).toEqual(
      ICPD_STANDARD_KES_PER_STAFF.map(item => item.kes)
    );
    expect(formatIcpdPublicPriceLine()).toContain("1–100 staff: KES 1,000/staff");
    expect(formatIcpdPublicPriceLine()).toContain("1,001–2,000 staff: KES 600/staff");
  });

  it("states ILSP list price and institution-paid effective rate", () => {
    expect(formatIlspPublicPriceLine()).toBe(
      `KES ${PAEDS_RESUS_ILS_BASE_PRICE_KES.toLocaleString("en-KE")} list price; KES ${PAEDS_RESUS_ILS_INSTITUTIONAL_PRICE_KES.toLocaleString("en-KE")} per provider for institution-paid cohorts`
    );
  });
});
