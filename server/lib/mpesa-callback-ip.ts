import type { Request } from "express";

/**
 * MPESA-7: Optional callback IP allowlist (comma-separated IPv4 literals).
 * If `MPESA_CALLBACK_IP_ALLOWLIST` is unset or empty, all IPs are allowed.
 * Set `TRUST_PROXY=true` behind Render/nginx so `req.ip` reflects the client.
 */
function normalizeIp(ip: string): string {
  return ip.replace(/^::ffff:/, "").trim();
}

export function getMpesaCallbackClientIp(req: Request): string {
  const direct = req.ip || req.socket?.remoteAddress || "";
  return normalizeIp(String(direct));
}

export function isMpesaCallbackIpAllowed(req: Request): boolean {
  const raw = process.env.MPESA_CALLBACK_IP_ALLOWLIST?.trim();
  if (!raw) return true;

  const client = getMpesaCallbackClientIp(req);
  const allowed = raw
    .split(",")
    .map((s) => normalizeIp(s))
    .filter(Boolean);

  return allowed.some((a) => a === client);
}
