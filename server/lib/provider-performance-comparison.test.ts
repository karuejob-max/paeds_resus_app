import { describe, expect, it } from "vitest";
import { buildProviderSelfComparison } from "./provider-performance-comparison";

describe("provider self-comparison analytics", () => {
  const now = new Date("2026-08-27T09:30:00.000Z");

  it("compares current activity with the same elapsed prior period", () => {
    const result = buildProviderSelfComparison({
      period: "month",
      now,
      attended: [
        { date: "2026-08-10T08:00:00.000Z", value: "2" },
        { date: "2026-07-10T08:00:00.000Z", value: "1" },
      ],
      presented: [{ date: "2026-08-12T08:00:00.000Z", value: "3" }],
      qiReports: [{ date: "2026-08-20T08:00:00.000Z" }],
      crashCartAudits: [],
      certificates: [],
    });

    const attended = result.metrics.find(
      item => item.key === "cpd_sessions_attended"
    );
    const points = result.metrics.find(item => item.key === "cpd_points");
    expect(attended).toMatchObject({
      current: 1,
      previous: 1,
      delta: 0,
      direction: "stable",
      dataQuality: "email_match",
    });
    expect(points).toMatchObject({
      current: 5,
      previous: 1,
      delta: 4,
      percentage: 400,
    });
    expect(result.notes[0]).toContain("own previous comparable period");
  });

  it("uses no-comparable-baseline semantics when the previous period is empty", () => {
    const result = buildProviderSelfComparison({
      period: "quarter",
      now,
      attended: [{ date: "2026-08-01T08:00:00.000Z", value: "1" }],
      presented: [],
      qiReports: [],
      crashCartAudits: [],
      certificates: [],
    });

    const metric = result.metrics.find(
      item => item.key === "cpd_sessions_attended"
    );
    expect(metric?.current).toBe(1);
    expect(metric?.previous).toBe(0);
    expect(metric?.percentage).toBeNull();
  });

  it("reports certificates issued and valid at the period end separately", () => {
    const result = buildProviderSelfComparison({
      period: "year",
      now,
      attended: [],
      presented: [],
      qiReports: [],
      crashCartAudits: [],
      certificates: [
        {
          issueDate: "2026-02-01T08:00:00.000Z",
          expiryDate: "2027-02-01T08:00:00.000Z",
        },
        {
          issueDate: "2025-02-01T08:00:00.000Z",
          expiryDate: "2026-02-01T08:00:00.000Z",
        },
      ],
    });

    expect(
      result.metrics.find(
        item => item.key === "life_support_certificates_issued"
      )
    ).toMatchObject({ current: 1, previous: 1, dataQuality: "point_in_time" });
    expect(
      result.metrics.find(
        item => item.key === "life_support_certificates_valid"
      )
    ).toMatchObject({ current: 1, previous: 1, dataQuality: "point_in_time" });
  });
});
