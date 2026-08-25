import { describe, expect, it } from "vitest";
import { groupAssignmentsByProvider } from "./ProviderIersShiftTeamCard";

describe("groupAssignmentsByProvider", () => {
  it("keeps dual UTL and ERTL roles under one provider identity", () => {
    const groups = groupAssignmentsByProvider([
      { id: 1, providerUserId: 7, roleScope: "utl" },
      { id: 2, providerUserId: 7, roleScope: "ertl" },
      { id: 3, providerUserId: 8, roleScope: "ert_member" },
    ]);

    expect(groups).toHaveLength(2);
    expect(groups[0]?.map((assignment) => assignment.id)).toEqual([1, 2]);
    expect(groups[1]?.map((assignment) => assignment.id)).toEqual([3]);
  });
});
