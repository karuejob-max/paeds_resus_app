import { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, ClipboardCheck, Mail, Phone, PlusCircle, RefreshCw, ShieldAlert, Users } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { DepartmentSelectors } from "@/components/DepartmentSelectors";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { isPresetDepartment } from "@/lib/clinical-departments";

function formatDate(value: Date | string | null | undefined) {
  if (!value) return "Not recorded";
  return new Date(value).toLocaleDateString();
}

export function InstitutionDepartmentReconciliationPanel({ institutionId }: { institutionId: number }) {
  const utils = trpc.useUtils();
  const [targetMode, setTargetMode] = useState<Record<string, string>>({});
  const [targetValue, setTargetValue] = useState<Record<string, string>>({});
  const [backfill, setBackfill] = useState<Record<string, boolean>>({});
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [customAcknowledged, setCustomAcknowledged] = useState<Record<string, boolean>>({});
  const [newDepartmentName, setNewDepartmentName] = useState("");
  const [newDepartmentCustomAcknowledged, setNewDepartmentCustomAcknowledged] = useState(false);
  const [newDepartmentReason, setNewDepartmentReason] = useState("");
  const [otherTargets, setOtherTargets] = useState<Record<string, string>>({});
  const [otherReasons, setOtherReasons] = useState<Record<string, string>>({});
  const [traceabilityFilter, setTraceabilityFilter] = useState<"all" | "other" | "custom">("all");

  const dashboardQuery = trpc.institutionDepartmentReconciliation.getDepartmentReconciliationDashboard.useQuery({ institutionId });
  const otherRegistrationsQuery = trpc.institutionDepartmentReconciliation.getOtherDepartmentRegistrations.useQuery({ institutionId, limit: 100, offset: 0 });
  const mapMutation = trpc.institutionDepartmentReconciliation.mapDepartmentLabel.useMutation({
    onSuccess: (result) => {
      toast.success(result.backfilledCount > 0 ? `Mapped and linked ${result.backfilledCount} CPD record(s).` : "Department label mapped; historical text was preserved.");
      void utils.institutionDepartmentReconciliation.getDepartmentReconciliationDashboard.invalidate({ institutionId });
    },
    onError: (error) => toast.error(error.message),
  });
  const addDepartmentMutation = trpc.institutionDepartmentReconciliation.addCanonicalDepartment.useMutation({
    onSuccess: (result) => {
      toast.success(result.created ? `${result.departmentName} added to the canonical department list.` : `${result.departmentName} was reactivated in the canonical department list.`);
      setNewDepartmentName("");
      setNewDepartmentCustomAcknowledged(false);
      setNewDepartmentReason("");
      void dashboardQuery.refetch();
      void utils.institution.getFacilityDepartments.invalidate({ institutionId });
    },
    onError: (error) => toast.error(error.message),
  });
  const statusMutation = trpc.institutionDepartmentReconciliation.updateReviewStatus.useMutation({
    onSuccess: () => {
      toast.success("Review status updated.");
      void utils.institutionDepartmentReconciliation.getDepartmentReconciliationDashboard.invalidate({ institutionId });
    },
    onError: (error) => toast.error(error.message),
  });
  const eligibilityMutation = trpc.institutionDepartmentReconciliation.setDepartmentPoleEligibility.useMutation({
    onSuccess: () => {
      toast.success("IERS pole eligibility updated.");
      void utils.institutionDepartmentReconciliation.getDepartmentReconciliationDashboard.invalidate({ institutionId });
      void utils.institutionDepartmentReconciliation.getIersMissingPoleAlerts.invalidate({ institutionId });
      void utils.institution.getFacilityDepartments.invalidate({ institutionId });
    },
    onError: (error) => toast.error(error.message),
  });
  const otherResolutionMutation = trpc.institutionDepartmentReconciliation.resolveOtherDepartmentRegistration.useMutation({
    onSuccess: async (result) => {
      toast.success(result.status === "resolved" ? "This CPD registration was linked to the selected canonical department." : "This registration review status was saved.");
      await utils.institutionDepartmentReconciliation.getOtherDepartmentRegistrations.invalidate({ institutionId, limit: 100, offset: 0 });
      await utils.institutionDepartmentReconciliation.getDepartmentReconciliationDashboard.invalidate({ institutionId });
    },
    onError: (error) => toast.error(error.message),
  });

  const activeDepartments = useMemo(
    () => (dashboardQuery.data?.departments ?? []).filter((department) => department.isActive && department.confirmedAt != null),
    [dashboardQuery.data?.departments],
  );
  const traceabilityRows = useMemo(() => (otherRegistrationsQuery.data?.rows ?? []).filter((row) => traceabilityFilter === "all" || (traceabilityFilter === "other" ? row.isOtherSubmission : !row.isOtherSubmission)), [otherRegistrationsQuery.data?.rows, traceabilityFilter]);

  if (dashboardQuery.isLoading) {
    return <Card><CardContent className="p-6 text-sm text-muted-foreground">Loading department reconciliation…</CardContent></Card>;
  }

  if (dashboardQuery.isError) {
    return <Card className="border-amber-500/30"><CardContent className="flex items-start gap-3 p-6 text-sm text-amber-900 dark:text-amber-200"><ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" /><p>{dashboardQuery.error.message}</p></CardContent></Card>;
  }

  const data = dashboardQuery.data;
  const reviewRows = data?.labels.filter((row) =>
    row.status === "open" ||
    row.status === "deferred" ||
    (row.status === "mapped" && row.currentlyUnmappedCount > 0)
  ) ?? [];

  const getDefaultTargetMode = (row: NonNullable<typeof data>["labels"][number]) =>
    row.reviewedFacilityDepartmentId != null ? "existing" : row.suggestedCatalogLabel ? "new" : "existing";
  const getDefaultTargetValue = (row: NonNullable<typeof data>["labels"][number]) =>
    row.reviewedFacilityDepartmentId != null ? String(row.reviewedFacilityDepartmentId) : row.suggestedCatalogLabel ?? "";

  const setSuggestedTarget = (normalizedLabel: string, label: string) => {
    setTargetMode((current) => ({ ...current, [normalizedLabel]: "new" }));
    setTargetValue((current) => ({ ...current, [normalizedLabel]: label }));
  };

  const mapLabel = (row: NonNullable<typeof data>["labels"][number]) => {
    const reason = reasons[row.normalizedLabel]?.trim();
    if (!reason || reason.length < 3) {
      toast.error("Add a short reason for this manual decision.");
      return;
    }
    const mode = targetMode[row.normalizedLabel] ?? getDefaultTargetMode(row);
    const value = targetValue[row.normalizedLabel] ?? getDefaultTargetValue(row);
    if (mode === "existing") {
      const targetId = Number(value);
      if (!Number.isInteger(targetId) || targetId <= 0) {
        toast.error("Choose an active confirmed local department.");
        return;
      }
      mapMutation.mutate({
        institutionId,
        normalizedLabel: row.normalizedLabel,
        targetFacilityDepartmentId: targetId,
        backfillUnlinkedAttendance: backfill[row.normalizedLabel] === true,
        reason,
      });
      return;
    }
    if (!value.trim()) {
      toast.error("Choose a catalog department or enter a genuine custom exception.");
      return;
    }
    const isCustom = !isPresetDepartment(value);
    if (isCustom && customAcknowledged[row.normalizedLabel] !== true) {
      toast.error("A genuine custom department needs explicit acknowledgement.");
      return;
    }
    mapMutation.mutate({
      institutionId,
      normalizedLabel: row.normalizedLabel,
      newDepartmentName: value.trim(),
      customExceptionAcknowledged: customAcknowledged[row.normalizedLabel] === true,
      backfillUnlinkedAttendance: backfill[row.normalizedLabel] === true,
      reason,
    });
  };

  const addCanonicalDepartment = () => {
    const departmentName = newDepartmentName.trim();
    const reason = newDepartmentReason.trim();
    if (departmentName.length < 2) {
      toast.error("Choose a department from the shared catalog or enter a genuine local exception.");
      return;
    }
    if (reason.length < 3) {
      toast.error("Add a short reason for adding this canonical department.");
      return;
    }
    if (!isPresetDepartment(departmentName) && !newDepartmentCustomAcknowledged) {
      toast.error("A custom department needs explicit acknowledgement that it is missing from the shared catalog.");
      return;
    }
    addDepartmentMutation.mutate({
      institutionId,
      departmentName,
      customExceptionAcknowledged: newDepartmentCustomAcknowledged,
      reason,
    });
  };

  const updateStatus = (row: NonNullable<typeof data>["labels"][number], status: "open" | "deferred" | "dismissed") => {
    const reason = reasons[row.normalizedLabel]?.trim();
    if (!reason || reason.length < 3) {
      toast.error("Add a short reason for this review status.");
      return;
    }
    statusMutation.mutate({ institutionId, normalizedLabel: row.normalizedLabel, status, reason });
  };

  const resolveOtherRegistration = (row: NonNullable<typeof otherRegistrationsQuery.data>["rows"][number], status: "resolved" | "deferred" | "dismissed" | "open") => {
    const reason = otherReasons[String(row.id)]?.trim();
    if (!reason || reason.length < 3) {
      toast.error("Add a short reason for this attendee decision.");
      return;
    }
    const targetValue = otherTargets[String(row.id)] ?? (row.resolutionTargetDepartmentId ? String(row.resolutionTargetDepartmentId) : "");
    const targetFacilityDepartmentId = targetValue ? Number(targetValue) : null;
    if (status === "resolved" && (targetFacilityDepartmentId == null || !Number.isInteger(targetFacilityDepartmentId) || targetFacilityDepartmentId <= 0)) {
      toast.error("Choose the canonical department for this individual registration.");
      return;
    }
    otherResolutionMutation.mutate({ institutionId, cpdAttendeeId: row.id, targetFacilityDepartmentId, status, reason });
  };

  return (
    <div className="space-y-6">
      <Card className="min-w-0 border-primary/20">
        <CardHeader className="space-y-3">
          <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <CardTitle className="flex min-w-0 items-start gap-2 break-words text-base sm:text-lg"><ClipboardCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />Department reconciliation</CardTitle>
              <CardDescription className="mt-1 break-words">Review CPD department labels that were recorded without a canonical local department. This never overwrites the original CPD reporting text.</CardDescription>
            </div>
            <Button variant="outline" size="sm" className="w-full shrink-0 sm:w-auto" onClick={() => void dashboardQuery.refetch()}><RefreshCw className="mr-2 h-4 w-4" />Refresh</Button>
          </div>
          <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-3 text-sm text-muted-foreground">
            <p><strong className="text-foreground">Important distinction:</strong> a department can be valid for CPD reporting without needing an IERS pole. Pharmacy and similar CPD-only departments should stay unassigned unless an account administrator explicitly marks them as operational for IERS.</p>
          </div>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border bg-muted/20 p-3"><p className="text-xs text-muted-foreground">Labels needing review or completion</p><p className="mt-1 text-2xl font-semibold">{data?.summary.labelsRequiringReview ?? 0}</p></div>
          <div className="rounded-lg border bg-muted/20 p-3"><p className="text-xs text-muted-foreground">Unlinked CPD rows</p><p className="mt-1 text-2xl font-semibold">{data?.summary.unresolvedAttendanceRows ?? 0}</p></div>
          <div className="rounded-lg border bg-muted/20 p-3"><p className="text-xs text-muted-foreground">Eligible departments without pole</p><p className="mt-1 text-2xl font-semibold">{data?.summary.operationalDepartmentsMissingPole ?? 0}</p></div>
        </CardContent>
      </Card>

      <Card className="min-w-0 border-emerald-500/30">
        <CardHeader>
          <CardTitle className="flex items-start gap-2 text-base sm:text-lg"><PlusCircle className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />Add a canonical institution department</CardTitle>
          <CardDescription>Add a missing local department once. It will appear in future CPD registration and staff/profile department selection. New departments start as CPD/reporting-only; IERS pole eligibility is a separate explicit decision below.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <DepartmentSelectors value={newDepartmentName} onChange={setNewDepartmentName} labelSize="xs" />
          {newDepartmentName.trim() && !isPresetDepartment(newDepartmentName) && (
            <label className="flex min-w-0 items-start gap-2 text-xs text-muted-foreground"><input type="checkbox" checked={newDepartmentCustomAcknowledged} onChange={(event) => setNewDepartmentCustomAcknowledged(event.target.checked)} className="mt-0.5" />This is a genuine local department missing from the shared CPD/profile catalog, not a spelling variation.</label>
          )}
          <Input value={newDepartmentReason} onChange={(event) => setNewDepartmentReason(event.target.value)} placeholder="Why is this department being added?" maxLength={1000} />
          <Button className="w-full sm:w-auto" onClick={addCanonicalDepartment} disabled={addDepartmentMutation.isPending}><PlusCircle className="mr-2 h-4 w-4" />{addDepartmentMutation.isPending ? "Adding…" : "Add department"}</Button>
          <p className="text-xs text-muted-foreground">This action does not rewrite historic CPD labels. Use the reconciliation cards below when you want to link those older rows to the new canonical identity.</p>
          <div className="rounded-md border border-blue-500/20 bg-blue-500/5 p-3 text-sm">
            <p className="font-medium">Need to rename or review the full local structure?</p>
            <p className="mt-1 text-xs text-muted-foreground">Use the Readiness department setup editor to rename existing local rows, add another department, and separately decide which departments require an IERS pole. Surgery → Theatre is available from the shared catalog.</p>
            <Button asChild variant="outline" size="sm" className="mt-3 w-full sm:w-auto"><a href="/institution?section=iers&iersTab=command">Open department structure editor</a></Button>
          </div>
        </CardContent>
      </Card>

      <Card className="min-w-0 border-indigo-500/30">
        <CardHeader>
          <CardTitle className="flex items-start gap-2 text-base sm:text-lg"><Users className="mt-0.5 h-5 w-5 shrink-0 text-indigo-700" />CPD department traceability</CardTitle>
          <CardDescription>Review the two queues separately: literal <strong>Other</strong> submissions are resolved per attendee, while unresolved custom labels are reviewed as label patterns. A literal Other row must never be merged with another person’s Other row automatically.</CardDescription>
        </CardHeader>
                  <CardContent>
          {!otherRegistrationsQuery.isLoading && !otherRegistrationsQuery.isError && (otherRegistrationsQuery.data?.rows.length ?? 0) > 0 && <div className="mb-4 flex flex-wrap gap-2" role="tablist" aria-label="CPD department traceability queues">
            <Button type="button" size="sm" variant={traceabilityFilter === "all" ? "default" : "outline"} onClick={() => setTraceabilityFilter("all")}>All ({otherRegistrationsQuery.data?.total ?? 0})</Button>
            <Button type="button" size="sm" variant={traceabilityFilter === "other" ? "default" : "outline"} onClick={() => setTraceabilityFilter("other")}>Literal Other ({otherRegistrationsQuery.data?.rows.filter((row) => row.isOtherSubmission).length ?? 0})</Button>
            <Button type="button" size="sm" variant={traceabilityFilter === "custom" ? "default" : "outline"} onClick={() => setTraceabilityFilter("custom")}>Unresolved custom labels ({otherRegistrationsQuery.data?.rows.filter((row) => !row.isOtherSubmission).length ?? 0})</Button>
          </div>}
          {otherRegistrationsQuery.isLoading ? <p className="text-sm text-muted-foreground">Loading registration details…</p> : otherRegistrationsQuery.isError ? <p className="text-sm text-amber-800 dark:text-amber-200">{otherRegistrationsQuery.error.message}</p> : otherRegistrationsQuery.data?.rows.length === 0 ? <div className="rounded-lg border border-dashed p-5 text-center text-sm text-muted-foreground"><CheckCircle2 className="mx-auto mb-2 h-5 w-5 text-emerald-600" />No currently unlinked CPD registrations were found.</div> : (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">Showing {traceabilityRows.length} of {otherRegistrationsQuery.data?.total ?? 0} registration(s) in the selected queue.</p>
              <div className="space-y-2">
                {traceabilityRows.length === 0 ? <div className="rounded-lg border border-dashed p-5 text-center text-sm text-muted-foreground">No registrations match this queue.</div> : traceabilityRows.map((row) => (
                  <div key={row.id} className="rounded-lg border bg-background p-3 text-sm">
                    <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0"><p className="break-words font-semibold">{row.fullName}</p><p className="mt-1 break-words text-xs text-muted-foreground">Recorded department: <span className="font-medium text-foreground">{row.department}</span></p></div>
                      <div className="flex max-w-full flex-wrap justify-end gap-1"><Badge variant={row.mappingStatus === "linked" ? "default" : row.attendanceType === "primary_facility" ? "secondary" : "outline"}>{row.mappingStatus === "linked" ? `Linked: ${row.canonicalDepartmentName}` : row.isOtherSubmission ? "Entered as Other" : "Needs review"}</Badge>{row.resolutionStatus !== "open" && <Badge variant={row.resolutionStatus === "resolved" ? "default" : "secondary"}>{row.resolutionStatus}{row.resolutionStatus === "resolved" && row.canonicalDepartmentName ? `: ${row.canonicalDepartmentName}` : ""}</Badge>}</div>
                    </div>
                    <div className="mt-2 grid gap-1 text-xs text-muted-foreground sm:grid-cols-2">
                      <span className="flex min-w-0 items-center gap-1 break-all"><Mail className="h-3.5 w-3.5 shrink-0" />{row.email}</span>
                      <span className="flex min-w-0 items-center gap-1 break-all"><Phone className="h-3.5 w-3.5 shrink-0" />{row.phone}</span>
                      <span>Cadre: {row.cadreOther ? `${row.cadre} · ${row.cadreOther}` : row.cadre}</span>
                      <span>Registered: {formatDate(row.submittedAt)}</span>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">Session: {row.eventName ?? "Unknown session"}{row.eventDate ? ` · ${row.eventDate}` : ""} · Attendance: {row.attendanceType.replaceAll("_", " ")}</p>
                    {row.rosterMatch && <p className="mt-2 rounded-md bg-blue-500/5 p-2 text-xs text-blue-900 dark:text-blue-100">Roster match: <strong>{row.rosterStaffName}</strong>{row.rosterStaffRole ? ` · ${row.rosterStaffRole}` : ""}{row.rosterDepartment ? ` · recorded roster department: ${row.rosterDepartment}` : ""}{row.rosterLinkStatus ? ` · ${row.rosterLinkStatus}` : ""}</p>}
                    <div className="mt-3 rounded-md border border-indigo-500/20 bg-indigo-500/5 p-3">
                      <p className="text-xs font-semibold text-foreground">Resolve this registration individually</p>
                      <p className="mt-1 text-xs text-muted-foreground">`Other` is not a department. Different people may belong to different departments, so do not merge all `Other` rows together.</p>
                      <div className="mt-2 grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                        <select value={otherTargets[String(row.id)] ?? (row.resolutionTargetDepartmentId ? String(row.resolutionTargetDepartmentId) : "")} onChange={(event) => setOtherTargets((current) => ({ ...current, [String(row.id)]: event.target.value }))} className="h-10 min-w-0 rounded-md border border-input bg-background px-3 py-2 text-sm">
                          <option value="">Leave unresolved for now</option>
                          {activeDepartments.map((department) => <option key={department.id} value={String(department.id)}>{department.departmentName}</option>)}
                        </select>
                        <Input value={otherReasons[String(row.id)] ?? ""} onChange={(event) => setOtherReasons((current) => ({ ...current, [String(row.id)]: event.target.value }))} placeholder="Reason for this person’s department decision" maxLength={1000} />
                      </div>
                      <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                        <Button size="sm" className="w-full sm:w-auto" onClick={() => resolveOtherRegistration(row, "resolved")} disabled={otherResolutionMutation.isPending}>Link to selected department</Button>
                        <Button size="sm" variant="outline" className="w-full sm:w-auto" onClick={() => resolveOtherRegistration(row, "deferred")} disabled={otherResolutionMutation.isPending}>Defer</Button>
                        <Button size="sm" variant="ghost" className="w-full sm:w-auto" onClick={() => resolveOtherRegistration(row, "dismissed")} disabled={otherResolutionMutation.isPending}>Dismiss</Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="min-w-0">
                  <CardHeader><CardTitle className="text-base sm:text-lg">CPD labels created outside the shared catalog</CardTitle><CardDescription>Choose the target explicitly. “Backfill identity only” updates nullable canonical links for matching rows; names, dates, certificates, and raw department text remain unchanged. A previously mapped label with unlinked rows stays here until you complete that optional backfill.</CardDescription></CardHeader>

        <CardContent className="space-y-4">
          {reviewRows.length === 0 ? (
            <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground"><CheckCircle2 className="mx-auto mb-2 h-6 w-6 text-emerald-600" />No open department-label issues were found.</div>
          ) : reviewRows.map((row) => {
            const mode = targetMode[row.normalizedLabel] ?? getDefaultTargetMode(row);
            const value = targetValue[row.normalizedLabel] ?? getDefaultTargetValue(row);
            const selectedIsCustom = mode === "new" && value.trim().length > 0 && !isPresetDepartment(value);
            return (
              <div key={row.normalizedLabel} className="min-w-0 rounded-xl border bg-card p-4 shadow-sm">
                <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2"><p className="break-words font-semibold">“{row.rawLabel}”</p><Badge variant={row.status === "deferred" ? "secondary" : row.status === "mapped" ? "default" : "outline"}>{row.status === "mapped" ? "mapped · backfill pending" : row.status}</Badge></div>
                    <p className="mt-1 text-xs text-muted-foreground">{row.attendanceCount} historical CPD attendance record(s) · {row.currentlyUnmappedCount} currently unlinked · last used {formatDate(row.lastUsedAt)}</p>
                    {row.reviewedFacilityDepartmentName && <p className="mt-1 text-xs text-emerald-700 dark:text-emerald-300">Previously reviewed to: {row.reviewedFacilityDepartmentName}</p>}
                  </div>
                  <Badge variant={row.suggestionConfidence === "exact" || row.suggestionConfidence === "alias" ? "default" : "secondary"}>{row.suggestionConfidence === "none" ? "No safe suggestion" : `${row.suggestionConfidence} suggestion`}</Badge>
                </div>

                {row.suggestedCatalogLabel && <p className="mt-3 rounded-md bg-emerald-500/10 p-2 text-xs text-emerald-800 dark:text-emerald-200">Safe catalog suggestion: <strong>{row.suggestedCatalogLabel}</strong>. It still requires your manual confirmation.</p>}
                {row.candidateCatalogLabels.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2"><span className="text-xs text-muted-foreground">Manual catalog options:</span>{row.candidateCatalogLabels.map((label) => <Button key={label} type="button" size="sm" variant="outline" className="h-auto whitespace-normal px-2 py-1 text-xs" onClick={() => setSuggestedTarget(row.normalizedLabel, label)}>{label}</Button>)}</div>
                )}

                <div className="mt-4 grid gap-3">
                  <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                    <select value={mode} onChange={(event) => setTargetMode((current) => ({ ...current, [row.normalizedLabel]: event.target.value }))} className="h-10 min-w-0 rounded-md border border-input bg-background px-3 py-2 text-sm">
                      <option value="existing">Use an existing local department</option>
                      <option value="new">Create/select from shared catalog</option>
                    </select>
                    {mode === "existing" ? (
                      <select value={value} onChange={(event) => setTargetValue((current) => ({ ...current, [row.normalizedLabel]: event.target.value }))} className="h-10 min-w-0 rounded-md border border-input bg-background px-3 py-2 text-sm">
                        <option value="">Choose active confirmed department</option>
                        {activeDepartments.map((department) => <option key={department.id} value={String(department.id)}>{department.departmentName}</option>)}
                      </select>
                    ) : <DepartmentSelectors value={value} onChange={(nextValue) => setTargetValue((current) => ({ ...current, [row.normalizedLabel]: nextValue }))} labelSize="xs" className="min-w-0" />}
                  </div>
                  {selectedIsCustom && <label className="flex min-w-0 items-start gap-2 text-xs text-muted-foreground"><input type="checkbox" checked={customAcknowledged[row.normalizedLabel] === true} onChange={(event) => setCustomAcknowledged((current) => ({ ...current, [row.normalizedLabel]: event.target.checked }))} className="mt-0.5" />This is a genuine department missing from the shared CPD/profile catalog, not a spelling variation.</label>}
                  <label className="flex min-w-0 items-start gap-2 text-xs text-muted-foreground"><input type="checkbox" checked={backfill[row.normalizedLabel] === true} onChange={(event) => setBackfill((current) => ({ ...current, [row.normalizedLabel]: event.target.checked }))} className="mt-0.5" />Backfill canonical identity for currently unlinked attendance rows. Keep the original department text for historical reporting. This is required for the CPD dashboards to group these rows under the canonical department.</label>
                  <Input value={reasons[row.normalizedLabel] ?? ""} onChange={(event) => setReasons((current) => ({ ...current, [row.normalizedLabel]: event.target.value }))} placeholder="Reason for this review decision" maxLength={1000} />
                  <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                    <Button className="w-full sm:w-auto" onClick={() => mapLabel(row)} disabled={mapMutation.isPending}><CheckCircle2 className="mr-2 h-4 w-4" />Map label</Button>
                    <Button variant="outline" className="w-full sm:w-auto" onClick={() => updateStatus(row, "deferred")} disabled={statusMutation.isPending}>Defer</Button>
                    <Button variant="ghost" className="w-full sm:w-auto" onClick={() => updateStatus(row, "dismissed")} disabled={statusMutation.isPending}>Dismiss review</Button>
                    {row.status !== "open" && <Button variant="ghost" className="w-full sm:w-auto" onClick={() => updateStatus(row, "open")} disabled={statusMutation.isPending}>Reopen</Button>}
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card className="min-w-0 border-amber-500/30">
        <CardHeader><CardTitle className="flex items-start gap-2 text-base sm:text-lg"><AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />IERS operational eligibility</CardTitle><CardDescription>Only confirmed active departments explicitly marked as requiring a pole can alert the IERS Lead. This is separate from CPD validity.</CardDescription></CardHeader>
        <CardContent className="space-y-3">
          {(data?.departments ?? []).map((department) => (
            <div key={department.id} className="flex min-w-0 flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="break-words text-sm font-semibold">{department.departmentName}</p><Badge variant={department.departmentSource === "preset" ? "default" : "outline"}>{department.departmentSource === "preset" ? "Preset catalog" : "Custom exception"}</Badge></div><p className="mt-1 text-xs text-muted-foreground">{department.poleId ? "Pole allocated" : "No pole allocated"} · {department.confirmedAt ? "Confirmed" : "Not confirmed"}</p></div>
              <Button size="sm" variant={department.requiresPole ? "default" : "outline"} className="w-full shrink-0 sm:w-auto" disabled={!department.isActive || !department.confirmedAt || eligibilityMutation.isPending} onClick={() => eligibilityMutation.mutate({ institutionId, departmentId: department.id, requiresPole: !department.requiresPole, reason: `${!department.requiresPole ? "Enabled" : "Disabled"} IERS pole requirement during Administration review.` })}>{department.requiresPole ? "Pole required" : "CPD/reporting only"}</Button>
            </div>
          ))}
          {(data?.departments ?? []).length === 0 && <p className="text-sm text-muted-foreground">Confirm the institution’s local department list before setting IERS operational eligibility.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
