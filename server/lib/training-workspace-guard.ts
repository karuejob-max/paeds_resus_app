import { TRPCError } from "@trpc/server";

/**
 * Training / AHA / fellowship micro-course APIs are for clinical and hospital staff.
 * Institutional users may use the provider UI (role switch) and enroll personally; parents stay excluded.
 */
export function assertTrainingWorkspaceOrAdmin(user: {
  role?: string | null;
  userType?: string | null;
}) {
  const isAdmin = user.role === "admin";
  const isTrainingUser =
    user.userType === "individual" || user.userType === "institutional";
  if (!isAdmin && !isTrainingUser) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message:
        "This action is available to healthcare provider and hospital accounts only.",
    });
  }
}
