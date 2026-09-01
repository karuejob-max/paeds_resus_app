import { protectedProcedure, publicProcedure, adminProcedure, router } from "../_core/trpc";
import { searchKmhflFacilities } from "./institution-kmhfl-search";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import {
  institutionalAccounts,
  institutionalInquiries,
  institutionalStaffMembers,
  institutionalAccountAdmins,
  quotations,
  contracts,
  trainingSchedules,
  trainingAttendance,
  courses,
  incidents,
  institutionalActionLogs,
  institutionalAnalytics,
  users,
  payments,
  enrollments,
  careFacilities,
  kmhflFacilities,
  careSignalEvents,
  codeSignalEvents,
  providerProfiles,
  professionalCredentials,
  instructorQualifications,
  facilityPoles,
  facilityDepartments,
  institutionDepartmentResponseCoordinators,
  institutionDepartmentResponseCoordinatorEvents,
  institutionDepartmentHeads,
  ertlWeeklyRotations,
  monthlyUtlRotations,
  institutionShiftTemplates,
  shiftUtlRosters,
  iermsAuditScorecards,
  equipmentAuditLogs,
  iermsImplementationTrackers,
  institutionMemberships,
  institutionMembershipEvents,
  institutionProductRoles,
  institutionAccountScopes,
  iersEvidenceRecords,
  iersActionItems,
  iersCompetencyRecords,
  cpdEvents,
  cpdAttendees,
  inAppNotifications,
  iersShiftTeams,
  iersShiftRoleAssignments,
  iersShiftRoleEvents,
} from "../../drizzle/schema";
import { runResusGpsAuditForInstitution } from "../lib/resusgps-auditor";
import { assertNoInstructorDoubleBooking as assertNoInstructorDoubleBookingShared } from "../lib/instructor-double-booking-guard";
import {
  daysBackForTimeframe,
  gapCountsToArray,
  buildRecommendations,
  type GapCategoryStat,
  type GapRecommendation,
} from "./care-signal-events";
import { alias } from "drizzle-orm/mysql-core";
import { eq, desc, and, inArray, count, asc, isNotNull, isNull, like, gte, lte, sql, or, notInArray, ne } from "drizzle-orm";
import { processBulkEnrollment, getInstitutionalPricing } from "../institutional-enrollment";
import { initiateSTKPush, validatePhoneNumber, isMpesaConfigured } from "../_core/mpesa";
import { assertInstitutionAccess, getAdministeredInstitutionIds, countInstitutionAdmins, isInstitutionAdmin } from "../lib/institution-access";
import { assertInstitutionAccountScope } from "../lib/institution-account-scopes";
import { materializeMembershipAndStaff } from "./facility-linking";
import { assertInstitutionProductCapability, assertWritableProductAccess } from "../lib/institution-entitlements";
import { asDateOnly, derivePoleRotationDepartmentId, isoWeekMonday, mondayForDate, rotationAnchorForLeadershipWeek } from "../lib/iers-pole-rotation";
import { classifyShiftInterval } from "../lib/iers-shift-current";
import { assertInstitutionProductRole } from "../lib/institution-product-roles";
import { assertCanManageArea } from "../lib/institution-role-authority";
import { assertCurrentClinicalLicence } from "../lib/professional-credential-safety";
import { isRegisteredRnProfile } from "../lib/iers-provider-eligibility";
import { getCohortProgressStats } from "../lib/cohort-progress";
import { ensureCourseCatalogForSchedule } from "../lib/ensure-course-catalog-for-schedule";
import {
  rollupInstitutionalAnalyticsForAccount,
  rollupAllInstitutionalAccounts,
} from "../institutional-analytics-rollup";
import { trackEvent } from "../services/analytics.service";
import { getFacilityCareSignalDashboard } from "../services/facility-care-signal.service";
import { getFacilityCodeSignalDashboard } from "../services/facility-code-signal.service";
import { getProviderScorecard, type ProviderScorecard } from "../services/provider-performance.service";
import { notifyInstructorSessionAssigned } from "../lib/instructor-session-notification";
import { ENV } from "../_core/env";
import { isMissingTableError } from "../lib/is-missing-db-table";
import { isInstitutionInPilotProgram } from "@shared/pilot-program";
import { validateDepartmentErcoAssignment } from "../lib/iers-department-governance";
import { ensurePublishedTeamForLegacyUtlRoster, notifyDepartmentErcoOfUtlDecline, projectLegacyUtlRosterDecision, projectUtlRosterReassignment } from "../services/iers-utl-sync.service";
import { ensureDefaultUtlReadinessTemplate } from "../services/iers-readiness-template.service";
import { autoLinkCpdFacilitiesForInstitution } from "../services/facility-registry.service";
import { getIsoWeekKey, getIsoWeekRange, getMonthlyShiftRows, monthStartFromShiftDate, normalizeMonthStart } from "../lib/iers-monthly-rota";
import { insertCanonicalFacilityDepartments } from "../lib/iers-department-setup";
import { DEFAULT_SHIFT_TEMPLATES, formatShiftInterval, shiftTemplateForType, validateShiftInterval } from "../lib/iers-shift-times";
import { DEPARTMENT_ALIASES, canonicalizeDepartmentLabel, departmentLabelsMatch, isPresetDepartment } from "../../shared/clinical-departments";
import {
  CARE_FACILITY_LEVEL_VALUES,
  FACILITY_OWNERSHIP_VALUES,
  INSTITUTION_CATEGORY_VALUES,
  INSTITUTION_PLATFORM_NEED_VALUES,
  INSTITUTION_TYPE_VALUES,
  requiresCareFacilityClassification,
} from "@shared/institution-onboarding";
import {
  evaluateProviderDutyAuthorization,
  type ProviderDutyAuthorizationInput,
} from "../lib/iers-provider-duty-authorization";
import {
  isValidActionLogStatusTransition,
  requiresSystemChangeOnResolve,
  type ActionLogStatus,
} from "../lib/institutional-action-log-status";

type DbClient = NonNullable<Awaited<ReturnType<typeof getDb>>>;

const IERS_READ_ROLES = ["iers_chair", "iers_viewer", "iers_coordinator", "iers_governance", "iers_reviewer", "iers_responder"] as const;
const IERS_OPERATE_ROLES = ["iers_chair", "iers_coordinator", "iers_governance"] as const;
const IERS_ACTION_ROLES = ["iers_chair", "iers_coordinator", "iers_reviewer", "iers_governance"] as const;
const IERS_DEPARTMENT_GOVERNANCE_ROLES = ["iers_chair", "iers_coordinator", "iers_governance"] as const;
function resolveShiftTiming(input: {
  shiftType: "morning" | "evening" | "night";
  shiftStartTime?: string;
  shiftEndTime?: string;
  shiftEndDayOffset?: number;
}) {
  const preset = shiftTemplateForType(input.shiftType);
  try {
    return validateShiftInterval({
      startTime: input.shiftStartTime ?? preset.startTime,
      endTime: input.shiftEndTime ?? preset.endTime,
      endDayOffset: input.shiftEndDayOffset ?? preset.endDayOffset,
    });
  } catch (error) {
    throw new TRPCError({ code: "BAD_REQUEST", message: error instanceof Error ? error.message : "Invalid shift interval." });
  }
}
type ShiftRosterWriteInput = {
  institutionId: number;
  poleId: number;
  departmentId: number;
  shiftDate: string;
  shiftType: "morning" | "evening" | "night";
  shiftStartTime?: string;
  shiftEndTime?: string;
  shiftEndDayOffset?: number;
  shiftTemplateId?: number | null;
  utlUserId: number;
  status?: "active" | "absent" | "completed";
};

async function saveShiftUtlRosterRow(db: DbClient, user: Pick<typeof users.$inferSelect, "id" | "role" | "email">, input: ShiftRosterWriteInput) {
  await assertIersDepartmentRotaWriteAccess(db, user, input.institutionId, input.departmentId);
  await assertDepartmentBelongsToPole(db, input.institutionId, input.departmentId, input.poleId);
  const timing = resolveShiftTiming(input);
  const [orderedDepartments, rotationAnchorDate] = await Promise.all([
    getOrderedPoleDepartments(db, input.institutionId, input.poleId),
    getPoleRotationAnchor(db, input.institutionId, input.poleId),
  ]);
  const isShiftErtl = derivePoleRotationDepartmentId(orderedDepartments, rotationAnchorDate, input.shiftDate) === input.departmentId;
  const canonicalUtlUserId = await resolveCanonicalDepartmentProvider(db, input.institutionId, input.departmentId, input.utlUserId);
  if (canonicalUtlUserId == null) throw new TRPCError({ code: "BAD_REQUEST", message: "The selected nurse is not an active linked provider for this canonical department. Link the account or choose another nurse." });
  const [member] = await db
    .select({ userId: institutionMemberships.userId })
    .from(institutionMemberships)
    .where(and(
      eq(institutionMemberships.institutionalAccountId, input.institutionId),
      eq(institutionMemberships.userId, canonicalUtlUserId),
      eq(institutionMemberships.membershipStatus, "active"),
    ))
    .limit(1);
  if (!member) throw new TRPCError({ code: "BAD_REQUEST", message: "The UTL must be an active provider–institution member." });

  const shiftDate = new Date(input.shiftDate);
  const [existing] = await db
    .select()
    .from(shiftUtlRosters)
    .where(and(
      eq(shiftUtlRosters.institutionId, input.institutionId),
      eq(shiftUtlRosters.poleId, input.poleId),
      eq(shiftUtlRosters.departmentId, input.departmentId),
      eq(shiftUtlRosters.shiftDate, shiftDate),
      eq(shiftUtlRosters.shiftType, input.shiftType),
    ))
    .limit(1);

  if (existing) {
    const shouldResetSignOff = existing.assignmentStatus === "ended" || existing.utlUserId !== canonicalUtlUserId || existing.shiftStartTime !== timing.startTime || existing.shiftEndTime !== timing.endTime || existing.shiftEndDayOffset !== timing.endDayOffset;
    await db.update(shiftUtlRosters).set({
      utlUserId: canonicalUtlUserId,
      shiftStartTime: timing.startTime,
      shiftEndTime: timing.endTime,
      shiftEndDayOffset: timing.endDayOffset,
      shiftTemplateId: input.shiftTemplateId ?? null,
      isShiftErtl,
      monthlyUtlRotationId: null,
      status: input.status ?? "active",
      assignmentStatus: shouldResetSignOff ? "pending_acceptance" : existing.assignmentStatus,
      acceptedAt: shouldResetSignOff ? null : existing.acceptedAt,
      declinedAt: shouldResetSignOff ? null : existing.declinedAt,
      declineReason: shouldResetSignOff ? null : existing.declineReason,
      readinessSignOffAt: shouldResetSignOff ? null : existing.readinessSignOffAt,
    }).where(eq(shiftUtlRosters.id, existing.id));
    if (shouldResetSignOff) {
      await projectUtlRosterReassignment(db, {
        roster: existing,
        nextProviderUserId: canonicalUtlUserId,
        nextShiftStartTime: timing.startTime,
        nextShiftEndTime: timing.endTime,
        nextShiftEndDayOffset: timing.endDayOffset,
        actorUserId: user.id,
      });
    }
    const [updatedRoster] = await db.select().from(shiftUtlRosters).where(eq(shiftUtlRosters.id, existing.id)).limit(1);
    if (updatedRoster) {
      await ensurePublishedTeamForLegacyUtlRoster(db, { roster: updatedRoster, actorUserId: user.id });
    }
    return { id: existing.id, isShiftErtl, interval: formatShiftInterval(timing), changed: shouldResetSignOff };
  }

  const result = await db.insert(shiftUtlRosters).values({
    institutionId: input.institutionId,
    poleId: input.poleId,
    departmentId: input.departmentId,
    shiftDate,
    shiftType: input.shiftType,
    shiftStartTime: timing.startTime,
    shiftEndTime: timing.endTime,
    shiftEndDayOffset: timing.endDayOffset,
    shiftTemplateId: input.shiftTemplateId ?? null,
    utlUserId: canonicalUtlUserId,
    isShiftErtl,
    monthlyUtlRotationId: null,
    assignmentStatus: "pending_acceptance",
    status: input.status ?? "active",
  });
  const rosterId = (result as unknown as { insertId: number }).insertId;
  const [createdRoster] = await db.select().from(shiftUtlRosters).where(eq(shiftUtlRosters.id, rosterId)).limit(1);
  if (createdRoster) {
    await ensurePublishedTeamForLegacyUtlRoster(db, { roster: createdRoster, actorUserId: user.id });
  }
  return { id: rosterId, isShiftErtl, interval: formatShiftInterval(timing), changed: true };
}

function assertProviderDutyDecision(input: ProviderDutyAuthorizationInput) {
  const decision = evaluateProviderDutyAuthorization(input);
  if (!decision.allowed) {
    throw new TRPCError({ code: decision.code, message: decision.reason });
  }
}

async function assertActiveProviderDutyAccess(
  db: DbClient,
  user: Pick<typeof users.$inferSelect, "id" | "role" | "email">,
  institutionId: number,
) {
  const [membership] = await db
    .select({ id: institutionMemberships.id })
    .from(institutionMemberships)
    .where(and(
      eq(institutionMemberships.institutionalAccountId, institutionId),
      eq(institutionMemberships.userId, user.id),
      eq(institutionMemberships.membershipStatus, "active"),
    ))
    .limit(1);
  if (!membership) {
    throw new TRPCError({ code: "FORBIDDEN", message: "You are no longer an active provider member of this institution." });
  }
}

async function getActiveProviderDutyInstitutionIds(
  db: DbClient,
  user: Pick<typeof users.$inferSelect, "id" | "role" | "email">,
  institutionIds: number[],
) {
  const uniqueInstitutionIds = [...new Set(institutionIds)];
  const activeInstitutionIds = new Set<number>();
  for (const institutionId of uniqueInstitutionIds) {
    try {
      await assertActiveProviderDutyAccess(db, user, institutionId);
      activeInstitutionIds.add(institutionId);
    } catch (error) {
      if (error instanceof TRPCError && error.code === "FORBIDDEN") continue;
      throw error;
    }
  }
  return activeInstitutionIds;
}

async function assertIersDepartmentRotaWriteAccess(
  db: DbClient,
  user: Pick<typeof users.$inferSelect, "id" | "role" | "email">,
  institutionId: number,
  departmentId: number,
) {
  try {
    return await assertInstitutionProductRole(db, user, institutionId, "iers", IERS_DEPARTMENT_GOVERNANCE_ROLES);
  } catch (error) {
    if (!(error instanceof TRPCError) || error.code !== "FORBIDDEN") throw error;
    await assertActiveProviderDutyAccess(db, user, institutionId);
    const [assignment] = await db
      .select({ id: institutionDepartmentResponseCoordinators.id })
      .from(institutionDepartmentResponseCoordinators)
      .where(and(
        eq(institutionDepartmentResponseCoordinators.institutionId, institutionId),
        eq(institutionDepartmentResponseCoordinators.departmentId, departmentId),
        eq(institutionDepartmentResponseCoordinators.coordinatorUserId, user.id),
        eq(institutionDepartmentResponseCoordinators.assignmentStatus, "active"),
      ))
      .limit(1);
    if (!assignment) throw error;
    return { roleKey: "accepted_department_erco" as const };
  }
}

async function assertIersInstitutionReadAccess(
  db: DbClient,
  user: Pick<typeof users.$inferSelect, "id" | "role" | "email">,
  institutionId: number,
) {
  try {
    return await assertInstitutionProductRole(db, user, institutionId, "iers", IERS_READ_ROLES);
  } catch (error) {
    if (!(error instanceof TRPCError) || error.code !== "FORBIDDEN") throw error;
    try {
      const heads = await db
        .select({ departmentId: institutionDepartmentHeads.departmentId })
        .from(institutionDepartmentHeads)
        .where(and(
          eq(institutionDepartmentHeads.institutionalAccountId, institutionId),
          eq(institutionDepartmentHeads.userId, user.id),
          eq(institutionDepartmentHeads.assignmentStatus, "active"),
        ));
      if (heads.length > 0) return { roleKey: "department_head" as const, departmentIds: heads.map((head) => head.departmentId) };
    } catch (headError) {
      if (!isMissingTableError(headError, "institutionDepartmentHeads")) throw headError;
    }
    await assertActiveProviderDutyAccess(db, user, institutionId);
    const [assignment] = await db
      .select({ id: institutionDepartmentResponseCoordinators.id })
      .from(institutionDepartmentResponseCoordinators)
      .where(and(
        eq(institutionDepartmentResponseCoordinators.institutionId, institutionId),
        eq(institutionDepartmentResponseCoordinators.coordinatorUserId, user.id),
        eq(institutionDepartmentResponseCoordinators.assignmentStatus, "active"),
      ))
      .limit(1);
    if (!assignment) throw error;
    return { roleKey: "accepted_department_erco_read" as const };
  }
}

async function assertIersPoleRotaReadAccess(
  db: DbClient,
  user: Pick<typeof users.$inferSelect, "id" | "role" | "email">,
  institutionId: number,
  poleId: number,
) {
  try {
    return await assertInstitutionProductRole(db, user, institutionId, "iers", IERS_READ_ROLES);
  } catch (error) {
    if (!(error instanceof TRPCError) || error.code !== "FORBIDDEN") throw error;
    await assertActiveProviderDutyAccess(db, user, institutionId);
    const [assignment] = await db
      .select({ id: institutionDepartmentResponseCoordinators.id })
      .from(institutionDepartmentResponseCoordinators)
      .innerJoin(facilityDepartments, eq(facilityDepartments.id, institutionDepartmentResponseCoordinators.departmentId))
      .where(and(
        eq(institutionDepartmentResponseCoordinators.institutionId, institutionId),
        eq(institutionDepartmentResponseCoordinators.coordinatorUserId, user.id),
        eq(institutionDepartmentResponseCoordinators.assignmentStatus, "active"),
        eq(facilityDepartments.poleId, poleId),
      ))
      .limit(1);
    if (!assignment) throw error;
    return { roleKey: "accepted_department_erco_read" as const };
  }
}

type DepartmentNurseCandidateRow = {
  id: number;
  userId: number | null;
  staffName: string | null;
  staffEmail: string | null;
  staffPhone: string | null;
  staffRole: string | null;
  providerType: string | null;
  cadre: string | null;
  cadreOther: string | null;
  department: string | null;
  facilityDepartmentId: number | null;
  facilityLinkStatus: string | null;
  membershipStatus: string | null;
  profileDepartment: string | null;
  currentDepartment?: string | null;
  departmentMismatch?: boolean;
};

async function getProfileBackedRnCandidates(
  db: DbClient,
  institutionId: number,
  department: { id: number; departmentName: string },
  existingRows: DepartmentNurseCandidateRow[],
): Promise<DepartmentNurseCandidateRow[]> {
  const departmentSearchTerms = [
    department.departmentName,
    ...(DEPARTMENT_ALIASES[department.departmentName] ?? []),
  ]
    .map((value) => value.trim().toLowerCase())
    .filter((value, index, values) => value.length >= 3 && values.indexOf(value) === index);
  const profileDepartmentMatch = or(...departmentSearchTerms.map((term) => sql`LOWER(TRIM(${providerProfiles.department})) LIKE ${`%${term}%`}`));
  const cpdDepartmentMatch = or(...departmentSearchTerms.map((term) => sql`LOWER(TRIM(${cpdAttendees.department})) LIKE ${`%${term}%`}`));

  const profileRows = await db
    .select({
      userId: users.id,
      staffName: users.name,
      staffEmail: users.email,
      staffPhone: users.phone,
      providerType: users.providerType,
      cadre: users.cadre,
      cadreOther: users.cadreOther,
      department: providerProfiles.department,
      profileDepartment: providerProfiles.department,
      facilityDepartmentId: sql<number | null>`NULL`,
      membershipStatus: institutionMemberships.membershipStatus,
    })
    .from(providerProfiles)
    .innerJoin(users, eq(users.id, providerProfiles.userId))
    .innerJoin(careFacilities, eq(careFacilities.id, providerProfiles.facilityId))
    .leftJoin(institutionMemberships, and(
      eq(institutionMemberships.institutionalAccountId, institutionId),
      eq(institutionMemberships.userId, providerProfiles.userId),
    ))
    .where(and(
      eq(careFacilities.institutionalAccountId, institutionId),
      isNotNull(providerProfiles.department),
      profileDepartmentMatch,
    ));

  // CPD self-registration is also a legitimate institution-scoped discovery
  // source. Older registrations may predate a provider profile or facilityId,
  // so match the attendee email to the authenticated user and carry forward
  // the canonical CPD department identity when it exists. Membership and
  // linked-staff status remain separate assignment gates below.
  const cpdRows = await db
    .select({
      userId: users.id,
      staffName: users.name,
      staffEmail: users.email,
      staffPhone: users.phone,
      providerType: users.providerType,
      cadre: sql<string | null>`COALESCE(${users.cadre}, ${cpdAttendees.cadre})`,
      cadreOther: sql<string | null>`COALESCE(${users.cadreOther}, ${cpdAttendees.cadreOther})`,
      department: cpdAttendees.department,
      profileDepartment: providerProfiles.department,
      facilityDepartmentId: cpdAttendees.facilityDepartmentId,
      membershipStatus: institutionMemberships.membershipStatus,
    })
    .from(cpdAttendees)
    .innerJoin(users, sql`LOWER(TRIM(${users.email})) = LOWER(TRIM(${cpdAttendees.email}))`)
    .leftJoin(providerProfiles, eq(providerProfiles.userId, users.id))
    .leftJoin(institutionMemberships, and(
      eq(institutionMemberships.institutionalAccountId, institutionId),
      eq(institutionMemberships.userId, users.id),
    ))
    .where(and(
      eq(cpdAttendees.institutionalAccountId, institutionId),
      or(
        eq(cpdAttendees.facilityDepartmentId, department.id),
        and(isNull(cpdAttendees.facilityDepartmentId), cpdDepartmentMatch),
      ),
    ));

  const sourceRows = [...profileRows, ...cpdRows];
  const sourceByUserId = new Map<number, (typeof sourceRows)[number]>();
  for (const row of sourceRows) {
    const previous = sourceByUserId.get(row.userId);
    // Prefer a CPD source carrying a canonical department ID over an older
    // profile-only source with only free-text department data.
    if (!previous || (previous.facilityDepartmentId == null && row.facilityDepartmentId != null)) {
      sourceByUserId.set(row.userId, row);
    }
  }
  const uniqueSourceRows = [...sourceByUserId.values()];
  const sourceUserIds = uniqueSourceRows.map((row) => row.userId);
  const existingStaffRows = sourceUserIds.length > 0
    ? await db
      .select({ userId: institutionalStaffMembers.userId, facilityDepartmentId: institutionalStaffMembers.facilityDepartmentId, department: institutionalStaffMembers.department, removedAt: institutionalStaffMembers.removedAt })
      .from(institutionalStaffMembers)
      .where(and(
        eq(institutionalStaffMembers.institutionalAccountId, institutionId),
        inArray(institutionalStaffMembers.userId, sourceUserIds),
      ))
    : [];
  const existingUserIds = new Set(existingRows.filter((row) => providerBelongsToCanonicalDepartment(row, department)).flatMap((row) => row.userId == null ? [] : [row.userId]));
  const removedUserIds = new Set(existingStaffRows.filter((row) => row.removedAt != null).flatMap((row) => row.userId == null ? [] : [row.userId]));
  const currentStaffByUserId = new Map(existingStaffRows.filter((row) => row.userId != null).map((row) => [row.userId as number, row]));
  return uniqueSourceRows
    .filter((row) => {
      if (existingUserIds.has(row.userId) || removedUserIds.has(row.userId)) return false;
      return isRegisteredRnProfile(row) && providerBelongsToCanonicalDepartment(row, department);
    })
    .map((row) => {
      const currentStaff = currentStaffByUserId.get(row.userId);
      const departmentMismatch = currentStaff?.facilityDepartmentId != null && currentStaff.facilityDepartmentId !== department.id;
      return {
      id: -row.userId,
      userId: row.userId,
      staffName: row.staffName ?? "Registered nurse",
      staffEmail: row.staffEmail ?? "",
      staffPhone: row.staffPhone ?? null,
      staffRole: "nurse",
      providerType: row.providerType,
      cadre: row.cadre,
      cadreOther: row.cadreOther,
      department: row.department,
      facilityDepartmentId: row.facilityDepartmentId ?? null,
      facilityLinkStatus: "pending",
      membershipStatus: row.membershipStatus ?? null,
      profileDepartment: row.profileDepartment,
      currentDepartment: currentStaff?.department ?? null,
      departmentMismatch,
    };});
}

function providerBelongsToCanonicalDepartment(
  row: {
    facilityDepartmentId?: number | null;
    department?: string | null;
    profileDepartment?: string | null;
  },
  department: { id: number; departmentName: string },
) {
  // A canonical facility-department id is authoritative once present. An older
  // profile/free-text label must not leak a provider into another department.
  if (row.facilityDepartmentId != null) return row.facilityDepartmentId === department.id;
  const profileDepartment = row.profileDepartment?.trim();
  if (profileDepartment) return departmentLabelsMatch(profileDepartment, department.departmentName);
  return departmentLabelsMatch(row.department ?? "", department.departmentName);
}

async function resolveCanonicalDepartmentProvider(
  db: DbClient,
  institutionId: number,
  departmentId: number,
  preferredUserId?: number | null,
) {
  const [department] = await db
    .select({ id: facilityDepartments.id, departmentName: facilityDepartments.departmentName })
    .from(facilityDepartments)
    .where(and(
      eq(facilityDepartments.id, departmentId),
      eq(facilityDepartments.institutionId, institutionId),
      eq(facilityDepartments.isActive, true),
    ))
    .limit(1);
  if (!department) return null;
  const rows = await db
    .select({
      userId: institutionalStaffMembers.userId,
      staffRole: institutionalStaffMembers.staffRole,
      providerType: users.providerType,
      cadre: users.cadre,
      cadreOther: users.cadreOther,
      department: institutionalStaffMembers.department,
      facilityDepartmentId: institutionalStaffMembers.facilityDepartmentId,
      profileDepartment: providerProfiles.department,
    })
    .from(institutionalStaffMembers)
    .leftJoin(users, eq(users.id, institutionalStaffMembers.userId))
    .leftJoin(providerProfiles, eq(providerProfiles.userId, institutionalStaffMembers.userId))
    .innerJoin(institutionMemberships, and(
      eq(institutionMemberships.institutionalAccountId, institutionId),
      eq(institutionMemberships.userId, institutionalStaffMembers.userId),
    ))
    .where(and(
      eq(institutionalStaffMembers.institutionalAccountId, institutionId),
      eq(institutionalStaffMembers.facilityLinkStatus, "linked"),
      isNull(institutionalStaffMembers.removedAt),
      eq(institutionMemberships.membershipStatus, "active"),
      isNotNull(institutionalStaffMembers.userId),
    ))
    .orderBy(asc(institutionalStaffMembers.id));
  const providerIds = rows
    .filter((row) => isRegisteredRnProfile(row) && providerBelongsToCanonicalDepartment(row, department))
    .map((row) => row.userId)
    .filter((id): id is number => id != null);
  if (preferredUserId != null) {
    if (!providerIds.includes(preferredUserId)) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "The provider must be an active linked member of this canonical department." });
    }
    return preferredUserId;
  }
  return providerIds[0] ?? null;
}

function isMissingSchemaColumnError(error: unknown) {
  const candidate = error as { code?: string; message?: string };
  return candidate?.code === "ER_BAD_FIELD_ERROR" || candidate?.message?.includes("Unknown column") === true;
}

async function getOrderedPoleDepartments(db: DbClient, institutionId: number, poleId: number) {
  const predicates = and(
    eq(facilityDepartments.institutionId, institutionId),
    eq(facilityDepartments.poleId, poleId),
    eq(facilityDepartments.isActive, true),
    eq(facilityDepartments.requiresPole, true),
    isNotNull(facilityDepartments.confirmedAt),
  );
  try {
    return await db
      .select({
        id: facilityDepartments.id,
        departmentName: facilityDepartments.departmentName,
        poleId: facilityDepartments.poleId,
        poleSequence: facilityDepartments.poleSequence,
        createdAt: facilityDepartments.createdAt,
      })
      .from(facilityDepartments)
      .where(predicates)
      .orderBy(
        asc(sql`COALESCE(${facilityDepartments.poleSequence}, 2147483647)`),
        asc(facilityDepartments.createdAt),
        asc(facilityDepartments.id),
      );
  } catch (error) {
    if (!isMissingSchemaColumnError(error)) throw error;
    return db
      .select({
        id: facilityDepartments.id,
        departmentName: facilityDepartments.departmentName,
        poleId: facilityDepartments.poleId,
        poleSequence: sql<number | null>`NULL`,
        createdAt: facilityDepartments.createdAt,
      })
      .from(facilityDepartments)
      .where(predicates)
      .orderBy(asc(facilityDepartments.createdAt), asc(facilityDepartments.id));
  }
}

async function getPoleRotationAnchor(db: DbClient, institutionId: number, poleId: number): Promise<Date | null> {
  try {
    const [pole] = await db
      .select({ rotationAnchorDate: facilityPoles.rotationAnchorDate })
      .from(facilityPoles)
      .where(and(eq(facilityPoles.id, poleId), eq(facilityPoles.institutionId, institutionId)))
      .limit(1);
    return pole?.rotationAnchorDate ?? null;
  } catch (error) {
    if (!isMissingSchemaColumnError(error)) throw error;
    return null;
  }
}

async function ensurePoleRotationAnchor(db: DbClient, institutionId: number, poleId: number, anchorDate: Date) {
  try {
    const [pole] = await db
      .select({ id: facilityPoles.id, rotationAnchorDate: facilityPoles.rotationAnchorDate })
      .from(facilityPoles)
      .where(and(eq(facilityPoles.id, poleId), eq(facilityPoles.institutionId, institutionId)))
      .limit(1);
    if (!pole) throw new TRPCError({ code: "NOT_FOUND", message: "Pole not found in this institution." });
    if (!pole.rotationAnchorDate) {
      await db.update(facilityPoles).set({ rotationAnchorDate: mondayForDate(anchorDate) }).where(eq(facilityPoles.id, poleId));
    }
    return pole.rotationAnchorDate ?? asDateOnly(mondayForDate(anchorDate));
  } catch (error) {
    if (!isMissingSchemaColumnError(error)) throw error;
    return asDateOnly(mondayForDate(anchorDate));
  }
}

async function assertDepartmentBelongsToPole(db: DbClient, institutionId: number, departmentId: number, poleId: number) {
  const [department] = await db
    .select({ id: facilityDepartments.id, poleId: facilityDepartments.poleId, departmentName: facilityDepartments.departmentName, requiresPole: facilityDepartments.requiresPole })
    .from(facilityDepartments)
    .where(and(
      eq(facilityDepartments.id, departmentId),
      eq(facilityDepartments.institutionId, institutionId),
      eq(facilityDepartments.isActive, true),
      eq(facilityDepartments.requiresPole, true),
    ))
    .limit(1);
  if (!department) throw new TRPCError({ code: "NOT_FOUND", message: "Active confirmed IERS-operational department not found in this institution." });
  if (department.poleId !== poleId) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Assign this department to the selected pole before creating its ERTL or UTL rota." });
  }
  return department;
}

async function refreshPoleErtlAssignments(db: DbClient, institutionId: number, poleId: number) {
  const [departments, rotationAnchorDate] = await Promise.all([
    getOrderedPoleDepartments(db, institutionId, poleId),
    getPoleRotationAnchor(db, institutionId, poleId),
  ]);
  const rotations = await db.select({
    id: ertlWeeklyRotations.id,
    departmentId: ertlWeeklyRotations.departmentId,
    assignmentStatus: ertlWeeklyRotations.assignmentStatus,
    acceptedAt: ertlWeeklyRotations.acceptedAt,
    startDate: ertlWeeklyRotations.startDate,
    endDate: ertlWeeklyRotations.endDate,
  }).from(ertlWeeklyRotations).where(and(
    eq(ertlWeeklyRotations.institutionId, institutionId),
    eq(ertlWeeklyRotations.poleId, poleId),
  ));
  for (const rotation of rotations) {
    if (rotation.assignmentStatus === "active" || rotation.acceptedAt != null) continue;
    const derivedDepartmentId = derivePoleRotationDepartmentId(departments, rotationAnchorDate, rotation.startDate);
    if (derivedDepartmentId == null) continue;
    if (rotation.departmentId !== derivedDepartmentId) {
      await db.update(ertlWeeklyRotations).set({
        departmentId: derivedDepartmentId,
        ertlUserId: null,
        assignmentStatus: "unassigned",
        acceptedAt: null,
        declinedAt: null,
        declineReason: null,
      }).where(eq(ertlWeeklyRotations.id, rotation.id));
    }
    const shifts = await db.select({ id: shiftUtlRosters.id, shiftDate: shiftUtlRosters.shiftDate }).from(shiftUtlRosters).where(and(
      eq(shiftUtlRosters.institutionId, institutionId),
      eq(shiftUtlRosters.poleId, poleId),
      gte(shiftUtlRosters.shiftDate, rotation.startDate),
      lte(shiftUtlRosters.shiftDate, rotation.endDate),
    ));
    for (const shift of shifts) {
      const shiftDepartmentId = derivePoleRotationDepartmentId(departments, rotationAnchorDate, shift.shiftDate);
      await db.update(shiftUtlRosters).set({ isShiftErtl: shiftDepartmentId === derivedDepartmentId }).where(eq(shiftUtlRosters.id, shift.id));
    }
  }
}

async function ensureMonthlyUtlShifts(
  db: DbClient,
  input: { institutionId: number; poleId: number; departmentId: number; monthStart: string; providerUserId: number | null; monthlyUtlRotationId: number; actorUserId: number },
) {
  const [poleDepartments, rotationAnchorDate] = await Promise.all([
    getOrderedPoleDepartments(db, input.institutionId, input.poleId),
    getPoleRotationAnchor(db, input.institutionId, input.poleId),
  ]);
  let generatedShifts = 0;
  for (const row of getMonthlyShiftRows(input.monthStart)) {
    const derivedErtlDepartmentId = derivePoleRotationDepartmentId(poleDepartments, rotationAnchorDate, row.shiftDate);
    const preset = shiftTemplateForType(row.shiftType);
    const [existing] = await db.select().from(shiftUtlRosters).where(and(
      eq(shiftUtlRosters.institutionId, input.institutionId),
      eq(shiftUtlRosters.poleId, input.poleId),
      eq(shiftUtlRosters.departmentId, input.departmentId),
      eq(shiftUtlRosters.shiftDate, new Date(row.shiftDate)),
      eq(shiftUtlRosters.shiftType, row.shiftType),
    )).limit(1);

    if (existing) {
      const monthlyOwned = existing.monthlyUtlRotationId === input.monthlyUtlRotationId;
      const nextProviderUserId = input.providerUserId;
      const providerChanged = monthlyOwned && nextProviderUserId != null && existing.utlUserId !== nextProviderUserId;
      if (providerChanged && nextProviderUserId != null) {
        await db.update(shiftUtlRosters).set({
          utlUserId: nextProviderUserId,
          shiftStartTime: preset.startTime,
          shiftEndTime: preset.endTime,
          shiftEndDayOffset: preset.endDayOffset,
          isShiftErtl: derivedErtlDepartmentId === input.departmentId,
          assignmentStatus: "pending_acceptance",
          acceptedAt: null,
          declinedAt: null,
          declineReason: null,
          readinessSignOffAt: null,
          readinessSignedOffByUserId: null,
          readinessNote: null,
        }).where(eq(shiftUtlRosters.id, existing.id));
        await projectUtlRosterReassignment(db, {
          roster: existing,
          nextProviderUserId,
          nextShiftStartTime: preset.startTime,
          nextShiftEndTime: preset.endTime,
          nextShiftEndDayOffset: preset.endDayOffset,
          actorUserId: input.actorUserId,
        });
      } else {
        await db.update(shiftUtlRosters).set({
          isShiftErtl: derivedErtlDepartmentId === input.departmentId,
        }).where(eq(shiftUtlRosters.id, existing.id));
      }
      const [updated] = await db.select().from(shiftUtlRosters).where(eq(shiftUtlRosters.id, existing.id)).limit(1);
      if (updated) await ensurePublishedTeamForLegacyUtlRoster(db, { roster: updated, actorUserId: input.actorUserId });
      continue;
    }

    if (input.providerUserId == null) continue;
    await db.insert(shiftUtlRosters).values({
      institutionId: input.institutionId,
      poleId: input.poleId,
      departmentId: input.departmentId,
      shiftDate: new Date(row.shiftDate),
      shiftType: row.shiftType,
      shiftStartTime: preset.startTime,
      shiftEndTime: preset.endTime,
      shiftEndDayOffset: preset.endDayOffset,
      shiftTemplateId: null,
      utlUserId: input.providerUserId,
      isShiftErtl: derivedErtlDepartmentId === input.departmentId,
      monthlyUtlRotationId: input.monthlyUtlRotationId,
      assignmentStatus: "pending_acceptance",
      status: "active",
    });
    const [created] = await db.select().from(shiftUtlRosters).where(and(
      eq(shiftUtlRosters.institutionId, input.institutionId),
      eq(shiftUtlRosters.poleId, input.poleId),
      eq(shiftUtlRosters.departmentId, input.departmentId),
      eq(shiftUtlRosters.shiftDate, new Date(row.shiftDate)),
      eq(shiftUtlRosters.shiftType, row.shiftType),
      eq(shiftUtlRosters.monthlyUtlRotationId, input.monthlyUtlRotationId),
    )).orderBy(desc(shiftUtlRosters.id)).limit(1);
    if (created) {
      await ensurePublishedTeamForLegacyUtlRoster(db, { roster: created, actorUserId: input.actorUserId });
      generatedShifts += 1;
    }
  }
  return generatedShifts;
}

