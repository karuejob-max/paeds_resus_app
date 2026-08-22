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
  const respondBackup = trpc.institution.respondToDepartmentResponseBackup.useMutation({
    onSuccess: () => { toast.success("Your backup response was recorded."); refreshAssignments(); },
    onError: (error) => toast.error(error.message || "Could not record your backup response."),
  });
  const respondErtl = trpc.institution.respondToWeeklyErtlRotation.useMutation({
    onSuccess: () => { toast.success("Your ERTL response was recorded."); refreshAssignments(); },
    onError: (error) => toast.error(error.message || "Could not record your ERTL response."),
  });
  const respondUtl = trpc.institution.respondToShiftUtlRoster.useMutation({
    onSuccess: () => { toast.success("Your shift UTL response was recorded."); refreshAssignments(); },
    onError: (error) => toast.error(error.message || "Could not record your shift UTL response."),
  });
  const autopopulateMonthlyRota = trpc.institution.autopopulateMonthlyUtlRota.useMutation({
    onSuccess: (result) => toast.success(`Monthly UTL rota prepared: ${result.assignedDepartments} department and ${result.generatedShifts} shift assignment(s).`),
    onError: (error) => toast.error(error.message || "Could not prepare the monthly UTL rota."),
  });

  if (ercoLoading || dutyLoading) return null;
  const hasErco = Boolean(ercoAssignments?.length);
  const hasErtl = Boolean(dutyAssignments?.ertl?.length);
  const hasUtl = Boolean(dutyAssignments?.utl?.length);
  if (!hasErco && !hasErtl && !hasUtl) return null;

  return (
    <div className="space-y-4">
      {hasErco && (
        <Card className="border-rose-200 bg-rose-50/30 overflow-hidden">
          <CardHeader className="border-b border-rose-100 bg-white/60">
            <CardTitle className="flex items-center gap-2 text-rose-950"><ShieldCheck className="h-5 w-5 text-rose-700" />IERS department coordinator duties</CardTitle>
            <CardDescription>Standing department responsibility is separate from ordinary institution membership. Accept only a duty you can cover.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-5">
            {ercoAssignments?.map((assignment) => {
              const isCoordinator = assignment.coordinatorUserId === user?.id;
              const isBackup = assignment.backupUserId === user?.id;
              const needsCoordinatorResponse = isCoordinator && assignment.assignmentStatus === "pending_acceptance";
              const needsBackupResponse = isBackup && !assignment.backupAcceptedAt && !assignment.backupDeclinedAt && assignment.assignmentStatus !== "ended";
              const canPrepareMonthlyRota = isCoordinator && assignment.assignmentStatus === "active" && assignment.poleId != null;
              return (
                <div key={assignment.id} className="rounded-lg border bg-background p-4">
                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                    <div>
                      <p className="font-semibold">{assignment.departmentName ?? `Department ${assignment.departmentId}`}</p>
                      <p className="text-sm text-muted-foreground">{assignment.poleName ? `${assignment.poleName} response pole · ` : ""}Effective {formatDate(assignment.effectiveFrom)} – {formatDate(assignment.effectiveUntil)}</p>
                    </div>
                    <Badge variant={assignment.assignmentStatus === "active" ? "default" : assignment.assignmentStatus === "declined" ? "destructive" : "secondary"}>
                      {assignment.assignmentStatus === "active" ? "ERCo active" : assignment.assignmentStatus === "pending_acceptance" ? "Response required" : assignment.assignmentStatus === "declined" ? "Declined" : "Ended"}
                    </Badge>
                  </div>
                  <div className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
                    <div className="flex items-center gap-2"><UserRound className="h-3.5 w-3.5" />You are {isCoordinator ? "the named ERCo" : isBackup ? "the named backup" : "linked to this assignment"}.</div>
                    <div className="flex items-center gap-2"><CalendarClock className="h-3.5 w-3.5" />{assignment.backupUserId ? assignment.backupAcceptedAt ? "Backup has accepted" : assignment.backupDeclinedAt ? "Backup declined" : "Backup response pending" : "No backup recorded"}</div>
                  </div>
                  {canPrepareMonthlyRota && (
                    <div className="mt-4 flex flex-col gap-2 rounded-md border border-rose-200 bg-rose-50/50 p-3 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-xs text-rose-900">As the accepted ERCo, prepare this department’s current monthly UTL rota from its linked providers.</p>
                      <Button size="sm" variant="outline" className="w-full shrink-0 sm:w-auto" onClick={() => {
                        if (assignment.poleId == null) return;
                        const monthStart = `${new Date().toISOString().slice(0, 7)}-01`;
                        autopopulateMonthlyRota.mutate({
                          institutionId: assignment.institutionId,
                          poleId: assignment.poleId,
                          monthStart,
                          departmentIds: [assignment.departmentId],
                        });
                      }} disabled={autopopulateMonthlyRota.isPending}>
                        <CalendarClock className="mr-1.5 h-4 w-4" />Prepare monthly UTL rota
                      </Button>
                    </div>
                  )}
                  {(needsCoordinatorResponse || needsBackupResponse) && (
                    <Alert className="mt-4 border-amber-200 bg-amber-50/70">
                      <Clock3 className="h-4 w-4 text-amber-700" />
                      <AlertTitle>Confirm your responsibility</AlertTitle>
                      <AlertDescription className="mt-2 flex flex-wrap gap-2">
                        {needsCoordinatorResponse && <>
                          <Button size="sm" onClick={() => respondCoordinator.mutate({ assignmentId: assignment.id, response: "accept" })} disabled={respondCoordinator.isPending}><CheckCircle2 className="mr-1.5 h-4 w-4" />Accept ERCo duty</Button>
                          <Button size="sm" variant="outline" onClick={() => { const reason = responseReason(); if (reason) respondCoordinator.mutate({ assignmentId: assignment.id, response: "decline", declineReason: reason }); }} disabled={respondCoordinator.isPending}><XCircle className="mr-1.5 h-4 w-4" />Decline</Button>
                        </>}
                        {needsBackupResponse && <>
                          <Button size="sm" onClick={() => respondBackup.mutate({ assignmentId: assignment.id, response: "accept" })} disabled={respondBackup.isPending}><CheckCircle2 className="mr-1.5 h-4 w-4" />Accept backup</Button>
                          <Button size="sm" variant="outline" onClick={() => { const reason = responseReason(); if (reason) respondBackup.mutate({ assignmentId: assignment.id, response: "decline", declineReason: reason }); }} disabled={respondBackup.isPending}><XCircle className="mr-1.5 h-4 w-4" />Decline backup</Button>
                        </>}
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
            <CardTitle className="flex items-center gap-2 text-amber-950"><CalendarClock className="h-5 w-5 text-amber-700" />IERS dated duty roster</CardTitle>
            <CardDescription>Every dated ERTL or UTL assignment needs an explicit provider response. A roster row is not acceptance.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 pt-5">
            {dutyAssignments?.ertl?.map((assignment) => {
              const needsResponse = assignment.assignmentStatus === "pending_acceptance";
              return <div key={`ertl-${assignment.id}`} className="rounded-lg border bg-background p-4">
                <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start"><div><p className="font-semibold">ERTL · {assignment.departmentName ?? `Department ${assignment.departmentId}`}</p><p className="text-sm text-muted-foreground">{assignment.poleName ? `${assignment.poleName} · ` : ""}{formatDate(assignment.startDate)} – {formatDate(assignment.endDate)} · Week {assignment.weekNumber}, {assignment.year}</p></div><Badge variant={assignment.assignmentStatus === "active" ? "default" : assignment.assignmentStatus === "declined" ? "destructive" : "secondary"}>{assignment.assignmentStatus === "pending_acceptance" ? "Response required" : assignment.assignmentStatus}</Badge></div>
                {needsResponse && <div className="mt-3 flex flex-wrap gap-2"><Button size="sm" onClick={() => respondErtl.mutate({ rotationId: assignment.id, response: "accept" })} disabled={respondErtl.isPending}><CheckCircle2 className="mr-1.5 h-4 w-4" />Accept ERTL duty</Button><Button size="sm" variant="outline" onClick={() => { const reason = responseReason(); if (reason) respondErtl.mutate({ rotationId: assignment.id, response: "decline", declineReason: reason }); }} disabled={respondErtl.isPending}><XCircle className="mr-1.5 h-4 w-4" />Decline</Button></div>}
              </div>;
            })}
            {dutyAssignments?.utl?.map((assignment) => {
              const needsResponse = assignment.assignmentStatus === "pending_acceptance";
              return <div key={`utl-${assignment.id}`} className="rounded-lg border bg-background p-4">
                <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start"><div><p className="font-semibold">{assignment.isShiftErtl ? "Shift ERTL" : "Shift UTL"} · {assignment.departmentName ?? `Department ${assignment.departmentId}`}</p><p className="text-sm text-muted-foreground">{assignment.poleName ? `${assignment.poleName} · ` : ""}{formatDate(assignment.shiftDate)} · {assignment.shiftType} shift</p></div><Badge variant={assignment.assignmentStatus === "active" ? "default" : assignment.assignmentStatus === "declined" ? "destructive" : "secondary"}>{assignment.assignmentStatus === "pending_acceptance" ? "Response required" : assignment.assignmentStatus}</Badge></div>
                {needsResponse && <div className="mt-3 flex flex-wrap gap-2"><Button size="sm" onClick={() => respondUtl.mutate({ rosterId: assignment.id, response: "accept" })} disabled={respondUtl.isPending}><CheckCircle2 className="mr-1.5 h-4 w-4" />Accept shift duty</Button><Button size="sm" variant="outline" onClick={() => { const reason = responseReason(); if (reason) respondUtl.mutate({ rosterId: assignment.id, response: "decline", declineReason: reason }); }} disabled={respondUtl.isPending}><XCircle className="mr-1.5 h-4 w-4" />Decline</Button></div>}
              </div>;
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
