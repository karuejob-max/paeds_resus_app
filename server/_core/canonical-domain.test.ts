import { describe, expect, it, vi } from "vitest";
import { canonicalDomainRedirect } from "./canonical-domain";

function mockReq(host: string, url = "/about") {
  return {
    hostname: host,
    headers: { host },
    originalUrl: url,
  } as any;
}

function mockRes() {
  const res = {
    redirect: vi.fn(),
  };
  return res as any;
}

describe("canonicalDomainRedirect", () => {
  it("301 redirects apex paedsresus.com to www", () => {
    const handler = canonicalDomainRedirect();
    const req = mockReq("paedsresus.com", "/verify?code=abc");
    const res = mockRes();
    const next = vi.fn();

    handler(req, res, next);

    expect(res.redirect).toHaveBeenCalledWith(301, "https://www.paedsresus.com/verify?code=abc");
    expect(next).not.toHaveBeenCalled();
  });

  it("passes through www and localhost", () => {
    const handler = canonicalDomainRedirect();
    const next = vi.fn();

    handler(mockReq("www.paedsresus.com"), mockRes(), next);
    handler(mockReq("localhost"), mockRes(), next);

    expect(next).toHaveBeenCalledTimes(2);
  });
});
