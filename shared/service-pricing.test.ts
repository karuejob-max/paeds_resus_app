import { describe, expect, it } from "vitest";
import { requiredKesForPayments, resolvePrice, type ServicePriceRow } from "./service-pricing";

const d = (s: string) => new Date(`${s}T00:00:00Z`);
const offer: ServicePriceRow = { programType: "bls", kind: "offer", priceKes: 5500, label: "Black November", startsAt: d("2026-11-20"), endsAt: d("2026-12-01") };

describe("resolvePrice", () => {
  it("falls back to the built-in list price", () => {
    expect(resolvePrice("bls", [], d("2026-11-25"))).toEqual({ programType: "bls", priceKes: 10000, standardKes: 10000, offer: null });
  });
  it("applies a running offer and shows the standard price", () => {
    const r = resolvePrice("bls", [offer], d("2026-11-25"))!;
    expect(r.priceKes).toBe(5500);
    expect(r.standardKes).toBe(10000);
    expect(r.offer?.label).toBe("Black November");
  });
  it("ignores an offer before it starts and after it ends", () => {
    expect(resolvePrice("bls", [offer], d("2026-11-19"))!.priceKes).toBe(10000);
    expect(resolvePrice("bls", [offer], d("2026-12-01"))!.priceKes).toBe(10000);
  });
  it("does not apply an offer to other programmes", () => {
    expect(resolvePrice("acls", [offer], d("2026-11-25"))!.priceKes).toBe(20000);
  });
  it("uses the latest standard price in force", () => {
    const rows: ServicePriceRow[] = [
      { programType: "bls", kind: "standard", priceKes: 12000, label: null, startsAt: d("2026-01-01"), endsAt: null },
      { programType: "bls", kind: "standard", priceKes: 9000, label: null, startsAt: d("2026-06-01"), endsAt: null },
    ];
    expect(resolvePrice("bls", rows, d("2026-03-01"))!.priceKes).toBe(12000);
    expect(resolvePrice("bls", rows, d("2026-07-01"))!.priceKes).toBe(9000);
  });
  it("returns null for programmes without a self-pay price", () => {
    expect(resolvePrice("fellowship", [], d("2026-11-25"))).toBeNull();
  });
});

describe("requiredKesForPayments", () => {
  it("lets a learner who paid the offer price keep access after the offer ends", () => {
    expect(requiredKesForPayments("bls", [offer], [{ createdAt: d("2026-11-25") }], d("2026-12-15"))).toBe(5500);
  });
  it("uses today's price when nothing has been paid", () => {
    expect(requiredKesForPayments("bls", [offer], [], d("2026-12-15"))).toBe(10000);
  });
});
