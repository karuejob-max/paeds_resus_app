import { useEffect, useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { getSlotEligibility, type EligibilityPerson } from "@shared/institution-role-eligibility";
import type { RoleSlot, SlotKind } from "@shared/institution-role-register";

const labels: Record<SlotKind, string> = { institution_admin: "Institutional administrator", iers_coordinator: "Institutional Emergency Response Coordinator", cpd_coordinator: "Institutional CPD Coordinator", dept_head: "Departmental Head", dept_head_deputy: "Deputy Departmental Head", erco: "ERCo", erco_deputy: "Deputy ERCo", cpd_dept_coordinator: "Departmental CPD Coordinator", cpd_dept_coordinator_deputy: "Deputy Departmental CPD Coordinator" };
export type DrawerMode = "assign" | "change" | "end";

type Props = { institutionId: number; open: boolean; onOpenChange: (open: boolean) => void; slot: RoleSlot | null; departmentLabel?: string; mode?: DrawerMode; staff: EligibilityPerson[]; primaryErcoUserId?: number | null; onSuccess: () => void };

export function RoleAssignDrawer({ institutionId, open, onOpenChange, slot, departmentLabel, mode = "assign", staff, primaryErcoUserId, onSuccess }: Props) {
  const utils = trpc.useUtils();
  const [search, setSearch] = useState("");
  const [selectedStaffId, setSelectedStaffId] = useState<number | null>(null);
  const [reason, setReason] = useState("");
  const [drawerMode, setDrawerMode] = useState<DrawerMode>(mode);
  useEffect(() => setDrawerMode(mode), [mode, slot?.kind, slot?.departmentId, slot?.assignmentId]);
  const selected = staff.find(person => person.id === selectedStaffId) ?? null;
  const results = useMemo(() => staff.filter(person => `${person.staffName} ${person.staffEmail ?? ""}`.toLowerCase().includes(search.toLowerCase())).slice(0, 12), [staff, search]);
  const eligibility = getSlotEligibility(slot?.kind ?? "institution_admin", selected, slot?.departmentId ?? null, { primaryErcoUserId, existingHolderUserId: slot?.holders[0]?.userId });
  const refresh = async () => { await Promise.all([utils.institution.getStaffMembers.invalidate({ institutionId }), utils.institution.getFacilityDepartments.invalidate({ institutionId }), utils.institutionAdmins.list.invalidate({ institutionId }), utils.institutionProducts.listProductRoles.invalidate({ institutionId }), utils.institutionAccountability.listDepartmentHeadAppointments.invalidate({ institutionId, includeEnded: false }), utils.institution.getDepartmentResponseCoordinators.invalidate({ institutionId }), utils.institutionLearning.listEducationCoordinators.invalidate({ institutionId }), utils.institution.getInstitutionIersDutyAssignments.invalidate({ institutionId })]); onSuccess(); };
  const endHead = trpc.institutionAccountability.endDepartmentHead.useMutation({ onSuccess: refresh });
  const endCpd = trpc.institutionLearning.endEducationCoordinator.useMutation({ onSuccess: refresh });
  const endErco = trpc.institution.endDepartmentResponseCoordinatorAssignment.useMutation({ onSuccess: refresh });
  const grantProduct = trpc.institutionProducts.grantProductRole.useMutation({ onSuccess: refresh });
  const setProduct = trpc.institutionProducts.setProductRoleStatus.useMutation({ onSuccess: refresh });
  const inviteAdmin = trpc.institutionAdmins.invite.useMutation({ onSuccess: refresh });
  const assignHead = trpc.institutionAccountability.assignDepartmentHead.useMutation({ onSuccess: refresh });
  const assignCpd = trpc.institutionLearning.assignEducationCoordinator.useMutation({ onSuccess: refresh });
  const assignErco = trpc.institution.assignDepartmentResponseCoordinator.useMutation({ onSuccess: refresh });
  if (!slot) return null;
  const busy = [endHead, endCpd, endErco, grantProduct, setProduct, inviteAdmin, assignHead, assignCpd, assignErco].some(m => m.isPending);
  const submit = () => {
    if (drawerMode === "end") {
      if (!reason.trim()) return;
      if (slot.kind.startsWith("dept_head") && slot.assignmentId) endHead.mutate({ institutionId, assignmentId: slot.assignmentId, note: reason.trim() });
      else if (slot.kind.startsWith("cpd_dept") && slot.assignmentId) endCpd.mutate({ institutionId, assignmentId: slot.assignmentId });
      else if (slot.kind.startsWith("erco") && slot.assignmentId) endErco.mutate({ institutionId, assignmentId: slot.assignmentId, reason: reason.trim() });
      else if ((slot.kind === "institution_admin" || slot.kind === "iers_coordinator" || slot.kind === "cpd_coordinator") && slot.assignmentId) setProduct.mutate({ institutionId, roleId: slot.assignmentId, roleStatus: "ended", reason: reason.trim() });
      return;
    }
    if (!selected?.userId || eligibility.length) return;
    const departmentId = slot.departmentId ?? undefined;
    if (slot.kind === "institution_admin") inviteAdmin.mutate({ institutionId, userId: selected.userId });
    else if (slot.kind === "iers_coordinator") grantProduct.mutate({ institutionId, productKey: "iers", roleKey: "iers_coordinator", userId: selected.userId, invitedEmail: selected.staffEmail ?? "" });
    else if (slot.kind === "cpd_coordinator") grantProduct.mutate({ institutionId, productKey: "cpd_portal", roleKey: "cpd_coordinator", userId: selected.userId, invitedEmail: selected.staffEmail ?? "" });
    else if (slot.kind === "dept_head" || slot.kind === "dept_head_deputy") assignHead.mutate({ institutionId, departmentId: departmentId!, userId: selected.userId, assignmentRole: slot.kind === "dept_head_deputy" ? "deputy" : "primary" });
    else if (slot.kind === "cpd_dept_coordinator" || slot.kind === "cpd_dept_coordinator_deputy") assignCpd.mutate({ institutionId, departmentId: departmentId!, userId: selected.userId, assignmentRole: slot.kind === "cpd_dept_coordinator_deputy" ? "deputy" : "primary" });
    else if (slot.kind === "erco" || slot.kind === "erco_deputy") assignErco.mutate({ institutionId, departmentId: departmentId!, coordinatorUserId: slot.kind === "erco_deputy" ? primaryErcoUserId! : selected.userId, deputyUserId: slot.kind === "erco_deputy" ? selected.userId : null, backupUserId: null, effectiveFrom: new Date().toISOString().slice(0, 10), effectiveUntil: null });
  };
  return <Sheet open={open} onOpenChange={onOpenChange}><SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg"><SheetHeader><SheetTitle>{drawerMode === "end" ? "End" : drawerMode === "change" ? "Change" : "Assign"} {labels[slot.kind]}</SheetTitle><SheetDescription>{departmentLabel ? `Fixed department: ${departmentLabel}.` : "Institution-wide appointment."} The server remains the authority for eligibility and authorization.</SheetDescription></SheetHeader><div className="space-y-4 px-4"><div className="rounded-md border bg-muted/20 p-3 text-sm"><strong>Selected slot:</strong> {labels[slot.kind]}{departmentLabel ? ` · ${departmentLabel}` : ""}</div>{drawerMode === "end" ? <label className="space-y-1 text-sm"><span className="font-medium">Reason for ending</span><Input value={reason} onChange={e => setReason(e.target.value)} placeholder="Explain why this appointment is ending" /></label> : <>{selected ? <div className="flex items-center justify-between rounded-md border p-3"><span><strong>{selected.staffName}</strong><span className="ml-2 text-xs text-muted-foreground">{selected.staffEmail}</span></span><Button type="button" variant="ghost" size="sm" onClick={() => setSelectedStaffId(null)}>Change</Button></div> : <><Input aria-label="Search staff" placeholder="Search staff by name or email" value={search} onChange={e => setSearch(e.target.value)} />{search && <div className="grid gap-1 rounded-md border p-1">{results.map(person => <button type="button" key={person.id} className="min-h-11 rounded px-3 py-2 text-left hover:bg-muted" onClick={() => { setSelectedStaffId(person.id); setSearch(""); }}>{person.staffName}<span className="block text-xs text-muted-foreground">{person.staffEmail}</span></button>)}</div>}</>}{selected && <div className="space-y-1 rounded-md border p-3 text-sm"><p className="font-medium">Eligibility</p>{eligibility.length ? eligibility.map(item => <p key={item} className="text-destructive">{item}</p>) : <p className="text-emerald-700">Eligible checks passed. Server authorization still applies.</p>}</div>}<p className="text-sm text-muted-foreground">{selected ? `Assign ${selected.staffName} as ${labels[slot.kind]}${departmentLabel ? ` for ${departmentLabel}` : ""}. They must accept before it takes effect.` : "Select a person to see eligibility before submitting."}</p></>}</div><SheetFooter>{drawerMode !== "end" && slot.status === "active" && <Button type="button" variant="destructive" onClick={() => setDrawerMode("end")}>End appointment</Button>}<Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button type="button" variant={drawerMode === "end" ? "destructive" : "default"} disabled={busy || (drawerMode === "end" ? reason.trim().length < 3 : !selected || eligibility.length > 0)} onClick={submit}>{busy ? "Saving…" : drawerMode === "end" ? "End appointment" : drawerMode === "change" ? "Change assignment" : "Assign"}</Button></SheetFooter></SheetContent></Sheet>;
}
