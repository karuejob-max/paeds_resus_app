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
  appBaseUrl: process.env.APP_BASE_URL ?? "",
  authMode: process.env.AUTH_MODE ?? "email",
  /** Session max age in ms. Set SESSION_MAX_AGE_MS (e.g. 1800000 for 30 min). If unset, 1 year for backward compatibility. */
  sessionMaxAgeMs: process.env.SESSION_MAX_AGE_MS ? Number(process.env.SESSION_MAX_AGE_MS) : ONE_YEAR_MS,
};
