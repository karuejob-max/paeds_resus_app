import { useEffect, useMemo, useRef, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, CheckCircle2, CircleDashed, Clock3, UserRound, XCircle } from "lucide-react";
import { buildRoleRegister, resolveHolderNames, type RoleSlot, type SlotKind, type SlotStatus } from "@shared/institution-role-register";
import { buildCanonicalDepartmentOptions } from "@shared/institution-department-hierarchy";
import { RoleAssignDrawer, type DrawerMode } from "./RoleAssignDrawer";
import type { PeopleFocus } from "@shared/institution-administration-location";

const labels: Record<SlotKind, string> = { institution_admin: "Institutional administrator", iers_coordinator: "Institutional Emergency Response Coordinator", cpd_coordinator: "Institutional CPD Coordinator", dept_head: "Head", dept_head_deputy: "Deputy Head", erco: "ERCo", erco_deputy: "Deputy ERCo", cpd_dept_coordinator: "CPD Coordinator", cpd_dept_coordinator_deputy: "Deputy CPD Coordinator" };
const statusText: Record<SlotStatus, string> = { vacant: "Vacant", pending_acceptance: "Pending acceptance", active: "Active", declined: "Declined", suspended: "Suspended", unavailable: "Unavailable" };
function icon(status: SlotStatus) { return status === "active" ? <CheckCircle2 className="h-4 w-4" /> : status === "pending_acceptance" ? <Clock3 className="h-4 w-4" /> : status === "declined" ? <XCircle className="h-4 w-4" /> : status === "unavailable" || status === "suspended" ? <AlertCircle className="h-4 w-4" /> : <CircleDashed className="h-4 w-4" />; }
export function roleActionLabel(slot: RoleSlot) { if (slot.status !== "active") return "Assign"; return slot.kind === "institution_admin" ? "Add administrator" : "Replace"; }


