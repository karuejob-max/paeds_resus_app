import { and, asc, desc, eq, isNull, or } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  careFacilities,
  facilityDepartments,
  facilityMembershipRequests,
  inAppNotifications,
  institutionalAccounts,
  institutionalAccountAdmins,
  institutionalActionLogs,
  institutionalStaffMembers,
  institutionMemberships,
  providerProfiles,
  users,
} from "../../drizzle/schema";
import { getDb } from "../db";
import { assertInstitutionAccess } from "../lib/institution-access";
import { protectedProcedure, router } from "../_core/trpc";

const requestRelationshipSchema = z.literal("permanent_staff");

function normalizeEmail(value: string | null | undefined) {
  return value?.trim().toLowerCase() ?? "";
}

function requireEmail(email: string | null | undefined) {
  const normalized = normalizeEmail(email);
  if (!normalized) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message:
        "Your account needs a verified email before requesting a facility link.",
    });
  }
  return normalized;
}

type StaffRole =
  | "doctor"
  | "nurse"
  | "paramedic"
  | "midwife"
  | "lab_tech"
  | "respiratory_therapist"
  | "support_staff"
  | "other";

function staffRoleFromProviderType(
  providerType: string | null | undefined
): StaffRole {
  switch (providerType) {
    case "doctor":
      return "doctor";
    case "nurse":
      return "nurse";
    case "paramedic":
      return "paramedic";
    case "midwife":
      return "midwife";
    case "lab_tech":
      return "lab_tech";
    case "respiratory_therapist":
      return "respiratory_therapist";
    case "support_staff":
      return "support_staff";
    default:
      return "other";
  }
}

function requestKey(institutionId: number, userId: number) {
  return `${institutionId}:${userId}`;
}

async function getDbOrThrow() {
  const db = await getDb();
  if (!db)
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Database connection failed",
    });
  return db;
}

async function getCanonicalFacility(
  db: Awaited<ReturnType<typeof getDb>>,
  facilityId: number
) {
  if (!db) return null;
  let currentId = facilityId;
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const [row] = await db
      .select({
        id: careFacilities.id,
        mergedIntoId: careFacilities.mergedIntoId,
      })
      .from(careFacilities)
      .where(eq(careFacilities.id, currentId))
      .limit(1);
    if (!row) return null;
    if (!row.mergedIntoId) break;
    currentId = row.mergedIntoId;
  }
  const [facility] = await db
    .select({
      id: careFacilities.id,
      name: careFacilities.name,
      county: careFacilities.county,
      country: careFacilities.country,
      institutionalAccountId: careFacilities.institutionalAccountId,
      isSystem: careFacilities.isSystem,
    })
    .from(careFacilities)
    .where(eq(careFacilities.id, currentId))
    .limit(1);
  return facility ?? null;
}

async function getProviderContext(
  db: Awaited<ReturnType<typeof getDb>>,
  userId: number
) {
  if (!db)
    return {
      department: null as string | null,
      facilityDepartmentId: null as number | null,
    };
  const [profile] = await db
    .select({ department: providerProfiles.department })
    .from(providerProfiles)
    .where(eq(providerProfiles.userId, userId))
    .limit(1);
  return {
    department: profile?.department?.trim() || null,
    facilityDepartmentId: null,
  };
}

async function getAdminUserIds(
  db: Awaited<ReturnType<typeof getDb>>,
  institutionId: number
) {
  if (!db) return [] as number[];
  const [institution] = await db
    .select({ ownerUserId: institutionalAccounts.userId })
    .from(institutionalAccounts)
    .where(eq(institutionalAccounts.id, institutionId))
    .limit(1);
  const admins = await db
    .select({ userId: institutionalAccountAdmins.userId })
    .from(institutionalAccountAdmins)
    .where(
      eq(institutionalAccountAdmins.institutionalAccountId, institutionId)
    );
  return Array.from(
    new Set(
      [institution?.ownerUserId, ...admins.map(row => row.userId)].filter(
        (id): id is number => id != null
      )
    )
  );
}

