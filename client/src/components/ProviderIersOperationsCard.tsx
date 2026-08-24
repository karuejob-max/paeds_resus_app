import { useState } from "react";
import { CalendarClock, CheckCircle2, ClipboardCheck, HeartPulse, Loader2, MessageSquareWarning, Users } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

function label(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function ProviderIersOperationsCard() {
  const utils = trpc.useUtils();
  const drillsQuery = trpc.iers.listMyDrills.useQuery(undefined, {
    staleTime: 30_000,
    refetchInterval: 30_000,
    retry: 1,
  });
  const [roleByDrill, setRoleByDrill] = useState<Record<number, string>>({});
  const joinMutation = trpc.iers.joinDrill.useMutation({
    onSuccess: async () => {
      toast.success("Drill participation recorded.");
      await utils.iers.listMyDrills.invalidate();
    },
    onError: (error) => toast.error(error.message || "Could not join this drill."),
  });

  const drills = drillsQuery.data ?? [];
  return (
    <Card className="border-indigo-200 overflow-hidden">
      <CardHeader className="bg-indigo-50 border-b border-indigo-100 pb-3">
        <CardTitle className="flex items-center gap-2 text-indigo-950 text-base">
          <ClipboardCheck className="h-5 w-5" />
          ERT operations and participation
        </CardTitle>
        <CardDescription className="text-indigo-900/75">
          Join a scheduled readiness drill, record your participation, and reach the independent Code/Care Signal reporting tools.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        {drillsQuery.isLoading && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading readiness activities…</div>}
        {drillsQuery.isError && <p className="text-sm text-destructive">Readiness activities could not be loaded. Refresh the page and try again.</p>}
        {!drillsQuery.isLoading && !drillsQuery.isError && drills.length === 0 && (
          <div className="rounded-lg border border-dashed border-indigo-200 bg-white p-3 text-sm text-muted-foreground">
            No scheduled or active readiness drill is available for your active institutions. Activation responses and accepted dated ERT roles remain available in the sections above.
          </div>
        )}
        {drills.map((drill) => {
          const role = roleByDrill[drill.id] ?? "ERT participant";
          return (
            <div key={drill.id} className="rounded-lg border border-indigo-100 bg-white p-3 space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-sm text-slate-900">{drill.title}</p>
                  <p className="text-xs text-slate-600 mt-1 flex items-center gap-1"><CalendarClock className="h-3 w-3" /> {new Date(drill.scheduledAt).toLocaleString()} · {label(drill.scenarioType)}</p>
                </div>
                <Badge variant="outline" className="border-indigo-200 text-indigo-800">{label(drill.status)}</Badge>
              </div>
              {drill.status === "in_progress" ? (
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <Input aria-label={`Role for ${drill.title}`} value={role} onChange={(event) => setRoleByDrill((previous) => ({ ...previous, [drill.id]: event.target.value }))} placeholder="Your role in this drill" className="sm:max-w-xs" />
                  <Button type="button" size="sm" onClick={() => joinMutation.mutate({ drillId: drill.id, role })} disabled={joinMutation.isPending || role.trim().length < 2}><Users className="mr-1 h-4 w-4" /> Join drill</Button>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">The facilitator must start this safety-attested drill before providers can join.</p>
              )}
            </div>
          );
        })}
        <div className="grid gap-2 sm:grid-cols-2">
          <Button type="button" variant="outline" onClick={() => window.location.assign("/code-signal")}><HeartPulse className="mr-2 h-4 w-4" /> Anonymous Code Signal</Button>
          <Button type="button" variant="outline" onClick={() => window.location.assign("/care-signal")}><MessageSquareWarning className="mr-2 h-4 w-4" /> Anonymous Care Signal</Button>
        </div>
        <div className="flex items-start gap-2 rounded-md bg-slate-50 p-2.5 text-xs text-slate-600"><CheckCircle2 className="h-4 w-4 text-indigo-700 shrink-0 mt-0.5" /><span>Participation, evidence, actions, activation response, readiness, and role-linked reports are recorded separately so one activity does not falsely prove another.</span></div>
      </CardContent>
    </Card>
  );
}
