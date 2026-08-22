import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { and, asc, desc, eq, inArray, isNull, isNotNull } from "drizzle-orm";
import { getDb } from "../db";
import { protectedProcedure, router } from "../_core/trpc";
import {
  cpdAttendees,
  facilityDepartments,
  institutionDepartmentAuditEvents,
  institutionDepartmentReconciliations,
} from "../../drizzle/schema";
import { assertInstitutionAccountScope } from "../lib/institution-account-scopes";
import { assertInstitutionProductCapability } from "../lib/institution-entitlements";
import { assertInstitutionProductRole } from "../lib/institution-product-roles";
import {
  canonicalizeDepartmentLabel,
  departmentLabelsMatch,
  isPresetDepartment,
} from "../../shared/clinical-departments";
import {
  normalizeDepartmentKey,
  normalizeOptionalReason,
  suggestCatalogDepartment,
} from "../lib/institution-department-reconciliation";
import { isMissingTableError } from "../lib/is-missing-db-table";

type Db = NonNullable<Awaited<ReturnType<typeof getDb>>>;

type AttendanceGroup = {
  normalizedLabel: string;
  rawLabel: string;
  attendanceIds: number[];
  unlinkedAttendanceIds: number[];
  attendanceCount: number;
  firstUsedAt: Date;
  lastUsedAt: Date;
};

function isMissingSchemaColumnError(error: unknown) {
  const candidate = error as { code?: string; message?: string };
  return candidate?.code === "ER_BAD_FIELD_ERROR" || candidate?.message?.includes("Unknown column") === true;
}

function throwIfReconciliationSchemaUnavailable(error: unknown): never {
  if (isMissingTableError(error) || isMissingSchemaColumnError(error)) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: "Department reconciliation is not available until the 0115 migration is applied.",
    });
  }
  throw error;
}

async function requireDb(): Promise<Db> {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
  return db;
}

function groupAttendance(rows: Array<{ id: number; department: string; submittedAt: Date; facilityDepartmentId?: number | null }>): Map<string, AttendanceGroup> {
  const groups = new Map<string, AttendanceGroup>();
  for (const row of rows) {
    const rawLabel = row.department.trim();
    const normalizedLabel = normalizeDepartmentKey(rawLabel);
    if (!normalizedLabel) continue;
    const existing = groups.get(normalizedLabel);
    if (!existing) {
      groups.set(normalizedLabel, {
        normalizedLabel,
        rawLabel,
        attendanceIds: [row.id],
        unlinkedAttendanceIds: [row.id],
        attendanceCount: 1,
        firstUsedAt: row.submittedAt,
        lastUsedAt: row.submittedAt,
      });
      continue;
    }
    existing.attendanceIds.push(row.id);
    existing.unlinkedAttendanceIds.push(row.id);
    existing.attendanceCount += 1;
    if (row.submittedAt < existing.firstUsedAt) {
      existing.firstUsedAt = row.submittedAt;
      existing.rawLabel = rawLabel;
    }
    if (row.submittedAt > existing.lastUsedAt) existing.lastUsedAt = row.submittedAt;
  }
  return groups;
}

