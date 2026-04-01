import { z } from "zod";
import { publicProcedure, protectedProcedure, adminProcedure, router } from "../_core/trpc";
import { initiateStkPush, queryStk } from "../mpesa";
import { getDb } from "../db";
import { payments, enrollments } from "../../drizzle/schema";
import { eq, and, desc, lt } from "drizzle-orm";
import { reconcilePaymentRowByStkQuery } from "../mpesa-reconciliation";
import { getMpesaDeploymentMode, getMpesaEnvironmentSource } from "../lib/mpesa-env";
import { defaultStkCallbackUrl } from "../lib/mpesa-callback-path";
import { buildStkAccountReference } from "../lib/daraja-account-reference";
import { trackEvent, trackPaymentInitiation } from "../services/analytics.service";

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
        enrollmentId: z.number().optional(), // when coming from Enroll page: use existing enrollment, only create payment
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const orderId = input.orderId || `ORDER-${Date.now()}`;
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        let enrollmentId: number;

        if (input.enrollmentId) {
          const existing = await db.select().from(enrollments).where(and(eq(enrollments.id, input.enrollmentId), eq(enrollments.userId, ctx.user!.id))).limit(1);
          if (!existing.length) {
            return { success: false, error: "Enrollment not found or access denied." };
          }
          enrollmentId = existing[0].id;
        } else {
          const enrollmentRecord = await db.insert(enrollments).values({
            userId: ctx.user?.id || 0,
            programType: input.courseId as any,
            trainingDate: new Date(),
            paymentStatus: "pending",
            amountPaid: 0,
          } as any);
          enrollmentId = (enrollmentRecord as any)[0]?.id ?? 0;
          if (!enrollmentId) {
            const list = await db.select().from(enrollments).where(eq(enrollments.userId, ctx.user!.id)).orderBy(desc(enrollments.id)).limit(1);
            enrollmentId = list[0]?.id ?? 0;
          }
          await trackEvent({
            userId: ctx.user!.id,
            eventType: "course_enrollment",
            eventName: `Enroll ${input.courseId}`,
            eventData: {
              courseType: input.courseId,
              enrollmentId,
              coursePrice: 0,
              source: "mpesa_initiate",
            },
            sessionId: `enrollment_${enrollmentId}`,
          });
        }

        const accountReference = buildStkAccountReference({
          enrollmentId,
          learnerName: ctx.user?.name,
          userId: ctx.user?.id ?? 0,
        });

        const mpesaResponse = await initiateStkPush({
          phoneNumber: input.phoneNumber,
          amount: input.amount,
          accountReference,
          transactionDesc: `Payment for ${input.courseName}`,
          orderId: orderId,
        });

        if (!mpesaResponse.success) {
          return {
            success: false,
            error: mpesaResponse.error || "Payment initiation failed",
          };
        }

        const paymentRecord = await db.insert(payments).values({
          enrollmentId,
          userId: ctx.user?.id || 0,
          amount: input.amount,
          paymentMethod: "mpesa",
          transactionId: mpesaResponse.checkoutRequestID || "",
          status: "pending",
        } as any);

        const paymentId = (paymentRecord as any)[0]?.id ?? null;

        const checkoutId = mpesaResponse.checkoutRequestID || "";
        await trackPaymentInitiation(
          ctx.user!.id,
          input.amount,
          "mpesa",
          checkoutId ? `stk_${checkoutId}` : `stk_order_${orderId}`,
        );

        return {
          success: true,
          checkoutRequestID: mpesaResponse.checkoutRequestID,
          customerMessage: mpesaResponse.customerMessage,
          orderId,
          paymentId,
          enrollmentId,
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
   * Poll local DB for STK outcome (webhook updates this row; transactionId stays as CheckoutRequestID).
   */
  getPaymentByCheckoutRequestId: protectedProcedure
    .input(z.object({ checkoutRequestID: z.string().min(1) }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) {
        return { ok: false as const, found: false as const, status: null as null };
      }
      const row = await db
        .select()
        .from(payments)
        .where(and(eq(payments.transactionId, input.checkoutRequestID), eq(payments.userId, ctx.user.id)))
        .orderBy(desc(payments.id))
        .limit(1);
      if (!row.length) {
        return { ok: true as const, found: false as const, status: null as null };
      }

      const pay = row[0];
      // Pending M-Pesa: sync from Daraja STK Query when webhook missed or delayed (same path as mock reconcile).
      if (
        pay.status === "pending" &&
        pay.paymentMethod === "mpesa" &&
        typeof pay.transactionId === "string" &&
        pay.transactionId.trim().length > 0
      ) {
        await reconcilePaymentRowByStkQuery(pay.id);
        const again = await db
          .select()
          .from(payments)
          .where(and(eq(payments.transactionId, input.checkoutRequestID), eq(payments.userId, ctx.user.id)))
          .orderBy(desc(payments.id))
          .limit(1);
        if (again.length) {
          return {
            ok: true as const,
            found: true as const,
            status: again[0].status as string | null,
            payment: again[0],
          };
        }
      }

      return {
        ok: true as const,
        found: true as const,
        status: pay.status as string | null,
        payment: pay,
      };
    }),

  /**
   * Poll by enrollment (fallback if checkout lookup fails).
   */
  getPaymentStatusForEnrollment: protectedProcedure
    .input(z.object({ enrollmentId: z.number().int().positive() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) {
        return { ok: false as const, error: "no_db" as const };
      }
      const enr = await db
        .select()
        .from(enrollments)
        .where(and(eq(enrollments.id, input.enrollmentId), eq(enrollments.userId, ctx.user.id)))
        .limit(1);
      if (!enr.length) {
        return { ok: false as const, error: "enrollment_not_found" as const };
      }
      const pay = await db
        .select()
        .from(payments)
        .where(and(eq(payments.enrollmentId, input.enrollmentId), eq(payments.userId, ctx.user.id)))
        .orderBy(desc(payments.id))
        .limit(1);
      const latest = pay[0];
      if (
        latest &&
        latest.status === "pending" &&
        latest.paymentMethod === "mpesa" &&
        typeof latest.transactionId === "string" &&
        latest.transactionId.trim().length > 0
      ) {
        await reconcilePaymentRowByStkQuery(latest.id);
        const payAgain = await db
          .select()
          .from(payments)
          .where(and(eq(payments.enrollmentId, input.enrollmentId), eq(payments.userId, ctx.user.id)))
          .orderBy(desc(payments.id))
          .limit(1);
        const enrAgain = await db
          .select()
          .from(enrollments)
          .where(and(eq(enrollments.id, input.enrollmentId), eq(enrollments.userId, ctx.user.id)))
          .limit(1);
        return {
          ok: true as const,
          enrollmentPaymentStatus: enrAgain[0]?.paymentStatus ?? enr[0].paymentStatus,
          paymentStatus: payAgain[0]?.status ?? null,
        };
      }
      return {
        ok: true as const,
        enrollmentPaymentStatus: enr[0].paymentStatus,
        paymentStatus: latest?.status ?? null,
      };
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
        const accountReference = buildStkAccountReference({
          enrollmentId: paymentRecord.enrollmentId,
          learnerName: ctx.user?.name,
          userId: ctx.user?.id ?? 0,
        });

        const mpesaResponse = await initiateStkPush({
          phoneNumber: input.phoneNumber,
          amount: paymentRecord.amount,
          accountReference,
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

  /**
   * MPESA-8: List stale M-Pesa payments still pending (admin reconciliation).
   */
  getStaleMpesaPendingForReconciliation: adminProcedure
    .input(
      z.object({
        olderThanHours: z.number().min(1).max(720).default(24),
        limit: z.number().min(1).max(500).default(100),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const cutoff = new Date(Date.now() - input.olderThanHours * 60 * 60 * 1000);
      const rows = await db
        .select()
        .from(payments)
        .where(
          and(
            eq(payments.status, "pending"),
            eq(payments.paymentMethod, "mpesa"),
            lt(payments.createdAt, cutoff)
          )
        )
        .orderBy(desc(payments.id))
        .limit(input.limit);
      return {
        olderThanHours: input.olderThanHours,
        count: rows.length,
        payments: rows,
      };
    }),

  /**
   * MPESA-8: Run Daraja STK Query for one payment row and finalize if Safaricom reports success.
   */
  adminReconcileMpesaPayment: adminProcedure
    .input(z.object({ paymentId: z.number().int().positive() }))
    .mutation(async ({ input }) => {
      return reconcilePaymentRowByStkQuery(input.paymentId);
    }),

  /**
   * Learner-facing: whether to promote STK vs bank (no secrets). Honors DISABLE_MPESA_STK.
   */
  getClientPaymentCapabilities: protectedProcedure.query(async () => {
    const mpesaEnv = getMpesaDeploymentMode();
    const disabled =
      process.env.DISABLE_MPESA_STK === "1" ||
      process.env.DISABLE_MPESA_STK === "true" ||
      process.env.DISABLE_MPESA_STK === "yes";

    const callbackRaw =
      process.env.MPESA_CALLBACK_URL?.trim() ||
      (process.env.CALLBACK_URL?.trim()
        ? defaultStkCallbackUrl(process.env.CALLBACK_URL)
        : "");
    const callbackOk = Boolean(callbackRaw && !callbackRaw.includes("example.com"));

    const keyPair =
      (Boolean(process.env.DARAJA_CONSUMER_KEY?.trim()) &&
        Boolean(process.env.DARAJA_CONSUMER_SECRET?.trim())) ||
      (Boolean(process.env.MPESA_CONSUMER_KEY?.trim()) &&
        Boolean(process.env.MPESA_CONSUMER_SECRET?.trim()));

    const paybillOk = Boolean(
      process.env.MPESA_SHORTCODE?.trim() || process.env.MPESA_PAYBILL?.trim()
    );
    const passkeyOk = Boolean(process.env.MPESA_PASSKEY?.trim());

    const stkInfrastructureReady = keyPair && paybillOk && passkeyOk && callbackOk;
    const stkOffered = !disabled && stkInfrastructureReady;

    return {
      mpesaEnvironment: mpesaEnv,
      stkPushOffered: stkOffered,
      stkDisabledByConfig: disabled,
      bankTransferAvailable: true,
      userMessage: disabled
        ? "Mobile Money (STK) checkout is temporarily turned off. Use bank transfer below, or contact support."
        : !stkInfrastructureReady
          ? "Mobile Money is not fully configured on this server. Use bank transfer—we’ll confirm your payment and activate your course."
          : null,
    };
  }),

  /**
   * P0-PAY-1 / ops: non-secret config flags for production readiness (admin only).
   */
  getOperationalReadiness: adminProcedure.query(async () => {
    const db = await getDb();
    const callback =
      process.env.MPESA_CALLBACK_URL?.trim() ||
      (process.env.CALLBACK_URL?.trim()
        ? defaultStkCallbackUrl(process.env.CALLBACK_URL)
        : "");
    const mpesaEnv = getMpesaDeploymentMode();
    const darajaOrMpesaKey =
      Boolean(process.env.DARAJA_CONSUMER_KEY?.trim()) ||
      Boolean(process.env.MPESA_CONSUMER_KEY?.trim());
    const darajaOrMpesaSecret =
      Boolean(process.env.DARAJA_CONSUMER_SECRET?.trim()) ||
      Boolean(process.env.MPESA_CONSUMER_SECRET?.trim());
    return {
      databaseConnected: !!db,
      mpesaEnvironment: mpesaEnv,
      mpesaEnvironmentSource: getMpesaEnvironmentSource(),
      consumerKeySet: darajaOrMpesaKey,
      consumerSecretSet: darajaOrMpesaSecret,
      shortcodeSet: Boolean(
        process.env.MPESA_SHORTCODE?.trim() || process.env.MPESA_PAYBILL?.trim()
      ),
      passkeySet: Boolean(process.env.MPESA_PASSKEY?.trim()),
      callbackUrlSet: Boolean(callback && !callback.includes("example.com")),
      callbackIpAllowlistSet: Boolean(process.env.MPESA_CALLBACK_IP_ALLOWLIST?.trim()),
      disableStkFlagSet: Boolean(
        process.env.DISABLE_MPESA_STK === "1" ||
          process.env.DISABLE_MPESA_STK === "true" ||
          process.env.DISABLE_MPESA_STK === "yes"
      ),
      allRequiredForStk:
        darajaOrMpesaKey &&
        darajaOrMpesaSecret &&
        Boolean(process.env.MPESA_SHORTCODE?.trim() || process.env.MPESA_PAYBILL?.trim()) &&
        Boolean(process.env.MPESA_PASSKEY?.trim()) &&
        Boolean(callback && !callback.includes("example.com")),
    };
  }),
});
