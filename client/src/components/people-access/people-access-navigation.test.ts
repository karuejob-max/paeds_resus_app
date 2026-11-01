import { describe, expect, it } from "vitest";
import { choosePeopleAccessView } from "./people-access-navigation";

describe("People Access reachability", () => {
  it("honors an explicit people view even when attention exists", () => {
    expect(
      choosePeopleAccessView({ explicitView: "roles", attentionCount: 4 })
    ).toBe("roles");
  });

  it("opens the inbox only when a loaded attention count is positive", () => {
    expect(choosePeopleAccessView({ attentionCount: 2 })).toBe("inbox");
    expect(choosePeopleAccessView({ attentionCount: 0 })).toBe("roles");
    expect(choosePeopleAccessView({})).toBe("roles");
    expect(
      choosePeopleAccessView({ attentionCount: undefined, unavailable: true })
    ).toBe("roles");
  });
});
