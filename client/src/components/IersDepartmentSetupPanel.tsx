import { useEffect, useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { CheckCircle2, ClipboardList, Shield, Plus, ArrowDown, ArrowUp } from "lucide-react";
import { toast } from "sonner";
import { DepartmentSelectors } from "@/components/DepartmentSelectors";

export function IersDepartmentSetupPanel({ institutionId }: { institutionId: number }) {
  const utils = trpc.useUtils();
  const [selectedPoleId, setSelectedPoleId] = useState<string>("");
  const [draftNames, setDraftNames] = useState<Record<number, string>>({});
  const [newDepartmentName, setNewDepartmentName] = useState("");
  const [departmentPoleSelections, setDepartmentPoleSelections] = useState<Record<number, string>>({});
  const [newPoleName, setNewPoleName] = useState("");
  const [showNewPoleForm, setShowNewPoleForm] = useState(false);

  const { data: departments, isLoading: departmentsLoading } = trpc.institution.getFacilityDepartments.useQuery({ institutionId });
  const { data: poles } = trpc.institution.getFacilityPoles.useQuery({ institutionId });
  const missingPoleAlertsQuery = trpc.institutionDepartmentReconciliation.getIersMissingPoleAlerts.useQuery({ institutionId });
  const poleList = poles ?? [];
  const activePoleId = selectedPoleId ? Number(selectedPoleId) : poleList[0]?.id;

  useEffect(() => {
    if (!departments) return;
    setDraftNames(Object.fromEntries(departments.map((department) => [department.id, department.departmentName])));
    setDepartmentPoleSelections(Object.fromEntries(departments.map((department) => [department.id, department.poleId == null ? "" : String(department.poleId)])));
  }, [departments]);

  const eligibleDepartments = useMemo(
    () => departments?.filter((department) => department.isActive && department.confirmedAt != null && department.requiresPole) ?? [],
    [departments],
  );
  const unassignedCount = useMemo(() => eligibleDepartments.filter((department) => department.poleId == null).length, [eligibleDepartments]);

  const createPoleMutation = trpc.institution.createFacilityPole.useMutation({
    onSuccess: (result) => {
      toast.success("Facility pole created.");
      setNewPoleName("");
      setShowNewPoleForm(false);
      setSelectedPoleId(String(result.poleId));
      void utils.institution.getFacilityPoles.invalidate({ institutionId });
    },
    onError: (error) => toast.error(error.message || "Could not create the facility pole."),
  });
  const reorderPolesMutation = trpc.institution.reorderFacilityPoles.useMutation({
    onSuccess: async () => {
      toast.success("Pole order updated.");
      await utils.institution.getFacilityPoles.invalidate({ institutionId });
    },
    onError: (error) => toast.error(error.message || "Could not update pole order."),
  });

  const confirmMutation = trpc.institution.confirmFacilityDepartments.useMutation({
    onSuccess: (result) => {
      toast.success(`${result.confirmedCount} canonical department(s) confirmed.`);
      void utils.institution.getFacilityDepartments.invalidate({ institutionId });
    },
    onError: (error) => toast.error(error.message),
  });
  const assignAllMutation = trpc.institution.assignAllUnassignedDepartmentsToPole.useMutation({
    onSuccess: (result) => {
      toast.success(`${result.assignedCount} department(s) assigned to the selected pole.`);
      void utils.institution.getFacilityDepartments.invalidate({ institutionId });
      void utils.institutionDepartmentReconciliation.getIersMissingPoleAlerts.invalidate({ institutionId });
    },
    onError: (error) => toast.error(error.message),
  });
  const assignDepartmentMutation = trpc.institution.assignDepartmentToPole.useMutation({
    onSuccess: () => {
      toast.success("Department pole assignment updated.");
      void utils.institution.getFacilityDepartments.invalidate({ institutionId });
      void utils.institutionDepartmentReconciliation.getIersMissingPoleAlerts.invalidate({ institutionId });
    },
    onError: (error) => toast.error(error.message),
  });

  const saveDepartmentList = () => {
    const existing = (departments ?? []).map((department) => ({
      departmentId: department.id,
      departmentName: (draftNames[department.id] ?? department.departmentName).trim(),
    }));
    const newName = newDepartmentName.trim();
    const departmentsToSave = newName ? [...existing, { departmentName: newName }] : existing;
    if (departmentsToSave.some((department) => department.departmentName.length < 2)) {
      toast.error("Every department needs at least two characters.");
      return;
    }
    confirmMutation.mutate({ institutionId, departments: departmentsToSave });
    setNewDepartmentName("");
  };

  if (departmentsLoading) return <Card><CardContent className="p-6 text-sm text-muted-foreground">Loading canonical department setup…</CardContent></Card>;

  return (
    <Card className="min-w-0 border-primary/20">
      <CardHeader className="space-y-3">
        <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <CardTitle className="flex min-w-0 items-start gap-2 break-words text-base sm:text-lg"><ClipboardList className="mt-0.5 h-5 w-5 shrink-0 text-primary" />Department and rota setup</CardTitle>
            <CardDescription className="mt-1 break-words">The institutional admin confirms the canonical department list. The IERS Lead assigns poles. Linked providers with that department become the safe source for monthly UTL shifts.</CardDescription>
          </div>
          <Badge variant={unassignedCount === 0 && (departments?.length ?? 0) > 0 ? "default" : "secondary"} className="w-fit shrink-0 whitespace-normal">{unassignedCount === 0 && (departments?.length ?? 0) > 0 ? "Setup mapped" : `${unassignedCount} department(s) need a pole`}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {(missingPoleAlertsQuery.data ?? []).length > 0 && (
          <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-900 dark:text-amber-200">
            <p className="font-semibold">IERS Lead action required: unallocated operational departments</p>
            <p className="mt-1 text-xs">These alerts appear only because an account administrator explicitly marked the department as requiring an IERS pole. CPD-only departments such as Pharmacy are excluded.</p>
            <div className="mt-3 space-y-2">{missingPoleAlertsQuery.data?.map((alert) => <div key={alert.id} className="flex min-w-0 flex-col gap-2 rounded border bg-background/70 p-2 sm:flex-row sm:items-center sm:justify-between"><span className="break-words font-medium">{alert.departmentName}</span><Badge variant="destructive" className="w-fit">Pole not allocated</Badge></div>)}</div>
          </div>
        )}
        <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-3 text-xs text-muted-foreground"><strong className="text-foreground">CPD and IERS are separate decisions:</strong> valid CPD departments remain reportable even when they are not part of an IERS pole.</div>
        <div className="rounded-lg border bg-muted/20 p-3 text-sm">
          <p className="font-semibold">Step 1 — Confirm or update departments</p>
          <p className="mt-1 text-muted-foreground">Use the same preset department catalog used by profiles and CPD Portal. Choose Other only when a genuine facility department is missing from the catalog; renaming an existing row keeps its canonical identity.</p>
          <div className="mt-3 space-y-2">
            {(departments ?? []).map((department) => (
              <div key={department.id} className="min-w-0 rounded-md border bg-background/70 p-3">
                <div className="mb-2 flex min-w-0 flex-wrap items-center justify-between gap-2">
                  <span className="break-words text-xs font-medium text-muted-foreground">Current identity: {department.departmentName}</span>
                  <Badge variant={department.departmentSource === "preset" ? "default" : "outline"}>{department.departmentSource === "preset" ? "Preset catalog" : "Custom exception"}</Badge>
                </div>
                <DepartmentSelectors value={draftNames[department.id] ?? department.departmentName} onChange={(value) => setDraftNames((current) => ({ ...current, [department.id]: value }))} className="min-w-0" labelSize="xs" />
              </div>
            ))}
            <div className="min-w-0 rounded-md border border-dashed bg-background/50 p-3">
              <p className="mb-2 text-xs font-medium text-muted-foreground">Add department from the shared preset catalog or choose Other for a genuine custom exception.</p>
              <div className="flex min-w-0 flex-col gap-2 sm:flex-row">
                <DepartmentSelectors value={newDepartmentName} onChange={setNewDepartmentName} className="min-w-0 flex-1" labelSize="xs" />
                <Button className="w-full shrink-0 sm:w-auto" onClick={saveDepartmentList} disabled={confirmMutation.isPending || !(departments?.length || newDepartmentName.trim())}> <CheckCircle2 className="mr-2 h-4 w-4" />Confirm department list</Button>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-muted/20 p-3 text-sm">
          <p className="font-semibold">Departments & poles — create, order, and assign coverage</p>
          <p className="mt-1 text-muted-foreground">Create the facility zones or response poles first, then assign each eligible department to the pole that owns its response coverage. The order controls navigation only; it does not change the weekly rotation rule.</p>
          <div className="mt-3 flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
            {showNewPoleForm ? (
              <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
                <Input value={newPoleName} onChange={(event) => setNewPoleName(event.target.value)} placeholder="Pole name, e.g. East Wing" className="w-full min-w-0 sm:w-56" autoFocus />
                <Button className="w-full sm:w-auto" size="sm" disabled={!newPoleName.trim() || createPoleMutation.isPending} onClick={() => createPoleMutation.mutate({ institutionId, poleName: newPoleName.trim() })}>Save pole</Button>
                <Button className="w-full sm:w-auto" size="sm" variant="ghost" onClick={() => setShowNewPoleForm(false)}>Cancel</Button>
              </div>
            ) : <Button size="sm" variant="outline" className="w-full gap-1.5 sm:w-auto" onClick={() => setShowNewPoleForm(true)}><Plus className="h-3.5 w-3.5" />New pole</Button>}
            <span className="text-xs text-muted-foreground">{(poles ?? []).length} pole(s)</span>
          </div>
          {(poles ?? []).length > 0 ? <div className="mt-3 space-y-2">
            {(poles ?? []).map((pole, index) => <div key={pole.id} className="flex min-w-0 flex-col gap-2 rounded-md border bg-background/70 p-2 sm:flex-row sm:items-center sm:justify-between"><span className="break-words text-sm font-medium">{index + 1}. {pole.poleName}</span><div className="flex shrink-0 gap-1"><Button type="button" variant="ghost" size="icon" className="h-8 w-8" aria-label={`Move ${pole.poleName} up`} disabled={index === 0 || reorderPolesMutation.isPending} onClick={() => { const poleIds = poleList.map((item) => item.id); [poleIds[index - 1], poleIds[index]] = [poleIds[index], poleIds[index - 1]]; reorderPolesMutation.mutate({ institutionId, poleIds }); }}><ArrowUp className="h-3.5 w-3.5" /></Button><Button type="button" variant="ghost" size="icon" className="h-8 w-8" aria-label={`Move ${pole.poleName} down`} disabled={index === poleList.length - 1 || reorderPolesMutation.isPending} onClick={() => { const poleIds = poleList.map((item) => item.id); [poleIds[index], poleIds[index + 1]] = [poleIds[index + 1], poleIds[index]]; reorderPolesMutation.mutate({ institutionId, poleIds }); }}><ArrowDown className="h-3.5 w-3.5" /></Button></div></div>)}
          </div> : <p className="mt-3 rounded-md border border-dashed p-3 text-xs text-muted-foreground">No response poles exist yet. Create the first pole here before assigning departments.</p>}
        </div>

        <div className="rounded-lg border bg-muted/20 p-3 text-sm">
          <p className="font-semibold">Assign departments to poles</p>
          <p className="mt-1 text-muted-foreground">Assigning a pole makes a confirmed department explicitly marked as IERS operational available in that pole’s weekly ERTL rotation and monthly UTL automation.</p>
          <div className="mt-3 flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
            <Select value={selectedPoleId || (poles?.[0]?.id ? String(poles[0].id) : undefined)} onValueChange={setSelectedPoleId}>
              <SelectTrigger className="w-full min-w-0 sm:w-64"><SelectValue placeholder="Select a pole" /></SelectTrigger>
              <SelectContent>{(poles ?? []).map((pole) => <SelectItem key={pole.id} value={String(pole.id)}><span className="flex items-center gap-2"><Shield className="h-3.5 w-3.5" />{pole.poleName}</span></SelectItem>)}</SelectContent>
            </Select>
            <Button variant="outline" className="w-full sm:w-auto" onClick={() => activePoleId && assignAllMutation.mutate({ institutionId, poleId: activePoleId })} disabled={!activePoleId || unassignedCount === 0 || assignAllMutation.isPending}>Assign all eligible unassigned</Button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Departments already mapped to another pole are not moved by the batch action. Departments marked CPD/reporting only are deliberately excluded.</p>
          {poles?.length === 0 && <p className="mt-3 rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-800 dark:text-amber-200">No response poles exist for this institution yet. Create a pole from the 24/7 ERT roster controls, then return here to assign eligible departments.</p>}
          {eligibleDepartments.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-xs font-semibold text-muted-foreground">Assign or move departments individually</p>
              {eligibleDepartments.map((department) => {
                const currentPoleId = department.poleId == null ? "" : String(department.poleId);
                const targetPoleId = departmentPoleSelections[department.id] ?? currentPoleId;
                return (
                  <div key={department.id} className="flex min-w-0 flex-col gap-2 rounded-md border bg-background/70 p-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0"><p className="break-words text-sm font-medium">{department.departmentName}</p><p className="text-xs text-muted-foreground">{currentPoleId ? `Current pole: ${poles?.find((pole) => String(pole.id) === currentPoleId)?.poleName ?? "Allocated"}` : "No pole allocated"}</p></div>
                    <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
                      <Select value={targetPoleId || undefined} onValueChange={(value) => setDepartmentPoleSelections((current) => ({ ...current, [department.id]: value }))}>
                        <SelectTrigger className="w-full min-w-0 sm:w-52"><SelectValue placeholder="Select pole" /></SelectTrigger>
                        <SelectContent>{(poles ?? []).map((pole) => <SelectItem key={pole.id} value={String(pole.id)}><span className="flex items-center gap-2"><Shield className="h-3.5 w-3.5" />{pole.poleName}</span></SelectItem>)}</SelectContent>
                      </Select>
                      <Button className="w-full shrink-0 sm:w-auto" size="sm" disabled={!targetPoleId || targetPoleId === currentPoleId || assignDepartmentMutation.isPending} onClick={() => assignDepartmentMutation.mutate({ institutionId, departmentName: department.departmentName, poleId: Number(targetPoleId) })}>{currentPoleId ? "Move department" : "Assign department"}</Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {eligibleDepartments.length === 0 && <p className="mt-3 rounded-md border border-dashed p-3 text-xs text-muted-foreground">No confirmed active departments are marked as IERS operational yet. If a CPD label is missing here, reconcile it or add it to the confirmed local department list in Administration first.</p>}
        </div>

        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm">
          <p className="font-semibold text-amber-800 dark:text-amber-300">Handoff — ERCo prepares the UTL rota</p>
          <p className="mt-1 text-amber-700 dark:text-amber-400">Pole allocation does not decide who will work. The accepted ERCo for each department opens the Shift roster section below, chooses the nurse for the month if useful, and then confirms the actual nurse for each morning, evening, or night shift.</p>
          <p className="mt-2 text-xs text-amber-700 dark:text-amber-400">All departments assigned to the selected pole are carried into the Shift roster section, including departments that do not yet have a linked nurse. No provider is selected automatically, and every named provider must accept the dated duty in the provider portal.</p>
        </div>
      </CardContent>
    </Card>
  );
}
