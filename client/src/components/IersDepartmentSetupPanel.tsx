import { useEffect, useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2, ClipboardList, RefreshCw, Shield, Users } from "lucide-react";
import { toast } from "sonner";

function getCurrentMonthStart() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString().slice(0, 10);
}

export function IersDepartmentSetupPanel({ institutionId }: { institutionId: number }) {
  const utils = trpc.useUtils();
  const [monthStart, setMonthStart] = useState(getCurrentMonthStart);
  const [selectedPoleId, setSelectedPoleId] = useState<string>("");
  const [draftNames, setDraftNames] = useState<Record<number, string>>({});
  const [newDepartmentName, setNewDepartmentName] = useState("");

  const { data: departments, isLoading: departmentsLoading } = trpc.institution.getFacilityDepartments.useQuery({ institutionId });
  const { data: poles } = trpc.institution.getFacilityPoles.useQuery({ institutionId });
  const activePoleId = selectedPoleId ? Number(selectedPoleId) : poles?.[0]?.id;
  const { data: monthlyRota } = trpc.institution.getMonthlyUtlRota.useQuery(
    { institutionId, poleId: activePoleId ?? 0, monthStart },
    { enabled: !!activePoleId },
  );

  useEffect(() => {
    if (!departments) return;
    setDraftNames(Object.fromEntries(departments.map((department) => [department.id, department.departmentName])));
  }, [departments]);

  const unassignedCount = useMemo(() => departments?.filter((department) => department.poleId == null).length ?? 0, [departments]);
  const activePoleDepartments = useMemo(
    () => departments?.filter((department) => department.poleId === activePoleId) ?? [],
    [departments, activePoleId],
  );

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
    },
    onError: (error) => toast.error(error.message),
  });
  const autopopulateMutation = trpc.institution.autopopulateMonthlyUtlRota.useMutation({
    onSuccess: (result) => {
      toast.success(`Monthly UTL rota prepared for ${result.assignedDepartments} department(s); ${result.generatedShifts} shift rows synchronized.`);
      void utils.institution.getMonthlyUtlRota.invalidate({ institutionId, poleId: activePoleId ?? 0, monthStart });
      void utils.institution.getShiftUtlRoster.invalidate();
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
        <div className="rounded-lg border bg-muted/20 p-3 text-sm">
          <p className="font-semibold">Step 1 — Confirm or update departments</p>
          <p className="mt-1 text-muted-foreground">This list is shared by IERS and CPD Portal. Renaming an existing row keeps its canonical identity; add new departments here rather than creating separate CPD text labels.</p>
          <div className="mt-3 space-y-2">
            {(departments ?? []).map((department) => (
              <Input key={department.id} value={draftNames[department.id] ?? department.departmentName} onChange={(event) => setDraftNames((current) => ({ ...current, [department.id]: event.target.value }))} aria-label={`Department ${department.departmentName}`} className="min-w-0" />
            ))}
            <div className="flex min-w-0 flex-col gap-2 sm:flex-row">
              <Input value={newDepartmentName} onChange={(event) => setNewDepartmentName(event.target.value)} placeholder="Add a new canonical department" className="min-w-0" />
              <Button className="w-full shrink-0 sm:w-auto" onClick={saveDepartmentList} disabled={confirmMutation.isPending || !(departments?.length || newDepartmentName.trim())}> <CheckCircle2 className="mr-2 h-4 w-4" />Confirm department list</Button>
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-muted/20 p-3 text-sm">
          <p className="font-semibold">Step 2 — IERS Lead assigns poles</p>
          <p className="mt-1 text-muted-foreground">Assigning a pole makes a canonical department available in that pole’s weekly ERTL rotation and monthly UTL automation.</p>
          <div className="mt-3 flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
            <Select value={selectedPoleId || (poles?.[0]?.id ? String(poles[0].id) : undefined)} onValueChange={setSelectedPoleId}>
              <SelectTrigger className="w-full min-w-0 sm:w-64"><SelectValue placeholder="Select a pole" /></SelectTrigger>
              <SelectContent>{(poles ?? []).map((pole) => <SelectItem key={pole.id} value={String(pole.id)}><span className="flex items-center gap-2"><Shield className="h-3.5 w-3.5" />{pole.poleName}</span></SelectItem>)}</SelectContent>
            </Select>
            <Button variant="outline" className="w-full sm:w-auto" onClick={() => activePoleId && assignAllMutation.mutate({ institutionId, poleId: activePoleId })} disabled={!activePoleId || unassignedCount === 0 || assignAllMutation.isPending}>Assign all unassigned</Button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Departments already mapped to another pole are not moved by the batch action; update those assignments from the roster controls.</p>
        </div>

        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm">
          <p className="font-semibold text-amber-800 dark:text-amber-300">Step 3 — Prepare the monthly UTL rota</p>
          <p className="mt-1 text-amber-700 dark:text-amber-400">For each department in the selected pole, the system finds active linked providers with the same canonical department, creates one monthly source row, and synchronizes every morning, evening, and night shift. Each provider still accepts the dated duty in the individual portal.</p>
          <div className="mt-3 flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
            <Input type="month" value={monthStart.slice(0, 7)} onChange={(event) => setMonthStart(`${event.target.value}-01`)} className="w-full min-w-0 sm:w-48" />
            <Button className="w-full sm:w-auto" onClick={() => activePoleId && autopopulateMutation.mutate({ institutionId, poleId: activePoleId, monthStart, departmentIds: activePoleDepartments.map((department) => department.id) })} disabled={!activePoleId || activePoleDepartments.length === 0 || autopopulateMutation.isPending}><RefreshCw className="mr-2 h-4 w-4" />Autopopulate monthly UTL</Button>
          </div>
          <div className="mt-3 space-y-2">
            {(monthlyRota ?? []).length === 0 ? <p className="text-xs text-amber-700 dark:text-amber-400">No monthly source rows yet for this pole and month.</p> : (monthlyRota ?? []).map((rotation) => <div key={rotation.id} className="flex min-w-0 flex-col gap-1 rounded border bg-background/70 p-2 sm:flex-row sm:items-center sm:justify-between"><span className="flex min-w-0 items-center gap-2 break-words"><Users className="h-3.5 w-3.5 shrink-0" />{rotation.departmentName}</span><span className="text-xs text-muted-foreground">{rotation.providerName ?? "No linked provider"} · {rotation.assignmentStatus}</span></div>)}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
