import { trpc } from "@/lib/trpc";
import { UNAUTHED_ERR_MSG } from '@shared/const';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, httpLink, splitLink, TRPCClientError } from "@trpc/client";
import { createRoot } from "react-dom/client";
import superjson from "superjson";
import App from "./App";
import { getLoginUrl } from "./const";
import { getCurrentAppPath } from "@/lib/authRedirect";
import "./index.css";
import { registerServiceWorker } from "@/lib/registerSW";
import { PatientDemographicsProvider } from "@/contexts/PatientDemographicsContext";

const queryClient = new QueryClient();

const redirectToLoginIfUnauthorized = (error: unknown) => {
  if (!(error instanceof TRPCClientError)) return;
  if (typeof window === "undefined") return;

  const isUnauthorized = error.message === UNAUTHED_ERR_MSG;

  if (!isUnauthorized) return;

  window.location.href = getLoginUrl(getCurrentAppPath());
};

queryClient.getQueryCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.query.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Query Error]", error);
  }
});

queryClient.getMutationCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.mutation.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Mutation Error]", error);
  }
});

function normalizeTrpcBase(raw: string): string {
  const trimmed = raw.trim().replace(/\/$/, "");
  return trimmed.endsWith("/api/trpc") ? trimmed : `${trimmed}/api/trpc`;
}

function getTrpcHttpBaseCandidates(): string[] {
  const candidates: string[] = [];
  const envRaw = import.meta.env.VITE_TRPC_URL?.trim();
  if (envRaw) {
    candidates.push(normalizeTrpcBase(envRaw));
  }
  if (typeof window !== "undefined") {
    const sameOrigin = `${window.location.origin}/api/trpc`;
    candidates.push(sameOrigin);
    if (window.location.hostname === "www.paedsresus.com") {
      candidates.push("https://paedsresus.com/api/trpc");
    } else if (window.location.hostname === "paedsresus.com") {
      candidates.push("https://www.paedsresus.com/api/trpc");
    }
  }
  if (!candidates.length) {
    candidates.push("/api/trpc");
  }
  return Array.from(new Set(candidates));
}

function isNetworkFailure(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return /Failed to fetch|NetworkError|Load failed|fetch/i.test(error.message);
}

/** tRPC batch link calls Response.json(); empty bodies throw "Unexpected end of JSON input" in the browser. */
function isEmptyApiResponseError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return /Empty response from API/i.test(error.message);
}

function isRetriableTrpcTransportError(error: unknown): boolean {
  return isNetworkFailure(error) || isEmptyApiResponseError(error);
}

/**
 * Read the body once and rebuild a Response so callers can still use .json().
 * Fails with a clear message when the host returned no body (timeouts, bad gateway, crashed worker).
 */
