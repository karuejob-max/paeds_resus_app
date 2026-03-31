import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { isMpesaCallbackIpAllowed, getMpesaCallbackClientIp } from "./mpesa-callback-ip";
import type { Request } from "express";

function mockReq(ip: string): Request {
  return { ip, socket: { remoteAddress: ip } } as unknown as Request;
}

describe("mpesa-callback-ip", () => {
  const prev = process.env.MPESA_CALLBACK_IP_ALLOWLIST;

  afterEach(() => {
    if (prev === undefined) delete process.env.MPESA_CALLBACK_IP_ALLOWLIST;
    else process.env.MPESA_CALLBACK_IP_ALLOWLIST = prev;
  });

  it("allows all when allowlist unset", () => {
    delete process.env.MPESA_CALLBACK_IP_ALLOWLIST;
    expect(isMpesaCallbackIpAllowed(mockReq("203.0.113.5"))).toBe(true);
  });

  it("allows only listed IPs", () => {
    process.env.MPESA_CALLBACK_IP_ALLOWLIST = "196.201.214.18, 196.201.214.19";
    expect(isMpesaCallbackIpAllowed(mockReq("196.201.214.18"))).toBe(true);
    expect(isMpesaCallbackIpAllowed(mockReq("196.201.214.19"))).toBe(true);
    expect(isMpesaCallbackIpAllowed(mockReq("198.51.100.1"))).toBe(false);
  });

  it("normalizes IPv4-mapped IPv6", () => {
    process.env.MPESA_CALLBACK_IP_ALLOWLIST = "10.0.0.1";
    expect(getMpesaCallbackClientIp(mockReq("::ffff:10.0.0.1"))).toBe("10.0.0.1");
    expect(isMpesaCallbackIpAllowed(mockReq("::ffff:10.0.0.1"))).toBe(true);
  });
});
