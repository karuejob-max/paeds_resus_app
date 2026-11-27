import { describe, expect, it } from "vitest";
import { inAppNotifications, institutionalAccountAdmins, institutionalAccounts, institutionVerificationEvents } from "../../drizzle/schema";
import {
  VERIFICATION_REQUIRED_MESSAGE,
  assertInstitutionVerified,
  isVerifiedStatus,
  reviewInstitutionVerification,
  submitVerificationEvidence,
} from "./institution-verification";

type Account = { verificationStatus: string; verificationMethod?: string | null; kmhflFacilityId?: number | null; ownerUserId?: number; companyName?: string };

function fakeDb(opts: { account?: Account | null; verifiedElsewhere?: boolean }) {
  const inserts: { table: unknown; values: any }[] = [];
  const updates: { table: unknown; set: any }[] = [];
  let accountReads = 0;
  const result = (table: unknown): unknown[] => {
    if (table === institutionalAccounts) {
      accountReads += 1;
      if (!opts.account) return [];
      // The conflict lookup is the query for "another verified institution"; the fake serves it on the third read.
      return [{ ...opts.account, ownerUserId: 1, companyName: "Test Hospital", id: 5 }];
    }
    if (table === institutionalAccountAdmins) return [{ userId: 2 }];
    return [];
  };
  const db = {
    select: (fields?: Record<string, unknown>) => ({
      from: (table: unknown) => {
        const chain: any = {};
        chain.where = () => chain;
        chain.limit = async () => {
          // A select that only asks for `id` on institutionalAccounts is the "verified elsewhere" lookup.
          if (table === institutionalAccounts && fields && Object.keys(fields).length === 1 && "id" in fields) {
            return opts.verifiedElsewhere ? [{ id: 99 }] : [];
          }
          return result(table);
        };
        chain.then = (resolve: (v: unknown[]) => unknown) => Promise.resolve(result(table)).then(resolve);
        return chain;
      },
    }),
    insert: (table: unknown) => ({ values: async (values: any) => { inserts.push({ table, values }); return [{ insertId: 1 }]; } }),
    update: (table: unknown) => ({ set: (set: any) => ({ where: async () => { updates.push({ table, set }); } }) }),
  };
  return { db: db as never, inserts, updates, accountReads: () => accountReads };
}

const events = (inserts: { table: unknown; values: any }[]) => inserts.filter((i) => i.table === institutionVerificationEvents).map((i) => i.values);

describe("verification gate", () => {
  it("only a verified institution passes", async () => {
    expect(isVerifiedStatus("verified")).toBe(true);
    for (const status of ["unverified", "pending_review", "rejected", null, undefined]) {
      expect(isVerifiedStatus(status)).toBe(false);
    }
  });

  it("assertInstitutionVerified refuses an unverified institution with the standard message", async () => {
    const { db } = fakeDb({ account: { verificationStatus: "unverified" } });
    await expect(assertInstitutionVerified(db, 5)).rejects.toMatchObject({ code: "FORBIDDEN", message: VERIFICATION_REQUIRED_MESSAGE });
  });

  it("assertInstitutionVerified accepts a verified institution", async () => {
    const { db } = fakeDb({ account: { verificationStatus: "verified" } });
    await expect(assertInstitutionVerified(db, 5)).resolves.toBeUndefined();
  });
});

