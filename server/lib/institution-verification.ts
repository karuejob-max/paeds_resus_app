import { and, count, eq, ne } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import type { getDb } from "../db";
import { institutionalAccountAdmins, institutionalAccounts, institutionalStaffMembers, institutionVerificationEvents, kmhflFacilities } from "../../drizzle/schema";
import { activeStaffCondition } from "./institution-active-member";
import { getInstitutionAdminUserIds, notifyUsers } from "./institution-admin-grants";

type Db = NonNullable<Awaited<ReturnType<typeof getDb>>>;

export type VerificationStatus = "unverified" | "pending_review" | "verified" | "rejected";
/** kmpdc_licence: private, faith-based and community facilities. county_letter: public facilities. The rest are kept so older submissions still display. */
export const VERIFICATION_METHODS = ["kmpdc_licence", "county_letter", "letterhead", "facility_domain_email", "other"] as const;
export type VerificationMethod = (typeof VERIFICATION_METHODS)[number];

export const ARCHIVED_MESSAGE = "This institution has been archived. Restore it first.";

export const VERIFICATION_REQUIRED_MESSAGE =
  "This institution has not been verified yet, so it cannot receive provider link requests.";

/** Only a verified institution can receive provider link requests or see provider requests. */
export function isVerifiedStatus(status: string | null | undefined): boolean {
  return status === "verified";
}

export async function getInstitutionVerificationStatus(db: Db, institutionId: number): Promise<VerificationStatus | null> {
  const [row] = await db
    .select({ verificationStatus: institutionalAccounts.verificationStatus })
    .from(institutionalAccounts)
    .where(eq(institutionalAccounts.id, institutionId))
    .limit(1);
  return (row?.verificationStatus as VerificationStatus | undefined) ?? null;
}

export async function isInstitutionVerified(db: Db, institutionId: number): Promise<boolean> {
  return isVerifiedStatus(await getInstitutionVerificationStatus(db, institutionId));
}

export async function assertInstitutionVerified(db: Db, institutionId: number): Promise<void> {
  if (!(await isInstitutionVerified(db, institutionId))) {
    throw new TRPCError({ code: "FORBIDDEN", message: VERIFICATION_REQUIRED_MESSAGE });
  }
}

async function recordVerificationEvent(
  db: Db,
  input: { institutionId: number; eventType: "submitted" | "verified" | "rejected" | "revoked" | "archived" | "restored" | "facility_linked"; actorUserId: number; method?: string | null; note?: string | null },
) {
  await db.insert(institutionVerificationEvents).values({
    institutionalAccountId: input.institutionId,
    eventType: input.eventType,
    actorUserId: input.actorUserId,
    method: input.method ?? null,
    note: input.note ? input.note.slice(0, 1000) : null,
  });
}

/**
 * Another institution that is already VERIFIED for the same KMHFL facility. One facility,
 * one verified claim: a second claimant has to be resolved by a platform administrator
 * (revoke the existing claim first) rather than both being accepted.
 */
export async function findVerifiedKmhflConflict(db: Db, institutionId: number): Promise<{ institutionId: number } | null> {
  const [account] = await db
    .select({ kmhflFacilityId: institutionalAccounts.kmhflFacilityId })
    .from(institutionalAccounts)
    .where(eq(institutionalAccounts.id, institutionId))
    .limit(1);
  if (!account?.kmhflFacilityId) return null;
  const [other] = await db
    .select({ id: institutionalAccounts.id })
    .from(institutionalAccounts)
    .where(and(
      eq(institutionalAccounts.kmhflFacilityId, account.kmhflFacilityId),
      eq(institutionalAccounts.verificationStatus, "verified"),
      ne(institutionalAccounts.id, institutionId),
    ))
    .limit(1);
  return other ? { institutionId: other.id } : null;
}

const GENERIC_NAME_WORDS = new Set(["hospital", "health", "centre", "center", "clinic", "dispensary", "the", "of", "and", "medical", "level", "county", "sub", "nursing", "home", "services", "ltd", "limited"]);

function nameTokens(value: string): string[] {
  const all = value.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter(Boolean);
  const distinctive = all.filter((token) => !GENERIC_NAME_WORDS.has(token));
  return distinctive.length > 0 ? distinctive : all;
}

