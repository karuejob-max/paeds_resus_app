export function sanitizeNextPath(nextPath: string | null | undefined, fallback = "/home"): string {
  if (!nextPath) return fallback;
  if (!nextPath.startsWith("/")) return fallback;
  if (nextPath.startsWith("//")) return fallback;
  if (nextPath.startsWith("/\\")) return fallback;
  return nextPath;
}

export function getCurrentAppPath(): string {
  if (typeof window === "undefined") return "/";
  return `${window.location.pathname}${window.location.search}${window.location.hash}`;
}

export function buildLoginUrl(nextPath?: string | null): string {
  const safeNextPath = sanitizeNextPath(nextPath, "");
  if (!safeNextPath) return "/login";
  return `/login?next=${encodeURIComponent(safeNextPath)}`;
}

export function readSafeNextPathFromSearch(search: string, fallback = "/home"): string {
  const raw = new URLSearchParams(search).get("next");
  return sanitizeNextPath(raw, fallback);
}
