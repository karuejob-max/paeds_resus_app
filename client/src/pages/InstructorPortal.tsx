import { useMemo, useState } from "react";
import { Link } from "wouter";
import { useScrollToTop } from "@/hooks/useScrollToTop";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import { instructorResources } from "@/const/instructorResources";
import { toast } from "sonner";
import {
  BookOpen,
  Calendar,
  CheckCircle2,
  ClipboardCheck,
  ExternalLink,
  GraduationCap,
  Loader2,
  Lock,
  Mail,
  Phone,
  Shield,
  User,
  Users,
  XCircle,
} from "lucide-react";

function startOfTodayLocal(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

// ─────────────────────────────────────────────────────────────────────────────
// Roster panel for a single training session
// ─────────────────────────────────────────────────────────────────────────────
function SessionRoster({ scheduleId }: { scheduleId: number }) {
  const rosterQuery = trpc.instructor.getSessionRoster.useQuery({ scheduleId });
  const signOffMutation = trpc.instructor.signOffPracticalSkills.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      rosterQuery.refetch();
    },
    onError: (err) => toast.error(err.message),
  });
  const updateAttendanceMutation = trpc.instructor.updateAttendance.useMutation({
    onSuccess: () => {
      toast.success("Attendance updated.");
      rosterQuery.refetch();
    },
    onError: (err) => toast.error(err.message),
  });
  const signOffAllMutation = trpc.instructor.signOffAllEligible.useMutation({
    onSuccess: (data) => {
      if (data.signedCount === 0 && data.skipped.length === 0) {
        toast.success("Everyone eligible is already signed off.");
      } else {
        toast.success(
          `Signed off ${data.signedCount} learner(s)${data.certificatesIssuedCount > 0 ? `, ${data.certificatesIssuedCount} certificate(s) issued` : ""}` +
            (data.skipped.length > 0 ? ` — ${data.skipped.length} skipped (see below)` : "")
        );
      }
      rosterQuery.refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  if (rosterQuery.isLoading) {
    return (
      <p className="text-sm text-muted-foreground flex items-center gap-2 py-2">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading roster…
      </p>
    );
  }

  const roster = rosterQuery.data?.roster ?? [];
  if (roster.length === 0) {
    return <p className="text-sm text-muted-foreground py-2">No learners registered for this session yet.</p>;
  }

  const eligibleCount = roster.filter((l) => !l.practicalSkillsSignedOff && l.enrollmentId).length;

  return (
    <div className="space-y-3 mt-3">
      {eligibleCount > 1 && (
        <Button
          size="sm"
          variant="outline"
          className="text-xs h-7 gap-1.5 border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-950/30"
          disabled={signOffAllMutation.isPending}
          onClick={() => signOffAllMutation.mutate({ scheduleId })}
        >
          {signOffAllMutation.isPending ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <ClipboardCheck className="h-3 w-3" />
          )}
          Sign off all eligible ({eligibleCount})
        </Button>
      )}
      {roster.map((learner) => (
        <div
          key={learner.userId}
          className="rounded-lg border border-border p-3 space-y-2"
        >
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
            <div>
              <p className="font-medium text-foreground text-sm">{learner.name}</p>
              {learner.email && <p className="text-xs text-muted-foreground">{learner.email}</p>}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {/* Cognitive status */}
              <Badge
                variant={learner.cognitiveModulesComplete ? "default" : "secondary"}
                className="gap-1 text-xs"
              >
                {learner.cognitiveModulesComplete ? (
                  <CheckCircle2 className="h-3 w-3" />
                ) : (
                  <XCircle className="h-3 w-3" />
                )}
                Cognitive {learner.cognitiveModulesComplete ? "complete" : "incomplete"}
              </Badge>
              {/* Practical sign-off status */}
              <Badge
                variant={learner.practicalSkillsSignedOff ? "default" : "secondary"}
                className="gap-1 text-xs"
              >
                {learner.practicalSkillsSignedOff ? (
                  <CheckCircle2 className="h-3 w-3" />
                ) : (
                  <XCircle className="h-3 w-3" />
                )}
                Practical {learner.practicalSkillsSignedOff ? "signed off" : "pending"}
              </Badge>
              {/* Certificate status */}
              {learner.certificateIssued && (
                <Badge variant="default" className="gap-1 text-xs bg-emerald-600">
                  <CheckCircle2 className="h-3 w-3" />
                  Certificate issued
                </Badge>
              )}
            </div>
          </div>

          {/* Attendance selector */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground">Attendance:</span>
            {(["registered", "attended", "absent"] as const).map((status) => (
              <button
                key={status}
                onClick={() =>
                  updateAttendanceMutation.mutate({
                    attendanceId: learner.attendanceId,
                    attendanceStatus: status,
                  })
                }
                className={`text-xs px-2 py-0.5 rounded-full border transition-colors ${
                  learner.attendanceStatus === status
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border text-muted-foreground hover:border-primary/50"
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          {/* Sign-off button — only show if not yet signed off and enrollment exists */}
          {!learner.practicalSkillsSignedOff && learner.enrollmentId && (
            <div className="pt-1">
              <Button
                size="sm"
                variant="outline"
                className="text-xs h-7 gap-1.5 border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-950/30"
                disabled={signOffMutation.isPending}
                onClick={() =>
                  signOffMutation.mutate({ enrollmentId: learner.enrollmentId! })
                }
              >
                {signOffMutation.isPending ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <ClipboardCheck className="h-3 w-3" />
                )}
                Sign off practical skills
              </Button>
              {!learner.cognitiveModulesComplete && (
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                  Note: cognitive modules not yet complete. Sign-off will be recorded but certificate will only issue once both are done.
                </p>
              )}
            </div>
          )}

          {learner.practicalSkillsSignedOff && learner.practicalSignedOffByName && (
            <p className="text-xs text-muted-foreground">
              Signed off by {learner.practicalSignedOffByName}
              {learner.practicalSignedOffAt
                ? ` on ${new Date(learner.practicalSignedOffAt).toLocaleDateString()}`
                : ""}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// My mentees — mentor's view of provisional instructors they're mentoring
// (CEO decision, 2026-07-21). Confirming a group is a real credentialing
// judgment call the mentor makes deliberately, not attendance-data-derived —
// see AGENTS.md §10 for the full mentorship-tier design.
// ─────────────────────────────────────────────────────────────────────────────
const PROGRAM_TYPES = ["bls", "acls", "pals", "fellowship", "instructor", "fellowship_diploma", "heartsaver", "nrp"] as const;

function ConfirmGroupForm({ menteeUserId, onDone }: { menteeUserId: number; onDone: () => void }) {
  const [programType, setProgramType] = useState<(typeof PROGRAM_TYPES)[number]>("bls");
  const [notes, setNotes] = useState("");

  const confirmMutation = trpc.instructor.confirmMentorshipGroup.useMutation({
    onSuccess: (data) => {
      toast.success(
        data.promotedToQualified
          ? `Group confirmed — this instructor has reached Qualified (${data.groupCount}/3 groups).`
          : `Group confirmed (${data.groupCount}/3 toward Qualified).`
      );
      setNotes("");
      onDone();
    },
    onError: (err) => toast.error(err.message),
  });

  return (
    <div className="rounded-md border border-border bg-muted/30 p-3 space-y-2 mt-2">
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={programType}
          onChange={(e) => setProgramType(e.target.value as (typeof PROGRAM_TYPES)[number])}
          className="text-xs border border-border rounded px-2 py-1 bg-background"
        >
          {PROGRAM_TYPES.map((p) => (
            <option key={p} value={p}>
              {p.toUpperCase()}
            </option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Notes (optional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="flex-1 min-w-[140px] text-xs border border-border rounded px-2 py-1 bg-background"
        />
        <Button
          size="sm"
          variant="outline"
          className="text-xs h-7 gap-1.5 border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-950/30"
          disabled={confirmMutation.isPending}
          onClick={() =>
            confirmMutation.mutate({
              menteeUserId,
              programType,
              notes: notes.trim() || undefined,
            })
          }
        >
          {confirmMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <ClipboardCheck className="h-3 w-3" />}
          Confirm independently-led group
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Only confirm a group this instructor genuinely led independently, start to finish, across all three phases.
      </p>
    </div>
  );
}

function MyMenteesCard() {
  const menteesQuery = trpc.instructor.getMyMentees.useQuery();
  const [expandedMenteeId, setExpandedMenteeId] = useState<number | null>(null);

  const mentees = menteesQuery.data ?? [];
  if (menteesQuery.isLoading) return null;
  // Not mentoring anyone — nothing to show. Avoids an empty card for the
  // vast majority of instructors who aren't (yet) mentors.
  if (mentees.length === 0) return null;

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          My mentees
        </CardTitle>
        <CardDescription>
          Instructors in their provisional period who you're mentoring. Confirm a group once you've seen them lead it
          independently, start to finish — 3 confirmed groups promotes them to Qualified.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {mentees.map((m) => (
          <div key={m.menteeUserId} className="rounded-lg border border-border p-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <p className="font-medium text-foreground text-sm">{m.menteeName}</p>
                <p className="text-xs text-muted-foreground capitalize">
                  {(m.instructorTier ?? "provisional").replace("_", " ")} · {m.confirmedGroupCount}/3 groups confirmed
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs h-7 gap-1.5 text-muted-foreground hover:text-foreground shrink-0"
                onClick={() => setExpandedMenteeId(expandedMenteeId === m.menteeUserId ? null : m.menteeUserId)}
                disabled={m.instructorTier === "qualified" || m.instructorTier === "lead_instructor"}
              >
                <ClipboardCheck className="h-3.5 w-3.5" />
                {expandedMenteeId === m.menteeUserId ? "Cancel" : "Confirm a group"}
              </Button>
            </div>
            {expandedMenteeId === m.menteeUserId && (
              <ConfirmGroupForm
                menteeUserId={m.menteeUserId}
                onDone={() => {
                  setExpandedMenteeId(null);
                  void menteesQuery.refetch();
                }}
              />
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Phase 2 role-based booking — instructor side
// (docs/IERP_NERP_PROGRAM_V2_SPEC.md §4.4, §4.5). Self-service: declaring
// availability directly creates a bookable session, no coordinator
// involved. Separate from the coordinator-assigned sessions above
// (getMyAssignments) since these have no institution attached.
// ─────────────────────────────────────────────────────────────────────────────
const PHASE2_ROLE_LABELS: Record<string, string> = {
  team_leader: "Team Leader",
  team_member_airway_ventilation: "Airway & Ventilation",
  team_member_compressor_1: "Compressor 1",
  team_member_compressor_2: "Compressor 2",
  team_member_monitor_defib_cpr_coach: "Monitor/Defib/CPR Coach",
  team_member_iv_io_meds: "IV/IO Access & Meds",
  team_member_scribe: "Scribe",
  observer: "Observer",
};

function DeclareAvailabilityForm({ onDone }: { onDone: () => void }) {
  const coursesQuery = trpc.courses.listAhaPrograms.useQuery();
  const [courseId, setCourseId] = useState<string>("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [startTime, setStartTime] = useState("20:30");
  const [endTime, setEndTime] = useState("21:30");
  const [location, setLocation] = useState("");

  const declareMutation = trpc.courses.declareInstructorAvailability.useMutation({
    onSuccess: () => {
      toast.success("Availability declared — learners can now book this session.");
      onDone();
    },
    onError: (err) => toast.error(err.message),
  });

  return (
    <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <Select value={courseId} onValueChange={setCourseId}>
          <SelectTrigger className="h-9 text-sm">
            <SelectValue placeholder="Course" />
          </SelectTrigger>
          <SelectContent>
            {(coursesQuery.data ?? []).map((c: any) => (
              <SelectItem key={c.id} value={String(c.id)}>
                {c.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input type="date" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} className="h-9 text-sm" />
        <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="h-9 text-sm" />
        <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="h-9 text-sm" />
        <Input
          placeholder="Location / link (optional)"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="h-9 text-sm sm:col-span-2"
        />
      </div>
      <Button
        size="sm"
        disabled={!courseId || !scheduledDate || declareMutation.isPending}
        onClick={() =>
          declareMutation.mutate({
            courseId: Number(courseId),
            scheduledDate: new Date(scheduledDate),
            startTime,
            endTime,
            location: location || undefined,
          })
        }
      >
        {declareMutation.isPending ? "Declaring..." : "Declare this slot"}
      </Button>
      <p className="text-xs text-muted-foreground">Ideally a 1-hour evening slot, e.g. 8:30–9:30pm — but any time works.</p>
    </div>
  );
}

function Phase2AvailabilityCard() {
  const sessionsQuery = trpc.instructor.getMyPhase2Sessions.useQuery();
  const [declaring, setDeclaring] = useState(false);

  const confirmMutation = trpc.courses.confirmPhase2Role.useMutation({
    onSuccess: () => {
      toast.success("Confirmed.");
      void sessionsQuery.refetch();
    },
    onError: (err) => toast.error(err.message),
  });
  const reviewClaimMutation = trpc.courses.reviewRetrospectiveRoleClaim.useMutation({
    onSuccess: (_data, vars) => {
      toast.success(vars.approve ? "Claim approved." : "Claim rejected.");
      void sessionsQuery.refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const sessions = sessionsQuery.data ?? [];

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Phase 2 sessions I'm running
        </CardTitle>
        <CardDescription>Declare when you're free to run an online simulation, then confirm roles and review claims after each session.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {declaring ? (
          <DeclareAvailabilityForm onDone={() => { setDeclaring(false); void sessionsQuery.refetch(); }} />
        ) : (
          <Button size="sm" variant="outline" onClick={() => setDeclaring(true)}>
            Declare new availability
          </Button>
        )}

        {sessions.length === 0 ? (
          <p className="text-sm text-muted-foreground">You haven't declared any Phase 2 sessions yet.</p>
        ) : (
          sessions.map((s: any) => (
            <div key={s.id} className="rounded-lg border border-border p-3 space-y-2">
              <p className="font-medium text-sm">
                {s.courseTitle} — {s.scheduledDate ? new Date(s.scheduledDate).toLocaleDateString() : "Date TBC"}
                {s.startTime ? ` · ${s.startTime}${s.endTime ? `–${s.endTime}` : ""}` : ""}
              </p>

              {s.bookings.length === 0 ? (
                <p className="text-xs text-muted-foreground">No bookings yet.</p>
              ) : (
                <div className="space-y-1.5">
                  {s.bookings.map((b: any) => (
                    <div key={b.id} className="flex items-center justify-between text-xs rounded border border-border p-2">
                      <span>
                        {b.learnerName} — {PHASE2_ROLE_LABELS[b.simulationRole] ?? b.simulationRole}
                        {b.simulationCompetencyPassed && <span className="ml-1.5 text-green-700 font-medium">✓ confirmed</span>}
                      </span>
                      {!b.simulationCompetencyPassed && (
                        <div className="flex gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-6 text-[11px] px-2 border-emerald-300 text-emerald-700"
                            disabled={confirmMutation.isPending}
                            onClick={() => confirmMutation.mutate({ attendanceId: b.id, passed: true })}
                          >
                            Confirm
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-6 text-[11px] px-2 border-red-200 text-red-600"
                            disabled={confirmMutation.isPending}
                            onClick={() => confirmMutation.mutate({ attendanceId: b.id, passed: false })}
                          >
                            Didn't fill role
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {s.pendingClaims.length > 0 && (
                <div className="space-y-1.5 pt-2 border-t border-border">
                  <p className="text-xs font-medium text-amber-700">Retrospective claims pending your review</p>
                  {s.pendingClaims.map((c: any) => (
                    <div key={c.id} className="flex items-center justify-between text-xs rounded border border-amber-200 bg-amber-50 p-2">
                      <span>
                        {c.claimantName} claims <strong>{PHASE2_ROLE_LABELS[c.role] ?? c.role}</strong>
                        {c.notes ? ` — "${c.notes}"` : ""}
                      </span>
                      <div className="flex gap-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-6 text-[11px] px-2 border-emerald-300 text-emerald-700 bg-white"
                          disabled={reviewClaimMutation.isPending}
                          onClick={() => reviewClaimMutation.mutate({ claimId: c.id, approve: true })}
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-6 text-[11px] px-2 border-red-200 text-red-600 bg-white"
                          disabled={reviewClaimMutation.isPending}
                          onClick={() => reviewClaimMutation.mutate({ claimId: c.id, approve: false })}
                        >
                          Reject
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────────────────────
export default function InstructorPortal() {
  useScrollToTop();
  const { isAuthenticated, loading } = useAuth();
  const statusQuery = trpc.instructor.getStatus.useQuery(undefined, { enabled: isAuthenticated });
  const assignmentsQuery = trpc.instructor.getMyAssignments.useQuery(undefined, { enabled: isAuthenticated });

  // Track which assignment's roster is expanded
  const [expandedRosterId, setExpandedRosterId] = useState<number | null>(null);

  const { upcoming, past } = useMemo(() => {
    const list = [...(assignmentsQuery.data?.assignments ?? [])];
    const sod = startOfTodayLocal();
    const upcomingList: typeof list = [];
    const pastList: typeof list = [];
    for (const a of list) {
      if (!a.scheduledDate) {
        pastList.push(a);
        continue;
      }
      const t = new Date(a.scheduledDate);
      if (t >= sod) upcomingList.push(a);
      else pastList.push(a);
    }
    return { upcoming: upcomingList, past: pastList };
  }, [assignmentsQuery.data?.assignments]);

  if (loading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center text-muted-foreground gap-2">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading…
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-brand-surface to-background">
        <Card className="max-w-md w-full border-border">
          <CardHeader>
            <CardTitle>Instructor portal</CardTitle>
            <CardDescription>Sign in to view your instructor status and assignments.</CardDescription>
          </CardHeader>
          <CardContent>
            <a href={getLoginUrl()}>
              <Button className="w-full" variant="cta">
                Sign in
              </Button>
            </a>
          </CardContent>
        </Card>
      </div>
    );
  }

  const s = statusQuery.data;
  const certified = s?.certified;
  const approved = s?.approved;
  const unlocked = s?.portalUnlocked;

  const renderAssignment = (a: (typeof upcoming)[0]) => (
    <li
      key={a.id}
      className="rounded-lg border border-border p-4 flex flex-col gap-3"
    >
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
        <div>
          <p className="font-medium text-foreground">{a.institutionName ?? "Institution"}</p>
          <p className="text-sm text-muted-foreground">
            {a.courseTitle} · <span className="uppercase">{a.programType}</span>
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {a.scheduledDate ? new Date(a.scheduledDate).toLocaleString() : "—"}
            {a.startTime || a.endTime
              ? ` · ${[a.startTime, a.endTime].filter(Boolean).join("–")}`
              : ""}
            {a.location ? ` · ${a.location}` : ""}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {a.trainingType.replace("_", " ")} · {a.enrolledCount ?? 0}/{a.maxCapacity} enrolled
          </p>
        </div>
        <Badge variant="outline" className="capitalize shrink-0 w-fit">
          {a.status ?? "scheduled"}
        </Badge>
      </div>

      {(a.institutionContactName || a.institutionContactEmail || a.institutionContactPhone) && (
        <div className="rounded-md bg-muted/50 border border-border px-3 py-2 text-sm">
          <p className="font-medium text-foreground mb-1 flex items-center gap-1.5">
            <User className="h-3.5 w-3.5" />
            Hospital contact
          </p>
          {a.institutionContactName ? (
            <p className="text-foreground/90">{a.institutionContactName}</p>
          ) : null}
          <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 mt-1.5">
            {a.institutionContactEmail ? (
              <a
                href={`mailto:${a.institutionContactEmail}`}
                className="inline-flex items-center gap-1 text-primary hover:underline"
              >
                <Mail className="h-3.5 w-3.5 shrink-0" />
                {a.institutionContactEmail}
              </a>
            ) : null}
            {a.institutionContactPhone ? (
              <a
                href={`tel:${a.institutionContactPhone.replace(/\s/g, "")}`}
                className="inline-flex items-center gap-1 text-primary hover:underline"
              >
                <Phone className="h-3.5 w-3.5 shrink-0" />
                {a.institutionContactPhone}
              </a>
            ) : null}
          </div>
          {!a.institutionContactEmail && !a.institutionContactPhone ? (
            <p className="text-xs text-muted-foreground mt-1">Ask your administrator to add contact details on the institution profile.</p>
          ) : null}
        </div>
      )}

      {/* ── AHA Practical Skills Sign-Off Section ── */}
      <div className="border-t border-border pt-3">
        <Button
          variant="ghost"
          size="sm"
          className="text-xs h-7 gap-1.5 text-muted-foreground hover:text-foreground"
          onClick={() =>
            setExpandedRosterId(expandedRosterId === a.id ? null : a.id)
          }
        >
          <Users className="h-3.5 w-3.5" />
          {expandedRosterId === a.id ? "Hide roster" : "View roster & sign off skills"}
        </Button>
        {expandedRosterId === a.id && <SessionRoster scheduleId={a.id} />}
      </div>
    </li>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-surface to-background">
      <section className="bg-gradient-to-r from-[var(--brand-teal)] to-[#143333] text-primary-foreground py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-start gap-3">
            <GraduationCap className="h-10 w-10 shrink-0 opacity-90" />
            <div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Instructor portal</h1>
              <p className="mt-2 text-white/90 max-w-2xl">
                Complete the Instructor Course for your instructor number, then receive platform approval to teach on
                institutional schedules. Use the roster view to sign off learners' practical skills — required for AHA
                certificate issuance.
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 py-10 space-y-6">
        {/* Status card */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Your status
            </CardTitle>
            <CardDescription>Certification → approval → teaching assignments</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2 items-center">
              <Badge variant={certified ? "default" : "secondary"} className="gap-1">
                {certified ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
                Instructor course
              </Badge>
              <Badge variant={approved ? "default" : "secondary"} className="gap-1">
                {approved ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
                Platform approval
              </Badge>
            </div>
            {certified && s?.instructorNumber && (
              <p className="text-sm text-foreground">
                <span className="text-muted-foreground">Instructor number:</span>{" "}
                <span className="font-mono font-semibold">{s.instructorNumber}</span>
              </p>
            )}
            {!certified && (
              <div className="rounded-lg border border-border bg-muted/40 p-4 space-y-3">
                <p className="text-sm text-foreground/90">
                  Start with the Paeds Resus Instructor Course: enroll, complete modules and the quiz, then pay. Your
                  certificate and instructor number are issued after you pass all assessments.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Link href="/enroll">
                    <Button size="sm" variant="cta">
                      Enroll in Instructor Course
                    </Button>
                  </Link>
                  <Link href="/course/instructor">
                    <Button size="sm" variant="outline">
                      Open course
                    </Button>
                  </Link>
                </div>
              </div>
            )}
            {certified && !approved && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-900 p-4 text-sm text-foreground/90">
                You are certified with instructor number <span className="font-mono font-medium">{s?.instructorNumber}</span>.
                A platform admin must approve you under Admin → Reports before you can be assigned to hospital sessions.
              </div>
            )}
            {unlocked && (
              <p className="text-sm text-green-800 dark:text-green-200 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                You can be assigned to institutional sessions and see your schedule below.
              </p>
            )}
            {s?.instructorTier && (
              <div className="rounded-lg border border-border bg-muted/40 p-4 space-y-2">
                <p className="text-sm text-foreground flex items-center gap-2">
                  <Users className="h-4 w-4 shrink-0" />
                  Mentorship tier: <span className="font-semibold capitalize">{s.instructorTier.replace("_", " ")}</span>
                </p>
                {s.instructorTier === "provisional" && (
                  <p className="text-xs text-muted-foreground">
                    {s.mentorUserId
                      ? `${s.confirmedGroupCount} of 3 independently-led groups confirmed by your mentor. ${s.groupsNeededForQualified} more to reach Qualified.`
                      : "Waiting for a platform admin to assign you a mentor before you can start logging confirmed groups."}
                  </p>
                )}
                {s.instructorTier === "qualified" && (
                  <p className="text-xs text-muted-foreground">
                    Mentor 10 provisional instructors to Qualified to reach Lead Instructor. See "My mentees" below if you're mentoring anyone.
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* My mentees card — only relevant if this instructor is mentoring anyone */}
        <MyMenteesCard />
        <Phase2AvailabilityCard />

        {/* AHA Certificate Workflow Info */}
        {unlocked && (
          <Card className="border-emerald-200 bg-emerald-50 dark:bg-emerald-950/30 dark:border-emerald-800">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base text-emerald-800 dark:text-emerald-300">
                <ClipboardCheck className="h-5 w-5" />
                AHA certificate workflow
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-foreground/80 space-y-2">
              <p>For a learner to receive their BLS, ACLS, or PALS certificate, <strong>both</strong> of the following must be complete:</p>
              <ol className="list-decimal list-inside space-y-1 ml-2">
                <li>All cognitive modules completed and passed (learner-driven, tracked automatically).</li>
                <li>Practical skills signed off by you (the assigned instructor) using the roster below.</li>
              </ol>
              <p className="text-xs text-muted-foreground pt-1">
                Certificates are valid for 2 years from the date of issuance, in line with AHA provider card requirements.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Assignments card */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              My assignments
            </CardTitle>
            <CardDescription>
              Hospital sessions where you are the assigned instructor. Expand a session to view the learner roster and
              sign off practical skills.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {assignmentsQuery.isLoading ? (
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading assignments…
              </p>
            ) : !unlocked ? (
              <p className="text-sm text-muted-foreground">
                Assignments appear here after you are certified and approved.
              </p>
            ) : assignmentsQuery.data?.assignments.length === 0 ? (
              <p className="text-sm text-muted-foreground">No sessions assigned yet.</p>
            ) : (
              <div className="space-y-8">
                {upcoming.length > 0 ? (
                  <div>
                    <h3 className="text-sm font-semibold text-foreground mb-3">Upcoming</h3>
                    <ul className="space-y-3">{upcoming.map(renderAssignment)}</ul>
                  </div>
                ) : null}
                {past.length > 0 ? (
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground mb-3">Past</h3>
                    <ul className="space-y-3 opacity-90">{past.map(renderAssignment)}</ul>
                  </div>
                ) : null}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Resources card */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Resources
            </CardTitle>
            <CardDescription>Quick links for instructors. Facilitator PDFs and slide decks can be added here as they ship.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {instructorResources.map((r) => (
                <li
                  key={r.href + r.title}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-lg border border-border p-3"
                >
                  <div>
                    <p className="font-medium text-foreground">{r.title}</p>
                    <p className="text-sm text-muted-foreground">{r.description}</p>
                  </div>
                  {r.external ? (
                    <a
                      href={r.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-primary shrink-0"
                    >
                      Open <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  ) : (
                    <Link href={r.href}>
                      <Button variant="outline" size="sm" className="shrink-0">
                        Open
                      </Button>
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
