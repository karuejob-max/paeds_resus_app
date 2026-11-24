import { and, eq, ne } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import type { getDb } from "../db";
import {
  inAppNotifications,
  institutionalAccountAdmins,
  institutionalAccounts,
  institutionalAdminEvents,
  institutionalAdminInvites,
} from "../../drizzle/schema";

type Db = NonNullable<Awaited<ReturnType<typeof getDb>>>;

export type AdminEventType =
  | "invited"
  | "accepted"
  | "declined"
  | "revoked"
  | "removed"
  | "owner_transferred";

/**
 * Administrator grants are invitations. A live administrator naming an account (or the
 * registering user naming the second administrator) must not be able to make someone an
 * administrator without that person's acceptance. Every step is recorded in
 * institutionalAdminEvents and the other administrators are told.
 */
export async function recordAdminEvent(
  db: Db,
  event: {
    institutionalAccountId: number;
    eventType: AdminEventType;
    subjectUserId?: number | null;
    subjectEmail?: string | null;
    actorUserId?: number | null;
    inviteId?: number | null;
    note?: string | null;
  },
) {
  await db.insert(institutionalAdminEvents).values({
    institutionalAccountId: event.institutionalAccountId,
    eventType: event.eventType,
    subjectUserId: event.subjectUserId ?? null,
    subjectEmail: event.subjectEmail ?? null,
    actorUserId: event.actorUserId ?? null,
    inviteId: event.inviteId ?? null,
    note: event.note ?? null,
  });
}

export async function getInstitutionAdminUserIds(db: Db, institutionId: number): Promise<number[]> {
  const [account] = await db
    .select({ ownerUserId: institutionalAccounts.userId })
    .from(institutionalAccounts)
    .where(eq(institutionalAccounts.id, institutionId))
    .limit(1);
  const rows = await db
    .select({ userId: institutionalAccountAdmins.userId })
    .from(institutionalAccountAdmins)
    .where(eq(institutionalAccountAdmins.institutionalAccountId, institutionId));
  return Array.from(
    new Set([account?.ownerUserId, ...rows.map((r) => r.userId)].filter((id): id is number => id != null && id > 0)),
  );
}

export async function notifyUsers(
  db: Db,
  userIds: number[],
  note: { title: string; body: string; relatedId: number; actionUrl: string },
) {
  const unique = Array.from(new Set(userIds.filter((id) => id > 0)));
  if (unique.length === 0) return;
  try {
    await db.insert(inAppNotifications).values(
      unique.map((userId) => ({ userId, type: "institution_admin", ...note })),
    );
  } catch (error) {
    // The grant record is the source of truth; a failed notification must not undo it.
    console.error("[institution-admin-grants] notification failed", error);
  }
}

export async function companyName(db: Db, institutionId: number) {
  const [account] = await db
    .select({ companyName: institutionalAccounts.companyName })
    .from(institutionalAccounts)
    .where(eq(institutionalAccounts.id, institutionId))
    .limit(1);
  return account?.companyName ?? "the institution";
}

export async function createAdminInvite(
  db: Db,
  input: {
    institutionId: number;
    invitee: { id: number; name: string; email: string };
    actorUserId: number;
    source: "registration" | "admin_invite";
  },
): Promise<{ status: "invited" | "already_invited" | "already_admin"; inviteId: number | null }> {
  const email = input.invitee.email.trim().toLowerCase();

  const [alreadyAdmin] = await db
    .select({ id: institutionalAccountAdmins.id })
    .from(institutionalAccountAdmins)
    .where(and(
      eq(institutionalAccountAdmins.institutionalAccountId, input.institutionId),
      eq(institutionalAccountAdmins.userId, input.invitee.id),
    ))
    .limit(1);
  if (alreadyAdmin) return { status: "already_admin", inviteId: null };

  const [pending] = await db
    .select({ id: institutionalAdminInvites.id })
    .from(institutionalAdminInvites)
    .where(and(
      eq(institutionalAdminInvites.institutionalAccountId, input.institutionId),
      eq(institutionalAdminInvites.invitedEmail, email),
      eq(institutionalAdminInvites.status, "pending"),
    ))
    .limit(1);
  if (pending) return { status: "already_invited", inviteId: pending.id };

  const [inserted] = await db.insert(institutionalAdminInvites).values({
    institutionalAccountId: input.institutionId,
    invitedEmail: email,
    invitedName: input.invitee.name,
    invitedByUserId: input.actorUserId,
    source: input.source,
    status: "pending",
  });
  const inviteId = Number((inserted as unknown as { insertId?: number }).insertId);
  if (!Number.isFinite(inviteId) || inviteId <= 0) {
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Could not record the administrator invitation." });
  }

  await recordAdminEvent(db, {
    institutionalAccountId: input.institutionId,
    eventType: "invited",
    subjectUserId: input.invitee.id,
    subjectEmail: email,
    actorUserId: input.actorUserId,
    inviteId,
    note: input.source === "registration" ? "Named as second administrator at registration." : "Invited by an administrator.",
  });

  const name = await companyName(db, input.institutionId);
  await notifyUsers(db, [input.invitee.id], {
    title: `Invitation to administer ${name}`,
    body: "You have been invited to become an administrator. Review and accept or decline; nothing changes until you accept.",
    relatedId: inviteId,
    actionUrl: "/institution",
  });
  const others = (await getInstitutionAdminUserIds(db, input.institutionId)).filter(
    (id) => id !== input.actorUserId && id !== input.invitee.id,
  );
  await notifyUsers(db, others, {
    title: "Administrator invitation sent",
    body: `${input.invitee.name || email} was invited to become an administrator of ${name}.`,
    relatedId: inviteId,
    actionUrl: "/institution",
  });
  return { status: "invited", inviteId };
}

