import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { courses, enrollments, modules, quizzes, userProgress } from "../../drizzle/schema";
import { BLS_MODULES_V2, BLS_V2_COURSE_TITLE } from "./bls-modules-v2-data";
import { getBlsV2Audience } from "./bls-course-versions";
import { ensureBlsCatalog } from "./ensure-bls-acls-catalog";
import { resolveAhaCourseAnchor } from "./resolve-aha-course-anchor";
import { resolvePinnedBlsCourse } from "./resolve-enrollment-course";

const V1_TITLE = "BLS Provider Course — AHA 2025 Guidelines";

type Ctx = { from: unknown; fields: Record<string, unknown> | undefined; joined: boolean; cond: unknown; call: number; ordered: boolean; inserted: Set<unknown> };

/** Minimal chainable stand-in for a drizzle db; every query resolves through `handler`. */
function fakeDb(handler: (ctx: Ctx) => unknown[]) {
  const ops = { inserts: [] as { table: unknown; values: any }[], updates: [] as { table: unknown; values: any }[], deletes: [] as unknown[] };
  const calls = new Map<unknown, number>();
  const inserted = new Set<unknown>();
  const db: any = {
    select: (fields?: Record<string, unknown>) => {
      const ctx: Ctx = { from: null, fields, joined: false, cond: null, call: 0, ordered: false, inserted };
      const b: any = {
        from: (t: unknown) => { ctx.from = t; ctx.call = (calls.get(t) ?? 0) + 1; calls.set(t, ctx.call); return b; },
        innerJoin: () => { ctx.joined = true; return b; },
        where: (c: unknown) => { ctx.cond = c; return b; },
        orderBy: () => { ctx.ordered = true; return b; }, groupBy: () => b, limit: () => b,
        then: (res: any, rej: any) => Promise.resolve(handler(ctx)).then(res, rej),
      };
      return b;
    },
    insert: (table: unknown) => ({ values: (values: any) => { inserted.add(table); ops.inserts.push({ table, values }); return Promise.resolve([{ insertId: 1 }]); } }),
    update: (table: unknown) => ({ set: (values: any) => ({ where: () => { ops.updates.push({ table, values }); return Promise.resolve(); } }) }),
    delete: (table: unknown) => ({ where: () => { ops.deletes.push(table); return Promise.resolve(); } }),
  };
  return { db, ops };
}

/** Collect literal parameter values from a drizzle SQL condition. */
function params(node: any, out: unknown[] = [], seen = new Set<unknown>()): unknown[] {
  if (!node || typeof node !== "object" || seen.has(node)) return out;
  seen.add(node);
  if ("value" in node && !("queryChunks" in node) && typeof (node as any).value !== "object") out.push((node as any).value);
  for (const c of (node as any).queryChunks ?? []) params(c, out, seen);
  return out;
}

const course = (id: number, title: string, isActive = true) => ({ id, title, programType: "bls", isActive });

describe("resolveAhaCourseAnchor (BLS versions)", () => {
  const build = (counts: Record<number, number>, rows = [course(1, V1_TITLE), course(2, BLS_V2_COURSE_TITLE)]) =>
    fakeDb(({ from, fields }) => {
      if (from === courses) return rows;
      if (from === modules && fields && "moduleCount" in fields) return Object.entries(counts).map(([courseId, moduleCount]) => ({ courseId: Number(courseId), moduleCount }));
      return [];
    }).db;

  it("serves the fully seeded v2 row to new learners", async () => {
    const row = await resolveAhaCourseAnchor(build({ 1: 6, 2: BLS_MODULES_V2.length }), "bls");
    expect(row?.id).toBe(2);
  });

  it("never serves a partially seeded v2 row", async () => {
    const row = await resolveAhaCourseAnchor(build({ 1: 6, 2: 3 }), "bls");
    expect(row?.id).toBe(1);
  });

  it("legacy mode ignores v2 so frozen rows stay reachable", async () => {
    const row = await resolveAhaCourseAnchor(build({ 1: 6, 2: BLS_MODULES_V2.length }), "bls", { skipEnsure: true, preferVersion: "legacy" });
    expect(row?.id).toBe(1);
  });
});

