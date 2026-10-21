import { describe, expect, it } from "vitest";
import { TRPCError } from "@trpc/server";
import { assertIlsDepartmentSelection } from "./ils-authority";

describe("ILSP department authority", () => {
  it("allows institution-wide authority to manage any explicitly selected department", () => {
    expect(
      assertIlsDepartmentSelection(
        { scope: "institution", departmentIds: null },
        42
      )
    ).toBe(42);
  });

  it("derives the only assigned department for a departmental leader", () => {
    expect(
      assertIlsDepartmentSelection({ scope: "department", departmentIds: [7] })
    ).toBe(7);
  });

  it("requires an explicit department when a leader has multiple assignments", () => {
    expect(() =>
      assertIlsDepartmentSelection({
        scope: "department",
        departmentIds: [7, 8],
      })
    ).toThrow(TRPCError);
  });

  it("rejects a client-supplied department outside the leader's scope", () => {
    expect(() =>
      assertIlsDepartmentSelection(
        { scope: "department", departmentIds: [7] },
        8
      )
    ).toThrow(
      "You cannot manage ILSP learners outside your assigned department."
    );
  });
});
