/**
 * HI-CERT-1: Scheduled certificate renewal reminder emails (deduped via certificates.renewalReminderSentAt).
 */
import { and, eq, gte, inArray, isNotNull, isNull, lte } from "drizzle-orm";
import { getDb } from "./db";
import { certificates, users } from "../drizzle/schema";
import { sendEmail } from "./email-service";

function expiryWindowBounds() {
  const now = Date.now();
  const msDay = 86400000;
  return {
    lower: new Date(now + 14 * msDay),
    upper: new Date(now + 90 * msDay),
  };
}

/**
 * One email per user per run for all eligible certs; marks renewalReminderSentAt on those rows.
 */
export async function runScheduledCertificateRenewalReminders(): Promise<{
  usersNotified: number;
  certsMarked: number;
  skipped: string;
}> {
  const db = await getDb();
  if (!db) {
    return { usersNotified: 0, certsMarked: 0, skipped: "no_database" };
  }

  const { lower, upper } = expiryWindowBounds();

  const rows = await db
    .select({
      certId: certificates.id,
      userId: certificates.userId,
      programType: certificates.programType,
      expiryDate: certificates.expiryDate,
      email: users.email,
      name: users.name,
    })
    .from(certificates)
    .innerJoin(users, eq(certificates.userId, users.id))
    .where(
      and(
        isNotNull(certificates.expiryDate),
        isNull(certificates.renewalReminderSentAt),
        gte(certificates.expiryDate, lower),
        lte(certificates.expiryDate, upper),
        isNotNull(users.email)
      )
    );

  if (rows.length === 0) {
    return { usersNotified: 0, certsMarked: 0, skipped: "none_due" };
  }

  type Row = (typeof rows)[number];
  const byUser = new Map<number, { email: string; name: string | null; certs: Row[] }>();
  for (const r of rows) {
    const email = r.email!.trim();
    if (!email) continue;
    const existing = byUser.get(r.userId);
    if (existing) {
      existing.certs.push(r);
    } else {
      byUser.set(r.userId, { email, name: r.name, certs: [r] });
    }
  }

  let usersNotified = 0;
  let certsMarked = 0;
  const base = process.env.APP_BASE_URL?.replace(/\/$/, "") || "https://app.paedsresus.com";
  const renewLink = `${base}/enroll`;

  for (const [, bundle] of Array.from(byUser.entries())) {
    const programSummary = bundle.certs
      .map((c: Row) => {
        const label = (c.programType || "course").toUpperCase();
        const exp = c.expiryDate ? new Date(c.expiryDate).toLocaleDateString() : "—";
        return `${label} - expires ${exp}`;
      })
      .join("\n");

    const result = await sendEmail(bundle.email, "certificateRenewalReminder", {
      userName: bundle.name?.trim() || "there",
      programSummary,
      renewLink,
    });

    if (!result.success) {
      console.warn(
        `[Scheduler] certificate renewal email failed for ${bundle.email}:`,
        result.error
      );
      continue;
    }

    const ids = bundle.certs.map((c: Row) => c.certId);
    const sentAt = new Date();
    await db
      .update(certificates)
      .set({ renewalReminderSentAt: sentAt })
      .where(inArray(certificates.id, ids));

    usersNotified += 1;
    certsMarked += ids.length;
  }

  return { usersNotified, certsMarked, skipped: "ok" };
}
