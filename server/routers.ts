import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { enrollmentRouter } from "./routers/enrollment";
import { certificateRouter } from "./routers/certificates";
import { smsRouter } from "./routers/sms";
import { aiLearningRouter } from "./routers/ai-learning";
import { notificationsRouter } from "./routers/notifications";
import { securityRouter } from "./routers/security";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),
  enrollment: enrollmentRouter,
  certificates: certificateRouter,
  sms: smsRouter,
  aiLearning: aiLearningRouter,
  notifications: notificationsRouter,
  security: securityRouter,
});

export type AppRouter = typeof appRouter;
