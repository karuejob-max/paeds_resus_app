import { TRPCClientError } from "@trpc/client";

export function getTrpcErrorMessage(error: unknown, fallback = "Something went wrong"): string {
  if (error instanceof TRPCClientError) return error.message;
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

export function isCareSignalParentRedirectMessage(message: string): boolean {
  return /Parent Safe-Truth/i.test(message);
}

/**
 * The AI Guide's own "trouble reaching the AI Guide, check your connection"
 * copy used to fire for every failure -- expired session, rate limiting,
 * a genuine server error, or an actual dropped connection -- which is
 * misleading for anything other than the last one. This distinguishes them
 * using the same TRPCClientError.data?.code / network-message pattern
 * already used in useAuth.ts and Register.tsx.
 */
export function getAiAssistantErrorMessage(error: unknown): string {
  if (error instanceof TRPCClientError) {
    const code = (error.data as { code?: string } | undefined)?.code;
    if (code === "UNAUTHORIZED") {
      return "Your session has expired. Please sign in again to keep using the AI Guide.";
    }
    if (code === "TOO_MANY_REQUESTS") {
      return "The AI Guide is getting a lot of requests right now. Please wait a moment and try again.";
    }
    if (code === "INTERNAL_SERVER_ERROR") {
      return "The AI Guide hit an error on our end, not your connection. Please try again in a moment.";
    }
  }
  if (error instanceof Error && /Failed to fetch|NetworkError|Load failed/i.test(error.message)) {
    return "Sorry, I had trouble reaching the AI Guide. Please check your connection and try again.";
  }
  return "Sorry, something went wrong with the AI Guide. Please try again.";
}