describe("resolvePinnedBlsCourse (audience: new_learners)", () => {
  beforeEach(() => vi.stubEnv("BLS_V2_AUDIENCE", "new_learners"));
  afterEach(() => vi.unstubAllEnvs());
  type Scenario = { enrol: any | null; courseRows?: Record<number, any>; moduleCounts?: Record<number, number>; progressCourseIds?: number[] };
  const build = (s: Scenario) =>
    fakeDb(({ from, fields, joined, cond }) => {
      if (from === enrollments) return s.enrol ? [s.enrol] : [];
      if (from === userProgress) return (s.progressCourseIds ?? []).map((courseId) => ({ courseId }));
      if (from === courses) {
        // Either the pinned-course lookup (by id) or the anchor lookup (all BLS rows).
        const ids = params(cond).filter((v) => typeof v === "number") as number[];
        const all = Object.values(s.courseRows ?? {});
        return ids.length && all.some((r) => ids.includes(r.id)) && !fields ? all.filter((r) => ids.includes(r.id)) : all;
      }
      if (from === modules && fields && "n" in fields) {
        const ids = params(cond).filter((v) => typeof v === "number") as number[];
        return [{ n: s.moduleCounts?.[ids[0]!] ?? 0 }];
      }
      if (from === modules && fields && "moduleCount" in fields) {
        return Object.entries(s.moduleCounts ?? {}).map(([courseId, moduleCount]) => ({ courseId: Number(courseId), moduleCount }));
      }
      void joined;
      return [];
    }).db;

  const rows = { 1: course(1, V1_TITLE), 2: course(2, BLS_V2_COURSE_TITLE) };

  it("keeps a learner on the course their enrollment was created against, even when v2 exists", async () => {
    const db = build({ enrol: { id: 233, courseId: 1, cognitiveModulesComplete: true }, courseRows: rows, moduleCounts: { 1: 6, 2: 8 } });
    const pinned = await resolvePinnedBlsCourse(db, { userId: 9, enrollmentId: 233 });
    expect(pinned?.id).toBe(1);
  });

  it("returns null for a learner with no BLS enrollment so the current course is used", async () => {
    const db = build({ enrol: null, courseRows: rows, moduleCounts: { 1: 6, 2: 8 } });
    expect(await resolvePinnedBlsCourse(db, { userId: 9 })).toBeNull();
  });

  it("returns null for a brand-new enrollment with no stored course and no progress", async () => {
    const db = build({ enrol: { id: 5, courseId: null, cognitiveModulesComplete: false }, courseRows: rows, moduleCounts: { 1: 6, 2: 8 } });
    expect(await resolvePinnedBlsCourse(db, { userId: 9, enrollmentId: 5 })).toBeNull();
  });

  it("infers the original course from existing progress when the stored course is unset", async () => {
    const db = build({ enrol: { id: 7, courseId: null, cognitiveModulesComplete: false }, courseRows: rows, moduleCounts: { 1: 6, 2: 8 }, progressCourseIds: [1, 1, 1] });
    const pinned = await resolvePinnedBlsCourse(db, { userId: 9, enrollmentId: 7 });
    expect(pinned?.id).toBe(1);
  });

  it("moves a completed learner whose stored course is unusable to the original curriculum, never to v2", async () => {
    const db = build({ enrol: { id: 233, courseId: 99, cognitiveModulesComplete: true }, courseRows: rows, moduleCounts: { 1: 6, 2: 8 } });
    const pinned = await resolvePinnedBlsCourse(db, { userId: 9, enrollmentId: 233 });
    expect(pinned?.id).toBe(1);
  });
});

