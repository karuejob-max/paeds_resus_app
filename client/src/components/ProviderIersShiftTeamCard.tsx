import { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Clock3, Loader2, Siren, Users } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useLocation } from "wouter";
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

function assignmentLabel(assignment: { roleScope: string; roleKey: string }) {
  if (assignment.roleScope === "ertl") return "ERTL / Scene Commander";
  if (assignment.roleScope === "utl") return "UTL";
  return roleLabel(assignment.roleKey);
}

export function groupAssignmentsByProvider<T extends { providerUserId: number }>(assignments: T[]): T[][] {
  const groups = new Map<number, T[]>();
  for (const assignment of assignments) {
    const providerAssignments = groups.get(assignment.providerUserId) ?? [];
    providerAssignments.push(assignment);
    groups.set(assignment.providerUserId, providerAssignments);
  }
  return [...groups.values()];
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
  const [nominationState, setNominationState] = useState<Record<number, { providerUserId: string; roleKey: string; reason: string }>>({});
  const [decisionNote, setDecisionNote] = useState<Record<number, string>>({});
  const [showActivationConfirm, setShowActivationConfirm] = useState<number | null>(null);
  const [activationType, setActivationType] = useState<"code_blue" | "code_yellow" | "neonatal" | "sepsis" | "anaphylaxis" | "trauma" | "other">("code_blue");
  const [activationLocation, setActivationLocation] = useState("");
  const [activationBed, setActivationBed] = useState("");
  const [activationNotes, setActivationNotes] = useState("");
  const [cancelRosterId, setCancelRosterId] = useState<number | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [, setLocation] = useLocation();

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
      await utils.iersShiftTeam.listErtMemberCandidates.invalidate();
    },
    onError: (error) => toast.error(error.message),
  });
  const nominateMemberRoleMutation = trpc.iersShiftTeam.nominateMemberRole.useMutation({
    onSuccess: async () => {
      toast.success("ERT member nominated; the provider must accept the responsibility.");
      await utils.iersShiftTeam.listMyShiftTeams.invalidate();
      await utils.iersShiftTeam.listErtMemberCandidates.invalidate();
    },
    onError: (error) => toast.error(error.message),
  });
  const activateMutation = trpc.iers.triggerActivation.useMutation({
    onSuccess: (result) => {
      toast.success("ERT activated. Opening ResusGPS.");
      setShowActivationConfirm(null);
      setLocation(`/resus?activationId=${result.activationEventId}`);
    },
    onError: (error) => toast.error(error.message || "The ERT could not be activated."),
  });
  const switchMutation = trpc.iersShiftTeam.switchMemberRoles.useMutation({
    onSuccess: async () => {
      toast.success("ERT roles switched; both providers must accept the new roles.");
      await utils.iersShiftTeam.listMyShiftTeams.invalidate();
    },
    onError: (error) => toast.error(error.message),
  });
  const cancelUtlMutation = trpc.institution.cancelFutureShiftUtlAssignment.useMutation({
    onSuccess: async () => {
      toast.success("Future UTL assignment canceled and recorded.");
      setCancelRosterId(null);
      setCancelReason("");
      await Promise.all([
        utils.iersShiftTeam.listMyShiftTeams.invalidate(),
        utils.institution.getMyProviderDutyAssignments.invalidate(),
      ]);
    },
    onError: (error) => toast.error(error.message),
  });

  const teams = teamsQuery.data ?? [];
  const visibleTeams = useMemo(() => {
    const nonPast = teams.filter((team) => team.teamState !== "past");
    return [...nonPast].sort((left, right) => {
      if (left.teamState === "current" && right.teamState !== "current") return -1;
      if (right.teamState === "current" && left.teamState !== "current") return 1;
      return new Date(left.shiftDate).getTime() - new Date(right.shiftDate).getTime();
    });
  }, [teams]);
  const currentTeam = visibleTeams.find((team) => team.teamState === "current") ?? null;
  const futureTeams = visibleTeams.filter((team) => team.teamState === "upcoming");
  const hasPendingAction = useMemo(
    () => teams.some((team) => team.assignments.some((assignment) => assignment.isCurrentUser && ["approved", "pending_acceptance"].includes(assignment.assignmentStatus))),
    [teams],
  );
  const currentErtlUser = currentTeam?.assignments.some((assignment) => assignment.isCurrentUser && assignment.roleScope === "ertl" && assignment.assignmentStatus === "accepted") ?? false;
  const memberCandidatesQuery = trpc.iersShiftTeam.listErtMemberCandidates.useQuery(
    { teamId: currentTeam?.teamId ?? 0 },
    { enabled: currentErtlUser && currentTeam != null, staleTime: 15_000, retry: 1 },
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
        {!teamsQuery.isLoading && !teamsQuery.isError && visibleTeams.length === 0 && (
          <div className="rounded-lg border border-dashed border-rose-200 bg-white p-4 text-sm text-muted-foreground">
            No current or upcoming published ERT is available for your pole. This does not create automatic staffing; the institution must publish the dated team.
          </div>
        )}
        {currentTeam && (
          <div className="rounded-xl border-2 border-red-300 bg-red-50 p-3 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-red-800">ERT now</p>
                <p className="mt-1 text-sm font-semibold text-red-950">{currentTeam.poleName} · current shift</p>
                <p className="mt-1 text-xs text-red-900/75">This is the team to use now. Future teams are listed below only when needed.</p>
              </div>
              <Siren className="h-5 w-5 shrink-0 text-red-700" />
            </div>
            <Button type="button" className="w-full bg-red-600 text-white hover:bg-red-700" onClick={() => { setActivationLocation(currentTeam.poleName); setShowActivationConfirm(currentTeam.teamId); }} disabled={activateMutation.isPending}>
              <Siren className="mr-2 h-4 w-4" /> Activate ERT
            </Button>
            {showActivationConfirm === currentTeam.teamId && (
              <div className="space-y-3 rounded-lg border border-red-200 bg-white p-3">
                <p className="text-sm font-semibold text-slate-950">Confirm ERT activation</p>
                <p className="text-xs text-slate-600">This will notify the current dated ERT and open ResusGPS. Confirm the location before sending.</p>
                <select className="h-9 w-full rounded-md border bg-background px-3 text-sm" value={activationType} onChange={(event) => setActivationType(event.target.value as typeof activationType)}>
                  <option value="code_blue">Code Blue</option><option value="code_yellow">Code Yellow</option><option value="neonatal">Neonatal emergency</option><option value="sepsis">Sepsis</option><option value="anaphylaxis">Anaphylaxis</option><option value="trauma">Trauma</option><option value="other">Other</option>
                </select>
                <div className="grid gap-2 sm:grid-cols-2"><Input value={activationLocation} onChange={(event) => setActivationLocation(event.target.value)} placeholder="Ward / room / location" /><Input value={activationBed} onChange={(event) => setActivationBed(event.target.value)} placeholder="Bed number (optional)" /></div>
                <Textarea value={activationNotes} onChange={(event) => setActivationNotes(event.target.value)} placeholder="Urgent access or resource note (optional)" rows={2} />
                <div className="flex flex-wrap gap-2"><Button type="button" className="bg-red-600 text-white hover:bg-red-700" onClick={() => activateMutation.mutate({ institutionId: currentTeam.institutionId, teamId: currentTeam.teamId, activationType, location: activationLocation.trim(), bedNumber: activationBed.trim() || undefined, priority: "critical", notes: activationNotes.trim() || undefined })} disabled={activateMutation.isPending || activationLocation.trim().length < 2}>{activateMutation.isPending ? "Activating…" : "Confirm and open ResusGPS"}</Button><Button type="button" variant="outline" onClick={() => setShowActivationConfirm(null)}>Cancel</Button></div>
              </div>
            )}
          </div>
        )}
        {visibleTeams.filter((team) => team.teamState === "current").map((team) => {
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
                  <strong>ERTL / Scene Commander:</strong> Role assigned · {ertlAssignment.assignmentStatus.replaceAll("_", " ")}
                </p>
              ) : (
                <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">The ERTL has not yet been projected for this dated team. Confirm the leading department and staff its UTL for this exact shift; the accepted UTL will then receive the ERTL request.</p>
              )}

              <div className="space-y-2">
                {groupAssignmentsByProvider(team.assignments).map((providerAssignments) => {
                  const provider = providerAssignments[0];
                  if (!provider) return null;
                  return (
                    <div key={`provider-${provider.providerUserId}`} className={`rounded-lg border p-3 ${provider.isCurrentUser ? "border-rose-300 bg-rose-50/60" : "bg-slate-50/50"}`}>
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-medium">{provider.providerName}</p>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {providerAssignments.map((assignment) => <Badge key={`role-${assignment.id}`} variant={assignment.roleScope === "ertl" ? "default" : "outline"} className="whitespace-normal text-left">{assignmentLabel(assignment)}</Badge>)}
                          </div>
                        </div>
                        <span className="text-xs text-muted-foreground">{provider.departmentName ?? "Team member"}</span>
                      </div>
                      <div className="mt-2 space-y-2">
                        {providerAssignments.map((assignment) => (
                          <div key={assignment.id} className="rounded-md border bg-white/80 p-2">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <p className="text-xs font-medium">{assignmentLabel(assignment)}</p>
                              <Badge variant={statusVariant(assignment.assignmentStatus)}>{assignment.assignmentStatus.replaceAll("_", " ")}</Badge>
                            </div>
                            {assignment.isCurrentUser && ["approved", "pending_acceptance"].includes(assignment.assignmentStatus) && (
                              <div className="mt-2 flex flex-wrap gap-2">
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
                    </div>
                  );
                })}
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

              {isAcceptedErtl && (
                <div className="rounded-lg border border-violet-200 bg-violet-50 p-3 space-y-3">
                  <p className="text-sm font-semibold">Add an ERT member</p>
                  <p className="text-xs text-muted-foreground">Select an eligible active linked Staff/RN provider from this pole. The provider will receive the role and must accept or decline it.</p>
                  {memberCandidatesQuery.isLoading ? <p className="text-xs text-muted-foreground">Loading eligible providers…</p> : memberCandidatesQuery.isError ? <p className="text-xs text-destructive">Eligible providers could not be loaded. Refresh the team and try again.</p> : (memberCandidatesQuery.data ?? []).length === 0 ? <p className="text-xs text-muted-foreground">No unassigned eligible provider is available in this pole. Confirm their active link, department, and Staff/RN profile first.</p> : (() => {
                    const nomination = nominationState[team.teamId] ?? { providerUserId: "", roleKey: "", reason: "" };
                    return <div className="space-y-2">
                      <select className="h-9 w-full rounded-md border bg-background px-3 text-sm" aria-label="ERT member provider" value={nomination.providerUserId} onChange={(event) => setNominationState((previous) => ({ ...previous, [team.teamId]: { ...nomination, providerUserId: event.target.value } }))}>
                        <option value="">Choose provider</option>
                        {(memberCandidatesQuery.data ?? []).map((candidate) => <option key={candidate.providerUserId} value={candidate.providerUserId}>{candidate.providerName} · {candidate.departmentName ?? "Department"}</option>)}
                      </select>
                      <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                        <select className="h-9 rounded-md border bg-background px-3 text-sm" aria-label="ERT member role" value={nomination.roleKey} onChange={(event) => setNominationState((previous) => ({ ...previous, [team.teamId]: { ...nomination, roleKey: event.target.value } }))}>
                          <option value="">Choose role</option>
                          {ERT_MEMBER_ROLES.map(([key, label]) => <option key={key} value={key}>{label}</option>)}
                        </select>
                        <Textarea value={nomination.reason} onChange={(event) => setNominationState((previous) => ({ ...previous, [team.teamId]: { ...nomination, reason: event.target.value } }))} placeholder="Reason for the assignment" rows={1} />
                      </div>
                      <Button type="button" size="sm" onClick={() => nominateMemberRoleMutation.mutate({ teamId: team.teamId, providerUserId: Number(nomination.providerUserId), roleKey: nomination.roleKey, reason: nomination.reason })} disabled={nominateMemberRoleMutation.isPending || !nomination.providerUserId || !nomination.roleKey || nomination.reason.trim().length < 3}>
                        {nominateMemberRoleMutation.isPending ? "Assigning…" : "Assign and request acceptance"}
                      </Button>
                    </div>;
                  })()}
                </div>
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
        {futureTeams.length > 0 && (
          <div className="rounded-lg border border-slate-200 bg-white p-3">
            <Button type="button" variant="ghost" className="w-full justify-between" onClick={() => setShowActivationConfirm(showActivationConfirm === -1 ? null : -1)} aria-expanded={showActivationConfirm === -1}>
              <span>Upcoming teams ({futureTeams.length})</span><span className="text-xs text-muted-foreground">{showActivationConfirm === -1 ? "Hide" : "View"}</span>
            </Button>
            {showActivationConfirm === -1 && (
              <div className="mt-2 space-y-3">
                {futureTeams.map((team) => {
                  const acceptedErtl = team.assignments.some((assignment) => assignment.isCurrentUser && assignment.roleScope === "ertl" && assignment.assignmentStatus === "accepted");
                  const futureUtlAssignments = team.assignments.filter((assignment) => assignment.roleScope === "utl" && assignment.shiftUtlRosterId != null && ["approved", "pending_acceptance", "accepted"].includes(assignment.assignmentStatus));
                  return (
                    <div key={`future-${team.teamId}`} className="rounded-md border p-3 text-sm">
                      <p className="font-medium">{team.poleName} · {team.shiftType}</p>
                      <p className="text-xs text-muted-foreground">{new Date(team.shiftDate).toLocaleDateString()} · {team.shiftStartTime.slice(0, 5)}–{team.shiftEndTime.slice(0, 5)}{team.shiftEndDayOffset === 1 ? " (+1 day)" : ""}</p>
                      {acceptedErtl && futureUtlAssignments.length > 0 && (
                        <div className="mt-3 space-y-2 border-t pt-3">
                          <p className="text-xs font-medium">Correct a future UTL assignment</p>
                          {futureUtlAssignments.map((assignment) => {
                            const rosterId = assignment.shiftUtlRosterId;
                            if (rosterId == null) return null;
                            return (
                              <div key={`future-utl-${assignment.id}`} className="rounded-md bg-slate-50 p-2">
                                <p className="text-xs">{assignment.providerName} · {assignment.departmentName ?? "Department"}</p>
                                {cancelRosterId !== rosterId ? (
                                  <Button type="button" size="sm" variant="outline" className="mt-2 border-rose-300 text-rose-800 hover:bg-rose-50" onClick={() => { setCancelRosterId(rosterId); setCancelReason(""); }}>Cancel future UTL</Button>
                                ) : (
                                  <div className="mt-2 space-y-2">
                                    <Input value={cancelReason} onChange={(event) => setCancelReason(event.target.value)} placeholder="Reason (required)" className="bg-white text-xs" />
                                    <div className="flex flex-wrap gap-2">
                                      <Button type="button" size="sm" variant="destructive" onClick={() => cancelUtlMutation.mutate({ institutionId: assignment.institutionId, rosterId, reason: cancelReason.trim() })} disabled={cancelUtlMutation.isPending || cancelReason.trim().length < 3}>{cancelUtlMutation.isPending ? "Canceling…" : "Confirm cancellation"}</Button>
                                      <Button type="button" size="sm" variant="outline" onClick={() => setCancelRosterId(null)} disabled={cancelUtlMutation.isPending}>Keep</Button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