async function findPendingInviteForUser(db: Db, user: { email?: string | null }, inviteId: number) {
  if (!user.email) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Your account has no email on file to match this invite." });
  }
  const [invite] = await db
    .select()
    .from(institutionalAdminInvites)
    .where(and(
      eq(institutionalAdminInvites.id, inviteId),
      eq(institutionalAdminInvites.invitedEmail, user.email),
      eq(institutionalAdminInvites.status, "pending"),
    ))
    .limit(1);
  if (!invite) throw new TRPCError({ code: "NOT_FOUND", message: "No matching pending invite found." });
  return invite;
}

/** Days a recovery grant waits so the institution's current administrators can object. */
export const RECOVERY_COOLING_OFF_DAYS = 7;

export function recoveryEffectiveAt(createdAt: Date | string | null | undefined): Date {
  const start = createdAt ? new Date(createdAt) : new Date();
  return new Date(start.getTime() + RECOVERY_COOLING_OFF_DAYS * 24 * 60 * 60 * 1000);
}

/**
 * Raised by a platform-admin-approved recovery request. Nothing changes for the current
 * administrators now: the claimant gets a pending grant that can be accepted only after the
 * cooling-off period, and every current administrator is told so they can revoke it.
 */
export async function createRecoveryGrant(
  db: Db,
  input: {
    institutionId: number;
    requester: { name: string; email: string; phone?: string | null };
    reviewerUserId: number;
    requestId: number;
  },
): Promise<{ inviteId: number; effectiveAt: Date }> {
  const email = input.requester.email.trim().toLowerCase();
  await db
    .update(institutionalAdminInvites)
    .set({ status: "revoked" })
    .where(and(
      eq(institutionalAdminInvites.institutionalAccountId, input.institutionId),
      eq(institutionalAdminInvites.invitedEmail, email),
      eq(institutionalAdminInvites.source, "recovery_approval"),
      eq(institutionalAdminInvites.status, "pending"),
    ));
  const [inserted] = await db.insert(institutionalAdminInvites).values({
    institutionalAccountId: input.institutionId,
    invitedEmail: email,
    invitedName: input.requester.name,
    invitedPhone: input.requester.phone ?? null,
    invitedByUserId: null,
    source: "recovery_approval",
    status: "pending",
  });
  const inviteId = Number((inserted as unknown as { insertId?: number }).insertId);
  if (!Number.isFinite(inviteId) || inviteId <= 0) {
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Could not record the recovery grant." });
  }
  const effectiveAt = recoveryEffectiveAt(new Date());
  await recordAdminEvent(db, {
    institutionalAccountId: input.institutionId,
    eventType: "invited",
    subjectEmail: email,
    actorUserId: input.reviewerUserId,
    inviteId,
    note: `Recovery request #${input.requestId} approved by a platform administrator. Can be accepted from ${effectiveAt.toISOString().slice(0, 10)}.`,
  });
  const name = await companyName(db, input.institutionId);
  const current = await getInstitutionAdminUserIds(db, input.institutionId);
  await notifyUsers(db, current, {
    title: `Recovery requested for ${name}`,
    body: `${input.requester.name} (${email}) asked to take over administration of ${name} and a platform administrator approved it. It takes effect on ${effectiveAt.toISOString().slice(0, 10)} unless you revoke it under Administrators. If you did not expect this, revoke it now.`,
    relatedId: inviteId,
    actionUrl: "/institution",
  });
  return { inviteId, effectiveAt };
}