/** How closely the name an institution typed matches the registry name. Advisory only; the reviewer decides. */
export function registryNameMatch(institutionName: string, registryName: string | null | undefined): "match" | "partial" | "different" | "none" {
  if (!registryName) return "none";
  const a = new Set(nameTokens(institutionName));
  const b = new Set(nameTokens(registryName));
  if (a.size === 0 || b.size === 0) return "different";
  const shared = [...a].filter((token) => b.has(token)).length;
  if (shared === 0) return "different";
  const ratio = shared / Math.max(a.size, b.size);
  return ratio >= 0.75 ? "match" : "partial";
}

/** Official MFL codes are numeric (e.g. 12345). Sample or placeholder codes (e.g. CHM-001) are not official. */
export function isOfficialMflCode(code: string | null | undefined): boolean {
  return /^\d{4,6}$/.test((code ?? "").trim());
}

/**
 * Link an institution to a facility in the Ministry of Health registry (KMHFL). The MFL code is
 * copied onto the institution so reviewers see it. An institution administrator may do this only
 * before review; once an institution is awaiting review or verified, only a platform administrator may change it.
 */
export async function setInstitutionFacility(
  db: Db,
  input: { institutionId: number; kmhflFacilityId: number; asPlatformAdmin: boolean; actorUserId?: number },
): Promise<{ facilityName: string; code: string | null }> {
  const [account] = await db
    .select({
      verificationStatus: institutionalAccounts.verificationStatus,
      archivedAt: institutionalAccounts.archivedAt,
    })
    .from(institutionalAccounts)
    .where(eq(institutionalAccounts.id, input.institutionId))
    .limit(1);
  if (!account) throw new TRPCError({ code: "NOT_FOUND", message: "Institution not found" });
  if (account.archivedAt) throw new TRPCError({ code: "BAD_REQUEST", message: ARCHIVED_MESSAGE });
  if (!input.asPlatformAdmin && (account.verificationStatus === "verified" || account.verificationStatus === "pending_review")) {
    throw new TRPCError({ code: "FORBIDDEN", message: "The facility can no longer be changed here. Ask a platform administrator." });
  }
  const [facility] = await db
    .select({ id: kmhflFacilities.id, name: kmhflFacilities.name, code: kmhflFacilities.code, operationalStatus: kmhflFacilities.operationalStatus })
    .from(kmhflFacilities)
    .where(eq(kmhflFacilities.id, input.kmhflFacilityId))
    .limit(1);
  if (!facility) throw new TRPCError({ code: "NOT_FOUND", message: "That facility is not in the registry list." });
  if (facility.operationalStatus && facility.operationalStatus !== "operational") {
    throw new TRPCError({ code: "BAD_REQUEST", message: "The registry lists that facility as not operational." });
  }
  await db
    .update(institutionalAccounts)
    .set({ kmhflFacilityId: facility.id, ...(isOfficialMflCode(facility.code) ? { registrationNumber: facility.code } : {}) })
    .where(eq(institutionalAccounts.id, input.institutionId));
  if (input.actorUserId) {
    await recordVerificationEvent(db, {
      institutionId: input.institutionId,
      eventType: "facility_linked",
      actorUserId: input.actorUserId,
      note: `${facility.name}${facility.code ? ` (code ${facility.code})` : ""}`,
    });
  }
  return { facilityName: facility.name, code: facility.code ?? null };
}

