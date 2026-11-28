import { INDEPENDENT_AHA_PRICES_KES, isAhaProgramType, type AhaProgramType } from "./aha-pathways";

/** One row of the admin-managed price list. Dates are plain Date values (UTC instants). */
export type ServicePriceRow = {
  id?: number;
  programType: string;
  kind: "standard" | "offer";
  priceKes: number;
  label: string | null;
  startsAt: Date;
  endsAt: Date | null;
};

export type ResolvedPrice = {
  programType: string;
  priceKes: number;
  /** The normal price, shown struck through while an offer is running. */
  standardKes: number;
  offer: { label: string | null; endsAt: Date | null } | null;
};

const covers = (row: ServicePriceRow, at: Date) =>
  row.startsAt.getTime() <= at.getTime() && (row.endsAt == null || row.endsAt.getTime() > at.getTime());

/**
 * The price a learner pays for a programme at a given moment.
 * A running offer wins (the most recently started one if several overlap); otherwise the latest
 * standard price set on or before that moment; otherwise the built-in default list price.
 */
export function resolvePrice(programType: string, rows: ServicePriceRow[], at: Date = new Date()): ResolvedPrice | null {
  if (!isAhaProgramType(programType)) return null;
  const mine = rows.filter((row) => row.programType === programType);
  const latest = (list: ServicePriceRow[]) => [...list].sort((a, b) => b.startsAt.getTime() - a.startsAt.getTime())[0];
  const standardRow = latest(mine.filter((row) => row.kind === "standard" && row.startsAt.getTime() <= at.getTime()));
  const standardKes = standardRow?.priceKes ?? INDEPENDENT_AHA_PRICES_KES[programType as AhaProgramType];
  const offerRow = latest(mine.filter((row) => row.kind === "offer" && covers(row, at)));
  if (offerRow) {
    return { programType, priceKes: offerRow.priceKes, standardKes, offer: { label: offerRow.label, endsAt: offerRow.endsAt } };
  }
  return { programType, priceKes: standardKes, standardKes, offer: null };
}

/**
 * What an enrolment had to pay: the price in force when the learner first paid. A learner who paid the
 * offer price during the offer keeps their access after the offer ends. With no payment yet, today's price.
 */
export function requiredKesForPayments(
  programType: string,
  rows: ServicePriceRow[],
  completedPayments: Array<{ createdAt?: Date | null }>,
  now: Date = new Date(),
): number | null {
  const times = completedPayments.map((p) => p.createdAt?.getTime()).filter((t): t is number => typeof t === "number");
  const at = times.length ? new Date(Math.min(...times)) : now;
  return resolvePrice(programType, rows, at)?.priceKes ?? null;
}

export const MAX_PRICE_KES = 1_000_000;