export function RoleRegister({ institutionId, focus }: { institutionId: number; focus?: Extract<PeopleFocus, { kind: "role" }> }) {
  const [filter, setFilter] = useState<"all" | "vacant" | "pending_acceptance" | "declined">("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<{ slot: RoleSlot; departmentLabel?: string; focusKey: string } | null>(null);
  const cellRefs = useRef(new Map<string, HTMLButtonElement>());
  const pendingFocusKey = useRef<string | null>(null);
  useEffect(() => {
    if (selected || !pendingFocusKey.current) return;
    const key = pendingFocusKey.current;
    pendingFocusKey.current = null;
    window.requestAnimationFrame(() => cellRefs.current.get(key)?.focus());
  }, [selected]);
  const [mode, setMode] = useState<DrawerMode>("assign");
  const departments = trpc.institution.getFacilityDepartments.useQuery({ institutionId }, { staleTime: 30_000 });
  const admins = trpc.institutionAdmins.list.useQuery({ institutionId }, { staleTime: 30_000 });
  const productRoles = trpc.institutionProducts.listProductRoles.useQuery({ institutionId }, { staleTime: 30_000 });
  const heads = trpc.institutionAccountability.listDepartmentHeadAppointments.useQuery({ institutionId, includeEnded: false }, { staleTime: 30_000 });
  const ercos = trpc.institution.getDepartmentResponseCoordinators.useQuery({ institutionId }, { staleTime: 30_000 });
  const cpd = trpc.institutionLearning.listEducationCoordinators.useQuery({ institutionId }, { staleTime: 30_000 });
  const staffQuery = trpc.institution.getStaffMembers.useQuery({ institutionId, includeRemoved: false }, { staleTime: 30_000 });
  const unavailable = (query: { isError: boolean }) => query.isError ? { unavailable: true as const } : undefined;
  const directory = staffQuery.data ?? [];
  const register = useMemo(() => buildRoleRegister({ departments: departments.isError ? { unavailable: true } : (departments.data ?? []), admins: admins.isError ? { unavailable: true } : [...(admins.data?.admins ?? []), ...(admins.data?.pendingInvites ?? []).map(invite => ({ id: invite.id, name: invite.invitedName, email: invite.invitedEmail, roleStatus: "pending_acceptance" }))], productRoles: productRoles.isError ? { unavailable: true } : resolveHolderNames(productRoles.data ?? [], directory), heads: heads.isError ? { unavailable: true } : resolveHolderNames(heads.data ?? [], directory), ercos: ercos.isError ? { unavailable: true } : resolveHolderNames(ercos.data ?? [], directory), cpdCoordinators: cpd.isError ? { unavailable: true } : resolveHolderNames(cpd.data ?? [], directory) }), [departments.data, departments.isError, admins.data, admins.isError, productRoles.data, productRoles.isError, heads.data, heads.isError, ercos.data, ercos.isError, cpd.data, cpd.isError, directory]);
  useEffect(() => {
    if (!focus || focus.kind !== "role") return;
    const allSlots = [
      ...register.institutionWide,
      ...register.departments.flatMap(row => row.slots),
    ];
    const target = allSlots.find(slot => `${slot.kind}-${slot.departmentId ?? "institution"}` === focus.slotKey);
    if (!target) return;
    if (target.status === "pending_acceptance" || target.status === "declined") setFilter(target.status);
    pendingFocusKey.current = focus.slotKey;
  }, [focus, register]);
  const options = useMemo(() => buildCanonicalDepartmentOptions(departments.data ?? []), [departments.data]);
  const matches = (slot: RoleSlot) => (filter === "all" || slot.status === filter);
  const deptRows = register.departments.filter(row => row.label.toLowerCase().includes(search.toLowerCase())).filter(row => filter === "all" || row.slots.some(matches));
  const people = (staffQuery.data ?? []).map(row => ({ ...row, staffEmail: row.staffEmail, id: row.id, staffName: row.staffName, userId: row.userId, departmentId: row.facilityDepartmentId, facilityLinkStatus: row.facilityLinkStatus, membershipStatus: (row as { membershipStatus?: string }).membershipStatus }));
  const openSlot = (slot: RoleSlot, departmentLabel?: string, nextMode: DrawerMode = "assign") => { const focusKey = `${slot.kind}-${slot.departmentId}`; setSelected({ slot, departmentLabel, focusKey }); setMode(nextMode); };
  const closeDrawer = () => { pendingFocusKey.current = selected?.focusKey ?? null; setSelected(null); };
  const primaryErcoUserId = selected?.slot.departmentId == null ? null : register.departments.find(row => row.departmentId === selected.slot.departmentId)?.slots.find(slot => slot.kind === "erco")?.holders[0]?.userId ?? null;
  const cell = (slot: RoleSlot, departmentLabel?: string) => { const holder = slot.holders[0]; const action = holder ? roleActionLabel(slot) : "Assign"; return <button type="button" key={`${slot.kind}-${slot.departmentId}`} ref={node => { if (node) cellRefs.current.set(`${slot.kind}-${slot.departmentId}`, node); else cellRefs.current.delete(`${slot.kind}-${slot.departmentId}`); }} aria-label={`${labels[slot.kind]}${departmentLabel ? `, ${departmentLabel}` : ""}: ${statusText[slot.status]}${holder ? `, ${holder.name}` : ""}. Open`} className="flex min-h-20 w-full flex-col items-start justify-between gap-1 rounded-md border bg-background p-3 text-left hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" onClick={() => openSlot(slot, departmentLabel, action === "Replace" ? "change" : "assign")}><span className="flex items-center gap-2 text-xs font-medium">{icon(slot.status)}{labels[slot.kind]}</span><span className="text-xs text-muted-foreground">{statusText[slot.status]}{holder ? ` · ${holder.name}` : ""}</span>{slot.others?.map(other => <span key={other.userId} className="text-xs text-muted-foreground">Also: {other.name}</span>)}{slot.status === "declined" && slot.declineReason && <span className="text-xs text-destructive">{slot.declineReason}</span>}{holder && ["active", "declined"].includes(slot.status) && <span className="text-xs font-medium text-primary">{action}</span>}</button>; };
  return <div className="space-y-5"><Card><CardHeader><CardTitle>Role register</CardTitle><p className="text-sm text-muted-foreground">Standing institutional and departmental appointments. Dated ERTL/UTL duties remain in IERS operations.</p></CardHeader><CardContent className="space-y-4"><div className="flex flex-wrap gap-2" aria-label="Role status filters">{([["all", "All"], ["vacant", "Vacant"], ["pending_acceptance", "Pending"], ["declined", "Declined"]] as const).map(([value, label]) => <Button key={value} type="button" size="sm" variant={filter === value ? "default" : "outline"} onClick={() => setFilter(value)}>{label}</Button>)}</div><Input aria-label="Search departments" placeholder="Search departments" value={search} onChange={e => setSearch(e.target.value)} /><div><h3 className="mb-2 text-sm font-semibold">Institution-wide roles</h3><div className="grid gap-2 md:grid-cols-3">{register.institutionWide.filter(matches).map(slot => cell(slot))}</div></div><div><h3 className="mb-2 text-sm font-semibold">Departmental roles</h3>{deptRows.length === 0 ? <p className="rounded-md border border-dashed p-5 text-sm text-muted-foreground">No departments or roles match this filter.</p> : <div className="space-y-3">{deptRows.map(row => <div key={row.departmentId} className="rounded-lg border p-3"><div className="mb-3 flex items-center justify-between gap-2"><h4 className="font-medium">{row.label}</h4><Badge variant="outline">{row.slots.filter(matches).length}/6 shown</Badge></div><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{row.slots.filter(matches).map(slot => cell(slot, row.label))}</div></div>)}</div>}</div></CardContent></Card>{selected && <RoleAssignDrawer institutionId={institutionId} open={!!selected} onOpenChange={open => !open && closeDrawer()} slot={selected.slot} departmentLabel={selected.departmentLabel} mode={mode} staff={people} primaryErcoUserId={primaryErcoUserId} onSuccess={closeDrawer} />}</div>;
}