async function notifyUsers(
  db: Awaited<ReturnType<typeof getDb>>,
  userIds: number[],
  title: string,
  body: string,
  relatedId: number,
  actionUrl: string
) {
  if (!db) return;
  const uniqueIds = Array.from(new Set(userIds.filter(id => id > 0)));
  if (uniqueIds.length === 0) return;
  await db.insert(inAppNotifications).values(
    uniqueIds.map(userId => ({
      userId,
      type: "facility_membership",
      title,
      body,
      relatedId,
      actionUrl,
    }))
  );
}

async function findStaffRow(
  db: Awaited<ReturnType<typeof getDb>>,
  institutionId: number,
  userId: number,
  email: string
) {
  if (!db) return null;
  const rows = await db
    .select()
    .from(institutionalStaffMembers)
    .where(
      and(
        eq(institutionalStaffMembers.institutionalAccountId, institutionId),
        or(
          eq(institutionalStaffMembers.userId, userId),
          eq(institutionalStaffMembers.staffEmail, email)
        )
      )
    )
    .orderBy(desc(institutionalStaffMembers.id))
    .limit(5);
  const conflicting = rows.find(
    row =>
      row.userId != null &&
      row.userId !== userId &&
      normalizeEmail(row.staffEmail) === email
  );
  if (conflicting) {
    throw new TRPCError({
      code: "CONFLICT",
      message:
        "This email is already attached to another provider record in this institution.",
    });
  }
  return (
    rows.find(row => row.userId === userId) ??
    rows.find(row => normalizeEmail(row.staffEmail) === email) ??
    null
  );
}

