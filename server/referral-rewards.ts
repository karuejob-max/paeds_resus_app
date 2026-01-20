import { getDb } from "./db";
import { users, referrals, payments, enrollments } from "../drizzle/schema";
import { eq, and, gte, sql } from "drizzle-orm";

/**
 * Referral Reward Tiers
 * Determines reward amount based on number of successful referrals
 */
export const REFERRAL_TIERS = {
  bronze: { minReferrals: 1, maxReferrals: 5, rewardPerReferral: 7000 },
  silver: { minReferrals: 6, maxReferrals: 15, rewardPerReferral: 10000 },
  gold: { minReferrals: 16, maxReferrals: 30, rewardPerReferral: 15000 },
  platinum: { minReferrals: 31, maxReferrals: Infinity, rewardPerReferral: 20000 },
};

/**
 * Calculate referral tier based on successful referrals
 */
export function getReferralTier(referralCount: number): keyof typeof REFERRAL_TIERS {
  if (referralCount >= REFERRAL_TIERS.platinum.minReferrals) return "platinum";
  if (referralCount >= REFERRAL_TIERS.gold.minReferrals) return "gold";
  if (referralCount >= REFERRAL_TIERS.silver.minReferrals) return "silver";
  return "bronze";
}

/**
 * Calculate total referral earnings
 */
export function calculateReferralEarnings(referralCount: number): number {
  let totalEarnings = 0;

  // Bronze tier (1-5 referrals)
  const bronzeCount = Math.min(referralCount, REFERRAL_TIERS.bronze.maxReferrals);
  totalEarnings += bronzeCount * REFERRAL_TIERS.bronze.rewardPerReferral;

  if (referralCount > REFERRAL_TIERS.bronze.maxReferrals) {
    // Silver tier (6-15 referrals)
    const silverCount = Math.min(
      referralCount - REFERRAL_TIERS.bronze.maxReferrals,
      REFERRAL_TIERS.silver.maxReferrals - REFERRAL_TIERS.silver.minReferrals + 1
    );
    totalEarnings += silverCount * REFERRAL_TIERS.silver.rewardPerReferral;
  }

  if (referralCount > REFERRAL_TIERS.silver.maxReferrals) {
    // Gold tier (16-30 referrals)
    const goldCount = Math.min(
      referralCount - REFERRAL_TIERS.silver.maxReferrals,
      REFERRAL_TIERS.gold.maxReferrals - REFERRAL_TIERS.gold.minReferrals + 1
    );
    totalEarnings += goldCount * REFERRAL_TIERS.gold.rewardPerReferral;
  }

  if (referralCount > REFERRAL_TIERS.gold.maxReferrals) {
    // Platinum tier (31+ referrals)
    const platinumCount = referralCount - REFERRAL_TIERS.gold.maxReferrals;
    totalEarnings += platinumCount * REFERRAL_TIERS.platinum.rewardPerReferral;
  }

  return totalEarnings;
}

/**
 * Process referral reward for a single referral
 */
