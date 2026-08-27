import { TRPCError } from "@trpc/server";
import { and, asc, eq, ne } from "drizzle-orm";
import { z } from "zod";
import { resusGpsClinicalEvents, institutionMemberships, iersActivationEvents, iersActivationResponders } from "../../drizzle/schema";
import { getDb } from "../db";
import { protectedProcedure, router } from "../_core/trpc";

const eventTypeSchema = z.enum([
  "phase_change",
  "finding",
  "threat_identified",
  "intervention_started",
  "intervention_completed",
  "safety_alert",
  "reassessment",
  "vital_sign",
  "diagnosis",
  "note",
  "cardiac_arrest_start",
  "rosc",
  "patient_info_updated",
  "resource_unavailable",
  "definitive_care",
]);

const eventInputSchema = z.object({
  localEventId: z.string().trim().min(8).max(96),
  sessionId: z.string().trim().min(1).max(64),
  activationEventId: z.number().int().positive().optional(),
  eventType: eventTypeSchema,
  letter: z.enum(["X", "A", "B", "C", "D", "E"]).optional(),
  detail: z.string().trim().min(1).max(2000),
  eventData: z.record(z.string(), z.unknown()).optional(),
  eventTimestamp: z.number().int().min(0).max(4102444800000),
});

type SafeValue = string | number | boolean | null | SafeValue[] | { [key: string]: SafeValue };

const SENSITIVE_KEY = /^(patient|patientName|name|mrn|medicalRecord|medicalRecordNumber|recordNumber|hospitalNumber|identifier|phone|email|address|nationalId|idNumber)$/i;

function sanitizeValue(value: unknown, depth = 0): SafeValue | undefined {
  if (depth > 3) return "[depth limited]";
  if (value === null || typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return typeof value === "string" ? value.slice(0, 500) : value;
  }
  if (Array.isArray(value)) return value.slice(0, 50).map((item) => sanitizeValue(item, depth + 1) ?? "[omitted]");
  if (typeof value === "object") {
    const output: Record<string, SafeValue> = {};
    for (const [key, child] of Object.entries(value)) {
      if (SENSITIVE_KEY.test(key)) continue;
      const sanitized = sanitizeValue(child, depth + 1);
      if (sanitized !== undefined) output[key.slice(0, 80)] = sanitized;
    }
    return output;
  }
  return undefined;
}

export function sanitizeEventData(eventData: Record<string, unknown> | undefined): string | null {
  if (!eventData) return null;
  const sanitized = sanitizeValue(eventData);
  if (!sanitized || typeof sanitized !== "object" || Array.isArray(sanitized)) return null;
  const serialized = JSON.stringify(sanitized);
  return serialized.length > 8000 ? `${serialized.slice(0, 7990)}...[truncated]` : serialized;
}

async function assertActivationAccess(db: NonNullable<Awaited<ReturnType<typeof getDb>>>, userId: number, activationEventId: number) {
  const [activation] = await db
    .select({ id: iersActivationEvents.id, institutionalAccountId: iersActivationEvents.institutionalAccountId, activatedByUserId: iersActivationEvents.activatedByUserId })
    .from(iersActivationEvents)
    .where(eq(iersActivationEvents.id, activationEventId))
    .limit(1);
  if (!activation) throw new TRPCError({ code: "NOT_FOUND", message: "IERS activation not found." });

  const [membership] = await db
    .select({ id: institutionMemberships.id })
    .from(institutionMemberships)
    .where(and(
      eq(institutionMemberships.institutionalAccountId, activation.institutionalAccountId),
      eq(institutionMemberships.userId, userId),
      eq(institutionMemberships.membershipStatus, "active"),
    ))
    .limit(1);
  if (!membership) throw new TRPCError({ code: "FORBIDDEN", message: "An active institutional membership is required for this IERS case." });

  if (activation.activatedByUserId === userId) return;
  const [responder] = await db
    .select({ id: iersActivationResponders.id })
    .from(iersActivationResponders)
    .where(and(
      eq(iersActivationResponders.activationEventId, activationEventId),
      eq(iersActivationResponders.userId, userId),
      ne(iersActivationResponders.notificationStatus, "declined"),
      ne(iersActivationResponders.notificationStatus, "timed_out"),
      ne(iersActivationResponders.notificationStatus, "failed"),
    ))
    .limit(1);
  if (!responder) throw new TRPCError({ code: "FORBIDDEN", message: "Only the activation creator or an active responder can record events for this IERS case." });
}

