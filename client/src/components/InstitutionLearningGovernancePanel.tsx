import { useMemo, useState, type ReactNode } from "react";
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

const COURSE_TYPES = [
  "bls",
  "acls",
  "pals",
  "nrp",
  "heartsaver",
  "instructor",
] as const;
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
  const utils = trpc.useUtils();
  const { data: departments = [] } =
    trpc.institutionLearning.listDepartments.useQuery(
      { institutionId },
      { staleTime: 60_000 }
    );
  const { data: staff = [] } = trpc.institutionLearning.listDepartmentStaff.useQuery(
    {
      institutionId,
      departmentId: selectedDepartmentId ? Number(selectedDepartmentId) : undefined,
    },
    { staleTime: 30_000, enabled: mode !== "sessions" }
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
  const [selectedCoordinatorUserId, setSelectedCoordinatorUserId] =
    useState("");
  const [sessionName, setSessionName] = useState("");
  const [sessionDate, setSessionDate] = useState(today());
  const [eventType, setEventType] = useState("cpd_general");
  const [audienceScope, setAudienceScope] = useState("facility_wide");
  const [audienceLabel, setAudienceLabel] = useState("");
  const [sessionDepartmentId, setSessionDepartmentId] = useState("");
  const [presenterName, setPresenterName] = useState("");
  const [presenterCadre, setPresenterCadre] = useState("");
  const [cpdPoints, setCpdPoints] = useState("1");
  const [coPresenters, setCoPresenters] = useState([
    { fullName: "", email: "", cadre: "", department: "" },
  ]);
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
  const [courseProgramType, setCourseProgramType] = useState("");
  const [coursePhase, setCoursePhase] = useState("");
  const linkedStaff = useMemo(
    () => staff.filter(person => person.userId != null),
    [staff]
  );
  const selectedDepartmentStaff = useMemo(() => {
    if (!selectedDepartmentId) return [];
    const departmentId = Number(selectedDepartmentId);
    return linkedStaff.filter(person => person.facilityDepartmentId === departmentId);
  }, [linkedStaff, selectedDepartmentId]);

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
      toast.success("CPD session created");
      setSessionName("");
      setCoPresenters([{ fullName: "", email: "", cadre: "", department: "" }]);
      await invalidateLearning();
    },
    onError: error => toast.error(error.message),
  });
  const saveTarget = trpc.institutionLearning.saveTarget.useMutation({
    onSuccess: async () => {
      toast.success("Learning target saved");
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

  const submitSession = () => {
    const presenterRows = coPresenters
      .filter(presenter => presenter.fullName.trim())
      .map(presenter => ({
        ...presenter,
        email: presenter.email.trim() || null,
        cadre: presenter.cadre.trim() || null,
        department: presenter.department.trim() || null,
        userId: null,
      }));
    createSession.mutate({
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
      presenterUserId: null,
      presenterName: presenterName.trim() || null,
      presenterCadre: presenterCadre.trim() || null,
      presenterDepartment: null,
      cpdPoints: cpdPoints ? Number(cpdPoints) : null,
      approvingCouncil: null,
      coPresenters: presenterRows,
    });
  };
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
      courseProgramType: courseProgramType ? (courseProgramType as any) : null,
      coursePhase: coursePhase ? (coursePhase as any) : null,
    });
  };

  return (
    <div className="space-y-6">
      {mode !== "sessions" && (
      <Card className="border-violet-200 bg-violet-50/30 dark:border-violet-900 dark:bg-violet-950/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <UserRoundCheck className="h-5 w-5 text-violet-700" />
            Education Coordinators by department
          </CardTitle>
          <CardDescription>
            Assign a coordinator from each department. They can create and
            coordinate learning in their department, while institutional
            administrators retain the all-facility view.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isInstitutionAdmin ? <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
            <select
              className="h-10 rounded-md border bg-background px-3 text-sm"
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
              className="h-10 rounded-md border bg-background px-3 text-sm"
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
          </div> : <p className="text-sm text-muted-foreground">Coordinator assignments are managed by institutional administrators. You only see coordinators for your assigned department(s).</p>}
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
            separately. Co-presenters are stored as presenters, not attendees.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Session title">
              <input
                className="h-10 rounded-md border bg-background px-3 text-sm"
                value={sessionName}
                onChange={event => setSessionName(event.target.value)}
                placeholder="e.g. Paediatric sepsis recognition"
              />
            </Field>
            <Field label="Date">
              <input
                className="h-10 rounded-md border bg-background px-3 text-sm"
                type="date"
                value={sessionDate}
                onChange={event => setSessionDate(event.target.value)}
              />
            </Field>
            <Field label="Session type">
              <select
                className="h-10 rounded-md border bg-background px-3 text-sm"
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
                className="h-10 rounded-md border bg-background px-3 text-sm"
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
                className="h-10 rounded-md border bg-background px-3 text-sm"
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
            <Field label="Other-cadre label">
              <input
                className="h-10 rounded-md border bg-background px-3 text-sm"
                value={audienceLabel}
                onChange={event => setAudienceLabel(event.target.value)}
                placeholder="Finance, Housekeeping, Kitchen…"
              />
            </Field>
            <Field label="Lead presenter">
              <input
                className="h-10 rounded-md border bg-background px-3 text-sm"
                value={presenterName}
                onChange={event => setPresenterName(event.target.value)}
                placeholder="Name"
              />
            </Field>
            <Field label="Lead presenter cadre">
              <input
                className="h-10 rounded-md border bg-background px-3 text-sm"
                value={presenterCadre}
                onChange={event => setPresenterCadre(event.target.value)}
                placeholder="Nurse, doctor, pharmacist…"
              />
            </Field>
            <Field label="CPD points">
              <input
                className="h-10 rounded-md border bg-background px-3 text-sm"
                type="number"
                min="0"
                step="0.5"
                value={cpdPoints}
                onChange={event => setCpdPoints(event.target.value)}
              />
            </Field>
          </div>
          <div className="space-y-3 rounded-lg border bg-muted/20 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Co-presenters</p>
                <p className="text-xs text-muted-foreground">
                  Add up to six. They do not inflate attendance counts.
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
                          {
                            fullName: "",
                            email: "",
                            cadre: "",
                            department: "",
                          },
                        ]
                      : rows
                  )
                }
                disabled={coPresenters.length >= 6}
              >
                Add co-presenter
              </Button>
            </div>
            {coPresenters.map((presenter, index) => (
              <div
                key={index}
                className="grid gap-2 md:grid-cols-[1.2fr_1.2fr_1fr_1fr_auto]"
              >
                <input
                  className="h-10 rounded-md border bg-background px-3 text-sm"
                  value={presenter.fullName}
                  onChange={event =>
                    setCoPresenters(rows =>
                      rows.map((row, rowIndex) =>
                        rowIndex === index
                          ? { ...row, fullName: event.target.value }
                          : row
                      )
                    )
                  }
                  placeholder="Full name"
                />
                <input
                  className="h-10 rounded-md border bg-background px-3 text-sm"
                  value={presenter.email}
                  onChange={event =>
                    setCoPresenters(rows =>
                      rows.map((row, rowIndex) =>
                        rowIndex === index
                          ? { ...row, email: event.target.value }
                          : row
                      )
                    )
                  }
                  placeholder="Email"
                />
                <input
                  className="h-10 rounded-md border bg-background px-3 text-sm"
                  value={presenter.cadre}
                  onChange={event =>
                    setCoPresenters(rows =>
                      rows.map((row, rowIndex) =>
                        rowIndex === index
                          ? { ...row, cadre: event.target.value }
                          : row
                      )
                    )
                  }
                  placeholder="Cadre"
                />
                <input
                  className="h-10 rounded-md border bg-background px-3 text-sm"
                  value={presenter.department}
                  onChange={event =>
                    setCoPresenters(rows =>
                      rows.map((row, rowIndex) =>
                        rowIndex === index
                          ? { ...row, department: event.target.value }
                          : row
                      )
                    )
                  }
                  placeholder="Department"
                />
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={() =>
                    setCoPresenters(rows =>
                      rows.length === 1
                        ? rows
                        : rows.filter((_, rowIndex) => rowIndex !== index)
                    )
                  }
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
          <Button
            onClick={submitSession}
            disabled={
              !sessionName.trim() || !sessionDate || createSession.isPending
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
                className="h-10 rounded-md border bg-background px-3 text-sm"
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
                  className="h-10 rounded-md border bg-background px-3 text-sm"
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
              <Field label="Individual">
                <select
                  className="h-10 rounded-md border bg-background px-3 text-sm"
                  value={targetUserId}
                  onChange={event => setTargetUserId(event.target.value)}
                >
                  <option value="">Choose person</option>
                  {linkedStaff.map(person => (
                    <option
                      key={person.userId ?? person.id}
                      value={person.userId ?? ""}
                    >
                      {person.staffName}
                    </option>
                  ))}
                </select>
              </Field>
            )}
            <Field label="Metric">
              <select
                className="h-10 rounded-md border bg-background px-3 text-sm"
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
                className="h-10 rounded-md border bg-background px-3 text-sm"
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
                className="h-10 rounded-md border bg-background px-3 text-sm"
                type="date"
                value={periodStart}
                onChange={event => setPeriodStart(event.target.value)}
              />
            </Field>
            <Field label="End">
              <input
                className="h-10 rounded-md border bg-background px-3 text-sm"
                type="date"
                value={periodEnd}
                onChange={event => setPeriodEnd(event.target.value)}
              />
            </Field>
            <Field label="Target value">
              <input
                className="h-10 rounded-md border bg-background px-3 text-sm"
                type="number"
                min="0"
                step="1"
                value={targetValue}
                onChange={event => setTargetValue(event.target.value)}
              />
            </Field>
            {(metricKey === "life_support_completed" ||
              metricKey === "course_phase_completion") && (
              <Field label="Course">
                <select
                  className="h-10 rounded-md border bg-background px-3 text-sm"
                  value={courseProgramType}
                  onChange={event => setCourseProgramType(event.target.value)}
                >
                  <option value="">All life-support courses</option>
                  {COURSE_TYPES.map(course => (
                    <option key={course} value={course}>
                      {course.toUpperCase()}
                    </option>
                  ))}
                </select>
              </Field>
            )}
            {metricKey === "course_phase_completion" && (
              <Field label="Phase">
                <select
                  className="h-10 rounded-md border bg-background px-3 text-sm"
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
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full min-w-[720px] text-sm">
                <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-3 py-3">Metric</th>
                    <th className="px-3 py-3">Scope</th>
                    <th className="px-3 py-3">Period</th>
                    <th className="px-3 py-3">Target</th>
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
    <label className="space-y-1.5 text-sm">
      <span className="block text-xs font-medium text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}
