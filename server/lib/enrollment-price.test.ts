import { describe, expect, it } from "vitest";
import { calculateFinalPrice } from "../db-enrollment";
describe("promo pricing in cents", () => {
  it("zero discount keeps full price", () =>
    expect(calculateFinalPrice(20000, 0)).toBe(20000));
  it("partial discount does not mean free", () =>
    expect(calculateFinalPrice(20000, 50)).toBe(10000));
  it("full waiver is free", () =>
    expect(calculateFinalPrice(20000, 100)).toBe(0));
  it("rounds fractional cents up", () =>
    expect(calculateFinalPrice(101, 50)).toBe(51));
});
