import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertCircle,
  BarChart3,
  CheckCircle2,
  ShieldCheck,
  Users,
} from "lucide-react";

function label(value: string | null | undefined): string {
  return (value ?? "not recorded").replaceAll("_", " ");
}

function statusVariant(
  value: string
): "default" | "secondary" | "outline" | "destructive" {
  if (["current", "met", "strong"].includes(value)) return "default";
  if (["expiring", "in_progress", "on_track"].includes(value))
    return "secondary";
  if (["expired", "needs_support", "rejected"].includes(value))
    return "destructive";
  return "outline";
}

export function InstitutionAccountabilityPanel({
  institutionId,
  isInstitutionAdmin,
}: {
  institutionId: number;
  isInstitutionAdmin: boolean;
}) {
  const [selectedDepartmentId, setSelectedDepartmentId] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [message, setMessage] = useState("");
  const dashboardQuery =
    trpc.institutionAccountability.getComplianceDashboard.useQuery({
      institutionId,
      periodType: "quarterly",
    });
  const staffQuery = trpc.institution.getStaffMembers.useQuery(
    { institutionId },
    { enabled: isInstitutionAdmin }
  );
  const headsQuery =
    trpc.institutionAccountability.listDepartmentHeads.useQuery({
      institutionId,
    });
  const assignHead =
    trpc.institutionAccountability.assignDepartmentHead.useMutation({
      onSuccess: async () => {
        setMessage("Departmental Head appointment saved.");
        await Promise.all([dashboardQuery.refetch(), headsQuery.refetch()]);
      },
      onError: error => setMessage(error.message),
    });
  const endHead = trpc.institutionAccountability.endDepartmentHead.useMutation({
    onSuccess: async () => {
      setMessage("Departmental Head appointment ended.");
      await Promise.all([dashboardQuery.refetch(), headsQuery.refetch()]);
    },
    onError: error => setMessage(error.message),
  });
  const data = dashboardQuery.data;

  if (dashboardQuery.isLoading) {
    return (
      <Card>
        <CardContent className="py-10 text-sm text-muted-foreground">
          Loading scoped credential and learning accountability…
        </CardContent>
      </Card>
    );
  }
  if (dashboardQuery.error) {
    return (
      <Card>
        <CardContent className="flex items-start gap-2 py-6 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4" />
          {dashboardQuery.error.message}
        </CardContent>
      </Card>
    );
  }
  if (!data) return null;

  const departments = data.departments;
  const staff = (staffQuery.data ?? []).filter(
    row => row.userId != null && row.removedAt == null
  );

  return (
    <div className="space-y-6">
      <Card className="border-indigo-200 bg-indigo-50/60 dark:border-indigo-900/50 dark:bg-indigo-950/20">
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-indigo-700" />
                Credential & learning accountability
              </CardTitle>
              <CardDescription className="mt-1">
                Current compliance, Life Support learning, CPD engagement, and
                target progress in your authorised institution or department
                scope.
              </CardDescription>
            </div>
            <Badge variant="secondary" className="capitalize">
              {label(data.access.role)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">
            Names are shown only to authorised administrators and scoped
            accountability leads. Private phone numbers, personal contacts,
            evidence files, and unrelated performance data are not displayed
            here.
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Licence current / expiring"
          value={`${data.summary.licensedCurrentOrExpiring}`}
          detail={`${data.summary.licensedExpired} expired · ${data.summary.licensedMissing} missing`}
          tone="text-emerald-700"
        />
        <MetricCard
          label="Life Support current / expiring"
          value={`${data.summary.lifeSupportCurrentOrExpiring}`}
          detail={`${data.summary.lifeSupportExpired} expired · ${data.summary.lifeSupportMissing} missing`}
          tone="text-blue-700"
        />
        <MetricCard
          label="CPD sessions held"
          value={`${data.summary.cpdSessionsHeld}`}
          detail={`${data.summary.cpdAttendanceRate}% roster-seat attendance`}
          tone="text-violet-700"
        />
        <MetricCard
          label="Departments needing support"
          value={`${data.summary.departmentsNeedingSupport}`}
          detail="Based on current learning period"
          tone="text-amber-700"
        />
      </div>

      <Card className="border-rose-200 bg-rose-50/40 dark:border-rose-900/50 dark:bg-rose-950/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-rose-700" />
            Clinical duty safety & experience
          </CardTitle>
          <CardDescription>
            ERT duty-ready means verified Licence number, Issue date, and Valid
            until are present and the licence is current. Experience is shown
            only as a workforce-QI signal, not as a competency decision.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <MetricCard
            label="ERT duty-ready"
            value={`${data.summary.ertClinicalDutyReady}`}
            detail={`${data.summary.ertClinicalDutyBlocked} blocked or incomplete`}
            tone="text-emerald-700"
          />
          <MetricCard
            label="Experience recorded"
            value={`${data.summary.experienceRecordedStaff}/${data.summary.staffCount}`}
            detail={data.summary.averageYearsOfExperience == null ? "No experience data" : `Average ${data.summary.averageYearsOfExperience} years`}
            tone="text-indigo-700"
          />
          <MetricCard
            label="Licence action needed"
            value={`${data.summary.licensedExpired + data.summary.licensedMissing}`}
            detail="Expired or missing licence record"
            tone="text-amber-700"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Department results
          </CardTitle>
          <CardDescription>
            Aggregate results first. Use the scoped people view below for
            one-to-one appraisal; this is not a public leaderboard.
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-3 py-2">Department</th>
                <th className="px-3 py-2">Staff</th>
                <th className="px-3 py-2">Licence current</th>
                <th className="px-3 py-2">ERT duty-ready</th>
                <th className="px-3 py-2">Avg experience</th>
                <th className="px-3 py-2">Life Support current</th>
                <th className="px-3 py-2">Sessions</th>
                <th className="px-3 py-2">Attendance</th>
                <th className="px-3 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.departments.map(row => (
                <tr key={row.departmentId} className="border-b last:border-0">
                  <td className="px-3 py-3 font-medium">{row.department}</td>
                  <td className="px-3 py-3">{row.staffCount}</td>
                  <td className="px-3 py-3">
                    {row.licensedCurrentOrExpiring}/{row.staffCount}
                  </td>
                  <td className="px-3 py-3">
                    {row.ertClinicalDutyReady}/{row.staffCount}
                  </td>
                  <td className="px-3 py-3">
                    {row.averageYearsOfExperience == null ? "—" : `${row.averageYearsOfExperience} yrs`}
                  </td>
                  <td className="px-3 py-3">
                    {row.lifeSupportCurrentOrExpiring}/{row.staffCount}
                  </td>
                  <td className="px-3 py-3">{row.sessionsHeld}</td>
                  <td className="px-3 py-3">{row.attendanceRate}%</td>
                  <td className="px-3 py-3">
                    <Badge
                      variant={statusVariant(row.status)}
                      className="capitalize"
                    >
                      {label(row.status)}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!data.departments.length ? (
            <p className="py-4 text-sm text-muted-foreground">
              No departments are available in this authorised scope.
            </p>
          ) : null}
        </CardContent>
      </Card>

      {data.access.canViewIndividuals ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Scoped people view
            </CardTitle>
            <CardDescription>
              For authorised one-to-one appraisal and compliance follow-up. No
              personal phone numbers or private evidence files are exposed in
              this table.
            </CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-3 py-2">Staff member</th>
                  <th className="px-3 py-2">Department</th>
                  <th className="px-3 py-2">Cadre</th>
                  <th className="px-3 py-2">Experience</th>
                  <th className="px-3 py-2">Licence</th>
                  <th className="px-3 py-2">ERT duty</th>
                  <th className="px-3 py-2">Life Support</th>
                  <th className="px-3 py-2">CPD attendance</th>
                  <th className="px-3 py-2">CPD target signal</th>
                </tr>
              </thead>
              <tbody>
                {data.people.map(row => (
                  <tr key={row.staffId} className="border-b last:border-0">
                    <td className="px-3 py-3 font-medium">{row.fullName}</td>
                    <td className="px-3 py-3">{row.department}</td>
                    <td className="px-3 py-3">{row.cadre ?? "Not recorded"}</td>
                    <td className="px-3 py-3">
                      {row.experienceRecorded ? `${row.yearsOfExperience} years` : "Not recorded"}
                    </td>
                    <td className="px-3 py-3">
                      <Badge
                        variant={statusVariant(row.licenseStatus)}
                        className="capitalize"
                      >
                        {label(row.licenseStatus)}
                      </Badge>
                    </td>
                    <td className="px-3 py-3">
                      <Badge
                        variant={row.ertClinicalDutyEligible ? "default" : "destructive"}
                        className="capitalize"
                      >
                        {row.ertClinicalDutyEligible ? "ready" : "blocked"}
                      </Badge>
                      {!row.ertClinicalDutyEligible ? (
                        <div className="mt-1 text-[11px] text-muted-foreground">
                          {label(row.ertClinicalDutyBlockReason)}
                        </div>
                      ) : null}
                    </td>
                    <td className="px-3 py-3">
                      <Badge
                        variant={statusVariant(row.lifeSupportStatus)}
                        className="capitalize"
                      >
                        {label(row.lifeSupportStatus)}
                      </Badge>
                      <div className="mt-1 text-[11px] text-muted-foreground">
                        {row.lifeSupportSources.join(", ") ||
                          "No verified source"}
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      {row.cpdAttendedSessions}/{row.cpdEligibleSessions} (
                      {row.cpdAttendanceRate}%)
                    </td>
                    <td className="px-3 py-3">
                      <Badge
                        variant={statusVariant(row.cpdStatus)}
                        className="capitalize"
                      >
                        {label(row.cpdStatus)}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-4 text-xs text-muted-foreground">
              This data supports coaching and appraisal. It must not be used as
              a standalone measure of bedside competence, disciplinary action,
              or patient outcome.
            </p>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Departmental Head appointments</CardTitle>
          <CardDescription>
            Each department may have one active Departmental Head. The
            appointment grants department-scoped learning and credential
            accountability only; it is not an IERS duty or unrestricted
            institution administration.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isInstitutionAdmin ? (
            <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
              <select
                className="rounded-md border bg-background px-3 py-2 text-sm"
                value={selectedDepartmentId}
                onChange={event => setSelectedDepartmentId(event.target.value)}
              >
                <option value="">Choose department</option>
                {departments.map(department => (
                  <option
                    key={department.departmentId}
                    value={department.departmentId}
                  >
                    {department.department}
                  </option>
                ))}
              </select>
              <select
                className="rounded-md border bg-background px-3 py-2 text-sm"
                value={selectedUserId}
                onChange={event => setSelectedUserId(event.target.value)}
              >
                <option value="">Choose active staff member</option>
                {staff.map(member => (
                  <option key={member.userId} value={member.userId ?? ""}>
                    {member.staffName} — {member.staffRole ?? "staff"}
                  </option>
                ))}
              </select>
              <Button
                disabled={
                  !selectedDepartmentId ||
                  !selectedUserId ||
                  assignHead.isPending
                }
                onClick={() =>
                  assignHead.mutate({
                    institutionId,
                    departmentId: Number(selectedDepartmentId),
                    userId: Number(selectedUserId),
                  })
                }
              >
                Appoint
              </Button>
            </div>
          ) : null}
          {message ? (
            <p className="text-sm text-muted-foreground">{message}</p>
          ) : null}
          <div className="space-y-2">
            {(data.heads ?? []).map(head => (
              <div
                key={head.id}
                className="flex flex-col gap-2 rounded-lg border p-3 text-sm md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <p className="font-medium">
                    {head.department ?? "Department"}:{" "}
                    {head.fullName ?? "Assigned staff member"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Active since{" "}
                    {new Date(head.assignedAt).toLocaleDateString()}
                  </p>
                </div>
                {isInstitutionAdmin ? (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={endHead.isPending}
                    onClick={() =>
                      endHead.mutate({
                        institutionId,
                        assignmentId: head.id,
                        note: "Appointment ended from accountability workspace.",
                      })
                    }
                  >
                    End appointment
                  </Button>
                ) : null}
              </div>
            ))}
            {!(data.heads ?? []).length ? (
              <p className="text-sm text-muted-foreground">
                No active Departmental Head appointments in this scope.
              </p>
            ) : null}
          </div>
          <div className="flex items-start gap-2 text-xs text-muted-foreground">
            <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
            Departmental Head, ERCo, and Education Coordinator access remains
            separate from provider duty acceptance and IERS operational
            permissions.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function MetricCard({
  label: title,
  value,
  detail,
  tone,
}: {
  label: string;
  value: string;
  detail: string;
  tone: string;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">
          {title}
        </p>
        <p className={`mt-2 text-3xl font-semibold ${tone}`}>{value}</p>
        <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
      </CardContent>
    </Card>
  );
}