async function ensureProviderMembershipForStaff(
  db: DbClient,
  input: {
    institutionId: number;
    staffMemberId: number;
    email: string;
    responsibilityRole?: "executive" | "erc_chair" | "erc_member" | "er_coordinator" | "unit_team_leader" | "ert_leader" | "ert_responder" | "general_staff";
  },
) {
  const email = input.email.trim().toLowerCase();
  const [existingUser] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  const [existingMembership] = await db
    .select({ id: institutionMemberships.id })
    .from(institutionMemberships)
    .where(and(
      eq(institutionMemberships.institutionalAccountId, input.institutionId),
      eq(institutionMemberships.invitedEmail, email),
    ))
    .limit(1);

  const membershipStatus = existingUser ? "active" : "invited";
  const responsibilityRole = input.responsibilityRole ?? "general_staff";
  if (existingMembership) {
    await db
      .update(institutionMemberships)
      .set({
        userId: existingUser?.id ?? null,
        staffMemberId: input.staffMemberId,
        membershipStatus,
        responsibilityRole,
        acceptedAt: existingUser ? new Date() : null,
        updatedAt: new Date(),
      })
      .where(eq(institutionMemberships.id, existingMembership.id));
  } else {
    await db.insert(institutionMemberships).values({
      institutionalAccountId: input.institutionId,
      userId: existingUser?.id ?? null,
      invitedEmail: email,
      staffMemberId: input.staffMemberId,
      membershipStatus,
      responsibilityRole,
      acceptedAt: existingUser ? new Date() : null,
    });
  }

  if (existingUser) {
    await db
      .update(institutionalStaffMembers)
      .set({ userId: existingUser.id, facilityLinkStatus: "linked", updatedAt: new Date() })
      .where(eq(institutionalStaffMembers.id, input.staffMemberId));
  }
}

async function assertApprovedInstructorUser(db: DbClient, userId: number) {
  const [row] = await db
    .select({
      id: users.id,
      instructorApprovedAt: users.instructorApprovedAt,
      instructorCertifiedAt: users.instructorCertifiedAt,
      instructorNumber: users.instructorNumber,
      name: users.name,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!row) {
    throw new TRPCError({ code: "NOT_FOUND", message: "User not found." });
  }
  if (!row.instructorCertifiedAt || !row.instructorNumber) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message:
        "That account has not completed the Paeds Resus Instructor Course and certification yet. They must enroll, complete modules, and receive their instructor number before assignment.",
    });
  }
  if (!row.instructorApprovedAt) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message:
        "That account is not approved as an instructor. Ask a platform admin to approve them under Admin → Reports.",
    });
  }
  return row;
}

/**
 * Blocks assigning an instructor to a session that overlaps another one
 * they're already assigned to. Extracted 2026-08-02 to
 * server/lib/instructor-double-booking-guard.ts -- see that file for the
 * full explanation. Kept as a local alias here so every existing call site
 * below doesn't need touching.
 */
const assertNoInstructorDoubleBooking = assertNoInstructorDoubleBookingShared;

async function assertTrainingScheduleForInstitution(
  db: DbClient,
  institutionId: number,
  trainingScheduleId: number
) {
  const rows = await db
    .select({ id: trainingSchedules.id })
    .from(trainingSchedules)
    .where(
      and(
        eq(trainingSchedules.id, trainingScheduleId),
        eq(trainingSchedules.institutionalAccountId, institutionId)
      )
    )
    .limit(1);
  if (!rows.length) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Training session not found for this institution.",
    });
  }
}

async function syncTrainingScheduleEnrolledCount(db: DbClient, trainingScheduleId: number) {
  const [row] = await db
    .select({ n: count() })
    .from(trainingAttendance)
    .where(
      and(
        eq(trainingAttendance.trainingScheduleId, trainingScheduleId),
        inArray(trainingAttendance.attendanceStatus, ["registered", "attended", "absent"])
      )
    );
  const n = Number(row?.n ?? 0);
  await db
    .update(trainingSchedules)
    .set({ enrolledCount: n, updatedAt: new Date() })
    .where(eq(trainingSchedules.id, trainingScheduleId));
}

async function syncIersCompetencyRecord(
  db: DbClient,
  input: {
    trainingAttendanceId: number;
    trainingScheduleId: number;
    staffMemberId: number;
    attendanceStatus: "registered" | "attended" | "absent" | "cancelled";
  },
) {
  const [session] = await db
    .select({
      institutionalAccountId: trainingSchedules.institutionalAccountId,
      programType: courses.programType,
    })
    .from(trainingSchedules)
    .innerJoin(courses, eq(trainingSchedules.courseId, courses.id))
    .where(eq(trainingSchedules.id, input.trainingScheduleId))
    .limit(1);

  if (!session?.institutionalAccountId || !["bls", "acls", "pals", "fellowship"].includes(session.programType)) return;

  const competencyStatus = input.attendanceStatus === "attended"
    ? "attended"
    : input.attendanceStatus === "absent"
      ? "absent"
      : input.attendanceStatus === "cancelled"
        ? "cancelled"
        : "pending";
  const [existing] = await db
    .select({ id: iersCompetencyRecords.id, competencyStatus: iersCompetencyRecords.competencyStatus })
    .from(iersCompetencyRecords)
    .where(eq(iersCompetencyRecords.trainingAttendanceId, input.trainingAttendanceId))
    .limit(1);

  if (existing) {
    await db
      .update(iersCompetencyRecords)
      .set({
        competencyStatus,
        ...(competencyStatus === "attended" ? {} : { verifiedByUserId: null, verifiedAt: null, verificationNotes: null }),
        updatedAt: new Date(),
      })
      .where(eq(iersCompetencyRecords.id, existing.id));
    return;
  }

  await db.insert(iersCompetencyRecords).values({
    institutionalAccountId: session.institutionalAccountId,
    staffMemberId: input.staffMemberId,
    trainingScheduleId: input.trainingScheduleId,
    trainingAttendanceId: input.trainingAttendanceId,
    programType: session.programType as "bls" | "acls" | "pals" | "fellowship",
    competencyStatus,
  });
}

/**
 * Keep institutional staff roster fields loosely aligned with the latest session attendance.
 * Roster rows use a single enrollment/certification pair (not per-program); see product docs for multi-program roadmap.
 */
async function syncLegacyActionLogsIntoIers(db: DbClient, institutionId: number, fallbackCreatedByUserId: number) {
  const legacyRows = await db
    .select({
      id: institutionalActionLogs.id,
      createdByUserId: institutionalActionLogs.createdByUserId,
      gapIdentified: institutionalActionLogs.gapIdentified,
      systemChange: institutionalActionLogs.systemChange,
      status: institutionalActionLogs.status,
      careSignalEventId: institutionalActionLogs.careSignalEventId,
      codeSignalEventId: institutionalActionLogs.codeSignalEventId,
      notes: institutionalActionLogs.notes,
      createdAt: institutionalActionLogs.createdAt,
      updatedAt: institutionalActionLogs.updatedAt,
    })
    .from(institutionalActionLogs)
    .leftJoin(iersActionItems, eq(iersActionItems.legacyActionLogId, institutionalActionLogs.id))
    .where(and(
      eq(institutionalActionLogs.institutionalAccountId, institutionId),
      isNull(iersActionItems.id),
    ))
    .orderBy(asc(institutionalActionLogs.id))
    .limit(500);

  for (const legacy of legacyRows) {
    const sourceType = legacy.careSignalEventId != null
      ? "care_signal"
      : legacy.codeSignalEventId != null
        ? "code_signal"
        : "manual";
    const status = legacy.status === "completed" ? "awaiting_verification" : legacy.status;
    const gapDescription = [
      legacy.gapIdentified.trim(),
      `System change: ${legacy.systemChange.trim()}`,
      legacy.notes?.trim() ? `Notes: ${legacy.notes.trim()}` : null,
    ].filter(Boolean).join("\\n\\n");

    await db.insert(iersActionItems).values({
      institutionId,
      sourceType,
      sourceId: legacy.careSignalEventId ?? legacy.codeSignalEventId ?? legacy.id,
      legacyActionLogId: legacy.id,
      title: legacy.gapIdentified.trim().slice(0, 255),
      gapDescription,
      priority: "medium",
      status,
      closureNote: legacy.status === "completed" ? legacy.systemChange.trim() : null,
      createdByUserId: legacy.createdByUserId ?? fallbackCreatedByUserId,
      createdAt: legacy.createdAt,
      updatedAt: legacy.updatedAt,
    });
  }
}

async function syncStaffRosterFromSessionAttendance(
  db: DbClient,
  staffMemberId: number,
  attendanceStatus: "registered" | "attended" | "absent" | "cancelled"
) {
  const [row] = await db
    .select()
    .from(institutionalStaffMembers)
    .where(eq(institutionalStaffMembers.id, staffMemberId))
    .limit(1);
  if (!row) return;

  const patch: {
    updatedAt: Date;
    enrollmentStatus?: (typeof institutionalStaffMembers.$inferSelect)["enrollmentStatus"];
    enrollmentDate?: Date;
    completionDate?: Date;
    certificationStatus?: (typeof institutionalStaffMembers.$inferSelect)["certificationStatus"];
  } = { updatedAt: new Date() };

  if (attendanceStatus === "registered" && row.enrollmentStatus === "pending") {
    patch.enrollmentStatus = "enrolled";
    patch.enrollmentDate = row.enrollmentDate ?? new Date();
  }
  if (attendanceStatus === "attended") {
    patch.enrollmentStatus = "completed";
    patch.completionDate = new Date();
    if (row.certificationStatus === "not_started") {
      patch.certificationStatus = "in_progress";
    }
  }

  if (Object.keys(patch).length > 1) {
    await db.update(institutionalStaffMembers).set(patch).where(eq(institutionalStaffMembers.id, staffMemberId));
  }
}