export async function materializeMembershipAndStaff(
  tx: any,
  input: {
    institutionId: number;
    userId: number;
    email: string;
    name: string;
    phone: string | null;
    providerType: string | null | undefined;
    department: string | null;
    facilityDepartmentId: number | null;
    staffMemberId?: number | null;
  }
) {
  const now = new Date();
  const staffRole = staffRoleFromProviderType(input.providerType);
  let staff = input.staffMemberId
    ? (
        await tx
          .select()
          .from(institutionalStaffMembers)
          .where(
            and(
              eq(institutionalStaffMembers.id, input.staffMemberId),
              eq(
                institutionalStaffMembers.institutionalAccountId,
                input.institutionId
              )
            )
          )
          .limit(1)
      )[0]
    : undefined;
  if (!staff) {
    const staffRows = await tx
      .select()
      .from(institutionalStaffMembers)
      .where(
        and(
          eq(
            institutionalStaffMembers.institutionalAccountId,
            input.institutionId
          ),
          or(
            eq(institutionalStaffMembers.userId, input.userId),
            eq(institutionalStaffMembers.staffEmail, input.email)
          )
        )
      )
      .orderBy(desc(institutionalStaffMembers.id))
      .limit(5);
    const conflict = staffRows.find(
      (row: typeof institutionalStaffMembers.$inferSelect) =>
        row.userId != null &&
        row.userId !== input.userId &&
        normalizeEmail(row.staffEmail) === input.email
    );
    if (conflict)
      throw new TRPCError({
        code: "CONFLICT",
        message:
          "This email is already attached to another provider record in this institution.",
      });
    staff =
      staffRows.find(
        (row: typeof institutionalStaffMembers.$inferSelect) =>
          row.userId === input.userId
      ) ??
      staffRows.find(
        (row: typeof institutionalStaffMembers.$inferSelect) =>
          normalizeEmail(row.staffEmail) === input.email
      );
  }
  if (staff?.removedAt) {
    throw new TRPCError({
      code: "CONFLICT",
      message:
        "This provider has been retired from the institution. Use the administrator restoration process instead.",
    });
  }
  if (staff) {
    await tx
      .update(institutionalStaffMembers)
      .set({
        userId: input.userId,
        staffName: input.name,
        staffEmail: input.email,
        staffPhone: input.phone,
        staffRole,
        department: input.department,
        facilityDepartmentId: input.facilityDepartmentId,
        facilityLinkStatus: "linked",
        enrollmentStatus: "enrolled",
        updatedAt: now,
      })
      .where(
        and(
          eq(institutionalStaffMembers.id, staff.id),
          eq(
            institutionalStaffMembers.institutionalAccountId,
            input.institutionId
          ),
          isNull(institutionalStaffMembers.removedAt)
        )
      );
  } else {
    await tx.insert(institutionalStaffMembers).values({
      institutionalAccountId: input.institutionId,
      userId: input.userId,
      staffName: input.name,
      staffEmail: input.email,
      staffPhone: input.phone,
      staffRole,
      department: input.department,
      facilityDepartmentId: input.facilityDepartmentId,
      facilityLinkStatus: "linked",
      enrollmentStatus: "enrolled",
    });
  }
  const staffRows = await tx
    .select({ id: institutionalStaffMembers.id })
    .from(institutionalStaffMembers)
    .where(
      and(
        eq(
          institutionalStaffMembers.institutionalAccountId,
          input.institutionId
        ),
        eq(institutionalStaffMembers.userId, input.userId),
        isNull(institutionalStaffMembers.removedAt)
      )
    )
    .orderBy(desc(institutionalStaffMembers.id))
    .limit(1);
  const staffMemberId = staffRows[0]?.id ?? null;
  if (!staffMemberId)
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "The institution staff record could not be materialized.",
    });

  const membershipRows = await tx
    .select()
    .from(institutionMemberships)
    .where(
      and(
        eq(institutionMemberships.institutionalAccountId, input.institutionId),
        eq(institutionMemberships.invitedEmail, input.email)
      )
    )
    .orderBy(desc(institutionMemberships.id))
    .limit(5);
  const conflictingMembership = membershipRows.find(
    (row: typeof institutionMemberships.$inferSelect) =>
      row.userId != null && row.userId !== input.userId
  );
  if (conflictingMembership)
    throw new TRPCError({
      code: "CONFLICT",
      message:
        "This email is already linked to a different account in this institution.",
    });
  let membership =
    membershipRows.find(
      (row: typeof institutionMemberships.$inferSelect) =>
        row.userId === input.userId
    ) ?? membershipRows[0];
  if (
    membership?.membershipStatus === "suspended" ||
    membership?.membershipStatus === "ended"
  ) {
    throw new TRPCError({
      code: "CONFLICT",
      message:
        "Existing institutional access is suspended or ended. An administrator must use the restoration process.",
    });
  }
  if (membership) {
    await tx
      .update(institutionMemberships)
      .set({
        userId: input.userId,
        invitedEmail: input.email,
        staffMemberId,
        membershipStatus: "active",
        responsibilityRole: "general_staff",
        acceptedAt: membership.acceptedAt ?? now,
        updatedAt: now,
      })
      .where(
        and(
          eq(institutionMemberships.id, membership.id),
          eq(institutionMemberships.institutionalAccountId, input.institutionId)
        )
      );
  } else {
    await tx.insert(institutionMemberships).values({
      institutionalAccountId: input.institutionId,
      userId: input.userId,
      invitedEmail: input.email,
      staffMemberId,
      membershipStatus: "active",
      responsibilityRole: "general_staff",
      invitedByUserId: input.userId,
      invitedAt: now,
      acceptedAt: now,
    });
  }
  const membershipRowsAfter = await tx
    .select({ id: institutionMemberships.id })
    .from(institutionMemberships)
    .where(
      and(
        eq(institutionMemberships.institutionalAccountId, input.institutionId),
        eq(institutionMemberships.invitedEmail, input.email)
      )
    )
    .orderBy(desc(institutionMemberships.id))
    .limit(1);
  const membershipId = membershipRowsAfter[0]?.id ?? null;
  if (!membershipId)
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "The institution membership could not be materialized.",
    });
  return { staffMemberId, membershipId };
}

