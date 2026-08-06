import { TRPCError } from "@trpc/server";

export type CodeSignalAccessUser = {
  role?: string | null;
  userType?: string | null;
};

/** Same rule as Care Signal: healthcare provider or hospital staff accounts, or admin. */
export function isCodeSignalProviderUser(user: CodeSignalAccessUser): boolean {
  return user.userType === "individual" || user.userType === "institutional";
}

export function getCodeSignalAccessDeniedMessage(): string {
  return "Your account is not set up for Code Signal. Register or update Account Settings as a healthcare provider or hospital staff account.";
}

export function assertCodeSignalProviderOrAdmin(user: CodeSignalAccessUser): void {
  if (user.role === "admin") return;
  if (isCodeSignalProviderUser(user)) return;
  throw new TRPCError({
    code: "FORBIDDEN",
    message: getCodeSignalAccessDeniedMessage(),
  });
}
