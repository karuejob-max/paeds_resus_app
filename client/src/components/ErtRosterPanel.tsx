import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, Shield, Clock, AlertCircle, Plus, Star, Calendar, UserPlus, ArrowDown, ArrowUp, Search } from "lucide-react";
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

const SHIFT_TIME_PRESETS = {
  morning: { label: "Day", startTime: "07:30", endTime: "17:30", endDayOffset: 0 },
  evening: { label: "Evening", startTime: "17:30", endTime: "21:30", endDayOffset: 0 },
  night: { label: "Night", startTime: "21:30", endTime: "05:30", endDayOffset: 1 },
} as const;

function displayShiftTime(value: string | null | undefined): string {
  return value ? value.slice(0, 5) : "—";
}

function getMonthDates(monthStart: string): string[] {
  const [year, month] = monthStart.split("-").map(Number);
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return Array.from({ length: daysInMonth }, (_, index) => `${monthStart.slice(0, 7)}-${String(index + 1).padStart(2, "0")}`);
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
  const [selectedShiftStartTime, setSelectedShiftStartTime] = useState<string>(SHIFT_TIME_PRESETS.morning.startTime);
  const [selectedShiftEndTime, setSelectedShiftEndTime] = useState<string>(SHIFT_TIME_PRESETS.morning.endTime);
  const [selectedShiftEndDayOffset, setSelectedShiftEndDayOffset] = useState<0 | 1>(SHIFT_TIME_PRESETS.morning.endDayOffset);
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
  const [bulkDepartmentId, setBulkDepartmentId] = useState("");
  const [bulkUtlUserId, setBulkUtlUserId] = useState("");
  const [bulkNurseSearch, setBulkNurseSearch] = useState("");
  const [bulkDates, setBulkDates] = useState<string[]>([]);
  const [newTemplateName, setNewTemplateName] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState("none");
  const [leadershipOverrideDepartmentId, setLeadershipOverrideDepartmentId] = useState("");
  const [leadershipOverrideReason, setLeadershipOverrideReason] = useState("");
  const [showLeadershipOverride, setShowLeadershipOverride] = useState(false);
  const [cancelRosterId, setCancelRosterId] = useState<number | null>(null);
  const [cancelReason, setCancelReason] = useState("");

  const applyShiftPreset = (shiftType: "morning" | "evening" | "night") => {
    const preset = SHIFT_TIME_PRESETS[shiftType];
    setSelectedTemplateId("none");
    setSelectedShift(shiftType);
    setSelectedShiftStartTime(preset.startTime);
    setSelectedShiftEndTime(preset.endTime);
    setSelectedShiftEndDayOffset(preset.endDayOffset);
  };

  const targetDateObj = new Date(selectedDate);
  const { weekNumber, year } = getIsoWeek(targetDateObj);
  const { startDate: weekStart, endDate: weekEnd } = getWeekRange(targetDateObj);

  const { data: poles, isLoading: polesLoading } = trpc.institution.getFacilityPoles.useQuery(
    { institutionId },
    { enabled: !!institutionId }
  );
  const { data: adminStatus } = trpc.institution.getMyInstitutionAdminStatus.useQuery(
    { institutionId },
    { enabled: !!institutionId },
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

  const { data: bulkDepartmentCandidates, isLoading: bulkDepartmentCandidatesLoading } = trpc.institution.getDepartmentNurseCandidates.useQuery(
    { institutionId, departmentId: Number(bulkDepartmentId) || 0 },
    { enabled: !!institutionId && !!bulkDepartmentId },
  );

  const { data: shiftTemplates } = trpc.institution.getInstitutionShiftTemplates.useQuery(
    { institutionId },
    { enabled: !!institutionId },
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
  const { data: canonicalTeam, isLoading: canonicalTeamLoading } = trpc.institution.getCanonicalShiftTeam.useQuery(
    {
      institutionId,
      poleId: activePoleId ?? 0,
      shiftDate: selectedDate,
      shiftType: selectedShift,
    },
    { enabled: !!institutionId && !!activePoleId, staleTime: 15_000 }
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
  const reorderPolesMutation = trpc.institution.reorderFacilityPoles.useMutation({
    onSuccess: async () => {
      toast.success("Pole order updated");
      await utils.institution.getFacilityPoles.invalidate({ institutionId });
    },
    onError: (err) => toast.error(err.message || "Could not update pole order"),
  });

  const overrideLeadershipMutation = trpc.institution.overrideWeeklyErtlLeadership.useMutation({
    onSuccess: () => {
      toast.success("Leadership week updated; future unaccepted rotation rows refreshed.");
      setShowLeadershipOverride(false);
      setLeadershipOverrideReason("");
      void utils.institution.getWeeklyErtlRotation.invalidate({ institutionId, poleId: activePoleId ?? 0, weekNumber, year });
      void utils.institution.getShiftUtlRoster.invalidate();
      void utils.iersShiftTeam.listMyShiftTeams.invalidate();
    },
    onError: (err) => toast.error(err.message || "Could not update the leadership week."),
  });

  const cancelUtlMutation = trpc.institution.cancelFutureShiftUtlAssignment.useMutation({
    onSuccess: () => {
      toast.success("Future UTL assignment canceled and recorded.");
      setCancelRosterId(null);
      setCancelReason("");
      void refetchRoster();
      void utils.institution.getShiftUtlRoster.invalidate();
      void utils.iersShiftTeam.listMyShiftTeams.invalidate();
    },
    onError: (err) => toast.error(err.message || "Could not cancel the future UTL assignment."),
  });

  const submitRosterMutation = trpc.institution.submitShiftUtlRoster.useMutation({
    onSuccess: () => {
      toast.success("Shift UTL updated!");
      void refetchRoster();
      void utils.iersShiftTeam.listMyShiftTeams.invalidate();
    },
    onError: (err) => toast.error(err.message || "Failed to update UTL"),
  });

  const saveTemplateMutation = trpc.institution.createInstitutionShiftTemplate.useMutation({
    onSuccess: () => {
      toast.success("Shift hours template saved.");
      setNewTemplateName("");
      void utils.institution.getInstitutionShiftTemplates.invalidate({ institutionId });
    },
    onError: (err) => toast.error(err.message || "Could not save shift template."),
  });

  const bulkAssignMutation = trpc.institution.bulkAssignShiftUtlProvider.useMutation({
    onSuccess: (result) => {
      toast.success(`${result.savedCount} UTL shift(s) saved; providers must accept their dated duties.`);
      setBulkDates([]);
      void utils.institution.getShiftUtlRoster.invalidate();
      void utils.iersShiftTeam.listMyShiftTeams.invalidate();
    },
    onError: (err) => toast.error(err.message || "Could not apply the provider to those shifts."),
  });

  const submitSelectedRoster = (departmentId: number, utlUserId: number, status?: "active" | "absent" | "completed") => {
    if (!activePoleId) return;
    submitRosterMutation.mutate({
      institutionId,
      poleId: activePoleId,
      departmentId,
      shiftDate: selectedDate,
      shiftType: selectedShift,
      shiftStartTime: selectedShiftStartTime,
      shiftEndTime: selectedShiftEndTime,
      shiftEndDayOffset: selectedShiftEndDayOffset,
      shiftTemplateId: selectedTemplateId === "none" ? null : Number(selectedTemplateId),
      utlUserId,
      isShiftErtl: departmentId === ertlDepartmentId,
      status,
    });
  };

  const toggleBulkDate = (date: string) => {
    setBulkDates((current) => current.includes(date) ? current.filter((item) => item !== date) : [...current, date].sort());
  };

  const saveShiftTemplate = () => {
    if (!newTemplateName.trim()) {
      toast.error("Enter a name for this shift-hours template.");
      return;
    }
    saveTemplateMutation.mutate({
      institutionId,
      templateName: newTemplateName.trim(),
      startTime: selectedShiftStartTime,
      endTime: selectedShiftEndTime,
      endDayOffset: selectedShiftEndDayOffset,
    });
  };

  const applySavedTemplate = (templateId: string) => {
    const template = shiftTemplates?.find((item) => String(item.id) === templateId);
    if (!template) return;
    setSelectedTemplateId(templateId);
    setSelectedShiftStartTime(template.startTime.slice(0, 5));
    setSelectedShiftEndTime(template.endTime.slice(0, 5));
    setSelectedShiftEndDayOffset(template.endDayOffset as 0 | 1);
  };

  const saveBulkAssignments = () => {
    if (!activePoleId || !bulkDepartmentId || !bulkUtlUserId || bulkDates.length === 0) {
      toast.error("Choose a department, nurse, and at least one date first.");
      return;
    }
    bulkAssignMutation.mutate({
      institutionId,
      poleId: activePoleId,
      utlUserId: Number(bulkUtlUserId),
      assignments: bulkDates.map((shiftDate) => ({
        departmentId: Number(bulkDepartmentId),
        shiftDate,
        shiftType: selectedShift,
        shiftStartTime: selectedShiftStartTime,
        shiftEndTime: selectedShiftEndTime,
        shiftEndDayOffset: selectedShiftEndDayOffset,
        shiftTemplateId: selectedTemplateId === "none" ? null : Number(selectedTemplateId),
      })),
    });
  };

  const prepareMonthlyMutation = trpc.institution.autopopulateMonthlyUtlRota.useMutation({
    onSuccess: (result) => {
      toast.success(`Monthly UTL plan saved for ${result.assignedDepartments} department(s); ${result.generatedShifts} dated shift row(s) prepared.`);
      void utils.institution.getMonthlyUtlRota.invalidate({ institutionId, poleId: activePoleId ?? 0, monthStart });
      void utils.institution.getShiftUtlRoster.invalidate();
      void utils.iersShiftTeam.listMyShiftTeams.invalidate();
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

  useEffect(() => {
    if (!monthlyRota) return;
    setMonthlyProviderSelections(Object.fromEntries(monthlyRota.map((rotation) => [rotation.departmentId, rotation.providerUserId == null ? "none" : String(rotation.providerUserId)])));
  }, [monthlyRota]);

  if (polesLoading) {
    return <div className="p-6 text-center text-muted-foreground">Loading ERT Roster Matrix...</div>;
  }

  const poleList = poles ?? [];
  const poleDepartments = [...(departments?.filter((d) => d.poleId === activePoleId && d.isActive && d.confirmedAt != null && d.requiresPole) ?? [])].sort((a, b) => (a.poleSequence ?? Number.MAX_SAFE_INTEGER) - (b.poleSequence ?? Number.MAX_SAFE_INTEGER) || a.departmentName.localeCompare(b.departmentName));
  const rotaDepartments = poleDepartments.filter((department) => nurseCandidateGroups?.some((group) => group.departmentId === department.id) ?? false);
  const ertlDepartmentId = weeklyRotation?.departmentId ?? null;
  const isSelectedShiftUpcoming = new Date(`${selectedDate}T${selectedShiftStartTime.slice(0, 5)}:00`).getTime() > Date.now();
  const candidatesForDepartment = (departmentId: number) => nurseCandidateGroups?.find((group) => group.departmentId === departmentId)?.candidates ?? [];
  const providersForDepartment = (departmentId: number) => candidatesForDepartment(departmentId).filter((candidate) => candidate.assignable);
  const pendingLinkCandidatesForDepartment = (departmentId: number) => candidatesForDepartment(departmentId).filter((candidate) => candidate.needsAccountLink);
  const bulkNurseQuery = bulkNurseSearch.trim().toLowerCase();
  const filteredBulkDepartmentCandidates = (bulkDepartmentCandidates ?? []).filter((candidate) => {
    if (!bulkNurseQuery) return true;
    return `${candidate.staffName} ${candidate.staffEmail} ${candidate.staffRole}`.toLowerCase().includes(bulkNurseQuery);
  });
  const filteredBulkAssignableCandidates = filteredBulkDepartmentCandidates.filter((candidate) => candidate.assignable && candidate.userId != null);
  const bulkPendingCandidates = filteredBulkDepartmentCandidates.filter((candidate) => !candidate.assignable);

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
                <Select value={selectedShift} onValueChange={(val: "morning" | "evening" | "night") => applyShiftPreset(val)}>
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
              <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
                <label className="flex min-w-0 items-center gap-1.5 text-xs font-semibold text-muted-foreground"><span>Start</span><Input type="time" value={selectedShiftStartTime} onChange={(event) => { setSelectedTemplateId("none"); setSelectedShiftStartTime(event.target.value); }} className="h-9 min-w-0 text-xs" /></label>
                <label className="flex min-w-0 items-center gap-1.5 text-xs font-semibold text-muted-foreground"><span>End</span><Input type="time" value={selectedShiftEndTime} onChange={(event) => { setSelectedTemplateId("none"); setSelectedShiftEndTime(event.target.value); }} className="h-9 min-w-0 text-xs" /></label>
                <Select value={String(selectedShiftEndDayOffset)} onValueChange={(value) => { setSelectedTemplateId("none"); setSelectedShiftEndDayOffset(value === "1" ? 1 : 0); }}>
                  <SelectTrigger className="col-span-2 h-9 w-full text-xs sm:w-[140px]"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="0">Ends same day</SelectItem><SelectItem value="1">Ends next day</SelectItem></SelectContent>
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
            {poleList.map((pole, index) => (
              <div key={pole.id} className="flex min-w-0 items-center gap-1 rounded-md border bg-background p-1">
                <Button
                  variant={activePoleId === pole.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedPoleId(pole.id)}
                  className="min-w-0 gap-2"
                >
                  <Shield className="w-3.5 h-3.5 shrink-0" />
                  <span className="max-w-[9rem] truncate">{index + 1}. {pole.poleName}</span>
                </Button>
                <div className="flex shrink-0">
                  <Button type="button" variant="ghost" size="icon" className="h-7 w-7" aria-label={`Move ${pole.poleName} up`} disabled={index === 0 || reorderPolesMutation.isPending} onClick={() => { const poleIds = poleList.map((item) => item.id); [poleIds[index - 1], poleIds[index]] = [poleIds[index], poleIds[index - 1]]; reorderPolesMutation.mutate({ institutionId, poleIds }); }}><ArrowUp className="h-3.5 w-3.5" /></Button>
                  <Button type="button" variant="ghost" size="icon" className="h-7 w-7" aria-label={`Move ${pole.poleName} down`} disabled={index === poleList.length - 1 || reorderPolesMutation.isPending} onClick={() => { const poleIds = poleList.map((item) => item.id); [poleIds[index], poleIds[index + 1]] = [poleIds[index + 1], poleIds[index]]; reorderPolesMutation.mutate({ institutionId, poleIds }); }}><ArrowDown className="h-3.5 w-3.5" /></Button>
                </div>
              </div>
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
          {poleList.length > 0 && <p className="text-xs text-muted-foreground">Step 2 is ordered for your facility. New poles are added at the end. The order is for navigation; weekly ERTL rotation still cycles through eligible departments within each selected pole.</p>}

          {/* ERTL Rotation Rule Notice + this week's assignment */}
          <div className="flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm">
            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="flex-1 space-y-2">
              <p className="font-semibold text-amber-800 dark:text-amber-300">
                Weekly ERTL Rotation — week {weekNumber}, {year} ({weekStart} to {weekEnd})
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-400">
                The ERTL / Scene Commander is automatic: after the leading department's UTL accepts the dated duty, that same provider receives the separate ERTL acceptance request. No one selects an ERTL provider here.
              </p>
              {activePoleId && poleDepartments.length > 0 && (
                <div className="space-y-2 pt-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-medium text-amber-800 dark:text-amber-300">This week's leading department:</span>
                    <Badge variant="outline" className="w-fit whitespace-normal">{poleDepartments.find((department) => department.id === ertlDepartmentId)?.departmentName ?? "Calculating from pole order…"}</Badge>
                    {ertlDepartmentId && <Badge variant="secondary">UTL becomes ERTL after acceptance</Badge>}
                  </div>
                  <p className="text-xs text-amber-700 dark:text-amber-400">Departments lead in pole order from the Monday morning shift. An administrator can adjust the starting department when an operational change requires it; the sequence then refreshes forward.</p>
                  {adminStatus?.isInstitutionAdmin && !showLeadershipOverride ? (
                    <Button type="button" size="sm" variant="outline" className="bg-white" onClick={() => { setLeadershipOverrideDepartmentId(String(ertlDepartmentId ?? "")); setShowLeadershipOverride(true); }}>
                      Adjust this week's leadership
                    </Button>
                  ) : adminStatus?.isInstitutionAdmin ? (
                    <div className="space-y-2 rounded-md border border-amber-300 bg-white p-3">
                      <p className="text-xs font-semibold text-slate-900">Choose the department that should lead this week</p>
                      <Select value={leadershipOverrideDepartmentId} onValueChange={setLeadershipOverrideDepartmentId}>
                        <SelectTrigger className="w-full min-w-0 text-xs"><SelectValue placeholder="Choose leading department" /></SelectTrigger>
                        <SelectContent>{poleDepartments.map((department) => <SelectItem key={department.id} value={String(department.id)}>{department.departmentName}</SelectItem>)}</SelectContent>
                      </Select>
                      <Input value={leadershipOverrideReason} onChange={(event) => setLeadershipOverrideReason(event.target.value)} placeholder="Reason for this operational adjustment" className="text-xs" />
                      <p className="text-[11px] text-amber-800">Accepted or historical dated duties are not rewritten. Only future unaccepted rotation and team projections are refreshed.</p>
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <Button type="button" size="sm" className="sm:flex-1" onClick={() => { if (!activePoleId || !leadershipOverrideDepartmentId) return; overrideLeadershipMutation.mutate({ institutionId, poleId: activePoleId, departmentId: Number(leadershipOverrideDepartmentId), weekNumber, year, startDate: weekStart, endDate: weekEnd, reason: leadershipOverrideReason.trim() }); }} disabled={overrideLeadershipMutation.isPending || !leadershipOverrideDepartmentId || leadershipOverrideReason.trim().length < 3}>
                          {overrideLeadershipMutation.isPending ? "Refreshing rotation…" : "Save leadership adjustment"}
                        </Button>
                        <Button type="button" size="sm" variant="outline" onClick={() => setShowLeadershipOverride(false)} disabled={overrideLeadershipMutation.isPending}>Cancel</Button>
                      </div>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Canonical ERT Billboard */}
      {canonicalTeamLoading ? (
        <Card className="min-w-0 border-slate-300"><CardContent className="py-8 text-center text-sm text-muted-foreground">Loading the selected shift’s published ERT…</CardContent></Card>
      ) : canonicalTeam ? (
        <ErtBillboardWidget
          poleId={activePoleId}
          shiftDate={selectedDate}
          shiftType={selectedShift}
          shiftRosters={shiftRosters}
          poleDepartments={poleDepartments}
          staffMembers={staffMembers}
          ertlDepartmentId={ertlDepartmentId}
          canonicalTeam={canonicalTeam}
        />
      ) : (
        <Card className="min-w-0 border-dashed"><CardContent className="py-8 text-center"><p className="text-sm font-medium">No published ERT for this selected shift</p><p className="mt-1 text-xs text-muted-foreground">The institutional portal now shows only the canonical published/active team used by providers. Complete and publish dated staffing for this pole and shift to make it visible.</p></CardContent></Card>
      )}

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
                  const ercoCandidates = providersForDepartment(department.id);
                  return <div key={department.id} className="rounded-md border bg-background/70 p-3">
                    <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><span className="break-words text-sm font-medium">{department.departmentName}</span><Badge variant={ercoAssignment?.assignmentStatus === "active" ? "default" : "secondary"}>{ercoAssignment?.assignmentStatus === "active" ? "ERCo active" : ercoAssignment?.assignmentStatus === "pending_acceptance" ? "ERCo acceptance pending" : "ERCo not assigned"}</Badge></div>
                    {!ercoAssignment || ercoAssignment.assignmentStatus === "declined" || ercoAssignment.assignmentStatus === "ended" ? <div className="mt-3 flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center"><Select value={ercoSelections[department.id] ?? ""} onValueChange={(value) => setErcoSelections((current) => ({ ...current, [department.id]: value }))}><SelectTrigger className="w-full sm:w-72"><SelectValue placeholder="Assign ERCo now" /></SelectTrigger><SelectContent>{ercoCandidates.map((staff) => <SelectItem key={staff.userId} value={String(staff.userId)}>{staff.staffName} ({staff.staffRole})</SelectItem>)}</SelectContent></Select><Button size="sm" className="w-full sm:w-auto" onClick={() => saveErco(department.id)} disabled={assignErcoMutation.isPending || ercoCandidates.length === 0}>Assign ERCo</Button>{ercoCandidates.length === 0 && <p className="text-xs text-amber-700 dark:text-amber-300">No linked active nurse is registered with this department yet.</p>}</div> : <p className="mt-2 text-xs text-muted-foreground">ERCo is a governance appointment, not shift coverage. Use ERCo governance to add an optional Assistant ERCo or review appointment history.</p>}
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

      {/* Explicit day-by-day UTL staffing */}
      <Card className="min-w-0 border-emerald-500/30">
        <CardHeader>
          <CardTitle className="flex items-start gap-2 text-base font-bold sm:text-lg"><Clock className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />Assign UTLs by day and shift</CardTitle>
          <CardDescription>Choose one department nurse, select the days they will actually be UTL, and save only those dated shifts. Change the time fields above when the facility uses a different interval. The same hours are reused for every selected day.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 rounded-md border bg-muted/20 p-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] md:items-end">
            <label className="space-y-1.5"><span className="text-xs font-medium text-muted-foreground">Saved facility hours</span><Select value={selectedTemplateId} onValueChange={(value) => { setSelectedTemplateId(value); if (value !== "none") applySavedTemplate(value); }}><SelectTrigger><SelectValue placeholder="Use a saved template" /></SelectTrigger><SelectContent><SelectItem value="none">Use a saved template</SelectItem>{(shiftTemplates ?? []).map((template) => <SelectItem key={template.id} value={String(template.id)}>{template.templateName} · {displayShiftTime(template.startTime)}–{displayShiftTime(template.endTime)}{template.endDayOffset === 1 ? " (+1 day)" : ""}</SelectItem>)}</SelectContent></Select></label>
            <Input aria-label="New shift-hours template name" placeholder="Name new hours (e.g. Long day)" value={newTemplateName} onChange={(event) => setNewTemplateName(event.target.value)} />
            <Button type="button" variant="outline" onClick={saveShiftTemplate} disabled={saveTemplateMutation.isPending}>{saveTemplateMutation.isPending ? "Saving…" : "Save current hours"}</Button>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <div className="space-y-1.5"><span className="text-xs font-medium text-muted-foreground">Department</span><Select value={bulkDepartmentId || "none"} onValueChange={(value) => { setBulkDepartmentId(value === "none" ? "" : value); setBulkUtlUserId(""); setBulkNurseSearch(""); }}><SelectTrigger><SelectValue placeholder="Choose department" /></SelectTrigger><SelectContent><SelectItem value="none">Choose department</SelectItem>{poleDepartments.map((department) => <SelectItem key={department.id} value={String(department.id)}>{department.departmentName}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1.5 md:col-span-2"><span className="text-xs font-medium text-muted-foreground">Practitioner — assign one nurse across selected dates</span><div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={bulkNurseSearch} onChange={(event) => setBulkNurseSearch(event.target.value)} placeholder={bulkDepartmentId ? "Search all nurses by name, email, or role" : "Choose a department first"} disabled={!bulkDepartmentId} className="pl-9" /></div><Select value={bulkUtlUserId || "none"} onValueChange={(value) => setBulkUtlUserId(value === "none" ? "" : value)} disabled={!bulkDepartmentId}><SelectTrigger><SelectValue placeholder={bulkDepartmentCandidatesLoading ? "Loading department nurses…" : "Choose practitioner"} /></SelectTrigger><SelectContent><SelectItem value="none">Choose practitioner</SelectItem>{filteredBulkAssignableCandidates.map((staff) => <SelectItem key={staff.id} value={String(staff.userId)}>{staff.staffName} ({staff.staffRole})</SelectItem>)}{bulkPendingCandidates.map((staff) => <SelectItem key={`pending-${staff.id}`} value={`pending-${staff.id}`} disabled>{staff.staffName} · account link or active membership required</SelectItem>)}</SelectContent></Select><p className="text-[11px] text-muted-foreground">Showing {filteredBulkAssignableCandidates.length} eligible nurse(s){bulkPendingCandidates.length > 0 ? ` and ${bulkPendingCandidates.length} registered candidate(s) not yet assignable` : ""}. Search narrows this department only.</p></div>
            <div className="rounded-md border bg-muted/20 p-2 text-xs text-muted-foreground md:col-span-3"><p className="font-medium text-foreground">Selected interval</p><p>{selectedShift.toUpperCase()} · {displayShiftTime(selectedShiftStartTime)}–{displayShiftTime(selectedShiftEndTime)}{selectedShiftEndDayOffset === 1 ? " (+1 day)" : ""}</p><p className="mt-1">Edit the time above before selecting days. This practitioner-first action saves only the dates you check below.</p></div>
          </div>
          <div className="space-y-2"><div className="flex flex-wrap items-center justify-between gap-2"><p className="text-xs font-medium text-muted-foreground">{monthStart.slice(0, 7)} dates for the selected practitioner</p><Badge variant="outline">{bulkDates.length} selected</Badge></div><div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">{getMonthDates(monthStart).map((date) => { const selected = bulkDates.includes(date); return <label key={date} className={`flex cursor-pointer items-center gap-2 rounded-md border p-2 text-xs ${selected ? "border-emerald-600 bg-emerald-50 dark:bg-emerald-950/30" : "bg-background"}`}><input type="checkbox" checked={selected} onChange={() => toggleBulkDate(date)} className="h-4 w-4 accent-emerald-700" /><span>{date.slice(-2)} {new Date(`${date}T12:00:00`).toLocaleDateString(undefined, { weekday: "short" })}</span></label>; })}</div></div>
          <Button className="w-full sm:w-auto" onClick={saveBulkAssignments} disabled={bulkAssignMutation.isPending || !bulkDepartmentId || !bulkUtlUserId || bulkDates.length === 0}>{bulkAssignMutation.isPending ? "Saving UTL shifts…" : "Assign selected dates to this practitioner"}</Button>
          <p className="text-xs text-muted-foreground">Each checked date becomes a separate provider-owned dated duty. The selected provider must accept each duty in the provider portal. Changing an existing provider or interval reopens acceptance/readiness for that date.</p>
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
                                submitSelectedRoster(dept.id, rosterEntry.utlUserId, statusVal);
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

                    {rosterEntry && isSelectedShiftUpcoming && rosterEntry.assignmentStatus !== "ended" && (
                      <div className="border-t pt-2">
                        {cancelRosterId !== rosterEntry.id ? (
                          <Button type="button" size="sm" variant="outline" className="w-full border-rose-300 text-rose-800 hover:bg-rose-50" onClick={() => { setCancelRosterId(rosterEntry.id); setCancelReason(""); }}>
                            Cancel future UTL assignment
                          </Button>
                        ) : (
                          <div className="space-y-2 rounded-md border border-rose-200 bg-rose-50/60 p-2">
                            <p className="text-xs font-medium text-rose-900">Why is this future assignment being canceled?</p>
                            <Input value={cancelReason} onChange={(event) => setCancelReason(event.target.value)} placeholder="Required reason" className="bg-white text-xs" />
                            <div className="flex flex-col gap-2 sm:flex-row">
                              <Button type="button" size="sm" variant="destructive" className="sm:flex-1" onClick={() => cancelUtlMutation.mutate({ institutionId, rosterId: rosterEntry.id, reason: cancelReason.trim() })} disabled={cancelUtlMutation.isPending || cancelReason.trim().length < 3}>
                                {cancelUtlMutation.isPending ? "Canceling…" : "Confirm cancellation"}
                              </Button>
                              <Button type="button" size="sm" variant="outline" onClick={() => setCancelRosterId(null)} disabled={cancelUtlMutation.isPending}>Keep assignment</Button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="grid gap-1.5">
                      <span className="text-xs font-medium text-muted-foreground">Assign linked provider</span>
                      <Select
                        onValueChange={(staffUserId) =>
                          submitSelectedRoster(dept.id, parseInt(staffUserId, 10))
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
                  <TableHead>Future assignment</TableHead>
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
                                submitSelectedRoster(dept.id, rosterEntry.utlUserId, statusVal);
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
                      <TableCell>
                        {rosterEntry && isSelectedShiftUpcoming && rosterEntry.assignmentStatus !== "ended" ? (
                          cancelRosterId !== rosterEntry.id ? (
                            <Button type="button" size="sm" variant="outline" className="whitespace-nowrap border-rose-300 text-rose-800 hover:bg-rose-50" onClick={() => { setCancelRosterId(rosterEntry.id); setCancelReason(""); }}>Cancel future</Button>
                          ) : (
                            <div className="min-w-[220px] space-y-2 rounded-md border border-rose-200 bg-rose-50 p-2">
                              <Input value={cancelReason} onChange={(event) => setCancelReason(event.target.value)} placeholder="Reason (required)" className="bg-white text-xs" />
                              <div className="flex gap-1.5"><Button type="button" size="sm" variant="destructive" onClick={() => cancelUtlMutation.mutate({ institutionId, rosterId: rosterEntry.id, reason: cancelReason.trim() })} disabled={cancelUtlMutation.isPending || cancelReason.trim().length < 3}>{cancelUtlMutation.isPending ? "Canceling…" : "Confirm"}</Button><Button type="button" size="sm" variant="outline" onClick={() => setCancelRosterId(null)} disabled={cancelUtlMutation.isPending}>Keep</Button></div>
                            </div>
                          )
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
