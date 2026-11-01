import { CheckCircle2, Circle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { deriveSetupChecklist, type SetupChecklistInputs } from "@shared/institution-people-view";

const LABELS: Record<keyof SetupChecklistInputs, string> = {
  institutionProfile: "Institution profile",
  staffRoster: "Staff roster",
  peopleAccess: "People and roles",
  departments: "Departments",
  accessLinks: "Admins and access",
};

export function SetupChecklist({ activeView, inputs }: { activeView: string; inputs: SetupChecklistInputs }) {
  const items = deriveSetupChecklist(inputs);
  if (items.every(item => item.status === "done")) return null;
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">People & Access setup</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-2 sm:grid-cols-5">
        {items.map(item => {
          const active = ({ institutionProfile: "overview", staffRoster: "directory", peopleAccess: "roles", departments: "departments", accessLinks: "admins" } as const)[item.key] === activeView;
          const label = LABELS[item.key];
          const statusLabel = item.status === "done" ? "Complete" : item.status === "not_done" ? "Needs setup" : "Could not load";
          return (
            <div
              key={item.key}
              className={`flex items-start gap-2 rounded-md border p-2 text-xs ${active ? "border-primary bg-primary/5 font-medium" : ""}`}
            >
              <span className="shrink-0">
                {item.status === "done" ? (
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                ) : (
                  <Circle className="h-4 w-4 text-muted-foreground" />
                )}
              </span>
              <span><span className="block">{label}</span><span className="text-muted-foreground">{statusLabel}</span></span>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
