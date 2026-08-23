import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarClock, CheckCircle2, Clock3, ShieldCheck, UserRound, XCircle } from "lucide-react";
import { toast } from "sonner";

function formatDate(value: Date | string | null | undefined): string {
  if (!value) return "Open-ended";
  return new Date(value).toLocaleDateString();
}

function formatShiftInterval(startTime: string | null | undefined, endTime: string | null | undefined, endDayOffset: number | null | undefined): string {
  if (!startTime || !endTime) return "Exact hours pending";
  return `${startTime.slice(0, 5)}–${endTime.slice(0, 5)}${endDayOffset === 1 ? " (+1 day)" : ""}`;
}

function responseReason(): string | null {
  const reason = window.prompt("Why are you declining? This helps the institution arrange cover.");
  return reason?.trim() || null;
}

export default function ProviderIersDutyAssignmentCard() {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const { data: ercoAssignments, isLoading: ercoLoading } = trpc.institution.getMyDepartmentResponseAssignments.useQuery(undefined, {
    enabled: !!user,
    staleTime: 15_000,
  });
  const { data: dutyAssignments, isLoading: dutyLoading } = trpc.institution.getMyProviderDutyAssignments.useQuery(undefined, {
    enabled: !!user,
    staleTime: 15_000,
  });
  const refreshAssignments = () => {
    void utils.institution.getMyDepartmentResponseAssignments.invalidate();
    void utils.institution.getMyProviderDutyAssignments.invalidate();
    void utils.iers.getMyShiftReadiness.invalidate();
  };
  const respondCoordinator = trpc.institution.respondToDepartmentResponseCoordinatorAssignment.useMutation({
    onSuccess: () => { toast.success("Your ERCo response was recorded."); refreshAssignments(); },
    onError: (error) => toast.error(error.message || "Could not record your ERCo response."),
  });
  const respondAssistant = trpc.institution.respondToDepartmentResponseBackup.useMutation({
    onSuccess: () => { toast.success("Your Assistant ERCo response was recorded."); refreshAssignments(); },
    onError: (error) => toast.error(error.message || "Could not record your Assistant ERCo response."),
  });
  const respondErtl = trpc.institution.respondToWeeklyErtlRotation.useMutation({
    onSuccess: () => { toast.success("Your ERTL response was recorded."); refreshAssignments(); },
    onError: (error) => toast.error(error.message || "Could not record your ERTL response."),
  });
  const respondUtl = trpc.institution.respondToShiftUtlRoster.useMutation({
    onSuccess: () => { toast.success("Your shift UTL response was recorded."); refreshAssignments(); },
    onError: (error) => toast.error(error.message || "Could not record your shift UTL response."),
  });

  if (ercoLoading || dutyLoading) return null;
  const hasErco = Boolean(ercoAssignments?.length);
  const hasErtl = Boolean(dutyAssignments?.ertl?.length);
  const hasUtl = Boolean(dutyAssignments?.utl?.length);
  const nextUtl = dutyAssignments?.nextUtl ?? null;
  const nextErtl = dutyAssignments?.nextErtl ?? null;
  if (!hasErco && !hasErtl && !hasUtl) return null;

  const renderErtlActions = (assignment: NonNullable<typeof dutyAssignments>["ertl"][number]) => {
    if (assignment.assignmentStatus !== "pending_acceptance") return null;
    return <div className="mt-3 flex flex-wrap gap-2"><Button size="sm" onClick={() => respondErtl.mutate({ rotationId: assignment.id, response: "accept" })} disabled={respondErtl.isPending}><CheckCircle2 className="mr-1.5 h-4 w-4" />Accept ERTL duty</Button><Button size="sm" variant="outline" onClick={() => { const reason = responseReason(); if (reason) respondErtl.mutate({ rotationId: assignment.id, response: "decline", declineReason: reason }); }} disabled={respondErtl.isPending}><XCircle className="mr-1.5 h-4 w-4" />Decline</Button></div>;
  };

  const renderUtlActions = (assignment: NonNullable<typeof dutyAssignments>["utl"][number]) => {
    if (assignment.assignmentStatus !== "pending_acceptance") return null;
    return <div className="mt-3 flex flex-wrap gap-2"><Button size="sm" onClick={() => respondUtl.mutate({ rosterId: assignment.id, response: "accept" })} disabled={respondUtl.isPending}><CheckCircle2 className="mr-1.5 h-4 w-4" />Accept shift duty</Button><Button size="sm" variant="outline" onClick={() => { const reason = responseReason(); if (reason) respondUtl.mutate({ rosterId: assignment.id, response: "decline", declineReason: reason }); }} disabled={respondUtl.isPending}><XCircle className="mr-1.5 h-4 w-4" />Decline</Button></div>;
  };

  return (
    <div className="space-y-4">
      {hasErco && (
        <Card className="border-rose-200 bg-rose-50/30 overflow-hidden">
          <CardHeader className="border-b border-rose-100 bg-white/60">
            <CardTitle className="flex items-center gap-2 text-rose-950"><ShieldCheck className="h-5 w-5 text-rose-700" />IERS department governance appointments</CardTitle>
            <CardDescription>ERCo is a standing governance champion for the department. It is not a day-to-day response assignment. Shift participation is separately assigned as UTL or ERTL.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-5">
            {ercoAssignments?.map((assignment) => {
              const isCoordinator = assignment.coordinatorUserId === user?.id;
              const isAssistant = assignment.backupUserId === user?.id;
              const needsCoordinatorResponse = isCoordinator && assignment.assignmentStatus === "pending_acceptance";
              const needsAssistantResponse = isAssistant && !assignment.backupAcceptedAt && !assignment.backupDeclinedAt && assignment.assignmentStatus !== "ended";
              const canPrepareMonthlyRota = isCoordinator && assignment.assignmentStatus === "active" && assignment.poleId != null;
              return (
                <div key={assignment.id} className="rounded-lg border bg-background p-4">
                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                    <div>
                      <p className="font-semibold">{assignment.departmentName ?? `Department ${assignment.departmentId}`}</p>
                      <p className="text-sm text-muted-foreground">{assignment.poleName ? `${assignment.poleName} response pole · ` : ""}Governance appointment: {formatDate(assignment.effectiveFrom)} – {formatDate(assignment.effectiveUntil)}</p>
                    </div>
                    <Badge variant={assignment.assignmentStatus === "active" ? "default" : assignment.assignmentStatus === "declined" ? "destructive" : "secondary"}>
                      {assignment.assignmentStatus === "active" ? "ERCo active" : assignment.assignmentStatus === "pending_acceptance" ? "Response required" : assignment.assignmentStatus === "declined" ? "Declined" : "Ended"}
                    </Badge>
                  </div>
                  <div className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
                    <div className="flex items-center gap-2"><UserRound className="h-3.5 w-3.5" />You are {isCoordinator ? "the named ERCo" : isAssistant ? "the named Assistant ERCo" : "linked to this appointment"}.</div>
                    <div className="flex items-center gap-2"><CalendarClock className="h-3.5 w-3.5" />{assignment.backupUserId ? assignment.backupAcceptedAt ? "Assistant ERCo has accepted" : assignment.backupDeclinedAt ? "Assistant ERCo declined" : "Assistant ERCo response pending" : "No Assistant ERCo recorded"}</div>
                  </div>
                  {canPrepareMonthlyRota && (
                    <div className="mt-4 flex flex-col gap-2 rounded-md border border-rose-200 bg-rose-50/50 p-3 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-xs text-rose-900">As the accepted ERCo, open Shift staffing and choose the actual department nurse for each date and shift.</p>
                      <Button type="button" size="sm" variant="outline" className="w-full shrink-0 sm:w-auto" onClick={() => { window.location.assign("/iers/staffing"); }}><CalendarClock className="mr-1.5 h-4 w-4" />Manage UTL staffing</Button>
                    </div>
                  )}
                  {(needsCoordinatorResponse || needsAssistantResponse) && (
                    <Alert className="mt-4 border-amber-200 bg-amber-50/70">
                      <Clock3 className="h-4 w-4 text-amber-700" />
                      <AlertTitle>Confirm your governance appointment</AlertTitle>
                      <AlertDescription className="mt-2 flex flex-wrap gap-2">
                        {needsCoordinatorResponse && <><Button size="sm" onClick={() => respondCoordinator.mutate({ assignmentId: assignment.id, response: "accept" })} disabled={respondCoordinator.isPending}><CheckCircle2 className="mr-1.5 h-4 w-4" />Accept ERCo appointment</Button><Button size="sm" variant="outline" onClick={() => { const reason = responseReason(); if (reason) respondCoordinator.mutate({ assignmentId: assignment.id, response: "decline", declineReason: reason }); }} disabled={respondCoordinator.isPending}><XCircle className="mr-1.5 h-4 w-4" />Decline</Button></>}
                        {needsAssistantResponse && <><Button size="sm" onClick={() => respondAssistant.mutate({ assignmentId: assignment.id, response: "accept" })} disabled={respondAssistant.isPending}><CheckCircle2 className="mr-1.5 h-4 w-4" />Accept Assistant ERCo</Button><Button size="sm" variant="outline" onClick={() => { const reason = responseReason(); if (reason) respondAssistant.mutate({ assignmentId: assignment.id, response: "decline", declineReason: reason }); }} disabled={respondAssistant.isPending}><XCircle className="mr-1.5 h-4 w-4" />Decline</Button></>}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {(hasErtl || hasUtl) && (
        <Card className="border-amber-200 bg-amber-50/20 overflow-hidden">
          <CardHeader className="border-b border-amber-100 bg-white/60">
            <CardTitle className="flex items-center gap-2 text-amber-950"><CalendarClock className="h-5 w-5 text-amber-700" />Next IERS duty</CardTitle>
            <CardDescription>Your next actionable UTL or ERTL duty is shown first. Open the complete rota only when you need the full schedule.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 pt-5">
            {nextUtl ? <div className="rounded-lg border bg-background p-4"><div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start"><div><p className="font-semibold">{nextUtl.isShiftErtl ? "Next shift ERTL" : "Next shift UTL"} · {nextUtl.departmentName ?? `Department ${nextUtl.departmentId}`}</p><p className="text-sm text-muted-foreground">{nextUtl.poleName ? `${nextUtl.poleName} · ` : ""}{formatDate(nextUtl.shiftDate)} · {nextUtl.shiftType} · {formatShiftInterval(nextUtl.shiftStartTime, nextUtl.shiftEndTime, nextUtl.shiftEndDayOffset)}</p></div><Badge variant={nextUtl.assignmentStatus === "active" ? "default" : nextUtl.assignmentStatus === "declined" ? "destructive" : "secondary"}>{nextUtl.assignmentStatus === "pending_acceptance" ? "Response required" : nextUtl.assignmentStatus}</Badge></div>{renderUtlActions(nextUtl)}</div> : <p className="rounded-md border bg-background p-3 text-sm text-muted-foreground">No upcoming UTL shift currently assigned.</p>}
            {nextErtl ? <div className="rounded-lg border bg-background p-4"><div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start"><div><p className="font-semibold">Next ERTL · {nextErtl.departmentName ?? `Department ${nextErtl.departmentId}`}</p><p className="text-sm text-muted-foreground">{nextErtl.poleName ? `${nextErtl.poleName} · ` : ""}{formatDate(nextErtl.startDate)} – {formatDate(nextErtl.endDate)} · Week {nextErtl.weekNumber}, {nextErtl.year}</p></div><Badge variant={nextErtl.assignmentStatus === "active" ? "default" : nextErtl.assignmentStatus === "declined" ? "destructive" : "secondary"}>{nextErtl.assignmentStatus === "pending_acceptance" ? "Response required" : nextErtl.assignmentStatus}</Badge></div>{renderErtlActions(nextErtl)}</div> : <p className="rounded-md border bg-background p-3 text-sm text-muted-foreground">No upcoming ERTL duty currently assigned.</p>}

            <details className="rounded-lg border bg-background p-4">
              <summary className="cursor-pointer text-sm font-semibold">View complete UTL and ERTL rota ({(dutyAssignments?.utl?.length ?? 0) + (dutyAssignments?.ertl?.length ?? 0)} duties)</summary>
              <div className="mt-4 space-y-3">
                {dutyAssignments?.ertl?.map((assignment) => <div key={`full-ertl-${assignment.id}`} className="rounded-md border p-3"><div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start"><div><p className="font-medium">ERTL · {assignment.departmentName ?? `Department ${assignment.departmentId}`}</p><p className="text-xs text-muted-foreground">{assignment.poleName ? `${assignment.poleName} · ` : ""}{formatDate(assignment.startDate)} – {formatDate(assignment.endDate)} · Week {assignment.weekNumber}, {assignment.year}</p></div><Badge variant={assignment.assignmentStatus === "active" ? "default" : assignment.assignmentStatus === "declined" ? "destructive" : "secondary"}>{assignment.assignmentStatus === "pending_acceptance" ? "Response required" : assignment.assignmentStatus}</Badge></div>{renderErtlActions(assignment)}</div>)}
                {dutyAssignments?.utl?.map((assignment) => <div key={`full-utl-${assignment.id}`} className="rounded-md border p-3"><div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start"><div><p className="font-medium">{assignment.isShiftErtl ? "Shift ERTL" : "Shift UTL"} · {assignment.departmentName ?? `Department ${assignment.departmentId}`}</p><p className="text-xs text-muted-foreground">{assignment.poleName ? `${assignment.poleName} · ` : ""}{formatDate(assignment.shiftDate)} · {assignment.shiftType} · {formatShiftInterval(assignment.shiftStartTime, assignment.shiftEndTime, assignment.shiftEndDayOffset)}</p></div><Badge variant={assignment.assignmentStatus === "active" ? "default" : assignment.assignmentStatus === "declined" ? "destructive" : "secondary"}>{assignment.assignmentStatus === "pending_acceptance" ? "Response required" : assignment.assignmentStatus}</Badge></div>{renderUtlActions(assignment)}</div>)}
              </div>
            </details>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