async function normalizeTrpcFetchResponse(res: Response): Promise<Response> {
  const text = await res.text();
  if (!text.trim()) {
    throw new Error(
      [
        "Empty response from API",
        `(HTTP ${res.status} ${res.statusText}).`,
        "This often happens after a hosting timeout during slow payments, a deploy, or an upstream gateway issue.",
        "Please retry. If it keeps happening, check your host logs (e.g. Render) for errors or timeouts on this request.",
      ].join(" ")
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

function deriveTrpcSuffix(url: string): string {
  const marker = "/api/trpc";
  const idx = url.indexOf(marker);
  if (idx === -1) return "";
  return url.slice(idx + marker.length);
}

function buildFallbackTrpcUrl(input: RequestInfo | URL, fallbackBase: string): string {
  const url =
    typeof input === "string"
      ? input
      : input instanceof URL
        ? input.toString()
        : input.url;
  const suffix = deriveTrpcSuffix(url);
  return `${fallbackBase}${suffix}`;
}

const trpcBases = getTrpcHttpBaseCandidates();

/** Shared transport: credentials, response normalization, www/apex fallback. */
function createTrpcFetch() {
  return async (input: RequestInfo | URL, init?: RequestInit) => {
    const requestInit: RequestInit = {
      ...(init ?? {}),
      credentials: "include",
    };

    const exec = async (target: RequestInfo | URL) => {
      const raw = await globalThis.fetch(target, requestInit);
      return normalizeTrpcFetchResponse(raw);
    };

    try {
      return await exec(input);
    } catch (error) {
      if (!isRetriableTrpcTransportError(error) || trpcBases.length < 2) {
        throw error;
      }
      for (const base of trpcBases.slice(1)) {
        try {
          const fallbackUrl = buildFallbackTrpcUrl(input, base);
          return await exec(fallbackUrl);
        } catch (innerError) {
          if (!isRetriableTrpcTransportError(innerError)) {
            throw innerError;
          }
        }
      }
      throw error;
    }
  };
}

const trpcFetch = createTrpcFetch();

const sharedHttpOptions = {
  url: trpcBases[0],
  transformer: superjson,
  fetch: trpcFetch,
} as const;

/**
 * Payment-related mutations must not sit behind a large `events.trackEvent` batch (same microtask
 * queue + URL batching), or STK can appear minutes late. Send them via `httpLink` (no batching).
 */
function isPaymentCriticalPath(path: string): boolean {
  return (
    path.startsWith("mpesa.") ||
    path === "enrollment.enrollWithPayment" ||
    path === "payments.initiateSTKPush" ||
    path === "payments.storeCheckoutRequest" ||
    path === "courses.initiateMpesaPayment"
  );
}

const trpcClient = trpc.createClient({
  links: [
    splitLink({
      condition: (op) => isPaymentCriticalPath(op.path),
      true: httpLink(sharedHttpOptions),
      false: httpBatchLink({
        ...sharedHttpOptions,
        /**
         * Many queued `events.trackEvent` mutations merge into one batch; procedure paths are
         * concatenated in the URL (`path1,path2,...?batch=1`), which can exceed proxy limits (414).
         */
        maxURLLength: 2048,
      }),
    }),
  ],
});

// Optional analytics (Umami) — only load when env vars are set
const analyticsEndpoint = import.meta.env.VITE_ANALYTICS_ENDPOINT;
const analyticsWebsiteId = import.meta.env.VITE_ANALYTICS_WEBSITE_ID;
if (typeof analyticsEndpoint === "string" && analyticsEndpoint && typeof analyticsWebsiteId === "string" && analyticsWebsiteId) {
  const script = document.createElement("script");
  script.defer = true;
  script.src = `${analyticsEndpoint.replace(/\/$/, "")}/umami`;
  script.setAttribute("data-website-id", analyticsWebsiteId);
  document.body.appendChild(script);
}

const swEnabled = String(import.meta.env.VITE_ENABLE_SW ?? "").toLowerCase() === "true";

async function disableServiceWorkersAndClearCaches() {
  if (typeof window === "undefined") return;
  if (!("serviceWorker" in navigator)) return;
  try {
    const regs = await navigator.serviceWorker.getRegistrations();
    await Promise.all(regs.map((r) => r.unregister()));
  } catch (error) {
    console.warn("[App] Could not unregister service workers:", error);
  }
  try {
    if (!("caches" in window)) return;
    const keys = await caches.keys();
    const legacy = keys.filter((k) =>
      /paeds-resus|clinical-data|runtime/i.test(k)
    );
    await Promise.all(legacy.map((k) => caches.delete(k)));
  } catch (error) {
    console.warn("[App] Could not clear legacy caches:", error);
  }
}

if (swEnabled) {
  registerServiceWorker()
    .then((registration) => {
      if (registration) {
        console.log("[App] Service worker registered, offline support enabled");
      } else {
        console.warn("[App] Service worker not available, offline support disabled");
      }
    })
    .catch((error) => {
      console.error("[App] Service worker registration failed:", error);
    });
} else {
  void disableServiceWorkersAndClearCaches();
}

createRoot(document.getElementById("root")!).render(
  <trpc.Provider client={trpcClient} queryClient={queryClient}>
    <QueryClientProvider client={queryClient}>
      <PatientDemographicsProvider>
        <App />
      </PatientDemographicsProvider>
    </QueryClientProvider>
  </trpc.Provider>
);
