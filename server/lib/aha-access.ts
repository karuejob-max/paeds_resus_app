import { and, eq, gt, inArray, isNull, or } from "drizzle-orm";
import {
  ahaAccessGrants,
  enrollments,
  ilsCredentialRequests,
  nerpOfferEnrollments,
  payments,
  professionalCredentials,
} from "../../drizzle/schema";
import { getDb } from "../db";
import {
  getIerpInternProfile,
  getIerpPaymentAccessForUser,
  isIerpInternProfileReady,
} from "./ierp-program-state";
import { isMissingTableError } from "./is-missing-db-table";
import {
  AHA_PROGRAM_TYPES,
  AHA_PROGRAM_LABELS,
  INDEPENDENT_AHA_PATHWAY_LABEL,
  getIndependentAhaPriceKes,
  type AhaProgramType,
} from "../../shared/aha-pathways";

export type AhaAccessPathway =
  | "nerp"
  | "ierp"
  | "ilsp"
  | "independent"
  | "admin_grant";

export type AhaAccessDecision =
  | {
      allowed: true;
      pathway: AhaAccessPathway;
      message: string;
    }
  | {
      allowed: false;
      pathway: null;
      message: string;
    };

export type AhaAccessDb = NonNullable<Awaited<ReturnType<typeof getDb>>>;

function allowed(pathway: AhaAccessPathway, message: string): AhaAccessDecision {
  return { allowed: true, pathway, message };
}

function blocked(message: string): AhaAccessDecision {
  return { allowed: false, pathway: null, message };
}

export function isAhaProgramType(value: string | null | undefined): value is AhaProgramType {
  return value != null && (AHA_PROGRAM_TYPES as readonly string[]).includes(value);
}

export function isCurrentNckLicence(credential: {
  issuer?: string | null;
  jurisdiction?: string | null;
  credentialNumber?: string | null;
  expiresAt?: Date | null;
  status?: string | null;
}, now: Date = new Date()): boolean {
  if (credential.status !== "verified" || !credential.credentialNumber?.trim()) return false;
  const issuer = `${credential.issuer ?? ""} ${credential.jurisdiction ?? ""}`.toLowerCase();
  if (!issuer.includes("nck") && !issuer.includes("nursing council of kenya")) return false;
  return !credential.expiresAt || credential.expiresAt.getTime() > now.getTime();
}

export function isActiveGrant(grant: {
  programType?: string | null;
  revokedAt?: Date | null;
  expiresAt?: Date | null;
}, programType: AhaProgramType, now: Date = new Date()): boolean {
  return (
    !grant.revokedAt &&
    (!grant.expiresAt || grant.expiresAt.getTime() > now.getTime()) &&
    (!grant.programType || grant.programType === programType)
  );
}

async function hasActiveAdminGrant(
  db: AhaAccessDb,
  userId: number,
  programType: AhaProgramType,
  now: Date,
): Promise<boolean> {
  try {
    const rows = await db
      .select({
        programType: ahaAccessGrants.programType,
        revokedAt: ahaAccessGrants.revokedAt,
        expiresAt: ahaAccessGrants.expiresAt,
      })
      .from(ahaAccessGrants)
      .where(
        and(
          eq(ahaAccessGrants.userId, userId),
          isNull(ahaAccessGrants.revokedAt),
          or(isNull(ahaAccessGrants.expiresAt), gt(ahaAccessGrants.expiresAt, now)),
          or(isNull(ahaAccessGrants.programType), eq(ahaAccessGrants.programType, programType)),
        ),
      )
      .limit(1);
    return rows.some((row) => isActiveGrant(row, programType, now));
  } catch (error) {
    if (isMissingTableError(error, "ahaAccessGrants")) return false;
    throw error;
  }
}

export async function hasVerifiedNckLicence(db: AhaAccessDb, userId: number, now: Date = new Date()): Promise<boolean> {
  const rows = await db
    .select({
      issuer: professionalCredentials.issuer,
      jurisdiction: professionalCredentials.jurisdiction,
      credentialNumber: professionalCredentials.credentialNumber,
      expiresAt: professionalCredentials.expiresAt,
      status: professionalCredentials.status,
    })
    .from(professionalCredentials)
    .where(
      and(
        eq(professionalCredentials.userId, userId),
        eq(professionalCredentials.credentialType, "regulatory_license"),
        eq(professionalCredentials.status, "verified"),
      ),
    );
  return rows.some((row) => isCurrentNckLicence(row, now));
}

async function hasNerpPathway(db: AhaAccessDb, userId: number): Promise<boolean> {
  const rows = await db
    .select({ status: nerpOfferEnrollments.status })
    .from(nerpOfferEnrollments)
    .where(
      and(
        eq(nerpOfferEnrollments.userId, userId),
        inArray(nerpOfferEnrollments.status, ["active", "completed"]),
      ),
    )
    .limit(1);
  return rows.length > 0;
}

