import { isNull } from "drizzle-orm";
import { servicePrices } from "../../drizzle/schema";
import type { getDb } from "../db";
import type { ServicePriceRow } from "../../shared/service-pricing";

type Db = NonNullable<Awaited<ReturnType<typeof getDb>>>;

/** All live price rows (cancelled offers are left out). A missing table (migration not run yet) means "use list prices". */
export async function loadPriceRows(db: Db): Promise<ServicePriceRow[]> {
  try {
    const rows = await db.select().from(servicePrices).where(isNull(servicePrices.cancelledAt));
    return rows.map((row) => ({
      id: row.id,
      programType: row.programType,
      kind: row.kind,
      priceKes: row.priceKes,
      label: row.label,
      startsAt: row.startsAt,
      endsAt: row.endsAt,
    }));
  } catch (error) {
    if (String((error as { message?: string })?.message ?? error).includes("servicePrices")) return [];
    throw error;
  }
}
