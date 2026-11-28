import { httpBatchLink, httpBatchStreamLink, httpLink, splitLink } from "@trpc/client";
import type { AppRouter } from "../../../server/routers";
import superjson from "superjson";

function normalizeTrpcBase(raw: string): string {
  const trimmed = raw.trim().replace(/\/+$/, "");
  return trimmed.endsWith("/api/trpc") ? trimmed : `${trimmed}/api/trpc`;
}

/**
 * Use the page's origin, including www versus apex, so cookies and API requests
 * stay on the same host. A stale build-time API URL must not override it.
 * The configured URL is only useful when there is no browser origin.
 */
export function getTrpcHttpBase(origin?: string, configuredUrl?: string): string {
  if (origin && origin !== "null") return `${origin.replace(/\/+$/, "")}/api/trpc`;
  return configuredUrl?.trim() ? normalizeTrpcBase(configuredUrl) : "/api/trpc";
}

/** Read once and rebuild so tRPC can still call .json(), retaining API errors. */
export async function normalizeTrpcFetchResponse(res: Response): Promise<Response> {
  const text = await res.text();
  if (!text.trim()) {
    throw new Error(
      `Empty response from API (HTTP ${res.status} ${res.statusText}). ` +
      "The request outcome is unknown. Check payment status before starting another payment."
    );
  }
  const headers = new Headers(res.headers);
  headers.delete("content-encoding");
  headers.delete("content-length");
  return new Response(text, {
    status: res.status,
    statusText: res.statusText,
    headers,
  });
}

/**
 * Exactly one attempt: a failed/empty response does not prove the server did not
 * accept an STK push or another mutation. Never replay it against another host.
 * Keep tRPC's cancellation signal and let API/network errors reach the caller.
 */
export function createTrpcFetch(fetchImpl: typeof globalThis.fetch = globalThis.fetch) {
  return async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const res = await fetchImpl(input, { ...init, credentials: "include" });
    return normalizeTrpcFetchResponse(res);
  };
}

/** Payment initiation/reconciliation must not wait behind an analytics batch. */
export function isPaymentCriticalPath(path: string): boolean {
  return (
    path.startsWith("mpesa.") ||
    path === "enrollment.enrollWithPayment" ||
    path === "enrollment.recordPayment" ||
    path === "payments.initiateSTKPush" ||
    path === "payments.storeCheckoutRequest" ||
    path === "courses.initiateMpesaPayment" ||
    path === "ierp.initiatePayment" ||
    path === "institutionProducts.initiateInstitutionMpesaPayment" ||
    path === "institutionalLifeSupport.initiateAhaCredentialPayment"
  );
}

export function createTrpcHttpLink(
  url: string,
  fetch: ReturnType<typeof createTrpcFetch>
) {
  const sharedHttpOptions = { url, transformer: superjson, fetch };
  // Reads are streamed: each result is delivered as soon as its own procedure
  // finishes, so one slow query no longer holds up every other query in the
  // same batch (pages showed "Loading…" until the slowest call returned).
  // Streaming must not be wrapped by createTrpcFetch, which buffers the body.
  const streamingFetch: typeof globalThis.fetch = (input, init) =>
    globalThis.fetch(input, { ...init, credentials: "include" });
  return splitLink<AppRouter>({
    condition: (op) => isPaymentCriticalPath(op.path),
    true: httpLink(sharedHttpOptions),
    false: splitLink<AppRouter>({
      condition: (op) => op.type === "query",
      true: httpBatchStreamLink({
        url,
        transformer: superjson,
        fetch: streamingFetch,
        maxURLLength: 2048,
      }),
      false: httpBatchLink({
        ...sharedHttpOptions,
        // Bound concatenated procedure URLs without dropping any audit events.
        maxURLLength: 2048,
      }),
    }),
  });
}
