import { describe, expect, it } from "vitest";
import {
  buildAdministrationUrl,
  resolveAdministrationLocation,
} from "./institution-administration-location";

describe("institution administration location", () => {
  it.each([
    ["adminTab=access_links", "inbox"],
    ["adminTab=people_roles", "roles"],
    ["adminTab=people&peopleTab=departments", "departments"],
    ["adminTab=people_access&peopleTab=staff_import", "directory"],
    ["adminTab=people_access&peopleTab=access_links", "admins"],
  ])("resolves legacy %s to %s", (query, peopleView) => {
    expect(resolveAdministrationLocation(query).peopleView).toBe(peopleView);
  });

  it("focuses mismatch notifications in the inbox and preserves the institution", () => {
    expect(resolveAdministrationLocation("institutionId=7&adminTab=people_roles&departmentId=3&mismatchReportId=9")).toEqual({
      lane: "institution",
      peopleView: "inbox",
      focus: { kind: "mismatch", id: 9 },
      institutionId: 7,
    });
  });

  it("ignores invalid ids", () => {
    expect(resolveAdministrationLocation("institutionId=0&mismatchReportId=-2")).toEqual({ lane: "overview" });
  });

  it("builds stable canonical URLs", () => {
    expect(buildAdministrationUrl({
      institutionId: 7,
      lane: "institution",
      peopleView: "inbox",
      focus: { kind: "link-request", id: 12 },
    })).toBe("/institution?institutionId=7&section=administration&adminTab=institution&peopleView=inbox&focus=link-request%3A12");
  });
});
