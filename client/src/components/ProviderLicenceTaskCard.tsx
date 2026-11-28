import { BadgeCheck, ShieldAlert } from "lucide-react";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";

const STATE_TEXT: Record<string, string> = {
  no_licence: "You have not added your professional licence yet.",
  rejected: "Your last licence submission was not accepted. Open it, read the reason and submit it again.",
  revoked: "Your licence was revoked. Submit your current licence.",
  expired: "Your licence has expired. Submit the renewed licence.",
};

/** The provider's own licence to-do. Hidden when nothing is needed. */
export function ProviderLicenceTaskCard() {
  const [, setLocation] = useLocation();
  const tasks = trpc.institutionLicenceFollowup.myTasks.useQuery(undefined, { staleTime: 60_000, retry: 1 });
  const task = tasks.data?.[0];
  if (!task) return null;
  const due = task.dueAt ? new Date(task.dueAt) : null;
  const heading = task.identityMissing
    ? "Tell us your professional role"
    : task.overdue
      ? "Your licence is overdue"
      : "Add your professional licence";
  return (
    <Card className={task.overdue ? "border-red-300 bg-red-50/60" : "border-amber-300 bg-amber-50/60"}>
      <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          {task.overdue ? <ShieldAlert className="mt-0.5 h-5 w-5 text-red-700" /> : <BadgeCheck className="mt-0.5 h-5 w-5 text-amber-700" />}
          <div className="space-y-1 text-sm">
            <p className="font-semibold">{heading}</p>
            <p className="text-slate-700">
              {task.identityMissing
                ? `${task.institutionName} needs to know your role to tell whether a licence applies to you.`
                : STATE_TEXT[task.state] ?? STATE_TEXT.no_licence}
            </p>
            <p className="text-xs text-slate-600">
              A verified licence unlocks emergency-response (IERS) roles, shows you as duty-ready, and lets {task.institutionName} track renewals so yours never lapses.
              {due ? ` ${task.overdue ? "It was due" : "Please add it by"} ${due.toLocaleDateString()}.` : ""}
            </p>
          </div>
        </div>
        <Button size="sm" className="shrink-0" onClick={() => setLocation("/provider-profile#professional-credentials")}>
          {task.identityMissing ? "Set my role" : "Add my licence"}
        </Button>
      </CardContent>
    </Card>
  );
}
