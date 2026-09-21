import { describe, expect, it } from "vitest";
import { resolveIersTab, workforceAnchor } from "./institution-readiness-navigation";

describe("institution Readiness navigation", () => {
  it("maps legacy workforce tabs to the merged Team & shift setup anchors", () => {
    expect(workforceAnchor("departments")).toBe("team-setup-departments");
    expect(workforceAnchor("erco")).toBe("team-setup-erco");
    expect(workforceAnchor("roster")).toBe("team-setup-roster");
    expect(workforceAnchor("equipment")).toBe("team-setup-departments");
  });

  it("keeps legacy workforce deep links on the merged workforce tab", () => {
    expect(resolveIersTab("command", "roster")).toBe("workforce");
    expect(resolveIersTab("workforce", "departments")).toBe("workforce");
    expect(resolveIersTab("evidence", "departments")).toBe("evidence");
  });
});
