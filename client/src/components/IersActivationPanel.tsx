import { useState } from "react";
import { AlertTriangle, CheckCircle2, Clock3, MapPin, RefreshCw, Siren } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

function label(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

const EVENT_TYPES = [
  ["code_blue", "Code Blue"],
  ["code_yellow", "Code Yellow"],
  ["neonatal", "Neonatal emergency"],
  ["sepsis", "Sepsis"],
  ["anaphylaxis", "Anaphylaxis"],
  ["trauma", "Trauma"],
  ["other", "Other"],
] as const;

export function IersActivationPanel({ institutionId }: { institutionId: number }) {
  const utils = trpc.useUtils();
  const [activationType, setActivationType] = useState<(typeof EVENT_TYPES)[number][0]>("code_blue");
  const [location, setLocation] = useState("");
  const [department, setDepartment] = useState("");
  const [notes, setNotes] = useState("");

  const activationsQuery = trpc.iers.listInstitutionActivations.useQuery(
    { institutionId, limit: 25 },
    { refetchInterval: 15_000, retry: 1 },
  );
  const triggerActivation = trpc.iers.triggerActivation.useMutation({
    onSuccess: async (result) => {
      setLocation("");
      setDepartment("");
      setNotes("");
      toast.success(result.escalationFailed ? "Activation created, but no active responder was found." : `${result.notifiedCount} provider responders notified.`);
      await utils.iers.listInstitutionActivations.invalidate();
    },
    onError: (error) => toast.error(error.message || "Could not create activation."),
  });
  const advanceActivation = trpc.iers.advance.useMutation({
    onSuccess: async () => {
      toast.success("Activation timeline updated.");
      await utils.iers.listInstitutionActivations.invalidate();
    },
    onError: (error) => toast.error(error.message || "Could not update activation."),
  });

  const activations = activationsQuery.data ?? [];
  const activeActivations = activations.filter((activation) =>
    ["notifying", "acknowledged", "responding", "at_scene", "stabilized", "recovered", "debrief_pending", "failed_escalation"].includes(activation.status),
  );

  const submit = () => {
    if (location.trim().length < 2) {
      toast.error("Enter the ward, unit, or location before activating.");
      return;
    }
    triggerActivation.mutate({
      institutionId,
      activationType,
      location: location.trim(),
      department: department.trim() || undefined,
      priority: "critical",
      notes: notes.trim() || undefined,
    });
  };

  const nextAction = (status: string) => {
    if (status === "failed_escalation") return { state: "notifying" as const, label: "Retry escalation" };
    if (status === "at_scene") return { state: "stabilized" as const, label: "Mark stabilized" };
    if (status === "stabilized") return { state: "debrief_pending" as const, label: "Start debrief" };
    if (status === "recovered") return { state: "debrief_pending" as const, label: "Start debrief" };
    if (status === "debrief_pending") return { state: "closed" as const, label: "Close after debrief" };
    return null;
  };

  return (
    <div className="space-y-6">
      <Card className="border-red-200 overflow-hidden">
        <CardHeader className="bg-red-50 border-b border-red-100">
          <CardTitle className="flex items-center gap-2 text-red-900">
            <Siren className="h-5 w-5" />
            IERS Activation Command Center
          </CardTitle>
          <CardDescription className="text-red-800/80">
            Trigger a facility event without patient identifiers. Providers receive the responsibility request in their own workspace, and every response is timestamped.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="iers-activation-type">Emergency type</Label>
              <select
                id="iers-activation-type"
                value={activationType}
                onChange={(event) => setActivationType(event.target.value as typeof activationType)}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                {EVENT_TYPES.map(([value, text]) => <option key={value} value={value}>{text}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="iers-activation-location">Location / ward</Label>
              <Input id="iers-activation-location" value={location} onChange={(event) => setLocation(event.target.value)} placeholder="e.g. Paediatric Ward bay 2" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="iers-activation-department">Department (optional)</Label>
              <Input id="iers-activation-department" value={department} onChange={(event) => setDepartment(event.target.value)} placeholder="e.g. Accident & Emergency" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="iers-activation-notes">Operational note (optional)</Label>
              <Textarea id="iers-activation-notes" value={notes} onChange={(event) => setNotes(event.target.value)} rows={2} placeholder="Equipment, access, or escalation note" />
            </div>
          </div>
          <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={submit} disabled={triggerActivation.isPending}>
            <Siren className="h-4 w-4 mr-2" />
            {triggerActivation.isPending ? "Activating…" : "Trigger IERS activation"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock3 className="h-5 w-5 text-teal-700" />
            Live activation timeline
            <Badge variant="outline" className="ml-auto">{activeActivations.length} active</Badge>
          </CardTitle>
          <CardDescription>Monitor provider acknowledgement, arrival, stabilization, debrief, and closure.</CardDescription>
        </CardHeader>
        <CardContent className="p-4 space-y-3">
          {activationsQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading activation history…</p>
          ) : activations.length === 0 ? (
            <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
              No activation events recorded yet. A drill can be used to test the full loop safely.
            </div>
          ) : activations.map((activation) => {
            const action = nextAction(activation.status);
            return (
              <div key={activation.id} className="rounded-lg border p-3 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-sm text-slate-900">{label(activation.activationType)}</p>
                    <p className="text-xs text-slate-600 mt-1 flex items-center gap-1"><MapPin className="h-3 w-3" />{activation.location}{activation.department ? ` · ${activation.department}` : ""}</p>
                    <p className="text-[11px] text-slate-500 mt-1">Triggered {new Date(activation.triggeredAt).toLocaleString()}</p>
                  </div>
                  <Badge variant="outline" className={activation.status === "failed_escalation" ? "border-amber-300 text-amber-800" : "border-teal-200 text-teal-800"}>{label(activation.status)}</Badge>
                </div>
                {activation.status === "failed_escalation" && <p className="text-xs text-amber-800 flex items-center gap-2"><AlertTriangle className="h-4 w-4" />No active responder membership was available when this event was triggered.</p>}
                {action && (
                  <Button
                    size="sm"
                    variant={action.state === "closed" ? "secondary" : "outline"}
                    disabled={advanceActivation.isPending}
                    onClick={() => advanceActivation.mutate({ institutionId, activationEventId: activation.id, state: action.state })}
                  >
                    {action.state === "closed" ? <CheckCircle2 className="h-4 w-4 mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                    {action.label}
                  </Button>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
