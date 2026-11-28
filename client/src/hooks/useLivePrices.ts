import { useCallback } from "react";
import { trpc } from "@/lib/trpc";

export type LivePrice = { price: number; standard: number; offerLabel: string | null; offerEndsAt: Date | null };

/** Current self-pay prices from the admin price list. Falls back to the built-in price while loading. */
export function useLivePrices() {
  const query = trpc.pricing.current.useQuery(undefined, { staleTime: 60_000, retry: 1 });
  const priceFor = useCallback(
    (courseId: string, fallback: number): LivePrice => {
      const row = query.data?.find((p) => p.programType === courseId);
      if (!row) return { price: fallback, standard: fallback, offerLabel: null, offerEndsAt: null };
      return {
        price: row.priceKes,
        standard: row.standardKes,
        offerLabel: row.offer ? row.offer.label ?? "Special offer" : null,
        offerEndsAt: row.offer?.endsAt ? new Date(row.offer.endsAt) : null,
      };
    },
    [query.data],
  );
  return { priceFor, isLoading: query.isLoading };
}
