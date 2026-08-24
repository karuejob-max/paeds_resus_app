import { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Clock3, Loader2, Users } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import ProviderUtlReadinessCard from "@/components/ProviderUtlReadinessCard";
import ProviderIersTargetedReportCard from "@/components/ProviderIersTargetedReportCard";

const ERT_MEMBER_ROLES = [
  ["airway_lead", "Airway lead"],
  ["breathing_lead", "Breathing lead"],
  ["circulation_lead", "Circulation lead"],
  ["medications_lead", "Medications lead"],
  ["documentation_lead", "Documentation lead"],
  ["runner", "Runner"],
  ["safety_observer", "Safety observer"],
  ["resus_recorder", "Resuscitation recorder"],
] as const;

function roleLabel(roleKey: string) {
  return ERT_MEMBER_ROLES.find(([key]) => key === roleKey)?.[1]
    ?? roleKey.replaceAll("_", " ").replace(/\b\w/g, (character) => character.toUpperCase());
}

function statusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  if (status === "accepted") return "default";
  if (status === "declined") return "destructive";
  if (status === "pending_acceptance" || status === "approved") return "secondary";
  return "outline";
}

export default function ProviderIersShiftTeamCard() {
  const teamsQuery = trpc.iersShiftTeam.listMyShiftTeams.useQuery({ horizonDays: 7 }, {
    staleTime: 15_000,
    refetchOnWindowFocus: true,
  });
  const utils = trpc.useUtils();
  const [declineReason, setDeclineReason] = useState<Record<number, string>>({});
  const [recommendation, setRecommendation] = useState<Record<number, { roleKey: string; reason: string }>>({});
  const [switchState, setSwitchState] = useState<Record<string, { firstId: string; secondId: string; reason: string }>>({});
  const [assignState, setAssignState] = useState<Record<number, { roleKey: string; reason: string }>>({});
  const [decisionNote, setDecisionNote] = useState<Record<number, string>>({});

  const respondMutation = trpc.iersShiftTeam.respondToRole.useMutation({
    onSuccess: async () => {
      toast.success("Shift-role response saved.");
      await Promise.all([
        utils.iersShiftTeam.listMyShiftTeams.invalidate(),
        utils.institution.getMyProviderDutyAssignments.invalidate(),
        utils.iers.getMyShiftReadiness.invalidate(),
      ]);
    },
    onError: (error) => toast.error(error.message),
  });
  const recommendMutation = trpc.iersShiftTeam.recommendRole.useMutation({
    onSuccess: async () => {
      toast.success("Role recommendation sent to the ERTL.");
      await utils.iersShiftTeam.listMyShiftTeams.invalidate();
    },
    onError: (error) => toast.error(error.message),
  });
  const decideMutation = trpc.iersShiftTeam.decideRoleRecommendation.useMutation({
    onSuccess: async () => {
      toast.success("Role recommendation decision saved.");
      setDecisionNote({});
      await utils.iersShiftTeam.listMyShiftTeams.invalidate();
    },
    onError: (error) => toast.error(error.message),
  });
  const assignMemberRoleMutation = trpc.iersShiftTeam.assignMemberRole.useMutation({
    onSuccess: async () => {
      toast.success("ERT member role assigned; the provider must accept the new responsibility.");
      await utils.iersShiftTeam.listMyShiftTeams.invalidate();
    },
    onError: (error) => toast.error(error.message),
  });
  const switchMutation = trpc.iersShiftTeam.switchMemberRoles.useMutation({
    onSuccess: async () => {
      toast.success("ERT roles switched; both providers must accept the new roles.");
      await utils.iersShiftTeam.listMyShiftTeams.invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  const teams = teamsQuery.data ?? [];
  const hasPendingAction = useMemo(
    () => teams.some((team) => team.assignments.some((assignment) => assignment.isCurrentUser && ["approved", "pending_acceptance"].includes(assignment.assignmentStatus))),
    [teams],
  );

  const refresh = () => void teamsQuery.refetch();

  return (
    <Card className="border-rose-200 bg-rose-50/30 overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-base"><Users className="h-4 w-4 text-rose-700" /> Emergency Response Team</CardTitle>
            <CardDescription className="mt-1">See the current team for your pole, accept your dated role, or raise a role change for the ERTL.</CardDescription>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={refresh} disabled={teamsQuery.isFetching}>Refresh</Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {teamsQuery.isLoading && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading your pole teams…</div>}
        {teamsQuery.isError && <p className="text-sm text-destructive">The shift team could not be loaded. Refresh and try again.</p>}
        {!teamsQuery.isLoading && !teamsQuery.isError && teams.length === 0 && (
          <div className="rounded-lg border border-dashed border-rose-200 bg-white p-4 text-sm text-muted-foreground">
            No published ERT team is available for your pole in the next seven days. This does not create automatic staffing; the institution must publish the dated team.
          </div>
        )}
        {teams.map((team) => {
          const memberAssignments = team.assignments.filter((assignment) => assignment.roleScope === "ert_member");
          const currentAssignments = team.assignments.filter((assignment) => assignment.isCurrentUser);
          const currentAssignment = currentAssignments.find((assignment) => assignment.roleScope === "ertl") ?? currentAssignments[0];
          const currentUtlAssignment = currentAssignments.find((assignment) => assignment.roleScope === "utl");
          const ertlAssignment = team.assignments.find((assignment) => assignment.roleScope === "ertl");
          const teamKey = String(team.teamId);
          const currentSwitch = switchState[teamKey] ?? { firstId: "", secondId: "", reason: "" };
          const pendingRecommendations = team.assignments.flatMap((assignment) => assignment.recommendations.map((item) => ({ recommendation: item, assignment })));
          const isAcceptedErtl = currentAssignment?.roleScope === "ertl" && currentAssignment.assignmentStatus === "accepted";
          return (
            <section key={teamKey} className="rounded-xl border bg-white p-4 shadow-sm space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-sm">{team.poleName} · {team.shiftType.replace("morning", "day").replace("evening", "evening").replace("night", "night")} shift</p>
                  <p className="text-xs text-muted-foreground">{new Date(team.shiftDate).toLocaleDateString()} · {team.shiftStartTime.slice(0, 5)}–{team.shiftEndTime.slice(0, 5)}{team.shiftEndDayOffset === 1 ? " (+1 day)" : ""} · team v{team.teamVersion}</p>
                </div>
                <Badge variant={team.teamStatus === "active" ? "default" : "secondary"}>{team.teamStatus}</Badge>
              </div>
              {ertlAssignment ? (
                <p className="rounded-md bg-slate-50 px-3 py-2 text-xs text-slate-700">
                  <strong>ERTL / Scene Commander:</strong> {ertlAssignment.providerName} · {ertlAssignment.assignmentStatus.replaceAll("_", " ")}
                </p>
              ) : (
                <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">The ERTL has not yet been projected for this dated team. The institution must confirm the pole rotation or explicitly nominate an ERTL.</p>
              )}

              <div className="space-y-2">
                {team.assignments.map((assignment) => (
                  <div key={assignment.id} className={`rounded-lg border p-3 ${assignment.isCurrentUser ? "border-rose-300 bg-rose-50/60" : "bg-slate-50/50"}`}>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium">{assignment.providerName}</p>
                        <p className="text-xs text-muted-foreground">{roleLabel(assignment.roleKey)}{assignment.departmentName ? ` · ${assignment.departmentName}` : ""}</p>
                      </div>
                      <Badge variant={statusVariant(assignment.assignmentStatus)}>{assignment.assignmentStatus.replaceAll("_", " ")}</Badge>
                    </div>
                    {assignment.isCurrentUser && ["approved", "pending_acceptance"].includes(assignment.assignmentStatus) && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button type="button" size="sm" onClick={() => respondMutation.mutate({ assignmentId: assignment.id, decision: "accepted" })} disabled={respondMutation.isPending}><CheckCircle2 className="mr-1 h-4 w-4" /> Accept role</Button>
                        <Button type="button" size="sm" variant="outline" onClick={() => setDeclineReason((previous) => ({ ...previous, [assignment.id]: previous[assignment.id] ?? "" }))}>Decline</Button>
                      </div>
                    )}
                    {assignment.isCurrentUser && declineReason[assignment.id] !== undefined && ["approved", "pending_acceptance"].includes(assignment.assignmentStatus) && (
                      <div className="mt-2 space-y-2">
                        <Textarea value={declineReason[assignment.id]} onChange={(event) => setDeclineReason((previous) => ({ ...previous, [assignment.id]: event.target.value }))} placeholder="Why can you not accept this dated role?" rows={2} />
                        <Button type="button" size="sm" variant="destructive" onClick={() => respondMutation.mutate({ assignmentId: assignment.id, decision: "declined", reason: declineReason[assignment.id] })} disabled={respondMutation.isPending || declineReason[assignment.id].trim().length < 3}>Confirm decline</Button>
                      </div>
                    )}
                    {assignment.isCurrentUser && assignment.roleScope === "ert_member" && ["accepted", "pending_acceptance"].includes(assignment.assignmentStatus) && (
                      <div className="mt-3 space-y-2 border-t pt-3">
                        <p className="text-xs font-medium">Recommend a different role to the ERTL</p>
                        <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                          <select className="h-9 rounded-md border bg-background px-3 text-sm" value={recommendation[assignment.id]?.roleKey ?? ""} onChange={(event) => setRecommendation((previous) => ({ ...previous, [assignment.id]: { roleKey: event.target.value, reason: previous[assignment.id]?.reason ?? "" } }))}>
                            <option value="">Choose role</option>
                            {ERT_MEMBER_ROLES.map(([key, label]) => <option key={key} value={key}>{label}</option>)}
                          </select>
                          <Textarea value={recommendation[assignment.id]?.reason ?? ""} onChange={(event) => setRecommendation((previous) => ({ ...previous, [assignment.id]: { roleKey: previous[assignment.id]?.roleKey ?? "", reason: event.target.value } }))} placeholder="Reason for the recommendation" rows={1} />
                        </div>
                        <Button type="button" size="sm" variant="outline" onClick={() => { const value = recommendation[assignment.id]; if (value?.roleKey && value.reason.trim().length >= 3) recommendMutation.mutate({ assignmentId: assignment.id, requestedRoleKey: value.roleKey, reason: value.reason }); }} disabled={recommendMutation.isPending || !recommendation[assignment.id]?.roleKey || (recommendation[assignment.id]?.reason.trim().length ?? 0) < 3}>Send recommendation</Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {isAcceptedErtl && pendingRecommendations.length > 0 && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 space-y-2">
                  <p className="text-sm font-semibold flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-amber-700" /> Recommendations awaiting your decision</p>
                  {pendingRecommendations.map(({ recommendation, assignment }) => (
                    <div key={recommendation.id} className="rounded border bg-white p-3 text-sm">
                      <p><strong>{assignment.providerName}</strong> recommends <strong>{roleLabel(recommendation.requestedRoleKey)}</strong>.</p>
                      <p className="text-xs text-muted-foreground mt-1">{recommendation.reason}</p>
                      <Textarea className="mt-2" value={decisionNote[recommendation.id] ?? ""} placeholder="Optional decision note" rows={2} onChange={(event) => setDecisionNote((previous) => ({ ...previous, [recommendation.id]: event.target.value }))} />
                      <div className="mt-2 flex flex-wrap gap-2">
                        <Button type="button" size="sm" onClick={() => decideMutation.mutate({ recommendationId: recommendation.id, decision: "approved", note: decisionNote[recommendation.id] || undefined })} disabled={decideMutation.isPending}>Approve and request acceptance</Button>
                        <Button type="button" variant="outline" size="sm" onClick={() => decideMutation.mutate({ recommendationId: recommendation.id, decision: "declined", note: decisionNote[recommendation.id] || undefined })} disabled={decideMutation.isPending}>Decline</Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {currentUtlAssignment?.assignmentStatus === "accepted" && (
                <ProviderUtlReadinessCard teamId={team.teamId} shiftUtlRosterId={currentUtlAssignment.shiftUtlRosterId} />
              )}

              {currentAssignment && currentAssignment.assignmentStatus === "accepted" && (
                <ProviderIersTargetedReportCard teamId={team.teamId} assignmentId={currentAssignment.id} />
              )}

              {isAcceptedErtl && memberAssignments.length > 0 && (
                <div className="rounded-lg border border-violet-200 bg-violet-50 p-3 space-y-3">
                  <p className="text-sm font-semibold">Assign an ERT member responsibility</p>
                  <p className="text-xs text-muted-foreground">Choose a role for an existing ERT member. Their acceptance is required and any previous acceptance/readiness is reset.</p>
                  {memberAssignments.map((assignment) => {
                    const state = assignState[assignment.id] ?? { roleKey: assignment.roleKey, reason: "" };
                    return (
                      <div key={`assign-${assignment.id}`} className="rounded-md border bg-white p-3 space-y-2">
                        <p className="text-xs font-medium">{assignment.providerName}</p>
                        <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                          <select className="h-9 rounded-md border bg-background px-3 text-sm" value={state.roleKey} onChange={(event) => setAssignState((previous) => ({ ...previous, [assignment.id]: { ...state, roleKey: event.target.value } }))}>
                            {ERT_MEMBER_ROLES.map(([key, label]) => <option key={key} value={key}>{label}</option>)}
                          </select>
                          <Textarea value={state.reason} onChange={(event) => setAssignState((previous) => ({ ...previous, [assignment.id]: { ...state, reason: event.target.value } }))} placeholder="Reason for the assignment" rows={1} />
                        </div>
                        <Button type="button" size="sm" onClick={() => assignMemberRoleMutation.mutate({ teamId: team.teamId, assignmentId: assignment.id, roleKey: state.roleKey, reason: state.reason })} disabled={assignMemberRoleMutation.isPending || state.roleKey === assignment.roleKey || state.reason.trim().length < 3}>Assign and request acceptance</Button>
                      </div>
                    );
                  })}
                </div>
              )}

              {isAcceptedErtl && memberAssignments.length >= 2 && (
                <div className="rounded-lg border border-sky-200 bg-sky-50 p-3 space-y-2">
                  <p className="text-sm font-semibold flex items-center gap-2"><Clock3 className="h-4 w-4 text-sky-700" /> Switch roles between ERT members</p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <select className="h-9 rounded-md border bg-background px-3 text-sm" value={currentSwitch.firstId} onChange={(event) => setSwitchState((previous) => ({ ...previous, [teamKey]: { ...currentSwitch, firstId: event.target.value } }))}>
                      <option value="">First provider</option>
                      {memberAssignments.map((assignment) => <option key={assignment.id} value={assignment.id}>{assignment.providerName} · {roleLabel(assignment.roleKey)}</option>)}
                    </select>
                    <select className="h-9 rounded-md border bg-background px-3 text-sm" value={currentSwitch.secondId} onChange={(event) => setSwitchState((previous) => ({ ...previous, [teamKey]: { ...currentSwitch, secondId: event.target.value } }))}>
                      <option value="">Second provider</option>
                      {memberAssignments.map((assignment) => <option key={assignment.id} value={assignment.id}>{assignment.providerName} · {roleLabel(assignment.roleKey)}</option>)}
                    </select>
                  </div>
                  {currentSwitch.firstId && currentSwitch.secondId && <><Textarea value={currentSwitch.reason} onChange={(event) => setSwitchState((previous) => ({ ...previous, [teamKey]: { ...currentSwitch, reason: event.target.value } }))} placeholder="Reason for the role switch" rows={2} /><Button type="button" size="sm" onClick={() => switchMutation.mutate({ firstAssignmentId: Number(currentSwitch.firstId), secondAssignmentId: Number(currentSwitch.secondId), reason: currentSwitch.reason })} disabled={switchMutation.isPending || currentSwitch.firstId === currentSwitch.secondId || currentSwitch.reason.trim().length < 3}>Switch selected roles</Button></>}
                </div>
              )}
            </section>
          );
        })}
        {hasPendingAction && <p className="text-xs text-muted-foreground">A dated role is awaiting your response. Accepting confirms responsibility; it does not by itself prove that you are responding or at the scene.</p>}
      </CardContent>
    </Card>
  );
}
