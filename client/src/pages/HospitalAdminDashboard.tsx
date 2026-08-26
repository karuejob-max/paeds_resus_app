import { Redirect } from "wouter";

/**
 * Compatibility entry point for bookmarks and stale integrations.
 *
 * The institutional product now lives in InstitutionWorkspace. Keeping this
 * route as a redirect preserves old entry points without maintaining a second
 * 2,900-line dashboard with duplicate learning, QI, and commercial flows.
 */
export default function HospitalAdminDashboard() {
  return <Redirect to="/institution" />;
}
