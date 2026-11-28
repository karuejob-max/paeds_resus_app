import { trpc } from "@/lib/trpc";
import { UNAUTHED_ERR_MSG } from '@shared/const';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TRPCClientError } from "@trpc/client";
import { createRoot } from "react-dom/client";
import App from "./App";
import { getLoginUrl } from "./const";
import { getCurrentAppPath } from "@/lib/authRedirect";
import {
  createTrpcFetch,
  createTrpcHttpLink,
  getTrpcHttpBase,
} from "@/lib/trpc-transport";
import "./index.css";
import { registerServiceWorker } from "@/lib/registerSW";
import { PatientDemographicsProvider } from "@/contexts/PatientDemographicsContext";

// Defaults tuned for a slow, shared API: without a stale window every page
// navigation re-fetched the same global queries (profile, workspace,
// notifications), and three automatic retries kept failing pages spinning for
// many seconds. Individual queries can still override these.
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        const code = (error as { data?: { code?: string } } | null)?.data?.code;
        if (code === "UNAUTHORIZED" || code === "FORBIDDEN" || code === "NOT_FOUND" || code === "BAD_REQUEST") return false;
        return failureCount < 1;
      },
    },
  },
});

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

const trpcClient = trpc.createClient({
  links: [
    createTrpcHttpLink(
      getTrpcHttpBase(
        typeof window !== "undefined" ? window.location.origin : undefined,
        import.meta.env.VITE_TRPC_URL
      ),
      createTrpcFetch()
    ),
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
