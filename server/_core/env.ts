import { ONE_YEAR_MS } from "@shared/const";

export const ENV = {
  appId: process.env.VITE_APP_ID ?? "paeds-resus",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  cprClockLegacyWriteEnabled: process.env.CPR_CLOCK_LEGACY_WRITE_ENABLED === "true",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  /** Google Gemini API key (AI Studio). Used by invokeLLM when set; falls back to BUILT_IN_FORGE_API_KEY. */
  geminiApiKey: (process.env.GEMINI_API_KEY ?? "").trim(),
  appBaseUrl: process.env.APP_BASE_URL ?? "",
  authMode: process.env.AUTH_MODE ?? "email",
  /** Session max age in ms. Set SESSION_MAX_AGE_MS (e.g. 1800000 for 30 min). If unset, 1 year for backward compatibility. */
  sessionMaxAgeMs: process.env.SESSION_MAX_AGE_MS ? Number(process.env.SESSION_MAX_AGE_MS) : ONE_YEAR_MS,
  /**
   * Mock/planning tRPC routers (demo dashboards, not clinical truth).
   * Exposed in development/test by default; in production only if ENABLE_ASPIRATIONAL_APIS=true.
   */
  exposeAspirationalApis:
    process.env.NODE_ENV !== "production" || process.env.ENABLE_ASPIRATIONAL_APIS === "true",
  /** When true, surfaces clinical outcomes pilot metrics in institutional dashboards (CEO-gated). */
  clinicalOutcomesPilotEnabled: process.env.CLINICAL_OUTCOMES_PILOT_ENABLED === "true",
  /** Comma-separated institutionalAccounts.id values in the 90-day outcomes pilot. */
  pilotFacilityIds: (process.env.PILOT_FACILITY_IDS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => Number.parseInt(s, 10))
    .filter((n) => Number.isFinite(n) && n > 0),
};
