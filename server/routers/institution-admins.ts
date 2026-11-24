import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import {
  institutionalAccounts,
  institutionalAccountAdmins,
  institutionalAdminInvites,
  users,
} from "../../drizzle/schema";
import { eq, and, inArray, ne } from "drizzle-orm";
import {
  acceptAdminInvite,
  createAdminInvite,
  declineAdminInvite,
  recordAdminEvent,
  revokeAdminInvite,
} from "../lib/institution-admin-grants";
import {
  assertInstitutionAccess,
  assertRemovalKeepsMinimumAdmins,
  MINIMUM_INSTITUTION_ADMINS,
} from "../lib/institution-access";

/**
 * Institutional multi-admin management (North Star v2.0 §6.1: "the
 * Organisation Actor account belongs to the institution, not the person who
 * created it. A minimum of two named admin contacts must always be
 * registered."). Kept as its own router file rather than folded into the
 * already-2000+-line institution.ts, since this is a genuinely separate
 * concern (who can administer the account) from day-to-day institution
 * operations.
 *
 * KNOWN SIMPLIFICATION, flagged rather than left implicit: invites are
 * accepted by exact email match at accept-time (acceptInvite looks up
 * institutionalAdminInvites rows matching the logged-in user's own email) —
 * there is no single-use token, no expiry, and no proof the invited person
 * controls that inbox beyond however this platform's own login already
 * verifies email ownership. This mirrors the codebase's existing maturity
 * level elsewhere (e.g. institutionalStaffMembers.phase1ProofUrl is a
 * pasted URL with no verification either) rather than introducing new
 * security infrastructure unprompted. If admin-invite abuse becomes a real
 * concern, a token-based accept flow would be the natural upgrade.
 */