export async function acceptAdminInvite(db: Db, user: { id: number; email?: string | null }, inviteId: number) {
  const invite = await findPendingInviteForUser(db, user, inviteId);
  if (invite.source === "recovery_approval") {
    const effectiveAt = recoveryEffectiveAt((invite as { createdAt?: Date | null }).createdAt);
    if (Date.now() < effectiveAt.getTime()) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: `This recovery grant can be accepted from ${effectiveAt.toISOString().slice(0, 10)}. Current administrators have been told and can object until then.`,
      });
    }
  }

  const [alreadyAdmin] = await db
    .select({ id: institutionalAccountAdmins.id })
    .from(institutionalAccountAdmins)
    .where(and(
      eq(institutionalAccountAdmins.institutionalAccountId, invite.institutionalAccountId),
      eq(institutionalAccountAdmins.userId, user.id),
    ))
    .limit(1);
  if (!alreadyAdmin) {
    await db.insert(institutionalAccountAdmins).values({
      institutionalAccountId: invite.institutionalAccountId,
      userId: user.id,
      addedByUserId: invite.invitedByUserId,
    });
  }
  if (invite.source === "recovery_approval") {
    // Only now, with the claimant's own acceptance, do the former administrators step aside.
    const former = (await getInstitutionAdminUserIds(db, invite.institutionalAccountId)).filter((id) => id !== user.id);
    await db
      .update(institutionalAccounts)
      .set({ userId: user.id })
      .where(eq(institutionalAccounts.id, invite.institutionalAccountId));
    await db
      .delete(institutionalAccountAdmins)
      .where(and(
        eq(institutionalAccountAdmins.institutionalAccountId, invite.institutionalAccountId),
        ne(institutionalAccountAdmins.userId, user.id),
      ));
    for (const formerId of former) {
      await recordAdminEvent(db, {
        institutionalAccountId: invite.institutionalAccountId,
        eventType: "removed",
        subjectUserId: formerId,
        actorUserId: user.id,
        inviteId: invite.id,
        note: "Replaced by an approved recovery.",
      });
    }
    const recoveredName = await companyName(db, invite.institutionalAccountId);
    await notifyUsers(db, former, {
      title: "Administrator access ended",
      body: `Administration of ${recoveredName} was transferred through an approved recovery request. Contact support if this is a mistake.`,
      relatedId: invite.id,
      actionUrl: "/institution",
    });
  }
  await db
    .update(institutionalAdminInvites)
    .set({ status: "accepted", acceptedAt: new Date() })
    .where(and(eq(institutionalAdminInvites.id, invite.id), eq(institutionalAdminInvites.status, "pending")));

  await recordAdminEvent(db, {
    institutionalAccountId: invite.institutionalAccountId,
    eventType: invite.source === "recovery_approval" ? "owner_transferred" : "accepted",
    subjectUserId: user.id,
    subjectEmail: invite.invitedEmail,
    actorUserId: user.id,
    inviteId: invite.id,
    note: invite.source === "recovery_approval" ? "Accepted an approved recovery grant." : "Invitation accepted.",
  });
  const name = await companyName(db, invite.institutionalAccountId);
  const others = (await getInstitutionAdminUserIds(db, invite.institutionalAccountId)).filter((id) => id !== user.id);
  await notifyUsers(db, others, {
    title: "Administrator invitation accepted",
    body: `${invite.invitedName || invite.invitedEmail} is now an administrator of ${name}.`,
    relatedId: invite.id,
    actionUrl: "/institution",
  });
  return { institutionalAccountId: invite.institutionalAccountId };
}

export async function declineAdminInvite(db: Db, user: { id: number; email?: string | null }, inviteId: number) {
  const invite = await findPendingInviteForUser(db, user, inviteId);
  await db
    .update(institutionalAdminInvites)
    .set({ status: "declined" })
    .where(and(eq(institutionalAdminInvites.id, invite.id), eq(institutionalAdminInvites.status, "pending")));
  await recordAdminEvent(db, {
    institutionalAccountId: invite.institutionalAccountId,
    eventType: "declined",
    subjectUserId: user.id,
    subjectEmail: invite.invitedEmail,
    actorUserId: user.id,
    inviteId: invite.id,
  });
  const name = await companyName(db, invite.institutionalAccountId);
  const others = (await getInstitutionAdminUserIds(db, invite.institutionalAccountId)).filter((id) => id !== user.id);
  await notifyUsers(db, others, {
    title: "Administrator invitation declined",
    body: `${invite.invitedName || invite.invitedEmail} declined to become an administrator of ${name}.`,
    relatedId: invite.id,
    actionUrl: "/institution",
  });
  return { institutionalAccountId: invite.institutionalAccountId };
}

export async function revokeAdminInvite(db: Db, actorUserId: number, institutionId: number, inviteId: number) {
  const [invite] = await db
    .select()
    .from(institutionalAdminInvites)
    .where(and(
      eq(institutionalAdminInvites.id, inviteId),
      eq(institutionalAdminInvites.institutionalAccountId, institutionId),
      eq(institutionalAdminInvites.status, "pending"),
    ))
    .limit(1);
  if (!invite) throw new TRPCError({ code: "NOT_FOUND", message: "No matching pending invite found." });
  await db
    .update(institutionalAdminInvites)
    .set({ status: "revoked" })
    .where(and(eq(institutionalAdminInvites.id, invite.id), eq(institutionalAdminInvites.status, "pending")));
  await recordAdminEvent(db, {
    institutionalAccountId: institutionId,
    eventType: "revoked",
    subjectEmail: invite.invitedEmail,
    actorUserId,
    inviteId: invite.id,
  });
  return { success: true as const };
}

