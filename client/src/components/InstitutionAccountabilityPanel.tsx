import { useEffect, useState } from "react";
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
  ExternalLink,
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
  const [peopleFilter, setPeopleFilter] = useState<"all" | "action" | "expiring" | "learning">("all");
  const [cadreFilter, setCadreFilter] = useState("all");
  const [periodType, setPeriodType] = useState<"monthly" | "quarterly" | "annual">("quarterly");
  const [message, setMessage] = useState("");
  const [evidenceCredentialId, setEvidenceCredentialId] = useState<number | null>(null);
  const [slowLoad, setSlowLoad] = useState(false);
  const dashboardQuery =
    trpc.institutionAccountability.getComplianceDashboard.useQuery({
      institutionId,
      periodType,
    }, {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
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
  const reviewCredential = trpc.institutionAccountability.reviewCredential.useMutation({
    onSuccess: async result => {
      setMessage(`Credential ${result.decision}.`);
      await dashboardQuery.refetch();
    },
    onError: error => setMessage(error.message),
  });
  const evidenceQuery = trpc.institutionAccountability.getScopedCredentialEvidenceUrl.useQuery(
    { institutionId, credentialId: evidenceCredentialId ?? 0 },
    { enabled: evidenceCredentialId != null, retry: false },
  );
  useEffect(() => {
    if (!evidenceQuery.data?.url) return;
    window.open(evidenceQuery.data.url, "_blank", "noopener,noreferrer");
    setEvidenceCredentialId(null);
  }, [evidenceQuery.data]);
  useEffect(() => {
    if (!dashboardQuery.isLoading) {
      setSlowLoad(false);
      return;
    }
    const timeout = window.setTimeout(() => setSlowLoad(true), 8_000);
    return () => window.clearTimeout(timeout);
  }, [dashboardQuery.isLoading]);
  const data = dashboardQuery.data;

  if (dashboardQuery.isLoading) {
    return (
      <Card>
        <CardContent className="space-y-4 py-6 text-sm text-muted-foreground">
          <div>
            <p className="font-medium text-foreground">Preparing accountability for this institution…</p>
            <p className="mt-1">Loading credential status, Life Support records, CPD activity, and department summaries.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3"><div className="h-20 animate-pulse rounded-lg bg-muted" /><div className="h-20 animate-pulse rounded-lg bg-muted" /><div className="h-20 animate-pulse rounded-lg bg-muted" /></div>
          {slowLoad ? <div className="flex flex-wrap items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-3 text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/20 dark:text-amber-200"><span>This is taking longer than expected. No institution data has been changed.</span><Button type="button" size="sm" variant="outline" onClick={() => void dashboardQuery.refetch()}>Retry accountability</Button></div> : null}
        </CardContent>
      </Card>
    );
  }
  if (dashboardQuery.error) {
    return (
      <Card>
        <CardContent className="flex items-start gap-2 py-6 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4" />
          <div><p>{dashboardQuery.error.message}</p><Button type="button" size="sm" variant="outline" className="mt-3" onClick={() => void dashboardQuery.refetch()}>Retry accountability</Button></div>
        </CardContent>
      </Card>
    );
  }
  if (!data) return null;

  const departments = data.departments;
  const staff = (staffQuery.data ?? []).filter(
    row => row.userId != null && row.removedAt == null
  );
  const cadres = Array.from(new Set(data.people.map(row => row.cadre).filter((value): value is NonNullable<typeof value> => Boolean(value)))).sort();
  const filteredPeople = data.people.filter(row => {
    if (cadreFilter !== "all" && row.cadre !== cadreFilter) return false;
    if (peopleFilter === "action") return row.licenseStatus === "missing" || row.licenseStatus === "expired" || (data.access.canViewEvidence && !row.regulatoryCredential?.evidenceUploaded) || row.lifeSupportStatus === "missing" || row.lifeSupportStatus === "expired";
    if (peopleFilter === "expiring") return row.licenseStatus === "expiring" || row.lifeSupportStatus === "expiring";
    if (peopleFilter === "learning") return row.cpdStatus === "needs_support" || row.cpdStatus === "no_data" || row.lifeSupportStatus === "missing";
    return true;
  });

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

      <Card className="border-slate-200 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-900/30">
        <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4 text-sm">
          <div>
            <span className="font-medium">Reporting period: </span>
            <select
              className="rounded-md border bg-background px-2 py-1 text-sm capitalize"
              value={periodType}
              onChange={event => setPeriodType(event.target.value as typeof periodType)}
              aria-label="Accountability reporting period"
            >
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="annual">Annual</option>
            </select>
            <span className="text-muted-foreground"> · {data.learning.period.periodStart} to {data.learning.period.periodEnd}</span>
            {dashboardQuery.isFetching ? <span className="ml-2 text-xs text-muted-foreground">Updating…</span> : null}
          </div>
          <div className="text-xs text-muted-foreground">
            Attendance is verified attendance seats divided by eligible staff-seats. It is not the number of sessions held.
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Licence dates current / expiring"
          value={`${data.summary.licensedCurrentOrExpiring}`}
          detail={`${data.summary.licensedExpired} expired · ${data.summary.licensedMissing} missing · ${data.summary.licensedEvidenceMissing} evidence missing`}
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
          detail={`${data.summary.cpdVerifiedAttendanceRecords} verified attendance records · ${data.summary.cpdAttendanceRate}% seat coverage`}
          tone="text-violet-700"
        />
        <MetricCard
          label="CPD sessions presented"
          value={`${data.summary.cpdSessionsPresented}`}
          detail={`${data.summary.cpdSessionsCoPresented} co-presenter assignments · ${data.summary.cpdPointsAwarded} points offered`}
          tone="text-cyan-700"
        />
        <MetricCard
          label="Departments needing support"
          value={`${data.summary.departmentsNeedingSupport}`}
          detail="Based on current learning period"
          tone="text-amber-700"
        />
      </div>

      <Card className="border-violet-200 bg-violet-50/40 dark:border-violet-900/50 dark:bg-violet-950/20">
        <CardContent className="grid gap-3 py-4 text-sm sm:grid-cols-3">
          <div><div className="text-xs uppercase tracking-wide text-muted-foreground">Attendance review backlog</div><div className="text-xl font-semibold">{data.summary.cpdAttendanceReviewBacklog}</div><div className="text-xs text-muted-foreground">registrations not yet verified, excused, or cancelled</div></div>
          <div><div className="text-xs uppercase tracking-wide text-muted-foreground">Identity linkage</div><div className="text-xl font-semibold">{data.summary.cpdIdentityMatchRate == null ? "—" : `${data.summary.cpdIdentityMatchRate}%`}</div><div className="text-xs text-muted-foreground">{data.summary.cpdUnresolvedIdentityRecords} historical records need identity resolution</div></div>
          <div><div className="text-xs uppercase tracking-wide text-muted-foreground">Data quality</div><Badge variant={statusVariant(data.summary.cpdDataQualityStatus)} className="mt-1 capitalize">{label(data.summary.cpdDataQualityStatus)}</Badge><div className="mt-1 text-xs text-muted-foreground">Review this before using attendance for appraisal.</div></div>
        </CardContent>
      </Card>

      <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-900/50 dark:bg-amber-950/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><AlertCircle className="h-5 w-5 text-amber-700" />Action queue</CardTitle>
          <CardDescription>Start with the people and departments that need a decision, evidence request, or learning intervention.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3">
          <QueueCard label="Credential / Life Support review" value={data.people.filter(row => ["missing", "expired"].includes(row.licenseStatus) || (data.access.canViewEvidence && !row.regulatoryCredential?.evidenceUploaded) || ["missing", "expired"].includes(row.lifeSupportStatus)).length} onClick={() => setPeopleFilter("action")} />
          <QueueCard label="Expiring soon" value={data.people.filter(row => row.licenseStatus === "expiring" || row.lifeSupportStatus === "expiring").length} onClick={() => setPeopleFilter("expiring")} />
          <QueueCard label="Learning follow-up" value={data.people.filter(row => ["needs_support", "no_data"].includes(row.cpdStatus) || row.lifeSupportStatus === "missing").length} onClick={() => setPeopleFilter("learning")} />
        </CardContent>
      </Card>

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
            label="Licence records needing action"
            value={`${data.summary.licensedExpired + data.summary.licensedMissing + data.summary.licensedEvidenceMissing}`}
            detail="Expired, missing, or evidence-incomplete"
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
                <th className="px-3 py-2">Sessions held</th>
                <th className="px-3 py-2">Presented</th>
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
                  <td className="px-3 py-3">{row.sessionsPresented}</td>
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
            <div className="mb-4 flex flex-wrap gap-2 rounded-lg border bg-muted/20 p-3">
              <select className="rounded-md border bg-background px-3 py-2 text-sm" value={peopleFilter} onChange={event => setPeopleFilter(event.target.value as typeof peopleFilter)} aria-label="Workforce review queue">
                <option value="all">All staff</option>
                <option value="action">Credential or Life Support action</option>
                <option value="expiring">Expiring soon</option>
                <option value="learning">Learning follow-up</option>
              </select>
              <select className="rounded-md border bg-background px-3 py-2 text-sm" value={cadreFilter} onChange={event => setCadreFilter(event.target.value)} aria-label="Filter by cadre">
                <option value="all">All cadres</option>
                {cadres.map(cadre => <option key={cadre} value={cadre}>{cadre}</option>)}
              </select>
              {peopleFilter !== "all" || cadreFilter !== "all" ? <Button type="button" size="sm" variant="ghost" onClick={() => { setPeopleFilter("all"); setCadreFilter("all"); }}>Clear filters</Button> : null}
            </div>
            <table className="w-full min-w-[980px] text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-3 py-2">Staff member</th>
                  <th className="px-3 py-2">Department</th>
                  <th className="px-3 py-2">Cadre</th>
                  <th className="px-3 py-2">Experience</th>
                  <th className="px-3 py-2">Licence</th>
                  {data.access.canViewEvidence ? <th className="px-3 py-2">Licence review</th> : null}
                  <th className="px-3 py-2">ERT duty</th>
                  <th className="px-3 py-2">Life Support</th>
                  <th className="px-3 py-2">CPD attended</th>
                  <th className="px-3 py-2">CPD presented</th>
                  <th className="px-3 py-2">CPD points</th>
                  <th className="px-3 py-2">CPD target signal</th>
                </tr>
              </thead>
              <tbody>
                {filteredPeople.map(row => (
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
                        Licence dates: {label(row.licenseStatus)}
                      </Badge>
                    </td>
                    {data.access.canViewEvidence ? (
                      <td className="px-3 py-3">
                        {row.regulatoryCredential ? (
                          <div className="flex min-w-[190px] flex-col gap-2">
                            <div className="text-xs text-muted-foreground">
                              {row.regulatoryCredential.evidenceUploaded ? "Evidence uploaded" : "Evidence missing"}
                              {row.regulatoryCredential.status !== "pending" ? ` · ${row.regulatoryCredential.status}` : " · awaiting review"}
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {row.regulatoryCredential.evidenceUploaded ? (
                                <Button type="button" size="sm" variant="outline" disabled={evidenceCredentialId === row.regulatoryCredential.id} onClick={() => setEvidenceCredentialId(row.regulatoryCredential!.id)}>
                                  <ExternalLink className="mr-1 h-3 w-3" /> View evidence
                                </Button>
                              ) : null}
                              {row.regulatoryCredential.status === "pending" && row.regulatoryCredential.evidenceUploaded ? (
                                <Button type="button" size="sm" disabled={reviewCredential.isPending} onClick={() => reviewCredential.mutate({ institutionId, credentialId: row.regulatoryCredential!.id, decision: "verified", reason: "Licence evidence reviewed by an authorised institutional verifier." })}>Verify</Button>
                              ) : null}
                              {row.regulatoryCredential.status === "pending" ? (
                                <Button type="button" size="sm" variant="destructive" disabled={reviewCredential.isPending} onClick={() => {
                                  const reason = window.prompt("Reason for rejecting this licence evidence:");
                                  if (reason?.trim()) reviewCredential.mutate({ institutionId, credentialId: row.regulatoryCredential!.id, decision: "rejected", reason: reason.trim() });
                                }}>Reject</Button>
                              ) : null}
                              {row.regulatoryCredential.status === "verified" ? (
                                <Button type="button" size="sm" variant="destructive" disabled={reviewCredential.isPending} onClick={() => {
                                  const reason = window.prompt("Reason for revoking this licence verification:");
                                  if (reason?.trim()) reviewCredential.mutate({ institutionId, credentialId: row.regulatoryCredential!.id, decision: "revoked", reason: reason.trim() });
                                }}>Revoke</Button>
                              ) : null}
                            </div>
                          </div>
                        ) : <span className="text-xs text-muted-foreground">No structured licence record</span>}
                      </td>
                    ) : null}
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
                      {row.cpdAttendedSessions}/{row.cpdEligibleSessions} ({row.cpdAttendanceRate}%)
                    </td>
                    <td className="px-3 py-3">{row.cpdSessionsPresented}{row.cpdSessionsCoPresented ? ` + ${row.cpdSessionsCoPresented} co` : ""}</td>
                    <td className="px-3 py-3">{row.cpdPointsEarned}</td>
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
            {!filteredPeople.length ? <p className="py-4 text-sm text-muted-foreground">No staff match this review queue in your authorised scope.</p> : null}
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

function QueueCard({
  label: title,
  value,
  onClick,
}: {
  label: string;
  value: number;
  onClick: () => void;
}) {
  return (
    <button type="button" className="rounded-lg border bg-background p-3 text-left transition hover:border-amber-500 hover:shadow-sm" onClick={onClick}>
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{title}</p>
      <p className="mt-1 text-2xl font-semibold text-amber-700">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">Show in people queue</p>
    </button>
  );
}
