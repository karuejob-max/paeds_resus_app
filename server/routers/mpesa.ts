import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { initiateStkPush, queryStk } from "../mpesa";
import { getDb } from "../db";
import { payments, enrollments } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";

export const mpesaRouter = router({
  /**
   * Initiate M-Pesa STK Push payment
   */
  initiatePayment: protectedProcedure
    .input(
      z.object({
        phoneNumber: z.string().min(9).max(13),
        amount: z.number().positive(),
        courseId: z.string(),
        courseName: z.string(),
        orderId: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const orderId = input.orderId || `ORDER-${Date.now()}`;

        // Initiate M-Pesa payment
        const mpesaResponse = await initiateStkPush({
          phoneNumber: input.phoneNumber,
          amount: input.amount,
          accountReference: `${ctx.user?.id || "GUEST"}`,
          transactionDesc: `Payment for ${input.courseName}`,
          orderId: orderId,
        });

        if (!mpesaResponse.success) {
          return {
            success: false,
            error: mpesaResponse.error || "Payment initiation failed",
          };
        }

        // Create enrollment record first
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        const enrollmentRecord = await db.insert(enrollments).values({
          userId: ctx.user?.id || 0,
          programType: input.courseId as any,
          trainingDate: new Date(),
          paymentStatus: "pending",
          amountPaid: 0,
        } as any);

        // Store payment record in database
        const paymentRecord = await db!.insert(payments).values({
          enrollmentId: (enrollmentRecord as any)[0]?.id || 0,
          userId: ctx.user?.id || 0,
          amount: input.amount,
          paymentMethod: "mpesa",
          transactionId: mpesaResponse.checkoutRequestID || "",
          status: "pending",
        } as any);

        return {
          success: true,
          checkoutRequestID: mpesaResponse.checkoutRequestID,
          customerMessage: mpesaResponse.customerMessage,
          orderId,
          paymentId: (paymentRecord as any)[0]?.id,
          enrollmentId: (enrollmentRecord as any)[0]?.id,
        };
      } catch (error: any) {
        console.error("Error initiating M-Pesa payment:", error);
        return {
          success: false,
          error: error.message || "Payment initiation failed",
        };
      }
    }),

  /**
   * Query payment status
   */
  queryPaymentStatus: protectedProcedure
    .input(
      z.object({
        checkoutRequestID: z.string(),
      })
    )
    .query(async ({ input }) => {
      try {
        const status = await queryStk(input.checkoutRequestID);
        return {
          success: true,
          status,
        };
      } catch (error: any) {
        console.error("Error querying payment status:", error);
        return {
          success: false,
          error: error.message || "Query failed",
        };
      }
    }),

  /**
   * Get payment history for user
   */
  getPaymentHistory: protectedProcedure.query(async ({ ctx }) => {
    try {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const userPayments = await db
        .select()
        .from(payments)
        .where(eq(payments.userId, ctx.user?.id || 0));

      return {
        success: true,
        payments: userPayments,
      };
    } catch (error: any) {
      console.error("Error fetching payment history:", error);
      return {
        success: false,
        error: error.message || "Failed to fetch payment history",
      };
    }
  }),

  /**
   * Get payment details
   */
  getPaymentDetails: protectedProcedure
    .input(z.object({ paymentId: z.string() }))
    .query(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        const payment = await db
          .select()
          .from(payments)
          .where(eq(payments.id, parseInt(input.paymentId)));

        if (!payment.length) {
          return {
            success: false,
            error: "Payment not found",
          };
        }

        // Verify ownership
        if (!payment.length || payment[0].userId !== (ctx.user?.id || 0)) {
          return {
            success: false,
            error: "Unauthorized",
          };
        }

        return {
          success: true,
          payment: payment[0],
        };
      } catch (error: any) {
        console.error("Error fetching payment details:", error);
        return {
          success: false,
          error: error.message || "Failed to fetch payment details",
        };
      }
    }),

  /**
   * Retry failed payment
   */
  retryPayment: protectedProcedure
    .input(
      z.object({
        paymentId: z.string(),
        phoneNumber: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        const payment = await db
          .select()
          .from(payments)
          .where(eq(payments.id, parseInt(input.paymentId)));

        if (!payment.length) {
          return {
            success: false,
            error: "Payment not found",
          };
        }

        const paymentRecord = payment[0];

        // Verify ownership
        if (paymentRecord.userId !== (ctx.user?.id || 0)) {
          return {
            success: false,
            error: "Unauthorized",
          };
        }

        // Only retry failed or pending payments
        if (!paymentRecord || !paymentRecord.status || !["failed", "pending"].includes(paymentRecord.status as string)) {
          return {
            success: false,
            error: "Payment cannot be retried",
          };
        }

        // Initiate new M-Pesa payment
        const mpesaResponse = await initiateStkPush({
          phoneNumber: input.phoneNumber,
          amount: paymentRecord.amount,
          accountReference: `${ctx.user?.id}`,
          transactionDesc: `Retry payment for course`,
          orderId: `ORDER-RETRY-${Date.now()}`,
        } as any);

        if (!mpesaResponse.success) {
          return {
            success: false,
            error: mpesaResponse.error || "Payment retry failed",
          };
        }

        // Update payment record
        await db!
          .update(payments)
          .set({
            status: "pending",
            transactionId: (mpesaResponse.checkoutRequestID as string) || "",
            updatedAt: new Date(),
          })
          .where(eq(payments.id, parseInt(input.paymentId)));

        return {
          success: true,
          checkoutRequestID: mpesaResponse.checkoutRequestID,
          customerMessage: mpesaResponse.customerMessage,
        };
      } catch (error: any) {
        console.error("Error retrying payment:", error);
        return {
          success: false,
          error: error.message || "Payment retry failed",
        };
      }
    }),

  /**
   * Get payment statistics (admin only)
   */
  getPaymentStats: protectedProcedure.query(async ({ ctx }) => {
    try {
      // Check if user is admin (skip for now, allow all)
      // if (ctx.user?.role !== "admin") {
      //   return {
      //     success: false,
      //     error: "Unauthorized",
      //   };
      // }

      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const allPayments: any[] = await db!.select().from(payments);

      const stats = {
        totalPayments: allPayments.length,
        totalRevenue: allPayments.reduce((sum: number, p: any) => sum + p.amount, 0),
        successfulPayments: allPayments.filter((p: any) => p.status === "completed")
          .length,
        pendingPayments: allPayments.filter((p: any) => p.status === "pending")
          .length,
        failedPayments: allPayments.filter((p: any) => p.status === "failed").length,
        averageTransactionValue:
          allPayments.length > 0
            ? allPayments.reduce((sum: number, p: any) => sum + p.amount, 0) /
              allPayments.length
            : 0,
      };

      return {
        success: true,
        stats,
      };
    } catch (error: any) {
      console.error("Error fetching payment stats:", error);
      return {
        success: false,
        error: error.message || "Failed to fetch payment stats",
      };
    }
  }),
});
