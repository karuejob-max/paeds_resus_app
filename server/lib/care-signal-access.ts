import { TRPCError } from "@trpc/server";

export type CareSignalAccessUser = {
  role?: string | null;
  userType?: string | null;
};

/** Healthcare provider or hospital staff — not parents. */
export function isCareSignalProviderUser(user: CareSignalAccessUser): boolean {
  return user.userType === "individual" || user.userType === "institutional";
}

export function getCareSignalAccessDeniedMessage(user: CareSignalAccessUser): string {
  if (user.userType === "parent") {
    return "Care Signal is for healthcare providers. Parents: use Parent Safe-Truth to share your story.";
  }
  return "Your account is not set up for Care Signal. Register or update Account Settings as a healthcare provider or hospital staff account.";
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
