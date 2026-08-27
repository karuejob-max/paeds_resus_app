import { and, eq, inArray, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  ierpEmailAttributions,
  ierpEmailAuditLog,
  ierpEmailCampaigns,
  ierpEmailPreferences,
  ierpEmailSuppressions,
  ierpProgramEnrollments,
  users,
} from "../../drizzle/schema";
import { getDb } from "../db";
import { protectedProcedure, router } from "../_core/trpc";
import { blockIerpPromotionalSend, getIerpEmailSafetyStatus } from "../lib/ierp-email-safety";
const audienceFilterSchema = z.object({
  designation: z.enum(["noi", "coi_bsc", "coi_diploma", "moi"]).optional(),
  phaseStatus: z.enum(["phase_1", "phase_2", "phase_3", "completed"]).optional(),
  lifecycleStatus: z.enum(["active", "completed", "withdrawn"]).optional(),
});

type AudienceFilter = z.infer<typeof audienceFilterSchema>;

function requireAdmin(role: string) {
  if (role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Platform admin access required." });
}

async function audit(db: NonNullable<Awaited<ReturnType<typeof getDb>>>, actorUserId: number, action: "created" | "updated" | "paused" | "previewed" | "send_blocked" | "consent_updated" | "suppressed", campaignId: number | null, detail: unknown) {
  await db.insert(ierpEmailAuditLog).values({ campaignId, actorUserId, action, detailJson: JSON.stringify(detail) });
}

export const ierpCampaignsRouter = router({
  getSafetyStatus: protectedProcedure.query(({ ctx }) => {
    requireAdmin(ctx.user.role);
    return { ...getIerpEmailSafetyStatus(), note: "Promotional IERP sends are disabled in this release." };
  }),

  list: protectedProcedure.query(async ({ ctx }) => {
    requireAdmin(ctx.user.role);
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    return db.select().from(ierpEmailCampaigns).orderBy(desc(ierpEmailCampaigns.updatedAt));
  }),

  createDraft: protectedProcedure
    .input(z.object({ name: z.string().trim().min(1).max(255), subject: z.string().trim().min(1).max(255), body: z.string().trim().min(1).max(100_000), templateVersion: z.string().trim().min(1).max(64), audienceFilter: audienceFilterSchema }))
    .mutation(async ({ ctx, input }) => {
      requireAdmin(ctx.user.role);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      const inserted = await db.insert(ierpEmailCampaigns).values({
        programKey: "ierp",
        name: input.name,
        subject: input.subject,
        body: input.body,
        templateVersion: input.templateVersion,
        audienceFilterJson: JSON.stringify(input.audienceFilter),
        scheduleState: "draft",
        sendingEnabled: false,
        createdByUserId: ctx.user.id,
      }).$returningId();
      const campaignId = (inserted as { id?: number }[])[0]?.id ?? 0;
      await audit(db, ctx.user.id, "created", campaignId, { scheduleState: "draft", sendingEnabled: false });
      return { success: true as const, campaignId, scheduleState: "draft" as const, sendingEnabled: false as const };
    }),

  pause: protectedProcedure
    .input(z.object({ campaignId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      requireAdmin(ctx.user.role);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      await db.update(ierpEmailCampaigns).set({ scheduleState: "paused", sendingEnabled: false, updatedAt: new Date() }).where(eq(ierpEmailCampaigns.id, input.campaignId));
      await audit(db, ctx.user.id, "paused", input.campaignId, { sendingEnabled: false });
      return { success: true as const, scheduleState: "paused" as const, sendingEnabled: false as const };
    }),

  updateConsent: protectedProcedure
    .input(z.object({ optedIn: z.boolean(), source: z.string().trim().max(128).optional() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      const existing = await db.select({ id: ierpEmailPreferences.id }).from(ierpEmailPreferences).where(and(eq(ierpEmailPreferences.userId, ctx.user.id), eq(ierpEmailPreferences.programKey, "ierp"))).limit(1);
      const values = { consentStatus: input.optedIn ? "opted_in" as const : "opted_out" as const, consentSource: input.source ?? "account_settings", consentedAt: input.optedIn ? new Date() : null, updatedAt: new Date() };
      if (existing[0]) await db.update(ierpEmailPreferences).set(values).where(eq(ierpEmailPreferences.id, existing[0].id));
      else await db.insert(ierpEmailPreferences).values({ userId: ctx.user.id, programKey: "ierp", ...values });
      await audit(db, ctx.user.id, "consent_updated", null, { consentStatus: values.consentStatus, source: values.consentSource });
      return { success: true as const, consentStatus: values.consentStatus };
    }),

  suppressEmail: protectedProcedure
    .input(z.object({ email: z.string().trim().email().max(320), reason: z.enum(["unsubscribe", "hard_bounce", "manual"]) }))
    .mutation(async ({ ctx, input }) => {
      requireAdmin(ctx.user.role);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      const existing = await db.select({ id: ierpEmailSuppressions.id }).from(ierpEmailSuppressions).where(eq(ierpEmailSuppressions.email, input.email)).limit(1);
      if (existing[0]) {
        await db.update(ierpEmailSuppressions).set({ reason: input.reason, suppressedAt: new Date(), createdByUserId: ctx.user.id }).where(eq(ierpEmailSuppressions.id, existing[0].id));
      } else {
        await db.insert(ierpEmailSuppressions).values({ email: input.email, reason: input.reason, createdByUserId: ctx.user.id });
      }
      await audit(db, ctx.user.id, "suppressed", null, { email: input.email, reason: input.reason });
      return { success: true as const, suppressed: true as const };
    }),

  previewAudience: protectedProcedure
    .input(z.object({ campaignId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      requireAdmin(ctx.user.role);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      const [campaign] = await db.select().from(ierpEmailCampaigns).where(eq(ierpEmailCampaigns.id, input.campaignId)).limit(1);
      if (!campaign) throw new TRPCError({ code: "NOT_FOUND", message: "IERP campaign not found." });
      let filter: AudienceFilter = {};
      try { filter = audienceFilterSchema.parse(JSON.parse(campaign.audienceFilterJson)); } catch { throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Campaign audience filter is invalid." }); }
      const rows = await db.select({ userId: ierpProgramEnrollments.userId, name: users.name, email: users.email, designation: ierpProgramEnrollments.designation, phaseStatus: ierpProgramEnrollments.phaseStatus, lifecycleStatus: ierpProgramEnrollments.lifecycleStatus }).from(ierpProgramEnrollments).innerJoin(users, eq(users.id, ierpProgramEnrollments.userId)).where(eq(ierpProgramEnrollments.programKey, "ierp"));
      const userIds = rows.map((row) => row.userId);
      const preferences = userIds.length ? await db.select({ userId: ierpEmailPreferences.userId, consentStatus: ierpEmailPreferences.consentStatus }).from(ierpEmailPreferences).where(and(inArray(ierpEmailPreferences.userId, userIds), eq(ierpEmailPreferences.programKey, "ierp"))) : [];
      const emails = rows.map((row) => row.email).filter((email): email is string => !!email);
      const suppressions = emails.length ? await db.select({ email: ierpEmailSuppressions.email, reason: ierpEmailSuppressions.reason }).from(ierpEmailSuppressions).where(inArray(ierpEmailSuppressions.email, emails)) : [];
      const consentByUser = new Map(preferences.map((row) => [row.userId, row.consentStatus]));
      const suppressionByEmail = new Map(suppressions.map((row) => [row.email, row.reason]));
      const eligible: typeof rows = [];
      const excluded: Array<(typeof rows)[number] & { reasons: string[] }> = [];
      for (const row of rows) {
        const reasons: string[] = [];
        if (!row.email) reasons.push("missing_email");
        if (consentByUser.get(row.userId) !== "opted_in") reasons.push("no_ierp_consent");
        if (row.email && suppressionByEmail.has(row.email)) reasons.push(`suppressed:${suppressionByEmail.get(row.email)}`);
        if (filter.designation && row.designation !== filter.designation) reasons.push("designation_filter");
        if (filter.phaseStatus && row.phaseStatus !== filter.phaseStatus) reasons.push("phase_filter");
        if (filter.lifecycleStatus && row.lifecycleStatus !== filter.lifecycleStatus) reasons.push("lifecycle_filter");
        if (reasons.length) excluded.push({ ...row, reasons });
        else eligible.push(row);
      }
      await audit(db, ctx.user.id, "previewed", campaign.id, { eligibleCount: eligible.length, excludedCount: excluded.length });
      return { campaignId: campaign.id, scheduleState: campaign.scheduleState, sendingEnabled: false as const, filter, eligible, excluded, total: rows.length };
    }),

  requestSend: protectedProcedure
    .input(z.object({ campaignId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      requireAdmin(ctx.user.role);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      await audit(db, ctx.user.id, "send_blocked", input.campaignId, { reason: "promotional_sending_disabled", attemptedAt: new Date().toISOString() });
      return blockIerpPromotionalSend();
    }),

  recordAttribution: protectedProcedure
    .input(z.object({ campaignId: z.number().int().positive(), eventType: z.enum(["previewed", "clicked", "registered", "paid", "completed"]), attributionKey: z.string().trim().min(1).max(255) }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      const existing = await db.select({ id: ierpEmailAttributions.id }).from(ierpEmailAttributions).where(eq(ierpEmailAttributions.attributionKey, input.attributionKey)).limit(1);
      if (existing[0]) return { success: true as const, duplicate: true as const };
      await db.insert(ierpEmailAttributions).values({ campaignId: input.campaignId, userId: ctx.user.id, eventType: input.eventType, attributionKey: input.attributionKey });
      return { success: true as const, duplicate: false as const };
    }),

  listAudit: protectedProcedure.query(async ({ ctx }) => {
    requireAdmin(ctx.user.role);
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    return db.select().from(ierpEmailAuditLog).orderBy(desc(ierpEmailAuditLog.createdAt)).limit(200);
  }),
});
