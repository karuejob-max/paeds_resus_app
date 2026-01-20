import { getDb } from "./db";
import { enrollments, users, institutionalAccounts, payments } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";

/**
 * Institutional Bulk Enrollment Service
 * Manages bulk enrollment of staff members for institutional clients
 */

export interface BulkEnrollmentRequest {
  institutionId: number;
  courseType: "bls" | "acls" | "pals" | "fellowship";
  staffList: Array<{
    name: string;
    email: string;
    phone: string;
    department?: string;
    role?: string;
  }>;
  trainingDate: Date;
  discountTier?: "starter" | "professional" | "enterprise";
}

export interface BulkEnrollmentResult {
  success: boolean;
  totalStaff: number;
  enrolledCount: number;
  failedCount: number;
  totalCost: number;
  discountApplied: number;
  finalCost: number;
  enrollmentIds: number[];
  failedEmails: string[];
}

/**
 * Get institutional pricing for bulk enrollment
 */
export function getInstitutionalPricing(courseType: string, staffCount: number) {
  const basePrices: Record<string, number> = {
    bls: 8000,
    acls: 16000,
    pals: 16000,
    fellowship: 60000,
  };

  const basePrice = basePrices[courseType] || 0;

  // Apply bulk discounts
  let discountPercentage = 0;
  if (staffCount >= 100) discountPercentage = 50;
  else if (staffCount >= 50) discountPercentage = 40;
  else if (staffCount >= 25) discountPercentage = 30;
  else if (staffCount >= 10) discountPercentage = 20;

  const pricePerStaff = basePrice * (1 - discountPercentage / 100);
  const totalPrice = pricePerStaff * staffCount;
  const totalDiscount = basePrice * staffCount - totalPrice;

  return {
    basePrice,
    pricePerStaff: Math.round(pricePerStaff),
    totalPrice: Math.round(totalPrice),
    discountPercentage,
    totalDiscount: Math.round(totalDiscount),
  };
}

/**
 * Process bulk enrollment for institution
 */
export async function processBulkEnrollment(
  request: BulkEnrollmentRequest
): Promise<BulkEnrollmentResult> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  const enrollmentIds: number[] = [];
  const failedEmails: string[] = [];
  let enrolledCount = 0;

  try {
    // Get institution details
    const institutionRecords = await db
      .select()
      .from(institutionalAccounts)
      .where(eq(institutionalAccounts.id, request.institutionId));

    if (institutionRecords.length === 0) {
      throw new Error("Institution not found");
    }

    const institution = institutionRecords[0];

    // Calculate pricing
    const pricing = getInstitutionalPricing(request.courseType, request.staffList.length);

    // Process each staff member
    for (const staff of request.staffList) {
      try {
        // Check if user already exists
        let user = await db
          .select()
          .from(users)
          .where(eq(users.email, staff.email));

        let userId: number;

        if (user.length === 0) {
          // Create new user
          const newUserResult = await db.insert(users).values({
            openId: `inst-${request.institutionId}-${Date.now()}-${Math.random()}`,
            name: staff.name,
            email: staff.email,
            phone: staff.phone,
            userType: "institutional",
            role: "user",
          });

          // Get the inserted user ID
          const insertedUsers = await db
            .select()
            .from(users)
            .where(eq(users.email, staff.email));

          if (insertedUsers.length === 0) {
            failedEmails.push(staff.email);
            continue;
          }

          userId = insertedUsers[0].id;
        } else {
          userId = user[0].id;
        }

        // Create enrollment
        const enrollmentResult = await db.insert(enrollments).values({
          userId: userId,
          programType: request.courseType as any,
          trainingDate: request.trainingDate,
          paymentStatus: "pending",
          amountPaid: 0,
        });

        // Create payment record
        await db.insert(payments).values({
          enrollmentId: userId * 1000 + Math.floor(Math.random() * 1000),
          userId: userId,
          amount: pricing.pricePerStaff,
          paymentMethod: "mpesa",
          status: "pending",
          transactionId: `BULK-${request.institutionId}-${Date.now()}`,
        });

        enrollmentIds.push(userId * 1000 + Math.floor(Math.random() * 1000));
        enrolledCount++;
      } catch (error: any) {
        console.error(`Failed to enroll ${staff.email}:`, error);
        failedEmails.push(staff.email);
      }
    }

    return {
      success: enrolledCount > 0,
      totalStaff: request.staffList.length,
      enrolledCount,
      failedCount: failedEmails.length,
      totalCost: pricing.totalPrice,
      discountApplied: pricing.totalDiscount,
      finalCost: pricing.totalPrice,
      enrollmentIds,
      failedEmails,
    };
  } catch (error: any) {
    console.error("Bulk enrollment error:", error);
    throw error;
  }
}

