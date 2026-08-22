import { useMemo, useState } from "react";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "../../../server/routers";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Ban, Calendar, CheckCircle2, Loader2, Pencil, Trash2, Users } from "lucide-react";

 type InstitutionOutputs = inferRouterOutputs<AppRouter>["institution"];
type TrainingScheduleRow = InstitutionOutputs["getTrainingSchedules"][number];
type ProgramType = "bls" | "acls" | "pals" | "fellowship";
type TrainingType = "online" | "hands_on" | "hybrid";
type TrainingStatus = "scheduled" | "in_progress" | "completed" | "cancelled";
type AttendanceStatus = "registered" | "attended" | "absent" | "cancelled";

const PROGRAMS: Array<{ value: ProgramType; label: string }> = [
  { value: "bls", label: "BLS" },
  { value: "acls", label: "ACLS" },
  { value: "pals", label: "PALS" },
  { value: "fellowship", label: "Fellowship" },
];

const TRAINING_TYPES: Array<{ value: TrainingType; label: string }> = [
  { value: "online", label: "Online" },
  { value: "hands_on", label: "Hands-on" },
  { value: "hybrid", label: "Hybrid" },
];

const TRAINING_STATUSES: Array<{ value: TrainingStatus; label: string }> = [
  { value: "scheduled", label: "Scheduled" },
  { value: "in_progress", label: "In progress" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

const ATTENDANCE_STATUSES: Array<{ value: AttendanceStatus; label: string }> = [
  { value: "registered", label: "Registered" },
  { value: "attended", label: "Attended" },
  { value: "absent", label: "Absent" },
  { value: "cancelled", label: "Cancelled" },
];

function defaultDateTime(): string {
  const now = new Date();
  const timezoneOffset = now.getTimezoneOffset();
  return new Date(now.getTime() - timezoneOffset * 60_000).toISOString().slice(0, 16);
}

function toLocalDateTime(value: Date | string | null | undefined): string {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return defaultDateTime();
  const timezoneOffset = date.getTimezoneOffset();
  return new Date(date.getTime() - timezoneOffset * 60_000).toISOString().slice(0, 16);
}

function toLocalDate(value: Date | string | null | undefined): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const timezoneOffset = date.getTimezoneOffset();
  return new Date(date.getTime() - timezoneOffset * 60_000).toISOString().slice(0, 10);
}

function parseLocalDateOnly(value: string): Date | undefined {
  if (!value) return undefined;
  const [year, month, day] = value.split("-").map(Number);
  if (![year, month, day].every(Number.isFinite)) return undefined;
  return new Date(year, month - 1, day, 23, 59, 59, 999);
}

function programLabel(value: string | null | undefined): string {
  return PROGRAMS.find((program) => program.value === value)?.label ?? value ?? "Unknown";
}

function trainingTypeLabel(value: string | null | undefined): string {
  return TRAINING_TYPES.find((type) => type.value === value)?.label ?? value?.replace(/_/g, " ") ?? "—";
}

function statusLabel(value: string | null | undefined): string {
  return TRAINING_STATUSES.find((status) => status.value === value)?.label ?? value ?? "Unknown";
}

function statusVariant(value: string | null | undefined): "default" | "secondary" | "outline" | "destructive" {
  if (value === "completed") return "default";
  if (value === "in_progress") return "secondary";
  if (value === "cancelled") return "destructive";
  return "outline";
}

function emptyForm() {
  return {
    programType: "bls" as ProgramType,
    trainingType: "hands_on" as TrainingType,
    scheduledDate: defaultDateTime(),
    endDate: "",
    startTime: "",
    endTime: "",
    location: "",
    instructorUserId: "none",
    instructorName: "",
    maxCapacity: "24",
  };
}

type SessionForm = ReturnType<typeof emptyForm>;

type EditSessionForm = SessionForm & { status: TrainingStatus };

function editFormFromRow(row: TrainingScheduleRow): EditSessionForm {
  const programType = PROGRAMS.some((program) => program.value === row.programType)
    ? (row.programType as ProgramType)
    : "bls";
  const trainingType = TRAINING_TYPES.some((type) => type.value === row.trainingType)
    ? (row.trainingType as TrainingType)
    : "hands_on";
  const status = TRAINING_STATUSES.some((item) => item.value === row.status)
    ? (row.status as TrainingStatus)
    : "scheduled";

  return {
    programType,
    trainingType,
    scheduledDate: toLocalDateTime(row.scheduledDate),
    endDate: toLocalDate(row.endDate),
    startTime: row.startTime ?? "",
    endTime: row.endTime ?? "",
    location: row.location ?? "",
    instructorUserId: row.instructorId == null ? "none" : String(row.instructorId),
    instructorName: row.instructorName ?? "",
    maxCapacity: String(row.maxCapacity ?? 24),
    status,
  };
}

export function InstitutionIersCompetencyPanel({ institutionId }: { institutionId: number }) {
  const utils = trpc.useUtils();
  const [scheduleForm, setScheduleForm] = useState<SessionForm>(() => emptyForm());
  const [selectedScheduleForAttendance, setSelectedScheduleForAttendance] = useState<number | null>(null);
  const [scheduleEditOpen, setScheduleEditOpen] = useState(false);
  const [scheduleEditTarget, setScheduleEditTarget] = useState<TrainingScheduleRow | null>(null);
  const [scheduleEditForm, setScheduleEditForm] = useState<EditSessionForm>(() => ({
    ...emptyForm(),
    status: "scheduled",
  }));
  const [scheduleDeleteTarget, setScheduleDeleteTarget] = useState<TrainingScheduleRow | null>(null);
  const [savingAttendanceForStaffId, setSavingAttendanceForStaffId] = useState<number | null>(null);
  const [verificationNotes, setVerificationNotes] = useState("");

  const { data: trainingSchedules, isLoading: schedulesLoading } = trpc.institution.getTrainingSchedules.useQuery({
    institutionId,
  });
  const { data: assignableInstructors } = trpc.institution.listAssignableInstructors.useQuery({
    institutionId,
    programType: scheduleForm.programType,
  });
  const { data: assignableInstructorsForEdit } = trpc.institution.listAssignableInstructors.useQuery({
    institutionId,
    programType: scheduleEditForm.programType,
  });
  const { data: competencyRecords, isLoading: competencyRecordsLoading } = trpc.institution.getIersCompetencyRecords.useQuery({
    institutionId,
  });
  const { data: attendanceRoster, isLoading: attendanceRosterLoading, refetch: refetchAttendance } =
    trpc.institution.getTrainingAttendanceForSchedule.useQuery(
      {
        institutionId,
        trainingScheduleId: selectedScheduleForAttendance ?? 0,
      },
      { enabled: selectedScheduleForAttendance != null },
    );

  const summary = useMemo(() => {
    const rows = trainingSchedules ?? [];
    return {
      sessions: rows.length,
      active: rows.filter((row) => row.status !== "cancelled").length,
      enrolled: rows.reduce((total, row) => total + (row.enrolledCount ?? 0), 0),
      capacity: rows.reduce((total, row) => total + (row.maxCapacity ?? 0), 0),
    };
  }, [trainingSchedules]);

  const invalidateTraining = async (scheduleId?: number) => {
    await utils.institution.getTrainingSchedules.invalidate({ institutionId });
    void utils.institution.getStaffMembers.invalidate({ institutionId });
    void utils.institution.getStats.invalidate({ institutionId });
    void utils.institution.getInstitutionalAnalytics.invalidate({ institutionId });
    void utils.institution.getIersCompetencyRecords.invalidate({ institutionId });
    if (scheduleId != null) {
      void utils.institution.getTrainingAttendanceForSchedule.invalidate({
        institutionId,
        trainingScheduleId: scheduleId,
      });
    }
  };

  const createTrainingScheduleMutation = trpc.institution.createTrainingSchedule.useMutation({
    onSuccess: async () => {
      await invalidateTraining();
      setScheduleForm(emptyForm());
      toast.success("IERS competency session scheduled");
    },
    onError: (error) => toast.error(error.message || "Could not create competency session"),
  });

  const updateTrainingScheduleMutation = trpc.institution.updateTrainingSchedule.useMutation({
    onSuccess: async (_data, variables) => {
      await invalidateTraining(variables.trainingScheduleId);
      setScheduleEditOpen(false);
      setScheduleEditTarget(null);
      toast.success("IERS competency session updated");
    },
    onError: (error) => toast.error(error.message || "Could not update competency session"),
  });

  const deleteTrainingScheduleMutation = trpc.institution.deleteTrainingSchedule.useMutation({
    onSuccess: async (_data, variables) => {
      await invalidateTraining();
      setSelectedScheduleForAttendance((current) => (current === variables.trainingScheduleId ? null : current));
      setScheduleDeleteTarget(null);
      toast.success("IERS competency session removed");
    },
    onError: (error) => toast.error(error.message || "Could not remove competency session"),
  });

  const upsertAttendanceMutation = trpc.institution.upsertTrainingAttendance.useMutation({
    onSuccess: async () => {
      if (selectedScheduleForAttendance != null) {
        await refetchAttendance();
        await invalidateTraining(selectedScheduleForAttendance);
      }
    },
    onError: (error) => toast.error(error.message || "Could not update attendance"),
    onSettled: () => setSavingAttendanceForStaffId(null),
  });

  const registerAllStaffMutation = trpc.institution.registerAllStaffForTrainingSession.useMutation({
    onSuccess: async (result) => {
      if (selectedScheduleForAttendance != null) {
        await refetchAttendance();
        await invalidateTraining(selectedScheduleForAttendance);
      }
      toast.success(result.added ? `Registered ${result.added} staff` : "Roster was already complete");
    },
    onError: (error) => toast.error(error.message || "Could not register institutional roster"),
  });
  const verifyCompetencyMutation = trpc.institution.verifyIersCompetencyRecord.useMutation({
    onSuccess: async () => {
      setVerificationNotes("");
      await utils.institution.getIersCompetencyRecords.invalidate({ institutionId });
      toast.success("IERS competency review saved");
    },
    onError: (error) => toast.error(error.message || "Could not save competency review"),
  });

  const openScheduleEdit = (row: TrainingScheduleRow) => {
    setScheduleEditTarget(row);
    setScheduleEditForm(editFormFromRow(row));
    setScheduleEditOpen(true);
  };

  const submitCreate = () => {
    const maxCapacity = Number.parseInt(scheduleForm.maxCapacity, 10);
    const scheduledDate = new Date(scheduleForm.scheduledDate);
    if (Number.isNaN(scheduledDate.getTime())) {
      toast.error("Enter a valid session start date and time");
      return;
    }
    if (!Number.isFinite(maxCapacity) || maxCapacity < 1) {
      toast.error("Enter a valid session capacity");
      return;
    }
    createTrainingScheduleMutation.mutate({
      institutionId,
      programType: scheduleForm.programType,
      trainingType: scheduleForm.trainingType,
      scheduledDate,
      endDate: parseLocalDateOnly(scheduleForm.endDate),
      startTime: scheduleForm.startTime.trim() || undefined,
      endTime: scheduleForm.endTime.trim() || undefined,
      location: scheduleForm.location.trim() || undefined,
      instructorUserId: scheduleForm.instructorUserId === "none" ? undefined : Number(scheduleForm.instructorUserId),
      instructorName: scheduleForm.instructorName.trim() || undefined,
      maxCapacity,
    });
  };

  const submitEdit = () => {
    if (!scheduleEditTarget) return;
    const maxCapacity = Number.parseInt(scheduleEditForm.maxCapacity, 10);
    const scheduledDate = new Date(scheduleEditForm.scheduledDate);
    if (Number.isNaN(scheduledDate.getTime())) {
      toast.error("Enter a valid session start date and time");
      return;
    }
    if (!Number.isFinite(maxCapacity) || maxCapacity < 1) {
      toast.error("Enter a valid session capacity");
      return;
    }
    updateTrainingScheduleMutation.mutate({
      institutionId,
      trainingScheduleId: scheduleEditTarget.id,
      programType: scheduleEditForm.programType,
      trainingType: scheduleEditForm.trainingType,
      scheduledDate,
      endDate: scheduleEditForm.endDate ? parseLocalDateOnly(scheduleEditForm.endDate) ?? null : null,
      startTime: scheduleEditForm.startTime.trim() || null,
      endTime: scheduleEditForm.endTime.trim() || null,
      location: scheduleEditForm.location.trim() || null,
      instructorUserId: scheduleEditForm.instructorUserId === "none" ? null : Number(scheduleEditForm.instructorUserId),
      instructorName: scheduleEditForm.instructorName.trim() || null,
      maxCapacity,
      status: scheduleEditForm.status,
    });
  };

  const changeAttendance = (staffMemberId: number, attendanceStatus: AttendanceStatus) => {
    if (selectedScheduleForAttendance == null) return;
    setSavingAttendanceForStaffId(staffMemberId);
    upsertAttendanceMutation.mutate({
      institutionId,
      trainingScheduleId: selectedScheduleForAttendance,
      staffMemberId,
      attendanceStatus,
    });
  };

  return (
    <div className="space-y-6">
      <Alert className="border-amber-200 bg-amber-50/60 dark:border-amber-900 dark:bg-amber-950/20">
        <CheckCircle2 className="h-4 w-4 text-amber-700" />
        <AlertDescription>
          These records belong to <strong>IERS Competency & Training</strong>. They document emergency-readiness competency
          activity and do not create CPD attendance, CPD points, or official AHA credentials.
        </AlertDescription>
      </Alert>

      <div className="grid gap-3 sm:grid-cols-4">
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Sessions</p><p className="text-2xl font-semibold">{summary.sessions}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Non-cancelled</p><p className="text-2xl font-semibold">{summary.active}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Enrolled places</p><p className="text-2xl font-semibold">{summary.enrolled}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Capacity</p><p className="text-2xl font-semibold">{summary.capacity}</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Calendar className="h-5 w-5" />Schedule competency session</CardTitle>
          <CardDescription>Use the existing institutional scheduling workflow inside IERS. A course catalog entry is created automatically if needed.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2"><Label>Program</Label><Select value={scheduleForm.programType} onValueChange={(value) => setScheduleForm((form) => ({ ...form, programType: value as ProgramType }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{PROGRAMS.map((program) => <SelectItem key={program.value} value={program.value}>{program.label}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2"><Label>Format</Label><Select value={scheduleForm.trainingType} onValueChange={(value) => setScheduleForm((form) => ({ ...form, trainingType: value as TrainingType }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{TRAINING_TYPES.map((type) => <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2"><Label>Session start</Label><Input type="datetime-local" value={scheduleForm.scheduledDate} onChange={(event) => setScheduleForm((form) => ({ ...form, scheduledDate: event.target.value }))} /></div>
            <div className="space-y-2"><Label>Final session date (optional)</Label><Input type="date" min={scheduleForm.scheduledDate.slice(0, 10)} value={scheduleForm.endDate} onChange={(event) => setScheduleForm((form) => ({ ...form, endDate: event.target.value }))} /><p className="text-xs text-muted-foreground">Leave blank for a single-day session. Use this for multi-day competency sessions.</p></div>
            <div className="space-y-2"><Label>Wall-clock start</Label><Input placeholder="09:00" value={scheduleForm.startTime} onChange={(event) => setScheduleForm((form) => ({ ...form, startTime: event.target.value }))} /></div>
            <div className="space-y-2"><Label>Wall-clock end</Label><Input placeholder="17:00" value={scheduleForm.endTime} onChange={(event) => setScheduleForm((form) => ({ ...form, endTime: event.target.value }))} /></div>
            <div className="space-y-2 sm:col-span-2"><Label>Location or link</Label><Input placeholder="Simulation lab / ward / link" value={scheduleForm.location} onChange={(event) => setScheduleForm((form) => ({ ...form, location: event.target.value }))} /></div>
            <div className="space-y-2 sm:col-span-2"><Label>Approved instructor</Label><Select value={scheduleForm.instructorUserId} onValueChange={(value) => setScheduleForm((form) => ({ ...form, instructorUserId: value }))}><SelectTrigger><SelectValue placeholder="None" /></SelectTrigger><SelectContent><SelectItem value="none">None</SelectItem>{(assignableInstructors ?? []).map((instructor) => <SelectItem key={instructor.id} value={String(instructor.id)}>{instructor.name ?? instructor.email ?? `User ${instructor.id}`}</SelectItem>)}</SelectContent></Select><p className="text-xs text-muted-foreground">Only approved and course-qualified instructors are listed.</p></div>
            <div className="space-y-2 sm:col-span-2"><Label>Display instructor label (optional)</Label><Input value={scheduleForm.instructorName} onChange={(event) => setScheduleForm((form) => ({ ...form, instructorName: event.target.value }))} /></div>
            <div className="space-y-2"><Label>Maximum capacity</Label><Input type="number" min={1} max={2000} value={scheduleForm.maxCapacity} onChange={(event) => setScheduleForm((form) => ({ ...form, maxCapacity: event.target.value }))} /></div>
          </div>
          <Button onClick={submitCreate} disabled={createTrainingScheduleMutation.isPending}><Calendar className="mr-2 h-4 w-4" />{createTrainingScheduleMutation.isPending ? "Saving…" : "Create IERS session"}</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Calendar className="h-5 w-5" />Upcoming and past competency sessions</CardTitle><CardDescription>Sessions remain linked to this institution. Attendance is managed per session and remains separate from CPD records.</CardDescription></CardHeader>
        <CardContent>
          {schedulesLoading ? <p className="text-sm text-muted-foreground">Loading competency sessions…</p> : !trainingSchedules?.length ? <p className="text-sm text-muted-foreground">No IERS competency sessions yet.</p> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b text-left text-muted-foreground"><th className="py-2 pr-4">Date</th><th className="py-2 pr-4">Program</th><th className="py-2 pr-4">Format</th><th className="py-2 pr-4">Status</th><th className="py-2 pr-4">Location</th><th className="py-2 pr-4">Instructor</th><th className="py-2 pr-4">Capacity</th><th className="py-2 pr-4">Roster</th><th className="py-2 text-right">Actions</th></tr></thead>
                <tbody>
                  {trainingSchedules.map((row) => (
                    <tr key={row.id} className="border-b last:border-0">
                      <td className="whitespace-nowrap py-3 pr-4">{row.scheduledDate ? new Date(row.scheduledDate).toLocaleString() : "—"}</td>
                      <td className="py-3 pr-4">{programLabel(row.programType)}</td>
                      <td className="py-3 pr-4">{trainingTypeLabel(row.trainingType)}</td>
                      <td className="py-3 pr-4"><Badge variant={statusVariant(row.status)}>{statusLabel(row.status)}</Badge></td>
                      <td className="py-3 pr-4">{row.location || "—"}</td>
                      <td className="py-3 pr-4">{row.instructorUserName || row.instructorName || "—"}</td>
                      <td className="py-3 pr-4">{row.enrolledCount ?? 0} / {row.maxCapacity}</td>
                      <td className="py-3 pr-4"><Button type="button" size="sm" variant={selectedScheduleForAttendance === row.id ? "default" : "outline"} onClick={() => setSelectedScheduleForAttendance((current) => current === row.id ? null : row.id)}><Users className="mr-1 h-4 w-4" />{selectedScheduleForAttendance === row.id ? "Close" : "Roster"}</Button></td>
                      <td className="py-3 text-right"><div className="flex justify-end gap-1"><Button type="button" size="icon" variant="ghost" title="Edit session" onClick={() => openScheduleEdit(row)} disabled={updateTrainingScheduleMutation.isPending}><Pencil className="h-4 w-4" /></Button>{row.status !== "cancelled" && <Button type="button" size="icon" variant="ghost" title="Mark cancelled" onClick={() => updateTrainingScheduleMutation.mutate({ institutionId, trainingScheduleId: row.id, status: "cancelled" })} disabled={updateTrainingScheduleMutation.isPending}><Ban className="h-4 w-4" /></Button>}<Button type="button" size="icon" variant="ghost" className="text-destructive hover:text-destructive" title="Delete session" onClick={() => setScheduleDeleteTarget(row)} disabled={deleteTrainingScheduleMutation.isPending}><Trash2 className="h-4 w-4" /></Button></div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedScheduleForAttendance != null && (
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" />Session attendance</CardTitle><CardDescription>Register institutional staff and mark registered, attended, absent, or cancelled. The enrolled count uses non-cancelled rows.</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            <Button type="button" variant="secondary" size="sm" onClick={() => registerAllStaffMutation.mutate({ institutionId, trainingScheduleId: selectedScheduleForAttendance })} disabled={registerAllStaffMutation.isPending}><Users className="mr-2 h-4 w-4" />{registerAllStaffMutation.isPending ? "Registering…" : "Register all staff missing a row"}</Button>
            {attendanceRosterLoading ? <p className="text-sm text-muted-foreground">Loading staff roster…</p> : !attendanceRoster?.rows?.length ? <p className="text-sm text-muted-foreground">No staff on this institution roster. Add staff in Administration first.</p> : (
              <div className="overflow-x-auto rounded-md border">
                <table className="w-full text-sm"><thead><tr className="border-b bg-muted/40 text-left text-muted-foreground"><th className="px-3 py-2">Name</th><th className="px-3 py-2">Role</th><th className="px-3 py-2">Attendance</th></tr></thead><tbody>{attendanceRoster.rows.map((row) => <tr key={row.staffMemberId} className="border-b last:border-0"><td className="px-3 py-2"><div className="font-medium">{row.staffName}</div><div className="text-xs text-muted-foreground">{row.staffEmail}</div></td><td className="px-3 py-2 capitalize">{row.staffRole?.replace(/_/g, " ") || "—"}</td><td className="min-w-[180px] px-3 py-2">{row.attendanceId == null ? <Button type="button" size="sm" variant="outline" onClick={() => changeAttendance(row.staffMemberId, "registered")} disabled={savingAttendanceForStaffId === row.staffMemberId}>{savingAttendanceForStaffId === row.staffMemberId ? <><Loader2 className="mr-1 h-3 w-3 animate-spin" />Saving…</> : "Register on session"}</Button> : <Select value={row.attendanceStatus ?? "registered"} onValueChange={(value) => changeAttendance(row.staffMemberId, value as AttendanceStatus)} disabled={savingAttendanceForStaffId === row.staffMemberId}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{ATTENDANCE_STATUSES.map((status) => <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>)}</SelectContent></Select>}</td></tr>)}</tbody></table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5" />Per-program competency records</CardTitle><CardDescription>These records are generated from attendance but remain separate from generic staff enrollment. Attended is not the same as independently verified competency.</CardDescription></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2"><Label htmlFor="competency-review-notes">Reviewer note (used for the next verification action)</Label><Input id="competency-review-notes" placeholder="What was independently reviewed?" value={verificationNotes} onChange={(event) => setVerificationNotes(event.target.value)} maxLength={2000} /><p className="text-xs text-muted-foreground">Verification requires an attended source record and an authorised IERS reviewer. It does not issue an official AHA credential.</p></div>
          {competencyRecordsLoading ? <p className="text-sm text-muted-foreground">Loading competency records…</p> : !competencyRecords?.length ? <p className="text-sm text-muted-foreground">No per-program competency records yet. Register staff on a session to create the source record.</p> : (
            <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b text-left text-muted-foreground"><th className="py-2 pr-4">Staff member</th><th className="py-2 pr-4">Program</th><th className="py-2 pr-4">Status</th><th className="py-2 pr-4">Source session</th><th className="py-2">Verification</th></tr></thead><tbody>{competencyRecords.map((record) => <tr key={record.id} className="border-b last:border-0"><td className="py-2 pr-4"><div className="font-medium">{record.staffName}</div><div className="text-xs text-muted-foreground">{record.staffRole?.replace(/_/g, " ") || "—"}</div></td><td className="py-2 pr-4">{programLabel(record.programType)}</td><td className="py-2 pr-4"><Badge variant={record.competencyStatus === "verified" ? "default" : record.competencyStatus === "attended" ? "secondary" : "outline"}>{record.competencyStatus}</Badge></td><td className="py-2 pr-4">#{record.trainingScheduleId}</td><td className="py-2"><div className="flex flex-wrap items-center gap-2">{record.verifiedByUserId ? <span className="text-xs text-muted-foreground">Verified {record.verifiedAt ? new Date(record.verifiedAt).toLocaleDateString() : ""}</span> : <span className="text-xs text-muted-foreground">Pending independent review</span>}{record.competencyStatus === "attended" && <Button type="button" size="sm" onClick={() => verifyCompetencyMutation.mutate({ institutionId, competencyRecordId: record.id, decision: "verified", verificationNotes: verificationNotes.trim() || undefined })} disabled={verifyCompetencyMutation.isPending}>Verify</Button>}{record.competencyStatus === "verified" && <Button type="button" size="sm" variant="outline" onClick={() => verifyCompetencyMutation.mutate({ institutionId, competencyRecordId: record.id, decision: "pending", verificationNotes: verificationNotes.trim() || undefined })} disabled={verifyCompetencyMutation.isPending}>Reopen</Button>}</div></td></tr>)}</tbody></table></div>
          )}
        </CardContent>
      </Card>

      <Dialog open={scheduleEditOpen} onOpenChange={(open) => { setScheduleEditOpen(open); if (!open) setScheduleEditTarget(null); }}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader><DialogTitle>Edit IERS competency session</DialogTitle><DialogDescription>Changes remain scoped to this institution. Capacity cannot be set below the current enrolled count.</DialogDescription></DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2"><Label>Program</Label><Select value={scheduleEditForm.programType} onValueChange={(value) => setScheduleEditForm((form) => ({ ...form, programType: value as ProgramType }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{PROGRAMS.map((program) => <SelectItem key={program.value} value={program.value}>{program.label}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2"><Label>Format</Label><Select value={scheduleEditForm.trainingType} onValueChange={(value) => setScheduleEditForm((form) => ({ ...form, trainingType: value as TrainingType }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{TRAINING_TYPES.map((type) => <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2"><Label>Session start</Label><Input type="datetime-local" value={scheduleEditForm.scheduledDate} onChange={(event) => setScheduleEditForm((form) => ({ ...form, scheduledDate: event.target.value }))} /></div>
            <div className="space-y-2"><Label>Final session date (optional)</Label><Input type="date" min={scheduleEditForm.scheduledDate.slice(0, 10)} value={scheduleEditForm.endDate} onChange={(event) => setScheduleEditForm((form) => ({ ...form, endDate: event.target.value }))} /></div>
            <div className="space-y-2"><Label>Wall-clock start</Label><Input value={scheduleEditForm.startTime} onChange={(event) => setScheduleEditForm((form) => ({ ...form, startTime: event.target.value }))} /></div>
            <div className="space-y-2"><Label>Wall-clock end</Label><Input value={scheduleEditForm.endTime} onChange={(event) => setScheduleEditForm((form) => ({ ...form, endTime: event.target.value }))} /></div>
            <div className="space-y-2 sm:col-span-2"><Label>Location or link</Label><Input value={scheduleEditForm.location} onChange={(event) => setScheduleEditForm((form) => ({ ...form, location: event.target.value }))} /></div>
            <div className="space-y-2 sm:col-span-2"><Label>Approved instructor</Label><Select value={scheduleEditForm.instructorUserId} onValueChange={(value) => setScheduleEditForm((form) => ({ ...form, instructorUserId: value }))}><SelectTrigger><SelectValue placeholder="None" /></SelectTrigger><SelectContent><SelectItem value="none">None</SelectItem>{(assignableInstructorsForEdit ?? []).map((instructor) => <SelectItem key={instructor.id} value={String(instructor.id)}>{instructor.name ?? instructor.email ?? `User ${instructor.id}`}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2 sm:col-span-2"><Label>Display instructor label</Label><Input value={scheduleEditForm.instructorName} onChange={(event) => setScheduleEditForm((form) => ({ ...form, instructorName: event.target.value }))} /></div>
            <div className="space-y-2"><Label>Maximum capacity</Label><Input type="number" min={1} max={2000} value={scheduleEditForm.maxCapacity} onChange={(event) => setScheduleEditForm((form) => ({ ...form, maxCapacity: event.target.value }))} /></div>
            <div className="space-y-2"><Label>Status</Label><Select value={scheduleEditForm.status} onValueChange={(value) => setScheduleEditForm((form) => ({ ...form, status: value as TrainingStatus }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{TRAINING_STATUSES.map((status) => <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>)}</SelectContent></Select></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setScheduleEditOpen(false)}>Cancel</Button><Button onClick={submitEdit} disabled={updateTrainingScheduleMutation.isPending}>{updateTrainingScheduleMutation.isPending ? "Saving…" : "Save changes"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={scheduleDeleteTarget != null} onOpenChange={(open) => { if (!open) setScheduleDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete this IERS competency session?</AlertDialogTitle><AlertDialogDescription>This removes the session and its attendance rows. Use Cancelled instead when historical traceability is required.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Keep session</AlertDialogCancel><AlertDialogAction onClick={() => { if (scheduleDeleteTarget) deleteTrainingScheduleMutation.mutate({ institutionId, trainingScheduleId: scheduleDeleteTarget.id }); }} disabled={deleteTrainingScheduleMutation.isPending}>{deleteTrainingScheduleMutation.isPending ? "Deleting…" : "Delete session"}</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
