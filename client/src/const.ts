export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Use email+password auth when VITE_AUTH_MODE=email or when Manus vars are missing.
const useEmailAuth = () => {
  const mode = import.meta.env.VITE_AUTH_MODE;
  if (mode === "email") return true;
  if (mode === "oauth") return false;
  const hasOAuth = import.meta.env.VITE_OAUTH_PORTAL_URL && import.meta.env.VITE_APP_ID;
  return !hasOAuth;
};

// Generate login URL: /login for email auth, or OAuth redirect URL for Manus.
export const getLoginUrl = () => {
  if (useEmailAuth()) return "/login";
  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL;
  const appId = import.meta.env.VITE_APP_ID;
  const redirectUri = `${window.location.origin}/api/oauth/callback`;
  const state = btoa(redirectUri);
  const url = new URL(`${oauthPortalUrl}/app-auth`);
  url.searchParams.set("appId", appId);
  url.searchParams.set("redirectUri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("type", "signIn");
  return url.toString();
};
