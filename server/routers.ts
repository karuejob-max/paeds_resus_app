import { router } from "./_core/trpc";
import { authRouter } from "./routers/auth";
import { coursesRouter } from "./routers/courses";
import { enrollmentRouter } from "./routers/enrollment";
import { fellowshipQualificationRouter } from "./routers/fellowship-qualification";
import { institutionRouter } from "./routers/institution";
import { microCoursesRouter } from "./routers/micro-courses";

export const appRouter = router({
  auth: authRouter,
  courses: coursesRouter,
  enrollment: enrollmentRouter,
  fellowshipQualification: fellowshipQualificationRouter,
  institution: institutionRouter,
  microCourses: microCoursesRouter,
});

export type AppRouter = typeof appRouter;
