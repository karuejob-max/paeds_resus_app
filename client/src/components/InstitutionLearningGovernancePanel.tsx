import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  CalendarPlus,
  UserPlus,
  Target,
  UserRoundCheck,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SearchableDropdown } from "@/components/CadreProgressiveSelector";

const COURSE_TYPES = [
  "bls",
  "acls",
  "pals",
  "nrp",
  "heartsaver",
  "instructor",
"paeds_resus_ils",
] as const;
const COURSE_LABELS: Record<(typeof COURSE_TYPES)[number], string> = {
  bls: "Basic Life Support (BLS)",
  acls: "Advanced Cardiovascular Life Support (ACLS)",
  pals: "Pediatric Advanced Life Support (PALS)",
  nrp: "Neonatal Resuscitation Program (NRP)",
  heartsaver: "Heartsaver",
  instructor: "Instructor course",
  paeds_resus_ils: "Institutional Life Support (Paeds Resus)",
};
const METRICS = [
  ["cpd_sessions", "CPD sessions"],
  ["cpd_attendance_rate", "CPD attendance rate (%)"],
  ["cne_sessions", "Nursing CNE sessions"],
  ["clinical_cpd_sessions", "Clinical CPD sessions"],
  ["m_and_m_sessions", "M&M meetings"],
  ["life_support_completed", "Life-support completions"],
  ["course_phase_completion", "Course phase completions"],
] as const;

function today() {
  return new Date().toISOString().slice(0, 10);
}
function sixMonthsFromToday() {
  const date = new Date();
  date.setMonth(date.getMonth() + 6);
  return date.toISOString().slice(0, 10);
}

type LearningGovernanceMode = "all" | "sessions" | "people";
type PresenterSearchPerson = {
  id: number;
  fullName: string;
  email: string;
  cadre: string | null;
  cadreOther?: string | null;
  department: string | null;
  isInstitutionMember: boolean;
};

type QuizDraftQuestion = {
  question: string;
  questionType: "multiple_choice" | "true_false";
  options: string[];
  correctAnswer: string;
};

const emptyQuizQuestion = (): QuizDraftQuestion => ({
  question: "",
  questionType: "multiple_choice",
  options: ["", ""],
  correctAnswer: "",
});