export const facilityLinkingRouter = router({
  getMyRequests: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDbOrThrow();
    const rows = await db
      .select({
        id: facilityMembershipRequests.id,
        institutionalAccountId:
          facilityMembershipRequests.institutionalAccountId,
        institutionName: institutionalAccounts.companyName,
        careFacilityId: facilityMembershipRequests.careFacilityId,
        facilityName: careFacilities.name,
        county: careFacilities.county,
        relationshipType: facilityMembershipRequests.relationshipType,
        department: facilityMembershipRequests.department,
        facilityDepartmentId: facilityMembershipRequests.facilityDepartmentId,
        status: facilityMembershipRequests.status,
        reviewReason: facilityMembershipRequests.reviewReason,
        createdAt: facilityMembershipRequests.createdAt,
        reviewedAt: facilityMembershipRequests.reviewedAt,
      })
      .from(facilityMembershipRequests)
      .innerJoin(
        institutionalAccounts,
        eq(
          institutionalAccounts.id,
          facilityMembershipRequests.institutionalAccountId
        )
      )
      .innerJoin(
        careFacilities,
        eq(careFacilities.id, facilityMembershipRequests.careFacilityId)
      )
      .where(eq(facilityMembershipRequests.userId, ctx.user.id))
      .orderBy(desc(facilityMembershipRequests.createdAt));
    return rows;
  }),

  requestLink: protectedProcedure
    .input(
      z.object({
        facilityId: z.number().int().positive(),
        relationshipType: requestRelationshipSchema.default("permanent_staff"),
        department: z.string().trim().max(255).optional(),
        facilityDepartmentId: z.number().int().positive().nullable().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDbOrThrow();
      const email = requireEmail(ctx.user.email);
      const facility = await getCanonicalFacility(db, input.facilityId);
      if (!facility)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Facility not found.",
        });
      if (!facility.institutionalAccountId || facility.isSystem) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "Choose a facility that is already registered by an institution.",
        });
      }
      const institutionId = facility.institutionalAccountId;
      const [institution] = await db
        .select({
          id: institutionalAccounts.id,
          companyName: institutionalAccounts.companyName,
          status: institutionalAccounts.status,
        })
        .from(institutionalAccounts)
        .where(eq(institutionalAccounts.id, institutionId))
        .limit(1);
      if (!institution || institution.status === "inactive") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "This facility’s institutional account is not currently accepting link requests.",
        });
      }
      const context = await getProviderContext(db, ctx.user.id);
      const department = input.department?.trim() || context.department;
      let facilityDepartmentId =
        input.facilityDepartmentId ?? context.facilityDepartmentId;
      if (facilityDepartmentId != null) {
        const [departmentRow] = await db
          .select({
            id: facilityDepartments.id,
            departmentName: facilityDepartments.departmentName,
          })
          .from(facilityDepartments)
          .where(
            and(
              eq(facilityDepartments.id, facilityDepartmentId),
              eq(facilityDepartments.institutionId, institutionId),
              eq(facilityDepartments.isActive, true)
            )
          )
          .limit(1);
        if (!departmentRow)
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Choose a current department from this institution.",
          });
      }
      const existingMembership = await db
        .select({
          id: institutionMemberships.id,
          membershipStatus: institutionMemberships.membershipStatus,
          userId: institutionMemberships.userId,
        })
        .from(institutionMemberships)
        .where(
          and(
            eq(institutionMemberships.institutionalAccountId, institutionId),
            or(
              eq(institutionMemberships.userId, ctx.user.id),
              eq(institutionMemberships.invitedEmail, email)
            )
          )
        )
        .orderBy(desc(institutionMemberships.id))
        .limit(1);
      if (existingMembership[0]?.membershipStatus === "active") {
        return {
          success: true as const,
          status: "already_linked" as const,
          requestId: null,
          institutionId,
          facilityId: facility.id,
        };
      }
      if (
        existingMembership[0]?.membershipStatus === "suspended" ||
        existingMembership[0]?.membershipStatus === "ended"
      ) {
        throw new TRPCError({
          code: "CONFLICT",
          message:
            "Your previous access to this institution is suspended or ended. Ask the institution administrator to restore it.",
        });
      }
      const pendingKey = requestKey(institutionId, ctx.user.id);
      const [existingRequest] = await db
        .select()
        .from(facilityMembershipRequests)
        .where(eq(facilityMembershipRequests.pendingRequestKey, pendingKey))
        .limit(1);
      if (existingRequest) {
        if (existingRequest.careFacilityId !== facility.id) {
          throw new TRPCError({
            code: "CONFLICT",
            message:
              "You already have a pending request for this institution. Withdraw it before choosing a different facility.",
          });
        }
        return {
          success: true as const,
          status: "pending" as const,
          requestId: existingRequest.id,
          institutionId,
          facilityId: facility.id,
          duplicate: true as const,
        };
      }
      const [userRow] = await db
        .select({
          name: users.name,
          phone: users.phone,
          providerType: users.providerType,
        })
        .from(users)
        .where(eq(users.id, ctx.user.id))
        .limit(1);
      const staff = await findStaffRow(db, institutionId, ctx.user.id, email);
      if (staff?.removedAt)
        throw new TRPCError({
          code: "CONFLICT",
          message:
            "This provider record has been retired from the institution. Ask an administrator to restore it.",
        });
      const now = new Date();
      let requestId = 0;
      let staffMemberId = staff?.id ?? null;
      await db.transaction(async tx => {
        if (staff) {
          await tx
            .update(institutionalStaffMembers)
            .set({
              userId: ctx.user.id,
              staffName: userRow?.name ?? ctx.user.name ?? email,
              staffEmail: email,
              staffPhone: userRow?.phone ?? ctx.user.phone ?? null,
              staffRole: staffRoleFromProviderType(
                userRow?.providerType ?? ctx.user.providerType
              ),
              department,
              facilityDepartmentId,
              facilityLinkStatus: "pending",
              enrollmentStatus: "pending",
              updatedAt: now,
            })
            .where(
              and(
                eq(institutionalStaffMembers.id, staff.id),
                eq(
                  institutionalStaffMembers.institutionalAccountId,
                  institutionId
                ),
                isNull(institutionalStaffMembers.removedAt)
              )
            );
        } else {
          await tx.insert(institutionalStaffMembers).values({
            institutionalAccountId: institutionId,
            userId: ctx.user.id,
            staffName: userRow?.name ?? ctx.user.name ?? email,
            staffEmail: email,
            staffPhone: userRow?.phone ?? ctx.user.phone ?? null,
            staffRole: staffRoleFromProviderType(
              userRow?.providerType ?? ctx.user.providerType
            ),
            department,
            facilityDepartmentId,
            facilityLinkStatus: "pending",
            enrollmentStatus: "pending",
          });
        }
        const staffRows = await tx
          .select({ id: institutionalStaffMembers.id })
          .from(institutionalStaffMembers)
          .where(
            and(
              eq(
                institutionalStaffMembers.institutionalAccountId,
                institutionId
              ),
              eq(institutionalStaffMembers.userId, ctx.user.id)
            )
          )
          .orderBy(desc(institutionalStaffMembers.id))
          .limit(1);
        staffMemberId = staffRows[0]?.id ?? staffMemberId;
        const inserted = await tx.insert(facilityMembershipRequests).values({
          institutionalAccountId: institutionId,
          careFacilityId: facility.id,
          userId: ctx.user.id,
          requesterEmail: email,
          requesterName: userRow?.name ?? ctx.user.name ?? email,
          relationshipType: input.relationshipType,
          pendingRequestKey: pendingKey,
          department,
          facilityDepartmentId,
          status: "pending",
          staffMemberId,
        });
        requestId =
          (inserted as unknown as { insertId?: number }).insertId ?? 0;
      });
      if (!requestId) {
        const [created] = await db
          .select({ id: facilityMembershipRequests.id })
          .from(facilityMembershipRequests)
          .where(eq(facilityMembershipRequests.pendingRequestKey, pendingKey))
          .limit(1);
        requestId = created?.id ?? 0;
      }
      if (!requestId)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "The facility link request could not be created.",
        });
      await notifyUsers(
        db,
        await getAdminUserIds(db, institutionId),
        "New facility link request",
        `${ctx.user.name ?? email} requested a general facility link to ${facility.name}. Review it in Access & links.`,
        requestId,
        "/institution?section=administration&adminTab=access_links"
      );
      return {
        success: true as const,
        status: "pending" as const,
        requestId,
        institutionId,
        facilityId: facility.id,
        duplicate: false as const,
      };
    }),

  withdrawRequest: protectedProcedure
    .input(z.object({ requestId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDbOrThrow();
      const [request] = await db
        .select()
        .from(facilityMembershipRequests)
        .where(
          and(
            eq(facilityMembershipRequests.id, input.requestId),
            eq(facilityMembershipRequests.userId, ctx.user.id)
          )
        )
        .limit(1);
      if (!request)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Facility link request not found.",
        });
      if (request.status !== "pending")
        return { success: true as const, status: request.status };
      const now = new Date();
      await db.transaction(async tx => {
        await tx
          .update(facilityMembershipRequests)
          .set({
            status: "withdrawn",
            pendingRequestKey: null,
            reviewedAt: now,
            reviewReason: "Withdrawn by provider",
            updatedAt: now,
          })
          .where(
            and(
              eq(facilityMembershipRequests.id, input.requestId),
              eq(facilityMembershipRequests.userId, ctx.user.id),
              eq(facilityMembershipRequests.status, "pending")
            )
          );
        if (request.staffMemberId) {
          await tx
            .update(institutionalStaffMembers)
            .set({ facilityLinkStatus: "rejected", updatedAt: now })
            .where(
              and(
                eq(institutionalStaffMembers.id, request.staffMemberId),
                eq(
                  institutionalStaffMembers.institutionalAccountId,
                  request.institutionalAccountId
                ),
                isNull(institutionalStaffMembers.removedAt)
              )
            );
        }
        await tx.insert(institutionalActionLogs).values({
          institutionalAccountId: request.institutionalAccountId,
          createdByUserId: ctx.user.id,
          gapIdentified: `${request.requesterEmail} withdrew a facility link request.`,
          systemChange: "FACILITY_LINK_REQUEST_WITHDRAWN",
          status: "completed",
          notes: JSON.stringify({
            requestId: request.id,
            careFacilityId: request.careFacilityId,
          }),
        });
      });
      return { success: true as const, status: "withdrawn" as const };
    }),

  getPendingRequests: protectedProcedure
    .input(z.object({ institutionId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const db = await getDbOrThrow();
      await assertInstitutionAccess(db, ctx.user, input.institutionId);
      return db
        .select({
          id: facilityMembershipRequests.id,
          institutionId: facilityMembershipRequests.institutionalAccountId,
          institutionName: institutionalAccounts.companyName,
          facilityId: facilityMembershipRequests.careFacilityId,
          facilityName: careFacilities.name,
          county: careFacilities.county,
          requesterUserId: facilityMembershipRequests.userId,
          requesterEmail: facilityMembershipRequests.requesterEmail,
          requesterName: facilityMembershipRequests.requesterName,
          relationshipType: facilityMembershipRequests.relationshipType,
          department: facilityMembershipRequests.department,
          facilityDepartmentId: facilityMembershipRequests.facilityDepartmentId,
          status: facilityMembershipRequests.status,
          createdAt: facilityMembershipRequests.createdAt,
        })
        .from(facilityMembershipRequests)
        .innerJoin(
          institutionalAccounts,
          eq(
            institutionalAccounts.id,
            facilityMembershipRequests.institutionalAccountId
          )
        )
        .innerJoin(
          careFacilities,
          eq(careFacilities.id, facilityMembershipRequests.careFacilityId)
        )
        .where(
          and(
            eq(
              facilityMembershipRequests.institutionalAccountId,
              input.institutionId
            ),
            eq(facilityMembershipRequests.status, "pending")
          )
        )
        .orderBy(asc(facilityMembershipRequests.createdAt));
    }),

  reviewRequest: protectedProcedure
    .input(
      z.object({
        institutionId: z.number().int().positive(),
        requestId: z.number().int().positive(),
        approve: z.boolean(),
        reason: z.string().trim().max(1000).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDbOrThrow();
      await assertInstitutionAccess(db, ctx.user, input.institutionId);
      if (
        !input.approve &&
        (!input.reason || input.reason.trim().length < 10)
      ) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "A rejection reason of at least 10 characters is required.",
        });
      }
      const [request] = await db
        .select()
        .from(facilityMembershipRequests)
        .where(
          and(
            eq(facilityMembershipRequests.id, input.requestId),
            eq(
              facilityMembershipRequests.institutionalAccountId,
              input.institutionId
            )
          )
        )
        .limit(1);
      if (!request)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Facility link request not found.",
        });
      if (request.status !== "pending")
        return {
          success: true as const,
          status: request.status,
          requestId: request.id,
          alreadyReviewed: true as const,
        };
      const facility = await getCanonicalFacility(db, request.careFacilityId);
      if (
        !facility ||
        facility.institutionalAccountId !== input.institutionId ||
        facility.isSystem
      ) {
        throw new TRPCError({
          code: "CONFLICT",
          message:
            "The selected facility is no longer registered to this institution.",
        });
      }
      const [provider] = await db
        .select({
          name: users.name,
          phone: users.phone,
          providerType: users.providerType,
          email: users.email,
        })
        .from(users)
        .where(eq(users.id, request.userId))
        .limit(1);
      if (!provider)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "The provider account no longer exists.",
        });
      const now = new Date();
      if (!input.approve) {
        await db.transaction(async tx => {
          await tx
            .update(facilityMembershipRequests)
            .set({
              status: "rejected",
              pendingRequestKey: null,
              reviewedByUserId: ctx.user.id,
              reviewedAt: now,
              reviewReason: input.reason!.trim(),
              updatedAt: now,
            })
            .where(
              and(
                eq(facilityMembershipRequests.id, request.id),
                eq(facilityMembershipRequests.status, "pending")
              )
            );
          if (request.staffMemberId) {
            await tx
              .update(institutionalStaffMembers)
              .set({ facilityLinkStatus: "rejected", updatedAt: now })
              .where(
                and(
                  eq(institutionalStaffMembers.id, request.staffMemberId),
                  eq(
                    institutionalStaffMembers.institutionalAccountId,
                    input.institutionId
                  ),
                  isNull(institutionalStaffMembers.removedAt)
                )
              );
          }
          await tx.insert(institutionalActionLogs).values({
            institutionalAccountId: input.institutionId,
            createdByUserId: ctx.user.id,
            gapIdentified: `${request.requesterEmail} requested a facility link and the administrator rejected it.`,
            systemChange: "FACILITY_LINK_REQUEST_REJECTED",
            status: "completed",
            notes: JSON.stringify({
              requestId: request.id,
              careFacilityId: request.careFacilityId,
              reason: input.reason!.trim(),
            }),
          });
        });
        await notifyUsers(
          db,
          [request.userId],
          "Facility link request not approved",
          `Your request to link to ${facility.name} was not approved. Reason: ${input.reason!.trim()}`,
          request.id,
          "/records"
        ).catch(() => undefined);
        return {
          success: true as const,
          status: "rejected" as const,
          requestId: request.id,
          alreadyReviewed: false as const,
        };
      }
      const result = await db.transaction(async tx => {
        const materialized = await materializeMembershipAndStaff(tx, {
          institutionId: input.institutionId,
          userId: request.userId,
          email: normalizeEmail(provider.email) || request.requesterEmail,
          name:
            provider.name?.trim() ||
            request.requesterName ||
            request.requesterEmail,
          phone: provider.phone ?? null,
          providerType: provider.providerType,
          department: request.department,
          facilityDepartmentId: request.facilityDepartmentId,
          staffMemberId: request.staffMemberId,
        });
        await tx
          .update(facilityMembershipRequests)
          .set({
            status: "approved",
            pendingRequestKey: null,
            reviewedByUserId: ctx.user.id,
            reviewedAt: now,
            reviewReason:
              input.reason?.trim() || "Approved by institution administrator",
            staffMemberId: materialized.staffMemberId,
            membershipId: materialized.membershipId,
            updatedAt: now,
          })
          .where(
            and(
              eq(facilityMembershipRequests.id, request.id),
              eq(facilityMembershipRequests.status, "pending")
            )
          );
        await tx.insert(institutionalActionLogs).values({
          institutionalAccountId: input.institutionId,
          createdByUserId: ctx.user.id,
          gapIdentified: `${request.requesterEmail} requested a facility link and the administrator approved it.`,
          systemChange: "FACILITY_LINK_REQUEST_APPROVED",
          status: "completed",
          notes: JSON.stringify({
            requestId: request.id,
            careFacilityId: request.careFacilityId,
            staffMemberId: materialized.staffMemberId,
            membershipId: materialized.membershipId,
            relationshipType: request.relationshipType,
          }),
        });
        return materialized;
      });
      await notifyUsers(
        db,
        [request.userId],
        "Facility link approved",
        `Your account is now linked to ${facility.name} as general institutional staff. IERS duties still require separate assignment and acceptance.`,
        request.id,
        "/records"
      ).catch(() => undefined);
      return {
        success: true as const,
        status: "approved" as const,
        requestId: request.id,
        ...result,
        alreadyReviewed: false as const,
      };
    }),

  repairApprovedStaffLink: protectedProcedure
    .input(
      z.object({
        institutionId: z.number().int().positive(),
        staffMemberId: z.number().int().positive(),
        approve: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDbOrThrow();
      await assertInstitutionAccess(db, ctx.user, input.institutionId);
      const [staff] = await db
        .select()
        .from(institutionalStaffMembers)
        .where(
          and(
            eq(institutionalStaffMembers.id, input.staffMemberId),
            eq(
              institutionalStaffMembers.institutionalAccountId,
              input.institutionId
            )
          )
        )
        .limit(1);
      if (!staff)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Institution staff member not found.",
        });
      if (staff.removedAt)
        throw new TRPCError({
          code: "CONFLICT",
          message: "This provider has been retired from the institution.",
        });
      if (!input.approve) {
        await db
          .update(institutionalStaffMembers)
          .set({
            facilityLinkStatus: "rejected",
            enrollmentStatus: "dropped",
            updatedAt: new Date(),
          })
          .where(eq(institutionalStaffMembers.id, staff.id));
        return { success: true as const, status: "rejected" as const };
      }
      if (!staff.userId) {
        await db
          .update(institutionalStaffMembers)
          .set({
            facilityLinkStatus: "linked",
            enrollmentStatus: "enrolled",
            updatedAt: new Date(),
          })
          .where(eq(institutionalStaffMembers.id, staff.id));
        return {
          success: true as const,
          status: "linked" as const,
          membershipId: null,
        };
      }
      const [provider] = await db
        .select({
          name: users.name,
          phone: users.phone,
          providerType: users.providerType,
          email: users.email,
        })
        .from(users)
        .where(eq(users.id, staff.userId))
        .limit(1);
      if (!provider)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "The provider account no longer exists.",
        });
      const result = await db.transaction(async tx => {
        const materialized = await materializeMembershipAndStaff(tx, {
          institutionId: input.institutionId,
          userId: staff.userId!,
          email:
            normalizeEmail(provider.email) || normalizeEmail(staff.staffEmail),
          name: provider.name?.trim() || staff.staffName,
          phone: provider.phone ?? staff.staffPhone ?? null,
          providerType: provider.providerType,
          department: staff.department,
          facilityDepartmentId: staff.facilityDepartmentId,
          staffMemberId: staff.id,
        });
        await tx.insert(institutionalActionLogs).values({
          institutionalAccountId: input.institutionId,
          createdByUserId: ctx.user.id,
          gapIdentified: `${staff.staffEmail} had a legacy approved facility row without a materialized membership.`,
          systemChange: "FACILITY_LINK_MEMBERSHIP_REPAIRED",
          status: "completed",
          notes: JSON.stringify({
            staffMemberId: staff.id,
            membershipId: materialized.membershipId,
          }),
        });
        return materialized;
      });
      await notifyUsers(
        db,
        [staff.userId!],
        "Facility relationship approved",
        "Your general institutional membership is active. IERS duties still require separate assignment and acceptance.",
        staff.id,
        "/records"
      ).catch(() => undefined);
      return { success: true as const, status: "linked" as const, ...result };
    }),
});
