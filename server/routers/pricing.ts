import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { and, eq, isNull } from "drizzle-orm";
import { adminProcedure, publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { servicePrices } from "../../drizzle/schema";
import { AHA_PROGRAM_LABELS, AHA_PROGRAM_TYPES } from "../../shared/aha-pathways";
import { MAX_PRICE_KES, resolvePrice } from "../../shared/service-pricing";
import { loadPriceRows } from "../lib/service-pricing";

async function requireDb() {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed" });
  return db;
}

const programType = z.enum(AHA_PROGRAM_TYPES);
const price = z.number().int().min(100).max(MAX_PRICE_KES);

export const pricingRouter = router({
  /** What every programme costs right now, including any running offer. Public: the checkout pages need it. */
  current: publicProcedure.query(async () => {
    const db = await requireDb();
    const rows = await loadPriceRows(db);
    const now = new Date();
    return AHA_PROGRAM_TYPES.map((type) => resolvePrice(type, rows, now)!).map((p) => ({
      programType: p.programType,
      priceKes: p.priceKes,
      standardKes: p.standardKes,
      offer: p.offer ? { label: p.offer.label, endsAt: p.offer.endsAt } : null,
    }));
  }),

  /** Admin view: current price per programme plus every upcoming and running offer. */
  adminOverview: adminProcedure.query(async () => {
    const db = await requireDb();
    const rows = await loadPriceRows(db);
    const now = new Date();
    return {
      programmes: AHA_PROGRAM_TYPES.map((type) => ({ label: AHA_PROGRAM_LABELS[type], ...resolvePrice(type, rows, now)! })),
      offers: rows
        .filter((row) => row.kind === "offer" && (row.endsAt == null || row.endsAt.getTime() > now.getTime()))
        .map((row) => ({ ...row, running: row.startsAt.getTime() <= now.getTime() }))
        .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime()),
    };
  }),

  setStandard: adminProcedure.input(z.object({ programType, priceKes: price })).mutation(async ({ ctx, input }) => {
    const db = await requireDb();
    await db.insert(servicePrices).values({
      programType: input.programType,
      kind: "standard",
      priceKes: input.priceKes,
      startsAt: new Date(),
      createdByUserId: ctx.user.id,
    });
    return { ok: true };
  }),

  createOffer: adminProcedure
    .input(z.object({ programType, priceKes: price, label: z.string().trim().min(2).max(120), startsAt: z.coerce.date(), endsAt: z.coerce.date() }))
    .mutation(async ({ ctx, input }) => {
      if (input.endsAt.getTime() <= input.startsAt.getTime()) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "The offer must end after it starts." });
      }
      if (input.endsAt.getTime() <= Date.now()) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "The end date is already in the past." });
      }
      const db = await requireDb();
      await db.insert(servicePrices).values({
        programType: input.programType,
        kind: "offer",
        priceKes: input.priceKes,
        label: input.label,
        startsAt: input.startsAt,
        endsAt: input.endsAt,
        createdByUserId: ctx.user.id,
      });
      return { ok: true };
    }),

  /** Stops a running offer now, or cancels one that has not started. Learners who already paid keep their access. */
  endOffer: adminProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    const db = await requireDb();
    const [row] = await db
      .select()
      .from(servicePrices)
      .where(and(eq(servicePrices.id, input.id), eq(servicePrices.kind, "offer"), isNull(servicePrices.cancelledAt)))
      .limit(1);
    if (!row) throw new TRPCError({ code: "NOT_FOUND", message: "Offer not found." });
    const now = new Date();
    if (row.startsAt.getTime() > now.getTime()) {
      await db.update(servicePrices).set({ cancelledAt: now, endedByUserId: ctx.user.id }).where(eq(servicePrices.id, row.id));
    } else {
      await db.update(servicePrices).set({ endsAt: now, endedByUserId: ctx.user.id }).where(eq(servicePrices.id, row.id));
    }
    return { ok: true };
  }),
});
