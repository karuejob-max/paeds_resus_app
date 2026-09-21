export type IersWorkforceTab = "departments" | "erco" | "roster" | "equipment";

export function workforceAnchor(tab: IersWorkforceTab): string {
  if (tab === "erco") return "team-setup-erco";
  if (tab === "roster") return "team-setup-roster";
  return "team-setup-departments";
}

export function resolveIersTab(requestedIersTab: string, workforceTab: IersWorkforceTab): string {
  return requestedIersTab === "workforce" || workforceTab !== "departments" ? "workforce" : requestedIersTab;
}
