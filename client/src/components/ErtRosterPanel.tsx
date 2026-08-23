import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, Shield, Clock, AlertCircle, Plus, Star, Calendar, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { ErtBillboardWidget } from "./ErtBillboardWidget";

interface ErtRosterPanelProps {
  institutionId: number;
}

/** ISO-8601 week number and year for a given date, used to key the weekly ERTL rotation. */
function getIsoWeek(date: Date): { weekNumber: number; year: number } {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNumber = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return { weekNumber, year: d.getUTCFullYear() };
}

/** Monday..Sunday date range (YYYY-MM-DD) containing the given date. */
function getWeekRange(date: Date): { startDate: string; endDate: string } {
  const day = date.getDay() || 7;
  const monday = new Date(date);
  monday.setDate(date.getDate() - day + 1);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const fmt = (d: Date) => d.toISOString().split("T")[0];
  return { startDate: fmt(monday), endDate: fmt(sunday) };
}

function ProviderReadinessStatus({
  rosterEntry,
}: {
  rosterEntry?: {
    readinessSignOffAt: unknown;
    assignmentStatus: string;
    acceptedAt: unknown;
  };
}) {
  if (!rosterEntry) {
    return <Badge variant="outline" className="text-muted-foreground">No provider duty</Badge>;
  }
  if (rosterEntry.readinessSignOffAt) {
    return (
      <Badge variant="outline" className="text-emerald-600 border-emerald-600 bg-emerald-50 whitespace-normal text-center">
        Provider sign-off complete
      </Badge>
    );
  }
  if (rosterEntry.assignmentStatus === "active" && rosterEntry.acceptedAt) {
    return (
      <Badge variant="outline" className="text-amber-600 border-amber-600 whitespace-normal text-center">
        Provider check-in pending
      </Badge>
    );
  }
  if (rosterEntry.assignmentStatus === "declined") {
    return (
      <Badge variant="outline" className="text-rose-600 border-rose-600 bg-rose-50 whitespace-normal text-center">
        Provider declined
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="text-amber-600 border-amber-600 whitespace-normal text-center">
      Awaiting provider acceptance
    </Badge>
  );
}

function RoleBadge({ isErtl }: { isErtl: boolean }) {
  return isErtl ? (
    <Badge className="bg-amber-600 text-white font-bold gap-1 whitespace-normal text-center">
      <Star className="w-3 h-3 shrink-0" />
      ERTL (Team Leader)
    </Badge>
  ) : (
    <Badge variant="outline" className="font-medium whitespace-normal text-center">ERT Primary Responder</Badge>
  );
}

export function ErtRosterPanel({ institutionId }: ErtRosterPanelProps) {
  const utils = trpc.useUtils();
  const [selectedPoleId, setSelectedPoleId] = useState<number | null>(null);
  const [selectedShift, setSelectedShift] = useState<"morning" | "evening" | "night">("morning");
  const [newPoleName, setNewPoleName] = useState("");
  const [showNewPoleForm, setShowNewPoleForm] = useState(false);
  
  const todayStr = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [monthStart, setMonthStart] = useState(`${todayStr.slice(0, 7)}-01`);
  const [monthlyProviderSelections, setMonthlyProviderSelections] = useState<Record<number, string>>({});
  const [manualAddDepartmentId, setManualAddDepartmentId] = useState<number | null>(null);
  const [manualNurseName, setManualNurseName] = useState("");
  const [manualNurseEmail, setManualNurseEmail] = useState("");
  const [manualNursePhone, setManualNursePhone] = useState("");
  const [ercoSelections, setErcoSelections] = useState<Record<number, string>>({});

  const targetDateObj = new Date(selectedDate);
  const { weekNumber, year } = getIsoWeek(targetDateObj);
  const { startDate: weekStart, endDate: weekEnd } = getWeekRange(targetDateObj);

  const { data: poles, isLoading: polesLoading } = trpc.institution.getFacilityPoles.useQuery(
    { institutionId },
    { enabled: !!institutionId }
  );

  const { data: departments } = trpc.institution.getFacilityDepartments.useQuery(
    { institutionId },
    { enabled: !!institutionId }
  );

  const { data: staffMembers } = trpc.institution.getStaffMembers.useQuery(
    { institutionId },
    { enabled: !!institutionId }
  );

  const activePoleId = selectedPoleId ?? (poles && poles.length > 0 ? poles[0].id : null);

  const { data: nurseCandidateGroups, refetch: refetchNurseCandidates } = trpc.institution.getPoleNurseCandidates.useQuery(
    { institutionId, poleId: activePoleId ?? 0 },
    { enabled: !!institutionId && !!activePoleId },
  );

  const { data: monthlyRota } = trpc.institution.getMonthlyUtlRota.useQuery(
    { institutionId, poleId: activePoleId ?? 0, monthStart },
    { enabled: !!institutionId && !!activePoleId },
  );
  const { data: ercoAssignments } = trpc.institution.getDepartmentResponseCoordinators.useQuery(
    { institutionId },
    { enabled: !!institutionId },
  );

  const { data: shiftRosters, refetch: refetchRoster } = trpc.institution.getShiftUtlRoster.useQuery(
    {
      institutionId,
      poleId: activePoleId ?? 0,
      shiftDate: selectedDate,
      shiftType: selectedShift,
    },
    { enabled: !!institutionId && !!activePoleId }
  );

  const { data: weeklyRotation } = trpc.institution.getWeeklyErtlRotation.useQuery(
    { institutionId, poleId: activePoleId ?? 0, weekNumber, year },
    { enabled: !!institutionId && !!activePoleId }
  );

  const createPoleMutation = trpc.institution.createFacilityPole.useMutation({
    onSuccess: (result) => {
      toast.success("Facility Pole created!");
      setNewPoleName("");
      setShowNewPoleForm(false);
      void utils.institution.getFacilityPoles.invalidate({ institutionId });
      setSelectedPoleId(result.poleId);
    },
    onError: (err) => toast.error(err.message || "Failed to create pole"),
  });

  const setErtlMutation = trpc.institution.setWeeklyErtlRotation.useMutation({
    onSuccess: () => {
      toast.success("This week's ERTL department updated!");
      void utils.institution.getWeeklyErtlRotation.invalidate({ institutionId, poleId: activePoleId ?? 0, weekNumber, year });
    },
    onError: (err) => toast.error(err.message || "Failed to update weekly ERTL"),
  });

  const submitRosterMutation = trpc.institution.submitShiftUtlRoster.useMutation({
    onSuccess: () => {
      toast.success("Shift UTL updated!");
      void refetchRoster();
    },
    onError: (err) => toast.error(err.message || "Failed to update UTL"),
  });

  const prepareMonthlyMutation = trpc.institution.autopopulateMonthlyUtlRota.useMutation({
    onSuccess: (result) => {
      toast.success(`Monthly UTL plan saved for ${result.assignedDepartments} department(s); ${result.generatedShifts} dated shift row(s) prepared.`);
      void utils.institution.getMonthlyUtlRota.invalidate({ institutionId, poleId: activePoleId ?? 0, monthStart });
      void utils.institution.getShiftUtlRoster.invalidate();
    },
    onError: (err) => toast.error(err.message || "Could not save the monthly UTL plan."),
  });

  const assignErcoMutation = trpc.institution.assignDepartmentResponseCoordinator.useMutation({
    onSuccess: () => {
      toast.success("ERCo assignment saved and sent for provider acceptance.");
      void utils.institution.getDepartmentResponseCoordinators.invalidate({ institutionId });
      void utils.institution.getPoleNurseCandidates.invalidate({ institutionId, poleId: activePoleId ?? 0 });
    },
    onError: (err) => toast.error(err.message || "Could not assign the ERCo."),
  });

  const addNurseMutation = trpc.institution.addDepartmentNurseCandidate.useMutation({
    onSuccess: (result) => {
      toast.success(result.assignable ? "Nurse added and is ready for shift assignment." : "Nurse added; account linking is still required before assigning a provider duty.");
      setManualAddDepartmentId(null);
      setManualNurseName("");
      setManualNurseEmail("");
      setManualNursePhone("");
      void refetchNurseCandidates();
    },
    onError: (err) => toast.error(err.message || "Could not add the nurse candidate."),
  });

  if (polesLoading) {
    return <div className="p-6 text-center text-muted-foreground">Loading ERT Roster Matrix...</div>;
  }

  const poleList = poles ?? [];
  const poleDepartments = [...(departments?.filter((d) => d.poleId === activePoleId && d.isActive && d.confirmedAt != null && d.requiresPole) ?? [])].sort((a, b) => (a.poleSequence ?? Number.MAX_SAFE_INTEGER) - (b.poleSequence ?? Number.MAX_SAFE_INTEGER) || a.departmentName.localeCompare(b.departmentName));
  const rotaDepartments = poleDepartments.filter((department) => nurseCandidateGroups?.some((group) => group.departmentId === department.id) ?? false);
  const ertlDepartmentId = weeklyRotation?.departmentId ?? null;
  const ertlDepartmentProviders = staffMembers?.filter((staff) => staff.userId != null && staff.facilityDepartmentId === ertlDepartmentId) ?? [];
  const candidatesForDepartment = (departmentId: number) => nurseCandidateGroups?.find((group) => group.departmentId === departmentId)?.candidates ?? [];
  const providersForDepartment = (departmentId: number) => candidatesForDepartment(departmentId).filter((candidate) => candidate.assignable);
  const pendingLinkCandidatesForDepartment = (departmentId: number) => candidatesForDepartment(departmentId).filter((candidate) => candidate.needsAccountLink);

  useEffect(() => {
    if (!monthlyRota) return;
    setMonthlyProviderSelections(Object.fromEntries(monthlyRota.map((rotation) => [rotation.departmentId, rotation.providerUserId == null ? "none" : String(rotation.providerUserId)])));
  }, [monthlyRota]);

  const saveMonthlyPlan = () => {
    if (!activePoleId || rotaDepartments.length === 0) return;
    prepareMonthlyMutation.mutate({
      institutionId,
      poleId: activePoleId,
      monthStart,
      assignments: rotaDepartments.map((department) => ({
        departmentId: department.id,
        providerUserId: monthlyProviderSelections[department.id] && monthlyProviderSelections[department.id] !== "none" ? Number(monthlyProviderSelections[department.id]) : null,
      })),
    });
  };

  const saveErco = (departmentId: number) => {
    const coordinatorUserId = Number(ercoSelections[departmentId]);
    if (!Number.isInteger(coordinatorUserId) || coordinatorUserId <= 0) {
      toast.error("Select an active provider as ERCo first.");
      return;
    }
    assignErcoMutation.mutate({
      institutionId,
      departmentId,
      coordinatorUserId,
      backupUserId: null,
      effectiveFrom: new Date().toISOString().slice(0, 10),
      effectiveUntil: null,
    });
  };

  const saveManualNurse = (departmentId: number) => {
    if (!manualNurseName.trim() || !manualNurseEmail.trim()) {
      toast.error("Enter the nurse’s name and email before saving.");
      return;
    }
    addNurseMutation.mutate({
      institutionId,
      departmentId,
      staffName: manualNurseName.trim(),
      staffEmail: manualNurseEmail.trim(),
      staffPhone: manualNursePhone.trim() || undefined,
    });
  };

  const renderManualNurseForm = (departmentId: number) => manualAddDepartmentId === departmentId ? (
    <div className="grid gap-2 rounded-md border border-dashed bg-muted/20 p-3 sm:grid-cols-3">
      <Input value={manualNurseName} onChange={(event) => setManualNurseName(event.target.value)} placeholder="Nurse name" className="text-xs" />
      <Input value={manualNurseEmail} onChange={(event) => setManualNurseEmail(event.target.value)} placeholder="Nurse email" type="email" className="text-xs" />
      <Input value={manualNursePhone} onChange={(event) => setManualNursePhone(event.target.value)} placeholder="Phone (optional)" className="text-xs" />
      <div className="flex gap-2 sm:col-span-3"><Button size="sm" onClick={() => saveManualNurse(departmentId)} disabled={addNurseMutation.isPending}>{addNurseMutation.isPending ? "Saving…" : "Save nurse"}</Button><Button size="sm" variant="ghost" onClick={() => setManualAddDepartmentId(null)}>Cancel</Button></div>
      <p className="text-[11px] text-muted-foreground sm:col-span-3">If this email already has a Paeds Resus account, it will be linked. Otherwise an invitation/link step is required before the nurse can accept a dated UTL duty.</p>
    </div>
  ) : <Button size="sm" variant="ghost" className="w-fit px-0 text-xs" onClick={() => setManualAddDepartmentId(departmentId)}><UserPlus className="mr-1.5 h-3.5 w-3.5" />Add nurse not listed</Button>;

  return (
    <div className="space-y-6">
      {/* Top Banner: Pole Selection & ERTL Department Rotation Notice */}
      <Card className="min-w-0 border-primary/20 bg-card">
        <CardHeader className="pb-3">
          <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="min-w-0 break-words text-base font-bold flex items-start gap-2 sm:text-xl">
                <Users className="w-6 h-6 text-primary" />
                24/7 ERT Roster Matrix & Shift UTL Allocation
              </CardTitle>
              <CardDescription className="break-words">
                Shift-by-shift Unit Team Leader (UTL) roster forming the active 6–8 member Emergency Response Team.
              </CardDescription>
            </div>

            {/* Date and Shift Selectors */}
            <div className="grid w-full grid-cols-1 gap-3 sm:w-auto sm:flex sm:flex-wrap sm:items-center">
              <div className="flex min-w-0 items-center gap-2">
                <Calendar className="w-4 h-4 shrink-0 text-muted-foreground" />
                <span className="text-xs font-semibold text-muted-foreground">Date:</span>
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="h-9 w-full min-w-0 text-xs sm:w-[140px]"
                />
              </div>
              <div className="flex min-w-0 items-center gap-2">
                <span className="shrink-0 text-xs font-semibold text-muted-foreground">Shift:</span>
                <Select value={selectedShift} onValueChange={(val: any) => setSelectedShift(val)}>
                  <SelectTrigger className="w-full min-w-0 h-9 text-xs sm:w-[130px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="morning">Morning Shift</SelectItem>
                    <SelectItem value="evening">Evening Shift</SelectItem>
                    <SelectItem value="night">Night Shift</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Geographic Pole Tabs */}
          <div className="flex flex-col items-stretch gap-2 border-b pb-2 sm:flex-row sm:flex-wrap sm:items-center">
            <span className="text-xs font-semibold text-muted-foreground sm:mr-2">Facility Zone:</span>
            {poleList.length === 0 && !showNewPoleForm && (
              <span className="text-xs text-muted-foreground italic mr-2">No poles set up yet.</span>
            )}
            {poleList.map((pole) => (
              <Button
                key={pole.id}
                variant={activePoleId === pole.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedPoleId(pole.id)}
                className="gap-2"
              >
                <Shield className="w-3.5 h-3.5" />
                {pole.poleName}
              </Button>
            ))}
            {showNewPoleForm ? (
              <div className="flex items-center gap-2">
                <Input
                  value={newPoleName}
                  onChange={(e) => setNewPoleName(e.target.value)}
                  placeholder="Pole name, e.g. East Wing"
                  className="h-8 w-full min-w-0 text-xs sm:w-48"
                  autoFocus
                />
                <Button
                  size="sm"
                  className="h-8"
                  disabled={!newPoleName.trim() || createPoleMutation.isPending}
                  onClick={() => createPoleMutation.mutate({ institutionId, poleName: newPoleName.trim() })}
                >
                  Save
                </Button>
                <Button size="sm" variant="ghost" className="h-8" onClick={() => setShowNewPoleForm(false)}>
                  Cancel
                </Button>
              </div>
            ) : (
              <Button size="sm" variant="outline" className="gap-1.5 h-8" onClick={() => setShowNewPoleForm(true)}>
                <Plus className="w-3.5 h-3.5" />
                New Pole
              </Button>
            )}
          </div>

          {/* ERTL Rotation Rule Notice + this week's assignment */}
          <div className="flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm">
            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="flex-1 space-y-2">
              <p className="font-semibold text-amber-800 dark:text-amber-300">
                Weekly ERTL Rotation — week {weekNumber}, {year} ({weekStart} to {weekEnd})
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-400">
                Within each pole, departments take weekly turns producing the ERT Team Leader (ERTL). The department is selected from the persisted pole order; the named ERTL provider and on-duty UTL remain separate dated duties and require explicit selection and acceptance.
              </p>
              {activePoleId && poleDepartments.length > 0 && (
                <div className="grid gap-2 pt-1 sm:flex sm:flex-wrap sm:items-center">
                  <span className="text-xs font-medium text-amber-800 dark:text-amber-300">This week's ERTL department:</span>
                  <Badge variant="outline" className="w-fit whitespace-normal">{poleDepartments.find((department) => department.id === ertlDepartmentId)?.departmentName ?? "Calculating from pole order…"}</Badge>
                  <span className="text-xs text-amber-700 dark:text-amber-400">Selected automatically: first department added to this pole, then the next department each week. The rotation determines the department, not the provider.</span>
                  <Select
                    value={weeklyRotation?.ertlUserId ? String(weeklyRotation.ertlUserId) : "none"}
                    onValueChange={(providerId) => ertlDepartmentId && setErtlMutation.mutate({
                      institutionId,
                      poleId: activePoleId,
                      departmentId: ertlDepartmentId,
                      weekNumber,
                      year,
                      startDate: weekStart,
                      endDate: weekEnd,
                      ertlUserId: providerId === "none" ? null : parseInt(providerId, 10),
                    })}
                  >
                    <SelectTrigger className="w-full min-w-0 h-8 text-xs bg-white dark:bg-background sm:w-[220px]">
                      <SelectValue placeholder="Assign named ERTL provider" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No named ERTL yet</SelectItem>
                      {ertlDepartmentProviders.map((staff) => <SelectItem key={staff.userId} value={String(staff.userId)}>{staff.staffName} ({staff.staffRole})</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {ertlDepartmentId && <Badge variant={weeklyRotation?.assignmentStatus === "active" ? "default" : "secondary"}>{weeklyRotation?.ertlUserId ? weeklyRotation.assignmentStatus === "pending_acceptance" ? "ERTL acceptance pending" : "ERTL accepted" : "No named ERTL"}</Badge>}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ERT Billboard Live Widget */}
      <ErtBillboardWidget
        poleId={activePoleId}
        shiftDate={selectedDate}
        shiftType={selectedShift}
        shiftRosters={shiftRosters}
        poleDepartments={poleDepartments}
        staffMembers={staffMembers}
        ertlDepartmentId={ertlDepartmentId}
      />

      {/* Explicit monthly UTL source planning */}
      <Card className="min-w-0 border-amber-500/30">
        <CardHeader>
          <CardTitle className="flex items-start gap-2 text-base font-bold sm:text-lg"><Calendar className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />Step 3 — Prepare the monthly UTL plan</CardTitle>
          <CardDescription>Every department assigned to this pole is listed. The ERCo or authorized IERS lead chooses a named nurse for the month, or deliberately leaves that department unassigned. This does not claim that the nurse will work every shift; choose the actual nurse again for each dated shift below.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {poleDepartments.length === 0 ? <p className="text-sm text-muted-foreground">Assign confirmed operational departments to this pole in Departments & poles first.</p> : (
            <>
              <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center"><Input type="month" value={monthStart.slice(0, 7)} onChange={(event) => setMonthStart(`${event.target.value}-01`)} className="w-full sm:w-48" /><Badge variant="outline" className="w-fit">{poleDepartments.length} pole department(s)</Badge></div>
              <div className="space-y-2">
                {poleDepartments.map((department) => {
                  const candidates = providersForDepartment(department.id);
                  const pendingLinks = pendingLinkCandidatesForDepartment(department.id);
                  const canWrite = nurseCandidateGroups?.some((group) => group.departmentId === department.id) ?? false;
                  const ercoAssignment = ercoAssignments?.find((assignment) => assignment.departmentId === department.id);
                  const activeStaff = staffMembers?.filter((staff) => staff.userId != null) ?? [];
                  return <div key={department.id} className="rounded-md border bg-background/70 p-3">
                    <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><span className="break-words text-sm font-medium">{department.departmentName}</span><Badge variant={ercoAssignment?.assignmentStatus === "active" ? "default" : "secondary"}>{ercoAssignment?.assignmentStatus === "active" ? "ERCo active" : ercoAssignment?.assignmentStatus === "pending_acceptance" ? "ERCo acceptance pending" : "ERCo not assigned"}</Badge></div>
                    {!ercoAssignment || ercoAssignment.assignmentStatus === "declined" || ercoAssignment.assignmentStatus === "ended" ? <div className="mt-3 flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center"><Select value={ercoSelections[department.id] ?? ""} onValueChange={(value) => setErcoSelections((current) => ({ ...current, [department.id]: value }))}><SelectTrigger className="w-full sm:w-72"><SelectValue placeholder="Assign ERCo now" /></SelectTrigger><SelectContent>{activeStaff.map((staff) => <SelectItem key={staff.userId} value={String(staff.userId)}>{staff.staffName} ({staff.staffRole})</SelectItem>)}</SelectContent></Select><Button size="sm" className="w-full sm:w-auto" onClick={() => saveErco(department.id)} disabled={assignErcoMutation.isPending}>Assign ERCo</Button></div> : <p className="mt-2 text-xs text-muted-foreground">ERCo is a governance appointment, not shift coverage. Use ERCo governance to add an optional Assistant ERCo or review appointment history.</p>}
                    {canWrite ? <div className="mt-3"><p className="mb-1 text-xs font-medium text-muted-foreground">Monthly nurse source (optional)</p><Select value={monthlyProviderSelections[department.id] ?? "none"} onValueChange={(value) => setMonthlyProviderSelections((current) => ({ ...current, [department.id]: value }))}><SelectTrigger className="w-full sm:w-72"><SelectValue placeholder="Leave unassigned" /></SelectTrigger><SelectContent><SelectItem value="none">Leave unassigned for now</SelectItem>{candidates.map((candidate) => <SelectItem key={candidate.userId} value={String(candidate.userId)}>{candidate.staffName}</SelectItem>)}</SelectContent></Select></div> : <Badge className="mt-3" variant="secondary">Accepted ERCo/lead access required to staff this department</Badge>}
                    {pendingLinks.length > 0 && <p className="mt-2 text-xs text-amber-700 dark:text-amber-300">{pendingLinks.length} nurse candidate(s) need an account link before they can accept a dated UTL duty.</p>}
                    {canWrite && renderManualNurseForm(department.id)}
                  </div>;
                })}
              </div>
              {rotaDepartments.length > 0 && <Button className="w-full sm:w-auto" onClick={saveMonthlyPlan} disabled={prepareMonthlyMutation.isPending}>{prepareMonthlyMutation.isPending ? "Saving plan…" : "Save monthly UTL plan"}</Button>}
              <p className="text-xs text-muted-foreground">Saving this plan creates dated source rows only for the departments you can manage. A named provider still must accept each dated assignment in the provider portal, and the actual on-shift nurse should be confirmed below.</p>
            </>
          )}
        </CardContent>
      </Card>

      {/* Shift UTL Roster Table */}
      <Card className="min-w-0">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="min-w-0 break-words text-base font-bold flex items-start gap-2 sm:text-lg">
              <Clock className="w-5 h-5" />
              Active ERT Shift Team ({selectedShift.toUpperCase()} - {selectedDate})
            </CardTitle>
            <CardDescription className="break-words">
              On-duty UTLs representing the departments in this Pole.
            </CardDescription>
          </div>
          <p className="max-w-xl text-xs text-muted-foreground">Departments are confirmed and marked IERS operational in Administration before pole assignment. This prevents CPD-only departments from being added to an emergency pole by mistake.</p>
        </CardHeader>
        <CardContent>
          {poleDepartments.length === 0 ? (
            <p className="text-sm text-muted-foreground italic py-6 text-center">
              {activePoleId
                ? "No eligible departments are assigned to this pole yet. Confirm departments and enable IERS pole eligibility in Administration first."
                : "Create a pole first, then confirm eligible departments in Administration."}
            </p>
          ) : (
            <>
            <div className="space-y-3 sm:hidden">
              {poleDepartments.map((dept) => {
                const rosterEntry = shiftRosters?.find((r) => r.departmentId === dept.id);
                const assignedStaff = staffMembers?.find((s) => s.userId != null && s.userId === rosterEntry?.utlUserId);
                const isErtl = dept.id === ertlDepartmentId;

                return (
                  <div key={dept.id} className="space-y-3 rounded-lg border bg-card p-3 shadow-sm">
                    <div className="flex min-w-0 items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="break-words text-sm font-semibold">{dept.departmentName}</p>
                        <p className="mt-1 break-words text-xs text-muted-foreground">
                          {assignedStaff ? `${assignedStaff.staffName} (${assignedStaff.staffRole})` : "No UTL assigned yet"}
                        </p>
                      </div>
                      <div className="shrink-0">
                        <RoleBadge isErtl={isErtl} />
                      </div>
                    </div>

                    <div className="grid gap-2 text-xs">
                      <div className="flex min-w-0 items-start justify-between gap-3">
                        <span className="text-muted-foreground">Readiness</span>
                        <div className="max-w-[65%] text-right"><ProviderReadinessStatus rosterEntry={rosterEntry} /></div>
                      </div>
                      {rosterEntry && (
                        <div className="flex min-w-0 items-center justify-between gap-3">
                          <span className="text-muted-foreground">UTL status</span>
                          <Select
                            value={rosterEntry.status}
                            onValueChange={(statusVal: "active" | "absent" | "completed") => {
                              if (activePoleId) {
                                submitRosterMutation.mutate({
                                  institutionId,
                                  poleId: activePoleId,
                                  departmentId: dept.id,
                                  shiftDate: selectedDate,
                                  shiftType: selectedShift,
                                  utlUserId: rosterEntry.utlUserId,
                                  isShiftErtl: isErtl,
                                  status: statusVal,
                                });
                              }
                            }}
                          >
                            <SelectTrigger className="h-8 w-[130px] min-w-0 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="active">Active</SelectItem>
                              <SelectItem value="absent">Absent</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>

                    <div className="grid gap-1.5">
                      <span className="text-xs font-medium text-muted-foreground">Assign linked provider</span>
                      <Select
                        onValueChange={(staffUserId) =>
                          activePoleId &&
                          submitRosterMutation.mutate({
                            institutionId,
                            poleId: activePoleId,
                            departmentId: dept.id,
                            shiftDate: selectedDate,
                            shiftType: selectedShift,
                            utlUserId: parseInt(staffUserId, 10),
                            isShiftErtl: isErtl,
                          })
                        }
                      >
                        <SelectTrigger className="h-9 w-full min-w-0 text-xs">
                          <SelectValue placeholder="Choose provider" />
                        </SelectTrigger>
                        <SelectContent>
                          {providersForDepartment(dept.id).map((staff) => (
                            <SelectItem key={staff.userId} value={String(staff.userId)}>
                              {staff.staffName} ({staff.staffRole})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="hidden -mx-1 overflow-x-auto pb-2 sm:block sm:mx-0">
              <Table className="min-w-[760px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Department</TableHead>
                  <TableHead>Assigned Shift UTL Provider</TableHead>
                  <TableHead>ERT Role Designation</TableHead>
                  <TableHead>Shift Readiness Check</TableHead>
                  <TableHead>UTL Status</TableHead>
                  <TableHead className="text-left">Assign linked provider</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {poleDepartments.map((dept) => {
                  const rosterEntry = shiftRosters?.find((r) => r.departmentId === dept.id);
                  const assignedStaff = staffMembers?.find((s) => s.userId != null && s.userId === rosterEntry?.utlUserId);
                  const isErtl = dept.id === ertlDepartmentId;

                  return (
                    <TableRow key={dept.id}>
                      <TableCell className="font-semibold">{dept.departmentName}</TableCell>
                      <TableCell>
                        {assignedStaff ? (
                          <div>
                            <p className="font-medium text-sm">{assignedStaff.staffName}</p>
                            <p className="text-xs text-muted-foreground">{assignedStaff.staffRole} ({assignedStaff.department})</p>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">No UTL assigned yet</span>
                        )}
                      </TableCell>
                      <TableCell><RoleBadge isErtl={isErtl} /></TableCell>
                      <TableCell><ProviderReadinessStatus rosterEntry={rosterEntry} /></TableCell>
                      <TableCell>
                        {rosterEntry ? (
                          <Select
                            value={rosterEntry.status}
                            onValueChange={(statusVal: "active" | "absent" | "completed") => {
                              if (activePoleId) {
                                submitRosterMutation.mutate({
                                  institutionId,
                                  poleId: activePoleId,
                                  departmentId: dept.id,
                                  shiftDate: selectedDate,
                                  shiftType: selectedShift,
                                  utlUserId: rosterEntry.utlUserId,
                                  isShiftErtl: isErtl,
                                  status: statusVal,
                                });
                              }
                            }}
                          >
                            <SelectTrigger className="w-[110px] h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="active">Active</SelectItem>
                              <SelectItem value="absent">Absent</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Select
                          onValueChange={(staffUserId) =>
                            activePoleId &&
                            submitRosterMutation.mutate({
                              institutionId,
                              poleId: activePoleId,
                              departmentId: dept.id,
                              shiftDate: selectedDate,
                              shiftType: selectedShift,
                              utlUserId: parseInt(staffUserId),
                              isShiftErtl: isErtl,
                            })
                          }
                        >
                          <SelectTrigger className="h-8 w-full min-w-[160px] text-xs sm:w-[160px]">
                            <SelectValue placeholder="Assign UTL Nurse" />
                          </SelectTrigger>
                          <SelectContent>
                            {providersForDepartment(dept.id).map((staff) => (
                              <SelectItem key={staff.userId} value={String(staff.userId)}>
                                {staff.staffName} ({staff.staffRole})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
              </Table>
            </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
