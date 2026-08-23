import { useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, CheckCircle2, ClipboardList, UserRound, UsersRound } from "lucide-react";
import { toast } from "sonner";

interface InstitutionErcoGovernancePanelProps {
  institutionId: number;
}

const today = () => new Date().toISOString().slice(0, 10);

function statusLabel(status: string | undefined): string {
  switch (status) {
    case "active": return "Accepted governance appointment";
    case "pending_acceptance": return "Awaiting governance acceptance";
    case "declined": return "Declined — reassign required";
    case "ended": return "Ended";
    default: return "Not assigned";
  }
}

export function InstitutionErcoGovernancePanel({ institutionId }: InstitutionErcoGovernancePanelProps) {
  const utils = trpc.useUtils();
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<number | null>(null);
  const [coordinatorUserId, setCoordinatorUserId] = useState("");
  const [backupUserId, setBackupUserId] = useState("none");
  const [effectiveFrom, setEffectiveFrom] = useState(today);
  const [effectiveUntil, setEffectiveUntil] = useState("");

  const { data: departments, isLoading: departmentsLoading } = trpc.institution.getFacilityDepartments.useQuery(
    { institutionId },
    { enabled: !!institutionId },
  );
  const { data: staffMembers, isLoading: staffLoading } = trpc.institution.getStaffMembers.useQuery(
    { institutionId },
    { enabled: !!institutionId },
  );
  const { data: assignments, isLoading: assignmentsLoading } = trpc.institution.getDepartmentResponseCoordinators.useQuery(
    { institutionId },
    { enabled: !!institutionId },
  );
  const { data: assignmentEvents } = trpc.institution.getDepartmentResponseCoordinatorEvents.useQuery(
    selectedDepartmentId ? { institutionId, departmentId: selectedDepartmentId } : { institutionId },
    { enabled: !!institutionId && selectedDepartmentId != null, staleTime: 10_000 },
  );

  const activeStaff = useMemo(
    () => (staffMembers ?? []).filter((staff) => staff.userId != null),
    [staffMembers],
  );
  const selectedDepartment = departments?.find((department) => department.id === selectedDepartmentId) ?? null;
  const departmentNurseCandidates = useMemo(() => {
    if (!selectedDepartment) return [];
    const departmentName = selectedDepartment.departmentName.trim().toLowerCase();
    return activeStaff.filter((staff) =>
      staff.staffRole === "nurse" && (
        staff.facilityDepartmentId === selectedDepartment.id ||
        (staff.facilityDepartmentId == null && staff.department?.trim().toLowerCase() === departmentName)
      )
    );
  }, [activeStaff, selectedDepartment]);
  const selectedAssignment = assignments?.find((assignment) => assignment.departmentId === selectedDepartmentId) ?? null;

  const assignMutation = trpc.institution.assignDepartmentResponseCoordinator.useMutation({
    onSuccess: () => {
      toast.success("ERCo assignment saved and sent for acceptance.");
      void utils.institution.getDepartmentResponseCoordinators.invalidate({ institutionId });
      if (selectedDepartmentId != null) {
        void utils.institution.getDepartmentResponseCoordinatorEvents.invalidate({ institutionId, departmentId: selectedDepartmentId });
      }
    },
    onError: (error) => toast.error(error.message || "Could not save the ERCo assignment."),
  });

  const chooseDepartment = (departmentId: number) => {
    const assignment = assignments?.find((item) => item.departmentId === departmentId);
    setSelectedDepartmentId(departmentId);
    setCoordinatorUserId(assignment?.coordinatorUserId ? String(assignment.coordinatorUserId) : "");
    setBackupUserId(assignment?.backupUserId ? String(assignment.backupUserId) : "none");
    setEffectiveFrom(assignment?.effectiveFrom ? new Date(assignment.effectiveFrom).toISOString().slice(0, 10) : today());
    setEffectiveUntil(assignment?.effectiveUntil ? new Date(assignment.effectiveUntil).toISOString().slice(0, 10) : "");
  };

  const saveAssignment = () => {
    if (!selectedDepartmentId || !coordinatorUserId) {
      toast.error("Select a department and an active provider before saving.");
      return;
    }
    assignMutation.mutate({
      institutionId,
      departmentId: selectedDepartmentId,
      coordinatorUserId: Number(coordinatorUserId),
      backupUserId: backupUserId === "none" ? null : Number(backupUserId),
      effectiveFrom,
      effectiveUntil: effectiveUntil || null,
    });
  };

  if (departmentsLoading || staffLoading || assignmentsLoading) {
    return <Card><CardContent className="py-8 text-sm text-muted-foreground">Loading department ERCo governance…</CardContent></Card>;
  }

  return (
    <Card className="border-violet-200 bg-violet-50/30 dark:border-violet-900 dark:bg-violet-950/10">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><ClipboardList className="h-5 w-5 text-violet-700" />Department ERCo governance</CardTitle>
        <CardDescription>
          Each department has exactly one standing Emergency Readiness Coordinator (ERCo), appointed as its governance champion. The appointment is accepted by the named provider and can include one optional Assistant ERCo.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="rounded-lg border border-violet-200 bg-background p-3 text-sm dark:border-violet-900">
          <div className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-violet-700" />
            <p className="text-muted-foreground">An ERCo coordinates readiness governance and represents the department in the Emergency Response Committee (ERC). This appointment is not day-to-day emergency response coverage. The ERCo is part of an ERT only when separately nominated and accepted for a dated UTL or ERTL duty.</p>
          </div>
        </div>

        {!departments?.length ? (
          <p className="py-6 text-center text-sm italic text-muted-foreground">Create at least one department in the ERT roster before assigning an ERCo.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border bg-background">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="border-b bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr><th className="p-3">Department</th><th className="p-3">ERCo champion</th><th className="p-3">Appointment status</th><th className="p-3">Assistant ERCo</th><th className="p-3 text-right">Action</th></tr>
              </thead>
              <tbody>
                {departments.map((department) => {
                  const assignment = assignments?.find((item) => item.departmentId === department.id);
                  const coordinator = activeStaff.find((staff) => staff.userId === assignment?.coordinatorUserId);
                  return (
                    <tr key={department.id} className="border-b last:border-0">
                      <td className="p-3 font-medium">{department.departmentName}</td>
                      <td className="p-3">{coordinator?.staffName ?? "Not assigned"}</td>
                      <td className="p-3">
                        <Badge variant={assignment?.assignmentStatus === "active" ? "default" : "secondary"}>{statusLabel(assignment?.assignmentStatus)}</Badge>
                      </td>
                      <td className="p-3 text-xs text-muted-foreground">
                        {assignment?.backupUserId ? (assignment.backupAcceptedAt ? "Accepted" : assignment.backupDeclinedAt ? "Declined" : "Awaiting response") : "No Assistant ERCo"}
                      </td>
                      <td className="p-3 text-right"><Button size="sm" variant="outline" onClick={() => chooseDepartment(department.id)}>Configure</Button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {selectedDepartment && (
          <div className="grid gap-4 rounded-lg border bg-background p-4 md:grid-cols-2">
            <div className="md:col-span-2 flex items-center justify-between gap-3">
              <div><p className="font-semibold">Configure {selectedDepartment.departmentName} governance</p><p className="text-xs text-muted-foreground">This sets the department’s standing readiness champion. Saving replaces the current appointment for this department; it does not create a second ERCo row or assign shift coverage.</p></div>
              {selectedAssignment?.assignmentStatus === "active" && <Badge className="gap-1"><CheckCircle2 className="h-3.5 w-3.5" />Governance appointment active</Badge>}
            </div>
            <label className="space-y-1 text-sm"><span className="font-medium">Emergency Readiness Coordinator (ERCo)</span><Select value={coordinatorUserId} onValueChange={setCoordinatorUserId}><SelectTrigger><SelectValue placeholder="Select department nurse" /></SelectTrigger><SelectContent>{departmentNurseCandidates.map((staff) => <SelectItem key={staff.userId} value={String(staff.userId)}><span className="flex items-center gap-2"><UserRound className="h-3.5 w-3.5" />{staff.staffName} ({staff.staffRole})</span></SelectItem>)}</SelectContent></Select>{departmentNurseCandidates.length === 0 && <span className="block text-xs text-amber-700 dark:text-amber-300">No active linked nurse is registered with this department yet.</span>}</label>
            <label className="space-y-1 text-sm"><span className="font-medium">Assistant ERCo <span className="font-normal text-muted-foreground">(optional)</span></span><Select value={backupUserId} onValueChange={setBackupUserId}><SelectTrigger><SelectValue placeholder="Select assistant nurse" /></SelectTrigger><SelectContent><SelectItem value="none">No Assistant ERCo</SelectItem>{departmentNurseCandidates.filter((staff) => String(staff.userId) !== coordinatorUserId).map((staff) => <SelectItem key={staff.userId} value={String(staff.userId)}><span className="flex items-center gap-2"><UsersRound className="h-3.5 w-3.5" />{staff.staffName} ({staff.staffRole})</span></SelectItem>)}</SelectContent></Select></label>
            <label className="space-y-1 text-sm"><span className="font-medium">Appointment starts</span><span className="block text-xs font-normal text-muted-foreground">When this governance appointment becomes valid.</span><Input type="date" value={effectiveFrom} onChange={(event) => setEffectiveFrom(event.target.value)} /></label>
            <label className="space-y-1 text-sm"><span className="font-medium">Appointment ends <span className="font-normal text-muted-foreground">(optional)</span></span><span className="block text-xs font-normal text-muted-foreground">Leave blank for an ongoing appointment; use only when formally replaced or ended.</span><Input type="date" value={effectiveUntil} onChange={(event) => setEffectiveUntil(event.target.value)} /></label>
            <div className="md:col-span-2 flex justify-end"><Button onClick={saveAssignment} disabled={assignMutation.isPending}>{assignMutation.isPending ? "Saving…" : "Save governance appointment"}</Button></div>
            <div className="md:col-span-2 rounded-lg border bg-muted/20 p-3">
              <p className="text-sm font-semibold">Assignment history</p>
              <p className="mb-2 text-xs text-muted-foreground">This append-only history records governance appointment assignment, acceptance, decline, reassignment, and formal end. It does not represent day-to-day emergency coverage.</p>
              {!assignmentEvents?.length ? <p className="text-xs italic text-muted-foreground">No history is available yet for this department.</p> : <div className="space-y-2">{assignmentEvents.slice(0, 8).map((event) => <div key={event.id} className="flex flex-col gap-1 border-b pb-2 text-xs last:border-0 last:pb-0 sm:flex-row sm:items-start sm:justify-between"><div><span className="font-medium">{event.eventType.replaceAll("_", " ")}</span><span className="text-muted-foreground"> · {event.actorName ?? `User ${event.actorUserId}`}</span>{event.note && <p className="text-muted-foreground">{event.note}</p>}</div><span className="text-muted-foreground">{new Date(event.createdAt).toLocaleString()}</span></div>)}</div>}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
