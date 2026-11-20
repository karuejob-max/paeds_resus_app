import { createTRPCUntypedClient } from "@trpc/client";
import type { AnyRouter } from "@trpc/server";
import { describe, expect, it, vi } from "vitest";
import superjson from "superjson";
import {
  createTrpcFetch,
  createTrpcHttpLink,
  getTrpcHttpBase,
  isPaymentCriticalPath,
  normalizeTrpcFetchResponse,
} from "./trpc-transport";

describe("same-origin tRPC transport", () => {
  it.each([
    "https://www.paedsresus.com",
    "https://paedsresus.com",
    "https://preview.example.com",
    "http://localhost:3000",
  ])("keeps %s even with a stale cross-origin configured URL", (origin) => {
    expect(getTrpcHttpBase(origin, " https://old-api.example.com/ ")).toBe(`${origin}/api/trpc`);
  });

  it("normalizes the configured URL only when no browser origin exists", () => {
    expect(getTrpcHttpBase(undefined, " https://api.example.com/// ")).toBe("https://api.example.com/api/trpc");
    expect(getTrpcHttpBase(undefined, "https://api.example.com/api/trpc/")).toBe("https://api.example.com/api/trpc");
    expect(getTrpcHttpBase()).toBe("/api/trpc");
  });

  it.each(["Failed to fetch", "NetworkError", "Load failed"])("does not replay a POST after %s", async (message) => {
    const error = new TypeError(message);
    const fetch = vi.fn<typeof globalThis.fetch>().mockRejectedValue(error);
    const transport = createTrpcFetch(fetch);
    await expect(transport("https://www.paedsresus.com/api/trpc/mpesa.initiatePayment", {
      method: "POST", body: '{"amount":200}',
    })).rejects.toBe(error);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it.each([200, 502, 504])("does not replay a mutation with an empty HTTP %i response", async (status) => {
    const fetch = vi.fn<typeof globalThis.fetch>().mockResolvedValue(new Response("", { status }));
    await expect(createTrpcFetch(fetch)("https://paedsresus.com/api/trpc/enrollment.enrollWithPayment", {
      method: "POST",
    })).rejects.toThrow("request outcome is unknown");
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("does not fall back or swallow API errors", async () => {
    const fetch = vi.fn<typeof globalThis.fetch>().mockResolvedValue(new Response('{"error":"UNAUTHORIZED"}', {
      status: 401, headers: { "content-type": "application/json" },
    }));
    const res = await createTrpcFetch(fetch)("/api/trpc/events.trackEvent", { method: "POST" });
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "UNAUTHORIZED" });
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("preserves body, signal and credentials and never retries cancellation", async () => {
    const controller = new AbortController();
    controller.abort();
    const error = new DOMException("Aborted", "AbortError");
    const fetch = vi.fn<typeof globalThis.fetch>().mockRejectedValue(error);
    await expect(createTrpcFetch(fetch)("/api/trpc/payments.initiateSTKPush", {
      method: "POST", body: "payment", signal: controller.signal,
    })).rejects.toBe(error);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith("/api/trpc/payments.initiateSTKPush", {
      method: "POST", body: "payment", signal: controller.signal, credentials: "include",
    });
  });

  it("normalizes response headers while retaining status and JSON", async () => {
    const response = await normalizeTrpcFetchResponse(new Response('{"ok":true}', {
      status: 400, statusText: "Bad Request",
      headers: { "content-type": "application/json", "content-length": "999", "content-encoding": "gzip", "x-request-id": "test" },
    }));
    expect(response.status).toBe(400);
    expect(response.statusText).toBe("Bad Request");
    expect(response.headers.get("content-length")).toBeNull();
    expect(response.headers.get("content-encoding")).toBeNull();
    expect(response.headers.get("x-request-id")).toBe("test");
    expect(await response.json()).toEqual({ ok: true });
  });
});

const paymentPaths = [
  "mpesa.initiatePayment", "mpesa.checkPaymentStatus", "mpesa.reconcilePayment",
  "enrollment.enrollWithPayment", "enrollment.recordPayment",
  "payments.initiateSTKPush", "payments.storeCheckoutRequest", "courses.initiateMpesaPayment",
  "ierp.initiatePayment", "institutionProducts.initiateInstitutionMpesaPayment",
  "institutionalLifeSupport.initiateAhaCredentialPayment",
];

describe("payment link routing", () => {
  it.each(paymentPaths)("keeps %s out of batches", (path) => {
    expect(isPaymentCriticalPath(path)).toBe(true);
  });

  it("batches ordinary requests without treating clinical audit events as disposable", () => {
    expect(isPaymentCriticalPath("events.trackEvent")).toBe(false);
    expect(isPaymentCriticalPath("fellowship.recordResusGPSSession")).toBe(false);
  });

  it("uses the actual split link to dispatch payments immediately beside queued telemetry", async () => {
    const fetch = vi.fn<typeof globalThis.fetch>().mockImplementation(async (input) => {
      const url = String(input);
      const result = { result: { data: superjson.serialize({ success: true }) } };
      const count = new URL(url).pathname.split("/api/trpc/")[1].split(",").length;
      return new Response(JSON.stringify(url.includes("batch=1") ? Array.from({ length: count }, () => result) : result), {
        headers: { "content-type": "application/json" },
      });
    });
    const client = createTRPCUntypedClient<AnyRouter>({
      links: [createTrpcHttpLink("https://www.paedsresus.com/api/trpc", createTrpcFetch(fetch))],
    });
    const telemetry = Array.from({ length: 5 }, (_, i) => client.mutation("events.trackEvent", { eventType: "page_view", eventName: `view ${i}` }));
    const payments = paymentPaths.map((path) => client.mutation(path, { test: true }));

    // Resolve async headers, but do not run the batch scheduler's timer.
    for (let i = 0; i < 5; i++) await Promise.resolve();
    expect(fetch).toHaveBeenCalledTimes(paymentPaths.length);
    for (const [input] of fetch.mock.calls) {
      expect(String(input)).not.toContain("batch=1");
      expect(String(input)).not.toContain("events.trackEvent");
    }
    await Promise.all([...telemetry, ...payments]);
    expect(fetch).toHaveBeenCalledTimes(paymentPaths.length + 1);
    const telemetryCall = fetch.mock.calls.find(([input]) => String(input).includes("events.trackEvent"));
    expect(String(telemetryCall?.[0])).toContain("batch=1");
  });
});