export const institutionRouter = router({
  /** Primary institution for the signed-in user (most recently created if multiple). */
  getMyInstitution: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Database connection failed",
      });
    }

    const institutionIds = await getAdministeredInstitutionIds(db, ctx.user.id);
    const rows = institutionIds.length
      ? await db
          .select()
          .from(institutionalAccounts)
          .where(inArray(institutionalAccounts.id, institutionIds))
          .orderBy(desc(institutionalAccounts.id))
      : [];

    return {
      institution: rows[0] ?? null,
      institutions: rows,
    };
  }),

  /**
   * Provider-facing institution memberships and pending invitations. This is
   * the bridge between the provider workspace and institution operations: a
   * provider sees only memberships addressed to their own account/email.
   */
  getMyMemberships: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed" });

    const email = ctx.user.email?.trim().toLowerCase();
    const membershipFilter = email
      ? or(eq(institutionMemberships.userId, ctx.user.id), eq(institutionMemberships.invitedEmail, email))
      : eq(institutionMemberships.userId, ctx.user.id);

    let rows;
    try {
      rows = await db
        .select({
          id: institutionMemberships.id,
          institutionalAccountId: institutionMemberships.institutionalAccountId,
          userId: institutionMemberships.userId,
          invitedEmail: institutionMemberships.invitedEmail,
          membershipStatus: institutionMemberships.membershipStatus,
          responsibilityRole: institutionMemberships.responsibilityRole,
          staffMemberId: institutionMemberships.staffMemberId,
          acceptedAt: institutionMemberships.acceptedAt,
          companyName: institutionalAccounts.companyName,
          staffName: institutionalStaffMembers.staffName,
          staffRole: institutionalStaffMembers.staffRole,
          department: institutionalStaffMembers.department,
        })
        .from(institutionMemberships)
        .innerJoin(institutionalAccounts, eq(institutionalAccounts.id, institutionMemberships.institutionalAccountId))
        .leftJoin(institutionalStaffMembers, eq(institutionalStaffMembers.id, institutionMemberships.staffMemberId))
        .where(membershipFilter)
        .orderBy(desc(institutionMemberships.updatedAt));
    } catch (error) {
      if (isMissingTableError(error, "institutionMemberships")) return [];
      throw error;
    }

    return rows.map((row) => ({
      ...row,
      isPendingInvite: row.userId == null && row.membershipStatus === "invited",
    }));
  }),

  /** Institution admin: invite or link a provider into the shared IERS model. */
  inviteProvider: protectedProcedure
    .input(z.object({
      institutionId: z.number().int().positive(),
      email: z.string().email(),
      staffName: z.string().trim().min(2).max(255),
      staffPhone: z.string().trim().max(20).optional(),
      staffRole: z.enum(["doctor", "nurse", "paramedic", "midwife", "lab_tech", "respiratory_therapist", "support_staff", "other"]).default("other"),
      responsibilityRole: z.enum(["executive", "erc_chair", "erc_member", "er_coordinator", "unit_team_leader", "ert_leader", "ert_responder", "general_staff"]).default("general_staff"),
      department: z.string().trim().max(255).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed" });
      await assertInstitutionAccess(db, ctx.user, input.institutionId);

      const email = input.email.trim().toLowerCase();
      const [existingUser] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      const [existingStaff] = await db
        .select({ id: institutionalStaffMembers.id })
        .from(institutionalStaffMembers)
        .where(and(
          eq(institutionalStaffMembers.institutionalAccountId, input.institutionId),
          eq(institutionalStaffMembers.staffEmail, email),
        ))
        .limit(1);

      let staffMemberId = existingStaff?.id;
      if (!staffMemberId) {
        const staffInsert = await db.insert(institutionalStaffMembers).values({
          institutionalAccountId: input.institutionId,
          userId: existingUser?.id ?? null,
          staffName: input.staffName,
          staffEmail: email,
          staffPhone: input.staffPhone || null,
          staffRole: input.staffRole,
          department: input.department || null,
          governanceRole: input.responsibilityRole,
          enrollmentStatus: "pending",
          facilityLinkStatus: "pending",
        });
        staffMemberId = (staffInsert as unknown as { insertId: number }).insertId;
      }

      const [existingMembership] = await db
        .select({ id: institutionMemberships.id })
        .from(institutionMemberships)
        .where(and(
          eq(institutionMemberships.institutionalAccountId, input.institutionId),
          eq(institutionMemberships.invitedEmail, email),
        ))
        .limit(1);

      if (existingMembership) {
        await db
          .update(institutionMemberships)
          .set({
            userId: existingUser?.id ?? null,
            staffMemberId,
            responsibilityRole: input.responsibilityRole,
            membershipStatus: "invited",
            invitedByUserId: ctx.user.id,
            invitedAt: new Date(),
            acceptedAt: null,
            suspendedAt: null,
            endedAt: null,
            updatedAt: new Date(),
          })
          .where(eq(institutionMemberships.id, existingMembership.id));
        return { success: true, membershipId: existingMembership.id, status: "reinvited" as const };
      }

      const membershipInsert = await db.insert(institutionMemberships).values({
        institutionalAccountId: input.institutionId,
        userId: existingUser?.id ?? null,
        invitedEmail: email,
        staffMemberId,
        responsibilityRole: input.responsibilityRole,
        membershipStatus: "invited",
        invitedByUserId: ctx.user.id,
      });

      return {
        success: true,
        membershipId: (membershipInsert as unknown as { insertId: number }).insertId,
        status: "invited" as const,
      };
    }),

  /** Provider: accept an invitation addressed to the authenticated email. */
  acceptMembershipInvite: protectedProcedure
    .input(z.object({ membershipId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed" });
      if (!ctx.user.email) throw new TRPCError({ code: "BAD_REQUEST", message: "Your account has no email address." });

      const email = ctx.user.email.trim().toLowerCase();
      const [membership] = await db
        .select()
        .from(institutionMemberships)
        .where(and(
          eq(institutionMemberships.id, input.membershipId),
          eq(institutionMemberships.invitedEmail, email),
          eq(institutionMemberships.membershipStatus, "invited"),
        ))
        .limit(1);

      if (!membership) throw new TRPCError({ code: "NOT_FOUND", message: "No matching institution invitation found." });

      await db
        .update(institutionMemberships)
        .set({ userId: ctx.user.id, membershipStatus: "active", acceptedAt: new Date(), updatedAt: new Date() })
        .where(eq(institutionMemberships.id, membership.id));

      if (membership.staffMemberId) {
        await db
          .update(institutionalStaffMembers)
          .set({ userId: ctx.user.id, facilityLinkStatus: "linked", updatedAt: new Date() })
          .where(eq(institutionalStaffMembers.id, membership.staffMemberId));
      }

      return { success: true, institutionalAccountId: membership.institutionalAccountId };
    }),

  /** Institution admin: change a provider's IERS responsibility role. */
  updateProviderResponsibilityRole: protectedProcedure
    .input(z.object({
      institutionId: z.number().int().positive(),
      membershipId: z.number().int().positive(),
      responsibilityRole: z.enum(["executive", "erc_chair", "erc_member", "er_coordinator", "unit_team_leader", "ert_leader", "ert_responder", "general_staff"]),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed" });
      await assertInstitutionAccess(db, ctx.user, input.institutionId);

      const [membership] = await db
        .select({ id: institutionMemberships.id, staffMemberId: institutionMemberships.staffMemberId })
        .from(institutionMemberships)
        .where(and(
          eq(institutionMemberships.id, input.membershipId),
          eq(institutionMemberships.institutionalAccountId, input.institutionId),
        ))
        .limit(1);
      if (!membership) throw new TRPCError({ code: "NOT_FOUND", message: "Institution membership not found." });

      await db
        .update(institutionMemberships)
        .set({ responsibilityRole: input.responsibilityRole, updatedAt: new Date() })
        .where(eq(institutionMemberships.id, membership.id));
      if (membership.staffMemberId) {
        await db
          .update(institutionalStaffMembers)
          .set({ governanceRole: input.responsibilityRole, updatedAt: new Date() })
          .where(eq(institutionalStaffMembers.id, membership.staffMemberId));
      }
      return { success: true };
    }),

  /** Institution admin: suspend or end provider participation without deleting history. */
  updateProviderMembershipStatus: protectedProcedure
    .input(z.object({
      institutionId: z.number().int().positive(),
      membershipId: z.number().int().positive(),
      status: z.enum(["active", "suspended", "ended"]),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed" });
      await assertInstitutionAccess(db, ctx.user, input.institutionId);
      const [membership] = await db
        .select({ id: institutionMemberships.id })
        .from(institutionMemberships)
        .where(and(
          eq(institutionMemberships.id, input.membershipId),
          eq(institutionMemberships.institutionalAccountId, input.institutionId),
        ))
        .limit(1);
      if (!membership) throw new TRPCError({ code: "NOT_FOUND", message: "Institution membership not found." });

      await db
        .update(institutionMemberships)
        .set({
          membershipStatus: input.status,
          suspendedAt: input.status === "suspended" ? new Date() : null,
          endedAt: input.status === "ended" ? new Date() : null,
          updatedAt: new Date(),
        })
        .where(eq(institutionMemberships.id, input.membershipId));
      return { success: true, status: input.status };
    }),

  /** Institution account admin: remove a person from this institution without deleting history. */
  removeInstitutionMember: protectedProcedure
    .input(z.object({
      institutionId: z.number().int().positive(),
      membershipId: z.number().int().positive(),
      reason: z.string().trim().min(10).max(1000),
      mismatchReportId: z.number().int().positive().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed" });
      await assertInstitutionAccountScope(db, ctx.user, input.institutionId, ["account_admin"], { allowInstitutionAdmin: true });

      const [membership] = await db
        .select({
          id: institutionMemberships.id,
          userId: institutionMemberships.userId,
          staffMemberId: institutionMemberships.staffMemberId,
          invitedEmail: institutionMemberships.invitedEmail,
          membershipStatus: institutionMemberships.membershipStatus,
        })
        .from(institutionMemberships)
        .where(and(
          eq(institutionMemberships.id, input.membershipId),
          eq(institutionMemberships.institutionalAccountId, input.institutionId),
        ))
        .limit(1);
      if (!membership) throw new TRPCError({ code: "NOT_FOUND", message: "Institution membership not found." });
      if (membership.userId === ctx.user.id) throw new TRPCError({ code: "FORBIDDEN", message: "You cannot remove your own institutional access." });
      if (membership.membershipStatus === "ended") return { success: true, status: "ended" as const, alreadyEnded: true };

      const staffIdentityPredicates = [
        membership.staffMemberId != null ? eq(institutionalStaffMembers.id, membership.staffMemberId) : sql`FALSE`,
        membership.userId != null ? eq(institutionalStaffMembers.userId, membership.userId) : sql`FALSE`,
        eq(institutionalStaffMembers.staffEmail, membership.invitedEmail),
      ];
      const [matchedStaff] = await db
        .select({ id: institutionalStaffMembers.id })
        .from(institutionalStaffMembers)
        .where(and(
          eq(institutionalStaffMembers.institutionalAccountId, input.institutionId),
          or(...staffIdentityPredicates),
        ))
        .limit(1);
      const resolvedStaffMemberId = membership.staffMemberId ?? matchedStaff?.id ?? null;

      const adminRows = await db
        .select({ userId: institutionalAccountAdmins.userId })
        .from(institutionalAccountAdmins)
        .where(and(
          eq(institutionalAccountAdmins.institutionalAccountId, input.institutionId),
          membership.userId != null ? eq(institutionalAccountAdmins.userId, membership.userId) : sql`FALSE`,
        ));
      const institution = await db
        .select({ ownerUserId: institutionalAccounts.userId })
        .from(institutionalAccounts)
        .where(eq(institutionalAccounts.id, input.institutionId))
        .limit(1);
      const targetIsAdmin = membership.userId != null && (adminRows.length > 0 || institution[0]?.ownerUserId === membership.userId);
      if (targetIsAdmin) {
        const adminCount = await countInstitutionAdmins(db, input.institutionId);
        if (adminCount <= 2) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Invite and activate a replacement administrator before removing this person. The institution must retain at least two administrator contacts." });
        }
      }

      const now = new Date();
      await db.transaction(async (tx) => {
        await tx
          .update(institutionMemberships)
          .set({ membershipStatus: "ended", endedAt: now, updatedAt: now })
          .where(and(
            eq(institutionMemberships.id, membership.id),
            eq(institutionMemberships.institutionalAccountId, input.institutionId),
          ));
        if (resolvedStaffMemberId) {
          await tx
            .update(institutionalStaffMembers)
            .set({ removedAt: now, removedByUserId: ctx.user.id, removalReason: input.reason, facilityLinkStatus: "rejected", updatedAt: now })
            .where(and(
              eq(institutionalStaffMembers.id, resolvedStaffMemberId),
              eq(institutionalStaffMembers.institutionalAccountId, input.institutionId),
            ));
        }
        if (membership.userId != null) {
          await tx
            .update(institutionProductRoles)
            .set({ roleStatus: "ended", endedAt: now, updatedAt: now })
            .where(and(
              eq(institutionProductRoles.institutionalAccountId, input.institutionId),
              eq(institutionProductRoles.userId, membership.userId),
              or(eq(institutionProductRoles.roleStatus, "active"), eq(institutionProductRoles.roleStatus, "suspended")),
            ));
          await tx
            .update(institutionAccountScopes)
            .set({ scopeStatus: "ended", endedAt: now, updatedAt: now })
            .where(and(
              eq(institutionAccountScopes.institutionalAccountId, input.institutionId),
              eq(institutionAccountScopes.userId, membership.userId),
              or(eq(institutionAccountScopes.scopeStatus, "active"), eq(institutionAccountScopes.scopeStatus, "suspended")),
            ));
          await tx
            .update(institutionDepartmentResponseCoordinators)
            .set({ assignmentStatus: "ended", updatedAt: now })
            .where(and(
              eq(institutionDepartmentResponseCoordinators.institutionId, input.institutionId),
              or(eq(institutionDepartmentResponseCoordinators.coordinatorUserId, membership.userId), eq(institutionDepartmentResponseCoordinators.backupUserId, membership.userId)),
              or(eq(institutionDepartmentResponseCoordinators.assignmentStatus, "active"), eq(institutionDepartmentResponseCoordinators.assignmentStatus, "pending_acceptance")),
            ));
          await tx
            .update(ertlWeeklyRotations)
            .set({ assignmentStatus: "ended" })
            .where(and(
              eq(ertlWeeklyRotations.institutionId, input.institutionId),
              eq(ertlWeeklyRotations.ertlUserId, membership.userId),
              gte(ertlWeeklyRotations.endDate, now),
              or(eq(ertlWeeklyRotations.assignmentStatus, "unassigned"), eq(ertlWeeklyRotations.assignmentStatus, "pending_acceptance"), eq(ertlWeeklyRotations.assignmentStatus, "active")),
            ));
          await tx
            .update(monthlyUtlRotations)
            .set({ assignmentStatus: "ended", providerUserId: null, updatedAt: now })
            .where(and(
              eq(monthlyUtlRotations.institutionId, input.institutionId),
              eq(monthlyUtlRotations.providerUserId, membership.userId),
              gte(monthlyUtlRotations.monthStart, now),
              or(eq(monthlyUtlRotations.assignmentStatus, "unassigned"), eq(monthlyUtlRotations.assignmentStatus, "pending_acceptance"), eq(monthlyUtlRotations.assignmentStatus, "active")),
            ));
          await tx
            .update(shiftUtlRosters)
            .set({ assignmentStatus: "ended", status: "absent" })
            .where(and(
              eq(shiftUtlRosters.institutionId, input.institutionId),
              eq(shiftUtlRosters.utlUserId, membership.userId),
              gte(shiftUtlRosters.shiftDate, now),
              or(eq(shiftUtlRosters.assignmentStatus, "unassigned"), eq(shiftUtlRosters.assignmentStatus, "pending_acceptance"), eq(shiftUtlRosters.assignmentStatus, "active")),
            ));
        }
        await tx.insert(institutionMembershipEvents).values({
          institutionalAccountId: input.institutionId,
          membershipId: membership.id,
          staffMemberId: resolvedStaffMemberId,
          userId: membership.userId,
          eventType: "removed",
          previousMembershipStatus: membership.membershipStatus,
          currentMembershipStatus: "ended",
          actorUserId: ctx.user.id,
          reason: input.reason,
          occurredAt: now,
        });
      });
      if (input.mismatchReportId) {
        await db.update(institutionalActionLogs)
          .set({ status: "completed", updatedAt: now })
          .where(and(
            eq(institutionalActionLogs.id, input.mismatchReportId),
            eq(institutionalActionLogs.institutionalAccountId, input.institutionId),
            eq(institutionalActionLogs.status, "open"),
          ));
      }

      return { success: true, status: "ended" as const, alreadyEnded: false, removedEmail: membership.invitedEmail };
    }),

  /** Institution account admin: retire a roster-only/rejected staff row that has no membership record. */
  retireInstitutionStaffRecord: protectedProcedure
    .input(z.object({
      institutionId: z.number().int().positive(),
      staffMemberId: z.number().int().positive(),
      reason: z.string().trim().min(10).max(1000),
      mismatchReportId: z.number().int().positive().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed" });
      await assertInstitutionAccountScope(db, ctx.user, input.institutionId, ["account_admin"], { allowInstitutionAdmin: true });

      const [staff] = await db
        .select({
          id: institutionalStaffMembers.id,
          userId: institutionalStaffMembers.userId,
          staffName: institutionalStaffMembers.staffName,
          staffEmail: institutionalStaffMembers.staffEmail,
          removedAt: institutionalStaffMembers.removedAt,
        })
        .from(institutionalStaffMembers)
        .where(and(
          eq(institutionalStaffMembers.id, input.staffMemberId),
          eq(institutionalStaffMembers.institutionalAccountId, input.institutionId),
        ))
        .limit(1);
      if (!staff) throw new TRPCError({ code: "NOT_FOUND", message: "Institution staff record not found." });
      if (staff.userId === ctx.user.id) throw new TRPCError({ code: "FORBIDDEN", message: "You cannot retire your own institutional roster record." });
      if (staff.removedAt) return { success: true as const, status: "removed" as const, alreadyRemoved: true as const };

      const membershipTarget = staff.userId != null
        ? or(eq(institutionMemberships.staffMemberId, staff.id), eq(institutionMemberships.userId, staff.userId))
        : eq(institutionMemberships.staffMemberId, staff.id);
      const [membership] = await db
        .select({ id: institutionMemberships.id })
        .from(institutionMemberships)
        .where(and(
          eq(institutionMemberships.institutionalAccountId, input.institutionId),
          membershipTarget,
          or(
            eq(institutionMemberships.membershipStatus, "invited"),
            eq(institutionMemberships.membershipStatus, "active"),
            eq(institutionMemberships.membershipStatus, "suspended"),
          ),
        ))
        .limit(1);
      if (membership) throw new TRPCError({ code: "BAD_REQUEST", message: "This staff record has an institution membership. Use the normal member removal workflow instead." });

      const now = new Date();
      await db.transaction(async (tx) => {
        await tx
          .update(institutionalStaffMembers)
          .set({ removedAt: now, removedByUserId: ctx.user.id, removalReason: input.reason, facilityLinkStatus: "rejected", updatedAt: now })
          .where(and(
            eq(institutionalStaffMembers.id, staff.id),
            eq(institutionalStaffMembers.institutionalAccountId, input.institutionId),
          ));

        if (staff.userId != null) {
          await tx
            .update(institutionProductRoles)
            .set({ roleStatus: "ended", endedAt: now, updatedAt: now })
            .where(and(
              eq(institutionProductRoles.institutionalAccountId, input.institutionId),
              eq(institutionProductRoles.userId, staff.userId),
              or(eq(institutionProductRoles.roleStatus, "active"), eq(institutionProductRoles.roleStatus, "suspended")),
            ));
          await tx
            .update(institutionAccountScopes)
            .set({ scopeStatus: "ended", endedAt: now, updatedAt: now })
            .where(and(
              eq(institutionAccountScopes.institutionalAccountId, input.institutionId),
              eq(institutionAccountScopes.userId, staff.userId),
              or(eq(institutionAccountScopes.scopeStatus, "active"), eq(institutionAccountScopes.scopeStatus, "suspended")),
            ));
          await tx
            .update(institutionDepartmentResponseCoordinators)
            .set({ assignmentStatus: "ended", updatedAt: now })
            .where(and(
              eq(institutionDepartmentResponseCoordinators.institutionId, input.institutionId),
              or(eq(institutionDepartmentResponseCoordinators.coordinatorUserId, staff.userId), eq(institutionDepartmentResponseCoordinators.backupUserId, staff.userId)),
              or(eq(institutionDepartmentResponseCoordinators.assignmentStatus, "active"), eq(institutionDepartmentResponseCoordinators.assignmentStatus, "pending_acceptance")),
            ));
          await tx
            .update(ertlWeeklyRotations)
            .set({ assignmentStatus: "ended" })
            .where(and(
              eq(ertlWeeklyRotations.institutionId, input.institutionId),
              eq(ertlWeeklyRotations.ertlUserId, staff.userId),
              gte(ertlWeeklyRotations.endDate, now),
              or(eq(ertlWeeklyRotations.assignmentStatus, "unassigned"), eq(ertlWeeklyRotations.assignmentStatus, "pending_acceptance"), eq(ertlWeeklyRotations.assignmentStatus, "active")),
            ));
          await tx
            .update(monthlyUtlRotations)
            .set({ assignmentStatus: "ended", providerUserId: null, updatedAt: now })
            .where(and(
              eq(monthlyUtlRotations.institutionId, input.institutionId),
              eq(monthlyUtlRotations.providerUserId, staff.userId),
              gte(monthlyUtlRotations.monthStart, now),
              or(eq(monthlyUtlRotations.assignmentStatus, "unassigned"), eq(monthlyUtlRotations.assignmentStatus, "pending_acceptance"), eq(monthlyUtlRotations.assignmentStatus, "active")),
            ));
          await tx
            .update(shiftUtlRosters)
            .set({ assignmentStatus: "ended", status: "absent" })
            .where(and(
              eq(shiftUtlRosters.institutionId, input.institutionId),
              eq(shiftUtlRosters.utlUserId, staff.userId),
              gte(shiftUtlRosters.shiftDate, now),
              or(eq(shiftUtlRosters.assignmentStatus, "unassigned"), eq(shiftUtlRosters.assignmentStatus, "pending_acceptance"), eq(shiftUtlRosters.assignmentStatus, "active")),
            ));
        }

        await tx.insert(institutionalActionLogs).values({
          institutionalAccountId: input.institutionId,
          createdByUserId: ctx.user.id,
          gapIdentified: `${staff.staffName} was retired from the institutional roster without an active membership.`,
          systemChange: "STAFF_ROSTER_RETIREMENT",
          status: "completed",
          notes: JSON.stringify({ staffMemberId: staff.id, userId: staff.userId, staffEmail: staff.staffEmail, reason: input.reason }),
        });
        if (input.mismatchReportId) {
          await tx
            .update(institutionalActionLogs)
            .set({ status: "completed", updatedAt: now })
            .where(and(
              eq(institutionalActionLogs.id, input.mismatchReportId),
              eq(institutionalActionLogs.institutionalAccountId, input.institutionId),
              eq(institutionalActionLogs.status, "open"),
            ));
        }
      });

      return { success: true as const, status: "removed" as const, alreadyRemoved: false as const };
    }),

  searchKmhflFacilities,

  /** Hospital admin: Care Signal QI dashboard for this institution's facility name. */

  /** Whether this institution is in the CEO-gated clinical outcomes pilot. */
  getPilotProgramStatus: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) {
      return {
        pilotFlagEnabled: ENV.clinicalOutcomesPilotEnabled,
        institutionInPilotList: false,
        showPilotBadge: false,
      };
    }
    const pilotAdminIds = await getAdministeredInstitutionIds(db, ctx.user.id);
    const rows = pilotAdminIds.length
      ? await db
          .select({ id: institutionalAccounts.id })
          .from(institutionalAccounts)
          .where(inArray(institutionalAccounts.id, pilotAdminIds))
          .orderBy(desc(institutionalAccounts.id))
          .limit(1)
      : [];
    const institutionId = rows[0]?.id ?? null;
    const institutionInPilotList = isInstitutionInPilotProgram(
      institutionId,
      ENV.pilotFacilityIds
    );
    return {
      pilotFlagEnabled: ENV.clinicalOutcomesPilotEnabled,
      institutionId,
      institutionInPilotList,
      showPilotBadge: ENV.clinicalOutcomesPilotEnabled && institutionInPilotList,
    };
  }),

  getCareSignalFacilityDashboard: protectedProcedure
    .input(z.object({ lastDays: z.number().int().min(7).max(365).default(90) }).optional())
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      }
      const csAdminIds = await getAdministeredInstitutionIds(db, ctx.user.id);
      const rows = csAdminIds.length
        ? await db
            .select({
              id: institutionalAccounts.id,
              companyName: institutionalAccounts.companyName,
            })
            .from(institutionalAccounts)
            .where(inArray(institutionalAccounts.id, csAdminIds))
            .orderBy(desc(institutionalAccounts.id))
            .limit(1)
        : [];
      const inst = rows[0];
      if (!inst?.companyName?.trim()) {
        throw new TRPCError({ code: "FORBIDDEN", message: "No institution linked to this account" });
      }

      const [linkedFacility] = await db
        .select({ id: careFacilities.id })
        .from(careFacilities)
        .where(
          and(
            eq(careFacilities.institutionalAccountId, inst.id),
            isNull(careFacilities.mergedIntoId)
          )
        )
        .limit(1);

      return getFacilityCareSignalDashboard({
        facilityId: linkedFacility?.id,
        facilityName: inst.companyName.trim(),
        lastDays: input?.lastDays ?? 90,
      });
    }),

  /** Code Signal counterpart of getCareSignalFacilityDashboard above — same institution-resolution logic, scoped-down metrics (see facility-code-signal.service.ts for why). */
  getCodeSignalFacilityDashboard: protectedProcedure
    .input(z.object({ lastDays: z.number().int().min(7).max(365).default(90) }).optional())
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      }
      const csAdminIds = await getAdministeredInstitutionIds(db, ctx.user.id);
      const rows = csAdminIds.length
        ? await db
            .select({
              id: institutionalAccounts.id,
              companyName: institutionalAccounts.companyName,
            })
            .from(institutionalAccounts)
            .where(inArray(institutionalAccounts.id, csAdminIds))
            .orderBy(desc(institutionalAccounts.id))
            .limit(1)
        : [];
      const inst = rows[0];
      if (!inst?.companyName?.trim()) {
        throw new TRPCError({ code: "FORBIDDEN", message: "No institution linked to this account" });
      }

      const [linkedFacility] = await db
        .select({ id: careFacilities.id })
        .from(careFacilities)
        .where(
          and(
            eq(careFacilities.institutionalAccountId, inst.id),
            isNull(careFacilities.mergedIntoId)
          )
        )
        .limit(1);

      return getFacilityCodeSignalDashboard({
        facilityId: linkedFacility?.id,
        lastDays: input?.lastDays ?? 90,
      });
    }),

  /**
   * Per-provider QI participation count for institutional appraisal use —
   * CEO-requested 2026-08-08. Deliberately NOT a content/anonymity
   * mechanism (that's a different problem the fellowshipTokens pattern
   * solves, for a different party — see WORK_STATUS entry for why that
   * pattern doesn't fit here). This is a plain count, period-aggregated
   * only, never per-event or timestamped, and never includes narrative or
   * failure-domain detail — so an institution can credit "did they
   * participate" without gaining anything that could be cross-referenced
   * against a specific incident on a specific shift. Anonymous submissions
   * (userId null) are excluded entirely — they cannot be attributed by
   * definition, and that's correct, not a gap.
   */
  getCodeSignalParticipationRoster: protectedProcedure
    .input(z.object({ lastDays: z.number().int().min(7).max(365).default(90) }).optional())
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      }
      const adminIds = await getAdministeredInstitutionIds(db, ctx.user.id);
      const rows = adminIds.length
        ? await db
            .select({ id: institutionalAccounts.id })
            .from(institutionalAccounts)
            .where(inArray(institutionalAccounts.id, adminIds))
            .orderBy(desc(institutionalAccounts.id))
            .limit(1)
        : [];
      const inst = rows[0];
      if (!inst) {
        throw new TRPCError({ code: "FORBIDDEN", message: "No institution linked to this account" });
      }

      const [linkedFacility] = await db
        .select({ id: careFacilities.id })
        .from(careFacilities)
        .where(and(eq(careFacilities.institutionalAccountId, inst.id), isNull(careFacilities.mergedIntoId)))
        .limit(1);

      if (!linkedFacility) {
        return { lastDays: input?.lastDays ?? 90, roster: [] as { userId: number; name: string | null; count: number }[] };
      }

      const lastDays = input?.lastDays ?? 90;
      const since = new Date(Date.now() - lastDays * 24 * 60 * 60 * 1000);

      const namedEvents = await db
        .select({ userId: codeSignalEvents.userId })
        .from(codeSignalEvents)
        .where(
          and(
            eq(codeSignalEvents.facilityId, linkedFacility.id),
            eq(codeSignalEvents.submissionMode, "named"),
            gte(codeSignalEvents.createdAt, since)
          )
        );

      const counts = new Map<number, number>();
      for (const e of namedEvents) {
        if (e.userId == null) continue;
        counts.set(e.userId, (counts.get(e.userId) ?? 0) + 1);
      }

      if (counts.size === 0) {
        return { lastDays, roster: [] as { userId: number; name: string | null; count: number }[] };
      }

      const providerRows = await db
        .select({ id: users.id, name: users.name })
        .from(users)
        .where(inArray(users.id, [...counts.keys()]));

      const roster = providerRows
        .map((p) => ({ userId: p.id, name: p.name, count: counts.get(p.id) ?? 0 }))
        .sort((a, b) => b.count - a.count);

      return { lastDays, roster };
    }),

  /**
   * Care Signal counterpart of getCodeSignalParticipationRoster above —
   * CEO-requested 2026-08-08 for parity. Same privacy design (period count
   * only, no content, no timestamps). One real difference from Code
   * Signal: Care Signal's `submissionMode` has a THIRD value, "pseudonymous"
   * (tied to `fellowshipTokens`, for portable Fellowship credit — see that
   * table's own comment). Pseudonymous submissions are deliberately
   * excluded here too, not just anonymous ones — a provider choosing that
   * mode is explicitly opting out of institutional attribution in favour
   * of self-sovereign Fellowship credit; this roster must not defeat that
   * choice by counting them anyway under "named".
   */
  getCareSignalParticipationRoster: protectedProcedure
    .input(z.object({ lastDays: z.number().int().min(7).max(365).default(90) }).optional())
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      }
      const adminIds = await getAdministeredInstitutionIds(db, ctx.user.id);
      const rows = adminIds.length
        ? await db
            .select({ id: institutionalAccounts.id })
            .from(institutionalAccounts)
            .where(inArray(institutionalAccounts.id, adminIds))
            .orderBy(desc(institutionalAccounts.id))
            .limit(1)
        : [];
      const inst = rows[0];
      if (!inst) {
        throw new TRPCError({ code: "FORBIDDEN", message: "No institution linked to this account" });
      }

      const [linkedFacility] = await db
        .select({ id: careFacilities.id })
        .from(careFacilities)
        .where(and(eq(careFacilities.institutionalAccountId, inst.id), isNull(careFacilities.mergedIntoId)))
        .limit(1);

      if (!linkedFacility) {
        return { lastDays: input?.lastDays ?? 90, roster: [] as { userId: number; name: string | null; count: number }[] };
      }

      const lastDays = input?.lastDays ?? 90;
      const since = new Date(Date.now() - lastDays * 24 * 60 * 60 * 1000);

      const namedEvents = await db
        .select({ userId: careSignalEvents.userId })
        .from(careSignalEvents)
        .where(
          and(
            eq(careSignalEvents.facilityId, linkedFacility.id),
            eq(careSignalEvents.submissionMode, "named"),
            gte(careSignalEvents.createdAt, since)
          )
        );

      const counts = new Map<number, number>();
      for (const e of namedEvents) {
        if (e.userId == null) continue;
        counts.set(e.userId, (counts.get(e.userId) ?? 0) + 1);
      }

      if (counts.size === 0) {
        return { lastDays, roster: [] as { userId: number; name: string | null; count: number }[] };
      }

      const providerRows = await db
        .select({ id: users.id, name: users.name })
        .from(users)
        .where(inArray(users.id, [...counts.keys()]));

      const roster = providerRows
        .map((p) => ({ userId: p.id, name: p.name, count: counts.get(p.id) ?? 0 }))
        .sort((a, b) => b.count - a.count);

      return { lastDays, roster };
    }),

  /**
   * Private provider scorecard: CPD, Life Support certificate status, QI
   * reporting, and crash-cart audits. Individuals are not benchmarked against
   * peers; period-over-period comparison is provided by performance router.
   */
  getMyPerformanceScorecard: protectedProcedure
    .input(z.object({ lastDays: z.number().int().min(7).max(365).default(90) }).optional())
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      }
      const lastDays = input?.lastDays ?? 90;

      const scorecard = await getProviderScorecard({
        userId: ctx.user.id,
        institutionalAccountId: null,
        lastDays,
      });

      return { lastDays, scorecard };
    }),

  /**
   * Institutional counterpart — a full staff roster with the same
   * per-provider scorecard, for an admin's own appraisal/attention-
   * prioritization use. Deliberately NOT exposed to peers — matches the
   * "no leaderboard" decision made alongside the QI participation roster.
   *
   * Fix 2026-08-10 (CI-caught, TS18047): the empty-array early-return
   * branches were typed with `Awaited<ReturnType<typeof getProviderScorecard>>[]`,
   * which is `(ProviderScorecard | null)[]` — that `| null` then leaked
   * into the whole procedure's inferred output type, even though the real
   * data path always filters nulls out before returning. Typed both
   * branches as plain `ProviderScorecard[]` instead, matching what's
   * actually ever returned.
   */
  getStaffPerformanceRoster: protectedProcedure
    .input(z.object({ lastDays: z.number().int().min(7).max(365).default(90) }).optional())
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      }
      const lastDays = input?.lastDays ?? 90;

      const adminIds = await getAdministeredInstitutionIds(db, ctx.user.id);
      const rows = adminIds.length
        ? await db
            .select({ id: institutionalAccounts.id })
            .from(institutionalAccounts)
            .where(inArray(institutionalAccounts.id, adminIds))
            .orderBy(desc(institutionalAccounts.id))
            .limit(1)
        : [];
      const inst = rows[0];
      if (!inst) {
        throw new TRPCError({ code: "FORBIDDEN", message: "No institution linked to this account" });
      }

      const [linkedFacility] = await db
        .select({ id: careFacilities.id })
        .from(careFacilities)
        .where(and(eq(careFacilities.institutionalAccountId, inst.id), isNull(careFacilities.mergedIntoId)))
        .limit(1);

      if (!linkedFacility) {
        return { lastDays, roster: [] as ProviderScorecard[] };
      }

      const facilityProviders = await db
        .select({ userId: providerProfiles.userId })
        .from(providerProfiles)
        .where(eq(providerProfiles.facilityId, linkedFacility.id))
        .limit(200); // reasonable ceiling for a single-facility roster; revisit if a facility exceeds this

      const roster = await Promise.all(
        facilityProviders.map((p) =>
          getProviderScorecard({ userId: p.userId, institutionalAccountId: inst.id, lastDays })
        )
      );

      const filteredRoster: ProviderScorecard[] = roster.filter((r): r is ProviderScorecard => r != null);

      return { lastDays, roster: filteredRoster };
    }),

  /** Public lead capture from /institutional quote form (stored for sales follow-up). */
  submitLeadInquiry: publicProcedure
    .input(
      z.object({
        institutionName: z.string().min(2),
        contactName: z.string().min(1),
        contactEmail: z.string().email(),
        contactPhone: z.string().min(5),
        staffCount: z.number().int().nonnegative(),
        platformNeeds: z.array(z.enum(INSTITUTION_PLATFORM_NEED_VALUES)).min(1).max(5),
        message: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database connection failed",
        });
      }
      await db.insert(institutionalInquiries).values({
        companyName: input.institutionName,
        staffCount: Math.max(1, input.staffCount),
        specificNeeds: JSON.stringify({
          platformNeeds: input.platformNeeds,
          message: input.message ?? "",
        }),
        contactName: input.contactName,
        contactEmail: input.contactEmail,
        contactPhone: input.contactPhone,
        status: "new",
      });
      return { success: true as const };
    }),

  /**
   * Register an institution (authenticated). Links account to ctx.user.id.
   * If this user already has an institutional account, returns that id (idempotent).
   */
  register: protectedProcedure
    .input(
      z.object({
        hospitalName: z.string().min(3),
        hospitalType: z.string(),
        county: z.string().optional(),
        phone: z.string(),
        email: z.string().email(),
        website: z.string().optional(),
        adminFirstName: z.string(),
        adminLastName: z.string(),
        adminEmail: z.string().email(),
        adminPhone: z.string(),
        adminTitle: z.string(),
        planId: z.string(),
        planPrice: z.number(),
        maxStaff: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database connection failed",
          });
        }

        const existing = await db
          .select({ id: institutionalAccounts.id })
          .from(institutionalAccounts)
          .where(eq(institutionalAccounts.userId, ctx.user.id))
          .orderBy(desc(institutionalAccounts.id))
          .limit(1);

        if (existing.length) {
          return {
            success: true,
            institutionId: existing[0].id,
            message: "You already have an institutional account.",
            nextStep: "portal" as const,
            alreadyRegistered: true as const,
          };
        }

                const result = await db.insert(institutionalAccounts).values({
          userId: ctx.user.id,
          companyName: input.hospitalName,
          industry: input.hospitalType,
          staffCount: input.maxStaff,
          contactName: `${input.adminFirstName} ${input.adminLastName}`,
          contactEmail: input.adminEmail,
          contactPhone: input.adminPhone,
          status: "active",
        });
        const institutionId = (result as unknown as { insertId: number }).insertId;
        try {
          await ensureDefaultUtlReadinessTemplate(db, { institutionId, fallbackActorUserId: ctx.user.id });
        } catch (error) {
          if (!isMissingTableError(error)) throw error;
        }
        return {
          success: true,
          institutionId: institutionId || 1,
          message: "Institution registered successfully. Proceeding to payment...",
          nextStep: "payment" as const,
          alreadyRegistered: false as const,
        };
      } catch (error) {
        console.error("Institution registration error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to register institution",
        });
      }
    }),

  /**
   * Return a small, authenticated directory of existing Paeds Resus accounts
   * for onboarding and institution-admin selection. Only name and email are
   * returned; the current user is excluded and results are bounded.
   */
  searchPlatformAccounts: protectedProcedure
    .input(
      z.object({
        query: z.string().trim().min(2).max(80),
        limit: z.number().int().min(1).max(8).default(8),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed" });
      }

      const normalizedQuery = input.query.trim().toLowerCase();
      const escapedQuery = normalizedQuery.replace(/[\\%_]/g, "\\\\$&");
      const pattern = `%${escapedQuery}%`;
      const rows = await db
        .select({ id: users.id, name: users.name, email: users.email })
        .from(users)
        .where(
          and(
            ne(users.id, ctx.user.id),
            isNotNull(users.name),
            isNotNull(users.email),
            or(
              like(users.name, pattern),
              like(users.email, pattern)
            )
          )
        )
        .orderBy(asc(users.name), asc(users.id))
        .limit(input.limit);

      return rows.flatMap((row) => {
        const name = row.name?.trim();
        const email = row.email?.trim().toLowerCase();
        return name && email ? [{ id: row.id, name, email }] : [];
      });
    }),

  /**
   * Persist multi-step institutional onboarding for the signed-in user.
   * Creates institutionalAccounts + institutionalInquiries (detail). Idempotent if user already has an account.
   */
  completeOnboarding: protectedProcedure
    .input(
      z.object({
        institutionName: z.string().trim().min(3),
        /** New category field; institutionType remains optional for older clients during rollout. */
        organizationCategory: z.enum(INSTITUTION_CATEGORY_VALUES).optional(),
        institutionType: z.enum(INSTITUTION_TYPE_VALUES).optional(),
        facilityOwnership: z.enum(FACILITY_OWNERSHIP_VALUES).optional(),
        facilityCareLevel: z.string().trim().min(1).max(64).optional(),
        facilityLocalLevel: z.string().trim().max(128).optional(),
        registrationNumber: z.preprocess(
          (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
          z.string().trim().min(1).optional()
        ),
        healthcareStaffCount: z.coerce.number().int().positive(),
        country: z.string().min(1),
        city: z.string().min(1),
        address: z.string().min(1),
        contactPhone: z.string().trim().min(1),
        contactDesignation: z.string().trim().min(1),
        platformNeeds: z.array(z.enum(INSTITUTION_PLATFORM_NEED_VALUES)).min(1).max(5),
        /**
         * North Star §6.1: "A minimum of two named admin contacts must
         * always be registered." Required for every new institutional
         * account going forward — existing accounts registered before this
         * field existed are grandfathered (see the multi-admin dashboard
         * prompt to add one, not a hard block on existing active accounts).
         * Keep these messages actionable: the browser validates before submit,
         * but this server contract must remain safe for every client.
         */
        secondAdminUserId: z.number().int().positive(),
        /** Canonical IERS departments confirmed by the institutional admin during setup. */
        departmentNames: z.array(z.string().trim().min(2).max(128)).max(100).default([]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database connection failed",
        });
      }

      const organizationCategory = input.organizationCategory ?? input.institutionType;
      if (!organizationCategory) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Select the organization category that best describes your institution." });
      }
      if (requiresCareFacilityClassification(organizationCategory) && !input.facilityCareLevel) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Select the closest care level for this healthcare facility. If your country uses another model, choose the alternative/not-sure option and add its local designation." });
      }
      if (requiresCareFacilityClassification(organizationCategory) && !input.facilityOwnership) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Select the ownership model for this healthcare facility." });
      }
      if (input.facilityCareLevel === "other_or_not_sure" && !input.facilityLocalLevel) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Add the local facility designation when your country uses another classification model." });
      }

      const existing = await db
        .select()
        .from(institutionalAccounts)
        .where(eq(institutionalAccounts.userId, ctx.user.id))
        .orderBy(desc(institutionalAccounts.id))
        .limit(1);

      if (existing.length) {
        return {
          success: true,
          institutionId: existing[0].id,
          alreadyRegistered: true as const,
        };
      }

      const primaryAdminEmail = ctx.user.email?.trim().toLowerCase();
      const primaryAdminName = ctx.user.name?.trim();
      if (!primaryAdminEmail || !primaryAdminName) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Your Paeds Resus account needs a name and email before it can administer an institution.",
        });
      }

      const [secondAdmin] = await db
        .select({ id: users.id, name: users.name, email: users.email })
        .from(users)
        .where(eq(users.id, input.secondAdminUserId))
        .limit(1);

      const secondAdminEmail = secondAdmin?.email?.trim().toLowerCase();
      const secondAdminName = secondAdmin?.name?.trim();
      if (!secondAdmin || !secondAdminEmail || !secondAdminName) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Select a Paeds Resus account with a saved name and email for the second administrator.",
        });
      }
      if (secondAdmin.id === ctx.user.id || secondAdminEmail === primaryAdminEmail) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "The second administrator must be a different Paeds Resus account from the primary administrator.",
        });
      }

      const accountResult = await db.insert(institutionalAccounts).values({
        userId: ctx.user.id,
        companyName: input.institutionName,
        industry: organizationCategory,
        organizationCategory,
        facilityOwnership: input.facilityOwnership,
        facilityCareLevel: input.facilityCareLevel,
        facilityLocalLevel: input.facilityLocalLevel || null,
        staffCount: input.healthcareStaffCount,
        contactName: primaryAdminName,
        contactEmail: primaryAdminEmail,
        contactPhone: input.contactPhone,
        registrationNumber: input.registrationNumber,
        status: "prospect",
      });

            const institutionId = (accountResult as unknown as { insertId: number }).insertId;
      try {
        await ensureDefaultUtlReadinessTemplate(db, { institutionId, fallbackActorUserId: ctx.user.id });
      } catch (error) {
        if (!isMissingTableError(error)) throw error;
      }
      // Primary admin — the registering user themselves.
      await db.insert(institutionalAccountAdmins).values({
        institutionalAccountId: institutionId,
        userId: ctx.user.id,
        addedByUserId: null,
      });

      // Second admin — link only the account selected from the existing
      // Paeds Resus directory. Initial onboarding never creates a free-text
      // invite or accepts an unregistered email address.
      await db.insert(institutionalAccountAdmins).values({
        institutionalAccountId: institutionId,
        userId: secondAdmin.id,
        addedByUserId: ctx.user.id,
      });

      await insertCanonicalFacilityDepartments(db, {
        institutionId,
        departmentNames: input.departmentNames,
        confirmedByUserId: ctx.user.id,
      });

      await db.insert(institutionalInquiries).values({
        companyName: input.institutionName,
        staffCount: input.healthcareStaffCount,
        specificNeeds: JSON.stringify({
          registrationNumber: input.registrationNumber,
          address: input.address,
          city: input.city,
          country: input.country,
          contactDesignation: input.contactDesignation,
          organizationCategory,
          facilityOwnership: input.facilityOwnership ?? null,
          facilityCareLevel: input.facilityCareLevel ?? null,
          facilityLocalLevel: input.facilityLocalLevel ?? null,
          platformNeeds: input.platformNeeds,
        }),
        contactName: primaryAdminName,
        contactEmail: primaryAdminEmail,
        contactPhone: input.contactPhone,
        status: "new",
      });

      return {
        success: true,
        institutionId: institutionId || 1,
        alreadyRegistered: false as const,
      };
    }),

  getDetails: protectedProcedure
    .input(z.object({ institutionId: z.number() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database connection failed",
        });
      }

      await assertInstitutionAccess(db, ctx.user, input.institutionId);

      const institution = await db
        .select()
        .from(institutionalAccounts)
        .where(eq(institutionalAccounts.id, input.institutionId))
        .limit(1);

      if (!institution.length) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Institution not found",
        });
      }

      return institution[0];
    }),

  updateDetails: protectedProcedure
    .input(
      z.object({
        institutionId: z.number(),
        companyName: z.string().optional(),
        contactPhone: z.string().optional(),
        contactEmail: z.string().email().optional(),
        staffCount: z.number().int().min(0).optional(),
        organizationCategory: z.enum(INSTITUTION_CATEGORY_VALUES).optional(),
        facilityOwnership: z.enum(FACILITY_OWNERSHIP_VALUES).optional(),
        facilityCareLevel: z.enum(CARE_FACILITY_LEVEL_VALUES).optional(),
        facilityLocalLevel: z.string().trim().max(128).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database connection failed",
        });
      }

            await assertInstitutionAccess(db, ctx.user, input.institutionId);
      await assertInstitutionAccountScope(db, ctx.user, input.institutionId, ["account_admin"], { allowInstitutionAdmin: true });
      const [current] = await db.select({ organizationCategory: institutionalAccounts.organizationCategory, facilityOwnership: institutionalAccounts.facilityOwnership, facilityCareLevel: institutionalAccounts.facilityCareLevel, facilityLocalLevel: institutionalAccounts.facilityLocalLevel }).from(institutionalAccounts).where(eq(institutionalAccounts.id, input.institutionId)).limit(1);
      if (!current) throw new TRPCError({ code: "NOT_FOUND", message: "Institution not found" });
      const effectiveCategory = input.organizationCategory ?? current.organizationCategory;
      const requiresClassification = requiresCareFacilityClassification(effectiveCategory);
      const effectiveOwnership = input.facilityOwnership ?? current.facilityOwnership;
      const effectiveCareLevel = input.facilityCareLevel ?? current.facilityCareLevel;
      if (requiresClassification && (!effectiveOwnership || !effectiveCareLevel)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Healthcare facilities must include ownership and care classification." });
      }
      const updateData: Record<string, unknown> = { updatedAt: new Date() };
      if (input.companyName !== undefined) updateData.companyName = input.companyName.trim();
      if (input.contactPhone !== undefined) updateData.contactPhone = input.contactPhone.trim() || null;
      if (input.contactEmail !== undefined) updateData.contactEmail = input.contactEmail.trim().toLowerCase();
      if (input.staffCount !== undefined) updateData.staffCount = input.staffCount;
      if (input.organizationCategory !== undefined) updateData.organizationCategory = input.organizationCategory;
      if (input.facilityOwnership !== undefined) updateData.facilityOwnership = input.facilityOwnership;
      if (input.facilityCareLevel !== undefined) updateData.facilityCareLevel = input.facilityCareLevel;
      if (input.facilityLocalLevel !== undefined) updateData.facilityLocalLevel = input.facilityLocalLevel.trim() || null;
      if (!requiresClassification) {
        updateData.facilityOwnership = null;
        updateData.facilityCareLevel = null;
        updateData.facilityLocalLevel = null;
      }
      await db

        .update(institutionalAccounts)
        .set(updateData)
        .where(eq(institutionalAccounts.id, input.institutionId));

      return {
        success: true,
        message: "Institution updated successfully",
      };
    }),

  getStaffMembers: protectedProcedure
    .input(z.object({ institutionId: z.number(), includeRemoved: z.boolean().optional() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database connection failed",
        });
      }

      await assertInstitutionAccess(db, ctx.user, input.institutionId);
      const includeRemoved = input.includeRemoved === true;
      void autoLinkCpdFacilitiesForInstitution(db, input.institutionId).catch((error) => {
        console.warn("[IERS] Background CPD facility-link repair failed", error);
      });

      type InstitutionStaffRosterRow = Omit<typeof institutionalStaffMembers.$inferSelect, "assignedCourses">;
      let rows: Array<InstitutionStaffRosterRow>;
      try {
        rows = await db
          .select({
            id: institutionalStaffMembers.id,
            institutionalAccountId: institutionalStaffMembers.institutionalAccountId,
            userId: institutionalStaffMembers.userId,
            staffName: institutionalStaffMembers.staffName,
            staffEmail: institutionalStaffMembers.staffEmail,
            staffPhone: institutionalStaffMembers.staffPhone,
            staffRole: institutionalStaffMembers.staffRole,
            designation: institutionalStaffMembers.designation,
            governanceRole: institutionalStaffMembers.governanceRole,
            institutionalRole: institutionalStaffMembers.institutionalRole,
            department: institutionalStaffMembers.department,
            facilityDepartmentId: institutionalStaffMembers.facilityDepartmentId,
            yearsOfExperience: institutionalStaffMembers.yearsOfExperience,
            enrollmentStatus: institutionalStaffMembers.enrollmentStatus,
            phaseStatus: institutionalStaffMembers.phaseStatus,
            facilityLinkStatus: institutionalStaffMembers.facilityLinkStatus,
            removedAt: institutionalStaffMembers.removedAt,
            removedByUserId: institutionalStaffMembers.removedByUserId,
            removalReason: institutionalStaffMembers.removalReason,
            totalPaidAmount: institutionalStaffMembers.totalPaidAmount,
            phase1ProofUrl: institutionalStaffMembers.phase1ProofUrl,
            phase1ProofApprovedAt: institutionalStaffMembers.phase1ProofApprovedAt,
            enrollmentDate: institutionalStaffMembers.enrollmentDate,
            completionDate: institutionalStaffMembers.completionDate,
            certificationStatus: institutionalStaffMembers.certificationStatus,
            certificationDate: institutionalStaffMembers.certificationDate,
            certificationExpiryDate: institutionalStaffMembers.certificationExpiryDate,
            createdAt: institutionalStaffMembers.createdAt,
            updatedAt: institutionalStaffMembers.updatedAt,
          })
          .from(institutionalStaffMembers)
          .where(and(
            eq(institutionalStaffMembers.institutionalAccountId, input.institutionId),
            ...(includeRemoved ? [] : [isNull(institutionalStaffMembers.removedAt)]),
          ));
      } catch (error) {
        if (!isMissingSchemaColumnError(error)) throw error;
        const legacyRows = await db
          .select({
            id: institutionalStaffMembers.id,
            institutionalAccountId: institutionalStaffMembers.institutionalAccountId,
            userId: institutionalStaffMembers.userId,
            staffName: institutionalStaffMembers.staffName,
            staffEmail: institutionalStaffMembers.staffEmail,
            staffPhone: institutionalStaffMembers.staffPhone,
            staffRole: institutionalStaffMembers.staffRole,
            designation: institutionalStaffMembers.designation,
            governanceRole: institutionalStaffMembers.governanceRole,
            institutionalRole: institutionalStaffMembers.institutionalRole,
            department: institutionalStaffMembers.department,
            facilityDepartmentId: institutionalStaffMembers.facilityDepartmentId,
            yearsOfExperience: institutionalStaffMembers.yearsOfExperience,
            assignedCourses: institutionalStaffMembers.assignedCourses,
            enrollmentStatus: institutionalStaffMembers.enrollmentStatus,
            phaseStatus: institutionalStaffMembers.phaseStatus,
            facilityLinkStatus: institutionalStaffMembers.facilityLinkStatus,
            totalPaidAmount: institutionalStaffMembers.totalPaidAmount,
            phase1ProofUrl: institutionalStaffMembers.phase1ProofUrl,
            phase1ProofApprovedAt: institutionalStaffMembers.phase1ProofApprovedAt,
            enrollmentDate: institutionalStaffMembers.enrollmentDate,
            completionDate: institutionalStaffMembers.completionDate,
            certificationStatus: institutionalStaffMembers.certificationStatus,
            certificationDate: institutionalStaffMembers.certificationDate,
            certificationExpiryDate: institutionalStaffMembers.certificationExpiryDate,
            createdAt: institutionalStaffMembers.createdAt,
            updatedAt: institutionalStaffMembers.updatedAt,
          })
          .from(institutionalStaffMembers)
          .where(and(
            eq(institutionalStaffMembers.institutionalAccountId, input.institutionId),
            ...(includeRemoved ? [] : [isNull(institutionalStaffMembers.removedAt)]),
          ));
        rows = legacyRows.map((row) => ({ ...row, removedAt: null, removedByUserId: null, removalReason: null }));
      }
      const memberships = await db
        .select({
          id: institutionMemberships.id,
          staffMemberId: institutionMemberships.staffMemberId,
          membershipStatus: institutionMemberships.membershipStatus,
          userId: institutionMemberships.userId,
          invitedEmail: institutionMemberships.invitedEmail,
        })
        .from(institutionMemberships)
        .where(eq(institutionMemberships.institutionalAccountId, input.institutionId));
      const membershipByStaffId = new Map(memberships.filter((membership) => membership.staffMemberId != null).map((membership) => [membership.staffMemberId as number, membership]));
      const membershipByUserId = new Map(memberships.filter((membership) => membership.userId != null).map((membership) => [membership.userId as number, membership]));
      return rows.map((row) => {
        const membership = membershipByStaffId.get(row.id) ?? (row.userId != null ? membershipByUserId.get(row.userId) : undefined);
        return {
          ...row,
          department: row.department ? canonicalizeDepartmentLabel(row.department) : row.department,
          membershipId: membership?.id ?? null,
          membershipStatus: membership?.membershipStatus ?? null,
          membershipUserId: membership?.userId ?? row.userId,
          removedAt: row.removedAt ?? null,
          removalReason: row.removalReason ?? null,
        };
      });
    }),

  getDepartmentNurseCandidates: protectedProcedure
    .input(z.object({ institutionId: z.number().int().positive(), departmentId: z.number().int().positive() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed" });
      try {
        await assertCanManageArea(db, ctx.user, input.institutionId, "iers", input.departmentId);
      } catch (error) {
        if (!(error instanceof TRPCError) || error.code !== "FORBIDDEN") throw error;
        await assertIersDepartmentRotaWriteAccess(db, ctx.user, input.institutionId, input.departmentId);
      }
      const [department] = await db
        .select({ id: facilityDepartments.id, departmentName: facilityDepartments.departmentName })
        .from(facilityDepartments)
        .where(and(
          eq(facilityDepartments.id, input.departmentId),
          eq(facilityDepartments.institutionId, input.institutionId),
          eq(facilityDepartments.isActive, true),
          isNotNull(facilityDepartments.confirmedAt),
          eq(facilityDepartments.requiresPole, true),
        ))
        .limit(1);
      if (!department) throw new TRPCError({ code: "NOT_FOUND", message: "This department is not an active confirmed IERS-operational department." });
      await autoLinkCpdFacilitiesForInstitution(db, input.institutionId, department.id);
      const rows = await db
        .select({
          id: institutionalStaffMembers.id,
          userId: institutionalStaffMembers.userId,
          staffName: institutionalStaffMembers.staffName,
          staffEmail: institutionalStaffMembers.staffEmail,
          staffPhone: institutionalStaffMembers.staffPhone,
          staffRole: institutionalStaffMembers.staffRole,
          providerType: users.providerType,
          cadre: users.cadre,
          cadreOther: users.cadreOther,
          department: institutionalStaffMembers.department,
          facilityDepartmentId: institutionalStaffMembers.facilityDepartmentId,
          facilityLinkStatus: institutionalStaffMembers.facilityLinkStatus,
          membershipStatus: institutionMemberships.membershipStatus,
          profileDepartment: providerProfiles.department,
        })
        .from(institutionalStaffMembers)
        .leftJoin(users, eq(users.id, institutionalStaffMembers.userId))
        .leftJoin(providerProfiles, eq(providerProfiles.userId, institutionalStaffMembers.userId))
        .leftJoin(institutionMemberships, and(
          eq(institutionMemberships.institutionalAccountId, input.institutionId),
          eq(institutionMemberships.userId, institutionalStaffMembers.userId),
        ))
        .where(and(
          eq(institutionalStaffMembers.institutionalAccountId, input.institutionId),
          isNull(institutionalStaffMembers.removedAt),
          or(
            eq(institutionalStaffMembers.facilityDepartmentId, department.id),
            sql`${institutionalStaffMembers.facilityDepartmentId} IS NULL AND LOWER(TRIM(${institutionalStaffMembers.department})) = LOWER(TRIM(${department.departmentName}))`,
            sql`${providerProfiles.department} IS NOT NULL AND LOWER(TRIM(${providerProfiles.department})) = LOWER(TRIM(${department.departmentName}))`,
          ),
        ))
        .orderBy(asc(institutionalStaffMembers.staffName));
      const candidateRows: DepartmentNurseCandidateRow[] = [
        ...rows.map((row) => ({
          ...row,
          currentDepartment: row.department,
          departmentMismatch: row.facilityDepartmentId != null && row.facilityDepartmentId !== department.id,
        })),
        ...(await getProfileBackedRnCandidates(db, input.institutionId, department, rows)),
      ];
      const seen = new Set<number>();
      return candidateRows.filter((row) => {
        if (seen.has(row.id)) return false;
        seen.add(row.id);
        return isRegisteredRnProfile(row) && providerBelongsToCanonicalDepartment(row, department);
      }).map((row) => ({
        id: row.id,
        userId: row.userId,
        staffName: row.staffName ?? "Registered nurse",
        staffEmail: row.staffEmail ?? "",
        staffPhone: row.staffPhone,
        staffRole: isRegisteredRnProfile(row) ? "nurse" : (row.staffRole ?? "other"),
        department: row.department,
        facilityDepartmentId: row.facilityDepartmentId,
        facilityLinkStatus: row.facilityLinkStatus,
        membershipStatus: row.membershipStatus,
        currentDepartment: row.currentDepartment ?? null,
        departmentMismatch: row.departmentMismatch ?? false,
        assignable: row.userId != null && row.membershipStatus === "active" && row.facilityLinkStatus === "linked" && !row.departmentMismatch,
        needsAccountLink: row.userId == null || row.membershipStatus !== "active" || row.facilityLinkStatus !== "linked" || Boolean(row.departmentMismatch),
      }));
    }),

  getPoleNurseCandidates: protectedProcedure
    .input(z.object({ institutionId: z.number().int().positive(), poleId: z.number().int().positive() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed" });
      await assertIersPoleRotaReadAccess(db, ctx.user, input.institutionId, input.poleId);
      const departments = await db
        .select({ id: facilityDepartments.id, departmentName: facilityDepartments.departmentName })
        .from(facilityDepartments)
        .where(and(
          eq(facilityDepartments.institutionId, input.institutionId),
          eq(facilityDepartments.poleId, input.poleId),
          eq(facilityDepartments.isActive, true),
          isNotNull(facilityDepartments.confirmedAt),
          eq(facilityDepartments.requiresPole, true),
        ))
        .orderBy(asc(facilityDepartments.departmentName));
      const results: Array<{
        departmentId: number;
        departmentName: string;
        candidates: Array<{
          id: number;
          userId: number | null;
          staffName: string;
          staffEmail: string;
          staffPhone: string | null;
          staffRole: string;
          department: string | null;
          facilityDepartmentId: number | null;
          facilityLinkStatus: string | null;
          membershipStatus: string | null;
          currentDepartment?: string | null;
          departmentMismatch?: boolean;
          assignable: boolean;
          needsAccountLink: boolean;
        }>;
      }> = [];
      for (const department of departments) {
        try {
          await assertIersDepartmentRotaWriteAccess(db, ctx.user, input.institutionId, department.id);
        } catch (error) {
          if (error instanceof TRPCError && error.code === "FORBIDDEN") continue;
          throw error;
        }
        const rows = await db
          .select({
            id: institutionalStaffMembers.id,
            userId: institutionalStaffMembers.userId,
            staffName: institutionalStaffMembers.staffName,
            staffEmail: institutionalStaffMembers.staffEmail,
            staffPhone: institutionalStaffMembers.staffPhone,
            staffRole: institutionalStaffMembers.staffRole,
            providerType: users.providerType,
            cadre: users.cadre,
            cadreOther: users.cadreOther,
            department: institutionalStaffMembers.department,
            facilityDepartmentId: institutionalStaffMembers.facilityDepartmentId,
            facilityLinkStatus: institutionalStaffMembers.facilityLinkStatus,
            membershipStatus: institutionMemberships.membershipStatus,
            profileDepartment: providerProfiles.department,
          })
          .from(institutionalStaffMembers)
          .leftJoin(users, eq(users.id, institutionalStaffMembers.userId))
          .leftJoin(providerProfiles, eq(providerProfiles.userId, institutionalStaffMembers.userId))
          .leftJoin(institutionMemberships, and(
            eq(institutionMemberships.institutionalAccountId, input.institutionId),
            eq(institutionMemberships.userId, institutionalStaffMembers.userId),
          ))
          .where(and(
            eq(institutionalStaffMembers.institutionalAccountId, input.institutionId),
            isNull(institutionalStaffMembers.removedAt),
            or(
              eq(institutionalStaffMembers.facilityDepartmentId, department.id),
              sql`${institutionalStaffMembers.facilityDepartmentId} IS NULL AND LOWER(TRIM(${institutionalStaffMembers.department})) = LOWER(TRIM(${department.departmentName}))`,
              sql`${providerProfiles.department} IS NOT NULL AND LOWER(TRIM(${providerProfiles.department})) = LOWER(TRIM(${department.departmentName}))`,
            ),
          ))
          .orderBy(asc(institutionalStaffMembers.staffName));
        const candidateRows: DepartmentNurseCandidateRow[] = [
          ...rows.map((row) => ({
            ...row,
            currentDepartment: row.department,
            departmentMismatch: row.facilityDepartmentId != null && row.facilityDepartmentId !== department.id,
          })),
          ...(await getProfileBackedRnCandidates(db, input.institutionId, department, rows)),
        ];
        const seen = new Set<number>();
        results.push({
          departmentId: department.id,
          departmentName: department.departmentName,
          candidates: candidateRows.filter((row) => {
            if (seen.has(row.id)) return false;
            seen.add(row.id);
            return isRegisteredRnProfile(row) && providerBelongsToCanonicalDepartment(row, department);
          }).map((row) => ({
            id: row.id,
            userId: row.userId,
            staffName: row.staffName ?? "Registered nurse",
            staffEmail: row.staffEmail ?? "",
            staffPhone: row.staffPhone,
            staffRole: isRegisteredRnProfile(row) ? "nurse" : (row.staffRole ?? "other"),
            department: row.department,
            facilityDepartmentId: row.facilityDepartmentId,
            facilityLinkStatus: row.facilityLinkStatus,
            membershipStatus: row.membershipStatus,
            currentDepartment: row.currentDepartment ?? null,
            departmentMismatch: row.departmentMismatch ?? false,
            assignable: row.userId != null && row.membershipStatus === "active" && row.facilityLinkStatus === "linked" && !row.departmentMismatch,
            needsAccountLink: row.userId == null || row.membershipStatus !== "active" || row.facilityLinkStatus !== "linked" || Boolean(row.departmentMismatch),
          })),
        });
      }
      return results;
    }),

  addDepartmentNurseCandidate: protectedProcedure
    .input(z.object({
      institutionId: z.number().int().positive(),
      departmentId: z.number().int().positive(),
      staffName: z.string().trim().min(2).max(255),
      staffEmail: z.string().trim().email().max(320),
      staffPhone: z.string().trim().max(32).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed" });
      await assertIersDepartmentRotaWriteAccess(db, ctx.user, input.institutionId, input.departmentId);
      const [department] = await db
        .select({ id: facilityDepartments.id, departmentName: facilityDepartments.departmentName })
        .from(facilityDepartments)
        .where(and(
          eq(facilityDepartments.id, input.departmentId),
          eq(facilityDepartments.institutionId, input.institutionId),
          eq(facilityDepartments.isActive, true),
          isNotNull(facilityDepartments.confirmedAt),
          eq(facilityDepartments.requiresPole, true),
        ))
        .limit(1);
      if (!department) throw new TRPCError({ code: "NOT_FOUND", message: "This department is not an active confirmed IERS-operational department." });
      const email = input.staffEmail.toLowerCase();
      const [existing] = await db
        .select({ id: institutionalStaffMembers.id })
        .from(institutionalStaffMembers)
        .where(and(
          eq(institutionalStaffMembers.institutionalAccountId, input.institutionId),
          eq(institutionalStaffMembers.staffEmail, email),
        ))
        .limit(1);
      let staffId: number;
      if (existing) {
        await db.update(institutionalStaffMembers).set({
          staffName: input.staffName,
          staffPhone: input.staffPhone || null,
          staffRole: "nurse",
          department: department.departmentName,
          facilityDepartmentId: department.id,
          facilityLinkStatus: "linked",
          updatedAt: new Date(),
        }).where(eq(institutionalStaffMembers.id, existing.id));
        staffId = existing.id;
      } else {
        const [result] = await db.insert(institutionalStaffMembers).values({
          institutionalAccountId: input.institutionId,
          staffName: input.staffName,
          staffEmail: email,
          staffPhone: input.staffPhone || null,
          staffRole: "nurse",
          designation: "other",
          department: department.departmentName,
          facilityDepartmentId: department.id,
          enrollmentStatus: "pending",
          facilityLinkStatus: "linked",
        });
        staffId = Number(result.insertId);
      }
      await ensureProviderMembershipForStaff(db, { institutionId: input.institutionId, staffMemberId: staffId, email });
      const [linked] = await db
        .select({ userId: institutionalStaffMembers.userId })
        .from(institutionalStaffMembers)
        .where(eq(institutionalStaffMembers.id, staffId))
        .limit(1);
      return { success: true, staffId, departmentId: department.id, assignable: linked?.userId != null };
    }),

  addStaffMember: protectedProcedure
    .input(
      z.object({
        institutionId: z.number(),
        staffName: z.string(),
        staffEmail: z.string().email(),
        staffPhone: z.string().optional(),
        staffRole: z.enum([
          "doctor",
          "nurse",
          "paramedic",
          "midwife",
          "lab_tech",
          "respiratory_therapist",
          "support_staff",
          "other",
        ]),
        designation: z.enum([
          "noi",
          "coi_bsc",
          "coi_diploma",
          "moi",
          "permanent_nurse",
          "permanent_doctor",
          "other",
        ]).optional(),
        department: z.string().optional(),
        yearsOfExperience: z.number().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database connection failed",
        });
      }

      await assertInstitutionAccess(db, ctx.user, input.institutionId);

      const department = input.department?.trim() ? canonicalizeDepartmentLabel(input.department) : null;
      let facilityDepartmentId: number | null = null;
      if (department) {
        const departments = await db.select({ id: facilityDepartments.id, departmentName: facilityDepartments.departmentName })
          .from(facilityDepartments)
          .where(and(eq(facilityDepartments.institutionId, input.institutionId), eq(facilityDepartments.isActive, true)));
        facilityDepartmentId = departments.find((row) => departmentLabelsMatch(row.departmentName, department))?.id ?? null;
      }

      const result = await db.insert(institutionalStaffMembers).values({
        institutionalAccountId: input.institutionId,
        staffName: input.staffName,
        staffEmail: input.staffEmail,
        staffPhone: input.staffPhone || null,
        staffRole: input.staffRole,
        designation: input.designation || "other",
        department,
        facilityDepartmentId,
        yearsOfExperience: input.yearsOfExperience || 0,
        enrollmentStatus: "pending",
        facilityLinkStatus: "linked", // manual add by admin is auto-approved
      });
      const staffId = (result as unknown as { insertId: number }).insertId || 1;
      await ensureProviderMembershipForStaff(db, {
        institutionId: input.institutionId,
        staffMemberId: staffId,
        email: input.staffEmail,
      });

      return {
        success: true,
        staffId,
        message: "Staff member added and provider responsibility recorded",
      };
    }),

  bulkImportStaff: protectedProcedure
    .input(
      z.object({
        institutionId: z.number(),
        staff: z.array(
          z.object({
            staffName: z.string(),
            staffEmail: z.string().email(),
            staffPhone: z.string().optional(),
            staffRole: z.enum([
              "doctor",
              "nurse",
              "paramedic",
              "midwife",
              "lab_tech",
              "respiratory_therapist",
              "support_staff",
              "other",
            ]),
            designation: z.enum([
              "noi",
              "coi_bsc",
              "coi_diploma",
              "moi",
              "permanent_nurse",
              "permanent_doctor",
              "other",
            ]).optional(),
            department: z.string().optional(),
            yearsOfExperience: z.number().optional(),
          })
        ),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database connection failed",
        });
      }

      await assertInstitutionAccess(db, ctx.user, input.institutionId);

      const imported: { staffEmail: string; staffId: number }[] = [];
      const errors: { staffEmail: string; error: string }[] = [];

      for (const staff of input.staff) {
        try {
          const result = await db.insert(institutionalStaffMembers).values({
            institutionalAccountId: input.institutionId,
            staffName: staff.staffName,
            staffEmail: staff.staffEmail,
            staffPhone: staff.staffPhone || null,
            staffRole: staff.staffRole,
            designation: staff.designation || "other",
            department: staff.department || null,
            yearsOfExperience: staff.yearsOfExperience || 0,
            enrollmentStatus: "pending",
            facilityLinkStatus: "linked", // manual bulk import is auto-approved
          });
          const staffId = (result as unknown as { insertId: number }).insertId || 1;
          await ensureProviderMembershipForStaff(db, {
            institutionId: input.institutionId,
            staffMemberId: staffId,
            email: staff.staffEmail,
          });

          imported.push({
            staffEmail: staff.staffEmail,
            staffId,
          });
        } catch (error) {
          errors.push({
            staffEmail: staff.staffEmail,
            error: (error as Error).message,
          });
        }
      }

      return {
        success: true,
        imported: imported.length,
        errors: errors.length,
        message: `Successfully imported ${imported.length} staff members`,
        data: { imported, errors },
      };
    }),

  getQuotations: protectedProcedure
    .input(z.object({ institutionId: z.number() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database connection failed",
        });
      }

      await assertInstitutionAccess(db, ctx.user, input.institutionId);
      await assertInstitutionAccountScope(db, ctx.user, input.institutionId, ["finance_officer", "account_admin"], { allowInstitutionAdmin: true });

      return await db
        .select()
        .from(quotations)
        .where(eq(quotations.institutionalAccountId, input.institutionId));
    }),

  getContracts: protectedProcedure
    .input(z.object({ institutionId: z.number() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database connection failed",
        });
      }

      await assertInstitutionAccess(db, ctx.user, input.institutionId);
      await assertInstitutionAccountScope(db, ctx.user, input.institutionId, ["finance_officer", "account_admin"], { allowInstitutionAdmin: true });

      return await db
        .select()
        .from(contracts)
        .where(eq(contracts.institutionalAccountId, input.institutionId));
    }),

  /** INST-12: Training schedules for this institution (tenant-scoped). */
  getTrainingSchedules: protectedProcedure
    .input(z.object({ institutionId: z.number() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database connection failed",
        });
      }
      await assertInstitutionAccess(db, ctx.user, input.institutionId);
      await assertInstitutionProductCapability(db, input.institutionId, "iers", "iers.workspace.read");
      await assertInstitutionProductRole(db, ctx.user, input.institutionId, "iers", IERS_READ_ROLES);
      const instructorUser = alias(users, "instructorUser");
      return await db
        .select({
          id: trainingSchedules.id,
          institutionalAccountId: trainingSchedules.institutionalAccountId,
          courseId: trainingSchedules.courseId,
          trainingType: trainingSchedules.trainingType,
          scheduledDate: trainingSchedules.scheduledDate,
          endDate: trainingSchedules.endDate,
          startTime: trainingSchedules.startTime,
          endTime: trainingSchedules.endTime,
          location: trainingSchedules.location,
          instructorId: trainingSchedules.instructorId,
          instructorName: trainingSchedules.instructorName,
          instructorUserName: instructorUser.name,
          maxCapacity: trainingSchedules.maxCapacity,
          enrolledCount: trainingSchedules.enrolledCount,
          status: trainingSchedules.status,
          createdAt: trainingSchedules.createdAt,
          updatedAt: trainingSchedules.updatedAt,
          programType: courses.programType,
        })
        .from(trainingSchedules)
        .leftJoin(courses, eq(trainingSchedules.courseId, courses.id))
        .leftJoin(instructorUser, eq(trainingSchedules.instructorId, instructorUser.id))
        .where(eq(trainingSchedules.institutionalAccountId, input.institutionId))
        .orderBy(desc(trainingSchedules.scheduledDate));
    }),

  /** Approved platform instructors (admin-assigned) for session assignment. */
  listAssignableInstructors: protectedProcedure
    .input(z.object({
      institutionId: z.number().int().positive(),
      // Per-course competency (CEO decision, 2026-07-21): "not all
      // instructors are the same" — when a programType is given, only
      // instructors specifically qualified for that course are returned,
      // not every globally-approved instructor. Optional for backward
      // compatibility with any caller that hasn't been updated to pass it yet.
      programType: z.enum(["bls", "acls", "pals", "fellowship", "instructor", "fellowship_diploma", "heartsaver", "nrp"]).optional(),
    }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database connection failed",
        });
      }
      await assertInstitutionAccess(db, ctx.user, input.institutionId);
      await assertInstitutionProductCapability(db, input.institutionId, "iers", "iers.workspace.read");
      await assertInstitutionProductRole(db, ctx.user, input.institutionId, "iers", IERS_READ_ROLES);

      if (input.programType) {
        return await db
          .select({
            id: users.id,
            name: users.name,
            email: users.email,
            instructorNumber: users.instructorNumber,
            instructorTier: users.instructorTier,
          })
          .from(users)
          .innerJoin(instructorQualifications, and(
            eq(instructorQualifications.userId, users.id),
            eq(instructorQualifications.programType, input.programType)
          ))
          .where(
            and(
              isNotNull(users.instructorApprovedAt),
              isNotNull(users.instructorCertifiedAt),
              isNotNull(users.instructorNumber)
            )
          )
          .orderBy(asc(users.name));
      }

      return await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          instructorNumber: users.instructorNumber,
          instructorTier: users.instructorTier,
        })
        .from(users)
        .where(
          and(
            isNotNull(users.instructorApprovedAt),
            isNotNull(users.instructorCertifiedAt),
            isNotNull(users.instructorNumber)
          )
        )
        .orderBy(asc(users.name));
    }),

  /**
   * HI-B2B-1: Create a training schedule row (tenant-scoped). Resolves catalog `courseId` from program type.
   */
  createTrainingSchedule: protectedProcedure
    .input(
      z.object({
        institutionId: z.number().int().positive(),
        programType: z.enum(["bls", "acls", "pals", "fellowship"]),
        trainingType: z.enum(["online", "hands_on", "hybrid"]),
        scheduledDate: z.coerce.date(),
        endDate: z.coerce.date().optional(),
        startTime: z.string().max(10).optional(),
        endTime: z.string().max(10).optional(),
        location: z.string().max(255).optional(),
        instructorName: z.string().max(255).optional(),
        /** Must be admin-approved (`users.instructorApprovedAt`); sets `instructorId` + display name. */
        instructorUserId: z.number().int().positive().optional(),
        maxCapacity: z.number().int().min(1).max(2000),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database connection failed",
        });
      }
      await assertInstitutionAccess(db, ctx.user, input.institutionId);
      const competencyAccess = await assertInstitutionProductCapability(db, input.institutionId, "iers", "iers.competency_training.operate");
      assertWritableProductAccess(competencyAccess);
      await assertInstitutionProductRole(db, ctx.user, input.institutionId, "iers", IERS_OPERATE_ROLES);
      if (input.endDate && input.endDate < input.scheduledDate) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "A multi-day session must end on or after its start date." });
      }

      await ensureCourseCatalogForSchedule(db, input.programType);

      const courseRows = await db
        .select({ id: courses.id })
        .from(courses)
        .where(eq(courses.programType, input.programType))
        .orderBy(courses.id)
        .limit(1);

      if (!courseRows.length) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message:
            "No course catalog entry for this program type. Add rows to the `courses` table or contact support.",
        });
      }

      const courseId = courseRows[0].id;

      let instructorId: number | undefined;
      let instructorNameVal = input.instructorName?.trim() || undefined;
      if (input.instructorUserId != null) {
        const u = await assertApprovedInstructorUser(db, input.instructorUserId);
        instructorId = u.id;
        if (!instructorNameVal && u.name) instructorNameVal = u.name.trim();
        await assertNoInstructorDoubleBooking(db, {
          instructorId,
          scheduledDate: input.scheduledDate,
          endDate: input.endDate,
          startTime: input.startTime,
          endTime: input.endTime,
        });
      }

      await db.insert(trainingSchedules).values({
        institutionalAccountId: input.institutionId,
        courseId,
        trainingType: input.trainingType,
        scheduledDate: input.scheduledDate,
        endDate: input.endDate ?? null,
        startTime: input.startTime?.trim() || undefined,
        endTime: input.endTime?.trim() || undefined,
        location: input.location?.trim() || undefined,
        instructorId,
        instructorName: instructorNameVal,
        maxCapacity: input.maxCapacity,
        enrolledCount: 0,
        status: "scheduled",
      });

      const created = await db
        .select({ id: trainingSchedules.id })
        .from(trainingSchedules)
        .where(eq(trainingSchedules.institutionalAccountId, input.institutionId))
        .orderBy(desc(trainingSchedules.id))
        .limit(1);

      const scheduleId = created[0]?.id ?? null;
      if (scheduleId != null) {
        await trackEvent({
          userId: ctx.user.id,
          eventType: "institution_training_schedule_created",
          eventName: "Institutional training session scheduled",
          eventData: {
            institutionId: input.institutionId,
            scheduleId,
            programType: input.programType,
            trainingType: input.trainingType,
          },
          sessionId: `inst_schedule_${scheduleId}`,
        });
        if (instructorId != null) {
          void notifyInstructorSessionAssigned(db, scheduleId);
        }
      }

      return { success: true as const, scheduleId };
    }),

  /**
   * HI-B2B-1: Update an existing training session (tenant-scoped). Optional fields only; omitted = unchanged.
   */
  updateTrainingSchedule: protectedProcedure
    .input(
      z.object({
        institutionId: z.number().int().positive(),
        trainingScheduleId: z.number().int().positive(),
        programType: z.enum(["bls", "acls", "pals", "fellowship"]).optional(),
        trainingType: z.enum(["online", "hands_on", "hybrid"]).optional(),
        scheduledDate: z.coerce.date().optional(),
        endDate: z.union([z.coerce.date(), z.null()]).optional(),
        startTime: z.union([z.string().max(10), z.null()]).optional(),
        endTime: z.union([z.string().max(10), z.null()]).optional(),
        location: z.union([z.string().max(255), z.null()]).optional(),
        instructorName: z.union([z.string().max(255), z.null()]).optional(),
        instructorUserId: z.union([z.number().int().positive(), z.null()]).optional(),
        maxCapacity: z.number().int().min(1).max(2000).optional(),
        status: z.enum(["scheduled", "in_progress", "completed", "cancelled"]).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database connection failed",
        });
      }
      await assertInstitutionAccess(db, ctx.user, input.institutionId);
      const competencyAccess = await assertInstitutionProductCapability(db, input.institutionId, "iers", "iers.competency_training.operate");
      assertWritableProductAccess(competencyAccess);
      await assertInstitutionProductRole(db, ctx.user, input.institutionId, "iers", IERS_OPERATE_ROLES);
      await assertTrainingScheduleForInstitution(db, input.institutionId, input.trainingScheduleId);

      const [current] = await db
        .select()
        .from(trainingSchedules)
        .where(eq(trainingSchedules.id, input.trainingScheduleId))
        .limit(1);
      if (!current) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Training session not found." });
      }

      let courseId = current.courseId;
      if (input.programType !== undefined) {
        await ensureCourseCatalogForSchedule(db, input.programType);
        const courseRows = await db
          .select({ id: courses.id })
          .from(courses)
          .where(eq(courses.programType, input.programType))
          .orderBy(courses.id)
          .limit(1);
        if (!courseRows.length) {
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message:
              "No course catalog entry for this program type. Add rows to the `courses` table or contact support.",
          });
        }
        courseId = courseRows[0].id;
      }

      if (input.maxCapacity !== undefined) {
        const enrolled = current.enrolledCount ?? 0;
        if (input.maxCapacity < enrolled) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Max capacity cannot be less than current enrolled count (${enrolled}).`,
          });
        }
      }

      const prevInstructorId = current.instructorId ?? null;
      let nextInstructorId = prevInstructorId;
      if (input.instructorUserId !== undefined) {
        nextInstructorId = input.instructorUserId === null ? null : input.instructorUserId;
      }

      const setPayload: {
        courseId: number;
        updatedAt: Date;
        trainingType?: (typeof trainingSchedules.$inferSelect)["trainingType"];
        scheduledDate?: Date;
        endDate?: Date | null;
        startTime?: string | null;
        endTime?: string | null;
        location?: string | null;
        instructorId?: number | null;
        instructorName?: string | null;
        maxCapacity?: number;
        status?: (typeof trainingSchedules.$inferSelect)["status"];
      } = { courseId, updatedAt: new Date() };
      if (input.trainingType !== undefined) setPayload.trainingType = input.trainingType;
      if (input.scheduledDate !== undefined) setPayload.scheduledDate = input.scheduledDate;
      if (input.endDate !== undefined) setPayload.endDate = input.endDate;
      if (input.startTime !== undefined) {
        setPayload.startTime =
          input.startTime === null ? null : input.startTime.trim() === "" ? null : input.startTime.trim();
      }
      if (input.endTime !== undefined) {
        setPayload.endTime =
          input.endTime === null ? null : input.endTime.trim() === "" ? null : input.endTime.trim();
      }
      if (input.location !== undefined) {
        setPayload.location =
          input.location === null ? null : input.location.trim() === "" ? null : input.location.trim();
      }
      if (input.instructorUserId !== undefined) {
        if (input.instructorUserId === null) {
          setPayload.instructorId = null;
        } else {
          const u = await assertApprovedInstructorUser(db, input.instructorUserId);
          setPayload.instructorId = u.id;
          if (input.instructorName === undefined) {
            setPayload.instructorName = u.name?.trim() || null;
          }
        }
      }
      if (input.instructorName !== undefined) {
        setPayload.instructorName =
          input.instructorName === null
            ? null
            : input.instructorName.trim() === ""
              ? null
              : input.instructorName.trim();
      }
      if (input.maxCapacity !== undefined) setPayload.maxCapacity = input.maxCapacity;
      if (input.status !== undefined) setPayload.status = input.status;

      const nextStartDate = setPayload.scheduledDate ?? current.scheduledDate;
      const nextEndDate = setPayload.endDate !== undefined ? setPayload.endDate : current.endDate;
      if (nextEndDate && nextEndDate < nextStartDate) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "A multi-day session must end on or after its start date." });
      }

      // Only worth checking if there's actually an instructor assigned (new
      // or already-existing) AND something that could affect the overlap
      // window changed -- avoids a wasted query on unrelated edits.
      if (
        nextInstructorId != null &&
        (input.instructorUserId !== undefined ||
          input.scheduledDate !== undefined ||
          input.endDate !== undefined ||
          input.startTime !== undefined ||
          input.endTime !== undefined)
      ) {
        await assertNoInstructorDoubleBooking(db, {
          instructorId: nextInstructorId,
          scheduledDate: nextStartDate,
          endDate: nextEndDate,
          startTime: setPayload.startTime !== undefined ? setPayload.startTime : current.startTime,
          endTime: setPayload.endTime !== undefined ? setPayload.endTime : current.endTime,
          excludeScheduleId: input.trainingScheduleId,
        });
      }

      await db.update(trainingSchedules).set(setPayload).where(eq(trainingSchedules.id, input.trainingScheduleId));

      if (nextInstructorId != null && nextInstructorId !== prevInstructorId) {
        void notifyInstructorSessionAssigned(db, input.trainingScheduleId);
      }

      return { success: true as const };
    }),

  /**
   * HI-B2B-1: Remove a training session and its attendance rows (tenant-scoped).
   */
  deleteTrainingSchedule: protectedProcedure
    .input(
      z.object({
        institutionId: z.number().int().positive(),
        trainingScheduleId: z.number().int().positive(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database connection failed",
        });
      }
      await assertInstitutionAccess(db, ctx.user, input.institutionId);
      const competencyAccess = await assertInstitutionProductCapability(db, input.institutionId, "iers", "iers.competency_training.operate");
      assertWritableProductAccess(competencyAccess);
      await assertInstitutionProductRole(db, ctx.user, input.institutionId, "iers", IERS_OPERATE_ROLES);
      await assertTrainingScheduleForInstitution(db, input.institutionId, input.trainingScheduleId);

      await db
        .delete(trainingAttendance)
        .where(eq(trainingAttendance.trainingScheduleId, input.trainingScheduleId));
      await db.delete(trainingSchedules).where(eq(trainingSchedules.id, input.trainingScheduleId));

      return { success: true as const };
    }),

  /**
   * HI-B2B-2: Roster + attendance rows for one training session (tenant-scoped).
   */
  getTrainingAttendanceForSchedule: protectedProcedure
    .input(
      z.object({
        institutionId: z.number().int().positive(),
        trainingScheduleId: z.number().int().positive(),
      })
    )
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database connection failed",
        });
      }
      await assertInstitutionAccess(db, ctx.user, input.institutionId);
      await assertInstitutionProductCapability(db, input.institutionId, "iers", "iers.workspace.read");
      await assertInstitutionProductRole(db, ctx.user, input.institutionId, "iers", IERS_READ_ROLES);
      await assertTrainingScheduleForInstitution(db, input.institutionId, input.trainingScheduleId);

      const rows = await db
        .select({
          staffMemberId: institutionalStaffMembers.id,
          staffName: institutionalStaffMembers.staffName,
          staffEmail: institutionalStaffMembers.staffEmail,
          staffRole: institutionalStaffMembers.staffRole,
          department: institutionalStaffMembers.department,
          attendanceId: trainingAttendance.id,
          attendanceStatus: trainingAttendance.attendanceStatus,
        })
        .from(institutionalStaffMembers)
        .leftJoin(
          trainingAttendance,
          and(
            eq(trainingAttendance.staffMemberId, institutionalStaffMembers.id),
            eq(trainingAttendance.trainingScheduleId, input.trainingScheduleId)
          )
        )
        .where(eq(institutionalStaffMembers.institutionalAccountId, input.institutionId))
        .orderBy(asc(institutionalStaffMembers.staffName));

      return { rows };
    }),

  /** IERS competency projection for this institution, sourced from session attendance. */
  getIersCompetencyRecords: protectedProcedure
    .input(z.object({
      institutionId: z.number().int().positive(),
      programType: z.enum(["bls", "acls", "pals", "fellowship"]).optional(),
    }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed" });
      await assertInstitutionAccess(db, ctx.user, input.institutionId);
      await assertInstitutionProductCapability(db, input.institutionId, "iers", "iers.workspace.read");
      await assertInstitutionProductRole(db, ctx.user, input.institutionId, "iers", IERS_READ_ROLES);
      const conditions = [eq(iersCompetencyRecords.institutionalAccountId, input.institutionId)];
      if (input.programType) conditions.push(eq(iersCompetencyRecords.programType, input.programType));
      return db
        .select({
          id: iersCompetencyRecords.id,
          staffMemberId: iersCompetencyRecords.staffMemberId,
          staffName: institutionalStaffMembers.staffName,
          staffRole: institutionalStaffMembers.staffRole,
          trainingScheduleId: iersCompetencyRecords.trainingScheduleId,
          programType: iersCompetencyRecords.programType,
          competencyStatus: iersCompetencyRecords.competencyStatus,
          verifiedByUserId: iersCompetencyRecords.verifiedByUserId,
          verifiedAt: iersCompetencyRecords.verifiedAt,
          verificationNotes: iersCompetencyRecords.verificationNotes,
          updatedAt: iersCompetencyRecords.updatedAt,
        })
        .from(iersCompetencyRecords)
        .innerJoin(institutionalStaffMembers, eq(iersCompetencyRecords.staffMemberId, institutionalStaffMembers.id))
        .where(and(...conditions))
        .orderBy(desc(iersCompetencyRecords.updatedAt));
    }),

  /** Independently verify or reopen one IERS competency record; attendance alone never grants verified status. */
  verifyIersCompetencyRecord: protectedProcedure
    .input(z.object({
      institutionId: z.number().int().positive(),
      competencyRecordId: z.number().int().positive(),
      decision: z.enum(["verified", "pending"]),
      verificationNotes: z.string().trim().max(2000).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed" });
      await assertInstitutionAccess(db, ctx.user, input.institutionId);
      const access = await assertInstitutionProductCapability(db, input.institutionId, "iers", "iers.governance.review");
      assertWritableProductAccess(access);
      await assertInstitutionProductRole(db, ctx.user, input.institutionId, "iers", ["iers_reviewer", "iers_governance"]);
      await assertInstitutionAccountScope(db, ctx.user, input.institutionId, ["accreditation_reviewer", "qi_reviewer"], { allowInstitutionAdmin: true });

      const [record] = await db
        .select({
          id: iersCompetencyRecords.id,
          trainingAttendanceId: iersCompetencyRecords.trainingAttendanceId,
          attendanceStatus: trainingAttendance.attendanceStatus,
        })
        .from(iersCompetencyRecords)
        .innerJoin(trainingAttendance, eq(iersCompetencyRecords.trainingAttendanceId, trainingAttendance.id))
        .where(and(
          eq(iersCompetencyRecords.id, input.competencyRecordId),
          eq(iersCompetencyRecords.institutionalAccountId, input.institutionId),
        ))
        .limit(1);
      if (!record) throw new TRPCError({ code: "NOT_FOUND", message: "IERS competency record not found for this institution." });
      if (input.decision === "verified" && record.attendanceStatus !== "attended") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Only an attended source session can be independently verified." });
      }

      const verified = input.decision === "verified";
      await db.update(iersCompetencyRecords).set({
        competencyStatus: input.decision,
        verifiedByUserId: verified ? ctx.user.id : null,
        verifiedAt: verified ? new Date() : null,
        verificationNotes: input.verificationNotes?.trim() || (verified ? "Independently reviewed by an authorised IERS reviewer." : null),
        updatedAt: new Date(),
      }).where(and(
        eq(iersCompetencyRecords.id, input.competencyRecordId),
        eq(iersCompetencyRecords.institutionalAccountId, input.institutionId),
      ));
      return { success: true as const, competencyStatus: input.decision, trainingAttendanceId: record.trainingAttendanceId };
    }),

  /** HI-B2B-2: Create or update one staff member’s attendance for a session. */
  upsertTrainingAttendance: protectedProcedure
    .input(
      z.object({
        institutionId: z.number().int().positive(),
        trainingScheduleId: z.number().int().positive(),
        staffMemberId: z.number().int().positive(),
        attendanceStatus: z.enum(["registered", "attended", "absent", "cancelled"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database connection failed",
        });
      }
      await assertInstitutionAccess(db, ctx.user, input.institutionId);
      const competencyAccess = await assertInstitutionProductCapability(db, input.institutionId, "iers", "iers.competency_training.operate");
      assertWritableProductAccess(competencyAccess);
      await assertInstitutionProductRole(db, ctx.user, input.institutionId, "iers", IERS_OPERATE_ROLES);
      await assertTrainingScheduleForInstitution(db, input.institutionId, input.trainingScheduleId);

      const staffOk = await db
        .select({ id: institutionalStaffMembers.id })
        .from(institutionalStaffMembers)
        .where(
          and(
            eq(institutionalStaffMembers.id, input.staffMemberId),
            eq(institutionalStaffMembers.institutionalAccountId, input.institutionId)
          )
        )
        .limit(1);
      if (!staffOk.length) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Staff member not found for this institution." });
      }

      const existing = await db
        .select()
        .from(trainingAttendance)
        .where(
          and(
            eq(trainingAttendance.trainingScheduleId, input.trainingScheduleId),
            eq(trainingAttendance.staffMemberId, input.staffMemberId)
          )
        )
        .limit(1);

      if (existing.length) {
        await db
          .update(trainingAttendance)
          .set({ attendanceStatus: input.attendanceStatus, updatedAt: new Date() })
          .where(eq(trainingAttendance.id, existing[0].id));
      } else {
        await db.insert(trainingAttendance).values({
          trainingScheduleId: input.trainingScheduleId,
          staffMemberId: input.staffMemberId,
          attendanceStatus: input.attendanceStatus,
        });
      }

      const [attendanceRow] = await db
        .select({ id: trainingAttendance.id })
        .from(trainingAttendance)
        .where(and(
          eq(trainingAttendance.trainingScheduleId, input.trainingScheduleId),
          eq(trainingAttendance.staffMemberId, input.staffMemberId),
        ))
        .limit(1);
      if (attendanceRow) {
        await syncIersCompetencyRecord(db, {
          trainingAttendanceId: attendanceRow.id,
          trainingScheduleId: input.trainingScheduleId,
          staffMemberId: input.staffMemberId,
          attendanceStatus: input.attendanceStatus,
        });
      }
      await syncTrainingScheduleEnrolledCount(db, input.trainingScheduleId);
      await syncStaffRosterFromSessionAttendance(db, input.staffMemberId, input.attendanceStatus);
      return { success: true as const };
    }),

  /** HI-B2B-2: Register all roster staff as `registered` when they have no row yet. */
  registerAllStaffForTrainingSession: protectedProcedure
    .input(
      z.object({
        institutionId: z.number().int().positive(),
        trainingScheduleId: z.number().int().positive(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database connection failed",
        });
      }
      await assertInstitutionAccess(db, ctx.user, input.institutionId);
      const competencyAccess = await assertInstitutionProductCapability(db, input.institutionId, "iers", "iers.competency_training.operate");
      assertWritableProductAccess(competencyAccess);
      await assertInstitutionProductRole(db, ctx.user, input.institutionId, "iers", IERS_OPERATE_ROLES);
      await assertTrainingScheduleForInstitution(db, input.institutionId, input.trainingScheduleId);

      const staff = await db
        .select({ id: institutionalStaffMembers.id })
        .from(institutionalStaffMembers)
        .where(eq(institutionalStaffMembers.institutionalAccountId, input.institutionId));

      let added = 0;
      for (const s of staff) {
        const ex = await db
          .select({ id: trainingAttendance.id })
          .from(trainingAttendance)
          .where(
            and(
              eq(trainingAttendance.trainingScheduleId, input.trainingScheduleId),
              eq(trainingAttendance.staffMemberId, s.id)
            )
          )
          .limit(1);
        if (ex.length) continue;
        await db.insert(trainingAttendance).values({
          trainingScheduleId: input.trainingScheduleId,
          staffMemberId: s.id,
          attendanceStatus: "registered",
        });
        const [attendanceRow] = await db
          .select({ id: trainingAttendance.id })
          .from(trainingAttendance)
          .where(and(
            eq(trainingAttendance.trainingScheduleId, input.trainingScheduleId),
            eq(trainingAttendance.staffMemberId, s.id),
          ))
          .limit(1);
        if (attendanceRow) {
          await syncIersCompetencyRecord(db, {
            trainingAttendanceId: attendanceRow.id,
            trainingScheduleId: input.trainingScheduleId,
            staffMemberId: s.id,
            attendanceStatus: "registered",
          });
        }
        added += 1;
      }

      await syncTrainingScheduleEnrolledCount(db, input.trainingScheduleId);

      await db
        .update(institutionalStaffMembers)
        .set({
          enrollmentStatus: "enrolled",
          enrollmentDate: new Date(),
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(institutionalStaffMembers.institutionalAccountId, input.institutionId),
            eq(institutionalStaffMembers.enrollmentStatus, "pending")
          )
        );

      return { success: true as const, added };
    }),

  getStats: protectedProcedure
    .input(z.object({ institutionId: z.number() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database connection failed",
        });
      }

      await assertInstitutionAccess(db, ctx.user, input.institutionId);

      // --- AHA Training roster stats (unchanged) ---
      const staff = await db
        .select()
        .from(institutionalStaffMembers)
        .where(eq(institutionalStaffMembers.institutionalAccountId, input.institutionId));

      const totalStaff = staff.length;
      const enrolledStaff = staff.filter((s) => s.enrollmentStatus === "enrolled").length;
      const completedStaff = staff.filter((s) => s.enrollmentStatus === "completed").length;
      const certifiedStaff = staff.filter((s) => s.certificationStatus === "certified").length;

      // --- IERMS-era CPD metrics ---
      // Count of CPD events held by this institution (any state — open or closed).
      const [cpdEventsRow] = await db
        .select({ n: sql<number>`COUNT(*)` })
        .from(cpdEvents)
        .where(eq(cpdEvents.institutionalAccountId, input.institutionId));
      const totalCpdEvents = Number(cpdEventsRow?.n ?? 0);

      // Unique individuals who have registered for at least one CPD event at this institution.
      // cpdAttendees uses email as the unique identifier (no userId column in schema).
      const [cpdAttendeesRow] = await db
        .select({ n: sql<number>`COUNT(DISTINCT ${cpdAttendees.email})` })
        .from(cpdAttendees)
        .where(eq(cpdAttendees.institutionalAccountId, input.institutionId));
      const totalCpdAttendees = Number(cpdAttendeesRow?.n ?? 0);

      // Platform staff = union of explicit roster member emails + CPD attendee emails.
      // Both email sets are normalized to lowercase for deduplication accuracy.
      // institutionalStaffMembers uses staffEmail (not email).
      const cpdAttendeeEmailRows = await db
        .selectDistinct({ email: cpdAttendees.email })
        .from(cpdAttendees)
        .where(eq(cpdAttendees.institutionalAccountId, input.institutionId));

      const emailUnion = new Set<string>();
      for (const s of staff) {
        if (s.staffEmail) emailUnion.add(s.staffEmail.toLowerCase());
      }
      for (const r of cpdAttendeeEmailRows) {
        if (r.email) emailUnion.add(r.email.toLowerCase());
      }
      const totalPlatformStaff = emailUnion.size || totalStaff;

      return {
        // AHA training metrics (retained for backward compatibility)
        totalStaff,
        enrolledStaff,
        completedStaff,
        certifiedStaff,
        completionRate: totalStaff > 0 ? Math.round((completedStaff / totalStaff) * 100) : 0,
        certificationRate: totalStaff > 0 ? Math.round((certifiedStaff / totalStaff) * 100) : 0,
        // IERMS-era CPD + platform staff metrics
        totalCpdEvents,
        totalCpdAttendees,
        totalPlatformStaff,
      };
    }),

  /**
   * Create enrollments + pending payment rows for all staff in the institutional roster (bulk path).
   */
  bulkEnrollFromStaffRoster: protectedProcedure
    .input(
      z.object({
        institutionId: z.number().int().positive(),
        courseType: z.enum(["bls", "acls", "pals", "fellowship"]),
        trainingDate: z.coerce.date(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database connection failed",
        });
      }
      await assertInstitutionAccess(db, ctx.user, input.institutionId);

      const staff = await db
        .select()
        .from(institutionalStaffMembers)
        .where(eq(institutionalStaffMembers.institutionalAccountId, input.institutionId));

      if (staff.length === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Add staff to your roster before running bulk enrollment.",
        });
      }

      const staffList = staff.map((s) => ({
        name: s.staffName,
        email: s.staffEmail,
        phone: s.staffPhone?.trim() || "0000000000",
        department: s.department ?? undefined,
        role: s.staffRole ?? undefined,
      }));

      try {
        const result = await processBulkEnrollment({
          institutionId: input.institutionId,
          courseType: input.courseType,
          staffList,
          trainingDate: input.trainingDate,
        });
        return result;
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Bulk enrollment failed";
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: msg });
      }
    }),

  /** INST-13: List incidents for tenant. */
  getIncidents: protectedProcedure
    .input(
      z.object({
        institutionId: z.number(),
        limit: z.number().min(1).max(200).default(100),
      })
    )
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database connection failed",
        });
      }
      await assertInstitutionAccess(db, ctx.user, input.institutionId);
      return await db
        .select()
        .from(incidents)
        .where(eq(incidents.institutionalAccountId, input.institutionId))
        .orderBy(desc(incidents.incidentDate))
        .limit(input.limit);
    }),

  /** INST-13: Log a new incident (tenant-scoped). */
  createIncident: protectedProcedure
    .input(
      z.object({
        institutionId: z.number(),
        incidentDate: z.coerce.date(),
        incidentType: z.enum([
          "cardiac_arrest",
          "respiratory_failure",
          "severe_sepsis",
          "shock",
          "trauma",
          "other",
        ]),
        patientAge: z.number().int().min(0).max(600).optional(),
        responseTime: z.number().int().min(0).optional(),
        staffInvolved: z.array(z.number().int()).optional(),
        protocolsUsed: z.array(z.string()).optional(),
        outcome: z.enum(["pCOSCA", "ROSC", "mortality", "ongoing_resuscitation", "unknown"]),
        neurologicalStatus: z
          .enum(["intact", "mild_impairment", "moderate_impairment", "severe_impairment", "unknown"])
          .optional(),
        systemGapsIdentified: z.array(z.string()).optional(),
        improvementsImplemented: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database connection failed",
        });
      }
      await assertInstitutionAccess(db, ctx.user, input.institutionId);

      const { institutionId, staffInvolved, protocolsUsed, systemGapsIdentified, ...rest } = input;

      await db.insert(incidents).values({
        institutionalAccountId: institutionId,
        incidentDate: rest.incidentDate,
        incidentType: rest.incidentType,
        patientAge: rest.patientAge ?? null,
        responseTime: rest.responseTime ?? null,
        staffInvolved: staffInvolved?.length ? JSON.stringify(staffInvolved) : null,
        protocolsUsed: protocolsUsed?.length ? JSON.stringify(protocolsUsed) : null,
        outcome: rest.outcome,
        neurologicalStatus: rest.neurologicalStatus ?? null,
        systemGapsIdentified: systemGapsIdentified?.length ? JSON.stringify(systemGapsIdentified) : null,
        improvementsImplemented: rest.improvementsImplemented ?? null,
        notes: rest.notes ?? null,
      });

      try {
        await rollupInstitutionalAnalyticsForAccount(institutionId);
      } catch (e) {
        console.warn("[institution] createIncident rollup skipped:", e);
      }

      return { success: true };
    }),

  /** INST-14: Rolled-up metrics for charts / KPIs. */
  getInstitutionalAnalytics: protectedProcedure
    .input(z.object({ institutionId: z.number() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database connection failed",
        });
      }
      await assertInstitutionAccess(db, ctx.user, input.institutionId);
      const row = await db
        .select()
        .from(institutionalAnalytics)
        .where(eq(institutionalAnalytics.institutionalAccountId, input.institutionId))
        .limit(1);
      return row[0] ?? null;
    }),

  /** INST-14: Recompute rollup for one institution (tenant). */
  refreshInstitutionalAnalytics: protectedProcedure
    .input(z.object({ institutionId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database connection failed",
        });
      }
      await assertInstitutionAccess(db, ctx.user, input.institutionId);
      await rollupInstitutionalAnalyticsForAccount(input.institutionId);
      return { success: true };
    }),

  /** INST-14: Recompute rollups for all institutions (platform admin). */
  adminRunInstitutionalAnalyticsRollupAll: adminProcedure.mutation(async () => {
    return rollupAllInstitutionalAccounts();
  }),

  verify: publicProcedure
    .input(z.object({ institutionId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database connection failed",
        });
      }
      const institution = await db
        .select()
        .from(institutionalAccounts)
        .where(eq(institutionalAccounts.id, input.institutionId))
        .limit(1);

      return {
        exists: institution.length > 0,
        active: institution.length > 0 && institution[0].status === "active",
      };
    }),

  // Update staff member role (RBAC)
  updateStaffRole: protectedProcedure
    .input(
      z.object({
        institutionId: z.number(),
        staffMemberId: z.number(),
        newRole: z.enum(["director", "coordinator", "finance_officer", "department_head", "staff_member"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database connection failed",
          });
        }

        await assertInstitutionAccess(db, ctx.user, input.institutionId);
        if (!(await isInstitutionAdmin(db, ctx.user.id, input.institutionId))) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Only an institutional administrator can change staff roles." });
        }

        // Verify staff member exists
        const staffMember = await db
          .select()
          .from(institutionalStaffMembers)
          .where(
            and(
              eq(institutionalStaffMembers.id, input.staffMemberId),
              eq(institutionalStaffMembers.institutionalAccountId, input.institutionId)
            )
          )
          .limit(1);

        if (staffMember.length === 0) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Staff member not found",
          });
        }

        // Update the role
        await db
          .update(institutionalStaffMembers)
          .set({ institutionalRole: input.newRole })
          .where(eq(institutionalStaffMembers.id, input.staffMemberId));

        return {
          success: true,
          message: `Role updated to ${input.newRole}`,
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("Error updating staff role:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update staff role",
        });
      }
    }),

  // Get staff roles for an institution
  getStaffRoles: protectedProcedure
    .input(z.object({ institutionId: z.number() }))
    .query(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database connection failed",
          });
        }

        const staffMembers = await db
          .select({
            id: institutionalStaffMembers.id,
            staffName: institutionalStaffMembers.staffName,
            staffEmail: institutionalStaffMembers.staffEmail,
            department: institutionalStaffMembers.department,
            institutionalRole: institutionalStaffMembers.institutionalRole,
            staffRole: institutionalStaffMembers.staffRole,
          })
          .from(institutionalStaffMembers)
          .where(eq(institutionalStaffMembers.institutionalAccountId, input.institutionId));

        return staffMembers;
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch staff roles",
        });
      }
    }),

  // ─────────────────────────────────────────────────────────────────────────
  // INST-BULK-PAY-1: Get a live bulk enrollment quote (staff count + course type).
  // Used by the portal to show a real-time price breakdown before payment.
  // ─────────────────────────────────────────────────────────────────────────
  getBulkEnrollmentQuote: protectedProcedure
    .input(
      z.object({
        institutionId: z.number().int().positive(),
        courseType: z.enum(["bls", "acls", "pals", "fellowship"]),
      })
    )
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      await assertInstitutionAccess(db, ctx.user, input.institutionId);

      const staffRows = await db
        .select({ id: institutionalStaffMembers.id })
        .from(institutionalStaffMembers)
        .where(eq(institutionalStaffMembers.institutionalAccountId, input.institutionId));

      const staffCount = staffRows.length;
      if (staffCount === 0) {
        return { staffCount: 0, basePrice: 0, pricePerStaff: 0, totalPrice: 0, discountPercentage: 0, totalDiscount: 0 };
      }

      const pricing = getInstitutionalPricing(input.courseType, staffCount);
      return { staffCount, ...pricing };
    }),

  // ─────────────────────────────────────────────────────────────────────────
  // INST-BULK-PAY-2: Initiate M-Pesa STK push for bulk enrollment payment.
  // Creates all enrollment rows (pending), then triggers a single STK push
  // for the total amount to the institution admin's phone.
  // On M-Pesa callback, the webhook marks the payment completed and the
  // existing certificate flow handles individual cert issuance.
  // ─────────────────────────────────────────────────────────────────────────
  initiateBulkEnrollmentPayment: protectedProcedure
    .input(
      z.object({
        institutionId: z.number().int().positive(),
        courseType: z.enum(["bls", "acls", "pals", "fellowship"]),
        trainingDate: z.coerce.date(),
        phoneNumber: z.string().min(9).max(15),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      await assertInstitutionAccess(db, ctx.user, input.institutionId);

      if (!isMpesaConfigured()) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "M-Pesa is not configured on this server" });
      }

      if (!validatePhoneNumber(input.phoneNumber)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid M-Pesa phone number" });
      }

      // Step 1: Create all enrollment rows (paymentStatus = 'pending')
      const enrollmentResult = await processBulkEnrollment({
        institutionId: input.institutionId,
        courseType: input.courseType,
        staffList: await (async () => {
          const staffRows = await db
            .select()
            .from(institutionalStaffMembers)
            .where(eq(institutionalStaffMembers.institutionalAccountId, input.institutionId));
          return staffRows.map((s) => ({
            name: s.staffName,
            email: s.staffEmail ?? `staff-${s.id}@institution.local`,
            phone: s.staffPhone?.trim() || "0000000000",
            department: s.department ?? undefined,
            role: s.staffRole ?? undefined,
          }));
        })(),
        trainingDate: input.trainingDate,
      });

      if (!enrollmentResult.success || enrollmentResult.enrolledCount === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Bulk enrollment failed: ${enrollmentResult.failedEmails.length} staff could not be enrolled. Ensure all staff have valid email addresses.`,
        });
      }

      // Step 2: Initiate a single STK push for the total amount
      const totalAmountKes = Math.round(enrollmentResult.finalCost);
      const description = `${input.courseType.toUpperCase()} bulk training — ${enrollmentResult.enrolledCount} staff`;

      const stkResult = await initiateSTKPush(
        input.phoneNumber,
        totalAmountKes,
        `BULK-${input.institutionId}-${input.courseType.toUpperCase()}`,
        description,
        0
      );

      if (!stkResult.success) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: stkResult.message || "M-Pesa STK push failed",
        });
      }

      // Step 3: Record a single consolidated payment row for the bulk transaction
      // enrollmentId = first enrollment in the batch (used for webhook lookup)
      const firstEnrollmentId = enrollmentResult.enrollmentIds[0] ?? 0;
      await db.insert(payments).values({
        enrollmentId: firstEnrollmentId,
        userId: ctx.user.id,
        amount: totalAmountKes * 100, // stored in cents
        paymentMethod: "mpesa",
        status: "pending",
        transactionId: stkResult.checkoutRequestId || `BULK-${Date.now()}`,
        idempotencyKey: stkResult.checkoutRequestId || undefined,
      });

      return {
        success: true,
        checkoutRequestId: stkResult.checkoutRequestId,
        enrolledCount: enrollmentResult.enrolledCount,
        failedCount: enrollmentResult.failedCount,
        totalAmountKes,
        message: `STK push sent to ${input.phoneNumber}. Enter your M-Pesa PIN to confirm payment for ${enrollmentResult.enrolledCount} staff.`,
      };
    }),

  /** Phase 4 pilot: facility action log — gap identified → documented system change. */
  getActionLogs: protectedProcedure
    .input(
      z.object({
        institutionId: z.number(),
        limit: z.number().min(1).max(200).default(100),
      })
    )
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database connection failed",
        });
      }
      await assertInstitutionAccess(db, ctx.user, input.institutionId);
      await assertInstitutionProductCapability(db, input.institutionId, "iers", "iers.workspace.read");
      await assertInstitutionProductRole(db, ctx.user, input.institutionId, "iers", IERS_READ_ROLES);
      await assertInstitutionAccountScope(db, ctx.user, input.institutionId, ["qi_reviewer", "accreditation_reviewer", "report_viewer"], { allowInstitutionAdmin: true });
      await syncLegacyActionLogsIntoIers(db, input.institutionId, ctx.user.id);
      return await db
        .select()
        .from(institutionalActionLogs)
        .where(eq(institutionalActionLogs.institutionalAccountId, input.institutionId))
        .orderBy(desc(institutionalActionLogs.createdAt))
        .limit(input.limit);
    }),

  createActionLog: protectedProcedure
    .input(
      z.object({
        institutionId: z.number(),
        gapIdentified: z.string().min(3).max(2000),
        systemChange: z.string().min(3).max(4000),
        status: z.enum(["open", "in_progress", "completed"]).default("open"),
        careSignalEventId: z.number().int().positive().optional(),
        codeSignalEventId: z.number().int().positive().optional(),
        notes: z.string().max(4000).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database connection failed",
        });
      }
      await assertInstitutionAccess(db, ctx.user, input.institutionId);
      const actionAccess = await assertInstitutionProductCapability(db, input.institutionId, "iers", "iers.actions.operate");
      assertWritableProductAccess(actionAccess);
      await assertInstitutionProductRole(db, ctx.user, input.institutionId, "iers", IERS_ACTION_ROLES);
      await assertInstitutionAccountScope(db, ctx.user, input.institutionId, ["qi_reviewer", "accreditation_reviewer"], { allowInstitutionAdmin: true });

      const result = await db.insert(institutionalActionLogs).values({
        institutionalAccountId: input.institutionId,
        createdByUserId: ctx.user.id,
        gapIdentified: input.gapIdentified.trim(),
        systemChange: input.systemChange.trim(),
        status: input.status,
        careSignalEventId: input.careSignalEventId ?? null,
        codeSignalEventId: input.codeSignalEventId ?? null,
        notes: input.notes?.trim() ?? null,
      });

      const insertId = (result as unknown as { insertId: number }).insertId;
      await db.insert(iersActionItems).values({
        institutionId: input.institutionId,
        sourceType: input.careSignalEventId ? "care_signal" : input.codeSignalEventId ? "code_signal" : "manual",
        sourceId: input.careSignalEventId ?? input.codeSignalEventId ?? insertId,
        legacyActionLogId: insertId,
        title: input.gapIdentified.trim().slice(0, 255),
        gapDescription: [input.gapIdentified.trim(), `System change: ${input.systemChange.trim()}`, input.notes?.trim() ? `Notes: ${input.notes.trim()}` : null].filter(Boolean).join("\\n\\n"),
        priority: "medium",
        status: input.status === "completed" ? "awaiting_verification" : input.status,
        closureNote: input.status === "completed" ? input.systemChange.trim() : null,
        createdByUserId: ctx.user.id,
      });

      return { success: true, id: insertId };
    }),

  /** Update status on an existing action log entry (Care Signal closure workflow). */
  updateActionLogStatus: protectedProcedure
    .input(
      z.object({
        id: z.number().int().positive(),
        institutionId: z.number(),
        status: z.enum(["open", "in_progress", "completed"]),
        systemChange: z.string().min(3).max(4000).optional(),
        notes: z.string().max(4000).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database connection failed",
        });
      }
      await assertInstitutionAccess(db, ctx.user, input.institutionId);
      const actionAccess = await assertInstitutionProductCapability(db, input.institutionId, "iers", "iers.actions.operate");
      assertWritableProductAccess(actionAccess);
      await assertInstitutionProductRole(db, ctx.user, input.institutionId, "iers", IERS_ACTION_ROLES);
      await assertInstitutionAccountScope(db, ctx.user, input.institutionId, ["qi_reviewer", "accreditation_reviewer"], { allowInstitutionAdmin: true });

      const [existing] = await db
        .select()
        .from(institutionalActionLogs)
        .where(
          and(
            eq(institutionalActionLogs.id, input.id),
            eq(institutionalActionLogs.institutionalAccountId, input.institutionId)
          )
        )
        .limit(1);

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Action log entry not found" });
      }

      const fromStatus = existing.status as ActionLogStatus;
      const toStatus = input.status;

      if (!isValidActionLogStatusTransition(fromStatus, toStatus)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Cannot transition action log from "${fromStatus}" to "${toStatus}"`,
        });
      }

      if (
        requiresSystemChangeOnResolve(existing.systemChange, toStatus, input.systemChange)
      ) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "Document the system change your hospital committed to before marking this action completed.",
        });
      }

      const nextSystemChange = input.systemChange?.trim() ?? existing.systemChange;
      const nextNotes =
        input.notes !== undefined ? input.notes.trim() || null : existing.notes;

      await db
        .update(institutionalActionLogs)
        .set({
          status: toStatus,
          systemChange: nextSystemChange,
          notes: nextNotes,
        })
        .where(eq(institutionalActionLogs.id, input.id));

      await db
        .update(iersActionItems)
        .set({
          status: toStatus === "completed" ? "awaiting_verification" : toStatus,
          gapDescription: [existing.gapIdentified.trim(), `System change: ${nextSystemChange.trim()}`, nextNotes?.trim() ? `Notes: ${nextNotes.trim()}` : null].filter(Boolean).join("\\n\\n"),
          closureNote: toStatus === "completed" ? nextSystemChange.trim() : null,
          updatedAt: new Date(),
        })
        .where(and(
          eq(iersActionItems.institutionId, input.institutionId),
          eq(iersActionItems.legacyActionLogId, input.id),
        ));

      if (fromStatus !== "completed" && toStatus === "completed") {
        await trackEvent({
          userId: ctx.user.id,
          eventType: "institutional_action_log_resolved",
          eventName: "Institutional action log resolved",
          eventData: {
            actionLogId: input.id,
            institutionId: input.institutionId,
            careSignalEventId: existing.careSignalEventId,
            previousStatus: fromStatus,
          },
          sessionId: `action_log_${input.id}`,
        });
      }

      return { success: true, id: input.id, status: toStatus };
    }),

  /**
   * Facility-level Care Signal gap rollup (gap-analysis #5). Same aggregation
   * logic as an individual provider's getGapAnalysis, but scoped to every
   * facility this institution owns — this is the "institutional action"
   * stage of North Star's holistic loop (Stage 5), which until now only had
   * a manual "type in a gap you noticed" flow (createActionLog below), not
   * anything actually driven by the Care Signal data itself.
   *
   * Privacy: mirrors the ≥5-event anonymisation threshold already used for
   * platform-wide aggregates elsewhere in care-signal-events.ts. Below that,
   * a facility-level breakdown risks identifying which individual provider
   * filed a report, so the detailed breakdown is suppressed (total count and
   * reporter count still shown — that much is already visible to an
   * institutional admin by definition of running the query).
   */
  getFacilityGapAnalysis: protectedProcedure
    .input(
      z.object({
        institutionId: z.number(),
        timeframe: z.enum(["week", "month", "quarter", "year"]).default("month"),
      })
    )
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed" });
      }
      await assertInstitutionAccess(db, ctx.user, input.institutionId);
      await assertInstitutionProductCapability(db, input.institutionId, "iers", "iers.governance.review");
      await assertInstitutionProductRole(db, ctx.user, input.institutionId, "iers", IERS_READ_ROLES);
      await assertInstitutionAccountScope(db, ctx.user, input.institutionId, ["qi_reviewer", "accreditation_reviewer", "report_viewer"], { allowInstitutionAdmin: true });

      const ANONYMIZATION_THRESHOLD = 5;

      const facilityRows = await db
        .select({ id: careFacilities.id, name: careFacilities.name })
        .from(careFacilities)
        .where(
          and(
            eq(careFacilities.institutionalAccountId, input.institutionId),
            isNull(careFacilities.mergedIntoId)
          )
        );

      const facilityIds = facilityRows.map((f) => f.id);
      if (facilityIds.length === 0) {
        return {
          success: true,
          timeframe: input.timeframe,
          totalEvents: 0,
          uniqueReporters: 0,
          suppressed: false,
          gaps: [] as GapCategoryStat[],
          recommendations: [] as GapRecommendation[],
          byFacility: [] as { facilityId: number; facilityName: string; eventCount: number }[],
        };
      }

      const since = new Date(Date.now() - daysBackForTimeframe(input.timeframe) * 86_400_000);

      const events = await db
        .select({
          systemGaps: careSignalEvents.systemGaps,
          outcome: careSignalEvents.outcome,
          eventType: careSignalEvents.eventType,
          conditionCategory: careSignalEvents.conditionCategory,
          facilityId: careSignalEvents.facilityId,
          userId: careSignalEvents.userId,
        })
        .from(careSignalEvents)
        .where(and(inArray(careSignalEvents.facilityId, facilityIds), gte(careSignalEvents.createdAt, since)));

      const totalEvents = events.length;
      const uniqueReporters = new Set(events.map((e) => e.userId)).size;

      if (totalEvents < ANONYMIZATION_THRESHOLD) {
        return {
          success: true,
          timeframe: input.timeframe,
          totalEvents,
          uniqueReporters,
          suppressed: true,
          suppressionReason: `Fewer than ${ANONYMIZATION_THRESHOLD} Care Signal events across your facility/facilities in this timeframe — a detailed breakdown would risk identifying an individual provider's report. Try a longer timeframe.`,
          gaps: [] as GapCategoryStat[],
          recommendations: [] as GapRecommendation[],
          byFacility: [] as { facilityId: number; facilityName: string; eventCount: number }[],
        };
      }

      const gapCounts: Record<string, number> = {};
      const outcomes: string[] = [];
      const eventTypes: string[] = [];
      const conditionCategories: string[] = [];
      const perFacilityCounts: Record<number, number> = {};

      for (const e of events) {
        outcomes.push(e.outcome);
        eventTypes.push(e.eventType);
        if (e.conditionCategory) conditionCategories.push(e.conditionCategory);
        if (e.facilityId) perFacilityCounts[e.facilityId] = (perFacilityCounts[e.facilityId] ?? 0) + 1;
        try {
          const gaps = JSON.parse(e.systemGaps) as string[];
          for (const g of gaps) gapCounts[g] = (gapCounts[g] ?? 0) + 1;
        } catch { /* skip */ }
      }

      const gaps = gapCountsToArray(gapCounts);

      const worstOutcome = outcomes.includes("died")
        ? "died"
        : outcomes.includes("poor_outcome")
        ? "poor_outcome"
        : outcomes[0] ?? "unknown";

      const etCounts: Record<string, number> = {};
      for (const et of eventTypes) etCounts[et] = (etCounts[et] ?? 0) + 1;
      const mostCommonEventType = Object.entries(etCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "unknown";

      const ccCounts: Record<string, number> = {};
      for (const cc of conditionCategories) ccCounts[cc] = (ccCounts[cc] ?? 0) + 1;
      const mostCommonConditionCategory = Object.entries(ccCounts).sort((a, b) => b[1] - a[1])[0]?.[0];

      const topGaps = gaps.slice(0, 5).map((g) => g.category);
      const recommendations = await buildRecommendations(topGaps, worstOutcome, mostCommonEventType, mostCommonConditionCategory);

      const byFacility = facilityRows
        .map((f) => ({ facilityId: f.id, facilityName: f.name, eventCount: perFacilityCounts[f.id] ?? 0 }))
        .filter((f) => facilityRows.length === 1 || f.eventCount >= ANONYMIZATION_THRESHOLD)
        .sort((a, b) => b.eventCount - a.eventCount);

      return {
        success: true,
        timeframe: input.timeframe,
        totalEvents,
        uniqueReporters,
        suppressed: false,
        gaps,
        recommendations,
        byFacility,
      };
    }),

  /** Open action log entries auto-created from Care Signal submissions — for dashboard alerts. */
  getPendingCareSignalActions: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Database connection failed",
      });
    }

    const pendingAdminIds = await getAdministeredInstitutionIds(db, ctx.user.id);
    const rows = pendingAdminIds.length
      ? await db
          .select({ id: institutionalAccounts.id })
          .from(institutionalAccounts)
          .where(inArray(institutionalAccounts.id, pendingAdminIds))
          .orderBy(desc(institutionalAccounts.id))
          .limit(1)
      : [];
    const institutionId = rows[0]?.id;
    if (!institutionId) {
      return { count: 0, items: [] as { id: number; gapIdentified: string; careSignalEventId: number | null; createdAt: Date }[] };
    }

    const pending = await db
      .select({
        id: institutionalActionLogs.id,
        gapIdentified: institutionalActionLogs.gapIdentified,
        careSignalEventId: institutionalActionLogs.careSignalEventId,
        createdAt: institutionalActionLogs.createdAt,
      })
      .from(institutionalActionLogs)
      .where(
        and(
          eq(institutionalActionLogs.institutionalAccountId, institutionId),
          eq(institutionalActionLogs.status, "open")
        )
      )
      .orderBy(desc(institutionalActionLogs.createdAt))
      .limit(20);

    const fromCareSignal = pending.filter((p) => p.careSignalEventId != null);

    return {
      count: fromCareSignal.length,
      items: fromCareSignal,
    };
  }),

  /** Code Signal counterpart of getPendingCareSignalActions above. */
  getPendingCodeSignalActions: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Database connection failed",
      });
    }

    const pendingAdminIds = await getAdministeredInstitutionIds(db, ctx.user.id);
    const rows = pendingAdminIds.length
      ? await db
          .select({ id: institutionalAccounts.id })
          .from(institutionalAccounts)
          .where(inArray(institutionalAccounts.id, pendingAdminIds))
          .orderBy(desc(institutionalAccounts.id))
          .limit(1)
      : [];
    const institutionId = rows[0]?.id;
    if (!institutionId) {
      return { count: 0, items: [] as { id: number; gapIdentified: string; codeSignalEventId: number | null; createdAt: Date }[] };
    }

    const pending = await db
      .select({
        id: institutionalActionLogs.id,
        gapIdentified: institutionalActionLogs.gapIdentified,
        codeSignalEventId: institutionalActionLogs.codeSignalEventId,
        createdAt: institutionalActionLogs.createdAt,
      })
      .from(institutionalActionLogs)
      .where(
        and(
          eq(institutionalActionLogs.institutionalAccountId, institutionId),
          eq(institutionalActionLogs.status, "open")
        )
      )
      .orderBy(desc(institutionalActionLogs.createdAt))
      .limit(20);

    const fromCodeSignal = pending.filter((p) => p.codeSignalEventId != null);

    return {
      count: fromCodeSignal.length,
      items: fromCodeSignal,
    };
  }),

  runResusGpsAudit: protectedProcedure
    .input(z.object({ institutionId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database connection failed",
        });
      }
      return await runResusGpsAuditForInstitution(db, input.institutionId);
    }),

  importResusGpsAuditAction: protectedProcedure
    .input(
      z.object({
        institutionId: z.number(),
        gapIdentified: z.string().min(1),
        systemChange: z.string().min(1),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database connection failed",
        });
      }

      await db.insert(institutionalActionLogs).values({
        institutionalAccountId: input.institutionId,
        createdByUserId: ctx.user ? ctx.user.id : null,
        gapIdentified: input.gapIdentified,
        systemChange: input.systemChange,
        status: "open",
        notes: "Imported from Automated ResusGPS Quality Audit.",
      });

      return { success: true };
    }),

  getCohortProgress: protectedProcedure
    .input(z.object({ institutionId: z.number() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database connection failed",
        });
      }

      await assertInstitutionAccess(db, ctx.user, input.institutionId);

      return await getCohortProgressStats(db, input.institutionId);
    }),

  getPendingLinkRequests: protectedProcedure
    .input(z.object({ institutionId: z.number() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database connection failed",
        });
      }

      await assertInstitutionAccess(db, ctx.user, input.institutionId);

      return await db
        .select()
        .from(institutionalStaffMembers)
        .where(and(
          eq(institutionalStaffMembers.institutionalAccountId, input.institutionId),
          eq(institutionalStaffMembers.facilityLinkStatus, "pending")
        ));
    }),

  getDepartmentMismatchReports: protectedProcedure
    .input(z.object({ institutionId: z.number().int().positive() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed" });
      await assertInstitutionAccess(db, ctx.user, input.institutionId);
      return db
        .select({
          id: institutionalActionLogs.id,
          gapIdentified: institutionalActionLogs.gapIdentified,
          systemChange: institutionalActionLogs.systemChange,
          status: institutionalActionLogs.status,
          notes: institutionalActionLogs.notes,
          createdByUserId: institutionalActionLogs.createdByUserId,
          createdAt: institutionalActionLogs.createdAt,
        })
        .from(institutionalActionLogs)
        .where(and(
          eq(institutionalActionLogs.institutionalAccountId, input.institutionId),
          eq(institutionalActionLogs.status, "open"),
          like(institutionalActionLogs.systemChange, "DEPARTMENT_MISMATCH_REVIEW:%"),
        ))
        .orderBy(desc(institutionalActionLogs.createdAt));
    }),

  reportDepartmentMismatch: protectedProcedure
    .input(z.object({
      institutionId: z.number().int().positive(),
      departmentId: z.number().int().positive(),
      providerUserId: z.number().int().positive(),
      reason: z.string().trim().min(10).max(1000),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed" });
      await assertIersDepartmentRotaWriteAccess(db, ctx.user, input.institutionId, input.departmentId);

      const [department] = await db
        .select({ id: facilityDepartments.id, departmentName: facilityDepartments.departmentName })
        .from(facilityDepartments)
        .where(and(
          eq(facilityDepartments.id, input.departmentId),
          eq(facilityDepartments.institutionId, input.institutionId),
          eq(facilityDepartments.isActive, true),
        ))
        .limit(1);
      if (!department) throw new TRPCError({ code: "NOT_FOUND", message: "Department not found in this institution." });

      const [provider] = await db
        .select({ id: users.id, name: users.name, email: users.email, providerType: users.providerType, cadre: users.cadre, cadreOther: users.cadreOther })
        .from(users)
        .where(eq(users.id, input.providerUserId))
        .limit(1);
      if (!provider?.email) throw new TRPCError({ code: "NOT_FOUND", message: "Provider account not found." });

      const [profile] = await db
        .select({ department: providerProfiles.department })
        .from(providerProfiles)
        .where(eq(providerProfiles.userId, input.providerUserId))
        .limit(1);
      const [cpdAttendance] = await db
        .select({ department: cpdAttendees.department, facilityDepartmentId: cpdAttendees.facilityDepartmentId, cadre: cpdAttendees.cadre, cadreOther: cpdAttendees.cadreOther })
        .from(cpdAttendees)
        .where(and(
          eq(cpdAttendees.institutionalAccountId, input.institutionId),
          sql`LOWER(TRIM(${cpdAttendees.email})) = LOWER(TRIM(${provider.email}))`,
        ))
        .orderBy(desc(cpdAttendees.id))
        .limit(1);
      const [staff] = await db
        .select({ id: institutionalStaffMembers.id, department: institutionalStaffMembers.department, facilityDepartmentId: institutionalStaffMembers.facilityDepartmentId, facilityLinkStatus: institutionalStaffMembers.facilityLinkStatus, removedAt: institutionalStaffMembers.removedAt })
        .from(institutionalStaffMembers)
        .where(and(
          eq(institutionalStaffMembers.institutionalAccountId, input.institutionId),
          eq(institutionalStaffMembers.userId, input.providerUserId),
        ))
        .orderBy(desc(institutionalStaffMembers.id))
        .limit(1);
      const [membership] = await db
        .select({ membershipStatus: institutionMemberships.membershipStatus })
        .from(institutionMemberships)
        .where(and(
          eq(institutionMemberships.institutionalAccountId, input.institutionId),
          eq(institutionMemberships.userId, input.providerUserId),
        ))
        .orderBy(desc(institutionMemberships.id))
        .limit(1);

      const providerIsRn = isRegisteredRnProfile({
        providerType: provider.providerType,
        cadre: provider.cadre ?? cpdAttendance?.cadre,
        cadreOther: provider.cadreOther ?? cpdAttendance?.cadreOther,
      });
      if (!providerIsRn) throw new TRPCError({ code: "BAD_REQUEST", message: "Only a registered non-student Staff/RN candidate can raise an IERS department mismatch." });

      const linkedToSelectedDepartment = Boolean(
        staff?.facilityDepartmentId === department.id
        || cpdAttendance?.facilityDepartmentId === department.id
        || (staff?.department && departmentLabelsMatch(staff.department, department.departmentName))
        || (profile?.department && departmentLabelsMatch(profile.department, department.departmentName))
        || (cpdAttendance?.department && departmentLabelsMatch(cpdAttendance.department, department.departmentName))
      );
      if (!linkedToSelectedDepartment) throw new TRPCError({ code: "BAD_REQUEST", message: "This provider is not linked to the selected canonical department." });

      const currentlyCurrent = staff?.facilityDepartmentId === department.id
        || Boolean(staff?.facilityDepartmentId == null && staff?.department && departmentLabelsMatch(staff.department, department.departmentName));
      const needsReview = !currentlyCurrent || staff?.facilityLinkStatus !== "linked" || membership?.membershipStatus !== "active" || staff?.removedAt != null;
      if (!needsReview) throw new TRPCError({ code: "BAD_REQUEST", message: "This provider is already an active member of the selected department." });

      const systemChange = `DEPARTMENT_MISMATCH_REVIEW:${input.providerUserId}:${input.departmentId}`;
      const [existingReport] = await db
        .select({ id: institutionalActionLogs.id })
        .from(institutionalActionLogs)
        .where(and(
          eq(institutionalActionLogs.institutionalAccountId, input.institutionId),
          eq(institutionalActionLogs.systemChange, systemChange),
          eq(institutionalActionLogs.status, "open"),
        ))
        .limit(1);
      if (existingReport) return { success: true as const, reportId: existingReport.id, duplicate: true as const, notifiedAdminCount: 0 };

      const providerLabel = `${provider.name?.trim() || "Provider"} (${provider.email.trim().toLowerCase()})`;
      const currentDepartment = staff?.department?.trim() || "No current department recorded";
      const reportNotes = JSON.stringify({
        providerUserId: input.providerUserId,
        staffMemberId: staff?.id ?? null,
        departmentId: input.departmentId,
        providerEmail: provider.email.trim().toLowerCase(),
        currentDepartment,
        membershipStatus: membership?.membershipStatus ?? null,
        reason: input.reason.trim(),
      });
      const reportInsert = await db.insert(institutionalActionLogs).values({
        institutionalAccountId: input.institutionId,
        createdByUserId: ctx.user.id,
        gapIdentified: `${providerLabel} is linked to ${department.departmentName} but is not a current member of that department.`,
        systemChange,
        status: "open",
        notes: reportNotes,
      });
      const reportId = Number((reportInsert as unknown as { insertId: number }).insertId);
      const actionUrl = `/institution?section=administration&adminTab=people_roles&departmentId=${input.departmentId}&providerUserId=${input.providerUserId}&mismatchReportId=${reportId}`;
      const [account] = await db
        .select({ ownerUserId: institutionalAccounts.userId })
        .from(institutionalAccounts)
        .where(eq(institutionalAccounts.id, input.institutionId))
        .limit(1);
      const adminRows = await db
        .select({ userId: institutionalAccountAdmins.userId })
        .from(institutionalAccountAdmins)
        .where(eq(institutionalAccountAdmins.institutionalAccountId, input.institutionId));
      const recipients = [...new Set([
        account?.ownerUserId ?? null,
        ...adminRows.map((row) => row.userId),
      ].filter((userId): userId is number => userId != null && userId !== ctx.user.id))];
      let notifiedAdminCount = 0;
      for (const recipientId of recipients) {
        const [existingNotification] = await db
          .select({ id: inAppNotifications.id })
          .from(inAppNotifications)
          .where(and(
            eq(inAppNotifications.userId, recipientId),
            eq(inAppNotifications.type, "iers_department_mismatch"),
            eq(inAppNotifications.relatedId, input.providerUserId),
            eq(inAppNotifications.actionUrl, actionUrl),
            eq(inAppNotifications.read, false),
          ))
          .limit(1);
        if (existingNotification) continue;
        await db.insert(inAppNotifications).values({
          userId: recipientId,
          type: "iers_department_mismatch",
          title: "ERCo flagged a department membership mismatch",
          body: `${providerLabel} is linked to ${department.departmentName}, but the current roster says: ${currentDepartment}. Review, reallocate the department, or retire the person from this institution. Reason: ${input.reason.trim()}`,
          actionUrl,
          relatedId: input.providerUserId,
          read: false,
        });
        notifiedAdminCount += 1;
      }
      return { success: true as const, reportId, duplicate: false as const, notifiedAdminCount };
    }),

  reallocateInstitutionStaffDepartment: protectedProcedure
    .input(z.object({
      institutionId: z.number().int().positive(),
      staffMemberId: z.number().int().positive(),
      departmentId: z.number().int().positive(),
      reason: z.string().trim().min(10).max(1000),
      mismatchReportId: z.number().int().positive().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed" });
      await assertInstitutionAccess(db, ctx.user, input.institutionId);

      const [department] = await db
        .select({ id: facilityDepartments.id, departmentName: facilityDepartments.departmentName })
        .from(facilityDepartments)
        .where(and(
          eq(facilityDepartments.id, input.departmentId),
          eq(facilityDepartments.institutionId, input.institutionId),
          eq(facilityDepartments.isActive, true),
        ))
        .limit(1);
      if (!department) throw new TRPCError({ code: "NOT_FOUND", message: "The selected department is not active in this institution." });

      const [staff] = await db
        .select({ id: institutionalStaffMembers.id, userId: institutionalStaffMembers.userId, staffName: institutionalStaffMembers.staffName, department: institutionalStaffMembers.department, facilityDepartmentId: institutionalStaffMembers.facilityDepartmentId, removedAt: institutionalStaffMembers.removedAt })
        .from(institutionalStaffMembers)
        .where(and(
          eq(institutionalStaffMembers.id, input.staffMemberId),
          eq(institutionalStaffMembers.institutionalAccountId, input.institutionId),
        ))
        .limit(1);
      if (!staff) throw new TRPCError({ code: "NOT_FOUND", message: "Institution staff member not found." });
      if (staff.removedAt) throw new TRPCError({ code: "BAD_REQUEST", message: "This person has already been retired from the institution." });
      if (staff.facilityDepartmentId === input.departmentId) throw new TRPCError({ code: "BAD_REQUEST", message: "This staff member is already assigned to the selected department." });

      const now = new Date();
      await db.transaction(async (tx) => {
        await tx.update(institutionalStaffMembers).set({
          department: department.departmentName,
          facilityDepartmentId: department.id,
          updatedAt: now,
        }).where(and(
          eq(institutionalStaffMembers.id, input.staffMemberId),
          eq(institutionalStaffMembers.institutionalAccountId, input.institutionId),
          isNull(institutionalStaffMembers.removedAt),
        ));
        if (staff.userId != null) {
          await tx.update(institutionDepartmentResponseCoordinators)
            .set({ assignmentStatus: "ended", updatedAt: now })
            .where(and(
              eq(institutionDepartmentResponseCoordinators.institutionId, input.institutionId),
              eq(institutionDepartmentResponseCoordinators.coordinatorUserId, staff.userId),
              or(eq(institutionDepartmentResponseCoordinators.assignmentStatus, "active"), eq(institutionDepartmentResponseCoordinators.assignmentStatus, "pending_acceptance")),
            ));
          await tx.update(monthlyUtlRotations)
            .set({ assignmentStatus: "ended", providerUserId: null, updatedAt: now })
            .where(and(
              eq(monthlyUtlRotations.institutionId, input.institutionId),
              eq(monthlyUtlRotations.providerUserId, staff.userId),
              or(eq(monthlyUtlRotations.assignmentStatus, "unassigned"), eq(monthlyUtlRotations.assignmentStatus, "pending_acceptance"), eq(monthlyUtlRotations.assignmentStatus, "active")),
            ));
          await tx.update(shiftUtlRosters)
            .set({ assignmentStatus: "ended", status: "absent" })
            .where(and(
              eq(shiftUtlRosters.institutionId, input.institutionId),
              eq(shiftUtlRosters.utlUserId, staff.userId),
              gte(shiftUtlRosters.shiftDate, now),
              or(eq(shiftUtlRosters.assignmentStatus, "unassigned"), eq(shiftUtlRosters.assignmentStatus, "pending_acceptance"), eq(shiftUtlRosters.assignmentStatus, "active")),
            ));
        }
        await tx.insert(institutionalActionLogs).values({
          institutionalAccountId: input.institutionId,
          createdByUserId: ctx.user.id,
          gapIdentified: `${staff.staffName} department membership was reallocated by an administrator.`,
          systemChange: "DEPARTMENT_REALLOCATION",
          status: "completed",
          notes: JSON.stringify({
            staffMemberId: input.staffMemberId,
            fromDepartment: staff.department,
            fromFacilityDepartmentId: staff.facilityDepartmentId,
            toDepartment: department.departmentName,
            toFacilityDepartmentId: department.id,
            reason: input.reason.trim(),
          }),
        });
        if (input.mismatchReportId) {
          await tx.update(institutionalActionLogs)
            .set({ status: "completed", updatedAt: now })
            .where(and(
              eq(institutionalActionLogs.id, input.mismatchReportId),
              eq(institutionalActionLogs.institutionalAccountId, input.institutionId),
              eq(institutionalActionLogs.status, "open"),
            ));
        }
      });

      return { success: true as const, departmentId: department.id, departmentName: department.departmentName };
    }),

  unlinkInstitutionMember: protectedProcedure
    .input(z.object({
      institutionId: z.number().int().positive(),
      membershipId: z.number().int().positive(),
      reason: z.string().trim().min(10).max(1000),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed" });
      await assertInstitutionAccess(db, ctx.user, input.institutionId);
      const [membership] = await db.select({ id: institutionMemberships.id, userId: institutionMemberships.userId, staffMemberId: institutionMemberships.staffMemberId, invitedEmail: institutionMemberships.invitedEmail, membershipStatus: institutionMemberships.membershipStatus }).from(institutionMemberships).where(and(eq(institutionMemberships.id, input.membershipId), eq(institutionMemberships.institutionalAccountId, input.institutionId))).limit(1);
      if (!membership) throw new TRPCError({ code: "NOT_FOUND", message: "Institution membership not found." });
      if (membership.userId === ctx.user.id) throw new TRPCError({ code: "FORBIDDEN", message: "You cannot unlink your own institutional access." });
      if (membership.membershipStatus === "ended") return { success: true as const, alreadyUnlinked: true as const };
      const now = new Date();
      await db.transaction(async (tx) => {
        await tx.update(institutionMemberships).set({ membershipStatus: "ended", endedAt: now, updatedAt: now }).where(and(eq(institutionMemberships.id, membership.id), eq(institutionMemberships.institutionalAccountId, input.institutionId)));
        if (membership.staffMemberId) {
          await tx.update(institutionalStaffMembers).set({ facilityLinkStatus: "pending", updatedAt: now }).where(and(eq(institutionalStaffMembers.id, membership.staffMemberId), eq(institutionalStaffMembers.institutionalAccountId, input.institutionId), isNull(institutionalStaffMembers.removedAt)));
        }
        if (membership.userId != null) {
          await tx.update(institutionProductRoles).set({ roleStatus: "ended", endedAt: now, updatedAt: now }).where(and(eq(institutionProductRoles.institutionalAccountId, input.institutionId), eq(institutionProductRoles.userId, membership.userId), or(eq(institutionProductRoles.roleStatus, "active"), eq(institutionProductRoles.roleStatus, "suspended"))));
          await tx.update(institutionAccountScopes).set({ scopeStatus: "ended", endedAt: now, updatedAt: now }).where(and(eq(institutionAccountScopes.institutionalAccountId, input.institutionId), eq(institutionAccountScopes.userId, membership.userId), or(eq(institutionAccountScopes.scopeStatus, "active"), eq(institutionAccountScopes.scopeStatus, "suspended"))));
          await tx.update(institutionDepartmentResponseCoordinators).set({ assignmentStatus: "ended", updatedAt: now }).where(and(eq(institutionDepartmentResponseCoordinators.institutionId, input.institutionId), or(eq(institutionDepartmentResponseCoordinators.coordinatorUserId, membership.userId), eq(institutionDepartmentResponseCoordinators.backupUserId, membership.userId)), or(eq(institutionDepartmentResponseCoordinators.assignmentStatus, "active"), eq(institutionDepartmentResponseCoordinators.assignmentStatus, "pending_acceptance"))));
          await tx.update(monthlyUtlRotations).set({ assignmentStatus: "ended", providerUserId: null, updatedAt: now }).where(and(eq(monthlyUtlRotations.institutionId, input.institutionId), eq(monthlyUtlRotations.providerUserId, membership.userId), or(eq(monthlyUtlRotations.assignmentStatus, "unassigned"), eq(monthlyUtlRotations.assignmentStatus, "pending_acceptance"), eq(monthlyUtlRotations.assignmentStatus, "active"))));
          await tx.update(shiftUtlRosters).set({ assignmentStatus: "ended", status: "absent" }).where(and(eq(shiftUtlRosters.institutionId, input.institutionId), eq(shiftUtlRosters.utlUserId, membership.userId), gte(shiftUtlRosters.shiftDate, now), or(eq(shiftUtlRosters.assignmentStatus, "unassigned"), eq(shiftUtlRosters.assignmentStatus, "pending_acceptance"), eq(shiftUtlRosters.assignmentStatus, "active"))));
        }
        await tx.insert(institutionalActionLogs).values({
          institutionalAccountId: input.institutionId,
          createdByUserId: ctx.user.id,
          gapIdentified: `${membership.invitedEmail} was unlinked from this institution by an administrator.`,
          systemChange: "FACILITY_UNLINK",
          status: "completed",
          notes: JSON.stringify({ membershipId: membership.id, staffMemberId: membership.staffMemberId, userId: membership.userId, reason: input.reason.trim() }),
        });
      });
      return { success: true as const, alreadyUnlinked: false as const };
    }),

  approveStaffFacilityLink: protectedProcedure
    .input(
      z.object({
        institutionId: z.number(),
        staffMemberId: z.number(),
        approve: z.boolean(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database connection failed",
        });
      }

      await assertInstitutionAccess(db, ctx.user, input.institutionId);
      const [staff] = await db
        .select()
        .from(institutionalStaffMembers)
        .where(and(
          eq(institutionalStaffMembers.id, input.staffMemberId),
          eq(institutionalStaffMembers.institutionalAccountId, input.institutionId),
        ))
        .limit(1);
      if (!staff) throw new TRPCError({ code: "NOT_FOUND", message: "Institution staff member not found." });
      if (staff.removedAt) throw new TRPCError({ code: "CONFLICT", message: "This provider has been retired from the institution." });

      if (!input.approve) {
        await db.transaction(async (tx) => {
          await tx.update(institutionalStaffMembers).set({ facilityLinkStatus: "rejected", enrollmentStatus: "dropped", updatedAt: new Date() }).where(eq(institutionalStaffMembers.id, staff.id));
          await tx.insert(institutionalActionLogs).values({
            institutionalAccountId: input.institutionId,
            createdByUserId: ctx.user.id,
            gapIdentified: `${staff.staffEmail} requested a facility link and the administrator rejected it.`,
            systemChange: "FACILITY_LINK_REQUEST_REJECTED",
            status: "completed",
            notes: JSON.stringify({ staffMemberId: staff.id, legacy: true }),
          });
        });
        return { success: true as const, status: "rejected" as const };
      }

      if (staff.userId == null) {
        await db.update(institutionalStaffMembers).set({ facilityLinkStatus: "linked", enrollmentStatus: "enrolled", updatedAt: new Date() }).where(eq(institutionalStaffMembers.id, staff.id));
        return { success: true as const, status: "linked" as const, membershipId: null };
      }

      const [provider] = await db
        .select({ name: users.name, phone: users.phone, providerType: users.providerType, email: users.email })
        .from(users)
        .where(eq(users.id, staff.userId))
        .limit(1);
      if (!provider) throw new TRPCError({ code: "NOT_FOUND", message: "The provider account no longer exists." });
      const result = await db.transaction(async (tx) => {
        const materialized = await materializeMembershipAndStaff(tx, {
          institutionId: input.institutionId,
          userId: staff.userId!,
          email: provider.email?.trim().toLowerCase() || staff.staffEmail.trim().toLowerCase(),
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
          gapIdentified: `${staff.staffEmail} had a legacy pending facility link reviewed by an administrator.`,
          systemChange: "FACILITY_LINK_MEMBERSHIP_REPAIRED",
          status: "completed",
          notes: JSON.stringify({ staffMemberId: staff.id, membershipId: materialized.membershipId, legacy: true }),
        });
        return materialized;
      });
      await db.insert(inAppNotifications).values({
        userId: staff.userId!,
        type: "facility_membership",
        title: "Facility relationship approved",
        body: "Your general institutional membership is active. IERS duties still require separate assignment and acceptance.",
        relatedId: staff.id,
        actionUrl: "/records",
      }).catch(() => undefined);
      return { success: true as const, status: "linked" as const, ...result };
    }),

  /** Institution account admin: explicitly restore a retired staff record as an institution-linked general staff member. */
  restoreRetiredStaffLink: protectedProcedure
    .input(z.object({
      institutionId: z.number().int().positive(),
      staffMemberId: z.number().int().positive(),
      reason: z.string().trim().min(10).max(1000),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed" });
      await assertInstitutionAccountScope(db, ctx.user, input.institutionId, ["account_admin"], { allowInstitutionAdmin: true });

      const [staff] = await db
        .select({
          id: institutionalStaffMembers.id,
          userId: institutionalStaffMembers.userId,
          staffName: institutionalStaffMembers.staffName,
          staffEmail: institutionalStaffMembers.staffEmail,
          removedAt: institutionalStaffMembers.removedAt,
        })
        .from(institutionalStaffMembers)
        .where(and(
          eq(institutionalStaffMembers.id, input.staffMemberId),
          eq(institutionalStaffMembers.institutionalAccountId, input.institutionId),
        ))
        .limit(1);
      if (!staff) throw new TRPCError({ code: "NOT_FOUND", message: "Institution staff record not found." });
      if (!staff.removedAt) throw new TRPCError({ code: "BAD_REQUEST", message: "This staff record is not retired." });
      if (!staff.userId) throw new TRPCError({ code: "BAD_REQUEST", message: "This staff record has no linked provider account. Use the normal invitation or account-link workflow." });

      const membershipTarget = or(
        eq(institutionMemberships.staffMemberId, staff.id),
        eq(institutionMemberships.userId, staff.userId),
      );
      const [membership] = await db
        .select({
          id: institutionMemberships.id,
          membershipStatus: institutionMemberships.membershipStatus,
        })
        .from(institutionMemberships)
        .where(and(
          eq(institutionMemberships.institutionalAccountId, input.institutionId),
          membershipTarget,
        ))
        .orderBy(desc(institutionMemberships.id))
        .limit(1);

      const now = new Date();
      let membershipId = membership?.id ?? null;
      await db.transaction(async (tx) => {
        await tx.update(institutionalStaffMembers).set({
          removedAt: null,
          removedByUserId: null,
          removalReason: null,
          facilityLinkStatus: "linked",
          enrollmentStatus: "enrolled",
          updatedAt: now,
        }).where(and(
          eq(institutionalStaffMembers.id, staff.id),
          eq(institutionalStaffMembers.institutionalAccountId, input.institutionId),
        ));

        if (membership) {
          await tx.update(institutionMemberships).set({
            userId: staff.userId,
            staffMemberId: staff.id,
            invitedEmail: staff.staffEmail.trim().toLowerCase(),
            membershipStatus: "active",
            responsibilityRole: "general_staff",
            acceptedAt: now,
            suspendedAt: null,
            endedAt: null,
            updatedAt: now,
          }).where(eq(institutionMemberships.id, membership.id));
        } else {
          const inserted = await tx.insert(institutionMemberships).values({
            institutionalAccountId: input.institutionId,
            userId: staff.userId,
            invitedEmail: staff.staffEmail.trim().toLowerCase(),
            staffMemberId: staff.id,
            membershipStatus: "active",
            responsibilityRole: "general_staff",
            invitedByUserId: ctx.user.id,
            acceptedAt: now,
          });
          membershipId = Number((inserted as unknown as { insertId: number }).insertId);
        }

        if (membershipId) {
          await tx.insert(institutionMembershipEvents).values({
            institutionalAccountId: input.institutionId,
            membershipId,
            staffMemberId: staff.id,
            userId: staff.userId,
            eventType: membership ? "reactivated" : "restored",
            previousMembershipStatus: membership?.membershipStatus ?? "retired",
            currentMembershipStatus: "active",
            actorUserId: ctx.user.id,
            reason: input.reason.trim(),
          });
        }
        await tx.insert(institutionalActionLogs).values({
          institutionalAccountId: input.institutionId,
          createdByUserId: ctx.user.id,
          gapIdentified: `${staff.staffName} was explicitly re-linked to the institution after retirement review.`,
          systemChange: "STAFF_RETIRED_LINK_RESTORED",
          status: "completed",
          notes: JSON.stringify({ staffMemberId: staff.id, userId: staff.userId, staffEmail: staff.staffEmail, reason: input.reason.trim() }),
        });
      });

      return { success: true as const, membershipId, restoredStaffMemberId: staff.id };
    }),
  // ─────────────────────────────────────────────────────────────────────────
  // COHORT-PROOF-1: Learner uploads their AHA elearning.heart.org proof URL.
  // Sets phase1ProofUrl on their institutionalStaffMember row.
  // Does NOT advance phaseStatus — that requires admin approval below.
  // ─────────────────────────────────────────────────────────────────────────
  uploadPhase1Proof: protectedProcedure
    .input(
      z.object({
        staffMemberId: z.number().int().positive(),
        proofUrl: z.string().url("Must be a valid URL"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Learner can only update their own row
      const [row] = await db
        .select({ id: institutionalStaffMembers.id, userId: institutionalStaffMembers.userId })
        .from(institutionalStaffMembers)
        .where(eq(institutionalStaffMembers.id, input.staffMemberId))
        .limit(1);

      if (!row) throw new TRPCError({ code: "NOT_FOUND", message: "Staff record not found" });
      if (row.userId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "You can only upload proof for your own record" });
      }

      await db
        .update(institutionalStaffMembers)
        .set({
          phase1ProofUrl: input.proofUrl,
          updatedAt: new Date(),
        })
        .where(eq(institutionalStaffMembers.id, input.staffMemberId));

      return { success: true };
    }),

  // ─────────────────────────────────────────────────────────────────────────
  // COHORT-PROOF-2: Institutional coordinator approves or rejects a learner's
  // Phase 1 proof. Approval advances phaseStatus to "phase_2".
  // ─────────────────────────────────────────────────────────────────────────
  approvePhase1Proof: protectedProcedure
    .input(
      z.object({
        institutionId: z.number().int().positive(),
        staffMemberId: z.number().int().positive(),
        approve: z.boolean(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      await assertInstitutionAccess(db, ctx.user, input.institutionId);

      if (input.approve) {
        await db
          .update(institutionalStaffMembers)
          .set({
            phase1ProofApprovedAt: new Date(),
            phaseStatus: "phase_2",
            updatedAt: new Date(),
          })
          .where(and(
            eq(institutionalStaffMembers.id, input.staffMemberId),
            eq(institutionalStaffMembers.institutionalAccountId, input.institutionId)
          ));
      } else {
        // Rejection: clear the proof URL so learner must re-upload
        await db
          .update(institutionalStaffMembers)
          .set({
            phase1ProofUrl: null,
            phase1ProofApprovedAt: null,
            updatedAt: new Date(),
          })
          .where(and(
            eq(institutionalStaffMembers.id, input.staffMemberId),
            eq(institutionalStaffMembers.institutionalAccountId, input.institutionId)
          ));
      }

      return { success: true, approved: input.approve };
    }),

  // ─────────────────────────────────────────────────────────────────────────
  // COHORT-SELF-SERVICE: Subsidised ACLS/BLS Cohort Program (CEO decision,
  // 2026-07-19). A learner who was auto-linked to their facility via
  // `syncProviderProfileFacility` lands with `designation: "other"` and no
  // subsidised-eligibility signal. This lets them declare it themselves:
  // nurses provide a licence number (verification step, stored on their
  // existing `providerProfiles` row — no duplicate column), interns just
  // declare which intern designation they are. Eligibility itself is
  // evaluated in `payments.getIndividualBalance`, not here — this only
  // records the declaration.
  // ─────────────────────────────────────────────────────────────────────────
  declareMyDesignation: protectedProcedure
    .input(z.object({
      designation: z.enum(["noi", "coi_bsc", "coi_diploma", "moi", "permanent_nurse", "permanent_doctor", "other"]),
      licenseNumber: z.string().trim().min(1).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      let canonicalLicenceNumber = input.licenseNumber?.trim() || null;
      if (input.designation === "permanent_nurse" && !canonicalLicenceNumber) {
        const [credential] = await db
          .select({ credentialNumber: professionalCredentials.credentialNumber })
          .from(professionalCredentials)
          .where(and(
            eq(professionalCredentials.userId, ctx.user.id),
            eq(professionalCredentials.credentialType, "regulatory_license"),
            inArray(professionalCredentials.status, ["pending", "verified"]),
          ))
          .orderBy(desc(professionalCredentials.updatedAt))
          .limit(1);
        canonicalLicenceNumber = credential?.credentialNumber?.trim() || null;
      }
      if (input.designation === "permanent_nurse" && !canonicalLicenceNumber) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Add your Licence number under Professional Credentials before registering as a nurse.",
        });
      }

      const staffRow = await db
        .select({ id: institutionalStaffMembers.id })
        .from(institutionalStaffMembers)
        .where(and(
          eq(institutionalStaffMembers.userId, ctx.user.id),
          inArray(institutionalStaffMembers.facilityLinkStatus, ["linked", "pending"])
        ))
        .limit(1);

      if (staffRow.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "No institutional facility link found for your account yet." });
      }

      await db
        .update(institutionalStaffMembers)
        .set({ designation: input.designation, updatedAt: new Date() })
        .where(eq(institutionalStaffMembers.id, staffRow[0].id));

      if (input.designation === "permanent_nurse" && canonicalLicenceNumber) {
        const existingProfile = await db
          .select({ id: providerProfiles.id })
          .from(providerProfiles)
          .where(eq(providerProfiles.userId, ctx.user.id))
          .limit(1);

        if (existingProfile.length > 0) {
          await db
            .update(providerProfiles)
            .set({ licenseNumber: canonicalLicenceNumber, updatedAt: new Date() })
            .where(eq(providerProfiles.userId, ctx.user.id));
        } else {
          await db.insert(providerProfiles).values({
            userId: ctx.user.id,
            licenseNumber: canonicalLicenceNumber,
          });
        }
      }

      return { success: true, designation: input.designation };
    }),

  // ============================================
  // IERMS™ GOVERNANCE & POLE PROCEDURES
  // ============================================

  updateStaffGovernanceRole: protectedProcedure
    .input(z.object({
      institutionId: z.number(),
      staffMemberId: z.number(),
      governanceRole: z.enum([
        "executive", "erc_chair", "erc_member", "er_coordinator",
        "unit_team_leader", "ert_leader", "ert_responder", "general_staff"
      ]),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      await assertInstitutionAccess(db, ctx.user, input.institutionId);

      await db
        .update(institutionalStaffMembers)
        .set({ governanceRole: input.governanceRole, updatedAt: new Date() })
        .where(and(
          eq(institutionalStaffMembers.id, input.staffMemberId),
          eq(institutionalStaffMembers.institutionalAccountId, input.institutionId)
        ));

      return { success: true };
    }),

  getMyLinkedFacilityDepartments: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      const rows = await db
        .select({
          id: facilityDepartments.id,
          institutionId: facilityDepartments.institutionId,
          departmentName: facilityDepartments.departmentName,
        })
        .from(institutionMemberships)
        .innerJoin(facilityDepartments, eq(facilityDepartments.institutionId, institutionMemberships.institutionalAccountId))
        .where(and(
          eq(institutionMemberships.userId, ctx.user.id),
          eq(institutionMemberships.membershipStatus, "active"),
          eq(facilityDepartments.isActive, true),
          isNotNull(facilityDepartments.confirmedAt),
        ))
        .orderBy(asc(facilityDepartments.departmentName));
      const seen = new Set<number>();
      return rows.filter((row) => {
        if (seen.has(row.id)) return false;
        seen.add(row.id);
        return true;
      }).map((row) => ({ ...row, departmentName: canonicalizeDepartmentLabel(row.departmentName) }));
    }),

  getFacilityPoles: protectedProcedure
    .input(z.object({ institutionId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed" });
      await assertIersInstitutionReadAccess(db, ctx.user, input.institutionId);

      try {
        return await db
          .select()
          .from(facilityPoles)
          .where(eq(facilityPoles.institutionId, input.institutionId))
          .orderBy(asc(facilityPoles.poleOrder), asc(facilityPoles.poleName), asc(facilityPoles.id));
      } catch (error) {
        if (!isMissingSchemaColumnError(error)) throw error;
        return db
          .select()
          .from(facilityPoles)
          .where(eq(facilityPoles.institutionId, input.institutionId))
          .orderBy(asc(facilityPoles.poleName), asc(facilityPoles.id));
      }
    }),

  getMyInstitutionAdminStatus: protectedProcedure
    .input(z.object({ institutionId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      await assertInstitutionAccess(db, ctx.user, input.institutionId);
      return { isInstitutionAdmin: ctx.user.role === "admin" || await isInstitutionAdmin(db, ctx.user.id, input.institutionId) };
    }),

  createFacilityPole: protectedProcedure
    .input(z.object({
      institutionId: z.number(),
      poleName: z.string().trim().min(1),
      description: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      await assertInstitutionProductRole(db, ctx.user, input.institutionId, "iers", IERS_DEPARTMENT_GOVERNANCE_ROLES);

      try {
        const [maxRow] = await db
          .select({ maxOrder: sql<number>`COALESCE(MAX(${facilityPoles.poleOrder}), 0)` })
          .from(facilityPoles)
          .where(eq(facilityPoles.institutionId, input.institutionId));
        const [result] = await db.insert(facilityPoles).values({
          institutionId: input.institutionId,
          poleName: input.poleName,
          description: input.description,
          poleOrder: Number(maxRow?.maxOrder ?? 0) + 1,
        });
        return { success: true, poleId: result.insertId };
      } catch (error) {
        if (!isMissingSchemaColumnError(error)) throw error;
        const [result] = await db.insert(facilityPoles).values({
          institutionId: input.institutionId,
          poleName: input.poleName,
          description: input.description,
        });
        return { success: true, poleId: result.insertId };
      }
    }),

  reorderFacilityPoles: protectedProcedure
    .input(z.object({
      institutionId: z.number().int().positive(),
      poleIds: z.array(z.number().int().positive()).min(1).max(100),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed" });
      await assertInstitutionProductRole(db, ctx.user, input.institutionId, "iers", IERS_DEPARTMENT_GOVERNANCE_ROLES);
      const uniquePoleIds = new Set(input.poleIds);
      if (uniquePoleIds.size !== input.poleIds.length) throw new TRPCError({ code: "BAD_REQUEST", message: "Each pole must appear once in the requested order." });
      try {
        const poles = await db
          .select({ id: facilityPoles.id })
          .from(facilityPoles)
          .where(eq(facilityPoles.institutionId, input.institutionId));
        const actualPoleIds = new Set(poles.map((pole) => pole.id));
        if (actualPoleIds.size !== uniquePoleIds.size || [...actualPoleIds].some((id) => !uniquePoleIds.has(id))) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Submit the complete pole list for this institution; foreign or missing poles are not allowed." });
        }
        await db.transaction(async (tx) => {
          for (const [index, poleId] of input.poleIds.entries()) {
            await tx.update(facilityPoles).set({ poleOrder: index + 1 }).where(and(eq(facilityPoles.id, poleId), eq(facilityPoles.institutionId, input.institutionId)));
          }
        });
        return { success: true, poleCount: input.poleIds.length };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        if (isMissingSchemaColumnError(error)) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Pole ordering becomes available after the institution schema migration is applied." });
        throw error;
      }
    }),

  getFacilityDepartments: protectedProcedure
    .input(z.object({ institutionId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      const access = await assertIersInstitutionReadAccess(db, ctx.user, input.institutionId);
      const departmentIds = "departmentIds" in access ? access.departmentIds : null;

      try {
        const rows = await db
          .select()
          .from(facilityDepartments)
          .where(and(
            eq(facilityDepartments.institutionId, input.institutionId),
            eq(facilityDepartments.isActive, true),
            departmentIds ? inArray(facilityDepartments.id, departmentIds) : sql`1=1`,
          ));
        return rows.map((row) => {
          const departmentName = canonicalizeDepartmentLabel(row.departmentName);
          return { ...row, departmentName, departmentSource: isPresetDepartment(departmentName) ? "preset" as const : "custom" as const };
        });
      } catch (error) {
        // The application can deploy before guarded migration 0114 runs. Keep the legacy department read available during that window.
        if (!isMissingSchemaColumnError(error)) throw error;
        const legacyRows = await db.select({
          id: facilityDepartments.id,
          institutionId: facilityDepartments.institutionId,
          poleId: facilityDepartments.poleId,
          departmentName: facilityDepartments.departmentName,
          requiresPole: sql<boolean>`FALSE`,
          poleSequence: sql<number | null>`NULL`,
          isActive: sql<boolean>`TRUE`,
          confirmedAt: sql<Date | null>`NULL`,
          confirmedByUserId: sql<number | null>`NULL`,
          createdAt: facilityDepartments.createdAt,
        }).from(facilityDepartments).where(and(
          eq(facilityDepartments.institutionId, input.institutionId),
          departmentIds ? inArray(facilityDepartments.id, departmentIds) : sql`1=1`,
        ));
        return legacyRows.map((row) => {
          const departmentName = canonicalizeDepartmentLabel(row.departmentName);
          return { ...row, departmentName, departmentSource: isPresetDepartment(departmentName) ? "preset" as const : "custom" as const };
        });
      }
    }),

  confirmFacilityDepartments: protectedProcedure
    .input(z.object({
      institutionId: z.number(),
      departments: z.array(z.object({ departmentId: z.number().int().positive().optional(), departmentName: z.string().trim().min(2).max(128) })).min(1).max(100),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      await assertInstitutionAccountScope(db, ctx.user, input.institutionId, ["account_admin"], { allowInstitutionAdmin: true });
      const normalizedDepartments = input.departments.map((item) => ({
        ...item,
        departmentName: canonicalizeDepartmentLabel(item.departmentName),
      }));
      const uniqueNames = Array.from(new Set(normalizedDepartments.map((item) => item.departmentName.trim().toLowerCase())));
      if (uniqueNames.length !== normalizedDepartments.length) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Department names must be unique within an institution." });
      }
      const existing = await db.select().from(facilityDepartments).where(eq(facilityDepartments.institutionId, input.institutionId));
      const existingByName = new Map(existing.map((row) => [row.departmentName.trim().toLowerCase(), row]));
      const retainedIds: number[] = [];
      for (const item of normalizedDepartments) {
        const normalizedName = item.departmentName.trim().toLowerCase();
        const current = item.departmentId != null ? existing.find((row) => row.id === item.departmentId) : existing.find((row) => departmentLabelsMatch(row.departmentName, item.departmentName));
        if (item.departmentId != null && !current) throw new TRPCError({ code: "NOT_FOUND", message: "Department not found in this institution." });
        const conflictingRow = existingByName.get(normalizedName);
        if (conflictingRow && (!current || conflictingRow.id !== current.id)) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Department names must be unique within an institution." });
        }
        if (current) {
          retainedIds.push(current.id);
          await db.update(facilityDepartments).set({
            departmentName: item.departmentName.trim(),
            isActive: true,
            confirmedAt: new Date(),
            confirmedByUserId: ctx.user.id,
          }).where(eq(facilityDepartments.id, current.id));
        } else {
          await db.insert(facilityDepartments).values({
            institutionId: input.institutionId,
            departmentName: item.departmentName.trim(),
            poleId: null,
            isActive: true,
            confirmedAt: new Date(),
            confirmedByUserId: ctx.user.id,
          });
        }
      }
      await db.update(facilityDepartments).set({ isActive: false }).where(and(
        eq(facilityDepartments.institutionId, input.institutionId),
        notInArray(facilityDepartments.id, retainedIds),
      ));
      return { success: true, confirmedCount: normalizedDepartments.length };
    }),

  assignDepartmentToPole: protectedProcedure
    .input(z.object({
      institutionId: z.number(),
      departmentName: z.string().trim().min(1),
      poleId: z.number().nullable(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      await assertInstitutionProductRole(db, ctx.user, input.institutionId, "iers", IERS_DEPARTMENT_GOVERNANCE_ROLES);

      const activeDepartments = await db
        .select()
        .from(facilityDepartments)
        .where(and(
          eq(facilityDepartments.institutionId, input.institutionId),
          eq(facilityDepartments.isActive, true),
        ));
      const existing = activeDepartments.find((department) => departmentLabelsMatch(department.departmentName, input.departmentName));
      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Confirm this department in Administration before assigning it to an IERS pole." });
      }
      if (!existing.confirmedAt) {
        throw new TRPCError({ code: "PRECONDITION_FAILED", message: "This department is not confirmed for the institution yet." });
      }
      if (!existing.requiresPole) {
        throw new TRPCError({ code: "FORBIDDEN", message: "This department is CPD-valid but not marked as requiring an IERS pole. An account administrator must enable pole eligibility first." });
      }
      if (input.poleId != null) {
        const [pole] = await db
          .select({ id: facilityPoles.id })
          .from(facilityPoles)
          .where(and(eq(facilityPoles.id, input.poleId), eq(facilityPoles.institutionId, input.institutionId)))
          .limit(1);
        if (!pole) throw new TRPCError({ code: "NOT_FOUND", message: "Pole not found in this institution." });
      }

      let poleSequence: number | null = null;
      if (input.poleId != null && existing.poleId !== input.poleId) {
        const [maxRow] = await db
          .select({ maxSequence: sql<number>`COALESCE(MAX(${facilityDepartments.poleSequence}), 0)` })
          .from(facilityDepartments)
          .where(and(
            eq(facilityDepartments.institutionId, input.institutionId),
            eq(facilityDepartments.poleId, input.poleId),
          ));
        poleSequence = Number(maxRow?.maxSequence ?? 0) + 1;
        await ensurePoleRotationAnchor(db, input.institutionId, input.poleId, new Date());
      } else if (input.poleId != null) {
        poleSequence = existing.poleSequence;
      }

      await db
        .update(facilityDepartments)
        .set({ poleId: input.poleId, poleSequence })
        .where(and(
          eq(facilityDepartments.id, existing.id),
          eq(facilityDepartments.institutionId, input.institutionId),
        ));
      if (input.poleId != null) await refreshPoleErtlAssignments(db, input.institutionId, input.poleId);
      if (existing.poleId != null && existing.poleId !== input.poleId) await refreshPoleErtlAssignments(db, input.institutionId, existing.poleId);

      return { success: true, departmentId: existing.id, poleSequence };
    }),

  assignAllUnassignedDepartmentsToPole: protectedProcedure
    .input(z.object({ institutionId: z.number(), poleId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      await assertInstitutionProductRole(db, ctx.user, input.institutionId, "iers", IERS_DEPARTMENT_GOVERNANCE_ROLES);
      const [pole] = await db.select({ id: facilityPoles.id }).from(facilityPoles).where(and(eq(facilityPoles.id, input.poleId), eq(facilityPoles.institutionId, input.institutionId))).limit(1);
      if (!pole) throw new TRPCError({ code: "NOT_FOUND", message: "Pole not found in this institution." });
      const departments = await db.select({ id: facilityDepartments.id, poleSequence: facilityDepartments.poleSequence }).from(facilityDepartments).where(and(
        eq(facilityDepartments.institutionId, input.institutionId),
        eq(facilityDepartments.isActive, true),
        isNotNull(facilityDepartments.confirmedAt),
        eq(facilityDepartments.requiresPole, true),
        isNull(facilityDepartments.poleId),
      )).orderBy(asc(facilityDepartments.createdAt), asc(facilityDepartments.id));
      if (departments.length === 0) return { success: true, assignedCount: 0 };
      const [maxRow] = await db.select({ maxSequence: sql<number>`COALESCE(MAX(${facilityDepartments.poleSequence}), 0)` }).from(facilityDepartments).where(and(
        eq(facilityDepartments.institutionId, input.institutionId),
        eq(facilityDepartments.poleId, input.poleId),
      ));
      let nextSequence = Number(maxRow?.maxSequence ?? 0) + 1;
      await ensurePoleRotationAnchor(db, input.institutionId, input.poleId, new Date());
      await db.transaction(async (tx) => {
        for (const department of departments) {
          await tx.update(facilityDepartments).set({ poleId: input.poleId, poleSequence: nextSequence }).where(eq(facilityDepartments.id, department.id));
          nextSequence += 1;
        }
      });
      await refreshPoleErtlAssignments(db, input.institutionId, input.poleId);
      return { success: true, assignedCount: departments.length };
    }),

  getInstitutionIersDutyAssignments: protectedProcedure
    .input(z.object({
      institutionId: z.number().int().positive(),
      includeEnded: z.boolean().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      await assertInstitutionAccess(db, ctx.user, input.institutionId);
      await assertInstitutionAccountScope(db, ctx.user, input.institutionId, ["account_admin"], { allowInstitutionAdmin: true });
      const includeEnded = input.includeEnded === true;
      const backupUser = alias(users, "iers_backup_duty_user");
      const ercoStatus = includeEnded ? undefined : inArray(institutionDepartmentResponseCoordinators.assignmentStatus, ["pending_acceptance", "active", "declined"]);
      const ertlStatus = includeEnded ? undefined : inArray(ertlWeeklyRotations.assignmentStatus, ["unassigned", "pending_acceptance", "active", "declined"]);
      const utlStatus = includeEnded ? undefined : inArray(shiftUtlRosters.assignmentStatus, ["unassigned", "pending_acceptance", "active", "declined"]);
      const ercoPredicates = [eq(institutionDepartmentResponseCoordinators.institutionId, input.institutionId), ...(ercoStatus ? [ercoStatus] : [])];
      const ertlPredicates = [eq(ertlWeeklyRotations.institutionId, input.institutionId), ...(ertlStatus ? [ertlStatus] : [])];
      const utlPredicates = [eq(shiftUtlRosters.institutionId, input.institutionId), ...(utlStatus ? [utlStatus] : [])];

      const [coordinators, backups, ertl, utl] = await Promise.all([
        db.select({
          id: institutionDepartmentResponseCoordinators.id,
          departmentId: institutionDepartmentResponseCoordinators.departmentId,
          departmentName: facilityDepartments.departmentName,
          poleName: facilityPoles.poleName,
          providerUserId: institutionDepartmentResponseCoordinators.coordinatorUserId,
          providerName: users.name,
          providerEmail: users.email,
          assignmentStatus: institutionDepartmentResponseCoordinators.assignmentStatus,
          effectiveFrom: institutionDepartmentResponseCoordinators.effectiveFrom,
          effectiveUntil: institutionDepartmentResponseCoordinators.effectiveUntil,
          acceptedAt: institutionDepartmentResponseCoordinators.acceptedAt,
          declinedAt: institutionDepartmentResponseCoordinators.declinedAt,
          declineReason: institutionDepartmentResponseCoordinators.declineReason,
        }).from(institutionDepartmentResponseCoordinators)
          .leftJoin(facilityDepartments, eq(facilityDepartments.id, institutionDepartmentResponseCoordinators.departmentId))
          .leftJoin(facilityPoles, eq(facilityPoles.id, facilityDepartments.poleId))
          .leftJoin(users, eq(users.id, institutionDepartmentResponseCoordinators.coordinatorUserId))
          .where(and(...ercoPredicates)),
        db.select({
          id: institutionDepartmentResponseCoordinators.id,
          departmentId: institutionDepartmentResponseCoordinators.departmentId,
          departmentName: facilityDepartments.departmentName,
          poleName: facilityPoles.poleName,
          providerUserId: institutionDepartmentResponseCoordinators.backupUserId,
          providerName: backupUser.name,
          providerEmail: backupUser.email,
          assignmentStatus: institutionDepartmentResponseCoordinators.assignmentStatus,
          effectiveFrom: institutionDepartmentResponseCoordinators.effectiveFrom,
          effectiveUntil: institutionDepartmentResponseCoordinators.effectiveUntil,
          acceptedAt: institutionDepartmentResponseCoordinators.backupAcceptedAt,
          declinedAt: institutionDepartmentResponseCoordinators.backupDeclinedAt,
          declineReason: institutionDepartmentResponseCoordinators.backupDeclineReason,
        }).from(institutionDepartmentResponseCoordinators)
          .leftJoin(facilityDepartments, eq(facilityDepartments.id, institutionDepartmentResponseCoordinators.departmentId))
          .leftJoin(facilityPoles, eq(facilityPoles.id, facilityDepartments.poleId))
          .leftJoin(backupUser, eq(backupUser.id, institutionDepartmentResponseCoordinators.backupUserId))
          .where(and(...ercoPredicates, isNotNull(institutionDepartmentResponseCoordinators.backupUserId))),
        db.select({
          id: ertlWeeklyRotations.id,
          departmentId: ertlWeeklyRotations.departmentId,
          departmentName: facilityDepartments.departmentName,
          poleName: facilityPoles.poleName,
          providerUserId: ertlWeeklyRotations.ertlUserId,
          providerName: users.name,
          providerEmail: users.email,
          assignmentStatus: ertlWeeklyRotations.assignmentStatus,
          effectiveFrom: ertlWeeklyRotations.startDate,
          effectiveUntil: ertlWeeklyRotations.endDate,
          acceptedAt: ertlWeeklyRotations.acceptedAt,
          declinedAt: ertlWeeklyRotations.declinedAt,
          declineReason: ertlWeeklyRotations.declineReason,
          weekNumber: ertlWeeklyRotations.weekNumber,
          year: ertlWeeklyRotations.year,
        }).from(ertlWeeklyRotations)
          .leftJoin(facilityDepartments, eq(facilityDepartments.id, ertlWeeklyRotations.departmentId))
          .leftJoin(facilityPoles, eq(facilityPoles.id, ertlWeeklyRotations.poleId))
          .leftJoin(users, eq(users.id, ertlWeeklyRotations.ertlUserId))
          .where(and(...ertlPredicates))
          .orderBy(desc(ertlWeeklyRotations.startDate))
          .limit(250),
        db.select({
          id: shiftUtlRosters.id,
          departmentId: shiftUtlRosters.departmentId,
          departmentName: facilityDepartments.departmentName,
          poleName: facilityPoles.poleName,
          providerUserId: shiftUtlRosters.utlUserId,
          providerName: users.name,
          providerEmail: users.email,
          assignmentStatus: shiftUtlRosters.assignmentStatus,
          effectiveFrom: shiftUtlRosters.shiftDate,
          effectiveUntil: shiftUtlRosters.shiftDate,
          acceptedAt: shiftUtlRosters.acceptedAt,
          declinedAt: shiftUtlRosters.declinedAt,
          declineReason: shiftUtlRosters.declineReason,
          shiftType: shiftUtlRosters.shiftType,
          shiftStartTime: shiftUtlRosters.shiftStartTime,
          shiftEndTime: shiftUtlRosters.shiftEndTime,
          shiftEndDayOffset: shiftUtlRosters.shiftEndDayOffset,
          readinessSignOffAt: shiftUtlRosters.readinessSignOffAt,
        }).from(shiftUtlRosters)
          .leftJoin(facilityDepartments, eq(facilityDepartments.id, shiftUtlRosters.departmentId))
          .leftJoin(facilityPoles, eq(facilityPoles.id, shiftUtlRosters.poleId))
          .leftJoin(users, eq(users.id, shiftUtlRosters.utlUserId))
          .where(and(...utlPredicates))
          .orderBy(desc(shiftUtlRosters.shiftDate))
          .limit(500),
      ]);

      return {
        erco: [
          ...coordinators.map((row) => ({ ...row, dutyType: "ERCo" as const })),
          ...backups.map((row) => ({ ...row, dutyType: "Assistant ERCo" as const })),
        ],
        ertl: ertl.map((row) => ({ ...row, dutyType: "ERTL" as const })),
        utl: utl.map((row) => ({ ...row, dutyType: "UTL" as const })),
      };
    }),

  getDepartmentResponseCoordinators: protectedProcedure
    .input(z.object({ institutionId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      await assertInstitutionAccess(db, ctx.user, input.institutionId);
      const access = await assertIersInstitutionReadAccess(db, ctx.user, input.institutionId);
      const departmentIds = "departmentIds" in access ? access.departmentIds : null;
      try {
        return await db
          .select()
          .from(institutionDepartmentResponseCoordinators)
          .where(and(
            eq(institutionDepartmentResponseCoordinators.institutionId, input.institutionId),
            departmentIds ? inArray(institutionDepartmentResponseCoordinators.departmentId, departmentIds) : sql`1=1`,
          ));
      } catch (error) {
        if (isMissingTableError(error)) return [];
        throw error;
      }
    }),

  getDepartmentResponseCoordinatorEvents: protectedProcedure
    .input(z.object({ institutionId: z.number(), departmentId: z.number().optional() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      await assertInstitutionAccess(db, ctx.user, input.institutionId);
      const access = await assertIersInstitutionReadAccess(db, ctx.user, input.institutionId);
      const departmentIds = "departmentIds" in access ? access.departmentIds : null;
      try {
        const predicates = [eq(institutionDepartmentResponseCoordinatorEvents.institutionId, input.institutionId)];
        if (departmentIds) predicates.push(inArray(institutionDepartmentResponseCoordinatorEvents.departmentId, departmentIds));
        if (input.departmentId != null) {
          if (departmentIds && !departmentIds.includes(input.departmentId)) return [];
          predicates.push(eq(institutionDepartmentResponseCoordinatorEvents.departmentId, input.departmentId));
        }
        return await db
          .select({
            id: institutionDepartmentResponseCoordinatorEvents.id,
            departmentId: institutionDepartmentResponseCoordinatorEvents.departmentId,
            assignmentId: institutionDepartmentResponseCoordinatorEvents.assignmentId,
            eventType: institutionDepartmentResponseCoordinatorEvents.eventType,
            actorUserId: institutionDepartmentResponseCoordinatorEvents.actorUserId,
            actorName: users.name,
            note: institutionDepartmentResponseCoordinatorEvents.note,
            createdAt: institutionDepartmentResponseCoordinatorEvents.createdAt,
          })
          .from(institutionDepartmentResponseCoordinatorEvents)
          .leftJoin(users, eq(users.id, institutionDepartmentResponseCoordinatorEvents.actorUserId))
          .where(and(...predicates))
          .orderBy(desc(institutionDepartmentResponseCoordinatorEvents.createdAt))
          .limit(100);
      } catch (error) {
        if (isMissingTableError(error)) return [];
        throw error;
      }
    }),

  getMyDepartmentResponseAssignments: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      try {
        const assignments = await db
          .select({
            id: institutionDepartmentResponseCoordinators.id,
            institutionId: institutionDepartmentResponseCoordinators.institutionId,
            departmentId: institutionDepartmentResponseCoordinators.departmentId,
            departmentName: facilityDepartments.departmentName,
            poleId: facilityDepartments.poleId,
            poleName: facilityPoles.poleName,
            coordinatorUserId: institutionDepartmentResponseCoordinators.coordinatorUserId,
            backupUserId: institutionDepartmentResponseCoordinators.backupUserId,
            assignmentStatus: institutionDepartmentResponseCoordinators.assignmentStatus,
            effectiveFrom: institutionDepartmentResponseCoordinators.effectiveFrom,
            effectiveUntil: institutionDepartmentResponseCoordinators.effectiveUntil,
            acceptedAt: institutionDepartmentResponseCoordinators.acceptedAt,
            declinedAt: institutionDepartmentResponseCoordinators.declinedAt,
            declineReason: institutionDepartmentResponseCoordinators.declineReason,
            backupAcceptedAt: institutionDepartmentResponseCoordinators.backupAcceptedAt,
            backupDeclinedAt: institutionDepartmentResponseCoordinators.backupDeclinedAt,
            backupDeclineReason: institutionDepartmentResponseCoordinators.backupDeclineReason,
          })
          .from(institutionDepartmentResponseCoordinators)
          .leftJoin(facilityDepartments, eq(facilityDepartments.id, institutionDepartmentResponseCoordinators.departmentId))
          .leftJoin(facilityPoles, eq(facilityPoles.id, facilityDepartments.poleId))
          .where(or(
            eq(institutionDepartmentResponseCoordinators.coordinatorUserId, ctx.user.id),
            eq(institutionDepartmentResponseCoordinators.backupUserId, ctx.user.id),
          ));
        const allowedInstitutionIds = await getActiveProviderDutyInstitutionIds(db, ctx.user, assignments.map((assignment) => assignment.institutionId));
        return assignments.filter((assignment) => allowedInstitutionIds.has(assignment.institutionId));
      } catch (error) {
        if (isMissingTableError(error)) return [];
        throw error;
      }
    }),

  getMyProviderDutyAssignments: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      try {
        // Today and the compact duty summary need current/near-future work only;
        // historical records remain available through institutional history views.
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const windowStart = new Date(today);
        windowStart.setDate(windowStart.getDate() - 1);
        const horizon = new Date(today);
        horizon.setDate(horizon.getDate() + 90);
        const ertl = await db
          .select({
            id: ertlWeeklyRotations.id,
            institutionId: ertlWeeklyRotations.institutionId,
            departmentId: ertlWeeklyRotations.departmentId,
            departmentName: facilityDepartments.departmentName,
            poleId: ertlWeeklyRotations.poleId,
            poleName: facilityPoles.poleName,
            weekNumber: ertlWeeklyRotations.weekNumber,
            year: ertlWeeklyRotations.year,
            startDate: ertlWeeklyRotations.startDate,
            endDate: ertlWeeklyRotations.endDate,
            ertlUserId: ertlWeeklyRotations.ertlUserId,
            assignmentStatus: ertlWeeklyRotations.assignmentStatus,
            acceptedAt: ertlWeeklyRotations.acceptedAt,
            declinedAt: ertlWeeklyRotations.declinedAt,
            declineReason: ertlWeeklyRotations.declineReason,
          })
          .from(ertlWeeklyRotations)
          .leftJoin(facilityDepartments, eq(facilityDepartments.id, ertlWeeklyRotations.departmentId))
          .leftJoin(facilityPoles, eq(facilityPoles.id, ertlWeeklyRotations.poleId))
          .where(and(
            eq(ertlWeeklyRotations.ertlUserId, ctx.user.id),
            gte(ertlWeeklyRotations.startDate, windowStart),
            lte(ertlWeeklyRotations.startDate, horizon),
            inArray(ertlWeeklyRotations.assignmentStatus, ["unassigned", "pending_acceptance", "active", "declined"]),
          ));
        const utl = await db
          .select({
            id: shiftUtlRosters.id,
            institutionId: shiftUtlRosters.institutionId,
            departmentId: shiftUtlRosters.departmentId,
            departmentName: facilityDepartments.departmentName,
            poleId: shiftUtlRosters.poleId,
            poleName: facilityPoles.poleName,
            shiftDate: shiftUtlRosters.shiftDate,
            shiftType: shiftUtlRosters.shiftType,
            shiftStartTime: shiftUtlRosters.shiftStartTime,
            shiftEndTime: shiftUtlRosters.shiftEndTime,
            shiftEndDayOffset: shiftUtlRosters.shiftEndDayOffset,
            utlUserId: shiftUtlRosters.utlUserId,
            isShiftErtl: shiftUtlRosters.isShiftErtl,
            assignmentStatus: shiftUtlRosters.assignmentStatus,
            acceptedAt: shiftUtlRosters.acceptedAt,
            declinedAt: shiftUtlRosters.declinedAt,
            declineReason: shiftUtlRosters.declineReason,
            readinessSignOffAt: shiftUtlRosters.readinessSignOffAt,
          })
          .from(shiftUtlRosters)
          .leftJoin(facilityDepartments, eq(facilityDepartments.id, shiftUtlRosters.departmentId))
          .leftJoin(facilityPoles, eq(facilityPoles.id, shiftUtlRosters.poleId))
          .where(and(
            eq(shiftUtlRosters.utlUserId, ctx.user.id),
            gte(shiftUtlRosters.shiftDate, windowStart),
            lte(shiftUtlRosters.shiftDate, horizon),
            inArray(shiftUtlRosters.assignmentStatus, ["unassigned", "pending_acceptance", "active", "declined"]),
          ));
        const allowedInstitutionIds = await getActiveProviderDutyInstitutionIds(
          db,
          ctx.user,
          [...ertl.map((assignment) => assignment.institutionId), ...utl.map((assignment) => assignment.institutionId)],
        );
        const visibleErtl = ertl.filter((assignment) => allowedInstitutionIds.has(assignment.institutionId));
        const visibleUtl = utl.filter((assignment) => allowedInstitutionIds.has(assignment.institutionId));
        const dateTimeKey = (date: Date | string | null | undefined, time: string | null | undefined) => {
          if (!date) return Number.MAX_SAFE_INTEGER;
          const day = new Date(date).toISOString().slice(0, 10);
          return new Date(`${day}T${time?.slice(0, 8) ?? "00:00:00"}`).getTime();
        };
        const now = Date.now();
        const upcomingUtl = visibleUtl.filter((assignment) => assignment.assignmentStatus !== "ended" && dateTimeKey(assignment.shiftDate, assignment.shiftStartTime) >= now).sort((a, b) => dateTimeKey(a.shiftDate, a.shiftStartTime) - dateTimeKey(b.shiftDate, b.shiftStartTime));
        const upcomingErtl = visibleErtl.filter((assignment) => assignment.assignmentStatus !== "ended" && dateTimeKey(assignment.startDate, "00:00:00") >= now).sort((a, b) => dateTimeKey(a.startDate, "00:00:00") - dateTimeKey(b.startDate, "00:00:00"));
        return {
          ertl: visibleErtl,
          utl: visibleUtl,
          nextUtl: upcomingUtl[0] ?? null,
          nextErtl: upcomingErtl[0] ?? null,
        };
      } catch (error) {
        if (isMissingTableError(error)) return { ertl: [], utl: [], nextUtl: null, nextErtl: null };
        throw error;
      }
    }),

  respondToWeeklyErtlRotation: protectedProcedure
    .input(z.object({
      rotationId: z.number(),
      response: z.enum(["accept", "decline"]),
      declineReason: z.string().trim().min(3).max(500).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      const [rotation] = await db
        .select()
        .from(ertlWeeklyRotations)
        .where(and(
          eq(ertlWeeklyRotations.id, input.rotationId),
          eq(ertlWeeklyRotations.ertlUserId, ctx.user.id),
        ))
        .limit(1);
      if (!rotation) throw new TRPCError({ code: "NOT_FOUND", message: "ERTL rotation assignment not found." });
      await assertActiveProviderDutyAccess(db, ctx.user, rotation.institutionId);
      if (input.response === "accept") await assertCurrentClinicalLicence(db, ctx.user.id);
      assertProviderDutyDecision({
        action: "respond_to_assignment",
        requestedInstitutionId: rotation.institutionId,
        assignmentInstitutionId: rotation.institutionId,
        requestingUserId: ctx.user.id,
        assignedUserId: rotation.ertlUserId,
        membershipStatus: "active",
        assignmentStatus: rotation.assignmentStatus,
        response: input.response,
        declineReason: input.declineReason,
      });
      await db.update(ertlWeeklyRotations).set(
        input.response === "accept"
          ? { assignmentStatus: "active", acceptedAt: new Date(), declinedAt: null, declineReason: null }
          : { assignmentStatus: "declined", acceptedAt: null, declinedAt: new Date(), declineReason: input.declineReason },
      ).where(eq(ertlWeeklyRotations.id, rotation.id));
      return { success: true, assignmentStatus: input.response === "accept" ? "active" : "declined" as const };
    }),

  respondToShiftUtlRoster: protectedProcedure
    .input(z.object({
      rosterId: z.number(),
      response: z.enum(["accept", "decline"]),
      declineReason: z.string().trim().min(3).max(500).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      const [roster] = await db
        .select()
        .from(shiftUtlRosters)
        .where(and(
          eq(shiftUtlRosters.id, input.rosterId),
          eq(shiftUtlRosters.utlUserId, ctx.user.id),
        ))
        .limit(1);
      if (!roster) throw new TRPCError({ code: "NOT_FOUND", message: "Shift UTL assignment not found." });
      await assertActiveProviderDutyAccess(db, ctx.user, roster.institutionId);
      if (input.response === "accept") await assertCurrentClinicalLicence(db, ctx.user.id);
      assertProviderDutyDecision({
        action: "respond_to_assignment",
        requestedInstitutionId: roster.institutionId,
        assignmentInstitutionId: roster.institutionId,
        requestingUserId: ctx.user.id,
        assignedUserId: roster.utlUserId,
        membershipStatus: "active",
        assignmentStatus: roster.assignmentStatus,
        response: input.response,
        declineReason: input.declineReason,
      });
      await db.update(shiftUtlRosters).set(
        input.response === "accept"
          ? { assignmentStatus: "active", acceptedAt: new Date(), declinedAt: null, declineReason: null }
          : { assignmentStatus: "declined", acceptedAt: null, declinedAt: new Date(), declineReason: input.declineReason, readinessSignOffAt: null, readinessSignedOffByUserId: null, readinessNote: null },
      ).where(eq(shiftUtlRosters.id, roster.id));
      await projectLegacyUtlRosterDecision(db, {
        roster,
        actorUserId: ctx.user.id,
        decision: input.response === "accept" ? "accepted" : "declined",
        reason: input.declineReason ?? null,
      });
      if (input.response === "decline") {
        await notifyDepartmentErcoOfUtlDecline(db, {
          institutionId: roster.institutionId,
          departmentId: roster.departmentId,
          rosterId: roster.id,
          shiftDate: roster.shiftDate,
          shiftType: roster.shiftType,
          reason: input.declineReason ?? null,
        });
      }
      return { success: true, assignmentStatus: input.response === "accept" ? "active" : "declined" as const };
    }),

  assignDepartmentResponseCoordinator: protectedProcedure
    .input(z.object({
      institutionId: z.number(),
      departmentId: z.number(),
      coordinatorUserId: z.number(),
      backupUserId: z.number().nullable().optional(),
      effectiveFrom: z.string(),
      effectiveUntil: z.string().nullable().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      await assertInstitutionAccess(db, ctx.user, input.institutionId);
      await assertCanManageArea(db, ctx.user, input.institutionId, "iers", input.departmentId);

      const validation = validateDepartmentErcoAssignment(input);
      if (!validation.valid) throw new TRPCError({ code: "BAD_REQUEST", message: validation.reason });

      const [department] = await db
        .select({ id: facilityDepartments.id, departmentName: facilityDepartments.departmentName })
        .from(facilityDepartments)
        .where(and(
          eq(facilityDepartments.id, input.departmentId),
          eq(facilityDepartments.institutionId, input.institutionId),
        ))
        .limit(1);
      if (!department) throw new TRPCError({ code: "NOT_FOUND", message: "Department not found in this institution." });

      const requestedUserIds = [input.coordinatorUserId, ...(input.backupUserId == null ? [] : [input.backupUserId])];
      const [members, staffRows] = await Promise.all([
        db
          .select({ userId: institutionMemberships.userId })
          .from(institutionMemberships)
          .where(and(
            eq(institutionMemberships.institutionalAccountId, input.institutionId),
            eq(institutionMemberships.membershipStatus, "active"),
            inArray(institutionMemberships.userId, requestedUserIds),
          )),
        db
          .select({
            userId: institutionalStaffMembers.userId,
            staffRole: institutionalStaffMembers.staffRole,
            providerType: users.providerType,
            cadre: users.cadre,
            cadreOther: users.cadreOther,
            department: institutionalStaffMembers.department,
            facilityDepartmentId: institutionalStaffMembers.facilityDepartmentId,
            facilityLinkStatus: institutionalStaffMembers.facilityLinkStatus,
            profileDepartment: providerProfiles.department,
          })
          .from(institutionalStaffMembers)
          .leftJoin(users, eq(users.id, institutionalStaffMembers.userId))
          .leftJoin(providerProfiles, eq(providerProfiles.userId, institutionalStaffMembers.userId))
          .where(and(
            eq(institutionalStaffMembers.institutionalAccountId, input.institutionId),
            inArray(institutionalStaffMembers.userId, requestedUserIds),
            eq(institutionalStaffMembers.facilityLinkStatus, "linked"),
          )),
      ]);
      const activeMemberIds = new Set(members.map((member) => member.userId).filter((userId): userId is number => userId != null));
      const eligibleNurseIds = new Set(staffRows
        .filter((staff) => staff.userId != null && activeMemberIds.has(staff.userId) && isRegisteredRnProfile(staff) && providerBelongsToCanonicalDepartment(staff, department))
        .map((staff) => staff.userId as number));
      if (!eligibleNurseIds.has(input.coordinatorUserId)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "The ERCo must be an active linked nurse registered with this canonical department." });
      }
      if (input.backupUserId != null && !eligibleNurseIds.has(input.backupUserId)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "The Assistant ERCo must be an active linked nurse registered with this canonical department." });
      }

      const [existing] = await db
        .select({ id: institutionDepartmentResponseCoordinators.id })
        .from(institutionDepartmentResponseCoordinators)
        .where(and(
          eq(institutionDepartmentResponseCoordinators.institutionId, input.institutionId),
          eq(institutionDepartmentResponseCoordinators.departmentId, input.departmentId),
        ))
        .limit(1);
      const values = {
        institutionId: input.institutionId,
        departmentId: input.departmentId,
        coordinatorUserId: input.coordinatorUserId,
        backupUserId: input.backupUserId ?? null,
        assignmentStatus: "pending_acceptance" as const,
        effectiveFrom: new Date(input.effectiveFrom),
        effectiveUntil: input.effectiveUntil ? new Date(input.effectiveUntil) : null,
        assignedByUserId: ctx.user.id,
        acceptedAt: null,
        declinedAt: null,
        declineReason: null,
        backupAcceptedAt: null,
        backupDeclinedAt: null,
        backupDeclineReason: null,
        assignedAt: new Date(),
        updatedAt: new Date(),
      };
      let assignmentId: number;
      let eventType: "assigned" | "reassigned";
      if (existing) {
        await db.update(institutionDepartmentResponseCoordinators).set(values).where(eq(institutionDepartmentResponseCoordinators.id, existing.id));
        assignmentId = existing.id;
        eventType = "reassigned";
      } else {
        const [result] = await db.insert(institutionDepartmentResponseCoordinators).values(values);
        assignmentId = result.insertId;
        eventType = "assigned";
      }
      await db.insert(institutionDepartmentResponseCoordinatorEvents).values({
        institutionId: input.institutionId,
        departmentId: input.departmentId,
        assignmentId,
        eventType,
        actorUserId: ctx.user.id,
        note: input.effectiveUntil ? `Coverage from ${input.effectiveFrom} through ${input.effectiveUntil}.` : `Coverage from ${input.effectiveFrom} with no end date.`,
      });
      return { success: true, assignmentId, replaced: !!existing };
    }),

  respondToDepartmentResponseCoordinatorAssignment: protectedProcedure
    .input(z.object({
      assignmentId: z.number(),
      response: z.enum(["accept", "decline"]),
      declineReason: z.string().trim().max(500).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      const [assignment] = await db
        .select()
        .from(institutionDepartmentResponseCoordinators)
        .where(and(
          eq(institutionDepartmentResponseCoordinators.id, input.assignmentId),
          eq(institutionDepartmentResponseCoordinators.coordinatorUserId, ctx.user.id),
        ))
        .limit(1);
      if (!assignment) throw new TRPCError({ code: "NOT_FOUND", message: "ERCo assignment not found for this provider." });
      await assertActiveProviderDutyAccess(db, ctx.user, assignment.institutionId);
      if (input.response === "accept") await assertCurrentClinicalLicence(db, ctx.user.id);
      assertProviderDutyDecision({
        action: "respond_to_assignment",
        requestedInstitutionId: assignment.institutionId,
        assignmentInstitutionId: assignment.institutionId,
        requestingUserId: ctx.user.id,
        assignedUserId: assignment.coordinatorUserId,
        membershipStatus: "active",
        assignmentStatus: assignment.assignmentStatus,
        response: input.response,
        declineReason: input.declineReason,
      });
      await db.update(institutionDepartmentResponseCoordinators).set(
        input.response === "accept"
          ? { assignmentStatus: "active", acceptedAt: new Date(), declinedAt: null, declineReason: null, updatedAt: new Date() }
          : { assignmentStatus: "declined", acceptedAt: null, declinedAt: new Date(), declineReason: input.declineReason, updatedAt: new Date() },
      ).where(eq(institutionDepartmentResponseCoordinators.id, assignment.id));
      await db.insert(institutionDepartmentResponseCoordinatorEvents).values({
        institutionId: assignment.institutionId,
        departmentId: assignment.departmentId,
        assignmentId: assignment.id,
        eventType: input.response === "accept" ? "accepted" : "declined",
        actorUserId: ctx.user.id,
        note: input.response === "decline" ? input.declineReason : "ERCo accepted the dated department assignment.",
      });
      return { success: true, assignmentStatus: input.response === "accept" ? "active" : "declined" as const };
    }),

  respondToDepartmentResponseBackup: protectedProcedure
    .input(z.object({
      assignmentId: z.number(),
      response: z.enum(["accept", "decline"]),
      declineReason: z.string().trim().max(500).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      const [assignment] = await db
        .select()
        .from(institutionDepartmentResponseCoordinators)
        .where(and(
          eq(institutionDepartmentResponseCoordinators.id, input.assignmentId),
          eq(institutionDepartmentResponseCoordinators.backupUserId, ctx.user.id),
        ))
        .limit(1);
      if (!assignment) throw new TRPCError({ code: "NOT_FOUND", message: "Backup assignment not found for this provider." });
      await assertActiveProviderDutyAccess(db, ctx.user, assignment.institutionId);
      if (input.response === "accept") await assertCurrentClinicalLicence(db, ctx.user.id);
      assertProviderDutyDecision({
        action: "respond_to_assignment",
        requestedInstitutionId: assignment.institutionId,
        assignmentInstitutionId: assignment.institutionId,
        requestingUserId: ctx.user.id,
        assignedUserId: assignment.backupUserId,
        membershipStatus: "active",
        assignmentStatus: assignment.assignmentStatus,
        response: input.response,
        declineReason: input.declineReason,
      });
      await db.update(institutionDepartmentResponseCoordinators).set(
        input.response === "accept"
          ? { backupAcceptedAt: new Date(), backupDeclinedAt: null, backupDeclineReason: null, updatedAt: new Date() }
          : { backupAcceptedAt: null, backupDeclinedAt: new Date(), backupDeclineReason: input.declineReason, updatedAt: new Date() },
      ).where(eq(institutionDepartmentResponseCoordinators.id, assignment.id));
      await db.insert(institutionDepartmentResponseCoordinatorEvents).values({
        institutionId: assignment.institutionId,
        departmentId: assignment.departmentId,
        assignmentId: assignment.id,
        eventType: input.response === "accept" ? "backup_accepted" : "backup_declined",
        actorUserId: ctx.user.id,
        note: input.response === "decline" ? input.declineReason : "Backup provider accepted the dated department assignment.",
      });
      return { success: true, backupStatus: input.response === "accept" ? "accepted" : "declined" as const };
    }),

  endDepartmentResponseCoordinatorAssignment: protectedProcedure
    .input(z.object({ institutionId: z.number(), assignmentId: z.number(), reason: z.string().trim().min(3).max(500) }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      await assertInstitutionAccess(db, ctx.user, input.institutionId);
      const [assignment] = await db
        .select({ id: institutionDepartmentResponseCoordinators.id, departmentId: institutionDepartmentResponseCoordinators.departmentId })
        .from(institutionDepartmentResponseCoordinators)
        .where(and(
          eq(institutionDepartmentResponseCoordinators.id, input.assignmentId),
          eq(institutionDepartmentResponseCoordinators.institutionId, input.institutionId),
        ))
        .limit(1);
      if (!assignment) throw new TRPCError({ code: "NOT_FOUND", message: "ERCo assignment not found." });
      await assertCanManageArea(db, ctx.user, input.institutionId, "iers", assignment.departmentId);
      await db.update(institutionDepartmentResponseCoordinators).set({ assignmentStatus: "ended", updatedAt: new Date() }).where(eq(institutionDepartmentResponseCoordinators.id, assignment.id));
      await db.insert(institutionDepartmentResponseCoordinatorEvents).values({
        institutionId: input.institutionId,
        departmentId: assignment.departmentId,
        assignmentId: assignment.id,
        eventType: "ended",
        actorUserId: ctx.user.id,
        note: input.reason,
      });
      return { success: true, reason: input.reason };
    }),

  getWeeklyErtlRotation: protectedProcedure
    .input(z.object({
      institutionId: z.number(),
      poleId: z.number(),
      weekNumber: z.number(),
      year: z.number(),
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      await assertInstitutionAccess(db, ctx.user, input.institutionId);
      await assertIersPoleRotaReadAccess(db, ctx.user, input.institutionId, input.poleId);

      const [rotationRows, rotationAnchorDate] = await Promise.all([
        db.select().from(ertlWeeklyRotations).where(and(
          eq(ertlWeeklyRotations.institutionId, input.institutionId),
          eq(ertlWeeklyRotations.poleId, input.poleId),
          eq(ertlWeeklyRotations.weekNumber, input.weekNumber),
          eq(ertlWeeklyRotations.year, input.year),
        )).limit(1),
        getPoleRotationAnchor(db, input.institutionId, input.poleId),
      ]);
      const rotation = rotationRows[0] ?? null;
      const departments = await getOrderedPoleDepartments(db, input.institutionId, input.poleId);
      const derivedDepartmentId = derivePoleRotationDepartmentId(
        departments,
        rotationAnchorDate,
        isoWeekMonday(input.year, input.weekNumber),
      );
      if (derivedDepartmentId == null) return rotation ?? null;

      if (rotation?.assignmentStatus === "active" || rotation?.acceptedAt != null) return rotation;
      if (rotation && rotation.departmentId === derivedDepartmentId) return rotation;

      const startDate = isoWeekMonday(input.year, input.weekNumber);
      const endDate = new Date(startDate);
      endDate.setUTCDate(endDate.getUTCDate() + 6);
      if (!rotation) {
        return {
          id: 0,
          institutionId: input.institutionId,
          poleId: input.poleId,
          departmentId: derivedDepartmentId,
          weekNumber: input.weekNumber,
          year: input.year,
          startDate,
          endDate,
          ertlUserId: null,
          assignmentStatus: "unassigned" as const,
          acceptedAt: null,
          declinedAt: null,
          declineReason: null,
          createdAt: new Date(),
        };
      }
      return {
        ...rotation,
        departmentId: derivedDepartmentId,
        ertlUserId: null,
        assignmentStatus: "unassigned" as const,
        acceptedAt: null,
        declinedAt: null,
        declineReason: null,
        startDate,
        endDate,
      };
    }),

  getErtlDepartmentOptions: protectedProcedure
    .input(z.object({ institutionId: z.number(), poleId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      await assertInstitutionProductRole(db, ctx.user, input.institutionId, "iers", IERS_READ_ROLES);
      const rows = await db
        .select({ id: facilityDepartments.id, departmentName: facilityDepartments.departmentName, poleId: facilityDepartments.poleId, requiresPole: facilityDepartments.requiresPole, poleName: facilityPoles.poleName })
        .from(facilityDepartments)
        .leftJoin(facilityPoles, eq(facilityPoles.id, facilityDepartments.poleId))
        .where(and(
          eq(facilityDepartments.institutionId, input.institutionId),
          eq(facilityDepartments.isActive, true),
          eq(facilityDepartments.requiresPole, true),
          eq(facilityDepartments.poleId, input.poleId),
        ))
        .orderBy(asc(facilityDepartments.departmentName));
      return rows;
    }),

  getMonthlyUtlRota: protectedProcedure
    .input(z.object({ institutionId: z.number(), poleId: z.number().int().positive(), monthStart: z.string() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      await assertIersPoleRotaReadAccess(db, ctx.user, input.institutionId, input.poleId);
      const monthStart = normalizeMonthStart(input.monthStart);
      try {
        return await db
        .select({
          id: monthlyUtlRotations.id,
          institutionId: monthlyUtlRotations.institutionId,
          poleId: monthlyUtlRotations.poleId,
          departmentId: monthlyUtlRotations.departmentId,
          departmentName: facilityDepartments.departmentName,
          monthStart: monthlyUtlRotations.monthStart,
          providerUserId: monthlyUtlRotations.providerUserId,
          providerName: users.name,
          assignmentStatus: monthlyUtlRotations.assignmentStatus,
          acceptedAt: monthlyUtlRotations.acceptedAt,
          declinedAt: monthlyUtlRotations.declinedAt,
          declineReason: monthlyUtlRotations.declineReason,
        })
        .from(monthlyUtlRotations)
        .leftJoin(facilityDepartments, eq(facilityDepartments.id, monthlyUtlRotations.departmentId))
        .leftJoin(users, eq(users.id, monthlyUtlRotations.providerUserId))
        .where(and(
          eq(monthlyUtlRotations.institutionId, input.institutionId),
          eq(monthlyUtlRotations.poleId, input.poleId),
          eq(monthlyUtlRotations.monthStart, new Date(monthStart)),
        ))
        .orderBy(asc(facilityDepartments.departmentName));
      } catch (error) {
        if (isMissingTableError(error)) return [];
        throw error;
      }
    }),

  autopopulateMonthlyUtlRota: protectedProcedure
    .input(z.object({
      institutionId: z.number(),
      poleId: z.number().int().positive(),
      monthStart: z.string(),
      assignments: z.array(z.object({
        departmentId: z.number().int().positive(),
        providerUserId: z.number().int().positive().nullable(),
      })).min(1).max(100).optional(),
      /** Legacy input retained for older clients; it now prepares unassigned rows rather than selecting a provider implicitly. */
      departmentIds: z.array(z.number().int().positive()).min(1).max(100).optional(),
    }).refine((input) => (input.assignments?.length ?? 0) > 0 || (input.departmentIds?.length ?? 0) > 0, {
      message: "Select at least one department assignment.",
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      const monthStart = normalizeMonthStart(input.monthStart);
      let generatedShifts = 0;
      let assignedDepartments = 0;
      const requestedAssignments = input.assignments ?? Array.from(new Set(input.departmentIds ?? [])).map((departmentId) => ({ departmentId, providerUserId: null }));
      const uniqueAssignments = Array.from(new Map(requestedAssignments.map((assignment) => [assignment.departmentId, assignment])).values());
      for (const assignment of uniqueAssignments) {
        const departmentId = assignment.departmentId;
        await assertIersDepartmentRotaWriteAccess(db, ctx.user, input.institutionId, departmentId);
        const department = await assertDepartmentBelongsToPole(db, input.institutionId, departmentId, input.poleId);
        const providerUserId = assignment.providerUserId == null
          ? null
          : await resolveCanonicalDepartmentProvider(db, input.institutionId, departmentId, assignment.providerUserId);
        const [existing] = await db.select({ id: monthlyUtlRotations.id, providerUserId: monthlyUtlRotations.providerUserId, assignmentStatus: monthlyUtlRotations.assignmentStatus }).from(monthlyUtlRotations).where(and(
          eq(monthlyUtlRotations.institutionId, input.institutionId),
          eq(monthlyUtlRotations.departmentId, departmentId),
          eq(monthlyUtlRotations.monthStart, new Date(monthStart)),
        )).limit(1);
        const providerChanged = existing ? existing.providerUserId !== providerUserId : true;
        let rotationId: number;
        if (existing) {
          await db.update(monthlyUtlRotations).set({
            poleId: input.poleId,
            providerUserId,
            assignmentStatus: providerUserId == null ? "unassigned" : providerChanged ? "pending_acceptance" : existing.assignmentStatus,
            acceptedAt: providerChanged ? null : undefined,
            declinedAt: providerChanged ? null : undefined,
            declineReason: providerChanged ? null : undefined,
            updatedAt: new Date(),
          }).where(eq(monthlyUtlRotations.id, existing.id));
          rotationId = existing.id;
        } else {
          const [result] = await db.insert(monthlyUtlRotations).values({
            institutionId: input.institutionId,
            poleId: input.poleId,
            departmentId: department.id,
            monthStart: new Date(monthStart),
            providerUserId,
            assignmentStatus: providerUserId == null ? "unassigned" : "pending_acceptance",
            assignedByUserId: ctx.user.id,
          });
          rotationId = result.insertId;
        }
        generatedShifts += await ensureMonthlyUtlShifts(db, {
          institutionId: input.institutionId,
          poleId: input.poleId,
          departmentId,
          monthStart,
          providerUserId,
          monthlyUtlRotationId: rotationId,
          actorUserId: ctx.user.id,
        });
        if (providerUserId != null) assignedDepartments += 1;
      }
      return { success: true, assignedDepartments, generatedShifts, monthStart };
    }),

  setWeeklyErtlRotation: protectedProcedure
    .input(z.object({
      institutionId: z.number(),
      poleId: z.number(),
      departmentId: z.number(),
      weekNumber: z.number(),
      year: z.number(),
      startDate: z.string(),
      endDate: z.string(),
      ertlUserId: z.number().int().positive().nullable().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      await assertInstitutionAccess(db, ctx.user, input.institutionId);
      await assertInstitutionProductRole(db, ctx.user, input.institutionId, "iers", IERS_DEPARTMENT_GOVERNANCE_ROLES);
      if (new Date(input.endDate) < new Date(input.startDate)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "ERTL rotation end date cannot be before its start date." });
      }
      const [rotationAnchorDate, orderedDepartments] = await Promise.all([
        getPoleRotationAnchor(db, input.institutionId, input.poleId),
        getOrderedPoleDepartments(db, input.institutionId, input.poleId),
      ]);
      const derivedDepartmentId = derivePoleRotationDepartmentId(
        orderedDepartments,
        rotationAnchorDate,
        input.startDate,
      );
      if (derivedDepartmentId == null) throw new TRPCError({ code: "BAD_REQUEST", message: "Assign at least one confirmed eligible department to this pole before configuring ERTL rotation." });
      if (input.departmentId !== derivedDepartmentId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "The ERTL department is selected automatically from the pole’s department order. Choose the named provider for the displayed department instead." });
      }
      await assertDepartmentBelongsToPole(db, input.institutionId, derivedDepartmentId, input.poleId);
      if (input.ertlUserId != null) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "The ERTL is assigned automatically to the accepted UTL of the leading department. Adjust the leadership department instead of selecting a provider." });
      }
      const requestedErtlUserId = null;

      const refreshDepartmentIds = new Set<number>([derivedDepartmentId]);
      const [existing] = await db
        .select()
        .from(ertlWeeklyRotations)
        .where(and(
          eq(ertlWeeklyRotations.institutionId, input.institutionId),
          eq(ertlWeeklyRotations.poleId, input.poleId),
          eq(ertlWeeklyRotations.weekNumber, input.weekNumber),
          eq(ertlWeeklyRotations.year, input.year)
        ))
        .limit(1);

      if (existing) {
        const departmentChanged = existing.departmentId !== derivedDepartmentId;
        if (departmentChanged) refreshDepartmentIds.add(existing.departmentId);
          const nextErtlUserId = requestedErtlUserId;
        const providerChanged = departmentChanged || nextErtlUserId !== existing.ertlUserId;
        await db
          .update(ertlWeeklyRotations)
          .set({
            departmentId: derivedDepartmentId,
            startDate: new Date(input.startDate),
            endDate: new Date(input.endDate),
            ertlUserId: nextErtlUserId,
            ...(providerChanged ? {
              assignmentStatus: nextErtlUserId == null ? "unassigned" : "pending_acceptance",
              acceptedAt: null,
              declinedAt: null,
              declineReason: null,
            } : {}),
          })
          .where(eq(ertlWeeklyRotations.id, existing.id));
      } else {
        await db.insert(ertlWeeklyRotations).values({
          institutionId: input.institutionId,
          poleId: input.poleId,
          departmentId: derivedDepartmentId,
          weekNumber: input.weekNumber,
          year: input.year,
          startDate: new Date(input.startDate),
          endDate: new Date(input.endDate),
          ertlUserId: requestedErtlUserId,
          assignmentStatus: requestedErtlUserId == null ? "unassigned" : "pending_acceptance",
        });
      }

      const monthStarts = new Set([monthStartFromShiftDate(input.startDate), monthStartFromShiftDate(input.endDate)]);
      for (const departmentId of refreshDepartmentIds) {
        for (const monthStart of monthStarts) {
          const [monthlyRotation] = await db.select().from(monthlyUtlRotations).where(and(
            eq(monthlyUtlRotations.institutionId, input.institutionId),
            eq(monthlyUtlRotations.poleId, input.poleId),
            eq(monthlyUtlRotations.departmentId, departmentId),
            eq(monthlyUtlRotations.monthStart, new Date(monthStart)),
          )).limit(1);
          if (monthlyRotation) {
            await ensureMonthlyUtlShifts(db, {
              institutionId: input.institutionId,
              poleId: input.poleId,
              departmentId,
              monthStart,
              providerUserId: monthlyRotation.providerUserId,
              monthlyUtlRotationId: monthlyRotation.id,
              actorUserId: ctx.user.id,
            });
          }
        }
      }

      return { success: true, ertlUserId: requestedErtlUserId, departmentId: derivedDepartmentId };
    }),

  /**
   * Re-anchor a pole's Monday-based leadership sequence from a selected week.
   * This changes only future unaccepted rotation/team projections. Accepted or
   * active dated duties remain historical evidence and are never rewritten.
   */
  overrideWeeklyErtlLeadership: protectedProcedure
    .input(z.object({
      institutionId: z.number().int().positive(),
      poleId: z.number().int().positive(),
      departmentId: z.number().int().positive(),
      weekNumber: z.number().int().min(1).max(53),
      year: z.number().int().min(2020).max(2200),
      startDate: z.string(),
      endDate: z.string(),
      reason: z.string().trim().min(3).max(500),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      const [leadershipInstitution] = await db.select({ id: institutionalAccounts.id }).from(institutionalAccounts).where(eq(institutionalAccounts.id, input.institutionId)).limit(1);
      if (!leadershipInstitution) throw new TRPCError({ code: "NOT_FOUND", message: "Institution not found." });
      const isAdmin = ctx.user.role === "admin" || await isInstitutionAdmin(db, ctx.user.id, input.institutionId);
      let hasLeadershipWriteAccess = isAdmin;
      if (!hasLeadershipWriteAccess) {
        try {
          await assertInstitutionProductRole(db, ctx.user, input.institutionId, "iers", IERS_DEPARTMENT_GOVERNANCE_ROLES);
          hasLeadershipWriteAccess = true;
        } catch (error) {
          if (!(error instanceof TRPCError) || error.code !== "FORBIDDEN") throw error;
        }
      }
      if (!hasLeadershipWriteAccess) throw new TRPCError({ code: "FORBIDDEN", message: "Only an institutional administrator or IERS governance lead can adjust the leadership week." });

      const expectedStart = isoWeekMonday(input.year, input.weekNumber);
      const requestedStart = mondayForDate(input.startDate);
      const requestedEnd = new Date(requestedStart);
      requestedEnd.setUTCDate(requestedEnd.getUTCDate() + 6);
      if (asDateOnly(requestedStart) !== asDateOnly(expectedStart) || asDateOnly(new Date(input.endDate)) !== asDateOnly(requestedEnd)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Leadership overrides must use the complete Monday-to-Sunday ISO week supplied by the selected week." });
      }
      if (requestedStart < mondayForDate(new Date())) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Completed leadership weeks are historical records and cannot be rewritten. Choose the current or a future week." });
      }

      await assertDepartmentBelongsToPole(db, input.institutionId, input.departmentId, input.poleId);
      const departments = await getOrderedPoleDepartments(db, input.institutionId, input.poleId);
      const nextAnchor = rotationAnchorForLeadershipWeek(departments, requestedStart, input.departmentId);
      if (!nextAnchor) throw new TRPCError({ code: "BAD_REQUEST", message: "The selected leadership department is not in this pole's confirmed rotation order." });

      await db.update(facilityPoles).set({ rotationAnchorDate: nextAnchor }).where(and(
        eq(facilityPoles.id, input.poleId),
        eq(facilityPoles.institutionId, input.institutionId),
      ));

      const futureRotations = await db.select().from(ertlWeeklyRotations).where(and(
        eq(ertlWeeklyRotations.institutionId, input.institutionId),
        eq(ertlWeeklyRotations.poleId, input.poleId),
        gte(ertlWeeklyRotations.startDate, requestedStart),
        inArray(ertlWeeklyRotations.assignmentStatus, ["unassigned", "pending_acceptance", "declined"]),
      ));
      for (const rotation of futureRotations) {
        const nextDepartmentId = derivePoleRotationDepartmentId(departments, nextAnchor, rotation.startDate);
        if (nextDepartmentId == null) continue;
        const changed = rotation.departmentId !== nextDepartmentId || rotation.ertlUserId != null || rotation.assignmentStatus !== "unassigned";
        if (!changed) continue;
        await db.update(ertlWeeklyRotations).set({
          departmentId: nextDepartmentId,
          ertlUserId: null,
          assignmentStatus: "unassigned",
          acceptedAt: null,
          declinedAt: null,
          declineReason: null,
        }).where(eq(ertlWeeklyRotations.id, rotation.id));
      }

      const futureRosters = await db.select().from(shiftUtlRosters).where(and(
        eq(shiftUtlRosters.institutionId, input.institutionId),
        eq(shiftUtlRosters.poleId, input.poleId),
        gte(shiftUtlRosters.shiftDate, requestedStart),
        eq(shiftUtlRosters.status, "active"),
        inArray(shiftUtlRosters.assignmentStatus, ["unassigned", "pending_acceptance", "declined"]),
      ));
      for (const roster of futureRosters) {
        const nextDepartmentId = derivePoleRotationDepartmentId(departments, nextAnchor, roster.shiftDate);
        const nextIsErtl = nextDepartmentId === roster.departmentId;
        if (roster.isShiftErtl !== nextIsErtl) {
          await db.update(shiftUtlRosters).set({ isShiftErtl: nextIsErtl }).where(eq(shiftUtlRosters.id, roster.id));
        }
        await ensurePublishedTeamForLegacyUtlRoster(db, {
          roster: roster.isShiftErtl === nextIsErtl ? roster : { ...roster, isShiftErtl: nextIsErtl },
          actorUserId: ctx.user.id,
        });
      }

      const futureTeams = await db.select().from(iersShiftTeams).where(and(
        eq(iersShiftTeams.institutionId, input.institutionId),
        eq(iersShiftTeams.poleId, input.poleId),
        gte(iersShiftTeams.shiftDate, requestedStart),
        inArray(iersShiftTeams.status, ["published", "active"]),
      ));
      for (const team of futureTeams) {
        const nextDepartmentId = derivePoleRotationDepartmentId(departments, nextAnchor, team.shiftDate);
        if (nextDepartmentId == null) continue;
        const staleAssignments = await db.select().from(iersShiftRoleAssignments).where(and(
          eq(iersShiftRoleAssignments.teamId, team.id),
          eq(iersShiftRoleAssignments.roleScope, "ertl"),
          inArray(iersShiftRoleAssignments.assignmentStatus, ["proposed", "approved", "pending_acceptance", "declined"]),
        ));
        for (const assignment of staleAssignments) {
          if (assignment.departmentId === nextDepartmentId) continue;
          await db.update(iersShiftRoleAssignments).set({ assignmentStatus: "superseded", supersededAt: new Date() }).where(eq(iersShiftRoleAssignments.id, assignment.id));
          await db.insert(iersShiftRoleEvents).values({
            assignmentId: assignment.id,
            teamId: team.id,
            institutionId: input.institutionId,
            actorUserId: ctx.user.id,
            eventType: "ertl_leadership_override_superseded",
            fromStatus: assignment.assignmentStatus,
            toStatus: "superseded",
            fromRoleKey: assignment.roleKey,
            toRoleKey: assignment.roleKey,
            reason: input.reason,
            metadata: JSON.stringify({ previousDepartmentId: assignment.departmentId, nextDepartmentId }),
          });
        }
      }

      await db.insert(institutionalActionLogs).values({
        institutionalAccountId: input.institutionId,
        createdByUserId: ctx.user.id,
        gapIdentified: "ERTL leadership week required an institutional adjustment.",
        systemChange: JSON.stringify({ type: "ertl_leadership_override", poleId: input.poleId, weekNumber: input.weekNumber, year: input.year, departmentId: input.departmentId, rotationAnchorDate: asDateOnly(nextAnchor) }),
        status: "completed",
        notes: input.reason,
      });

      return { success: true, departmentId: input.departmentId, rotationAnchorDate: asDateOnly(nextAnchor), refreshedRotations: futureRotations.length, refreshedRosters: futureRosters.length, refreshedTeams: futureTeams.length };
    }),

  // ============================================
  // IERMS™ SHIFT UTL ROSTER PROCEDURES
  // ============================================

  getCanonicalShiftTeam: protectedProcedure
    .input(z.object({
      institutionId: z.number().int().positive(),
      poleId: z.number().int().positive(),
      shiftDate: z.string(),
      shiftType: z.enum(["morning", "evening", "night"]),
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      await assertIersPoleRotaReadAccess(db, ctx.user, input.institutionId, input.poleId);
      const [team] = await db.select({
        id: iersShiftTeams.id,
        institutionId: iersShiftTeams.institutionId,
        poleId: iersShiftTeams.poleId,
        shiftDate: iersShiftTeams.shiftDate,
        shiftType: iersShiftTeams.shiftType,
        shiftStartTime: iersShiftTeams.shiftStartTime,
        shiftEndTime: iersShiftTeams.shiftEndTime,
        shiftEndDayOffset: iersShiftTeams.shiftEndDayOffset,
        teamVersion: iersShiftTeams.teamVersion,
        status: iersShiftTeams.status,
      }).from(iersShiftTeams).where(and(
        eq(iersShiftTeams.institutionId, input.institutionId),
        eq(iersShiftTeams.poleId, input.poleId),
        eq(iersShiftTeams.shiftDate, new Date(`${input.shiftDate}T00:00:00Z`)),
        eq(iersShiftTeams.shiftType, input.shiftType),
        inArray(iersShiftTeams.status, ["published", "active"]),
      )).orderBy(desc(iersShiftTeams.teamVersion)).limit(1);
      if (!team) return null;

      const assignments = await db.select({
        id: iersShiftRoleAssignments.id,
        providerUserId: iersShiftRoleAssignments.providerUserId,
        providerName: users.name,
        providerEmail: users.email,
        departmentId: iersShiftRoleAssignments.departmentId,
        departmentName: facilityDepartments.departmentName,
        roleScope: iersShiftRoleAssignments.roleScope,
        roleKey: iersShiftRoleAssignments.roleKey,
        assignmentStatus: iersShiftRoleAssignments.assignmentStatus,
        acceptedAt: iersShiftRoleAssignments.acceptedAt,
        declinedAt: iersShiftRoleAssignments.declinedAt,
        declineReason: iersShiftRoleAssignments.declineReason,
        shiftUtlRosterId: iersShiftRoleAssignments.shiftUtlRosterId,
      }).from(iersShiftRoleAssignments)
        .leftJoin(users, eq(users.id, iersShiftRoleAssignments.providerUserId))
        .leftJoin(facilityDepartments, eq(facilityDepartments.id, iersShiftRoleAssignments.departmentId))
        .where(and(
          eq(iersShiftRoleAssignments.teamId, team.id),
          notInArray(iersShiftRoleAssignments.assignmentStatus, ["ended", "expired", "superseded"]),
        ))
        .orderBy(asc(iersShiftRoleAssignments.roleScope), asc(iersShiftRoleAssignments.departmentId), asc(iersShiftRoleAssignments.id));

      return { team, assignments };
    }),

  getShiftUtlRoster: protectedProcedure
    .input(z.object({
      institutionId: z.number(),
      poleId: z.number(),
      shiftDate: z.string(),
      shiftType: z.enum(["morning", "evening", "night"]),
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      await assertIersPoleRotaReadAccess(db, ctx.user, input.institutionId, input.poleId);

      return db
        .select()
        .from(shiftUtlRosters)
        .where(and(
          eq(shiftUtlRosters.institutionId, input.institutionId),
          eq(shiftUtlRosters.poleId, input.poleId),
          eq(shiftUtlRosters.shiftDate, new Date(input.shiftDate)),
          eq(shiftUtlRosters.shiftType, input.shiftType),
          notInArray(shiftUtlRosters.assignmentStatus, ["ended"]),
        ));
    }),

  submitShiftUtlRoster: protectedProcedure
    .input(z.object({
      institutionId: z.number(),
      poleId: z.number(),
      departmentId: z.number(),
      shiftDate: z.string(),
      shiftType: z.enum(["morning", "evening", "night"]),
      shiftStartTime: z.string().optional(),
      shiftEndTime: z.string().optional(),
      shiftEndDayOffset: z.number().int().min(0).max(1).optional(),
      shiftTemplateId: z.number().int().positive().nullable().optional(),
      utlUserId: z.number(),
      isShiftErtl: z.boolean().default(false),
      status: z.enum(["active", "completed", "absent"]).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      const saved = await saveShiftUtlRosterRow(db, ctx.user, input);
      return { success: true, ...saved };
    }),

  cancelFutureShiftUtlAssignment: protectedProcedure
    .input(z.object({
      institutionId: z.number().int().positive(),
      rosterId: z.number().int().positive(),
      reason: z.string().trim().min(3).max(500),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      const [cancellationInstitution] = await db.select({ id: institutionalAccounts.id }).from(institutionalAccounts).where(eq(institutionalAccounts.id, input.institutionId)).limit(1);
      if (!cancellationInstitution) throw new TRPCError({ code: "NOT_FOUND", message: "Institution not found." });
      const institutionAdmin = ctx.user.role === "admin" || await isInstitutionAdmin(db, ctx.user.id, input.institutionId);

      const [roster] = await db.select().from(shiftUtlRosters).where(and(
        eq(shiftUtlRosters.id, input.rosterId),
        eq(shiftUtlRosters.institutionId, input.institutionId),
      )).limit(1);
      if (!roster) throw new TRPCError({ code: "NOT_FOUND", message: "UTL assignment not found in this institution." });
      if (roster.assignmentStatus === "ended" || roster.status !== "active") {
        throw new TRPCError({ code: "CONFLICT", message: "This UTL assignment is already closed." });
      }
      const shiftState = classifyShiftInterval(roster, new Date(), "Africa/Nairobi");
      if (shiftState !== "upcoming") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Only a future UTL assignment can be canceled. Live or historical duties remain part of the audit record." });
      }

      let authorized = institutionAdmin;
      if (!authorized) try {
        await assertInstitutionProductRole(db, ctx.user, input.institutionId, "iers", IERS_DEPARTMENT_GOVERNANCE_ROLES);
        authorized = true;
      } catch (error) {
        if (!(error instanceof TRPCError) || error.code !== "FORBIDDEN") throw error;
      }

      if (!authorized) {
        try {
          await assertActiveProviderDutyAccess(db, ctx.user, input.institutionId);
        } catch (error) {
          if (!(error instanceof TRPCError) || error.code !== "FORBIDDEN") throw error;
          throw new TRPCError({ code: "FORBIDDEN", message: "Only IERS governance, the department ERCo, or the accepted current ERTL can cancel a future UTL assignment." });
        }
        const [departmentErco] = await db.select({ id: institutionDepartmentResponseCoordinators.id }).from(institutionDepartmentResponseCoordinators).where(and(
          eq(institutionDepartmentResponseCoordinators.institutionId, input.institutionId),
          eq(institutionDepartmentResponseCoordinators.departmentId, roster.departmentId),
          eq(institutionDepartmentResponseCoordinators.coordinatorUserId, ctx.user.id),
          eq(institutionDepartmentResponseCoordinators.assignmentStatus, "active"),
        )).limit(1);
        const [acceptedErtl] = await db.select({ id: iersShiftRoleAssignments.id }).from(iersShiftRoleAssignments).innerJoin(iersShiftTeams, eq(iersShiftTeams.id, iersShiftRoleAssignments.teamId)).where(and(
          eq(iersShiftRoleAssignments.institutionId, input.institutionId),
          eq(iersShiftRoleAssignments.providerUserId, ctx.user.id),
          eq(iersShiftRoleAssignments.roleScope, "ertl"),
          eq(iersShiftRoleAssignments.assignmentStatus, "accepted"),
          eq(iersShiftTeams.institutionId, input.institutionId),
          eq(iersShiftTeams.poleId, roster.poleId),
          eq(iersShiftTeams.shiftDate, roster.shiftDate),
          eq(iersShiftTeams.shiftType, roster.shiftType),
          eq(iersShiftTeams.shiftStartTime, roster.shiftStartTime),
          eq(iersShiftTeams.shiftEndTime, roster.shiftEndTime),
          eq(iersShiftTeams.shiftEndDayOffset, roster.shiftEndDayOffset),
          inArray(iersShiftTeams.status, ["published", "active"]),
        )).limit(1);
        if (!departmentErco && !acceptedErtl) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Only IERS governance, the department ERCo, or the accepted current ERTL can cancel a future UTL assignment." });
        }
      }

      const now = new Date();
      await db.update(shiftUtlRosters).set({
        assignmentStatus: "ended",
        status: "absent",
        readinessSignOffAt: null,
        readinessSignedOffByUserId: null,
        readinessNote: null,
      }).where(eq(shiftUtlRosters.id, roster.id));

      const linkedAssignments = await db.select().from(iersShiftRoleAssignments).where(and(
        eq(iersShiftRoleAssignments.institutionId, input.institutionId),
        eq(iersShiftRoleAssignments.shiftUtlRosterId, roster.id),
        inArray(iersShiftRoleAssignments.assignmentStatus, ["proposed", "approved", "pending_acceptance", "accepted"]),
      ));
      for (const assignment of linkedAssignments) {
        await db.update(iersShiftRoleAssignments).set({ assignmentStatus: "ended", endedAt: now }).where(eq(iersShiftRoleAssignments.id, assignment.id));
        await db.insert(iersShiftRoleEvents).values({
          assignmentId: assignment.id,
          teamId: assignment.teamId,
          institutionId: input.institutionId,
          actorUserId: ctx.user.id,
          eventType: "future_utl_assignment_canceled",
          fromStatus: assignment.assignmentStatus,
          toStatus: "ended",
          fromRoleKey: assignment.roleKey,
          toRoleKey: assignment.roleKey,
          reason: input.reason,
          metadata: JSON.stringify({ rosterId: roster.id }),
        });
      }

      if (roster.utlUserId !== ctx.user.id) {
        await db.insert(inAppNotifications).values({
          userId: roster.utlUserId,
          type: "iers_shift_team",
          title: "Future UTL duty canceled",
          body: `Your ${roster.shiftType} UTL duty on ${asDateOnly(roster.shiftDate)} was canceled. Reason: ${input.reason}`,
          actionUrl: "/my-shift?tab=team",
          relatedId: roster.id,
          read: false,
        });
      }

      await db.insert(institutionalActionLogs).values({
        institutionalAccountId: input.institutionId,
        createdByUserId: ctx.user.id,
        gapIdentified: "A future UTL assignment was entered incorrectly or is no longer valid.",
        systemChange: JSON.stringify({ type: "future_utl_assignment_canceled", rosterId: roster.id, shiftDate: asDateOnly(roster.shiftDate), shiftType: roster.shiftType }),
        status: "completed",
        notes: input.reason,
      });

      return { success: true, rosterId: roster.id, canceledRoleAssignments: linkedAssignments.length };
    }),

  /**
   * Legacy institution-side entry point retained only to fail closed for old clients.
   * Readiness is provider-owned and must be confirmed through iers.signOffShiftReadiness.
   */
  signOffShiftReadiness: protectedProcedure
    .input(z.object({
      institutionId: z.number(),
      rosterId: z.number(),
    }))
    .mutation(async () => {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Shift readiness must be confirmed by the assigned provider in the Individual portal.",
      });
    }),

  bulkAssignShiftUtlProvider: protectedProcedure
    .input(z.object({
      institutionId: z.number().int().positive(),
      poleId: z.number().int().positive(),
      utlUserId: z.number().int().positive(),
      assignments: z.array(z.object({
        departmentId: z.number().int().positive(),
        shiftDate: z.string(),
        shiftType: z.enum(["morning", "evening", "night"]),
        shiftStartTime: z.string().optional(),
        shiftEndTime: z.string().optional(),
        shiftEndDayOffset: z.number().int().min(0).max(1).optional(),
        shiftTemplateId: z.number().int().positive().nullable().optional(),
        status: z.enum(["active", "absent", "completed"]).optional(),
      })).min(1).max(100),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      const saved = [];
      for (const assignment of input.assignments) {
        saved.push(await saveShiftUtlRosterRow(db, ctx.user, {
          ...assignment,
          institutionId: input.institutionId,
          poleId: input.poleId,
          utlUserId: input.utlUserId,
        }));
      }
      return { success: true, savedCount: saved.length, saved };
    }),

  getInstitutionShiftTemplates: protectedProcedure
    .input(z.object({ institutionId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      await assertIersInstitutionReadAccess(db, ctx.user, input.institutionId);
      try {
        return await db.select().from(institutionShiftTemplates)
          .where(and(eq(institutionShiftTemplates.institutionId, input.institutionId), eq(institutionShiftTemplates.isActive, true)))
          .orderBy(asc(institutionShiftTemplates.sortOrder), asc(institutionShiftTemplates.templateName));
      } catch (error) {
        if (isMissingTableError(error)) return [];
        throw error;
      }
    }),

  createInstitutionShiftTemplate: protectedProcedure
    .input(z.object({
      institutionId: z.number().int().positive(),
      templateName: z.string().trim().min(2).max(128),
      startTime: z.string(),
      endTime: z.string(),
      endDayOffset: z.number().int().min(0).max(1).default(0),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      try {
        await assertInstitutionAccountScope(db, ctx.user, input.institutionId, ["account_admin"], { allowInstitutionAdmin: true });
      } catch (error) {
        if (!(error instanceof TRPCError) || error.code !== "FORBIDDEN") throw error;
        await assertInstitutionProductRole(db, ctx.user, input.institutionId, "iers", IERS_DEPARTMENT_GOVERNANCE_ROLES);
      }
      const timing = resolveShiftTiming({ shiftType: "morning", shiftStartTime: input.startTime, shiftEndTime: input.endTime, shiftEndDayOffset: input.endDayOffset });
      try {
        const existing = await db.select({ id: institutionShiftTemplates.id }).from(institutionShiftTemplates).where(and(
          eq(institutionShiftTemplates.institutionId, input.institutionId),
          eq(institutionShiftTemplates.templateName, input.templateName),
        )).limit(1);
        if (existing[0]) {
          await db.update(institutionShiftTemplates).set({
            startTime: timing.startTime,
            endTime: timing.endTime,
            endDayOffset: timing.endDayOffset,
            isActive: true,
          }).where(eq(institutionShiftTemplates.id, existing[0].id));
          return { success: true, templateId: existing[0].id };
        }
        const result = await db.insert(institutionShiftTemplates).values({
          institutionId: input.institutionId,
          templateName: input.templateName,
          startTime: timing.startTime,
          endTime: timing.endTime,
          endDayOffset: timing.endDayOffset,
          sortOrder: 0,
          createdByUserId: ctx.user.id,
        });
        return { success: true, templateId: (result as unknown as { insertId: number }).insertId };
      } catch (error) {
        if (isMissingTableError(error)) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Shift templates are not available until migration 0118 is applied." });
        throw error;
      }
    }),

  // ============================================
  // IERMS™ AUDIT SCORECARD PROCEDURES
  // ============================================

  getLatestIermsAuditScorecard: protectedProcedure
    .input(z.object({ institutionId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      await assertInstitutionAccess(db, ctx.user, input.institutionId);

      const [scorecard] = await db
        .select()
        .from(iermsAuditScorecards)
        .where(eq(iermsAuditScorecards.institutionId, input.institutionId))
        .orderBy(desc(iermsAuditScorecards.auditDate))
        .limit(1);

      return scorecard ?? null;
    }),

  submitIermsAuditScorecard: protectedProcedure
    .input(z.object({
      institutionId: z.number(),
      domain1Score: z.number().min(0).max(20),
      domain2Score: z.number().min(0).max(20),
      domain3Score: z.number().min(0).max(20),
      domain4Score: z.number().min(0).max(20),
      domain5Score: z.number().min(0).max(20),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      await assertInstitutionAccess(db, ctx.user, input.institutionId);

      const totalScore = input.domain1Score + input.domain2Score + input.domain3Score + input.domain4Score + input.domain5Score;
      
      let accreditationLevel: "level_1_unprepared" | "level_2_baseline" | "level_3_certified" | "level_4_exemplar";
      if (totalScore >= 90) {
        accreditationLevel = "level_4_exemplar";
      } else if (totalScore >= 70) {
        accreditationLevel = "level_3_certified";
      } else if (totalScore >= 50) {
        accreditationLevel = "level_2_baseline";
      } else {
        accreditationLevel = "level_1_unprepared";
      }

      const validUntil = new Date();
      validUntil.setFullYear(validUntil.getFullYear() + 1); // 1 year validity

      const [result] = await db.insert(iermsAuditScorecards).values({
        institutionId: input.institutionId,
        auditorUserId: ctx.user.id,
        domain1Score: input.domain1Score,
        domain2Score: input.domain2Score,
        domain3Score: input.domain3Score,
        domain4Score: input.domain4Score,
        domain5Score: input.domain5Score,
        totalScore,
        accreditationLevel,
        notes: input.notes,
        validUntil,
      });

      return { success: true, scorecardId: result.insertId, totalScore, accreditationLevel };
    }),

  // ============================================
  // IERMS™ EQUIPMENT AUDIT PROCEDURES
  // ============================================

  getEquipmentAuditLogs: protectedProcedure
    .input(z.object({ institutionId: z.number(), limit: z.number().default(50) }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      await assertInstitutionAccess(db, ctx.user, input.institutionId);

      return db
        .select()
        .from(equipmentAuditLogs)
        .where(eq(equipmentAuditLogs.institutionId, input.institutionId))
        .orderBy(desc(equipmentAuditLogs.auditDate))
        .limit(input.limit);
    }),

  submitEquipmentAuditLog: protectedProcedure
    .input(z.object({
      institutionId: z.number(),
      shiftRosterId: z.number().int().positive().optional(),
      department: z.string().trim().min(1),
      auditType: z.enum(["daily_seal_check", "monthly_100_percent"]),
      cartSealIntact: z.boolean(),
      hasPaedsAirways: z.boolean(),
      hasPaedsBvm: z.boolean(),
      hasIoNeedles: z.boolean(),
      hasPaedsDefibPads: z.boolean(),
      hasPaedsSuction: z.boolean(),
      deficitsFound: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      await assertInstitutionAccess(db, ctx.user, input.institutionId);

      if (input.shiftRosterId != null) {
        const [roster] = await db
          .select({
            id: shiftUtlRosters.id,
            institutionId: shiftUtlRosters.institutionId,
            utlUserId: shiftUtlRosters.utlUserId,
            assignmentStatus: shiftUtlRosters.assignmentStatus,
            status: shiftUtlRosters.status,
            acceptedAt: shiftUtlRosters.acceptedAt,
          })
          .from(shiftUtlRosters)
          .where(and(
            eq(shiftUtlRosters.id, input.shiftRosterId),
            eq(shiftUtlRosters.institutionId, input.institutionId),
            eq(shiftUtlRosters.utlUserId, ctx.user.id),
          ))
          .limit(1);
        if (!roster) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Only the assigned UTL/ERTL can submit this shift crash-cart check." });
        }
        await assertActiveProviderDutyAccess(db, ctx.user, input.institutionId);
        assertProviderDutyDecision({
          action: "sign_off_readiness",
          requestedInstitutionId: input.institutionId,
          assignmentInstitutionId: roster.institutionId,
          requestingUserId: ctx.user.id,
          assignedUserId: roster.utlUserId,
          membershipStatus: "active",
          iersRoleStatus: "active",
          assignmentStatus: roster.assignmentStatus,
          shiftStatus: roster.status,
          acceptedAt: roster.acceptedAt,
        });
      }

      const [result] = await db.insert(equipmentAuditLogs).values({
        institutionId: input.institutionId,
        department: input.department,
        auditedByUserId: ctx.user.id,
        auditType: input.auditType,
        cartSealIntact: input.cartSealIntact,
        hasPaedsAirways: input.hasPaedsAirways,
        hasPaedsBvm: input.hasPaedsBvm,
        hasIoNeedles: input.hasIoNeedles,
        hasPaedsDefibPads: input.hasPaedsDefibPads,
        hasPaedsSuction: input.hasPaedsSuction,
        deficitsFound: input.deficitsFound,
      });

      const hasDeficit = !input.cartSealIntact || !input.hasPaedsAirways || !input.hasPaedsBvm || !input.hasIoNeedles || !input.hasPaedsDefibPads || !input.hasPaedsSuction || Boolean(input.deficitsFound);
      const deficitList = [
        !input.cartSealIntact ? "Crash cart seal broken" : null,
        !input.hasPaedsAirways ? "Paediatric oral airways missing" : null,
        !input.hasPaedsBvm ? "Paediatric bag-valve-mask missing" : null,
        !input.hasIoNeedles ? "IO needles missing" : null,
        !input.hasPaedsDefibPads ? "Paediatric defib pads missing" : null,
        !input.hasPaedsSuction ? "Paediatric suction catheters missing" : null,
        input.deficitsFound ? `Other deficits: ${input.deficitsFound}` : null,
      ].filter(Boolean).join("; ");

      await db.insert(iersEvidenceRecords).values({
        institutionId: input.institutionId,
        domain: "equipment",
        criterionCode: "EQ-01",
        title: `${input.department} ${input.auditType === "daily_seal_check" ? "daily seal check" : "monthly equipment audit"}`,
        evidenceType: "checklist",
        description: hasDeficit
          ? `Equipment audit recorded with deficits: ${deficitList}`
          : "Equipment audit recorded with all listed paediatric readiness items present.",
        observedAt: new Date(),
        submittedByUserId: ctx.user.id,
        status: "submitted",
      });

      // Preserve the existing action log and also write to the IERS-owned action queue.
      if (hasDeficit) {
        await db.insert(institutionalActionLogs).values({
          institutionalAccountId: input.institutionId,
          createdByUserId: ctx.user.id,
          gapIdentified: `[Equipment Deficit - ${input.department}] ${deficitList}`,
          systemChange: `Restock and verify equipment in ${input.department} crash cart.`,
          status: "open",
        });
        await db.insert(iersActionItems).values({
          institutionId: input.institutionId,
          sourceType: "equipment",
          sourceId: result.insertId,
          title: `Restore paediatric equipment readiness in ${input.department}`,
          gapDescription: deficitList,
          ownerUserId: ctx.user.id,
          priority: "high",
          status: "open",
          createdByUserId: ctx.user.id,
        });
      }

      return { success: true, auditLogId: result.insertId };
    }),

  getEquipmentDeficitAlerts: protectedProcedure
    .input(z.object({ institutionId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      await assertInstitutionAccess(db, ctx.user, input.institutionId);

      const logs = await db
        .select()
        .from(equipmentAuditLogs)
        .where(eq(equipmentAuditLogs.institutionId, input.institutionId))
        .orderBy(desc(equipmentAuditLogs.auditDate))
        .limit(20);

      const openDeficits = logs.filter(
        (l) => !l.cartSealIntact || !l.hasPaedsAirways || !l.hasPaedsBvm || !l.hasIoNeedles || !l.hasPaedsDefibPads || !l.hasPaedsSuction || !!l.deficitsFound
      );

      return { count: openDeficits.length, deficits: openDeficits };
    }),

  // ============================================
  // IERMS™ 90-DAY IMPLEMENTATION TRACKER PROCEDURES
  // ============================================

  getImplementationTracker: protectedProcedure
    .input(z.object({ institutionId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      await assertInstitutionAccess(db, ctx.user, input.institutionId);

      const [tracker] = await db
        .select()
        .from(iermsImplementationTrackers)
        .where(eq(iermsImplementationTrackers.institutionId, input.institutionId))
        .limit(1);

      if (!tracker) {
        const [result] = await db.insert(iermsImplementationTrackers).values({
          institutionId: input.institutionId,
        });
        const [newTracker] = await db
          .select()
          .from(iermsImplementationTrackers)
          .where(eq(iermsImplementationTrackers.id, result.insertId))
          .limit(1);
        return newTracker;
      }

      return tracker;
    }),

  updateImplementationTrackerPhase: protectedProcedure
    .input(z.object({
      institutionId: z.number(),
      phase: z.enum(["phase1MouStatus", "phase2ErtStatus", "phase3TrainingStatus", "phase4AuditStatus"]),
      status: z.enum(["pending", "in_progress", "completed"]),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      await assertInstitutionAccess(db, ctx.user, input.institutionId);

      const [tracker] = await db
        .select()
        .from(iermsImplementationTrackers)
        .where(eq(iermsImplementationTrackers.institutionId, input.institutionId))
        .limit(1);

      if (tracker) {
        await db
          .update(iermsImplementationTrackers)
          .set({ [input.phase]: input.status, lastUpdated: new Date() })
          .where(eq(iermsImplementationTrackers.id, tracker.id));
      } else {
        await db.insert(iermsImplementationTrackers).values({
          institutionId: input.institutionId,
          [input.phase]: input.status,
        });
      }

      return { success: true };
    }),

  /**
   * Admin: retrieve all platform-linked staff members (roster + CPD attendees) for this institution,
   * merged by email, and showing their enrollment status specifically for the given program type.
   */
  getPlatformStaffForProgram: protectedProcedure
    .input(
      z.object({
        institutionId: z.number().int().positive(),
        programType: z.enum(["bls", "acls", "pals", "fellowship"]),
      })
    )
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed" });
      }
      await assertInstitutionAccess(db, ctx.user, input.institutionId);

      // 1. Fetch roster staff
      const rosterStaff = await db
        .select()
        .from(institutionalStaffMembers)
        .where(eq(institutionalStaffMembers.institutionalAccountId, input.institutionId));

      // 2. Fetch CPD attendees scoped to this institution
      const cpdAttendeesList = await db
        .select({
          fullName: cpdAttendees.fullName,
          email: cpdAttendees.email,
          phone: cpdAttendees.phone,
          cadre: cpdAttendees.cadre,
          department: cpdAttendees.department,
        })
        .from(cpdAttendees)
        .where(eq(cpdAttendees.institutionalAccountId, input.institutionId));

      // 3. Normalize emails and merge into unique set
      const staffMap = new Map<string, {
        name: string;
        email: string;
        phone: string;
        role: string;
        department: string;
        isRoster: boolean;
        isCpd: boolean;
      }>();

      for (const s of rosterStaff) {
        if (s.staffEmail) {
          const emailKey = s.staffEmail.trim().toLowerCase();
          staffMap.set(emailKey, {
            name: s.staffName,
            email: s.staffEmail,
            phone: s.staffPhone || "",
            role: s.staffRole,
            department: s.department || "",
            isRoster: true,
            isCpd: false,
          });
        }
      }

      for (const c of cpdAttendeesList) {
        if (c.email) {
          const emailKey = c.email.trim().toLowerCase();
          if (!staffMap.has(emailKey)) {
            staffMap.set(emailKey, {
              name: c.fullName,
              email: c.email,
              phone: c.phone || "",
              role: c.cadre || "other",
              department: c.department || "",
              isRoster: false,
              isCpd: true,
            });
          } else {
            const existing = staffMap.get(emailKey)!;
            existing.isCpd = true;
          }
        }
      }

      const allEmails = Array.from(staffMap.keys());
      if (allEmails.length === 0) return [];

      // 4. Resolve platform accounts via users table
      const platformUsers = await db
        .select({
          id: users.id,
          email: users.email,
        })
        .from(users)
        .where(inArray(sql`LOWER(${users.email})`, allEmails));

      const userEmailMap = new Map<string, number>();
      for (const u of platformUsers) {
        if (u.email) {
          userEmailMap.set(u.email.trim().toLowerCase(), u.id);
        }
      }

      const userIds = Array.from(userEmailMap.values());

      // 5. Query enrollments for specified program type
      let programEnrollments: Array<any> = [];
      if (userIds.length > 0) {
        programEnrollments = await db
          .select({
            id: enrollments.id,
            userId: enrollments.userId,
            paymentStatus: enrollments.paymentStatus,
            cognitiveModulesComplete: enrollments.cognitiveModulesComplete,
            practicalSkillsSignedOff: enrollments.practicalSkillsSignedOff,
            trainingDate: enrollments.trainingDate,
          })
          .from(enrollments)
          .where(
            and(
              eq(enrollments.programType, input.programType),
              inArray(enrollments.userId, userIds)
            )
          );
      }

      const enrollmentMap = new Map<number, typeof programEnrollments[number]>();
      for (const e of programEnrollments) {
        enrollmentMap.set(e.userId, e);
      }

      // 6. Map everything to unified response
      return Array.from(staffMap.values()).map((s) => {
        const emailKey = s.email.trim().toLowerCase();
        const userId = userEmailMap.get(emailKey) ?? null;
        const enrollment = userId ? enrollmentMap.get(userId) : null;

        let status: "not_enrolled" | "enrolled" | "cognitive_completed" | "completed" = "not_enrolled";
        if (enrollment) {
          if (enrollment.cognitiveModulesComplete && enrollment.practicalSkillsSignedOff) {
            status = "completed";
          } else if (enrollment.cognitiveModulesComplete) {
            status = "cognitive_completed";
          } else {
            status = "enrolled";
          }
        }

        return {
          name: s.name,
          email: s.email,
          phone: s.phone,
          role: s.role,
          department: s.department,
          isRoster: s.isRoster,
          isCpd: s.isCpd,
          userId,
          status,
          trainingDate: enrollment?.trainingDate ?? null,
          paymentStatus: enrollment?.paymentStatus ?? null,
        };
      });
    }),
});