describe("submitting evidence", () => {
  it("moves an unverified institution to pending review and records the event", async () => {
    const { db, updates, inserts } = fakeDb({ account: { verificationStatus: "unverified" } });
    await submitVerificationEvidence(db, { institutionId: 5, actorUserId: 7, method: "letterhead", evidenceUrl: "https://example.org/l.pdf", note: "Signed by the CEO" });
    expect(updates.find((u) => u.table === institutionalAccounts)!.set).toMatchObject({ verificationStatus: "pending_review", verificationMethod: "letterhead" });
    expect(events(inserts)[0]).toMatchObject({ eventType: "submitted", actorUserId: 7 });
  });

  it("refuses when already verified or already awaiting review", async () => {
    for (const verificationStatus of ["verified", "pending_review"]) {
      const { db, updates } = fakeDb({ account: { verificationStatus } });
      await expect(submitVerificationEvidence(db, { institutionId: 5, actorUserId: 7, method: "letterhead", evidenceUrl: "https://example.org/l.pdf" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
      expect(updates).toHaveLength(0);
    }
  });
});

describe("platform-admin review", () => {
  it("verify marks the institution verified, records who and why, and tells the administrators", async () => {
    const { db, updates, inserts } = fakeDb({ account: { verificationStatus: "pending_review", verificationMethod: "letterhead", kmhflFacilityId: 12 } });
    const result = await reviewInstitutionVerification(db, { institutionId: 5, reviewerUserId: 9, decision: "verify", note: "Letterhead matches the MoH register" });
    expect(result.status).toBe("verified");
    expect(updates.find((u) => u.table === institutionalAccounts)!.set).toMatchObject({ verificationStatus: "verified", verifiedByUserId: 9 });
    expect(events(inserts)[0]).toMatchObject({ eventType: "verified", actorUserId: 9 });
    expect(inserts.some((i) => i.table === inAppNotifications)).toBe(true);
  });

  it("verify is refused while another institution holds the same KMHFL facility", async () => {
    const { db, updates } = fakeDb({ account: { verificationStatus: "pending_review", verificationMethod: "letterhead", kmhflFacilityId: 12 }, verifiedElsewhere: true });
    await expect(reviewInstitutionVerification(db, { institutionId: 5, reviewerUserId: 9, decision: "verify", note: "Looks fine" })).rejects.toMatchObject({ code: "CONFLICT" });
    expect(updates).toHaveLength(0);
  });

  it("reviewing a grandfathered institution records the new method", async () => {
    const { db, updates } = fakeDb({ account: { verificationStatus: "verified", verificationMethod: "grandfathered" } });
    await reviewInstitutionVerification(db, { institutionId: 5, reviewerUserId: 9, decision: "verify", note: "Reviewed against MoH list" });
    expect(updates.find((u) => u.table === institutionalAccounts)!.set).toMatchObject({ verificationMethod: "platform_admin" });
  });

  it("a platform administrator can verify an institution that never submitted evidence", async () => {
    const { db, updates, inserts } = fakeDb({ account: { verificationStatus: "unverified", verificationMethod: null } });
    const result = await reviewInstitutionVerification(db, { institutionId: 5, reviewerUserId: 9, decision: "verify", note: "Confirmed with the MoH facility register" });
    expect(result.status).toBe("verified");
    expect(updates.find((u) => u.table === institutionalAccounts)!.set).toMatchObject({ verificationMethod: "platform_admin", verifiedByUserId: 9 });
    expect(events(inserts)[0]).toMatchObject({ eventType: "verified", method: "platform_admin" });
  });

  it("reject only applies to institutions awaiting review; revoke only to verified ones", async () => {
    const a = fakeDb({ account: { verificationStatus: "unverified" } });
    await expect(reviewInstitutionVerification(a.db, { institutionId: 5, reviewerUserId: 9, decision: "reject", note: "No evidence" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    const b = fakeDb({ account: { verificationStatus: "pending_review" } });
    await expect(reviewInstitutionVerification(b.db, { institutionId: 5, reviewerUserId: 9, decision: "revoke", note: "Not verified" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("revoke returns a verified institution to unverified", async () => {
    const { db, updates, inserts } = fakeDb({ account: { verificationStatus: "verified", verificationMethod: "letterhead" } });
    const result = await reviewInstitutionVerification(db, { institutionId: 5, reviewerUserId: 9, decision: "revoke", note: "Claim disputed" });
    expect(result.status).toBe("unverified");
    expect(updates.find((u) => u.table === institutionalAccounts)!.set).toMatchObject({ verificationStatus: "unverified", verifiedAt: null });
    expect(events(inserts)[0]).toMatchObject({ eventType: "revoked" });
  });
});
