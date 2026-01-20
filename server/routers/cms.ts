import { router, protectedProcedure, adminProcedure } from "../_core/trpc";
import { z } from "zod";
import { cmsService } from "../cms";

export const cmsRouter = router({
  /**
   * Create a new course
   */
  createCourse: adminProcedure
    .input(
      z.object({
        title: z.string(),
        description: z.string(),
        category: z.string(),
        difficulty: z.enum(["beginner", "intermediate", "advanced"]),
        duration: z.number(),
      })
    )
    .mutation(({ ctx, input }) => {
      const course = cmsService.createCourse({
        title: input.title,
        description: input.description,
        instructorId: ctx.user.id,
        category: input.category,
        difficulty: input.difficulty,
        duration: input.duration,
        status: "draft",
        metadata: {},
      });

      return {
        success: true,
        course,
      };
    }),

  /**
   * Get course
   */
  getCourse: protectedProcedure
    .input(z.object({ courseId: z.string() }))
    .query(({ input }) => {
      const course = cmsService.getCourse(input.courseId);

      return {
        success: !!course,
        course,
      };
    }),

  /**
   * Update course
   */
  updateCourse: adminProcedure
    .input(
      z.object({
        courseId: z.string(),
        title: z.string().optional(),
        description: z.string().optional(),
        category: z.string().optional(),
        difficulty: z.enum(["beginner", "intermediate", "advanced"]).optional(),
        duration: z.number().optional(),
      })
    )
    .mutation(({ input }) => {
      const success = cmsService.updateCourse(input.courseId, {
        title: input.title,
        description: input.description,
        category: input.category,
        difficulty: input.difficulty,
        duration: input.duration,
      } as Parameters<typeof cmsService.updateCourse>[1]);

      return {
        success,
        message: success ? "Course updated" : "Failed to update course",
      };
    }),

  /**
   * Publish course
   */
  publishCourse: adminProcedure
    .input(z.object({ courseId: z.string() }))
    .mutation(({ input }) => {
      const success = cmsService.publishCourse(input.courseId);

      return {
        success,
        message: success ? "Course published" : "Failed to publish course",
      };
    }),

  /**
   * Create lesson
   */
  createLesson: adminProcedure
    .input(
      z.object({
        courseId: z.string(),
        title: z.string(),
        description: z.string(),
        order: z.number(),
        duration: z.number(),
      })
    )
    .mutation(({ input }) => {
      const lesson = cmsService.createLesson({
        courseId: input.courseId,
        title: input.title,
        description: input.description,
        order: input.order,
        duration: input.duration,
        content: [],
        status: "draft",
      });

      return {
        success: true,
        lesson,
      };
    }),

  /**
   * Get lesson
   */
  getLesson: protectedProcedure
    .input(z.object({ lessonId: z.string() }))
    .query(({ input }) => {
      const lesson = cmsService.getLesson(input.lessonId);

      return {
        success: !!lesson,
        lesson,
      };
    }),

  /**
   * Get course lessons
   */
  getCourseLessons: protectedProcedure
    .input(z.object({ courseId: z.string() }))
    .query(({ input }) => {
      const lessons = cmsService.getCourseLessons(input.courseId);

      return {
        success: true,
        lessons,
        total: lessons.length,
      };
    }),

  /**
   * Create quiz
   */
  createQuiz: adminProcedure
    .input(
      z.object({
        lessonId: z.string(),
        title: z.string(),
        description: z.string(),
        passingScore: z.number(),
        timeLimit: z.number().optional(),
      })
    )
    .mutation(({ input }) => {
      const quiz = cmsService.createQuiz({
        lessonId: input.lessonId,
        title: input.title,
        description: input.description,
        questions: [],
        passingScore: input.passingScore,
        timeLimit: input.timeLimit,
      });

      return {
        success: true,
        quiz,
      };
    }),

  /**
   * Get quiz
   */
  getQuiz: protectedProcedure
    .input(z.object({ quizId: z.string() }))
    .query(({ input }) => {
      const quiz = cmsService.getQuiz(input.quizId);

      return {
        success: !!quiz,
        quiz,
      };
    }),

  /**
   * Request approval
   */
  requestApproval: adminProcedure
    .input(
      z.object({
        contentId: z.string(),
        contentType: z.enum(["course", "lesson"]),
      })
    )
    .mutation(({ ctx, input }) => {
      const approval = cmsService.requestApproval(input.contentId, input.contentType, ctx.user.id);

      return {
        success: true,
        approval,
      };
    }),

  /**
   * Approve content
   */
  approveContent: adminProcedure
    .input(
      z.object({
        approvalId: z.string(),
        comments: z.string().optional(),
      })
    )
    .mutation(({ ctx, input }) => {
      const success = cmsService.approveContent(input.approvalId, ctx.user.id, input.comments);

      return {
        success,
        message: success ? "Content approved" : "Failed to approve content",
      };
    }),

  /**
   * Reject content
   */
  rejectContent: adminProcedure
    .input(
      z.object({
        approvalId: z.string(),
        comments: z.string(),
      })
    )
    .mutation(({ ctx, input }) => {
      const success = cmsService.rejectContent(input.approvalId, ctx.user.id, input.comments);

      return {
        success,
        message: success ? "Content rejected" : "Failed to reject content",
      };
    }),

  /**
   * Get pending approvals
   */
  getPendingApprovals: adminProcedure.query(() => {
    const approvals = cmsService.getPendingApprovals();

    return {
      success: true,
      approvals,
      total: approvals.length,
    };
  }),

  /**
   * Get courses by instructor
   */
  getCoursesByInstructor: protectedProcedure.query(({ ctx }) => {
    const courses = cmsService.getCoursesByInstructor(ctx.user.id);

    return {
      success: true,
      courses,
      total: courses.length,
    };
  }),

  /**
   * Search courses
   */
  searchCourses: protectedProcedure
    .input(z.object({ query: z.string() }))
    .query(({ input }) => {
      const courses = cmsService.searchCourses(input.query);

      return {
        success: true,
        courses,
        total: courses.length,
      };
    }),

  /**
   * Get CMS statistics
   */
  getStatistics: adminProcedure.query(() => {
    const stats = cmsService.getStatistics();

    return {
      success: true,
      ...stats,
    };
  }),

  /**
   * Get course versions
   */
  getCourseVersions: adminProcedure
    .input(z.object({ courseId: z.string() }))
    .query(({ input }) => {
      const versions = cmsService.getCourseVersions(input.courseId);

      return {
        success: true,
        versions,
        total: versions.length,
      };
    }),

  /**
   * Rollback to version
   */
  rollbackToVersion: adminProcedure
    .input(
      z.object({
        courseId: z.string(),
        versionNumber: z.number(),
      })
    )
    .mutation(({ input }) => {
      const success = cmsService.rollbackToVersion(input.courseId, input.versionNumber);

      return {
        success,
        message: success ? "Rolled back to version" : "Failed to rollback",
      };
    }),
});
