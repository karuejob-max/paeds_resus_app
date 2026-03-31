import { trpc } from "@/lib/trpc";
import { UNAUTHED_ERR_MSG } from '@shared/const';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, TRPCClientError } from "@trpc/client";
import { createRoot } from "react-dom/client";
import superjson from "superjson";
import App from "./App";
import { getLoginUrl } from "./const";
import "./index.css";
import { registerServiceWorker } from "@/lib/registerSW";
import { PatientDemographicsProvider } from "@/contexts/PatientDemographicsContext";

const queryClient = new QueryClient();

const redirectToLoginIfUnauthorized = (error: unknown) => {
  if (!(error instanceof TRPCClientError)) return;
  if (typeof window === "undefined") return;

  const isUnauthorized = error.message === UNAUTHED_ERR_MSG;

  if (!isUnauthorized) return;

  window.location.href = getLoginUrl();
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

/**
 * tRPC HTTP endpoint. Default is same-origin `/api/trpc` (single Render service).
 * If the SPA is served from a host that does not run the API (e.g. www static + API on apex),
 * set `VITE_TRPC_URL` at build time to the full API URL, e.g. `https://paedsresus.com/api/trpc`.
 */
function getTrpcHttpUrl(): string {
  const raw = import.meta.env.VITE_TRPC_URL?.trim();
  if (raw) {
    const u = raw.replace(/\/$/, "");
    return u.endsWith("/api/trpc") ? u : `${u}/api/trpc`;
  }
  return "/api/trpc";
}

const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: getTrpcHttpUrl(),
      transformer: superjson,
      fetch(input, init) {
        return globalThis.fetch(input, {
          ...(init ?? {}),
          credentials: "include",
        });
      },
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

// Register service worker for offline support
registerServiceWorker().then((registration) => {
  if (registration) {
    console.log('[App] Service worker registered, offline support enabled');
  } else {
    console.warn('[App] Service worker not available, offline support disabled');
  }
}).catch((error) => {
  console.error('[App] Service worker registration failed:', error);
});

createRoot(document.getElementById("root")!).render(
  <trpc.Provider client={trpcClient} queryClient={queryClient}>
    <QueryClientProvider client={queryClient}>
      <PatientDemographicsProvider>
        <App />
      </PatientDemographicsProvider>
    </QueryClientProvider>
  </trpc.Provider>
);