describe("ensureBlsCatalog (v2 seeder)", () => {
  it("creates the v2 row and never updates or deletes the frozen original course", async () => {
    const { db, ops } = fakeDb(({ from, cond, ordered, inserted }) => {
      const titles = params(cond).filter((v) => typeof v === "string");
      if (from === courses) {
        // The original v1 row exists; v2 only after we insert it. SQL title filter is simulated.
        const all = [course(1, V1_TITLE), ...(inserted.has(courses) ? [course(99, BLS_V2_COURSE_TITLE)] : [])];
        return titles.length ? all.filter((r) => titles.includes(r.title)) : all;
      }
      // Re-reads after an insert (ordered by id desc) find the new row; existence checks do not.
      if (from === modules || from === quizzes) return ordered && inserted.has(from) ? [{ id: 500 }] : [];
      return [];
    });
    await ensureBlsCatalog(db);

    const courseInserts = ops.inserts.filter((i) => i.table === courses);
    expect(courseInserts).toHaveLength(1);
    expect(courseInserts[0]!.values.title).toBe(BLS_V2_COURSE_TITLE);
    expect(ops.updates.filter((u) => u.table === courses)).toHaveLength(0);
    expect(ops.inserts.filter((i) => i.table === modules)).toHaveLength(BLS_MODULES_V2.length);
    expect(ops.deletes).toHaveLength(0);
  });

  it("never deletes surplus modules that learners have progress on", async () => {
    const run = async (progress: unknown[]) => {
      const { db, ops } = fakeDb(({ from, ordered, inserted }) => {
        if (from === courses) return [course(99, BLS_V2_COURSE_TITLE)];
        if (from === modules) return [{ id: 10 }];
        if (from === userProgress) return progress;
        if (from === quizzes) return ordered && inserted.has(from) ? [{ id: 500 }] : [];
        return [];
      });
      await ensureBlsCatalog(db);
      return ops.deletes.filter((t) => t === modules).length;
    };
    expect(await run([{ moduleId: 10 }])).toBe(0);
    expect(await run([])).toBe(1);
  });
});

describe("BLS_V2_AUDIENCE", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("defaults to everyone and only accepts the documented values", () => {
    expect(getBlsV2Audience({})).toBe("everyone");
    expect(getBlsV2Audience({ BLS_V2_AUDIENCE: " Off " })).toBe("off");
    expect(getBlsV2Audience({ BLS_V2_AUDIENCE: "new_learners" })).toBe("new_learners");
    expect(getBlsV2Audience({ BLS_V2_AUDIENCE: "garbage" })).toBe("everyone");
  });

  const pinDb = (enrol: any, progressCourseIds: number[] = []) =>
    fakeDb(({ from, fields, cond }) => {
      if (from === enrollments) return [enrol];
      if (from === userProgress) return progressCourseIds.map((courseId) => ({ courseId }));
      const rows = [course(1, V1_TITLE), course(2, BLS_V2_COURSE_TITLE)];
      if (from === courses) {
        const ids = params(cond).filter((v) => typeof v === "number") as number[];
        return ids.length && !fields ? rows.filter((r) => ids.includes(r.id)) : rows;
      }
      if (from === modules && fields && "n" in fields) return [{ n: 6 }];
      if (from === modules && fields && "moduleCount" in fields) return [{ courseId: 1, moduleCount: 6 }, { courseId: 2, moduleCount: 8 }];
      return [];
    }).db;

  it("everyone: a learner who has not completed BLS follows the current course, even with old progress", async () => {
    vi.stubEnv("BLS_V2_AUDIENCE", "everyone");
    const db = pinDb({ id: 7, courseId: 1, cognitiveModulesComplete: false }, [1, 1]);
    expect(await resolvePinnedBlsCourse(db, { userId: 9, enrollmentId: 7 })).toBeNull();
  });

  it("everyone: a completed learner keeps their own course for completion and certificate checks", async () => {
    vi.stubEnv("BLS_V2_AUDIENCE", "everyone");
    const db = pinDb({ id: 233, courseId: 1, cognitiveModulesComplete: true });
    expect((await resolvePinnedBlsCourse(db, { userId: 9, enrollmentId: 233 }))?.id).toBe(1);
  });

  it("off: the resolver never serves v2 and the seeder creates nothing", async () => {
    vi.stubEnv("BLS_V2_AUDIENCE", "off");
    const rows = [course(1, V1_TITLE), course(2, BLS_V2_COURSE_TITLE)];
    const { db: rdb } = fakeDb(({ from, fields }) => {
      if (from === courses) return rows;
      if (from === modules && fields && "moduleCount" in fields) return [{ courseId: 1, moduleCount: 6 }, { courseId: 2, moduleCount: 8 }];
      return [];
    });
    expect((await resolveAhaCourseAnchor(rdb, "bls"))?.id).toBe(1);

    const { db, ops } = fakeDb(() => []);
    await ensureBlsCatalog(db);
    expect(ops.inserts).toHaveLength(0);
    expect(ops.updates).toHaveLength(0);
  });
});
