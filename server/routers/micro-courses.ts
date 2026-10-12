/**
 * Legacy micro-course router.
 *
 * The canonical paid learning workflow is exposed by courses/enrollment/learning.
 * This compatibility router remains mounted only for old clients, but it must
 * never fabricate enrollment, progress, quiz, certificate, or verification state.
 */

import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { loadMicroCoursesFromDb } from "../lib/micro-course-catalog";

function legacyProcedureDisabled(): never {
  throw new TRPCError({
    code: "NOT_IMPLEMENTED",
    message:
      "This legacy micro-course route is disabled. Use the canonical courses and enrollment workflow.",
  });
}

export const microCoursesRouter = router({
  listCourses: publicProcedure.query(async () => {
    const rows = await loadMicroCoursesFromDb();
    return rows.map(r => ({
      id: r.courseId,
      courseId: r.courseId,
      courseDisplayName: r.title,
      level: r.level,
      duration: r.duration,
      price: r.price,
      description: r.description ?? "",
      targetAudience: "Healthcare providers",
      alignment: [] as string[],
    }));
  }),

  getCourseDetails: publicProcedure
    .input(z.object({ courseId: z.string() }))
    .query(async () => legacyProcedureDisabled()),

  enrollCourse: protectedProcedure
    .input(
      z.object({ courseId: z.string(), paymentMethodId: z.string().optional() })
    )
    .mutation(async () => legacyProcedureDisabled()),

  getUserEnrollments: protectedProcedure.query(async () =>
    legacyProcedureDisabled()
  ),

  completeModule: protectedProcedure
    .input(z.object({ enrollmentId: z.string(), moduleId: z.string() }))
    .mutation(async () => legacyProcedureDisabled()),

  submitQuiz: protectedProcedure
    .input(
      z.object({
        enrollmentId: z.string(),
        quizId: z.string(),
        answers: z.record(z.string(), z.string()),
      })
    )
    .mutation(async () => legacyProcedureDisabled()),

  getUserCertificates: protectedProcedure.query(async () =>
    legacyProcedureDisabled()
  ),

  downloadCertificate: protectedProcedure
    .input(z.object({ certificateId: z.string() }))
    .query(async () => legacyProcedureDisabled()),

  verifyCertificate: publicProcedure
    .input(z.object({ verificationCode: z.string().min(1) }))
    .query(async () => legacyProcedureDisabled()),

  getJourneyProgress: protectedProcedure
    .input(z.object({ journeyId: z.string() }))
    .query(async () => legacyProcedureDisabled()),

  getCourseAnalytics: protectedProcedure
    .input(z.object({ courseId: z.string() }))
    .query(async () => legacyProcedureDisabled()),
});
