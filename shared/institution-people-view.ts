export type TriState = "done" | "not_done" | "unknown";
export type PeopleView = "inbox" | "roles";
export type PeopleAttentionCount = number | "unknown";

export function resolveDefaultPeopleView(counts: {
  pendingLinkRequests?: PeopleAttentionCount;
  departmentMismatches?: PeopleAttentionCount;
  missingDepartments?: PeopleAttentionCount;
  declinedAppointments?: PeopleAttentionCount;
  pendingAcceptances?: PeopleAttentionCount;
}): { view: PeopleView; couldNotLoad: boolean } {
  const values = Object.values(counts);
  const couldNotLoad = values.some(value => value === "unknown");
  const hasAttention = values.some(value => typeof value === "number" && value > 0);
  return { view: hasAttention ? "inbox" : "roles", couldNotLoad };
}

export type SetupChecklistInputs = {
  institutionProfile?: boolean | null;
  staffRoster?: boolean | null;
  peopleAccess?: boolean | null;
  departments?: boolean | null;
  accessLinks?: boolean | null;
};
export type SetupChecklistItem = { key: keyof SetupChecklistInputs; status: TriState };

export function deriveSetupChecklist(inputs: SetupChecklistInputs): SetupChecklistItem[] {
  return (Object.keys({
    institutionProfile: true,
    staffRoster: true,
    peopleAccess: true,
    departments: true,
    accessLinks: true,
  }) as Array<keyof SetupChecklistInputs>).map(key => ({
    key,
    status: inputs[key] == null ? "unknown" : inputs[key] ? "done" : "not_done",
  }));
}
