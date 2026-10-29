export type AdministrationLane =
  | "overview"
  | "institution"
  | "billing"
  | "program_operations"
  | "data_support";

export type PeopleView = "inbox" | "roles" | "directory" | "departments" | "admins";

export type PeopleFocus =
  | { kind: "link-request"; id: number }
  | { kind: "mismatch"; id: number }
  | { kind: "role"; slotKey: string };

export type AdministrationLocation = {
  lane: AdministrationLane;
  peopleView?: PeopleView;
  focus?: PeopleFocus;
  importOpen?: boolean;
  institutionId?: number;
};

const LANES = new Set<AdministrationLane>([
  "overview",
  "institution",
  "billing",
  "program_operations",
  "data_support",
]);
const PEOPLE_VIEWS = new Set<PeopleView>([
  "inbox",
  "roles",
  "directory",
  "departments",
  "admins",
]);

function positiveInteger(value: string | null): number | undefined {
  if (!value || !/^\d+$/.test(value)) return undefined;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : undefined;
}

function focusFromParams(params: URLSearchParams): PeopleFocus | undefined {
  const canonicalFocus = params.get("focus")?.trim();
  const canonicalMatch = canonicalFocus?.match(/^(link-request|mismatch):(\d+)$/);
  if (canonicalMatch) return { kind: canonicalMatch[1] === "link-request" ? "link-request" : "mismatch", id: Number(canonicalMatch[2]) };
  const canonicalRole = canonicalFocus?.match(/^role:(.+)$/);
  if (canonicalRole?.[1]) return { kind: "role", slotKey: canonicalRole[1] };
  const linkRequestId = positiveInteger(params.get("linkRequestId"));
  if (linkRequestId) return { kind: "link-request", id: linkRequestId };
  const mismatchId = positiveInteger(params.get("mismatchReportId"));
  if (mismatchId) return { kind: "mismatch", id: mismatchId };
  const roleKey = params.get("roleSlotKey")?.trim();
  return roleKey ? { kind: "role", slotKey: roleKey } : undefined;
}

export function resolveAdministrationLocation(
  input: string | URLSearchParams,
): AdministrationLocation {
  const params = typeof input === "string" ? new URLSearchParams(input.includes("?") ? input.slice(input.indexOf("?") + 1) : input.startsWith("?") ? input.slice(1) : input) : input;
  const requestedAdminTab = params.get("adminTab");
  const requestedPeopleTab = params.get("peopleTab");
  const focus = focusFromParams(params);
  const institutionId = positiveInteger(params.get("institutionId"));

  let lane: AdministrationLane = "overview";
  if (requestedAdminTab && LANES.has(requestedAdminTab as AdministrationLane)) {
    lane = requestedAdminTab as AdministrationLane;
  }

  let peopleView: PeopleView | undefined;
  const requestedCanonicalPeopleView = params.get("peopleView");
  if (requestedCanonicalPeopleView && PEOPLE_VIEWS.has(requestedCanonicalPeopleView as PeopleView)) peopleView = requestedCanonicalPeopleView as PeopleView;
  else if (requestedPeopleTab === "departments") peopleView = "departments";
  else if (requestedPeopleTab === "staff_import") peopleView = "directory";
  else if (requestedPeopleTab === "access_links") peopleView = focus?.kind === "link-request" ? "inbox" : "admins";
  else if (requestedPeopleTab === "people_access") peopleView = focus?.kind === "mismatch" ? "inbox" : "roles";
  else if (requestedPeopleTab && PEOPLE_VIEWS.has(requestedPeopleTab as PeopleView)) peopleView = requestedPeopleTab as PeopleView;
  else if (requestedAdminTab === "access_links") peopleView = "inbox";
  else if (requestedAdminTab === "people_roles" || requestedAdminTab === "people" || requestedAdminTab === "people_access") peopleView = focus?.kind === "mismatch" ? "inbox" : "roles";

  if (peopleView || focus) lane = "institution";
  return {
    lane,
    ...(peopleView ? { peopleView } : {}),
    ...(focus ? { focus } : {}),
    ...(requestedPeopleTab === "staff_import" ? { importOpen: true } : {}),
    ...(institutionId ? { institutionId } : {}),
  };
}

export function buildAdministrationUrl(location: AdministrationLocation): string {
  const params = new URLSearchParams();
  if (location.institutionId) params.set("institutionId", String(location.institutionId));
  params.set("section", "administration");
  params.set("adminTab", location.lane);
  if (location.peopleView) params.set("peopleView", location.peopleView);
  if (location.importOpen) params.set("importOpen", "1");
  if (location.focus?.kind === "link-request") params.set("focus", `link-request:${location.focus.id}`);
  if (location.focus?.kind === "mismatch") params.set("focus", `mismatch:${location.focus.id}`);
  if (location.focus?.kind === "role") params.set("focus", `role:${location.focus.slotKey}`);
  return `/institution?${params.toString()}`;
}
