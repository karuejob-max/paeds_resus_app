import { and, desc, eq, isNull, or } from "drizzle-orm";
import {
  institutionalStaffMembers,
  nerpCampaignSuppressions,
  nerpOfferEnrollments,
  nerpOfferExternalVerifications,
  professionalCredentials,
} from "../../drizzle/schema";
import { findCampaignSuppression, validEmail } from "./nerp-campaign-controls";
import { deriveNerpPromotionStatus, NERP_ACLS_OFFER_KEY } from "./nerp-offer";

export type NerpPromotionRecipient = {
  staffId: number;
  userId: number | null;
  name: string;
  email: string;
  department: string | null;
  excluded: boolean;
  suppressionId: number | null;
  promotionStatus: "eligible" | "suppressed" | "needs_review";
  suppressionReason: string | null;
  suppressionNote: string | null;
  sendable: boolean;
  offerStatus: string | null;
  phase2Verified: boolean;
  phase3Verified: boolean;
  hasVerifiedBlsAndAcls: boolean;
  suppressionOnly: boolean;
};

async function getOfferForUserForCampaign(db: any, userId: number) {
  const rows = await db
    .select()
    .from(nerpOfferEnrollments)
    .where(
      and(
        eq(nerpOfferEnrollments.userId, userId),
        eq(nerpOfferEnrollments.offerKey, NERP_ACLS_OFFER_KEY)
      )
    )
    .orderBy(desc(nerpOfferEnrollments.id))
    .limit(1);
  return rows[0] ?? null;
}

async function getVerificationStateForCampaign(db: any, offerId: number) {
  const rows = await db
    .select()
    .from(nerpOfferExternalVerifications)
    .where(eq(nerpOfferExternalVerifications.nerpOfferEnrollmentId, offerId));
  return {
    phase2: rows.find((row: any) => row.phase === "phase_2") ?? null,
    phase3: rows.find((row: any) => row.phase === "phase_3") ?? null,
  };
}

export async function loadNerpPromotionAudience(
  db: any,
  institutionId: number,
  limit: number
) {
  const staffRows = await db
    .select()
    .from(institutionalStaffMembers)
    .where(
      and(
        eq(institutionalStaffMembers.institutionalAccountId, institutionId),
        eq(institutionalStaffMembers.staffRole, "nurse"),
        isNull(institutionalStaffMembers.removedAt)
      )
    )
    .orderBy(institutionalStaffMembers.staffName)
    .limit(limit);

  const recipients: NerpPromotionRecipient[] = [];
  const suppressionRows = await db
    .select({
      id: nerpCampaignSuppressions.id,
      matchType: nerpCampaignSuppressions.matchType,
      matchValue: nerpCampaignSuppressions.matchValue,
      reasonCode: nerpCampaignSuppressions.reasonCode,
      note: nerpCampaignSuppressions.note,
    })
    .from(nerpCampaignSuppressions)
    .where(
      and(
        eq(nerpCampaignSuppressions.institutionalAccountId, institutionId),
        eq(nerpCampaignSuppressions.isActive, true)
      )
    );
  const matchedSuppressionIds = new Set<number>();

  for (const staff of staffRows) {
    const suppression = findCampaignSuppression(
      suppressionRows,
      staff.staffEmail,
      staff.staffName
    );
    const excluded = suppression !== null;
    if (suppression) matchedSuppressionIds.add(suppression.id);

    const offer = staff.userId
      ? await getOfferForUserForCampaign(db, staff.userId)
      : null;
    const verification = offer
      ? await getVerificationStateForCampaign(db, offer.id)
      : { phase2: null, phase3: null };
    const credentials = staff.userId
      ? await db
          .select({
            credentialType: professionalCredentials.credentialType,
            status: professionalCredentials.status,
          })
          .from(professionalCredentials)
          .where(
            and(
              eq(professionalCredentials.userId, staff.userId),
              or(
                eq(professionalCredentials.credentialType, "external_aha_bls"),
                eq(professionalCredentials.credentialType, "external_aha_acls")
              )
            )
          )
      : [];
    const hasVerifiedBlsAndAcls =
      credentials.some(
        (row: { credentialType: string; status: string }) =>
          row.credentialType === "external_aha_bls" && row.status === "verified"
      ) &&
      credentials.some(
        (row: { credentialType: string; status: string }) =>
          row.credentialType === "external_aha_acls" &&
          row.status === "verified"
      );
    const status = deriveNerpPromotionStatus({
      hasValidEmail: validEmail(staff.staffEmail),
      hasCompletedOffer: offer?.status === "completed",
      phase2Verified: verification.phase2?.status === "verified",
      phase3Verified: verification.phase3?.status === "verified",
      hasVerifiedBlsAndAcls,
      explicitlyExcluded: excluded,
    });
    recipients.push({
      staffId: staff.id,
      userId: staff.userId,
      name: staff.staffName,
      email: staff.staffEmail,
      department: staff.department,
      excluded,
      suppressionId: suppression?.id ?? null,
      promotionStatus: status.status,
      suppressionReason: suppression
        ? `manual_suppression:${suppression.reasonCode}`
        : status.reason,
      suppressionNote: suppression?.note ?? null,
      sendable: status.status === "eligible",
      offerStatus: offer?.status ?? null,
      phase2Verified: verification.phase2?.status === "verified",
      phase3Verified: verification.phase3?.status === "verified",
      hasVerifiedBlsAndAcls,
      suppressionOnly: false,
    });
  }

  for (const suppression of suppressionRows) {
    if (matchedSuppressionIds.has(suppression.id)) continue;
    recipients.push({
      staffId: -suppression.id,
      userId: null,
      name:
        suppression.matchType === "exact_name"
          ? suppression.matchValue
          : "Email-only suppression",
      email: suppression.matchType === "email" ? suppression.matchValue : "",
      department: null,
      excluded: true,
      suppressionId: suppression.id,
      promotionStatus: "suppressed",
      suppressionReason: `manual_suppression:${suppression.reasonCode}`,
      suppressionNote: suppression.note,
      sendable: false,
      offerStatus: null,
      phase2Verified: false,
      phase3Verified: false,
      hasVerifiedBlsAndAcls: false,
      suppressionOnly: true,
    });
  }

  return {
    institutionId,
    recipients,
    counts: {
      totalNurses: recipients.length,
      sendable: recipients.filter(row => row.sendable).length,
      suppressed: recipients.filter(row => row.promotionStatus === "suppressed")
        .length,
      needsReview: recipients.filter(
        row => row.promotionStatus === "needs_review"
      ).length,
      excludedByName: recipients.filter(
        row => row.excluded && !row.suppressionOnly
      ).length,
      suppressionOnly: recipients.filter(row => row.suppressionOnly).length,
    },
  };
}
