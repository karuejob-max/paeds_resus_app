import { describe, expect, it, vi } from "vitest";
import { securityHeaders } from "./security-headers";

describe("securityHeaders", () => {
  it("sets baseline headers and continues", () => {
    const headers: Record<string, string> = {};
    const res = { setHeader: (k: string, v: string) => { headers[k] = v; } };
    const next = vi.fn();
    securityHeaders({} as never, res as never, next);
    expect(headers["X-Content-Type-Options"]).toBe("nosniff");
    expect(headers["X-Frame-Options"]).toBe("SAMEORIGIN");
    expect(headers["Strict-Transport-Security"]).toContain("max-age=");
    expect(headers["Permissions-Policy"]).toContain("camera=(self)");
    expect(next).toHaveBeenCalledOnce();
  });
});
