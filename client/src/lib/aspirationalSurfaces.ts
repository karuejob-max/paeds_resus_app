/**
 * Client mirror of server `exposeAspirationalApis` (see `ENABLE_ASPIRATIONAL_APIS` / `.env.example`).
 * Demo ML / impact dashboards stay off production unless explicitly enabled.
 */
export function exposeAspirationalSurfaces(): boolean {
  if (import.meta.env.DEV) return true;
  return import.meta.env.VITE_EXPOSE_ASPIRATIONAL_APIS === "true";
}
