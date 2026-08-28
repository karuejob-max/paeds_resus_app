import { TRPCError } from "@trpc/server";
import { and, desc, eq } from "drizzle-orm";
import { professionalCredentials } from "../../drizzle/schema";
import type { getDb } from "../db";

type DbClient = NonNullable<Awaited<ReturnType<typeof getDb>>>;

type ClinicalLicenceRow = {
  status: string;
  credentialNumber: string | null;
  issuedAt: Date | null;
  expiresAt: Date | null;
};

export type ClinicalLicenceDecision =
  | { allowed: true; reason: null }
  | {
      allowed: false;
      reason:
        | "missing"
        | "unverified"
        | "missing_number"
        | "missing_dates"
        | "future_issue_date"
        | "expired";
    };

/**
 * ERT is a patient-safety responsibility, not merely an institutional role.
 * A provider may accept/use a clinical duty only with one current verified
 * regulatory licence carrying a number, issue date, and future Valid until.
 */
export function evaluateClinicalLicenceRows(
  rows: ClinicalLicenceRow[],
  now: Date = new Date(),
): ClinicalLicenceDecision {
  if (rows.length === 0) return { allowed: false, reason: "missing" };

  const verified = rows.find(row => row.status === "verified");
  if (!verified) return { allowed: false, reason: "unverified" };
  if (!verified.credentialNumber?.trim()) {
    return { allowed: false, reason: "missing_number" };
  }
  if (!verified.issuedAt || !verified.expiresAt) {
    return { allowed: false, reason: "missing_dates" };
  }
  if (verified.issuedAt.getTime() > now.getTime()) {
    return { allowed: false, reason: "future_issue_date" };
  }
  if (verified.expiresAt.getTime() <= now.getTime()) {
    return { allowed: false, reason: "expired" };
  }
  return { allowed: true, reason: null };
}

export function clinicalLicenceBlockMessage(reason: Exclude<ClinicalLicenceDecision, { allowed: true }>["reason"]): string {
  switch (reason) {
    case "missing":
      return "Add your regulatory Licence number and evidence under Professional Credentials before accepting an ERT clinical responsibility.";
    case "unverified":
      return "Your regulatory licence must be verified under Professional Credentials before accepting an ERT clinical responsibility.";
    case "missing_number":
      return "Your verified regulatory licence must include a Licence number before accepting an ERT clinical responsibility.";
    case "missing_dates":
      return "Add both Issue date and Valid until to your regulatory licence before accepting an ERT clinical responsibility.";
    case "future_issue_date":
      return "Your licence Issue date cannot be in the future. Correct it under Professional Credentials before accepting an ERT clinical responsibility.";
    case "expired":
      return "Your regulatory licence is expired. Renew and submit current evidence before accepting or using an ERT clinical responsibility.";
  }
}

export async function getClinicalLicenceDecision(
  db: DbClient,
  userId: number,
  now: Date = new Date(),
): Promise<ClinicalLicenceDecision> {
  const rows = await db
    .select({
      status: professionalCredentials.status,
      credentialNumber: professionalCredentials.credentialNumber,
      issuedAt: professionalCredentials.issuedAt,
      expiresAt: professionalCredentials.expiresAt,
    })
    .from(professionalCredentials)
    .where(
      and(
        eq(professionalCredentials.userId, userId),
        eq(professionalCredentials.credentialType, "regulatory_license"),
      ),
    )
    .orderBy(desc(professionalCredentials.updatedAt));
  return evaluateClinicalLicenceRows(rows, now);
}

export async function assertCurrentClinicalLicence(
  db: DbClient,
  userId: number,
  now: Date = new Date(),
): Promise<void> {
  const decision = await getClinicalLicenceDecision(db, userId, now);
  if (!decision.allowed) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: clinicalLicenceBlockMessage(decision.reason),
    });
  }
}