export default function InstitutionLearningGovernancePanel({
  institutionId,
  mode = "all",
  isInstitutionAdmin = false,
}: {
  institutionId: number;
  mode?: LearningGovernanceMode;
  isInstitutionAdmin?: boolean;
}) {
  const [selectedDepartmentId, setSelectedDepartmentId] = useState("");
  const [sessionDepartmentId, setSessionDepartmentId] = useState("");
  const [selectedCoordinatorUserId, setSelectedCoordinatorUserId] =
    useState("");
  const [sessionName, setSessionName] = useState("");
  const [sessionDate, setSessionDate] = useState(today());
  const [eventType, setEventType] = useState("cpd_general");
  const [audienceScope, setAudienceScope] = useState("facility_wide");
  const [audienceLabel, setAudienceLabel] = useState("");
  const [presenterUserId, setPresenterUserId] = useState("");
  const [presenterSearch, setPresenterSearch] = useState("");
  const [presenterCache, setPresenterCache] = useState<PresenterSearchPerson[]>([]);
  const [cpdPoints, setCpdPoints] = useState("1");
  const [coPresenters, setCoPresenters] = useState<Array<{ userId: string }>>([]);
  const [quizEnabled, setQuizEnabled] = useState(false);
  const [quizPassingScore, setQuizPassingScore] = useState("80");
  const [quizQuestions, setQuizQuestions] = useState<QuizDraftQuestion[]>([emptyQuizQuestion()]);
  const [targetScope, setTargetScope] = useState<
    "facility" | "department" | "individual"
  >("facility");
  const [targetDepartmentId, setTargetDepartmentId] = useState("");
  const [targetUserId, setTargetUserId] = useState("");
  const [metricKey, setMetricKey] =
    useState<(typeof METRICS)[number][0]>("cpd_sessions");
  const [periodType, setPeriodType] = useState<
    "monthly" | "quarterly" | "annual"
  >("quarterly");
  const [periodStart, setPeriodStart] = useState(today());
  const [periodEnd, setPeriodEnd] = useState(sixMonthsFromToday());
  const [targetValue, setTargetValue] = useState("1");
  const [targetRevisionReason, setTargetRevisionReason] = useState("");
  const [courseProgramType, setCourseProgramType] = useState("");
  const [coursePhase, setCoursePhase] = useState("");
  const utils = trpc.useUtils();
  const { data: learningAuthority } = trpc.institutionLearning.getMyAuthority.useQuery(
    { institutionId },
    { staleTime: 30_000 },
  );
  const canManageCoordinatorAssignments = isInstitutionAdmin || learningAuthority?.roleKey === "institution_admin" || learningAuthority?.roleKey === "cpd_coordinator" || learningAuthority?.roleKey === "cpd_department_head";
  const { data: departments = [] } =
    trpc.institutionLearning.listDepartments.useQuery(
      { institutionId },
      { staleTime: 60_000 }
    );
  const participantDepartmentId = mode === "sessions"
    ? sessionDepartmentId ? Number(sessionDepartmentId) : undefined
    : selectedDepartmentId ? Number(selectedDepartmentId) : undefined;
  const { data: staff = [] } = trpc.institutionLearning.listDepartmentStaff.useQuery(
    { institutionId, departmentId: participantDepartmentId },
    { staleTime: 30_000 }
  );
  const { data: presenterMatches = [] } = trpc.cpd.searchPresenters.useQuery(
    { institutionId, query: presenterSearch.trim() },
    { enabled: true, staleTime: 15_000 },
  );
  useEffect(() => {
    if (!presenterMatches.length) return;
    setPresenterCache(current => {
      const merged = new Map<number, PresenterSearchPerson>(current.map(person => [person.id, person]));
      presenterMatches.forEach(person => merged.set(person.id, person));
      return Array.from(merged.values());
    });
  }, [presenterMatches]);
  const searchablePresenters = [...presenterCache, ...presenterMatches].filter((person, index, all) => all.findIndex(candidate => candidate.id === person.id) === index);
  const presenterOptions = searchablePresenters
    .filter(person => person.id != null)
    .map(person => ({
      value: String(person.id),
      label: `${person.isInstitutionMember ? "Institution member" : "Paeds Resus account · not an institution member"} · ${person.fullName} · ${person.department ?? "Department not set"} · ${person.cadre ?? "Cadre not set"} · ${person.email || "No email"}`,
      person,
    }));
  const selectedPresenter = presenterOptions.find(option => option.value === presenterUserId)?.person;
  const { data: targetStaff = [] } = trpc.institutionLearning.listDepartmentStaff.useQuery(
    {
      institutionId,
      departmentId: targetScope === "individual" && targetDepartmentId
        ? Number(targetDepartmentId)
        : undefined,
    },
    { staleTime: 30_000, enabled: mode !== "sessions" && targetScope === "individual" }
  );
  const { data: coordinators = [] } =
    trpc.institutionLearning.listEducationCoordinators.useQuery(
      { institutionId },
      { staleTime: 30_000, enabled: mode !== "sessions" }
    );
  const { data: targets = [] } = trpc.institutionLearning.listTargets.useQuery(
    { institutionId },
    { staleTime: 30_000, enabled: mode !== "sessions" }
  );
  const selectedDepartmentStaff = staff;
  const audienceCadres = useMemo(
    () => Array.from(
      new Set(
        staff.flatMap(person =>
          [person.cadre, person.cadreOther].filter(
            (value): value is string => Boolean(value?.trim())
          )
        )
      )
    ).sort((left, right) => left.localeCompare(right)),
    [staff]
  );
  const memberLabel = (person: typeof staff[number]) => {
    const cadre = person.cadre ?? person.staffRole ?? "Other";
    const department = person.department ?? "Department not set";
    const email = person.staffEmail ?? "No email";
    return `${person.staffName} · ${department} · ${cadre} · ${email}`;
  };
  const coPresenterOptions = searchablePresenters
      .filter(person => person.id !== Number(presenterUserId))
      .filter(person => person.id != null)
      .map(person => ({
        value: String(person.id),
        label: `${person.isInstitutionMember ? "Institution member" : "Paeds Resus account · not an institution member"} · ${person.fullName} · ${person.department ?? "Department not set"} · ${person.cadre ?? "Cadre not set"} · ${person.email || "No email"}`,
        person,
      }));

  const invalidateLearning = async () => {
    await Promise.all([
      utils.institutionLearning.listEducationCoordinators.invalidate({
        institutionId,
      }),
      utils.institutionLearning.listTargets.invalidate({ institutionId }),
      utils.institutionLearning.getDashboard.invalidate({
        institutionId,
        periodType: "quarterly",
      }),
      utils.institutionLearning.getDashboard.invalidate({
        institutionId,
        periodType: "monthly",
      }),
      utils.institutionLearning.getDashboard.invalidate({
        institutionId,
        periodType: "annual",
      }),
    ]);
  };

  const assignCoordinator =
    trpc.institutionLearning.assignEducationCoordinator.useMutation({
      onSuccess: async () => {
        toast.success("Education Coordinator assigned");
        setSelectedCoordinatorUserId("");
        await invalidateLearning();
      },
      onError: error => toast.error(error.message),
    });
  const endCoordinator =
    trpc.institutionLearning.endEducationCoordinator.useMutation({
      onSuccess: async () => {
        toast.success("Education Coordinator assignment ended");
        await invalidateLearning();
      },
      onError: error => toast.error(error.message),
    });
  const createSession = trpc.institutionLearning.createSession.useMutation({
    onSuccess: async () => {
      toast.success("CPD session created. Registration QR code and link are ready below.");
      setSessionName("");
      setPresenterUserId("");
      setAudienceLabel("");
      setCoPresenters([]);
      setQuizEnabled(false);
      setQuizPassingScore("80");
      setQuizQuestions([emptyQuizQuestion()]);
      await Promise.all([
        invalidateLearning(),
        utils.cpd.listEvents.invalidate({ institutionId }),
        utils.cpd.getInstitutionalCpdAnalytics.invalidate({ institutionId }),
      ]);
    },
    onError: error => toast.error(error.message),
  });
  const createEventQuiz = trpc.cpd.createEventQuiz.useMutation();
  const saveTarget = trpc.institutionLearning.saveTarget.useMutation({
    onSuccess: async () => {
      toast.success("Learning target saved");
      setTargetRevisionReason("");
      await invalidateLearning();
    },
    onError: error => toast.error(error.message),
  });
  const archiveTarget = trpc.institutionLearning.archiveTarget.useMutation({
    onSuccess: async () => {
      toast.success("Target archived");
      await invalidateLearning();
    },
    onError: error => toast.error(error.message),
  });

  const submitSession = async () => {
    if (!presenterUserId) {
      toast.error("Choose a lead presenter from the eligible presenter list.");
      return;
    }
    const selectedCoPresenters = coPresenters
      .map(presenter => presenter.userId)
      .filter(Boolean)
      .map(userId => ({ userId: Number(userId) }));
    try {
      const created = await createSession.mutateAsync({
        institutionId,
        name: sessionName,
        eventDate: sessionDate,
        eventDateAt: sessionDate,
        eventType: eventType as any,
        audienceScope: audienceScope as any,
        audienceLabel: audienceLabel.trim() || null,
        facilityDepartmentId: sessionDepartmentId
          ? Number(sessionDepartmentId)
          : null,
        presenterUserId: Number(presenterUserId),
        cpdPoints: cpdPoints ? Number(cpdPoints) : null,
        approvingCouncil: null,
        coPresenters: selectedCoPresenters,
      });
      if (quizEnabled) {
        await createEventQuiz.mutateAsync({
          institutionId,
          eventId: created.eventId,
          passingScore: Number(quizPassingScore),
          isRequired: true,
          questions: quizQuestions.map(question => ({
            ...question,
            options: question.questionType === "true_false" ? ["true", "false"] : question.options.filter(Boolean),
          })),
        });
        toast.success("CPD session and required quiz created.");
      }
    } catch (error) {
      toast.error((error as Error).message || "CPD session creation failed.");
    }
  };
  const quizIsValid = !quizEnabled || (
    quizQuestions.length > 0 &&
    quizQuestions.every(question =>
      question.question.trim().length >= 3 &&
      question.correctAnswer.trim().length > 0 &&
      (question.questionType === "true_false"
        ? ["true", "false"].includes(question.correctAnswer.trim().toLowerCase())
        : question.options.filter(option => option.trim()).length >= 2 &&
          question.options.some(option => option.trim().toLowerCase() === question.correctAnswer.trim().toLowerCase()))
    )
  );

  const submitTarget = () => {
    saveTarget.mutate({
      institutionId,
      targetScope,
      departmentId:
        targetScope === "department" ? Number(targetDepartmentId) : null,
      userId: targetScope === "individual" ? Number(targetUserId) : null,
      metricKey: metricKey as any,
      periodType,
      periodStart,
      periodEnd,
      targetValue: Number(targetValue),
      revisionReason: targetRevisionReason.trim() || null,
      courseProgramType: courseProgramType ? (courseProgramType as any) : null,
      coursePhase: coursePhase ? (coursePhase as any) : null,
    });
  };

  return (
    <div className="min-w-0 space-y-6">
      {mode !== "sessions" && (
      <Card className="border-violet-200 bg-violet-50/30 dark:border-violet-900 dark:bg-violet-950/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <UserRoundCheck className="h-5 w-5 text-violet-700" />
            Education Coordinators by department
          </CardTitle>
          <CardDescription>
            Assign a coordinator from each department. Institutional CPD
            Coordinators can manage all departments; Departmental Heads can
            manage only their own department. All-facility visibility remains
            with institutional administrators and the Institutional CPD Coordinator.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {canManageCoordinatorAssignments ? (
              <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
            <select
              className="h-10 w-full min-w-0 max-w-full rounded-md border bg-background px-3 text-sm"
              value={selectedDepartmentId}
              onChange={event => setSelectedDepartmentId(event.target.value)}
            >
              <option value="">Choose department</option>
              {departments.map(department => (
                <option key={department.id} value={department.id}>
                  {department.departmentName}
                </option>
              ))}
            </select>
            <select
              className="h-10 w-full min-w-0 max-w-full rounded-md border bg-background px-3 text-sm"
              value={selectedCoordinatorUserId}
              onChange={event =>
                setSelectedCoordinatorUserId(event.target.value)
              }
            >
              <option value="">{selectedDepartmentId ? "Choose staff member in this department" : "Choose a department first"}</option>
              {selectedDepartmentStaff.map(person => (
                <option
                  key={person.userId ?? person.id}
                  value={person.userId ?? ""}
                >
                  {person.staffName} · {person.staffRole}
                </option>
              ))}
            </select>
            <Button
              onClick={() =>
                assignCoordinator.mutate({
                  institutionId,
                  departmentId: Number(selectedDepartmentId),
                  userId: Number(selectedCoordinatorUserId),
                })
              }
              disabled={
                !selectedDepartmentId ||
                !selectedCoordinatorUserId ||
                assignCoordinator.isPending
              }
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Assign
            </Button>
            </div> ) : ( <p className="text-sm text-muted-foreground">Coordinator assignments are managed by the Institutional CPD Coordinator, Departmental Head for the relevant department, or an institutional administrator. You only see coordinators for your permitted department(s).</p>)}
          <div className="grid gap-2 md:grid-cols-2">
            {coordinators
              .filter(row => row.assignmentStatus === "active")
              .map(row => (
                <div
                  key={row.id}
                  className="flex items-center justify-between gap-3 rounded-lg border bg-background p-3 text-sm"
                >
                      <div>
                        <p className="font-medium">
                          {row.fullName ?? "Unlinked staff"}
                        </p>
                    <p className="text-xs text-muted-foreground">
                      {row.departmentName ?? "Department"} ·{" "}
                      {row.email ?? "No email"}
                    </p>
                  </div>
                  {canManageCoordinatorAssignments && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        endCoordinator.mutate({
                          institutionId,
                          assignmentId: row.id,
                        })
                      }
                      disabled={endCoordinator.isPending}
                    >
                      End assignment
                    </Button>
                  )}
                </div>
              ))}
          </div>
        </CardContent>
              </Card>
      )}

      {mode !== "people" && (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarPlus className="h-5 w-5 text-blue-700" />
            Create a CPD session
          </CardTitle>
          <CardDescription>
            Classify the audience at creation time so facility-wide, nursing
            CNE, clinical, M&M, and other-cadre learning can be analysed
            separately. Add one or more presenters; co-presenters are stored as
            presenters, not attendees.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid min-w-0 gap-3 md:grid-cols-2">
            <Field label="Session title">
              <input
                className="h-10 w-full min-w-0 max-w-full rounded-md border bg-background px-3 text-sm"
                value={sessionName}
                onChange={event => setSessionName(event.target.value)}
                placeholder="e.g. Paediatric sepsis recognition"
              />
            </Field>
            <Field label="Date">
              <input
                className="h-10 w-full min-w-0 max-w-full rounded-md border bg-background px-3 text-sm"
                type="date"
                value={sessionDate}
                onChange={event => setSessionDate(event.target.value)}
              />
            </Field>
            <Field label="Session type">
              <select
                className="h-10 w-full min-w-0 max-w-full rounded-md border bg-background px-3 text-sm"
                value={eventType}
                onChange={event => setEventType(event.target.value)}
              >
                <option value="cne">CNE</option>
                <option value="cme">CME</option>
                <option value="cpd_general">General CPD</option>
                <option value="grand_rounds">Grand rounds</option>
                <option value="journal_club">Journal club</option>
                <option value="workshop">Workshop</option>
                <option value="m_and_m">M&M meeting</option>
                <option value="other_cadre">Other cadre session</option>
              </select>
            </Field>
            <Field label="Audience">
              <select
                className="h-10 w-full min-w-0 max-w-full rounded-md border bg-background px-3 text-sm"
                value={audienceScope}
                onChange={event => setAudienceScope(event.target.value)}
              >
                <option value="facility_wide">
                  Facility-wide — all personnel
                </option>
                <option value="nursing_wide">Nursing-wide — CNE</option>
                <option value="clinical">Clinical personnel</option>
                <option value="m_and_m">M&M — clinical personnel</option>
                <option value="other_cadre">Other cadre scoped</option>
              </select>
            </Field>
            <Field label="Department (optional for facility sessions)">
              <select
                className="h-10 w-full min-w-0 max-w-full rounded-md border bg-background px-3 text-sm"
                value={sessionDepartmentId}
                onChange={event => setSessionDepartmentId(event.target.value)}
              >
                <option value="">Facility-wide</option>
                {departments.map(department => (
                  <option key={department.id} value={department.id}>
                    {department.departmentName}
                  </option>
                ))}
              </select>
            </Field>
            {audienceScope === "other_cadre" && (
              <Field label="Audience cadre">
                <select
                  className="h-10 w-full min-w-0 max-w-full rounded-md border bg-background px-3 text-sm"
                  value={audienceLabel}
                  onChange={event => setAudienceLabel(event.target.value)}
                >
                  <option value="">Choose audience cadre</option>
                  {audienceCadres.map(cadre => (
                    <option key={cadre} value={cadre}>
                      {cadre}
                    </option>
                  ))}
                </select>
              </Field>
            )}
            <Field label="Lead presenter">
              <SearchableDropdown
                value={presenterUserId}
                onChange={setPresenterUserId}
                options={presenterOptions.map(({ value, label }) => ({ value, label }))}
                onSearchChange={setPresenterSearch}
                placeholder="Type to search any Paeds Resus account"
                searchPlaceholder="Search name or email..."
                emptyText="No matching Paeds Resus account found."
                clearable
                searchAlwaysVisible
              />
              {selectedPresenter ? (
                <p className="mt-1 text-xs text-muted-foreground">
                  Selected: {selectedPresenter.fullName} · {selectedPresenter.isInstitutionMember ? "Institution member" : "Platform account; profile will not be changed"}
                </p>
              ) : (
                <p className="mt-1 text-xs text-muted-foreground">Institution members appear first. Platform accounts outside this institution are labelled clearly.</p>
              )}
            </Field>
            <Field label="CPD points">
              <input
                className="h-10 w-full min-w-0 max-w-full rounded-md border bg-background px-3 text-sm"
                type="number"
                min="0"
                step="0.5"
                value={cpdPoints}
                onChange={event => setCpdPoints(event.target.value)}
              />
            </Field>
          </div>
          <div className="space-y-3 rounded-lg border bg-muted/20 p-4">
            <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="font-medium">Co-presenters (optional)</p>
                <p className="text-xs text-muted-foreground">
                  Add up to six additional presenters. Leave this section empty
                  for a single-presenter session; co-presenters do not inflate
                  attendance counts.
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() =>
                  setCoPresenters(rows =>
                    rows.length < 6
                      ? [
                          ...rows,
                            { userId: "" }
                        ]
                      : rows
                  )
                }
                className="w-full shrink-0 sm:w-auto"
                disabled={coPresenters.length >= 6}
              >
                Add co-presenter
              </Button>
            </div>
            {coPresenters.length === 0 ? (
              <p className="rounded-md border border-dashed px-3 py-2 text-sm text-muted-foreground">
                No co-presenter added. This session can be created with the lead presenter alone.
              </p>
            ) : null}
            {coPresenters.map((presenter, index) => {
              const selectedCoPresenterIds = new Set(
                coPresenters.map(row => Number(row.userId)).filter(Boolean)
              );
              const availableCoPresenters = coPresenterOptions.filter(
                option =>
                  option.value === presenter.userId ||
                  !selectedCoPresenterIds.has(Number(option.value))
              );
              const selectedCoPresenter = coPresenterOptions.find(
                option => option.value === presenter.userId
              );
              return (
                <div
                  key={index}
                  className="grid min-w-0 gap-2 md:grid-cols-[minmax(0,1fr)_auto]"
                >
                  <div>
                    <SearchableDropdown
                      value={presenter.userId}
                      onChange={value =>
                        setCoPresenters(rows =>
                          rows.map((row, rowIndex) => rowIndex === index ? { userId: value } : row)
                        )
                      }
                      options={coPresenterOptions
                        .filter(option => option.value === presenter.userId || !selectedCoPresenterIds.has(Number(option.value)))
                        .map(({ value, label }) => ({ value, label }))}
                      onSearchChange={setPresenterSearch}
                      placeholder="Type to search co-presenter"
                      searchPlaceholder="Search name or email..."
                      emptyText="No matching Paeds Resus account found."
                      clearable
                      searchAlwaysVisible
                    />
                    {selectedCoPresenter ? (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Selected: {selectedCoPresenter.label}
                      </p>
                    ) : null}
                  </div>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() =>
                      setCoPresenters(rows =>
                        rows.filter((_, rowIndex) => rowIndex !== index)
                      )
                    }
                    aria-label="Remove co-presenter"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}
          </div>
          <div className="space-y-4 rounded-lg border border-amber-200 bg-amber-50/30 p-4">
            <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="font-medium">Session quiz (optional)</p>
                <p className="text-xs text-muted-foreground">
                  If enabled, attendees must pass this quiz before attendance can be verified and CPD points can count. They may retry after a failed attempt.
                </p>
              </div>
              <label className="flex shrink-0 items-center gap-2 text-sm font-medium">
                <input
                  type="checkbox"
                  checked={quizEnabled}
                  onChange={event => setQuizEnabled(event.target.checked)}
                />
                Add required quiz
              </label>
            </div>
            {quizEnabled && (
              <div className="space-y-3">
                <Field label="Passing score (%)">
                  <input
                    className="h-10 w-full min-w-0 max-w-full rounded-md border bg-background px-3 text-sm"
                    type="number"
                    min="1"
                    max="100"
                    value={quizPassingScore}
                    onChange={event => setQuizPassingScore(event.target.value)}
                  />
                </Field>
                {quizQuestions.map((question, questionIndex) => (
                  <div key={questionIndex} className="space-y-3 rounded-md border bg-background p-3">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium">Question {questionIndex + 1}</p>
                      {quizQuestions.length > 1 && (
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => setQuizQuestions(current => current.filter((_, index) => index !== questionIndex))}
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                    <input
                      className="h-10 w-full min-w-0 max-w-full rounded-md border bg-background px-3 text-sm"
                      value={question.question}
                      onChange={event => setQuizQuestions(current => current.map((item, index) => index === questionIndex ? { ...item, question: event.target.value } : item))}
                      placeholder="Enter the question"
                    />
                    <select
                      className="h-10 w-full min-w-0 max-w-full rounded-md border bg-background px-3 text-sm"
                      value={question.questionType}
                      onChange={event => setQuizQuestions(current => current.map((item, index) => index === questionIndex ? {
                        ...item,
                        questionType: event.target.value as QuizDraftQuestion["questionType"],
                        options: event.target.value === "true_false" ? ["true", "false"] : item.options.length >= 2 ? item.options : ["", ""],
                        correctAnswer: event.target.value === "true_false" ? "true" : item.correctAnswer,
                      } : item))}
                    >
                      <option value="multiple_choice">Multiple choice</option>
                      <option value="true_false">True / false</option>
                    </select>
                    {question.questionType === "multiple_choice" && (
                      <div className="space-y-2">
                        {question.options.map((option, optionIndex) => (
                          <div key={optionIndex} className="flex min-w-0 gap-2">
                            <input
                              className="h-10 min-w-0 flex-1 rounded-md border bg-background px-3 text-sm"
                              value={option}
                              onChange={event => setQuizQuestions(current => current.map((item, index) => index === questionIndex ? {
                                ...item,
                                options: item.options.map((value, candidateIndex) => candidateIndex === optionIndex ? event.target.value : value),
                              } : item))}
                              placeholder={`Answer option ${optionIndex + 1}`}
                            />
                            {question.options.length > 2 && (
                              <Button type="button" size="icon" variant="ghost" onClick={() => setQuizQuestions(current => current.map((item, index) => index === questionIndex ? { ...item, options: item.options.filter((_, candidateIndex) => candidateIndex !== optionIndex) } : item))} aria-label={`Remove answer option ${optionIndex + 1}`}>
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        ))}
                        <Button type="button" size="sm" variant="outline" onClick={() => setQuizQuestions(current => current.map((item, index) => index === questionIndex ? { ...item, options: [...item.options, ""] } : item))}>
                          Add answer option
                        </Button>
                      </div>
                    )}
                    <input
                      className="h-10 w-full min-w-0 max-w-full rounded-md border bg-background px-3 text-sm"
                      value={question.correctAnswer}
                      onChange={event => setQuizQuestions(current => current.map((item, index) => index === questionIndex ? { ...item, correctAnswer: event.target.value } : item))}
                      placeholder={question.questionType === "true_false" ? "true or false" : "Exact correct answer"}
                    />
                  </div>
                ))}
                <Button type="button" size="sm" variant="outline" onClick={() => setQuizQuestions(current => [...current, emptyQuizQuestion()])}>
                  Add question
                </Button>
                {!quizIsValid && <p className="text-xs text-amber-800">Complete every question, include at least two options, and enter the exact correct answer before creating the session.</p>}
              </div>
            )}
          </div>
          <Button
            onClick={submitSession}
            disabled={
              !sessionName.trim() ||
              !sessionDate ||
              !presenterUserId ||
              (audienceScope === "other_cadre" && !audienceLabel) ||
              !quizIsValid ||
              createSession.isPending ||
              createEventQuiz.isPending
            }
          >
            <CalendarPlus className="mr-2 h-4 w-4" />
            {createSession.isPending ? "Creating…" : "Create CPD session"}
          </Button>
        </CardContent>
      </Card>
      )}

      {mode !== "sessions" && (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Target className="h-5 w-5 text-emerald-700" />
            Learning targets
          </CardTitle>
          <CardDescription>
            Set facility, department, or individual targets for a defined
            period. Progress is computed from CPD attendance and authoritative
            life-support records.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
            <Field label="Target scope">
              <select
                className="h-10 w-full min-w-0 max-w-full rounded-md border bg-background px-3 text-sm"
                value={targetScope}
                onChange={event =>
                  setTargetScope(event.target.value as typeof targetScope)
                }
              >
                <option value="facility">Facility</option>
                <option value="department">Department</option>
                <option value="individual">Individual</option>
              </select>
            </Field>
            {targetScope === "department" && (
              <Field label="Department">
                <select
                  className="h-10 w-full min-w-0 max-w-full rounded-md border bg-background px-3 text-sm"
                  value={targetDepartmentId}
                  onChange={event => setTargetDepartmentId(event.target.value)}
                >
                  <option value="">Choose department</option>
                  {departments.map(department => (
                    <option key={department.id} value={department.id}>
                      {department.departmentName}
                    </option>
                  ))}
                </select>
              </Field>
            )}
            {targetScope === "individual" && (
              <>
                <Field label="Filter staff by department">
                  <select
                    className="h-10 w-full min-w-0 max-w-full rounded-md border bg-background px-3 text-sm"
                    value={targetDepartmentId}
                    onChange={event => {
                      setTargetDepartmentId(event.target.value);
                      setTargetUserId("");
                    }}
                  >
                    <option value="">All departments</option>
                    {departments.map(department => (
                      <option key={department.id} value={department.id}>
                        {department.departmentName}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Individual">
                  <select
                    className="h-10 w-full min-w-0 max-w-full rounded-md border bg-background px-3 text-sm"
                    value={targetUserId}
                    onChange={event => setTargetUserId(event.target.value)}
                  >
                    <option value="">Choose staff member</option>
                    {targetStaff.map(person => (
                      <option
                        key={person.userId ?? person.id}
                        value={person.userId ?? ""}
                      >
                        {memberLabel(person)}
                      </option>
                    ))}
                  </select>
                </Field>
              </>
            )}
            <Field label="Metric">
              <select
                className="h-10 w-full min-w-0 max-w-full rounded-md border bg-background px-3 text-sm"
                value={metricKey}
                onChange={event =>
                  setMetricKey(event.target.value as typeof metricKey)
                }
              >
                {METRICS.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Period">
              <select
                className="h-10 w-full min-w-0 max-w-full rounded-md border bg-background px-3 text-sm"
                value={periodType}
                onChange={event =>
                  setPeriodType(event.target.value as typeof periodType)
                }
              >
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="annual">Annual</option>
              </select>
            </Field>
            <Field label="Start">
              <input
                className="h-10 w-full min-w-0 max-w-full rounded-md border bg-background px-3 text-sm"
                type="date"
                value={periodStart}
                onChange={event => setPeriodStart(event.target.value)}
              />
            </Field>
            <Field label="End">
              <input
                className="h-10 w-full min-w-0 max-w-full rounded-md border bg-background px-3 text-sm"
                type="date"
                value={periodEnd}
                onChange={event => setPeriodEnd(event.target.value)}
              />
            </Field>
            <Field label="Target value">
              <input
                className="h-10 w-full min-w-0 max-w-full rounded-md border bg-background px-3 text-sm"
                type="number"
                min="0"
                step="1"
                value={targetValue}
                onChange={event => setTargetValue(event.target.value)}
              />
            </Field>
            <Field label="Revision reason (optional)">
              <input
                className="h-10 w-full min-w-0 max-w-full rounded-md border bg-background px-3 text-sm"
                value={targetRevisionReason}
                onChange={event => setTargetRevisionReason(event.target.value)}
                placeholder="Why is this target changing?"
              />
            </Field>
            {(metricKey === "life_support_completed" ||
              metricKey === "course_phase_completion") && (
              <Field label="Course">
                <select
                  className="h-10 w-full min-w-0 max-w-full rounded-md border bg-background px-3 text-sm"
                  value={courseProgramType}
                  onChange={event => setCourseProgramType(event.target.value)}
                >
                  <option value="">All life-support courses</option>
                  {COURSE_TYPES.map(course => (
                    <option key={course} value={course}>
                      {COURSE_LABELS[course]}
                    </option>
                  ))}
                </select>
              </Field>
            )}
            {metricKey === "course_phase_completion" && (
              <Field label="Phase">
                <select
                  className="h-10 w-full min-w-0 max-w-full rounded-md border bg-background px-3 text-sm"
                  value={coursePhase}
                  onChange={event => setCoursePhase(event.target.value)}
                >
                  <option value="">Choose phase</option>
                  <option value="cognitive">Cognitive</option>
                  <option value="phase_2">Phase 2 — Online simulations</option>
                  <option value="phase_3">Phase 3 — Hands-on sign-off</option>
                  <option value="completed">Course completed</option>
                </select>
              </Field>
            )}
          </div>
          <Button
            onClick={submitTarget}
            disabled={
              saveTarget.isPending ||
              (targetScope === "department" && !targetDepartmentId) ||
              (targetScope === "individual" && !targetUserId) ||
              (metricKey === "course_phase_completion" && !coursePhase)
            }
          >
            <Target className="mr-2 h-4 w-4" />
            {saveTarget.isPending ? "Saving…" : "Save target"}
          </Button>
          {targets.length > 0 && (
            <div className="max-w-full overflow-x-auto rounded-lg border">
              <table className="w-full min-w-[720px] text-sm">
                <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <tr>
                    <th className="px-3 py-3">Metric</th>
                    <th className="px-3 py-3">Scope</th>
                    <th className="px-3 py-3">Period</th>
                    <th className="px-3 py-3">Target</th>
                    <th className="px-3 py-3">Revision</th>
                    <th className="px-3 py-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {targets.map(target => (
                    <tr key={target.id} className="border-b last:border-0">
                      <td className="px-3 py-3">
                        {target.metricKey.replaceAll("_", " ")}
                      </td>
                      <td className="px-3 py-3">
                        {target.targetScope}
                        {target.departmentId
                          ? ` · dept ${target.departmentId}`
                          : target.userId
                            ? ` · user ${target.userId}`
                            : ""}
                      </td>
                      <td className="px-3 py-3">
                        {String(target.periodStart)} —{" "}
                        {String(target.periodEnd)}
                      </td>
                      <td className="px-3 py-3">{target.targetValue}</td>
                      <td className="px-3 py-3">v{target.revisionNumber ?? 1}</td>
                      <td className="px-3 py-3">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            archiveTarget.mutate({
                              institutionId,
                              targetId: target.id,
                            })
                          }
                        >
                          Archive
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="min-w-0 space-y-1.5 text-sm">
      <span className="block text-xs font-medium text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}
