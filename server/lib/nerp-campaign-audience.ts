import { and, desc, eq, inArray, isNull, or } from "drizzle-orm";
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

  const userIds = [
    ...new Set(
      staffRows.flatMap((staff: any) =>
        typeof staff.userId === "number" ? [staff.userId] : []
      )
    ),
  ];

  const offerRows = userIds.length
    ? await db
        .select()
        .from(nerpOfferEnrollments)
        .where(
          and(
            inArray(nerpOfferEnrollments.userId, userIds),
            eq(nerpOfferEnrollments.offerKey, NERP_ACLS_OFFER_KEY)
          )
        )
        .orderBy(desc(nerpOfferEnrollments.id))
    : [];
  const offerByUserId = new Map<number, any>();
  for (const offer of offerRows) {
    if (!offerByUserId.has(offer.userId)) offerByUserId.set(offer.userId, offer);
  }

  const offerIds = offerRows.map((offer: any) => offer.id);
  const verificationRows = offerIds.length
    ? await db
        .select()
        .from(nerpOfferExternalVerifications)
        .where(inArray(nerpOfferExternalVerifications.nerpOfferEnrollmentId, offerIds))
    : [];
  const verificationByOfferId = new Map<
    number,
    { phase2: any | null; phase3: any | null }
  >();
  for (const verification of verificationRows) {
    const state = verificationByOfferId.get(
      verification.nerpOfferEnrollmentId
    ) ?? { phase2: null, phase3: null };
    if (verification.phase === "phase_2") state.phase2 = verification;
    if (verification.phase === "phase_3") state.phase3 = verification;
    verificationByOfferId.set(verification.nerpOfferEnrollmentId, state);
  }

  const credentialRows = userIds.length
    ? await db
        .select({
          userId: professionalCredentials.userId,
          credentialType: professionalCredentials.credentialType,
          status: professionalCredentials.status,
        })
        .from(professionalCredentials)
        .where(
          and(
            inArray(professionalCredentials.userId, userIds),
            or(
              eq(professionalCredentials.credentialType, "external_aha_bls"),
              eq(professionalCredentials.credentialType, "external_aha_acls")
            )
          )
        )
    : [];
  const credentialsByUserId = new Map<number, Array<{ credentialType: string; status: string }>>();
  for (const credential of credentialRows) {
    const rows = credentialsByUserId.get(credential.userId) ?? [];
    rows.push(credential);
    credentialsByUserId.set(credential.userId, rows);
  }

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
      ? offerByUserId.get(staff.userId) ?? null
      : null;
    const verification = offer
      ? verificationByOfferId.get(offer.id) ?? { phase2: null, phase3: null }
      : { phase2: null, phase3: null };
    const credentials = staff.userId
      ? credentialsByUserId.get(staff.userId) ?? []
      : [];
    const hasVerifiedBlsAndAcls =
      credentials.some(
        (row) =>
          row.credentialType === "external_aha_bls" && row.status === "verified"
      ) &&
      credentials.some(
        (row) =>
          row.credentialType === "external_aha_acls" && row.status === "verified"
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