export const resusEventRouter = router({
  append: protectedProcedure
    .input(eventInputSchema)
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed." });
      if (input.activationEventId !== undefined) await assertActivationAccess(db, ctx.user.id, input.activationEventId);

      const [existing] = await db
        .select()
        .from(resusGpsClinicalEvents)
        .where(eq(resusGpsClinicalEvents.localEventId, input.localEventId))
        .limit(1);
      if (existing) {
        if (existing.userId !== ctx.user.id || existing.sessionId !== input.sessionId || existing.activationEventId !== (input.activationEventId ?? null)) {
          throw new TRPCError({ code: "CONFLICT", message: "This event ID is already bound to another ResusGPS case." });
        }
        return { success: true, alreadyExists: true, serverEventId: existing.localEventId } as const;
      }

      try {
        await db.insert(resusGpsClinicalEvents).values({
          localEventId: input.localEventId,
          sessionId: input.sessionId,
          userId: ctx.user.id,
          activationEventId: input.activationEventId ?? null,
          eventType: input.eventType,
          letter: input.letter ?? null,
          detail: input.detail,
          eventData: sanitizeEventData(input.eventData),
          eventTimestamp: input.eventTimestamp,
          createdAt: new Date(),
        });
      } catch (error) {
        if ((error as { code?: string }).code !== "ER_DUP_ENTRY") throw error;
        const [raceExisting] = await db
          .select()
          .from(resusGpsClinicalEvents)
          .where(eq(resusGpsClinicalEvents.localEventId, input.localEventId))
          .limit(1);
        if (!raceExisting) throw error;
        if (raceExisting.userId !== ctx.user.id || raceExisting.sessionId !== input.sessionId || raceExisting.activationEventId !== (input.activationEventId ?? null)) {
          throw new TRPCError({ code: "CONFLICT", message: "This event ID is already bound to another ResusGPS case." });
        }
        return { success: true, alreadyExists: true, serverEventId: raceExisting.localEventId } as const;
      }

      return { success: true, alreadyExists: false, serverEventId: input.localEventId } as const;
    }),

  listForSession: protectedProcedure
    .input(z.object({
      sessionId: z.string().trim().min(1).max(64),
      activationEventId: z.number().int().positive().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed." });
      if (input.activationEventId !== undefined) await assertActivationAccess(db, ctx.user.id, input.activationEventId);
      const scope = input.activationEventId !== undefined
        ? and(
          eq(resusGpsClinicalEvents.sessionId, input.sessionId),
          eq(resusGpsClinicalEvents.activationEventId, input.activationEventId),
        )
        : and(
          eq(resusGpsClinicalEvents.sessionId, input.sessionId),
          eq(resusGpsClinicalEvents.userId, ctx.user.id),
        );
      return db
        .select({
          localEventId: resusGpsClinicalEvents.localEventId,
          sessionId: resusGpsClinicalEvents.sessionId,
          userId: resusGpsClinicalEvents.userId,
          activationEventId: resusGpsClinicalEvents.activationEventId,
          eventType: resusGpsClinicalEvents.eventType,
          letter: resusGpsClinicalEvents.letter,
          detail: resusGpsClinicalEvents.detail,
          eventData: resusGpsClinicalEvents.eventData,
          eventTimestamp: resusGpsClinicalEvents.eventTimestamp,
          createdAt: resusGpsClinicalEvents.createdAt,
        })
        .from(resusGpsClinicalEvents)
        .where(scope)
        .orderBy(asc(resusGpsClinicalEvents.eventTimestamp))
        .limit(500);
    }),
});
