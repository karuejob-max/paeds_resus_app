import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { getCredentialAccess } from "./institution-accountability";
import {
  buildLicenceFollowUp,
  getInstitutionLicenceDeadline,
  getMyLicenceTasks,
  loadStaffLicenceRows,
  remindMissingLicences,
  setLicenceDeadline,
} from "../lib/institution-licence-followup";

async function requireDb() {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed" });
  return db;
}

const institutionInput = z.object({ institutionId: z.number().int().positive() });

export const institutionLicenceFollowupRouter = router({
  /** The signed-in provider's own licence to-do, one entry per institution that needs something. */
  myTasks: protectedProcedure.query(async ({ ctx }) => {
    const db = await requireDb();
    return getMyLicenceTasks(db, ctx.user.id);
  }),

  /** Null when the caller has no credential responsibility here, so the panel can hide itself. */
  summary: protectedProcedure.input(institutionInput).query(async ({ ctx, input }) => {
    const db = await requireDb();
    let access;
    try {
      access = await getCredentialAccess(db, ctx.user, input.institutionId);
    } catch (error) {
      if (error instanceof TRPCError && error.code === "FORBIDDEN") return null;
      throw error;
    }
    const deadline = await getInstitutionLicenceDeadline(db, input.institutionId);
    const rows = await loadStaffLicenceRows(db, input.institutionId, access.departmentIds);
    const { counts, people } = buildLicenceFollowUp(rows, deadline);
    return {
      role: access.role,
      canSetDeadline: access.role === "institution_admin",
      deadline,
      counts,
      people: people
        .filter((person) => person.mustAct || person.identityMissing || person.state === "expiring" || person.state === "pending_review")
        .sort((a, b) => Number(b.overdue) - Number(a.overdue) || a.name.localeCompare(b.name))
        .slice(0, 300),
    };
  }),

  setDeadline: protectedProcedure
    .input(institutionInput.extend({ deadline: z.coerce.date().nullable(), notifyStaff: z.boolean().default(true) }))
    .mutation(async ({ ctx, input }) => {
      const db = await requireDb();
      const access = await getCredentialAccess(db, ctx.user, input.institutionId);
      if (access.role !== "institution_admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only an institution administrator can set the licence deadline." });
      }
      return setLicenceDeadline(db, { institutionId: input.institutionId, actorUserId: ctx.user.id, deadline: input.deadline, notifyStaff: input.notifyStaff });
    }),

  remindMissing: protectedProcedure.input(institutionInput).mutation(async ({ ctx, input }) => {
    const db = await requireDb();
    const access = await getCredentialAccess(db, ctx.user, input.institutionId);
    return remindMissingLicences(db, { institutionId: input.institutionId, departmentIds: access.departmentIds });
  }),
});
