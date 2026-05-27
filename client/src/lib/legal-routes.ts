/** Paths where users must be able to read legal text without a blocking consent overlay. */
export function isLegalDocumentPath(pathname: string): boolean {
  const path = pathname.split("?")[0]?.split("#")[0] ?? pathname;
  return (
    path === "/terms" ||
    path === "/privacy" ||
    path.startsWith("/legal/") ||
    path === "/care-signal/appeal"
  );
}
