import { describe, expect, it } from "vitest";
import { TRPCClientError } from "@trpc/client";
import {
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
});
