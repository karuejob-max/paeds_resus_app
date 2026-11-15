import { describe, expect, it } from "vitest";
import { resolveSettledRead } from "./section-read";

describe("section read isolation", () => {
  it("preserves successful domains when one domain rejects", async () => {
    const [institutions, payments] = await Promise.allSettled([
      Promise.resolve([{ institutionName: "County PICU" }]),
      Promise.reject(new Error("payments database unavailable")),
    ]);

    const institutionsRead = resolveSettledRead(institutions, []);
    const paymentsRead = resolveSettledRead(payments, []);

    expect(institutionsRead).toEqual({
      data: [{ institutionName: "County PICU" }],
      available: true,
    });
    expect(paymentsRead).toEqual({ data: [], available: false });
  });
});
