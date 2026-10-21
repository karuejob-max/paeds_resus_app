import { and, eq, or } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { institutionDepartmentHeads, type User } from "../../drizzle/schema";
import { isInstitutionAdmin, type AppDb } from "./institution-access";

export type IlsAuthority =
  | { scope: "institution"; departmentIds: null }
  | { scope: "department"; departmentIds: number[] };

/** Resolve ILSP management scope without trusting client-supplied department data. */
export async function resolveIlsAuthority(
  db: AppDb,
  user: Pick<User, "id" | "role">,
  institutionId: number
): Promise<IlsAuthority> {
  if (
    user.role === "admin" ||
    (await isInstitutionAdmin(db, user.id, institutionId))
  ) {
    return { scope: "institution", departmentIds: null };
  }

  const rows = await db
    .select({ departmentId: institutionDepartmentHeads.departmentId })
    .from(institutionDepartmentHeads)
    .where(
      and(
        eq(institutionDepartmentHeads.institutionalAccountId, institutionId),
        eq(institutionDepartmentHeads.assignmentStatus, "active"),
        or(
          eq(institutionDepartmentHeads.userId, user.id),
          and(
            eq(institutionDepartmentHeads.deputyUserId, user.id),
            eq(institutionDepartmentHeads.deputyAssignmentStatus, "active")
          )
        )
      )
    );

  const departmentIds = Array.from(new Set(rows.map(row => row.departmentId)));
  if (!departmentIds.length) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message:
        "You do not have an active ILSP management appointment for this institution.",
    });
  }
  return { scope: "department", departmentIds };
}

export function assertIlsDepartmentSelection(
  authority: IlsAuthority,
  requestedDepartmentId?: number
): number | null {
  if (authority.scope === "institution") return requestedDepartmentId ?? null;
  if (requestedDepartmentId != null) {
    if (!authority.departmentIds.includes(requestedDepartmentId)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message:
          "You cannot manage ILSP learners outside your assigned department.",
      });
    }
    return requestedDepartmentId;
  }
  if (authority.departmentIds.length === 1) return authority.departmentIds[0];
  throw new TRPCError({
    code: "BAD_REQUEST",
    message:
      "Select which of your assigned departments this ILSP action applies to.",
  });
}
