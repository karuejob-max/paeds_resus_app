import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({ queue: [] as unknown[][], inserts: [] as any[], updates: [] as any[] }));

vi.mock("../db", () => {
  const db = {
    select: () => {
      const chain: any = {};
      chain.from = () => chain;
      chain.leftJoin = () => chain;
      chain.where = () => chain;
      chain.limit = async () => state.queue.shift() ?? [];
      return chain;
    },
    insert: () => ({ values: async (values: any) => { state.inserts.push(values); return { insertId: 501 }; } }),
    update: () => ({ set: (set: any) => ({ where: async () => { state.updates.push(set); } }) }),
  };
  return { getDb: async () => db };
});

import { createCareFacility, facilityBadge, materializeRegistryFacility } from "./facility-registry.service";
import { getDb } from "../db";

beforeEach(() => {
  state.queue = [];
  state.inserts = [];
  state.updates = [];
});

describe("facilityBadge", () => {
  const base = { isSystem: false, institutionalAccountId: null, mflCode: null, needsReview: false };
  it("tells registry, verified, unlisted and community facilities apart", () => {
    expect(facilityBadge({ ...base, isSystem: true })).toBe("System");
    expect(facilityBadge({ ...base, institutionalAccountId: 3, institutionVerificationStatus: "verified", mflCode: "12345" })).toBe("Verified institution");
    expect(facilityBadge({ ...base, mflCode: "12345" })).toBe("Registry facility");
    expect(facilityBadge({ ...base, needsReview: true })).toBe("Not in registry (under review)");
    expect(facilityBadge(base)).toBe("Community");
  });

  it("does not call an unverified institution a registered hospital", () => {
    expect(facilityBadge({ ...base, institutionalAccountId: 3, institutionVerificationStatus: "unverified" })).toBe("Community");
  });

  it("ignores a placeholder code", () => {
    expect(facilityBadge({ ...base, mflCode: "CHM-001" })).toBe("Community");
  });
});

describe("materializeRegistryFacility", () => {
  it("returns the care facility that already has this MFL code", async () => {
    state.queue = [[{ id: 7 }]];
    const db = (await getDb())!;
    expect(await materializeRegistryFacility(db as never, { name: "Consolata Hospital Mathari", code: "11111", county: "Nyeri" })).toBe(7);
    expect(state.inserts).toHaveLength(0);
    expect(state.updates).toHaveLength(0);
  });

  it("adopts an older same-name facility without a code instead of duplicating it", async () => {
    state.queue = [[], [{ id: 9, county: "Nyeri" }]];
    const db = (await getDb())!;
    expect(await materializeRegistryFacility(db as never, { name: "Consolata Hospital Mathari", code: "11111", county: "Nyeri" })).toBe(9);
    expect(state.updates[0]).toMatchObject({ mflCode: "11111", needsReview: false });
    expect(state.inserts).toHaveLength(0);
  });

  it("does not adopt a same-name facility in a different county", async () => {
    state.queue = [[], [{ id: 9, county: "Mombasa" }]];
    const db = (await getDb())!;
    expect(await materializeRegistryFacility(db as never, { name: "Coast General", code: "22222", county: "Nyeri" })).toBe(501);
    expect(state.inserts[0]).toMatchObject({ name: "Coast General", mflCode: "22222", county: "Nyeri", needsReview: false });
  });

  it("creates the facility when nothing matches, and refuses placeholder codes", async () => {
    state.queue = [[], []];
    const db = (await getDb())!;
    expect(await materializeRegistryFacility(db as never, { name: "New Clinic", code: "33333", county: null })).toBe(501);
    state.queue = [];
    expect(await materializeRegistryFacility(db as never, { name: "Sample", code: "CHM-001", county: null })).toBeNull();
  });
});

describe("createCareFacility (reporter adds a facility)", () => {
  it("uses the official registry entry when the reporter typed a listed facility", async () => {
    // registry lookup finds it, then materialize finds it by code
    state.queue = [[{ name: "Consolata Hospital Mathari", code: "11111", county: "Nyeri" }], [{ id: 7 }]];
    const result = await createCareFacility({ name: "consolata hospital mathari", county: "Nyeri", country: "Kenya", createdByUserId: 4 });
    expect(result).toEqual({ id: 7, created: false, matchedRegistry: true });
    expect(state.inserts).toHaveLength(0);
  });

  it("flags a facility that is not in the registry for review, with who added it", async () => {
    state.queue = [[], []];
    const result = await createCareFacility({ name: "Mathari Hospital", county: "Nyeri", country: "Kenya", createdByUserId: 4 });
    expect(result).toEqual({ id: 501, created: true, matchedRegistry: false });
    expect(state.inserts[0]).toMatchObject({ name: "Mathari Hospital", needsReview: true, createdByUserId: 4 });
  });

  it("returns an existing community facility with the same name and county without creating another", async () => {
    state.queue = [[], [{ id: 12 }]];
    const result = await createCareFacility({ name: "Mathari Hospital", county: "Nyeri", country: "Kenya" });
    expect(result).toEqual({ id: 12, created: false, matchedRegistry: false });
    expect(state.inserts).toHaveLength(0);
  });
});
