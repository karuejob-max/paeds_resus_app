import { and, eq, isNull } from "drizzle-orm";
import {
  careFacilities,
  inAppNotifications,
  institutionalAccounts,
  institutionalActionLogs,
} from "../../drizzle/schema";
import type { DbClient } from "../db";

export function summarizeCareSignalGaps(systemGaps: string[], eventType: string): string {
  const gaps = systemGaps.filter(Boolean);
  if (gaps.length === 0) {
    return `Care Signal (${eventType}) — review for QI follow-up`;
  }
  const preview = gaps.slice(0, 4).join("; ");
  return gaps.length > 4 ? `${preview}; +${gaps.length - 4} more` : preview;
}

export type CareSignalInstitutionalFollowUpResult = {
  skipped?: string;
  institutionalAccountId?: number;
  actionLogId?: number;
  notifiedUserId?: number;
};

/**
 * When a provider submits Care Signal at a facility linked to an institution,
 * create a draft action log entry and notify the hospital admin to document system change.
 */
export async function handleCareSignalInstitutionalFollowUp(
  db: DbClient,
  params: {
    careSignalEventId: number;
    facilityId: number | null;
    systemGaps: string[];
    eventType: string;
    facilityName?: string;
  }
): Promise<CareSignalInstitutionalFollowUpResult> {
  const { careSignalEventId, facilityId, systemGaps, eventType, facilityName } = params;

  if (!facilityId) {
    return { skipped: "no_facility" };
  }

  const [facility] = await db
    .select({
      institutionalAccountId: careFacilities.institutionalAccountId,
      name: careFacilities.name,
    })
    .from(careFacilities)
    .where(and(eq(careFacilities.id, facilityId), isNull(careFacilities.mergedIntoId)))
    .limit(1);

  const institutionId = facility?.institutionalAccountId;
  if (!institutionId) {
    return { skipped: "facility_not_linked_to_institution" };
  }

  const [existingLog] = await db
    .select({ id: institutionalActionLogs.id })
    .from(institutionalActionLogs)
    .where(
      and(
        eq(institutionalActionLogs.careSignalEventId, careSignalEventId),
        eq(institutionalActionLogs.institutionalAccountId, institutionId)
      )
    )
    .limit(1);

  if (existingLog) {
    return { skipped: "action_log_exists", institutionalAccountId: institutionId };
  }

  const gapSummary = summarizeCareSignalGaps(systemGaps, eventType);
  const displayFacility = facilityName?.trim() || facility?.name || "your facility";

  const insertResult = await db.insert(institutionalActionLogs).values({
    institutionalAccountId: institutionId,
    createdByUserId: null,
    gapIdentified: gapSummary,
    systemChange:
      "Pending — hospital admin to document the system change committed after reviewing this Care Signal report.",
    status: "open",
    careSignalEventId,
    notes: `Auto-created from Care Signal #${careSignalEventId} at ${displayFacility}.`,
  });

  const actionLogId = Number((insertResult as unknown as { insertId: number }).insertId);

  const [institution] = await db
    .select({ userId: institutionalAccounts.userId, companyName: institutionalAccounts.companyName })
    .from(institutionalAccounts)
    .where(eq(institutionalAccounts.id, institutionId))
    .limit(1);

  let notifiedUserId: number | undefined;
  if (institution?.userId) {
    await db.insert(inAppNotifications).values({
      userId: institution.userId,
      type: "care_signal_action_prompt",
      title: "New Care Signal — action needed",
      body: `A provider submitted a Care Signal report at ${displayFacility}. Review the gap and document your hospital's system change in the Action Log tab.`,
      actionUrl: "/hospital-admin-dashboard?tab=action-log",
      relatedId: actionLogId,
      read: false,
    });
    notifiedUserId = institution.userId;
  }

  return { institutionalAccountId: institutionId, actionLogId, notifiedUserId };
}
