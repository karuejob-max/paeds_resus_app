import type { Express, RequestHandler } from "express";

const APEX_HOST = "paedsresus.com";
const CANONICAL_ORIGIN = "https://www.paedsresus.com";

/**
 * 301 redirect apex (paedsresus.com) → www.paedsresus.com.
 * Requires TRUST_PROXY when behind Render or another reverse proxy.
 */
export function canonicalDomainRedirect(): RequestHandler {
  return (req, res, next) => {
    const host = (req.hostname || req.headers.host?.split(":")[0] || "").toLowerCase();
    if (host === APEX_HOST) {
      return res.redirect(301, `${CANONICAL_ORIGIN}${req.originalUrl}`);
    }
    next();
  };
}

export function registerCanonicalDomainRedirect(app: Express) {
  app.use(canonicalDomainRedirect());
}
