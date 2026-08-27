import { describe, expect, it } from "vitest";
import {
  breadcrumbMap,
  footerSections,
  institutionalNavItems,
} from "./navigation";

describe("institutional portal offerings", () => {
  it("keeps ILS beside the workspace and onboarding entry points", () => {
    expect(institutionalNavItems).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "Institution Workspace",
          description: expect.stringContaining("IERS Readiness"),
        }),
        expect.objectContaining({
          label: "Institutional Life Support",
          href: "/training/institutional-life-support",
        }),
      ])
    );
  });

  it("keeps the ILS destination discoverable in footer and breadcrumbs", () => {
    expect(footerSections.institutional).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "Institutional Life Support",
          href: "/training/institutional-life-support",
        }),
      ])
    );
    expect(breadcrumbMap["/training/institutional-life-support"]).toEqual([
      "Home",
      "Institutions",
      "ILS Program",
    ]);
  });
});

export {};
