import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarClock, CheckCircle2, Info, ShieldCheck, Search } from "lucide-react";
import { toast } from "sonner";

const SHIFT_TIME_PRESETS = {
  morning: { label: "Morning", startTime: "07:30", endTime: "17:30", endDayOffset: 0 },
  evening: { label: "Evening", startTime: "17:30", endTime: "21:30", endDayOffset: 0 },
  night: { label: "Night", startTime: "21:30", endTime: "05:30", endDayOffset: 1 },
} as const;

type ShiftType = keyof typeof SHIFT_TIME_PRESETS;

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function shortTime(value: string | null | undefined) {
  return value?.slice(0, 5) ?? "—";
}

function getMonthDates(monthStart: string): string[] {
  const [year, month] = monthStart.split("-").map(Number);
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return Array.from({ length: daysInMonth }, (_, index) => `${monthStart.slice(0, 7)}-${String(index + 1).padStart(2, "0")}`);
}

export default function ProviderIersErcoStaffingPanel() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const [selectedAssignmentId, setSelectedAssignmentId] = useState("");
  const [selectedDate, setSelectedDate] = useState(todayIso);
  const [selectedShift, setSelectedShift] = useState<ShiftType>("morning");
  const [selectedStartTime, setSelectedStartTime] = useState<string>(SHIFT_TIME_PRESETS.morning.startTime);
  const [selectedEndTime, setSelectedEndTime] = useState<string>(SHIFT_TIME_PRESETS.morning.endTime);
  const [selectedEndDayOffset, setSelectedEndDayOffset] = useState<0 | 1>(0);
  const [selectedTemplateId, setSelectedTemplateId] = useState("none");
  const [selectedUtlUserId, setSelectedUtlUserId] = useState("");
  const [nurseSearch, setNurseSearch] = useState("");
  const [bulkDates, setBulkDates] = useState<string[]>([]);

  const ercoQuery = trpc.institution.getMyDepartmentResponseAssignments.useQuery(undefined, {
    enabled: Boolean(user),
    staleTime: 15_000,
  });
  const acceptedErcoAssignments = useMemo(
    () => (ercoQuery.data ?? []).filter(
      (assignment) => assignment.coordinatorUserId === user?.id && assignment.assignmentStatus === "active" && assignment.poleId != null,
    ),
    [ercoQuery.data, user?.id],
  );

  useEffect(() => {
    if (acceptedErcoAssignments.length === 0) {
      setSelectedAssignmentId("");
      return;
    }
    if (!acceptedErcoAssignments.some((assignment) => String(assignment.id) === selectedAssignmentId)) {
      setSelectedAssignmentId(String(acceptedErcoAssignments[0].id));
    }
  }, [acceptedErcoAssignments, selectedAssignmentId]);

  const activeAssignment = acceptedErcoAssignments.find((assignment) => String(assignment.id) === selectedAssignmentId) ?? null;
  const institutionId = activeAssignment?.institutionId ?? 0;
  const poleId = activeAssignment?.poleId ?? 0;
  const departmentId = activeAssignment?.departmentId ?? 0;

  const candidateQuery = trpc.institution.getDepartmentNurseCandidates.useQuery(
    { institutionId, departmentId },
    { enabled: institutionId > 0 && departmentId > 0, staleTime: 15_000 },
  );
  const templateQuery = trpc.institution.getInstitutionShiftTemplates.useQuery(
    { institutionId },
    { enabled: institutionId > 0, staleTime: 60_000 },
  );
  const rosterQuery = trpc.institution.getShiftUtlRoster.useQuery(
    { institutionId, poleId, shiftDate: selectedDate, shiftType: selectedShift },
    { enabled: institutionId > 0 && poleId > 0, staleTime: 5_000 },
  );

  const activeRoster = rosterQuery.data?.find((row) => row.departmentId === departmentId) ?? null;
  const allCandidates = candidateQuery.data ?? [];
  const nurseQuery = nurseSearch.trim().toLowerCase();
  const filteredCandidates = allCandidates.filter((candidate) => {
    if (!nurseQuery) return true;
    return `${candidate.staffName} ${candidate.staffEmail} ${candidate.staffRole}`.toLowerCase().includes(nurseQuery);
  });
  const assignableCandidates = filteredCandidates.filter((candidate) => candidate.assignable && candidate.userId != null);
  const currentCandidate = activeRoster ? allCandidates.find((candidate) => candidate.userId === activeRoster.utlUserId) : null;
  const pickerCandidates = currentCandidate && !filteredCandidates.some((candidate) => candidate.id === currentCandidate.id)
    ? [currentCandidate, ...filteredCandidates]
    : filteredCandidates;
  const pendingCandidates = pickerCandidates.filter((candidate) => !candidate.assignable);
  const pickerAssignableCandidates = pickerCandidates.filter((candidate) => candidate.assignable && candidate.userId != null);

  useEffect(() => {
    const preset = SHIFT_TIME_PRESETS[selectedShift];
    setSelectedUtlUserId(activeRoster?.utlUserId != null ? String(activeRoster.utlUserId) : "");
    setSelectedStartTime(activeRoster?.shiftStartTime?.slice(0, 5) ?? preset.startTime);
    setSelectedEndTime(activeRoster?.shiftEndTime?.slice(0, 5) ?? preset.endTime);
    setSelectedEndDayOffset(activeRoster?.shiftEndDayOffset === 1 ? 1 : preset.endDayOffset);
    setSelectedTemplateId(activeRoster?.shiftTemplateId != null ? String(activeRoster.shiftTemplateId) : "none");
  }, [
    activeRoster?.id,
    activeRoster?.utlUserId,
    activeRoster?.shiftStartTime,
    activeRoster?.shiftEndTime,
    activeRoster?.shiftEndDayOffset,
    activeRoster?.shiftTemplateId,
    selectedShift,
  ]);

  const saveRosterMutation = trpc.institution.submitShiftUtlRoster.useMutation({
    onSuccess: async (result) => {
      toast.success(result.changed ? "UTL reassigned; the replacement provider must accept the new duty." : "UTL staffing saved.");
      await Promise.all([
        rosterQuery.refetch(),
        utils.institution.getMyDepartmentResponseAssignments.invalidate(),
        utils.institution.getMyProviderDutyAssignments.invalidate(),
        utils.iers.getMyShiftReadiness.invalidate(),
      ]);
    },
    onError: (error) => toast.error(error.message || "Could not save this UTL assignment."),
  });

  const bulkAssignMutation = trpc.institution.bulkAssignShiftUtlProvider.useMutation({
    onSuccess: async (result) => {
      toast.success(`${result.savedCount} UTL shift(s) saved; the selected practitioner must accept each dated duty.`);
      setBulkDates([]);
      await Promise.all([
        rosterQuery.refetch(),
        utils.institution.getMyDepartmentResponseAssignments.invalidate(),
        utils.institution.getMyProviderDutyAssignments.invalidate(),
        utils.iers.getMyShiftReadiness.invalidate(),
      ]);
    },
    onError: (error) => toast.error(error.message || "Could not apply the practitioner to those shifts."),
  });

  const applyPreset = (shiftType: ShiftType) => {
    const preset = SHIFT_TIME_PRESETS[shiftType];
    setSelectedShift(shiftType);
    setSelectedTemplateId("none");
    setSelectedStartTime(preset.startTime);
    setSelectedEndTime(preset.endTime);
    setSelectedEndDayOffset(preset.endDayOffset);
  };

  const applyTemplate = (templateId: string) => {
    setSelectedTemplateId(templateId);
    const template = templateQuery.data?.find((item) => String(item.id) === templateId);
    if (!template) return;
    setSelectedStartTime(template.startTime.slice(0, 5));
    setSelectedEndTime(template.endTime.slice(0, 5));
    setSelectedEndDayOffset(template.endDayOffset === 1 ? 1 : 0);
  };

  const currentAssignmentChanged = Boolean(
    activeRoster && (
      String(activeRoster.utlUserId) !== selectedUtlUserId ||
      shortTime(activeRoster.shiftStartTime) !== selectedStartTime ||
      shortTime(activeRoster.shiftEndTime) !== selectedEndTime ||
      (activeRoster.shiftEndDayOffset ?? 0) !== selectedEndDayOffset
    ),
  );

  const toggleBulkDate = (date: string) => {
    setBulkDates((current) => current.includes(date) ? current.filter((item) => item !== date) : [...current, date].sort());
  };

  const saveRoster = () => {
    if (!activeAssignment || !selectedUtlUserId) {
      toast.error("Choose an active linked nurse from your department first.");
      return;
    }
    const selectedCandidate = allCandidates.find((candidate) => String(candidate.userId) === selectedUtlUserId && candidate.assignable);
    if (!selectedCandidate?.userId) {
      toast.error("Choose an active linked nurse from your department.");
      return;
    }
    saveRosterMutation.mutate({
      institutionId,
      poleId,
      departmentId,
      shiftDate: selectedDate,
      shiftType: selectedShift,
      shiftStartTime: selectedStartTime,
      shiftEndTime: selectedEndTime,
      shiftEndDayOffset: selectedEndDayOffset,
      shiftTemplateId: selectedTemplateId === "none" ? null : Number(selectedTemplateId),
      utlUserId: selectedCandidate.userId,
      isShiftErtl: false,
      status: "active",
    });
  };

  const saveBulkAssignments = () => {
    if (!activeAssignment || !selectedUtlUserId || bulkDates.length === 0) {
      toast.error("Choose a practitioner and at least one date first.");
      return;
    }
    const selectedCandidate = allCandidates.find((candidate) => String(candidate.userId) === selectedUtlUserId && candidate.assignable);
    if (!selectedCandidate?.userId) {
      toast.error("Choose an active linked nurse from your department first.");
      return;
    }
    bulkAssignMutation.mutate({
      institutionId,
      poleId,
      utlUserId: selectedCandidate.userId,
      assignments: bulkDates.map((shiftDate) => ({
        departmentId,
        shiftDate,
        shiftType: selectedShift,
        shiftStartTime: selectedStartTime,
        shiftEndTime: selectedEndTime,
        shiftEndDayOffset: selectedEndDayOffset,
        shiftTemplateId: selectedTemplateId === "none" ? null : Number(selectedTemplateId),
      })),
    });
  };

  if (ercoQuery.isLoading) return null;

  if (acceptedErcoAssignments.length === 0) {
    return (
      <Card className="border-rose-200 bg-rose-50/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-rose-950"><ShieldCheck className="h-5 w-5" />ERCo UTL staffing</CardTitle>
          <CardDescription>Only an accepted standing ERCo can edit dated UTL staffing from the Individual platform.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-rose-900">No accepted ERCo staffing appointment is available for this account. Ask the institution administrator to appoint you as the department ERCo, then accept the appointment.</p>
          <Button className="mt-4" variant="outline" onClick={() => setLocation("/home")}>Back to provider dashboard</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      <Card className="border-rose-200 overflow-hidden">
        <CardHeader className="border-b border-rose-100 bg-rose-50/50">
          <CardTitle className="flex items-center gap-2 text-rose-950"><ShieldCheck className="h-5 w-5 text-rose-700" />Manage department UTL staffing</CardTitle>
          <CardDescription>As the accepted ERCo, you can select or replace the actual UTL for your department’s dated shifts. ERCo governance remains separate from response duty.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5 pt-5">
          {acceptedErcoAssignments.length > 1 && (
            <label className="grid gap-2 text-sm font-medium">
              Department appointment
              <Select value={selectedAssignmentId} onValueChange={setSelectedAssignmentId}>
                <SelectTrigger><SelectValue placeholder="Choose your department" /></SelectTrigger>
                <SelectContent>
                  {acceptedErcoAssignments.map((assignment) => (
                    <SelectItem key={assignment.id} value={String(assignment.id)}>
                      {assignment.departmentName ?? `Department ${assignment.departmentId}`} · {assignment.poleName ?? "Pole"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>
          )}

          {activeAssignment && (
            <div className="rounded-lg border bg-slate-50 p-3 text-sm">
              <p className="font-semibold">{activeAssignment.departmentName ?? `Department ${activeAssignment.departmentId}`}</p>
              <p className="text-xs text-muted-foreground">{activeAssignment.poleName ?? "Assigned response pole"} · staffing scope limited to this department</p>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-medium">
              Date
              <Input type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} />
            </label>
            <label className="grid gap-2 text-sm font-medium">
              Shift
              <Select value={selectedShift} onValueChange={(value: ShiftType) => applyPreset(value)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.entries(SHIFT_TIME_PRESETS) as Array<[ShiftType, (typeof SHIFT_TIME_PRESETS)[ShiftType]]>).map(([value, preset]) => (
                    <SelectItem key={value} value={value}>{preset.label} shift</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <label className="grid gap-2 text-sm font-medium">Start time<Input type="time" value={selectedStartTime} onChange={(event) => { setSelectedTemplateId("none"); setSelectedStartTime(event.target.value); }} /></label>
            <label className="grid gap-2 text-sm font-medium">End time<Input type="time" value={selectedEndTime} onChange={(event) => { setSelectedTemplateId("none"); setSelectedEndTime(event.target.value); }} /></label>
            <label className="grid gap-2 text-sm font-medium">End day<Select value={String(selectedEndDayOffset)} onValueChange={(value) => { setSelectedTemplateId("none"); setSelectedEndDayOffset(value === "1" ? 1 : 0); }}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="0">Same day</SelectItem><SelectItem value="1">Next day (overnight)</SelectItem></SelectContent></Select></label>
          </div>

          <label className="grid gap-2 text-sm font-medium">
            Saved facility hours (optional)
            <Select value={selectedTemplateId} onValueChange={applyTemplate}>
              <SelectTrigger><SelectValue placeholder="Choose a saved template" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No saved template</SelectItem>
                {(templateQuery.data ?? []).map((template) => <SelectItem key={template.id} value={String(template.id)}>{template.templateName} · {shortTime(template.startTime)}–{shortTime(template.endTime)}{template.endDayOffset === 1 ? " next day" : ""}</SelectItem>)}
              </SelectContent>
            </Select>
          </label>

          <div className="grid gap-2">
            <label className="text-sm font-medium" htmlFor="provider-iers-utl-search">Department nurses</label>
            <div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input id="provider-iers-utl-search" value={nurseSearch} onChange={(event) => setNurseSearch(event.target.value)} placeholder="Search name, email, or role" className="pl-9" /></div>
            <Select value={selectedUtlUserId} onValueChange={setSelectedUtlUserId}>
              <SelectTrigger id="provider-iers-utl-provider"><SelectValue placeholder="Choose a nurse from your department" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Choose practitioner</SelectItem>
                {pickerAssignableCandidates.map((candidate) => <SelectItem key={candidate.userId} value={String(candidate.userId)}>{candidate.staffName} · {candidate.staffRole}</SelectItem>)}
                {pendingCandidates.map((candidate) => <SelectItem key={`pending-${candidate.id}`} value={`pending-${candidate.id}`} disabled>{candidate.staffName} · account link or active membership required</SelectItem>)}
              </SelectContent>
            </Select>
            <p className="text-[11px] text-muted-foreground">Showing {pickerAssignableCandidates.length} eligible nurse(s){pendingCandidates.length > 0 ? ` and ${pendingCandidates.length} registered candidate(s) not yet assignable` : ""}. The search is limited to your department.</p>
            {pickerAssignableCandidates.length === 0 && <p className="text-xs text-rose-700">No active linked nurse is currently eligible in this department. Institution administration must link or correct the nurse’s department before a UTL can be assigned.</p>}
          </div>

          {activeRoster && (
            <div className="rounded-lg border bg-white p-3 text-sm">
              <p className="font-semibold">Existing staffing for this date and shift</p>
              <p className="text-xs text-muted-foreground">{currentCandidate?.staffName ?? `Provider #${activeRoster.utlUserId}`} · {shortTime(activeRoster.shiftStartTime)}–{shortTime(activeRoster.shiftEndTime)}{activeRoster.shiftEndDayOffset === 1 ? " next day" : ""}</p>
              <div className="mt-2 flex flex-wrap gap-2 text-xs">
                <Badge variant={activeRoster.assignmentStatus === "active" ? "default" : "secondary"}>{activeRoster.assignmentStatus === "pending_acceptance" ? "Acceptance pending" : activeRoster.assignmentStatus}</Badge>
                {activeRoster.acceptedAt && <Badge variant="outline">Provider accepted</Badge>}
                {activeRoster.readinessSignOffAt && <Badge variant="outline">Readiness signed off</Badge>}
              </div>
            </div>
          )}

          {currentAssignmentChanged && activeRoster?.assignmentStatus === "active" && (
            <Alert className="border-amber-200 bg-amber-50/70">
              <Info className="h-4 w-4 text-amber-700" />
              <AlertTitle>Reassignment will reopen acceptance</AlertTitle>
              <AlertDescription>Saving a different provider or exact interval clears the outgoing provider’s acceptance and readiness sign-off for this dated shift. The replacement provider must accept the new duty in the Individual platform.</AlertDescription>
            </Alert>
          )}

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground">Only this department, date, and shift will change. ERTL department rotation remains automatic from pole order.</p>
            <Button onClick={saveRoster} disabled={!activeAssignment || !selectedUtlUserId || !allCandidates.some((candidate) => String(candidate.userId) === selectedUtlUserId && candidate.assignable) || saveRosterMutation.isPending} className="w-full sm:w-auto">
              {saveRosterMutation.isPending ? "Saving…" : activeRoster ? "Save staffing change" : "Assign UTL"}
              {!saveRosterMutation.isPending && <CheckCircle2 className="ml-2 h-4 w-4" />}
            </Button>
          </div>

          <div className="space-y-3 rounded-lg border border-emerald-200 bg-emerald-50/40 p-4">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-semibold text-emerald-950">Assign one practitioner across multiple UTL shifts</p><p className="text-xs text-emerald-900/70">Select the dates this nurse will actually cover. Existing rows are updated safely and still require provider acceptance.</p></div><Badge variant="outline">{bulkDates.length} selected</Badge></div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">{getMonthDates(selectedDate.slice(0, 7)).map((date) => { const selected = bulkDates.includes(date); return <label key={date} className={`flex cursor-pointer items-center gap-2 rounded-md border p-2 text-xs ${selected ? "border-emerald-600 bg-emerald-100 dark:bg-emerald-950/30" : "bg-background"}`}><input type="checkbox" checked={selected} onChange={() => toggleBulkDate(date)} className="h-4 w-4 accent-emerald-700" /><span>{date.slice(-2)} {new Date(`${date}T12:00:00`).toLocaleDateString(undefined, { weekday: "short" })}</span></label>; })}</div>
            <Button onClick={saveBulkAssignments} disabled={!activeAssignment || !selectedUtlUserId || !allCandidates.some((candidate) => String(candidate.userId) === selectedUtlUserId && candidate.assignable) || bulkDates.length === 0 || bulkAssignMutation.isPending} className="w-full sm:w-auto">{bulkAssignMutation.isPending ? "Saving selected shifts…" : "Assign selected dates to this practitioner"}</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><CalendarClock className="h-5 w-5" />What happens after you save?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>The nominated provider receives a dated UTL duty and must accept it. Acceptance is separate from your ERCo governance appointment.</p>
          <p>If a staff member resigns or becomes unavailable, choose the replacement nurse and save again. The previous acceptance/readiness state is cleared automatically for that shift; no automatic replacement is invented.</p>
          <Button variant="outline" onClick={() => setLocation("/home")}>Return to provider dashboard</Button>
        </CardContent>
      </Card>
    </div>
  );
}