/** An institution administrator submits evidence for platform-admin review. */
export async function submitVerificationEvidence(
  db: Db,
  input: {
    institutionId: number;
    actorUserId: number;
    method: VerificationMethod;
    /** A link, a stored upload, or both. At least one is required. */
    evidenceUrl?: string | null;
    evidenceFile?: { key: string; fileName: string; contentType: string } | null;
    licenceNumber?: string | null;
    /** The institution is not a registry facility (training body, county office) or is not listed yet. */
    facilityNotListed?: boolean;
    note?: string | null;
  },
) {
  const [account] = await db
    .select({
      verificationStatus: institutionalAccounts.verificationStatus,
      archivedAt: institutionalAccounts.archivedAt,
      kmhflFacilityId: institutionalAccounts.kmhflFacilityId,
    })
    .from(institutionalAccounts)
    .where(eq(institutionalAccounts.id, input.institutionId))
    .limit(1);
  if (!account) throw new TRPCError({ code: "NOT_FOUND", message: "Institution not found" });
  if (account.archivedAt) throw new TRPCError({ code: "BAD_REQUEST", message: ARCHIVED_MESSAGE });
  if (account.verificationStatus === "verified") {
    throw new TRPCError({ code: "BAD_REQUEST", message: "This institution is already verified." });
  }
  if (account.verificationStatus === "pending_review") {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Evidence is already awaiting review." });
  }
  const facilityNotListed = Boolean(input.facilityNotListed);
  if (!account.kmhflFacilityId && !facilityNotListed) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Choose your facility from the registry list, or say that it is not listed." });
  }
  if (facilityNotListed && (input.note?.trim().length ?? 0) < 10) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Tell the reviewer in a sentence why your institution is not in the registry list." });
  }
  if (!input.evidenceUrl && !input.evidenceFile) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Attach your evidence (a file or a link)." });
  }
  if (input.method === "kmpdc_licence" && (input.licenceNumber?.trim().length ?? 0) < 3) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Enter your KMPDC licence or registration number." });
  }
  await db
    .update(institutionalAccounts)
    .set({
      verificationStatus: "pending_review",
      verificationMethod: input.method,
      verificationEvidenceUrl: input.evidenceUrl ?? null,
      verificationEvidenceKey: input.evidenceFile?.key ?? null,
      verificationEvidenceFileName: input.evidenceFile?.fileName ?? null,
      verificationEvidenceContentType: input.evidenceFile?.contentType ?? null,
      verificationLicenceNumber: input.licenceNumber?.trim() || null,
      verificationFacilityNotListed: facilityNotListed,
      verificationEvidenceNote: input.note?.trim() || null,
      verificationSubmittedAt: new Date(),
      verificationReviewNote: null,
    })
    .where(eq(institutionalAccounts.id, input.institutionId));
  await recordVerificationEvent(db, {
    institutionId: input.institutionId,
    eventType: "submitted",
    actorUserId: input.actorUserId,
    method: input.method,
    note: input.note,
  });
}

/** A platform administrator decides. Verifying is refused while another institution holds the same KMHFL facility. */
export async function reviewInstitutionVerification(
  db: Db,
  input: { institutionId: number; reviewerUserId: number; decision: "verify" | "reject" | "revoke"; note: string; allowWithoutRegistry?: boolean },
): Promise<{ status: VerificationStatus }> {
  const [account] = await db
    .select({
      verificationStatus: institutionalAccounts.verificationStatus,
      verificationMethod: institutionalAccounts.verificationMethod,
      archivedAt: institutionalAccounts.archivedAt,
      kmhflFacilityId: institutionalAccounts.kmhflFacilityId,
      verificationFacilityNotListed: institutionalAccounts.verificationFacilityNotListed,
    })
    .from(institutionalAccounts)
    .where(eq(institutionalAccounts.id, input.institutionId))
    .limit(1);
  if (!account) throw new TRPCError({ code: "NOT_FOUND", message: "Institution not found" });
  if (account.archivedAt && input.decision !== "revoke") throw new TRPCError({ code: "BAD_REQUEST", message: ARCHIVED_MESSAGE });

  if (input.decision === "verify") {
    if (account.verificationStatus === "verified" && account.verificationMethod !== "grandfathered") {
      throw new TRPCError({ code: "BAD_REQUEST", message: "This institution is already verified." });
    }
    if (!account.kmhflFacilityId && !input.allowWithoutRegistry && !account.verificationFacilityNotListed) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Link this institution to its registry facility first, or confirm that it is not a registry facility.",
      });
    }
    const conflict = await findVerifiedKmhflConflict(db, input.institutionId);
    if (conflict) {
      throw new TRPCError({
        code: "CONFLICT",
        message: `Another institution (#${conflict.institutionId}) is already verified for this KMHFL facility. Resolve that claim first (revoke it) before verifying this one.`,
      });
    }
  } else if (input.decision === "reject" && account.verificationStatus !== "pending_review") {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Only institutions awaiting review can be rejected." });
  } else if (input.decision === "revoke" && account.verificationStatus !== "verified") {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Only verified institutions can be revoked." });
  }

  const status: VerificationStatus = input.decision === "verify" ? "verified" : input.decision === "reject" ? "rejected" : "unverified";
  const now = new Date();
  await db
    .update(institutionalAccounts)
    .set({
      verificationStatus: status,
      verifiedAt: status === "verified" ? now : null,
      verifiedByUserId: status === "verified" ? input.reviewerUserId : null,
      verificationMethod:
        input.decision === "verify" && (!account.verificationMethod || account.verificationMethod === "grandfathered")
          ? "platform_admin"
          : account.verificationMethod,
      verificationReviewNote: input.note.trim(),
    })
    .where(eq(institutionalAccounts.id, input.institutionId));
  await recordVerificationEvent(db, {
    institutionId: input.institutionId,
    eventType: input.decision === "verify" ? "verified" : input.decision === "reject" ? "rejected" : "revoked",
    actorUserId: input.reviewerUserId,
    method: input.decision === "verify" && !account.verificationMethod ? "platform_admin" : account.verificationMethod,
    note: input.note,
  });
  await notifyUsers(db, await getInstitutionAdminUserIds(db, input.institutionId), {
    title: input.decision === "verify" ? "Institution verified" : input.decision === "reject" ? "Verification not approved" : "Verification withdrawn",
    body:
      input.decision === "verify"
        ? "Your institution is verified. Providers can now send link requests to it."
        : `${input.decision === "reject" ? "Your verification evidence was not approved" : "Your institution's verification was withdrawn"}: ${input.note.trim()}`,
    relatedId: input.institutionId,
    actionUrl: "/institution",
  });
  return { status };
}