async function loadDashboardData(db: Db, institutionId: number) {
  const [unlinkedRows, persistedRows, departments] = await Promise.all([
    db
      .select({ id: cpdAttendees.id, department: cpdAttendees.department, submittedAt: cpdAttendees.submittedAt })
      .from(cpdAttendees)
      .where(and(eq(cpdAttendees.institutionalAccountId, institutionId), isNull(cpdAttendees.facilityDepartmentId))),
    db
      .select()
      .from(institutionDepartmentReconciliations)
      .where(eq(institutionDepartmentReconciliations.institutionalAccountId, institutionId))
      .orderBy(desc(institutionDepartmentReconciliations.updatedAt)),
    db
      .select()
      .from(facilityDepartments)
      .where(eq(facilityDepartments.institutionId, institutionId))
      .orderBy(asc(facilityDepartments.departmentName)),
  ]);

  const groups = groupAttendance(unlinkedRows);
  const persistedByLabel = new Map(persistedRows.map((row) => [row.normalizedLabel, row]));
  const departmentById = new Map(departments.map((department) => [department.id, department]));
  const labels = new Map<string, AttendanceGroup>();
  for (const group of groups.values()) labels.set(group.normalizedLabel, group);
  for (const row of persistedRows) {
    if (!labels.has(row.normalizedLabel)) {
      labels.set(row.normalizedLabel, {
        normalizedLabel: row.normalizedLabel,
        rawLabel: row.rawLabel,
        attendanceIds: [],
        unlinkedAttendanceIds: [],
        attendanceCount: row.attendanceCount,
        firstUsedAt: row.firstUsedAt,
        lastUsedAt: row.lastUsedAt,
      });
    }
  }

  const labelRows = Array.from(labels.values())
    .sort((a, b) => b.lastUsedAt.getTime() - a.lastUsedAt.getTime())
    .map((group) => {
      const persisted = persistedByLabel.get(group.normalizedLabel);
      const suggestion = suggestCatalogDepartment(group.rawLabel);
      const reviewedDepartment = persisted?.reviewedFacilityDepartmentId != null
        ? departmentById.get(persisted.reviewedFacilityDepartmentId)
        : undefined;
      return {
        id: persisted?.id ?? null,
        normalizedLabel: group.normalizedLabel,
        rawLabel: group.rawLabel,
        attendanceCount: group.attendanceCount,
        currentlyUnmappedCount: group.unlinkedAttendanceIds.length,
        firstUsedAt: group.firstUsedAt,
        lastUsedAt: group.lastUsedAt,
        status: persisted?.status ?? "open",
        suggestionConfidence: persisted?.suggestionConfidence ?? suggestion.confidence,
        suggestedCatalogLabel: persisted?.suggestedCatalogLabel ?? suggestion.suggestedLabel,
        candidateCatalogLabels: suggestion.candidateLabels,
        reviewedFacilityDepartmentId: persisted?.reviewedFacilityDepartmentId ?? null,
        reviewedFacilityDepartmentName: reviewedDepartment?.departmentName ?? null,
        reviewedAt: persisted?.reviewedAt ?? null,
        reviewReason: persisted?.reviewReason ?? null,
        backfilledCount: persisted?.backfilledCount ?? 0,
        backfillComplete: group.unlinkedAttendanceIds.length === 0 && (persisted?.backfilledCount ?? 0) > 0,
      };
    });

  const missingPoleDepartments = departments.filter((department) =>
    department.isActive &&
    department.confirmedAt != null &&
    department.requiresPole &&
    department.poleId == null,
  );

  return {
    labels: labelRows,
    departments: departments.map((department) => ({
      ...department,
      departmentSource: isPresetDepartment(department.departmentName) ? "preset" as const : "custom" as const,
    })),
    missingPoleDepartments: missingPoleDepartments.map((department) => ({
      id: department.id,
      departmentName: department.departmentName,
      reason: "This confirmed active department is explicitly marked as IERS operational and still has no response pole.",
    })),
    summary: {
      labelsRequiringReview: labelRows.filter((row) => row.status === "open" || row.status === "deferred").length,
      unresolvedAttendanceRows: labelRows.reduce((total, row) => total + row.currentlyUnmappedCount, 0),
      operationalDepartmentsRequiringPole: departments.filter((department) => department.isActive && department.confirmedAt != null && department.requiresPole).length,
      operationalDepartmentsMissingPole: missingPoleDepartments.length,
    },
  };
}

const accountAdminStatus = z.enum(["deferred", "dismissed", "open"]);

