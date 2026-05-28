import { describe, expect, it } from "vitest";
import {
  buildPaymentSuccessUrl,
  isPaidEnrollmentStatus,
  parsePaymentSuccessSearch,
  PAYMENT_SUCCESS_PATH,
} from "./payment-success";

describe("isPaidEnrollmentStatus", () => {
  it("accepts completed only", () => {
    expect(isPaidEnrollmentStatus("completed")).toBe(true);
    expect(isPaidEnrollmentStatus("pending")).toBe(false);
    expect(isPaidEnrollmentStatus("partial")).toBe(false);
    expect(isPaidEnrollmentStatus("free")).toBe(false);
    expect(isPaidEnrollmentStatus(null)).toBe(false);
  });
});

describe("buildPaymentSuccessUrl", () => {
  it("builds path with required enrollmentId", () => {
    expect(buildPaymentSuccessUrl({ enrollmentId: 42 })).toBe(
      `${PAYMENT_SUCCESS_PATH}?enrollmentId=42`
    );
  });

  it("includes optional courseId and programType", () => {
    expect(
      buildPaymentSuccessUrl({
        enrollmentId: 7,
        courseId: "pals",
        programType: "pals",
      })
    ).toBe(`${PAYMENT_SUCCESS_PATH}?enrollmentId=7&courseId=pals&programType=pals`);
  });
});

describe("parsePaymentSuccessSearch", () => {
  it("parses valid query strings", () => {
    expect(parsePaymentSuccessSearch("?enrollmentId=12&courseId=bls")).toEqual({
      enrollmentId: 12,
      courseId: "bls",
    });
    expect(parsePaymentSuccessSearch("enrollmentId=3&programType=acls")).toEqual({
      enrollmentId: 3,
      programType: "acls",
    });
  });

  it("returns null for missing or invalid enrollmentId", () => {
    expect(parsePaymentSuccessSearch("")).toBeNull();
    expect(parsePaymentSuccessSearch("?courseId=pals")).toBeNull();
    expect(parsePaymentSuccessSearch("?enrollmentId=0")).toBeNull();
    expect(parsePaymentSuccessSearch("?enrollmentId=abc")).toBeNull();
  });
});
