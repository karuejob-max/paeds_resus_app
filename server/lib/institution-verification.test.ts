import { describe, expect, it } from "vitest";
import { inAppNotifications, institutionalAccountAdmins, institutionalAccounts, institutionVerificationEvents, kmhflFacilities } from "../../drizzle/schema";
import {
  VERIFICATION_REQUIRED_MESSAGE,
  registryNameMatch,
  setInstitutionFacility,
  assertInstitutionVerified,
  isVerifiedStatus,
  reviewInstitutionVerification,
  submitVerificationEvidence,
} from "./institution-verification";

type Account = { verificationStatus: string; verificationMethod?: string | null; kmhflFacilityId?: number | null; ownerUserId?: number; companyName?: string };

function fakeDb(opts: { account?: Account | null; verifiedElsewhere?: boolean; registry?: Record<string, unknown>[] }) {
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
    if (table === kmhflFacilities) return opts.registry === undefined ? [{ id: 12, name: "Consolata Hospital Mathari", code: "11111", operationalStatus: "operational" }] : opts.registry;
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
    const { db, updates, inserts } = fakeDb({ account: { verificationStatus: "unverified", kmhflFacilityId: 12 } });
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
    const { db, updates } = fakeDb({ account: { verificationStatus: "verified", verificationMethod: "grandfathered", kmhflFacilityId: 12 } });
    await reviewInstitutionVerification(db, { institutionId: 5, reviewerUserId: 9, decision: "verify", note: "Reviewed against MoH list" });
    expect(updates.find((u) => u.table === institutionalAccounts)!.set).toMatchObject({ verificationMethod: "platform_admin" });
  });

  it("a platform administrator can verify an institution that never submitted evidence", async () => {
    const { db, updates, inserts } = fakeDb({ account: { verificationStatus: "unverified", verificationMethod: null, kmhflFacilityId: 12 } });
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


describe("guided evidence submission", () => {
  const base = { institutionId: 5, actorUserId: 7, method: "letterhead" as const, evidenceUrl: "https://example.org/l.pdf" };

  it("needs a registry facility, or a stated reason that there is none", async () => {
    const a = fakeDb({ account: { verificationStatus: "unverified" } });
    await expect(submitVerificationEvidence(a.db, base)).rejects.toThrow(/registry list/);
    const b = fakeDb({ account: { verificationStatus: "unverified" } });
    await expect(submitVerificationEvidence(b.db, { ...base, facilityNotListed: true, note: "short" })).rejects.toThrow(/why your institution/);
    const c = fakeDb({ account: { verificationStatus: "unverified" } });
    await submitVerificationEvidence(c.db, { ...base, facilityNotListed: true, note: "We are a training body, not a facility" });
    expect(c.updates[0].set).toMatchObject({ verificationFacilityNotListed: true, verificationStatus: "pending_review" });
  });

  it("needs evidence: a file or a link", async () => {
    const { db, updates } = fakeDb({ account: { verificationStatus: "unverified", kmhflFacilityId: 12 } });
    await expect(submitVerificationEvidence(db, { institutionId: 5, actorUserId: 7, method: "county_letter" })).rejects.toThrow(/Attach your evidence/);
    expect(updates).toHaveLength(0);
  });

  it("a KMPDC licence needs its number", async () => {
    const { db } = fakeDb({ account: { verificationStatus: "unverified", kmhflFacilityId: 12 } });
    await expect(submitVerificationEvidence(db, { ...base, method: "kmpdc_licence" })).rejects.toThrow(/KMPDC/);
  });

  it("stores an uploaded file and the licence number", async () => {
    const { db, updates } = fakeDb({ account: { verificationStatus: "unverified", kmhflFacilityId: 12 } });
    await submitVerificationEvidence(db, {
      institutionId: 5,
      actorUserId: 7,
      method: "kmpdc_licence",
      licenceNumber: " KMPDC/123 ",
      evidenceFile: { key: "institution-verification/5/abc-licence.pdf", fileName: "licence.pdf", contentType: "application/pdf" },
    });
    expect(updates[0].set).toMatchObject({
      verificationEvidenceKey: "institution-verification/5/abc-licence.pdf",
      verificationEvidenceFileName: "licence.pdf",
      verificationLicenceNumber: "KMPDC/123",
      verificationEvidenceUrl: null,
    });
  });
});

describe("platform-admin verify needs the registry link", () => {
  const input = { institutionId: 5, reviewerUserId: 9, decision: "verify" as const, note: "Checked against the registry" };

  it("is refused without a registry facility unless the admin confirms it is not one", async () => {
    const a = fakeDb({ account: { verificationStatus: "unverified" } });
    await expect(reviewInstitutionVerification(a.db, input)).rejects.toThrow(/registry facility/);
    expect(a.updates).toHaveLength(0);
    const b = fakeDb({ account: { verificationStatus: "unverified" } });
    await expect(reviewInstitutionVerification(b.db, { ...input, allowWithoutRegistry: true })).resolves.toMatchObject({ status: "verified" });
  });

  it("is allowed when the institution already said it is not in the registry", async () => {
    const { db } = fakeDb({ account: { verificationStatus: "pending_review", verificationFacilityNotListed: true } as never });
    await expect(reviewInstitutionVerification(db, input)).resolves.toMatchObject({ status: "verified" });
  });
});

describe("setInstitutionFacility", () => {
  it("links the registry facility and copies its MFL code", async () => {
    const { db, updates } = fakeDb({ account: { verificationStatus: "unverified" } });
    const result = await setInstitutionFacility(db, { institutionId: 5, kmhflFacilityId: 12, asPlatformAdmin: false });
    expect(result).toEqual({ facilityName: "Consolata Hospital Mathari", code: "11111" });
    expect(updates[0].set).toEqual({ kmhflFacilityId: 12, registrationNumber: "11111" });
  });

  it("an institution administrator cannot change it once under review or verified; a platform administrator can", async () => {
    for (const verificationStatus of ["pending_review", "verified"]) {
      const a = fakeDb({ account: { verificationStatus } });
      await expect(setInstitutionFacility(a.db, { institutionId: 5, kmhflFacilityId: 12, asPlatformAdmin: false })).rejects.toMatchObject({ code: "FORBIDDEN" });
      const b = fakeDb({ account: { verificationStatus } });
      await expect(setInstitutionFacility(b.db, { institutionId: 5, kmhflFacilityId: 12, asPlatformAdmin: true })).resolves.toBeTruthy();
    }
  });

  it("refuses an unknown or non-operational registry facility", async () => {
    await expect(setInstitutionFacility(fakeDb({ account: { verificationStatus: "unverified" }, registry: [] }).db, { institutionId: 5, kmhflFacilityId: 99, asPlatformAdmin: false })).rejects.toMatchObject({ code: "NOT_FOUND" });
    const closed = fakeDb({ account: { verificationStatus: "unverified" }, registry: [{ id: 12, name: "Closed Clinic", code: "2", operationalStatus: "non_operational" }] });
    await expect(setInstitutionFacility(closed.db, { institutionId: 5, kmhflFacilityId: 12, asPlatformAdmin: false })).rejects.toThrow(/not operational/);
  });
});

describe("registryNameMatch", () => {
  it("compares the distinctive words, ignoring Hospital / Health Centre and the like", () => {
    expect(registryNameMatch("Consolata Hospital Mathari", "Consolata Mission Hospital Mathari")).not.toBe("different");
    expect(registryNameMatch("Consolata Hospital", "Consolata Hospital")).toBe("match");
    expect(registryNameMatch("Mathari Hospital", "Consolata Hospital Mathari")).toBe("partial");
    expect(registryNameMatch("Paeds Resus", "Consolata Hospital Mathari")).toBe("different");
    expect(registryNameMatch("Anything", null)).toBe("none");
  });
});
