import { and, count, eq, ne } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import type { getDb } from "../db";
import { institutionalAccountAdmins, institutionalAccounts, institutionalStaffMembers, institutionVerificationEvents } from "../../drizzle/schema";
import { activeStaffCondition } from "./institution-active-member";
import { getInstitutionAdminUserIds, notifyUsers } from "./institution-admin-grants";

type Db = NonNullable<Awaited<ReturnType<typeof getDb>>>;

export type VerificationStatus = "unverified" | "pending_review" | "verified" | "rejected";
export const VERIFICATION_METHODS = ["letterhead", "facility_domain_email", "other"] as const;
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
  input: { institutionId: number; eventType: "submitted" | "verified" | "rejected" | "revoked" | "archived" | "restored"; actorUserId: number; method?: string | null; note?: string | null },
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

/** An institution administrator submits evidence for platform-admin review. */
export async function submitVerificationEvidence(
  db: Db,
  input: { institutionId: number; actorUserId: number; method: VerificationMethod; evidenceUrl: string; note?: string | null },
) {
  const [account] = await db
    .select({ verificationStatus: institutionalAccounts.verificationStatus, archivedAt: institutionalAccounts.archivedAt })
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
  await db
    .update(institutionalAccounts)
    .set({
      verificationStatus: "pending_review",
      verificationMethod: input.method,
      verificationEvidenceUrl: input.evidenceUrl,
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
  input: { institutionId: number; reviewerUserId: number; decision: "verify" | "reject" | "revoke"; note: string },
): Promise<{ status: VerificationStatus }> {
  const [account] = await db
    .select({ verificationStatus: institutionalAccounts.verificationStatus, verificationMethod: institutionalAccounts.verificationMethod, archivedAt: institutionalAccounts.archivedAt })
    .from(institutionalAccounts)
    .where(eq(institutionalAccounts.id, input.institutionId))
    .limit(1);
  if (!account) throw new TRPCError({ code: "NOT_FOUND", message: "Institution not found" });
  if (account.archivedAt && input.decision !== "revoke") throw new TRPCError({ code: "BAD_REQUEST", message: ARCHIVED_MESSAGE });

  if (input.decision === "verify") {
    if (account.verificationStatus === "verified" && account.verificationMethod !== "grandfathered") {
      throw new TRPCError({ code: "BAD_REQUEST", message: "This institution is already verified." });
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
