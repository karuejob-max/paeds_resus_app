import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BriefcaseBusiness, CheckCircle2, Clock3, XCircle } from "lucide-react";
import { toast } from "sonner";

function declineReason(): string | null {
  const value = window.prompt("Why are you declining this role? The institution needs a reason to arrange cover.");
  return value?.trim() || null;
}

function statusLabel(status: string): string {
  if (status === "pending_acceptance") return "Response required";
  if (status === "active") return "Accepted";
  if (status === "declined") return "Declined";
  return status;
}

export default function ProviderInstitutionRoleAssignmentsCard() {
  const utils = trpc.useUtils();
  const { data: departmentHeads, isLoading: headsLoading } = trpc.institutionAccountability.getMyDepartmentHeadAssignments.useQuery(undefined, { staleTime: 15_000 });
  const { data: educationCoordinators, isLoading: educationLoading } = trpc.institutionLearning.getMyEducationCoordinatorAssignments.useQuery(undefined, { staleTime: 15_000 });
  const { data: ercoAssignments, isLoading: ercoLoading } = trpc.institution.getMyDepartmentResponseAssignments.useQuery(undefined, { staleTime: 15_000 });
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const respondHead = trpc.institutionAccountability.respondToDepartmentHeadAssignment.useMutation({
    onSuccess: () => { toast.success("Departmental Head response recorded."); void utils.institutionAccountability.getMyDepartmentHeadAssignments.invalidate(); setBusyKey(null); },
    onError: error => { toast.error(error.message || "Could not respond to Departmental Head role."); setBusyKey(null); },
  });
  const respondEducation = trpc.institutionLearning.respondToEducationCoordinatorAssignment.useMutation({
    onSuccess: () => { toast.success("Departmental CPD Coordinator response recorded."); void utils.institutionLearning.getMyEducationCoordinatorAssignments.invalidate(); setBusyKey(null); },
    onError: error => { toast.error(error.message || "Could not respond to CPD Coordinator role."); setBusyKey(null); },
  });
  const respondErco = trpc.institution.respondToDepartmentResponseCoordinatorAssignment.useMutation({
    onSuccess: () => { toast.success("ERCo response recorded."); void utils.institution.getMyDepartmentResponseAssignments.invalidate(); setBusyKey(null); },
    onError: error => { toast.error(error.message || "Could not respond to ERCo role."); setBusyKey(null); },
  });

  if (headsLoading || educationLoading || ercoLoading) return null;
  const headRows = departmentHeads ?? [];
  const educationRows = educationCoordinators ?? [];
  const ercoRows = (ercoAssignments ?? []).filter((row: any) => row.roleKey === "erco" || row.roleKey === "deputy_erco");
  if (headRows.length === 0 && educationRows.length === 0 && ercoRows.length === 0) return null;

  const respond = (kind: "head" | "education" | "erco", id: number, response: "accept" | "decline", roleKey?: string) => {
    const reason = response === "decline" ? declineReason() : undefined;
    if (response === "decline" && !reason) return;
    setBusyKey(`${kind}-${id}`);
    if (kind === "head") respondHead.mutate({ assignmentId: id, response, declineReason: reason ?? undefined, roleKey: roleKey === "deputy_department_head" ? "deputy_department_head" : "department_head" });
    else if (kind === "education") respondEducation.mutate({ assignmentId: id, response, declineReason: reason ?? undefined, roleKey: roleKey === "deputy_department_cpd_coordinator" ? "deputy_department_cpd_coordinator" : "department_cpd_coordinator" });
    else respondErco.mutate({ assignmentId: id, response, declineReason: reason ?? undefined, roleKey: roleKey === "deputy_erco" ? "deputy_erco" : "erco" });
  };

  return (
    <Card className="border-violet-200 bg-violet-50/30">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-violet-950"><BriefcaseBusiness className="h-5 w-5 text-violet-700" />Institution roles assigned to you</CardTitle>
        <CardDescription>This is the central place to accept, decline, and review your standing institutional roles. Department Heads can manage ERCo and CPD Coordinator roles within their accepted department.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {[...headRows.map(row => ({ ...row, kind: "head" as const, title: row.roleKey === "deputy_department_head" ? "Deputy Departmental Head" : "Departmental Head" })), ...educationRows.map(row => ({ ...row, kind: "education" as const, title: row.roleKey === "deputy_department_cpd_coordinator" ? "Deputy Departmental CPD Coordinator" : "Departmental CPD Coordinator" })), ...ercoRows.map(row => ({ ...row, kind: "erco" as const, title: row.roleKey === "deputy_erco" ? "Deputy ERCo" : "ERCo" }))].map(row => {
          const key = `${row.kind}-${row.id}`;
          const pending = row.assignmentStatus === "pending_acceptance";
          return (
            <div key={key} className="rounded-lg border bg-white p-4">
              <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
                <div><p className="font-semibold">{row.title}</p><p className="text-sm text-muted-foreground">{row.departmentName ?? `Department ${row.departmentId}`}</p></div>
                <Badge variant={pending ? "secondary" : row.assignmentStatus === "declined" ? "destructive" : "default"}>{statusLabel(row.assignmentStatus)}</Badge>
              </div>
              {pending ? (
                <div className="mt-3 flex flex-wrap gap-2 rounded-md border border-amber-200 bg-amber-50 p-3">
                  <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
                  <div className="min-w-0 flex-1"><p className="text-sm font-medium text-amber-950">Acceptance required</p><p className="text-xs text-amber-900/80">Accept to activate this role, or decline with a reason so the institution can arrange cover.</p>{row.kind === "erco" && <p className="mt-1 text-xs font-medium text-amber-950">ERCo is a clinical emergency-responsibility role. A current regulatory licence number and evidence are required before acceptance. <a className="underline" href="/provider-records?tab=credentials">Open My Records → Professional Credentials</a>.</p>}</div>
                  <div className="flex w-full flex-wrap gap-2 sm:w-auto"><Button size="sm" onClick={() => respond(row.kind, row.id, "accept", row.roleKey)} disabled={busyKey === key}><CheckCircle2 className="mr-1.5 h-4 w-4" />Accept</Button><Button size="sm" variant="outline" onClick={() => respond(row.kind, row.id, "decline", row.roleKey)} disabled={busyKey === key}><XCircle className="mr-1.5 h-4 w-4" />Decline</Button></div>
                </div>
              ) : row.assignmentStatus === "active" ? (
                <div className="mt-3 space-y-2">
                  <p className="text-xs text-emerald-800">Active role. Use the relevant workspace below to perform your assigned department responsibilities.</p>
                  <div className="flex flex-wrap gap-2">
                    {row.kind === "head" && <Button asChild size="sm" variant="outline"><a href={`/institution?section=iers&iersTab=workforce&workforceTab=erco&institutionId=${row.institutionId}#team-setup-erco`}>Appoint department ERCo</a></Button>}
                    {row.kind === "erco" && <Button asChild size="sm" variant="outline"><a href="/provider-iers-staffing">Manage department UTL staffing</a></Button>}
                    {row.kind === "head" && <Button asChild size="sm" variant="outline"><a href={`/institution?section=learning&learningTab=cpd&institutionId=${row.institutionId}`}>Manage department CPD role</a></Button>}
                    {row.kind === "education" && <Button asChild size="sm" variant="outline"><a href={`/institution?section=learning&learningTab=cpd&institutionId=${row.institutionId}`}>Open CPD Coordinator workspace</a></Button>}
                  </div>
                </div>
              ) : row.declineReason ? <p className="mt-2 text-xs text-red-800">Declined: {row.declineReason}</p> : null}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
