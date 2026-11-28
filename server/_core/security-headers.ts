import type { RequestHandler } from "express";

/**
 * Baseline browser-hardening headers. A Content-Security-Policy is deliberately
 * not set here: the app uses inline scripts and third-party widgets, and a
 * wrong policy would break sign-in or payments. Add it first in report-only mode.
 */
export const securityHeaders: RequestHandler = (_req, res, next) => {
  res.setHeader("Strict-Transport-Security", "max-age=31536000");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  // Camera is used by QR check-in; geolocation and microphone stay available to this origin only.
  res.setHeader("Permissions-Policy", "camera=(self), microphone=(self), geolocation=(self), payment=(self)");
  next();
};
