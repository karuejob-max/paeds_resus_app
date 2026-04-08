/**
 * Database helper functions for enrollment system with M-Pesa, admin free access, and promo codes
 */

import { db } from "./db";
import { microCourses, microCourseEnrollments, promoCodes, users } from "@/drizzle/schema";
import { eq, and, isNull, or, lt } from "drizzle-orm";

/**
 * Validate a promo code and return discount information
 */
export async function validatePromoCode(code: string) {
  try {
    const promoCode = await db
      .select()
      .from(promoCodes)
      .where(eq(promoCodes.code, code.toUpperCase()))
      .limit(1);

    if (!promoCode || promoCode.length === 0) {
      return { valid: false, error: "Promo code not found" };
    }

    const promo = promoCode[0];

    // Check if expired
    if (promo.expiresAt && new Date(promo.expiresAt) < new Date()) {
      return { valid: false, error: "Promo code has expired" };
    }

    // Check if max uses reached
    if (promo.maxUses && promo.usesCount >= promo.maxUses) {
      return { valid: false, error: "Promo code has reached maximum uses" };
    }

    return {
      valid: true,
      id: promo.id,
      code: promo.code,
      discountPercent: promo.discountPercent,
      description: promo.description,
    };
  } catch (error) {
    console.error("[DB] Error validating promo code:", error);
    return { valid: false, error: "Error validating promo code" };
  }
}

/**
 * Get course details with pricing
 */
export async function getCourseDetails(courseId: string) {
  try {
    const course = await db
      .select()
      .from(microCourses)
      .where(eq(microCourses.courseId, courseId))
      .limit(1);

    if (!course || course.length === 0) {
      return null;
    }

    return course[0];
  } catch (error) {
    console.error("[DB] Error fetching course details:", error);
    return null;
  }
}

/**
 * Calculate final price after applying promo code discount
 */
export function calculateFinalPrice(
  originalPrice: number,
  discountPercent: number
): number {
  if (discountPercent === 0) return 0; // Free course
  if (discountPercent >= 100) return 0; // 100% discount = free
  const discount = (originalPrice * discountPercent) / 100;
  return Math.max(0, originalPrice - discount);
}

/**
 * Check if user is already enrolled in a course
 */
export async function isUserEnrolled(
  userId: number,
  microCourseId: number
): Promise<boolean> {
  try {
    const enrollment = await db
      .select()
      .from(microCourseEnrollments)
      .where(
        and(
          eq(microCourseEnrollments.userId, userId),
          eq(microCourseEnrollments.microCourseId, microCourseId)
        )
      )
      .limit(1);

    return enrollment.length > 0;
  } catch (error) {
    console.error("[DB] Error checking enrollment:", error);
    return false;
  }
}

/**
 * Create enrollment record
 */
export async function createEnrollment(data: {
  userId: number;
  microCourseId: number;
  paymentMethod: "m-pesa" | "admin-free" | "promo-code";
  paymentId?: number;
  promoCodeId?: number;
  amountPaid?: number;
  transactionId?: string;
}) {
  try {
    const result = await db.insert(microCourseEnrollments).values({
      userId: data.userId,
      microCourseId: data.microCourseId,
      paymentMethod: data.paymentMethod,
      paymentId: data.paymentId,
      promoCodeId: data.promoCodeId,
      amountPaid: data.amountPaid || 0,
      transactionId: data.transactionId,
      enrollmentStatus: "active",
      paymentStatus: data.paymentMethod === "m-pesa" ? "pending" : "completed",
    });

    return result;
  } catch (error) {
    console.error("[DB] Error creating enrollment:", error);
    throw error;
  }
}

/**
 * Increment promo code usage count
 */
export async function incrementPromoCodeUsage(promoCodeId: number) {
  try {
    await db
      .update(promoCodes)
      .set({
        usesCount: promoCodes.usesCount + 1,
      })
      .where(eq(promoCodes.id, promoCodeId));
  } catch (error) {
    console.error("[DB] Error incrementing promo code usage:", error);
  }
}

/**
 * Get user enrollments
 */
export async function getUserEnrollments(userId: number) {
  try {
    const enrollments = await db
      .select()
      .from(microCourseEnrollments)
      .where(eq(microCourseEnrollments.userId, userId));

    return enrollments;
  } catch (error) {
    console.error("[DB] Error fetching user enrollments:", error);
    return [];
  }
}

/**
 * Update enrollment status after M-Pesa payment confirmation
 */
export async function updateEnrollmentPaymentStatus(
  enrollmentId: number,
  status: "pending" | "completed" | "failed",
  transactionId?: string
) {
  try {
    await db
      .update(microCourseEnrollments)
      .set({
        paymentStatus: status,
        transactionId: transactionId,
        enrollmentStatus: status === "completed" ? "active" : "pending",
      })
      .where(eq(microCourseEnrollments.id, enrollmentId));
  } catch (error) {
    console.error("[DB] Error updating enrollment payment status:", error);
    throw error;
  }
}

/**
 * Check if user is admin
 */
export async function isUserAdmin(userId: number): Promise<boolean> {
  try {
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user || user.length === 0) return false;
    return user[0].role === "admin";
  } catch (error) {
    console.error("[DB] Error checking admin status:", error);
    return false;
  }
}
