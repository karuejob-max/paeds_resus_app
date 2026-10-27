import { useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, Save } from "lucide-react";
import { toast } from "sonner";

type Context = {
  institutionId: number;
  companyName: string | null;
  currentDepartmentId: number | null;
  currentDepartment: string | null;
  departments: Array<{ id: number; departmentName: string; parentDepartmentId: number | null }>;
};

export function InstitutionDepartmentContextCard() {
  const contextsQuery = trpc.institution.getMyDepartmentContexts.useQuery(undefined, { staleTime: 30_000 });
  const utils = trpc.useUtils();
  const [drafts, setDrafts] = useState<Record<number, string>>({});
  const updateDepartment = trpc.institution.updateMyInstitutionalDepartment.useMutation({
    onSuccess: async (_result, input) => {
      toast.success("Institutional department updated");
      await Promise.all([
        utils.institution.getMyDepartmentContexts.invalidate(),
        utils.institution.getMyMemberships.invalidate(),
        utils.cpd.currentEvent.invalidate(),
      ]);
      setDrafts((current) => {
        const next = { ...current };
        delete next[input.institutionId];
        return next;
      });
    },
    onError: (error) => toast.error(error.message || "Could not update department"),
  });

  const contexts = (contextsQuery.data ?? []) as Context[];
  const labelFor = (context: Context, departmentId: number) => {
    const department = context.departments.find((item) => item.id === departmentId);
    if (!department) return "";
    const parent = department.parentDepartmentId == null
      ? null
      : context.departments.find((item) => item.id === department.parentDepartmentId);
    return parent ? `${parent.departmentName} → ${department.departmentName}` : department.departmentName;
  };
  const activeContexts = useMemo(() => contexts.filter((context) => context.departments.length > 0), [contexts]);

  if (contextsQuery.isLoading) return null;
  if (!activeContexts.length) return null;

  return (
    <Card className="border-indigo-200 bg-indigo-50/30 dark:border-indigo-900/60 dark:bg-indigo-950/10">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Building2 className="h-5 w-5 text-indigo-700" />Institutional department</CardTitle>
        <CardDescription>
          Set the department you currently work in at each institution. This is institution-specific and can be changed here whenever your assignment changes; it also pre-fills future CPD registrations.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {activeContexts.map((context) => {
          const selected = drafts[context.institutionId] ?? String(context.currentDepartmentId ?? "");
          const changed = selected !== String(context.currentDepartmentId ?? "");
          return (
            <div key={context.institutionId} className="flex flex-col gap-3 rounded-lg border bg-background p-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium">{context.companyName || "Institution"}</p>
                  <Badge variant="outline">Active membership</Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Current: {context.currentDepartmentId ? labelFor(context, context.currentDepartmentId) : context.currentDepartment || "Not set"}
                </p>
                <Select value={selected} onValueChange={(value) => setDrafts((current) => ({ ...current, [context.institutionId]: value }))}>
                  <SelectTrigger className="mt-3 w-full sm:max-w-md"><SelectValue placeholder="Choose your current department" /></SelectTrigger>
                  <SelectContent>
                    {context.departments.map((department) => (
                      <SelectItem key={department.id} value={String(department.id)}>{labelFor(context, department.id)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="mt-2 text-xs text-muted-foreground">Choose a parent department when your work is department-wide; choose a subdepartment only when it is genuinely relevant.</p>
              </div>
              <Button type="button" variant="outline" disabled={!changed || updateDepartment.isPending} onClick={() => updateDepartment.mutate({ institutionId: context.institutionId, departmentId: Number(selected) })}>
                <Save className="mr-2 h-4 w-4" />{updateDepartment.isPending ? "Saving…" : "Save department"}
              </Button>
            </div>
          );
        })}
        <p className="text-xs text-muted-foreground">Changing your department updates your institutional staff record and the CPD prefill. It does not appoint you as a Departmental Head, deputy, ERCo, CPD coordinator, or emergency responder.</p>
      </CardContent>
    </Card>
  );
}
