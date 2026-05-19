/**
 * Fellowship pillar link: completing a micro-course extends ResusGPS access by 30 days (stackable).
 * `resusGpsAccessExpiresAt` null = legacy / unrestricted unless RESUSGPS_STRICT_FELLOWSHIP_WINDOW=true.
 */

import { eq } from "drizzle-orm";
import { getDb } from "../db";
import { users } from "../../drizzle/schema";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

function strictFellowshipWindow(): boolean {
  return process.env.RESUSGPS_STRICT_FELLOWSHIP_WINDOW === "true" || process.env.RESUSGPS_STRICT_FELLOWSHIP_WINDOW === "1";
}

export type ResusGpsClientAccess = {
  canUse: boolean;
  mode: "legacy_open" | "active" | "expired" | "strict_blocked";
  expiresAt: string | null;
  daysRemaining: number | null;
  headline: string;
  detail: string;
};

export async function getResusGpsAccessForClient(userId: number): Promise<ResusGpsClientAccess> {
  const database = await getDb();
  if (!database) {
    return {
      canUse: true,
      mode: "legacy_open",
      expiresAt: null,
      daysRemaining: null,
      headline: "ResusGPS",
      detail: "Unable to verify access window — not blocking use.",
    };
  }
  const row = await database
    .select({ exp: users.resusGpsAccessExpiresAt })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  const exp = row[0]?.exp ?? null;

  if (exp == null) {
    if (strictFellowshipWindow()) {
      return {
        canUse: false,
        mode: "strict_blocked",
        expiresAt: null,
        daysRemaining: null,
        headline: "ResusGPS requires an active access window",
        detail:
          "Complete a fellowship micro-course to unlock 30 days of ResusGPS. Each completed course extends your window.",
      };
    }
    return {
      canUse: true,
      mode: "legacy_open",
      expiresAt: null,
      daysRemaining: null,
      headline: "ResusGPS",
      detail: "Complete fellowship micro-courses to earn 30-day access extensions (recommended).",
    };
  }

  const expMs = new Date(exp).getTime();
  if (expMs > Date.now()) {
    const daysRemaining = Math.max(0, Math.ceil((expMs - Date.now()) / DAY_MS));
    return {
      canUse: true,
      mode: "active",
      expiresAt: new Date(exp).toISOString(),
      daysRemaining,
      headline: "ResusGPS access active",
      detail: `Your fellowship-linked access is valid for about ${daysRemaining} more day(s). Complete another micro-course to extend it by 30 days.`,
    };
  }

  return {
    canUse: false,
    mode: "expired",
    expiresAt: new Date(exp).toISOString(),
    daysRemaining: 0,
    headline: "ResusGPS access paused",
    detail:
      "Your 30-day window has ended. Complete another fellowship micro-course to restore ResusGPS access.",
  };
}

export async function extendResusGpsAccessAfterMicroCourseCompletion(userId: number): Promise<void> {
  const database = await getDb();
  if (!database) return;
  const row = await database
    .select({ exp: users.resusGpsAccessExpiresAt })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  const existing = row[0]?.exp;
  const existingMs = existing ? new Date(existing).getTime() : 0;
  const baseline = Math.max(Date.now(), existingMs);
  const next = new Date(baseline + THIRTY_DAYS_MS);
  await database
    .update(users)
    .set({ resusGpsAccessExpiresAt: next, updatedAt: new Date() })
    .where(eq(users.id, userId));
}