async function hasIlspPathway(
  db: AhaAccessDb,
  userId: number,
  programType: AhaProgramType,
): Promise<boolean> {
  if (programType !== "bls" && programType !== "acls") return false;
  const rows = await db
    .select({ id: ilsCredentialRequests.id })
    .from(ilsCredentialRequests)
    .where(
      and(
        eq(ilsCredentialRequests.userId, userId),
        eq(ilsCredentialRequests.credentialType, programType),
        eq(ilsCredentialRequests.status, "approved"),
      ),
    )
    .limit(1);
  return rows.length > 0;
}

async function hasIndependentPayment(
  db: AhaAccessDb,
  userId: number,
  programType: AhaProgramType,
): Promise<boolean> {
  const requiredKes = getIndependentAhaPriceKes(programType);
  if (requiredKes == null) return false;
  const enrollmentRows = await db
    .select({ id: enrollments.id })
    .from(enrollments)
    .where(
      and(
        eq(enrollments.userId, userId),
        eq(enrollments.programType, programType),
        eq(enrollments.enrollmentStatus, "active"),
      ),
    );
  if (!enrollmentRows.length) return false;
  const enrollmentIds = enrollmentRows.map((row) => row.id);
  const paymentRows = await db
    .select({ amount: payments.amount })
    .from(payments)
    .where(
      and(
        eq(payments.userId, userId),
        inArray(payments.enrollmentId, enrollmentIds),
        eq(payments.status, "completed"),
      ),
    );
  const paidKes = paymentRows.reduce((total, row) => total + Number(row.amount ?? 0), 0);
  return paidKes >= requiredKes;
}

/**
 * The one server-side entitlement decision for every AHA cognitive path.
 * Existing progress is preserved, but it cannot be read or continued without
 * a cohort, an approved ILSP add-on, full independent payment, or an audited
 * administrator grant.
 */
export async function getAhaAccessDecision(
  db: AhaAccessDb,
  userId: number,
  programType: string,
  now: Date = new Date(),
): Promise<AhaAccessDecision> {
  if (!isAhaProgramType(programType)) {
    return blocked("This course is not an AHA programme supported by the access gate.");
  }

  if (await hasActiveAdminGrant(db, userId, programType, now)) {
    return allowed("admin_grant", "Access granted by an authorised Paeds Resus administrator.");
  }

  let ierpBlockMessage: string | null = null;
  if (programType === "bls" || programType === "acls") {
    const ierpPayment = await getIerpPaymentAccessForUser(db, userId);
    if (ierpPayment) {
      const internProfile = await getIerpInternProfile(db, userId);
      if (!isIerpInternProfileReady(internProfile)) {
        ierpBlockMessage = "Complete your Intern profile and submit your MoH deployment/posting letter before accessing IERP.";
      } else if (!ierpPayment.cognitiveAccessLocked) {
        return allowed("ierp", "Access granted through the IERP pathway.");
      } else {
        ierpBlockMessage = "IERP cognitive access is locked until the full KES 15,000 programme fee is paid.";
      }
    }
  }

  if ((await hasNerpPathway(db, userId)) && (await hasVerifiedNckLicence(db, userId, now))) {
    return allowed("nerp", "Access granted through the NERP pathway.");
  }

  if (await hasIlspPathway(db, userId, programType)) {
    return allowed("ilsp", "Access granted through the approved ILSP AHA pathway.");
  }

  if (await hasIndependentPayment(db, userId, programType)) {
    return allowed("independent", `Access granted through the ${INDEPENDENT_AHA_PATHWAY_LABEL}.`);
  }

  const label = AHA_PROGRAM_LABELS[programType];
  const price = getIndependentAhaPriceKes(programType);
  const priceMessage = price ? ` Complete the KES ${price.toLocaleString()} ${label} payment.` : "";
  if (ierpBlockMessage && (programType === "bls" || programType === "acls")) {
    return blocked(`${ierpBlockMessage} You may instead choose NERP, ILSP, an administrator grant, or the ${INDEPENDENT_AHA_PATHWAY_LABEL}.${priceMessage}`);
  }
  if (programType === "bls" || programType === "acls") {
    return blocked(`Choose NERP, IERP, ILSP, or the ${INDEPENDENT_AHA_PATHWAY_LABEL}.${priceMessage}`);
  }
  return blocked(`Choose an approved cohort, ILSP route, admin grant, or the ${INDEPENDENT_AHA_PATHWAY_LABEL}.${priceMessage}`);
}

export async function assertAhaAccess(
  db: AhaAccessDb,
  userId: number,
  programType: string,
): Promise<AhaAccessDecision & { allowed: true }> {
  const decision = await getAhaAccessDecision(db, userId, programType);
  if (!decision.allowed) {
    const { TRPCError } = await import("@trpc/server");
    throw new TRPCError({ code: "FORBIDDEN", message: decision.message });
  }
  return decision;
}
