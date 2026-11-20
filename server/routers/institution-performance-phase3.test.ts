import { describe, expect, it } from "vitest";
import { appRouter } from "../routers";
import type { TrpcContext } from "../_core/context";
import { periodBounds } from "./institution-performance";

function publicContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as TrpcContext["res"],
  };
}

describe("institution executive reporting Phase 3", () => {
  it("uses EAT calendar month and quarter boundaries", () => {
    expect(periodBounds("monthly", "2026-11-01")).toMatchObject({
      periodStart: "2026-11-01",
      periodEnd: "2026-11-30",
      timezone: "Africa/Nairobi",
    });
    expect(periodBounds("quarterly", "2026-10-01")).toMatchObject({
      periodStart: "2026-10-01",
      periodEnd: "2026-12-31",
      timezone: "Africa/Nairobi",
    });
    expect(periodBounds("annual", "2026-01-01")).toMatchObject({
      periodStart: "2026-01-01",
      periodEnd: "2026-12-31",
      timezone: "Africa/Nairobi",
    });
  });

  it("rejects period starts that are not canonical calendar boundaries", () => {
    expect(() => periodBounds("monthly", "2026-11-02")).toThrow(/first day/);
    expect(() => periodBounds("quarterly", "2026-11-01")).toThrow(/first day/);
    expect(() => periodBounds("annual", "2026-02-01")).toThrow(/first day/);
  });

  it("exposes the report procedures behind protected authentication", async () => {
    expect(appRouter._def.procedures["institutionPerformance.generateExecutiveReport"]).toBeDefined();
    expect(appRouter._def.procedures["institutionPerformance.getReportScopes"]).toBeDefined();
    expect(appRouter._def.procedures["institutionPerformance.listExecutiveReports"]).toBeDefined();
    expect(appRouter._def.procedures["institutionPerformance.getExecutiveReport"]).toBeDefined();
    const caller = appRouter.createCaller(publicContext());
    await expect(caller.institutionPerformance.generateExecutiveReport({ institutionId: 1, periodType: "quarterly" })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(caller.institutionPerformance.listExecutiveReports({ institutionId: 0 })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(caller.institutionPerformance.getReportScopes({ institutionId: 0 })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("validates report identifiers at the router boundary", async () => {
    const caller = appRouter.createCaller(publicContext());
    await expect(caller.institutionPerformance.getExecutiveReport({ institutionId: 0, reportId: 0 })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});
