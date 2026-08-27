import { TRPCError } from "@trpc/server";
import { and, eq, or } from "drizzle-orm";
import { institutionAccountScopes } from "../../drizzle/schema";
import type { User } from "../../drizzle/schema";
import type { AppDb } from "./institution-access";
import { isInstitutionAdmin } from "./institution-access";
import { isMissingTableError } from "./is-missing-db-table";

export type InstitutionAccountScopeKey =
  | "account_admin"
  | "finance_officer"
  | "qi_reviewer"
  | "accreditation_reviewer"
  | "report_viewer"
  | "credential_manager";

export type InstitutionAccountScopeStatus = "invited" | "active" | "suspended" | "ended";

export const INSTITUTION_ACCOUNT_SCOPE_DEFINITIONS: ReadonlyArray<{
  scopeKey: InstitutionAccountScopeKey;
  label: string;
  description: string;
}> = [
  { scopeKey: "account_admin", label: "Account administrator", description: "Manages institution profile, people, access, recovery, and account continuity." },
  { scopeKey: "finance_officer", label: "Finance officer", description: "Reviews quotations, contracts, payment references, and renewal evidence." },
  { scopeKey: "qi_reviewer", label: "QI reviewer", description: "Reviews facility quality-improvement signals and source-linked action records." },
  { scopeKey: "accreditation_reviewer", label: "Accreditation reviewer", description: "Reviews readiness evidence, audit packs, and governance documentation." },
  { scopeKey: "report_viewer", label: "Report viewer", description: "Views institution-level reports without changing operational records." },
  { scopeKey: "credential_manager", label: "Credential and compliance manager", description: "Reviews institution-scoped licence and Life Support credential status without granting unrestricted operational access." },
];

export function isKnownInstitutionAccountScope(value: string): value is InstitutionAccountScopeKey {
  return INSTITUTION_ACCOUNT_SCOPE_DEFINITIONS.some((definition) => definition.scopeKey === value);
}

export function selectMatchingInstitutionScope(
  rows: Array<{ scopeKey: string; scopeStatus: string; userId: number | null; invitedEmail: string }>,
  user: { userId: number; email?: string | null },
  requiredScopes: readonly InstitutionAccountScopeKey[],
): InstitutionAccountScopeKey | undefined {
  const email = user.email?.trim().toLowerCase();
  const match = rows.find((row) =>
    row.scopeStatus === "active" &&
    (row.userId === user.userId || (email != null && row.invitedEmail.toLowerCase() === email)) &&
    requiredScopes.includes(row.scopeKey as InstitutionAccountScopeKey),
  );
  return match?.scopeKey as InstitutionAccountScopeKey | undefined;
}

export async function assertInstitutionAccountScope(
  db: AppDb,
  user: Pick<User, "id" | "role" | "email">,
  institutionId: number,
  requiredScopes: readonly InstitutionAccountScopeKey[],
  options?: { allowInstitutionAdmin?: boolean },
): Promise<{ scopeKey: InstitutionAccountScopeKey | "institution_admin" | "legacy_fallback" }> {
  if (user.role === "admin") return { scopeKey: "institution_admin" };
  if (options?.allowInstitutionAdmin && await isInstitutionAdmin(db, user.id, institutionId)) {
    return { scopeKey: "institution_admin" };
  }

  try {
    const email = user.email?.trim().toLowerCase();
    const identityPredicate = email
      ? or(eq(institutionAccountScopes.userId, user.id), eq(institutionAccountScopes.invitedEmail, email))
      : eq(institutionAccountScopes.userId, user.id);
    const rows = await db
      .select({
        scopeKey: institutionAccountScopes.scopeKey,
        scopeStatus: institutionAccountScopes.scopeStatus,
        userId: institutionAccountScopes.userId,
        invitedEmail: institutionAccountScopes.invitedEmail,
      })
      .from(institutionAccountScopes)
      .where(and(
        eq(institutionAccountScopes.institutionalAccountId, institutionId),
        eq(institutionAccountScopes.scopeStatus, "active"),
        identityPredicate,
      ));
    const scopeKey = selectMatchingInstitutionScope(rows, { userId: user.id, email: user.email }, requiredScopes);
    if (!scopeKey) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You do not have the required institutional administrative scope for this operation.",
      });
    }
    return { scopeKey };
  } catch (error) {
    if (isMissingTableError(error)) {
      if (options?.allowInstitutionAdmin && await isInstitutionAdmin(db, user.id, institutionId)) return { scopeKey: "legacy_fallback" };
      throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Institution permission scopes are not available yet. Ask a platform administrator to complete the migration." });
    }
    throw error;
  }
}
