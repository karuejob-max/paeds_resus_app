import { TRPCClientError } from "@trpc/client";

export function getTrpcErrorMessage(error: unknown, fallback = "Something went wrong"): string {
  if (error instanceof TRPCClientError) return error.message;
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

export function isCareSignalParentRedirectMessage(message: string): boolean {
  return /Parent Safe-Truth/i.test(message);
}
