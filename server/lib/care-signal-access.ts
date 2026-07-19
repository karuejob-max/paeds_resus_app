import { TRPCError } from "@trpc/server";

export type CareSignalAccessUser = {
  role?: string | null;
  userType?: string | null;
};

/** Healthcare provider or hospital staff — not parents. */
export function isCareSignalProviderUser(user: CareSignalAccessUser): boolean {
  return user.userType === "individual" || user.userType === "institutional";
}

export function getCareSignalAccessDeniedMessage(_user: CareSignalAccessUser): string {
  return "Your account is not set up for Care Signal. Register or update Account Settings as a healthcare provider or hospital staff account. If you're a parent or caregiver, share your story through Safe-Truth instead — no account needed.";
}

/**
 * Care Signal APIs are for clinical / hospital accounts (userType), not parents.
 * Uses userType — not providerType (profession enum), which is optional profile metadata.
 */
export function assertCareSignalProviderOrAdmin(user: CareSignalAccessUser): void {
  if (user.role === "admin") return;
  if (isCareSignalProviderUser(user)) return;
  throw new TRPCError({
    code: "FORBIDDEN",
    message: getCareSignalAccessDeniedMessage(user),
  });
}