/**
 * A platform administrator archives a duplicate or mistaken institution. Nothing is deleted:
 * membership, admin and verification history keep pointing at the row. It is refused while the
 * institution is verified (revoke first), has administrators other than its creator, or has
 * active members, so real people are never silently orphaned.
 */
export async function archiveInstitution(db: Db, input: { institutionId: number; actorUserId: number; reason: string }) {
  const reason = input.reason.trim();
  if (reason.length < 3) throw new TRPCError({ code: "BAD_REQUEST", message: "A reason is required." });
  const [account] = await db
    .select({
      ownerUserId: institutionalAccounts.userId,
      verificationStatus: institutionalAccounts.verificationStatus,
      archivedAt: institutionalAccounts.archivedAt,
    })
    .from(institutionalAccounts)
    .where(eq(institutionalAccounts.id, input.institutionId))
    .limit(1);
  if (!account) throw new TRPCError({ code: "NOT_FOUND", message: "Institution not found" });
  if (account.archivedAt) throw new TRPCError({ code: "BAD_REQUEST", message: "This institution is already archived." });
  if (account.verificationStatus === "verified") {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Revoke this institution's verification before archiving it." });
  }

  const [otherAdmins] = await db
    .select({ total: count() })
    .from(institutionalAccountAdmins)
    .where(and(eq(institutionalAccountAdmins.institutionalAccountId, input.institutionId), ne(institutionalAccountAdmins.userId, account.ownerUserId)));
  if (Number(otherAdmins?.total ?? 0) > 0) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "This institution has other administrators. Remove them first, or leave it in place." });
  }
  const [members] = await db
    .select({ total: count() })
    .from(institutionalStaffMembers)
    .where(and(eq(institutionalStaffMembers.institutionalAccountId, input.institutionId), activeStaffCondition()));
  if (Number(members?.total ?? 0) > 0) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "This institution has active members, so it cannot be archived." });
  }

  await db
    .update(institutionalAccounts)
    .set({ archivedAt: new Date(), archivedByUserId: input.actorUserId, archiveReason: reason.slice(0, 500) })
    .where(eq(institutionalAccounts.id, input.institutionId));
  await recordVerificationEvent(db, { institutionId: input.institutionId, eventType: "archived", actorUserId: input.actorUserId, note: reason });
}

export async function restoreInstitution(db: Db, input: { institutionId: number; actorUserId: number; reason: string }) {
  const reason = input.reason.trim();
  if (reason.length < 3) throw new TRPCError({ code: "BAD_REQUEST", message: "A reason is required." });
  const [account] = await db
    .select({ archivedAt: institutionalAccounts.archivedAt })
    .from(institutionalAccounts)
    .where(eq(institutionalAccounts.id, input.institutionId))
    .limit(1);
  if (!account) throw new TRPCError({ code: "NOT_FOUND", message: "Institution not found" });
  if (!account.archivedAt) throw new TRPCError({ code: "BAD_REQUEST", message: "This institution is not archived." });
  await db
    .update(institutionalAccounts)
    .set({ archivedAt: null, archivedByUserId: null, archiveReason: null })
    .where(eq(institutionalAccounts.id, input.institutionId));
  await recordVerificationEvent(db, { institutionId: input.institutionId, eventType: "restored", actorUserId: input.actorUserId, note: reason });
}
