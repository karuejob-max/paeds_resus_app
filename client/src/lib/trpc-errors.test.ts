import { describe, expect, it } from "vitest";
import { TRPCClientError } from "@trpc/client";
import {
  getAiAssistantErrorMessage,
  getTrpcErrorMessage,
  isCareSignalParentRedirectMessage,
} from "./trpc-errors";

describe("trpc-errors", () => {
  it("extracts message from TRPCClientError", () => {
    const err = new TRPCClientError("Care Signal is for healthcare providers.", {
      result: { error: { message: "Care Signal is for healthcare providers.", code: -32003, data: { code: "FORBIDDEN", httpStatus: 403, path: "test" } } },
    });
    expect(getTrpcErrorMessage(err)).toContain("healthcare providers");
  });

  it("detects Parent Safe-Truth redirect copy", () => {
    expect(
      isCareSignalParentRedirectMessage(
        "Care Signal is for healthcare providers. Parents: use Parent Safe-Truth to share your story."
      )
    ).toBe(true);
  });

  it("AI Guide: expired session gets a sign-in prompt, not a connection message", () => {
    const err = new TRPCClientError("Unauthorized", {
      result: { error: { message: "Unauthorized", code: -32001, data: { code: "UNAUTHORIZED", httpStatus: 401, path: "aiAssistant.sendMessage" } } },
    });
    expect(getAiAssistantErrorMessage(err)).toMatch(/session has expired/i);
  });

  it("AI Guide: server error is distinguished from a connection problem", () => {
    const err = new TRPCClientError("Failed to process your message", {
      result: { error: { message: "Failed to process your message", code: -32603, data: { code: "INTERNAL_SERVER_ERROR", httpStatus: 500, path: "aiAssistant.sendMessage" } } },
    });
    expect(getAiAssistantErrorMessage(err)).toMatch(/not your connection/i);
  });

  it("AI Guide: a genuine dropped connection still gets the connection message", () => {
    const err = new Error("Failed to fetch");
    expect(getAiAssistantErrorMessage(err)).toMatch(/check your connection/i);
  });
});