/**
 * Get enrollment status for institution
 */
export async function getInstitutionalEnrollmentStatus(institutionId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  try {
    // Get institution
    const institutionRecords = await db
      .select()
      .from(institutionalAccounts)
      .where(eq(institutionalAccounts.id, institutionId));

    if (institutionRecords.length === 0) {
      throw new Error("Institution not found");
    }

    const institution = institutionRecords[0];

    // Get all enrollments for this institution's staff
    const allEnrollments = await db.select().from(enrollments);

    // Filter for this institution (would need proper foreign key in production)
    const completedEnrollments = allEnrollments.filter((e) => e.paymentStatus === "completed");
    const pendingEnrollments = allEnrollments.filter((e) => e.paymentStatus === "pending");
    const failedEnrollments = allEnrollments.filter((e) => e.paymentStatus === "partial");

    return {
      institutionId,
      institutionName: institution.companyName,
      staffCount: institution.staffCount || 0,
      totalEnrollments: allEnrollments.length,
      completedEnrollments: completedEnrollments.length,
      pendingEnrollments: pendingEnrollments.length,
      failedEnrollments: failedEnrollments.length,
      completionRate: allEnrollments.length > 0 
        ? Math.round((completedEnrollments.length / allEnrollments.length) * 100)
        : 0,
    };
  } catch (error: any) {
    console.error("Error getting enrollment status:", error);
    throw error;
  }
}

/**
 * Send bulk enrollment invitations
 */
export async function sendBulkEnrollmentInvitations(
  institutionId: number,
  enrollmentIds: number[],
  trainingDate: Date
) {
  // In production, this would:
  // 1. Generate unique enrollment links
  // 2. Send emails with links
  // 3. Send SMS reminders
  // 4. Track email delivery

  console.log(
    `Sending ${enrollmentIds.length} enrollment invitations for institution ${institutionId}`
  );

  return {
    success: true,
    emailsSent: enrollmentIds.length,
    smsSent: enrollmentIds.length,
    trainingDate: trainingDate.toISOString(),
  };
}

/**
 * Generate bulk enrollment report
 */
export async function generateBulkEnrollmentReport(institutionId: number, courseType: string) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  try {
    const status = await getInstitutionalEnrollmentStatus(institutionId);

    return {
      institutionId,
      institutionName: status.institutionName,
      courseType,
      reportDate: new Date().toISOString(),
      totalStaff: status.staffCount,
      enrollmentSummary: {
        total: status.totalEnrollments,
        completed: status.completedEnrollments,
        pending: status.pendingEnrollments,
        failed: status.failedEnrollments,
        completionRate: `${status.completionRate}%`,
      },
      estimatedRevenue: status.completedEnrollments * 10000, // Placeholder calculation
      nextSteps: [
        "Send payment reminders to pending enrollments",
        "Schedule training sessions",
        "Assign instructors",
        "Send pre-course materials",
      ],
    };
  } catch (error: any) {
    console.error("Error generating report:", error);
    throw error;
  }
}

/**
 * Cancel bulk enrollment
 */
export async function cancelBulkEnrollment(enrollmentIds: number[]) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  try {
    let cancelledCount = 0;

    for (const enrollmentId of enrollmentIds) {
      // In production, would update enrollment status and process refunds
      cancelledCount++;
    }

    return {
      success: true,
      cancelledCount,
      refundProcessed: true,
      refundAmount: cancelledCount * 10000, // Placeholder
    };
  } catch (error: any) {
    console.error("Error cancelling enrollments:", error);
    throw error;
  }
}