export async function processReferralReward(referrerId: string, referralId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  try {
    // Get referrer
    const referrerRecords = await db.select().from(users).where(eq(users.id, parseInt(referrerId)));
    if (referrerRecords.length === 0) throw new Error("Referrer not found");

    // Get referred user
    const referredRecords = await db.select().from(users).where(eq(users.id, parseInt(referralId)));
    if (referredRecords.length === 0) throw new Error("Referred user not found");

    // Check if referred user has completed payment
    const enrollmentRecords = await db
      .select()
      .from(enrollments)
      .where(and(eq(enrollments.userId, parseInt(referralId)), eq(enrollments.paymentStatus, "completed")));

    if (enrollmentRecords.length === 0) {
      throw new Error("Referred user has not completed payment");
    }

    // Get current referral count
    const referralRecords = await db
      .select()
      .from(referrals)
      .where(and(eq(referrals.referrerId, parseInt(referrerId)), eq(referrals.status, "completed")));

    const currentCount = referralRecords.length;
    const tier = getReferralTier(currentCount + 1);
    const rewardAmount = REFERRAL_TIERS[tier].rewardPerReferral;

    // Create payment record for reward
    const rewardPayment = await db.insert(payments).values({
      enrollmentId: enrollmentRecords[0].id,
      userId: parseInt(referrerId),
      amount: rewardAmount,
      status: "completed",
      paymentMethod: "mpesa",
      transactionId: `REF-${referrerId}-${Date.now()}`,
    });

    // Update referral status
    const referralUpdateRecords = await db
      .select()
      .from(referrals)
      .where(and(eq(referrals.referrerId, parseInt(referrerId)), eq(referrals.referredUserId, parseInt(referralId))));

    if (referralUpdateRecords.length > 0) {
      await db
        .update(referrals)
        .set({
          status: "completed",
          rewardAmount: rewardAmount,
          rewardProcessedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(referrals.id, referralUpdateRecords[0].id));
    }

    console.log(`Referral reward processed: ${rewardAmount} KES for ${referrerId}`);
    return { success: true, rewardAmount, tier };
  } catch (error: any) {
    console.error("Error processing referral reward:", error);
    throw error;
  }
}

/**
 * Batch process all pending referral rewards
 */
export async function processPendingReferralRewards() {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  try {
    // Get all pending referrals
    const pendingReferrals = await db
      .select()
      .from(referrals)
      .where(eq(referrals.status, "pending"));

    let processedCount = 0;
    let failedCount = 0;

    for (const referral of pendingReferrals) {
      try {
        await processReferralReward(referral.referrerId.toString(), referral.referredUserId.toString());
        processedCount++;
      } catch (error) {
        console.error(`Failed to process referral ${referral.id}:`, error);
        failedCount++;
      }
    }

    console.log(`Referral rewards batch: ${processedCount} processed, ${failedCount} failed`);
    return { processedCount, failedCount };
  } catch (error: any) {
    console.error("Error in batch referral processing:", error);
    throw error;
  }
}

/**
 * Get referral stats for a user
 */
export async function getReferralStats(userId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  try {
    // Get all referrals
    const allReferrals = await db
      .select()
      .from(referrals)
      .where(eq(referrals.referrerId, parseInt(userId)));

    const completedReferrals = allReferrals.filter((r) => r.status === "completed");
    const pendingReferrals = allReferrals.filter((r) => r.status === "pending");

    const totalEarnings = completedReferrals.reduce((sum, r) => sum + (r.rewardAmount || 0), 0);
    const tier = getReferralTier(completedReferrals.length);
    const nextTierThreshold = Object.values(REFERRAL_TIERS).find((t) => t.minReferrals > completedReferrals.length)
      ?.minReferrals || Infinity;

    return {
      totalReferrals: allReferrals.length,
      completedReferrals: completedReferrals.length,
      pendingReferrals: pendingReferrals.length,
      totalEarnings,
      currentTier: tier,
      nextTierThreshold,
      referralsUntilNextTier: Math.max(0, nextTierThreshold - completedReferrals.length),
    };
  } catch (error: any) {
    console.error("Error getting referral stats:", error);
    throw error;
  }
}

/**
 * Send M-Pesa payout to referrer
 */
export async function sendReferralPayout(userId: string, amount: number) {
  try {
    // Get user phone number
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");

    const userRecords = await db.select().from(users).where(eq(users.id, parseInt(userId)));
    if (userRecords.length === 0) throw new Error("User not found");

    const user = userRecords[0];
    if (!user.phone) throw new Error("User phone number not found");

    // Call M-Pesa B2C API to send payout
    // This would integrate with your M-Pesa service
    console.log(`Sending M-Pesa payout: ${amount} KES to ${user.phone}`);

    // Update payment status
    const paymentRecords = await db
      .select()
      .from(payments)
      .where(
        and(
          eq(payments.userId, parseInt(userId)),
          eq(payments.status, "pending")
        )
      );
      
    // Filter for referral rewards by transaction ID pattern
    const referralPayments = paymentRecords.filter((p) => p.transactionId?.startsWith("REF-"));

    if (referralPayments.length > 0) {
      await db
        .update(payments)
        .set({
          status: "completed",
          updatedAt: new Date(),
        })
        .where(eq(payments.id, referralPayments[0].id));
    }

    return { success: true, amount, phoneNumber: user.phone };
  } catch (error: any) {
    console.error("Error sending referral payout:", error);
    throw error;
  }
}