export const institutionDepartmentReconciliation = router({
  getDepartmentReconciliationDashboard: protectedProcedure
    .input(z.object({ institutionId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const db = await requireDb();
      await assertInstitutionAccountScope(db, ctx.user, input.institutionId, ["account_admin"], { allowInstitutionAdmin: true });
      try {
        return await loadDashboardData(db, input.institutionId);
      } catch (error) {
        return throwIfReconciliationSchemaUnavailable(error);
      }
    }),

  mapDepartmentLabel: protectedProcedure
    .input(z.object({
      institutionId: z.number().int().positive(),
      normalizedLabel: z.string().trim().min(1).max(256),
      targetFacilityDepartmentId: z.number().int().positive().optional(),
      newDepartmentName: z.string().trim().min(2).max(128).optional(),
      customExceptionAcknowledged: z.boolean().optional(),
      backfillUnlinkedAttendance: z.boolean().default(false),
      reason: z.string().trim().min(3).max(1000),
    }).refine((input) => (input.targetFacilityDepartmentId != null) !== (input.newDepartmentName != null), {
      message: "Choose exactly one existing department or new department name.",
      path: ["targetFacilityDepartmentId"],
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await requireDb();
      await assertInstitutionAccountScope(db, ctx.user, input.institutionId, ["account_admin"], { allowInstitutionAdmin: true });
      try {
        const target = await db.transaction(async (tx) => {
          const [attendanceRows, currentReconciliation] = await Promise.all([
            tx
              .select({ id: cpdAttendees.id, department: cpdAttendees.department, submittedAt: cpdAttendees.submittedAt })
              .from(cpdAttendees)
              .where(and(eq(cpdAttendees.institutionalAccountId, input.institutionId), isNull(cpdAttendees.facilityDepartmentId))),
            tx
              .select()
              .from(institutionDepartmentReconciliations)
              .where(and(
                eq(institutionDepartmentReconciliations.institutionalAccountId, input.institutionId),
                eq(institutionDepartmentReconciliations.normalizedLabel, normalizeDepartmentKey(input.normalizedLabel)),
              ))
              .limit(1),
          ]);
          const group = groupAttendance(attendanceRows).get(normalizeDepartmentKey(input.normalizedLabel));
          if (!group && !currentReconciliation[0]) {
            throw new TRPCError({ code: "NOT_FOUND", message: "That CPD department label is no longer awaiting reconciliation." });
          }

          let targetDepartmentId = input.targetFacilityDepartmentId ?? null;
          let targetDepartmentName = "";
          if (targetDepartmentId != null) {
            const [department] = await tx
              .select({ id: facilityDepartments.id, departmentName: facilityDepartments.departmentName })
              .from(facilityDepartments)
              .where(and(
                eq(facilityDepartments.id, targetDepartmentId),
                eq(facilityDepartments.institutionId, input.institutionId),
                eq(facilityDepartments.isActive, true),
                isNotNull(facilityDepartments.confirmedAt),
              ))
              .limit(1);
            if (!department) throw new TRPCError({ code: "NOT_FOUND", message: "Target department is not active and confirmed in this institution." });
            targetDepartmentName = department.departmentName;
          } else {
            targetDepartmentName = canonicalizeDepartmentLabel(input.newDepartmentName!);
            if (!isPresetDepartment(targetDepartmentName) && input.customExceptionAcknowledged !== true) {
              throw new TRPCError({ code: "BAD_REQUEST", message: "A genuine custom department requires explicit exception acknowledgement." });
            }
            const [duplicate] = await tx
              .select({ id: facilityDepartments.id, departmentName: facilityDepartments.departmentName })
              .from(facilityDepartments)
              .where(eq(facilityDepartments.institutionId, input.institutionId));
            const existingDepartments = duplicate ? await tx.select().from(facilityDepartments).where(eq(facilityDepartments.institutionId, input.institutionId)) : [];
            const matchingExisting = existingDepartments.find((department) => departmentLabelsMatch(department.departmentName, targetDepartmentName));
            if (matchingExisting) {
              if (!matchingExisting.isActive || !matchingExisting.confirmedAt) throw new TRPCError({ code: "CONFLICT", message: "A matching department exists but is inactive or unconfirmed. Confirm it in department setup before mapping attendance." });
              targetDepartmentId = matchingExisting.id;
              targetDepartmentName = matchingExisting.departmentName;
            } else {
              const [inserted] = await tx.insert(facilityDepartments).values({
                institutionId: input.institutionId,
                departmentName: targetDepartmentName,
                poleId: null,
                isActive: true,
                requiresPole: false,
                confirmedAt: new Date(),
                confirmedByUserId: ctx.user.id,
              });
              targetDepartmentId = Number(inserted.insertId);
            }
          }

          const now = new Date();
          const previous = currentReconciliation[0];
          const attendanceIds = group?.attendanceIds ?? [];
          let backfilledCount = 0;
          if (input.backfillUnlinkedAttendance && attendanceIds.length > 0) {
            await tx
              .update(cpdAttendees)
              .set({ facilityDepartmentId: targetDepartmentId })
              .where(and(
                eq(cpdAttendees.institutionalAccountId, input.institutionId),
                isNull(cpdAttendees.facilityDepartmentId),
                inArray(cpdAttendees.id, attendanceIds),
              ));
            const backfilledRows = await tx
              .select({ id: cpdAttendees.id })
              .from(cpdAttendees)
              .where(and(
                eq(cpdAttendees.institutionalAccountId, input.institutionId),
                eq(cpdAttendees.facilityDepartmentId, targetDepartmentId),
                inArray(cpdAttendees.id, attendanceIds),
              ));
            backfilledCount = backfilledRows.length;
          }

          const normalizedLabel = normalizeDepartmentKey(input.normalizedLabel);
          const rawLabel = group?.rawLabel ?? previous?.rawLabel ?? input.normalizedLabel.trim();
          const suggestion = suggestCatalogDepartment(rawLabel);
          let reconciliationId = previous?.id ?? null;
          if (previous) {
            await tx.update(institutionDepartmentReconciliations).set({
              status: "mapped",
              suggestedCatalogLabel: previous.suggestedCatalogLabel ?? suggestion.suggestedLabel,
              suggestionConfidence: previous.suggestionConfidence === "none" ? suggestion.confidence : previous.suggestionConfidence,
              reviewedFacilityDepartmentId: targetDepartmentId,
              reviewedByUserId: ctx.user.id,
              reviewedAt: now,
              reviewReason: input.reason,
              backfilledCount: previous.backfilledCount + backfilledCount,
              backfilledByUserId: input.backfillUnlinkedAttendance ? ctx.user.id : previous.backfilledByUserId,
              backfilledAt: input.backfillUnlinkedAttendance ? now : previous.backfilledAt,
              attendanceCount: group?.attendanceCount ?? previous.attendanceCount,
              firstUsedAt: group?.firstUsedAt ?? previous.firstUsedAt,
              lastUsedAt: group?.lastUsedAt ?? previous.lastUsedAt,
              updatedAt: now,
            }).where(eq(institutionDepartmentReconciliations.id, previous.id));
          } else {
            const [inserted] = await tx.insert(institutionDepartmentReconciliations).values({
              institutionalAccountId: input.institutionId,
              normalizedLabel,
              rawLabel,
              status: "mapped",
              suggestedCatalogLabel: suggestion.suggestedLabel,
              suggestionConfidence: suggestion.confidence,
              reviewedFacilityDepartmentId: targetDepartmentId,
              reviewedByUserId: ctx.user.id,
              reviewedAt: now,
              reviewReason: input.reason,
              backfilledCount,
              backfilledByUserId: input.backfillUnlinkedAttendance ? ctx.user.id : null,
              backfilledAt: input.backfillUnlinkedAttendance ? now : null,
              firstUsedAt: group?.firstUsedAt ?? now,
              lastUsedAt: group?.lastUsedAt ?? now,
              attendanceCount: group?.attendanceCount ?? 0,
            });
            reconciliationId = Number(inserted.insertId);
          }

          await tx.insert(institutionDepartmentAuditEvents).values({
            institutionalAccountId: input.institutionId,
            reconciliationId,
            departmentId: targetDepartmentId,
            eventType: input.backfillUnlinkedAttendance ? "mapped_and_backfilled" : "mapped_without_backfill",
            previousStatus: previous?.status ?? "open",
            currentStatus: "mapped",
            previousDepartmentId: previous?.reviewedFacilityDepartmentId ?? null,
            currentDepartmentId: targetDepartmentId,
            backfilledCount,
            actorUserId: ctx.user.id,
            reason: input.reason,
          });

          return { targetDepartmentId, targetDepartmentName, backfilledCount, reconciliationId };
        });
        return { success: true, ...target };
      } catch (error) {
        return throwIfReconciliationSchemaUnavailable(error);
      }
    }),

  updateReviewStatus: protectedProcedure
    .input(z.object({
      institutionId: z.number().int().positive(),
      normalizedLabel: z.string().trim().min(1).max(256),
      status: accountAdminStatus,
      reason: z.string().trim().min(3).max(1000),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await requireDb();
      await assertInstitutionAccountScope(db, ctx.user, input.institutionId, ["account_admin"], { allowInstitutionAdmin: true });
      try {
        const normalizedLabel = normalizeDepartmentKey(input.normalizedLabel);
        const [attendanceRows, currentRows] = await Promise.all([
          db
            .select({ id: cpdAttendees.id, department: cpdAttendees.department, submittedAt: cpdAttendees.submittedAt })
            .from(cpdAttendees)
            .where(and(eq(cpdAttendees.institutionalAccountId, input.institutionId), isNull(cpdAttendees.facilityDepartmentId))),
          db
            .select()
            .from(institutionDepartmentReconciliations)
            .where(and(eq(institutionDepartmentReconciliations.institutionalAccountId, input.institutionId), eq(institutionDepartmentReconciliations.normalizedLabel, normalizedLabel)))
            .limit(1),
        ]);
        const group = groupAttendance(attendanceRows).get(normalizedLabel);
        const previous = currentRows[0];
        if (!group && !previous) throw new TRPCError({ code: "NOT_FOUND", message: "That CPD department label is no longer available for review." });
        const now = new Date();
        let reconciliationId = previous?.id ?? null;
        if (previous) {
          await db.update(institutionDepartmentReconciliations).set({
            status: input.status,
            reviewedByUserId: ctx.user.id,
            reviewedAt: now,
            reviewReason: input.reason,
            attendanceCount: group?.attendanceCount ?? previous.attendanceCount,
            firstUsedAt: group?.firstUsedAt ?? previous.firstUsedAt,
            lastUsedAt: group?.lastUsedAt ?? previous.lastUsedAt,
            updatedAt: now,
          }).where(eq(institutionDepartmentReconciliations.id, previous.id));
        } else {
          const suggestion = suggestCatalogDepartment(group!.rawLabel);
          const [inserted] = await db.insert(institutionDepartmentReconciliations).values({
            institutionalAccountId: input.institutionId,
            normalizedLabel,
            rawLabel: group!.rawLabel,
            status: input.status,
            suggestedCatalogLabel: suggestion.suggestedLabel,
            suggestionConfidence: suggestion.confidence,
            reviewedByUserId: ctx.user.id,
            reviewedAt: now,
            reviewReason: input.reason,
            firstUsedAt: group!.firstUsedAt,
            lastUsedAt: group!.lastUsedAt,
            attendanceCount: group!.attendanceCount,
          });
          reconciliationId = Number(inserted.insertId);
        }
        await db.insert(institutionDepartmentAuditEvents).values({
          institutionalAccountId: input.institutionId,
          reconciliationId,
          eventType: input.status === "open" ? "reopened" : input.status,
          previousStatus: previous?.status ?? "open",
          currentStatus: input.status,
          actorUserId: ctx.user.id,
          reason: input.reason,
        });
        return { success: true, status: input.status };
      } catch (error) {
        return throwIfReconciliationSchemaUnavailable(error);
      }
    }),

  setDepartmentPoleEligibility: protectedProcedure
    .input(z.object({
      institutionId: z.number().int().positive(),
      departmentId: z.number().int().positive(),
      requiresPole: z.boolean(),
      reason: z.string().trim().min(3).max(1000),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await requireDb();
      await assertInstitutionAccountScope(db, ctx.user, input.institutionId, ["account_admin"], { allowInstitutionAdmin: true });
      try {
        const [department] = await db
          .select()
          .from(facilityDepartments)
          .where(and(eq(facilityDepartments.id, input.departmentId), eq(facilityDepartments.institutionId, input.institutionId)))
          .limit(1);
        if (!department) throw new TRPCError({ code: "NOT_FOUND", message: "Department not found in this institution." });
        if (input.requiresPole && (!department.isActive || department.confirmedAt == null)) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Only a confirmed active department can be marked as requiring an IERS pole." });
        }
        if (department.requiresPole === input.requiresPole) return { success: true, changed: false, requiresPole: department.requiresPole };
        await db.update(facilityDepartments).set({ requiresPole: input.requiresPole }).where(eq(facilityDepartments.id, department.id));
        await db.insert(institutionDepartmentAuditEvents).values({
          institutionalAccountId: input.institutionId,
          departmentId: department.id,
          eventType: input.requiresPole ? "pole_requirement_enabled" : "pole_requirement_disabled",
          previousRequiresPole: department.requiresPole,
          currentRequiresPole: input.requiresPole,
          actorUserId: ctx.user.id,
          reason: input.reason,
        });
        return { success: true, changed: true, requiresPole: input.requiresPole };
      } catch (error) {
        return throwIfReconciliationSchemaUnavailable(error);
      }
    }),

  getIersMissingPoleAlerts: protectedProcedure
    .input(z.object({ institutionId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const db = await requireDb();
      await assertInstitutionProductCapability(db, input.institutionId, "iers", "iers.workspace.read");
      await assertInstitutionProductRole(db, ctx.user, input.institutionId, "iers", ["iers_coordinator", "iers_governance"]);
      try {
        const rows = await db
          .select({
            id: facilityDepartments.id,
            departmentName: facilityDepartments.departmentName,
            confirmedAt: facilityDepartments.confirmedAt,
            requiresPole: facilityDepartments.requiresPole,
          })
          .from(facilityDepartments)
          .where(and(
            eq(facilityDepartments.institutionId, input.institutionId),
            eq(facilityDepartments.isActive, true),
            isNotNull(facilityDepartments.confirmedAt),
            eq(facilityDepartments.requiresPole, true),
            isNull(facilityDepartments.poleId),
          ))
          .orderBy(asc(facilityDepartments.departmentName));
        return rows.map((row) => ({
          ...row,
          severity: "warning" as const,
          title: "IERS pole allocation required",
          message: `${row.departmentName} is configured as operational for IERS but has no response pole yet.`,
        }));
      } catch (error) {
        return throwIfReconciliationSchemaUnavailable(error);
      }
    }),

  listDepartmentAuditEvents: protectedProcedure
    .input(z.object({
      institutionId: z.number().int().positive(),
      limit: z.number().int().min(1).max(200).default(100),
      departmentId: z.number().int().positive().optional(),
      reconciliationId: z.number().int().positive().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const db = await requireDb();
      await assertInstitutionAccountScope(db, ctx.user, input.institutionId, ["account_admin"], { allowInstitutionAdmin: true });
      try {
        const predicates = [eq(institutionDepartmentAuditEvents.institutionalAccountId, input.institutionId)];
        if (input.departmentId != null) predicates.push(eq(institutionDepartmentAuditEvents.departmentId, input.departmentId));
        if (input.reconciliationId != null) predicates.push(eq(institutionDepartmentAuditEvents.reconciliationId, input.reconciliationId));
        return await db
          .select()
          .from(institutionDepartmentAuditEvents)
          .where(and(...predicates))
          .orderBy(desc(institutionDepartmentAuditEvents.createdAt))
          .limit(input.limit);
      } catch (error) {
        return throwIfReconciliationSchemaUnavailable(error);
      }
    }),
});
