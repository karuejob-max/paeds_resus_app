import { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, ClipboardCheck, RefreshCw, ShieldAlert } from "lucide-react";
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

  const dashboardQuery = trpc.institutionDepartmentReconciliation.getDepartmentReconciliationDashboard.useQuery({ institutionId });
  const mapMutation = trpc.institutionDepartmentReconciliation.mapDepartmentLabel.useMutation({
    onSuccess: (result) => {
      toast.success(result.backfilledCount > 0 ? `Mapped and linked ${result.backfilledCount} CPD record(s).` : "Department label mapped; historical text was preserved.");
      void utils.institutionDepartmentReconciliation.getDepartmentReconciliationDashboard.invalidate({ institutionId });
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

  const activeDepartments = useMemo(
    () => (dashboardQuery.data?.departments ?? []).filter((department) => department.isActive && department.confirmedAt != null),
    [dashboardQuery.data?.departments],
  );

  if (dashboardQuery.isLoading) {
    return <Card><CardContent className="p-6 text-sm text-muted-foreground">Loading department reconciliation…</CardContent></Card>;
  }

  if (dashboardQuery.isError) {
    return <Card className="border-amber-500/30"><CardContent className="flex items-start gap-3 p-6 text-sm text-amber-900 dark:text-amber-200"><ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" /><p>{dashboardQuery.error.message}</p></CardContent></Card>;
  }

  const data = dashboardQuery.data;
  const reviewRows = data?.labels.filter((row) => row.status === "open" || row.status === "deferred") ?? [];

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
    const mode = targetMode[row.normalizedLabel] ?? (row.suggestedCatalogLabel ? "new" : "existing");
    const value = targetValue[row.normalizedLabel] ?? row.suggestedCatalogLabel ?? "";
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

  const updateStatus = (row: NonNullable<typeof data>["labels"][number], status: "open" | "deferred" | "dismissed") => {
    const reason = reasons[row.normalizedLabel]?.trim();
    if (!reason || reason.length < 3) {
      toast.error("Add a short reason for this review status.");
      return;
    }
    statusMutation.mutate({ institutionId, normalizedLabel: row.normalizedLabel, status, reason });
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
          <div className="rounded-lg border bg-muted/20 p-3"><p className="text-xs text-muted-foreground">Labels needing review</p><p className="mt-1 text-2xl font-semibold">{data?.summary.labelsRequiringReview ?? 0}</p></div>
          <div className="rounded-lg border bg-muted/20 p-3"><p className="text-xs text-muted-foreground">Unlinked CPD rows</p><p className="mt-1 text-2xl font-semibold">{data?.summary.unresolvedAttendanceRows ?? 0}</p></div>
          <div className="rounded-lg border bg-muted/20 p-3"><p className="text-xs text-muted-foreground">Eligible departments without pole</p><p className="mt-1 text-2xl font-semibold">{data?.summary.operationalDepartmentsMissingPole ?? 0}</p></div>
        </CardContent>
      </Card>

      <Card className="min-w-0">
        <CardHeader><CardTitle className="text-base sm:text-lg">CPD labels created outside the shared catalog</CardTitle><CardDescription>Choose the target explicitly. “Backfill identity only” updates nullable canonical links for matching rows; names, dates, certificates, and raw department text remain unchanged.</CardDescription></CardHeader>
        <CardContent className="space-y-4">
          {reviewRows.length === 0 ? (
            <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground"><CheckCircle2 className="mx-auto mb-2 h-6 w-6 text-emerald-600" />No open department-label issues were found.</div>
          ) : reviewRows.map((row) => {
            const mode = targetMode[row.normalizedLabel] ?? (row.suggestedCatalogLabel ? "new" : "existing");
            const value = targetValue[row.normalizedLabel] ?? row.suggestedCatalogLabel ?? "";
            const selectedIsCustom = mode === "new" && value.trim().length > 0 && !isPresetDepartment(value);
            return (
              <div key={row.normalizedLabel} className="min-w-0 rounded-xl border bg-card p-4 shadow-sm">
                <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2"><p className="break-words font-semibold">“{row.rawLabel}”</p><Badge variant={row.status === "deferred" ? "secondary" : "outline"}>{row.status}</Badge></div>
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
                  <label className="flex min-w-0 items-start gap-2 text-xs text-muted-foreground"><input type="checkbox" checked={backfill[row.normalizedLabel] === true} onChange={(event) => setBackfill((current) => ({ ...current, [row.normalizedLabel]: event.target.checked }))} className="mt-0.5" />Backfill canonical identity for currently unlinked attendance rows. Keep the original department text for historical reporting.</label>
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