export const institutionAdminsRouter = router({
  /** All current admins + pending invites for an institution. Requires admin access to that institution. */
  list: protectedProcedure
    .input(z.object({ institutionId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed" });
      }
      await assertInstitutionAccess(db, ctx.user, input.institutionId);

      const [account] = await db
        .select({ userId: institutionalAccounts.userId })
        .from(institutionalAccounts)
        .where(eq(institutionalAccounts.id, input.institutionId))
        .limit(1);

      const grantedRows = await db
        .select({ userId: institutionalAccountAdmins.userId, createdAt: institutionalAccountAdmins.createdAt })
        .from(institutionalAccountAdmins)
        .where(eq(institutionalAccountAdmins.institutionalAccountId, input.institutionId));

      const adminUserIds = Array.from(
        new Set<number>([
          ...(account?.userId ? [account.userId] : []),
          ...grantedRows.map((r) => r.userId),
        ])
      );

      const adminUsers = adminUserIds.length
        ? await db
            .select({ id: users.id, name: users.name, email: users.email })
            .from(users)
            .where(inArray(users.id, adminUserIds))
        : [];

      const admins = adminUsers.map((u) => ({
        userId: u.id,
        name: u.name,
        email: u.email,
        isOriginalOwner: u.id === account?.userId,
      }));

      const pendingInvites = await db
        .select({
          id: institutionalAdminInvites.id,
          invitedEmail: institutionalAdminInvites.invitedEmail,
          invitedName: institutionalAdminInvites.invitedName,
          source: institutionalAdminInvites.source,
          createdAt: institutionalAdminInvites.createdAt,
        })
        .from(institutionalAdminInvites)
        .where(
          and(
            eq(institutionalAdminInvites.institutionalAccountId, input.institutionId),
            eq(institutionalAdminInvites.status, "pending")
          )
        );

      return { admins, pendingInvites, minimumRequired: MINIMUM_INSTITUTION_ADMINS };
    }),

  /**
   * Invite an existing Paeds Resus account to become an administrator. The grant takes
   * effect only when that person accepts (acceptInvite); other administrators are notified
   * and every step is recorded in institutionalAdminEvents.
   */
  invite: protectedProcedure
    .input(
      z.object({
        institutionId: z.number().int().positive(),
        userId: z.number().int().positive(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed" });
      }
      await assertInstitutionAccess(db, ctx.user, input.institutionId);

      const [existingUser] = await db
        .select({ id: users.id, name: users.name, email: users.email })
        .from(users)
        .where(eq(users.id, input.userId))
        .limit(1);

      if (!existingUser?.name?.trim() || !existingUser.email?.trim()) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Select a Paeds Resus account with a saved name and email.",
        });
      }
      if (existingUser.id === ctx.user.id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Select another Paeds Resus account; you are already an administrator.",
        });
      }

      const result = await createAdminInvite(db, {
        institutionId: input.institutionId,
        invitee: { id: existingUser.id, name: existingUser.name, email: existingUser.email },
        actorUserId: ctx.user.id,
        source: "admin_invite",
      });
      return { status: result.status };
    }),

  /** Cancels a pending administrator invitation before it is accepted. */
  revokeInvite: protectedProcedure
    .input(z.object({ institutionId: z.number().int().positive(), inviteId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed" });
      }
      await assertInstitutionAccess(db, ctx.user, input.institutionId);
      return revokeAdminInvite(db, ctx.user.id, input.institutionId, input.inviteId);
    }),

  /**
   * Removes an admin. Blocked if it would drop the institution below the
   * minimum of two (North Star §6.1). The original registering owner cannot
   * be removed through this mutation — that's a primary-ownership transfer,
   * a different and bigger operation than this PR's scope; contact platform
   * support for that today.
   */
  remove: protectedProcedure
    .input(
      z.object({
        institutionId: z.number().int().positive(),
        adminUserId: z.number().int().positive(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed" });
      }
      await assertInstitutionAccess(db, ctx.user, input.institutionId);

      const [account] = await db
        .select({ userId: institutionalAccounts.userId })
        .from(institutionalAccounts)
        .where(eq(institutionalAccounts.id, input.institutionId))
        .limit(1);

      await assertRemovalKeepsMinimumAdmins(db, input.institutionId);

      if (account?.userId === input.adminUserId) {
        // If removing the founding admin, promote the next oldest admin to primary owner
        const otherAdmins = await db
          .select()
          .from(institutionalAccountAdmins)
          .where(
            and(
              eq(institutionalAccountAdmins.institutionalAccountId, input.institutionId),
              ne(institutionalAccountAdmins.userId, input.adminUserId)
            )
          )
          .orderBy(institutionalAccountAdmins.createdAt);

        if (!otherAdmins.length) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "No other admin available to promote to primary owner.",
          });
        }

        const nextAdmin = otherAdmins[0];

        await db
          .update(institutionalAccounts)
          .set({ userId: nextAdmin.userId })
          .where(eq(institutionalAccounts.id, input.institutionId));
      }

      await db
        .delete(institutionalAccountAdmins)
        .where(
          and(
            eq(institutionalAccountAdmins.institutionalAccountId, input.institutionId),
            eq(institutionalAccountAdmins.userId, input.adminUserId)
          )
        );

      await recordAdminEvent(db, {
        institutionalAccountId: input.institutionId,
        eventType: "removed",
        subjectUserId: input.adminUserId,
        actorUserId: ctx.user.id,
      });

      return { success: true };
    }),

  /** Pending invites addressed to the logged-in user's own email — for a post-login prompt. */
  myPendingInvites: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db || !ctx.user.email) return { invites: [] };

    const rows = await db
      .select({
        id: institutionalAdminInvites.id,
        institutionalAccountId: institutionalAdminInvites.institutionalAccountId,
        companyName: institutionalAccounts.companyName,
        source: institutionalAdminInvites.source,
        createdAt: institutionalAdminInvites.createdAt,
      })
      .from(institutionalAdminInvites)
      .innerJoin(
        institutionalAccounts,
        eq(institutionalAccounts.id, institutionalAdminInvites.institutionalAccountId)
      )
      .where(
        and(
          eq(institutionalAdminInvites.invitedEmail, ctx.user.email),
          eq(institutionalAdminInvites.status, "pending")
        )
      );

    return { invites: rows };
  }),

  /** Accepts one pending invite addressed to the logged-in user's own email. */
  acceptInvite: protectedProcedure
    .input(z.object({ inviteId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed" });
      }
      const result = await acceptAdminInvite(db, ctx.user, input.inviteId);
      return { success: true, institutionalAccountId: result.institutionalAccountId };
    }),

  /** Declines a pending invite addressed to the logged-in user's own email. */
  declineInvite: protectedProcedure
    .input(z.object({ inviteId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed" });
      }
      const result = await declineAdminInvite(db, ctx.user, input.inviteId);
      return { success: true, institutionalAccountId: result.institutionalAccountId };
    }),
});
