import { useEffect, useMemo, useRef, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle ,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue ,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow ,
} from "@/components/ui/table";
import { toast } from "sonner";
import { AlertTriangle, CalendarClock, KeyRound, Loader2, RefreshCw, Search, ShieldCheck, UserCheck, UserMinus, Users ,
} from "lucide-react";

const GOVERNANCE_ROLES = [
  ["general_staff", "General staff"],
  ["executive", "Hospital executive"],
  ["erc_chair", "ERC chair"],
  ["erc_member", "ERC member"],
  ["er_coordinator", "Emergency Readiness Coordinator (ERCo)"],
  ["unit_team_leader", "Unit Team Leader (UTL)"],
  ["ert_leader", "ERT Team Leader (ERTL)"],
  ["ert_responder", "ERT responder"],
] as const;

type GovernanceRole = (typeof GOVERNANCE_ROLES)[number][0];

type StaffRow = {
  id: number;
  staffName: string;
  staffEmail: string;
  staffRole: string;
  department: string | null;
  governanceRole?: GovernanceRole | null;
  facilityLinkStatus?: string | null;
  userId?: number | null;
  membershipId?: number | null;
  membershipStatus?: "invited" | "active" | "suspended" | "ended" | null;
  removedAt?: string | Date | null;
  removalReason?: string | null;
};

function roleLabel(role: string | null | undefined): string {
  return (
    GOVERNANCE_ROLES.find(([value]) => value === role)?.[1] ?? "General staff");
}

function dutyStatusVariant(status: string): "default" | "secondary" | "outline" | "destructive" {
  if (status === "active") return "default";
  if (status === "declined" || status === "ended") return "destructive";
  if (status === "pending_acceptance") return "secondary";
  return "outline";
}

function formatDutyDate(value: string | Date | null | undefined): string {
  if (!value) return "Not dated";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "Not dated";
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(date);
}

export function InstitutionPeopleRolesPanel({ institutionId ,
}: { institutionId: number ;
}) {
  const utils = trpc.useUtils();
  const [search, setSearch] = useState("");
  const [roleProduct, setRoleProduct] = useState<"iers" | "cpd_portal">("iers");
  const [roleStaffEmail, setRoleStaffEmail] = useState("");
  const [roleKey, setRoleKey] = useState("");
  const [accountScopeStaffEmail, setAccountScopeStaffEmail] = useState("");
  const [accountScopeKey, setAccountScopeKey] = useState("");
  const [removalTarget, setRemovalTarget] = useState<StaffRow | null>(null);
  const [removalReason, setRemovalReason] = useState("");
  const [restoreTarget, setRestoreTarget] = useState<StaffRow | null>(null);
  const [restoreReason, setRestoreReason] = useState("");
  const [showRetired, setShowRetired] = useState(false);
  const [unlinkTarget, setUnlinkTarget] = useState<StaffRow | null>(null);
  const [unlinkReason, setUnlinkReason] = useState("");
  const [removalReportId, setRemovalReportId] = useState<number | null>(null);
  const [reallocationReportId, setReallocationReportId] = useState<number | null>(null);
  const [reallocationDepartmentId, setReallocationDepartmentId] = useState("");
  const [reallocationReason, setReallocationReason] = useState("");
  const [assignmentDepartmentId, setAssignmentDepartmentId] = useState("");
  const [directDepartmentReason, setDirectDepartmentReason] = useState("");
  const [activeSection, setActiveSection] = useState<"assignments" | "roster" | "role_map" | "duties" | "product_roles" | "scopes">("assignments");
  const { data, isLoading, isFetching, refetch } = trpc.institution.getStaffMembers.useQuery({ institutionId, includeRemoved: showRetired }, {
    enabled: !!institutionId,
    staleTime: 30_000,
  });
  const cpdRepairRefreshIssued = useRef<number | null>(null);
  useEffect(() => {
    if (!institutionId || isLoading || cpdRepairRefreshIssued.current === institutionId) return;
    cpdRepairRefreshIssued.current = institutionId;
    const timeoutId = window.setTimeout(() => {
      void refetch();
    }, 1200);
    return () => window.clearTimeout(timeoutId);
  }, [institutionId, isLoading, refetch]);
  const { data: mismatchReports } = trpc.institution.getDepartmentMismatchReports.useQuery({ institutionId }, {
    enabled: !!institutionId,
    staleTime: 30_000,
  });
  const { data: facilityDepartments } = trpc.institution.getFacilityDepartments.useQuery({ institutionId }, {
    enabled: !!institutionId,
    staleTime: 60_000,
  });
  const { data: departmentHeads } = trpc.institutionAccountability.listDepartmentHeads.useQuery({ institutionId }, {
    enabled: !!institutionId && activeSection === "assignments",
    staleTime: 30_000,
  });
  const { data: productRoles, isLoading: productRolesLoading, refetch: refetchProductRoles ,
  } = trpc.institutionProducts.listProductRoles.useQuery({ institutionId }, {
    enabled: !!institutionId && (activeSection === "assignments" || activeSection === "product_roles"),
    staleTime: 30_000,
  });
  const { data: roleDefinitions } = trpc.institutionProducts.getRoleDefinitions.useQuery({ productKey: roleProduct }, {
    enabled: activeSection === "product_roles",
    staleTime: 300_000,
  });
  const { data: accountScopes, isLoading: accountScopesLoading, refetch: refetchAccountScopes ,
  } = trpc.institutionProducts.listAccountScopes.useQuery({ institutionId }, {
    enabled: !!institutionId && activeSection === "scopes",
    staleTime: 30_000,
  });
  const { data: accountScopeDefinitions } = trpc.institutionProducts.getAccountScopeDefinitions.useQuery(undefined, {
    enabled: activeSection === "scopes",
    staleTime: 300_000,
  });
  const { data: iersDuties, isLoading: iersDutiesLoading, isFetching: iersDutiesFetching, refetch: refetchIersDuties ,
  } = trpc.institution.getInstitutionIersDutyAssignments.useQuery({ institutionId }, {
    enabled: !!institutionId && activeSection === "duties",
    staleTime: 30_000,
  });
  const updateRole = trpc.institution.updateStaffGovernanceRole.useMutation({
    onSuccess: async () => {
      toast.success("Responsibility role updated");
      await utils.institution.getStaffMembers.invalidate({ institutionId });
    },
    onError: error => toast.error(error.message || "Could not update responsibility role"),
  });
  const grantProductRole = trpc.institutionProducts.grantProductRole.useMutation({
    onSuccess: async () => {
      toast.success("Product role assigned");
      setRoleKey("");
      await utils.institutionProducts.listProductRoles.invalidate({ institutionId ,
        });
      await refetchProductRoles();
    },
    onError: error => toast.error(error.message || "Could not assign product role"),
  });
  const setProductRoleStatus = trpc.institutionProducts.setProductRoleStatus.useMutation({
    onSuccess: async () => {
      toast.success("Product role status updated");
      await utils.institutionProducts.listProductRoles.invalidate({ institutionId ,
        });
      await refetchProductRoles();
    },
    onError: error => toast.error(error.message || "Could not update product role status"),
  });
  const grantAccountScope = trpc.institutionProducts.grantAccountScope.useMutation({
    onSuccess: async () => {
      toast.success("Institution scope assigned");
      setAccountScopeKey("");
      await utils.institutionProducts.listAccountScopes.invalidate({ institutionId ,
        });
      await refetchAccountScopes();
    },
    onError: error => toast.error(error.message || "Could not assign institution scope"),
  });
  const setAccountScopeStatus = trpc.institutionProducts.setAccountScopeStatus.useMutation({
    onSuccess: async () => {
      toast.success("Institution scope status updated");
      await utils.institutionProducts.listAccountScopes.invalidate({ institutionId ,
        });
      await refetchAccountScopes();
    },
    onError: error => toast.error(error.message || "Could not update institution scope status"),
  });
  const retireStaffRecord = trpc.institution.retireInstitutionStaffRecord.useMutation({
    onSuccess: async () => {
      toast.success("Roster record retired from this institution; history was retained.");
      setRemovalTarget(null);
      setRemovalReason("");
      setRemovalReportId(null);
      await Promise.all([
        utils.institution.getStaffMembers.invalidate({ institutionId }),
        utils.institution.getInstitutionIersDutyAssignments.invalidate({ institutionId ,
          }),
        utils.institution.getDepartmentMismatchReports.invalidate({ institutionId ,
          }),
      ]);
    },
    onError: error => toast.error(error.message || "Could not retire this roster record"),
  });
  const restoreRetiredLink = trpc.institution.restoreRetiredStaffLink.useMutation({
    onSuccess: async () => {
      toast.success("Institution link restored; previous IERS duties still require fresh assignment and acceptance.");
      setRestoreTarget(null);
      setRestoreReason("");
      await Promise.all([
        utils.institution.getStaffMembers.invalidate({ institutionId, includeRemoved: true ,
          }),
        utils.institution.getStaffMembers.invalidate({ institutionId, includeRemoved: false ,
          }),
        utils.institution.getPendingLinkRequests.invalidate({ institutionId ,
          }),
      ]);
    },
    onError: error => toast.error(error.message || "Could not restore this institution link"),
  });
  const removeMember = trpc.institution.removeInstitutionMember.useMutation({
    onSuccess: async () => {
      toast.success("Person removed from this institution");
      setRemovalTarget(null);
      setRemovalReason("");
      setRemovalReportId(null);
      await Promise.all([
        utils.institution.getStaffMembers.invalidate({ institutionId }),
        utils.institution.getInstitutionIersDutyAssignments.invalidate({ institutionId ,
        }),
        utils.institution.getDepartmentMismatchReports.invalidate({ institutionId ,
        }),
      ]);
    },
    onError: error => toast.error(error.message || "Could not remove this person"),
  });
  const unlinkMember = trpc.institution.unlinkInstitutionMember.useMutation({
    onSuccess: async () => {
      toast.success("Person unlinked from this institution; CPD history was retained.");
      setUnlinkTarget(null);
      setUnlinkReason("");
      await Promise.all([
        utils.institution.getStaffMembers.invalidate({ institutionId }),
        utils.institution.getDepartmentMismatchReports.invalidate({ institutionId ,
        }),
        utils.institution.getInstitutionIersDutyAssignments.invalidate({ institutionId ,
        }),
      ]);
    },
    onError: error => toast.error(error.message || "Could not unlink this person"),
  });
  const inviteInstitutionAdmin = trpc.institutionAdmins.invite.useMutation({ onSuccess: () => { toast.success("Institutional administrator assigned"); }, onError: error => toast.error(error.message) });
  const assignDepartmentHead = trpc.institutionAccountability.assignDepartmentHead.useMutation({
    onSuccess: async () => {
      toast.success("Departmental Head assigned");
      await utils.institutionAccountability.listDepartmentHeads.invalidate({ institutionId });
    },
    onError: error => toast.error(error.message),
  });
  const assignErco = trpc.institution.assignDepartmentResponseCoordinator.useMutation({ onSuccess: () => toast.success("ERCo assignment saved"), onError: error => toast.error(error.message) });
  const assignEducationCoordinator = trpc.institutionLearning.assignEducationCoordinator.useMutation({ onSuccess: () => toast.success("Departmental CPD Coordinator assigned"), onError: error => toast.error(error.message) });
  const resolveMismatch = trpc.institution.resolveDepartmentMismatch.useMutation({
    onSuccess: async () => {
      toast.success("Mismatch report marked resolved");
      await utils.institution.getDepartmentMismatchReports.invalidate({ institutionId });
    },
    onError: error => toast.error(error.message || "Could not resolve mismatch report"),
  });
  const reallocationMutation = trpc.institution.reallocateInstitutionStaffDepartment.useMutation({
    onSuccess: async () => {
      toast.success("Staff department reallocated; previous readiness duties were ended for review.");
      setReallocationReportId(null);
      setReallocationDepartmentId("");
      setReallocationReason("");
      setDirectDepartmentReason("");
      await Promise.all([
        utils.institution.getStaffMembers.invalidate({ institutionId }),
        utils.institution.getDepartmentMismatchReports.invalidate({ institutionId ,
          }),
        utils.institution.getInstitutionIersDutyAssignments.invalidate({ institutionId ,
          }),
      ]);
    },
    onError: error => toast.error(error.message || "Could not reallocate this department"),
  });

  const staff = (data ?? []) as StaffRow[];
  const selectedRoleStaff = staff.find(member => member.staffEmail.toLowerCase() === roleStaffEmail.toLowerCase());
  const selectedAccountScopeStaff = staff.find(member => member.staffEmail.toLowerCase() === accountScopeStaffEmail.toLowerCase());
  const assignmentResults = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return [];
    return staff.filter(member => [member.staffName, member.staffEmail, member.staffRole, member.department ?? ""].some(value => value.toLowerCase().includes(query))).slice(0, 12);
  }, [search, staff]);
  const selectedAssignmentStaff = assignmentResults.length === 1 ? assignmentResults[0] : staff.find(member => member.staffEmail.toLowerCase() === search.trim().toLowerCase()) ?? null;
  const departmentLabels = useMemo(() => {
    const rows = facilityDepartments ?? [];
    const byId = new Map(rows.map(row => [row.id, row.departmentName]));
    return new Map(rows.map(row => [row.id, row.parentDepartmentId && byId.get(row.parentDepartmentId) ? `${byId.get(row.parentDepartmentId)} → ${row.departmentName}` : row.departmentName]));
  }, [facilityDepartments]);
  const formatDepartmentLabel = (departmentId: number, fallback: string) => departmentLabels.get(departmentId) ?? fallback;
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return staff;
    return staff.filter(member => [member.staffName, member.staffEmail, member.staffRole, member.department ?? "", roleLabel(member.governanceRole),
      ].some(value => value.toLowerCase().includes(query)));
  }, [search, staff]);
  const mismatchReviews = useMemo(() => (mismatchReports ?? []).map(report => {
    let details: { staffMemberId?: number | null; providerUserId?: number | null; departmentId?: number | null; reason?: string ;
        } = {};
    try { details = report.notes ? (JSON.parse(report.notes) as typeof details )
            : {}; } catch { details = {}; }
    return { report, details, staff: staff.find(member => member.id === details.staffMemberId || member.userId === details.providerUserId) ?? null ,
        };
  }), [mismatchReports, staff]);

  return (
    <div className="space-y-6">
      <Card>
      <CardHeader>
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
          <div>
            <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" />People & roles</CardTitle>
            <CardDescription>Maintain the shared institutional roster and make provider responsibility explicit for IERS operations.</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => void refetch()} disabled={isFetching}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50/60 p-3 text-sm text-blue-900 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-100">
          <ShieldCheck className="h-4 w-4 shrink-0" />
          <span>CPD-confirmed permanent and outreach/locum facilities appear here as linked general-staff accounts. Administrators may reallocate a current department or retire a person; neither action creates an IERS responsibility automatically.</span>
        </div>
        <div className="grid grid-cols-2 gap-2 rounded-lg border bg-muted/20 p-1 sm:grid-cols-3 lg:grid-cols-6" aria-label="People and roles sections">
          {([
            ["assignments", "Role assignments"],
            ["roster", "Directory"],
            ["role_map", "Role guide"],
            ["duties", "IERS duties"],
            ["product_roles", "Advanced product roles"],
            ["scopes", "Advanced scopes"],
          ] as const).map(([value, label]) => (
            <Button key={value} type="button" size="sm" variant={activeSection === value ? "default" : "ghost"} className="min-w-0 whitespace-normal text-xs sm:text-sm" onClick={() => setActiveSection(value)}>{label}</Button>
          ))}
        </div>
        {activeSection === "assignments" && (
          <Card className="border-primary/20 bg-primary/[0.02]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><UserCheck className="h-5 w-5" />Assign institutional responsibilities</CardTitle>
              <CardDescription>Search for one person first. The six operational role families are shown here; the existing protected assignment workflows are used for the final write.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {(departmentHeads ?? []).length > 0 && (
                <div className="rounded-lg border bg-background p-3">
                  <p className="mb-2 text-sm font-semibold">Saved Departmental Heads</p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {(departmentHeads ?? []).map(head => (
                      <div key={head.id} className="rounded-md border px-3 py-2 text-sm">
                        <p className="font-medium">{head.department || "Department"}</p>
                        <p className="text-xs text-muted-foreground">{head.fullName || "Unresolved account"}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="relative max-w-xl"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input className="pl-9" placeholder="Search by staff name or email" value={search} onChange={event => setSearch(event.target.value)} /></div>
              {search.trim() && !selectedAssignmentStaff && assignmentResults.length > 0 && <div className="grid gap-2 rounded-lg border p-2">{assignmentResults.map(member => <button key={member.id} type="button" className="rounded-md p-3 text-left hover:bg-muted" onClick={() => setSearch(member.staffEmail)}><span className="block font-medium">{member.staffName}</span><span className="block text-xs text-muted-foreground">{member.staffEmail} · {member.department || "No department"}</span></button>)}</div>}
              {!selectedAssignmentStaff ? <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">Select a person to see the responsibilities available for assignment.</p> : (
                <div className="space-y-4 rounded-lg border bg-background p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-semibold">{selectedAssignmentStaff.staffName}</p><p className="text-sm text-muted-foreground">{selectedAssignmentStaff.staffEmail}</p><p className="text-xs text-muted-foreground">Current department: {selectedAssignmentStaff.department || "Not assigned"}</p></div><Badge variant="outline">{selectedAssignmentStaff.facilityLinkStatus === "linked" ? "Institution-linked" : "Roster record"}</Badge></div>
                  <label className="block max-w-xl space-y-1 text-sm"><span className="font-medium">Department scope for a departmental role</span><Select value={assignmentDepartmentId} onValueChange={setAssignmentDepartmentId}><SelectTrigger><SelectValue placeholder="Select canonical department" /></SelectTrigger><SelectContent>{(facilityDepartments ?? []).map(department => <SelectItem key={department.id} value={String(department.id)}>{formatDepartmentLabel(department.id, department.departmentName)}</SelectItem>)}</SelectContent></Select></label>
                  <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-3 dark:border-amber-900 dark:bg-amber-950/20">
                    <p className="text-sm font-medium">Correct this person’s roster department</p>
                    <p className="mb-2 text-xs text-muted-foreground">Use this when the person is in the wrong department or a stale mismatch alert is unavailable.</p>
                    <div className="grid gap-2 md:grid-cols-[1fr_1fr_auto] md:items-end">
                      <Select value={assignmentDepartmentId} onValueChange={setAssignmentDepartmentId}><SelectTrigger><SelectValue placeholder="Move to canonical department" /></SelectTrigger><SelectContent>{(facilityDepartments ?? []).map(department => <SelectItem key={department.id} value={String(department.id)}>{formatDepartmentLabel(department.id, department.departmentName)}</SelectItem>)}</SelectContent></Select>
                      <Input value={directDepartmentReason} onChange={event => setDirectDepartmentReason(event.target.value)} placeholder="Reason (at least 10 characters)" />
                      <Button type="button" disabled={!assignmentDepartmentId || directDepartmentReason.trim().length < 10 || reallocationMutation.isPending} onClick={() => reallocationMutation.mutate({ institutionId, staffMemberId: selectedAssignmentStaff.id, departmentId: Number(assignmentDepartmentId), reason: directDepartmentReason.trim() })}>{reallocationMutation.isPending ? "Saving…" : "Update department"}</Button>
                    </div>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <RoleAssignmentCard title="Institutional Emergency Response Coordinator" scope="Whole institution" detail="Assign the IERS coordinator product role." actionLabel="Assign IERS coordinator" onClick={() => grantProductRole.mutate({ institutionId, productKey: "iers", invitedEmail: selectedAssignmentStaff.staffEmail, userId: selectedAssignmentStaff.userId ?? undefined, roleKey: "iers_coordinator" })} disabled={!selectedAssignmentStaff.userId || grantProductRole.isPending} />
                    <RoleAssignmentCard title="Institutional CPD Coordinator" scope="Whole institution" detail="Assign the CPD coordinator product role." actionLabel="Assign CPD coordinator" onClick={() => grantProductRole.mutate({ institutionId, productKey: "cpd_portal", invitedEmail: selectedAssignmentStaff.staffEmail, userId: selectedAssignmentStaff.userId ?? undefined, roleKey: "cpd_coordinator" })} disabled={!selectedAssignmentStaff.userId || grantProductRole.isPending} />
                    <RoleAssignmentCard title="Institutional administrator" scope="Whole institution" detail="Uses the protected multi-admin account workflow." actionLabel="Assign institutional admin" onClick={() => selectedAssignmentStaff.userId && inviteInstitutionAdmin.mutate({ institutionId, userId: selectedAssignmentStaff.userId })} disabled={!selectedAssignmentStaff.userId || inviteInstitutionAdmin.isPending} />
                    <RoleAssignmentCard title="Departmental Head" scope={assignmentDepartmentId ? formatDepartmentLabel(Number(assignmentDepartmentId), "Selected department") : "Choose department"} detail="One active head per canonical department." actionLabel="Assign Departmental Head" onClick={() => selectedAssignmentStaff.userId && assignmentDepartmentId && assignDepartmentHead.mutate({ institutionId, departmentId: Number(assignmentDepartmentId), userId: selectedAssignmentStaff.userId })} disabled={!selectedAssignmentStaff.userId || !assignmentDepartmentId || assignDepartmentHead.isPending} />
                    <RoleAssignmentCard title="ERCo" scope={assignmentDepartmentId ? formatDepartmentLabel(Number(assignmentDepartmentId), "Selected department") : "Choose department"} detail="Requires an active linked eligible nurse in the selected department." actionLabel="Assign ERCo" onClick={() => selectedAssignmentStaff.userId && assignmentDepartmentId && assignErco.mutate({ institutionId, departmentId: Number(assignmentDepartmentId), coordinatorUserId: selectedAssignmentStaff.userId, effectiveFrom: new Date().toISOString().slice(0, 10), effectiveUntil: null })} disabled={!selectedAssignmentStaff.userId || !assignmentDepartmentId || assignErco.isPending} />
                    <RoleAssignmentCard title="Departmental CPD Coordinator" scope={assignmentDepartmentId ? formatDepartmentLabel(Number(assignmentDepartmentId), "Selected department") : "Choose department"} detail="Requires active linked staff in the selected department." actionLabel="Assign CPD Coordinator" onClick={() => selectedAssignmentStaff.userId && assignmentDepartmentId && assignEducationCoordinator.mutate({ institutionId, departmentId: Number(assignmentDepartmentId), userId: selectedAssignmentStaff.userId })} disabled={!selectedAssignmentStaff.userId || !assignmentDepartmentId || assignEducationCoordinator.isPending} />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
        {activeSection === "roster" && (
          <>
        {mismatchReviews.length > 0 && (
            <Card className="border-amber-300 bg-amber-50/40 dark:border-amber-900 dark:bg-amber-950/20">
          <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-base"><AlertTriangle className="h-4 w-4 text-amber-700" />Department mismatch alerts</CardTitle><CardDescription>ERCos have flagged providers whose CPD/profile evidence points to a department but whose current institutional roster does not. Resolve each alert by reallocating the department or retiring the person; no new IERS duty is assigned automatically.</CardDescription></CardHeader>
          <CardContent className="space-y-3">
            {mismatchReviews.map(({ report, details, staff: mismatchStaff }) => (
                    <div key={report.id} className="rounded-lg border bg-background p-3">
              <p className="text-sm font-medium">{report.gapIdentified}</p>
              <p className="mt-1 text-xs text-muted-foreground">Reason: {details.reason ?? "Not provided"} · Reported {" "}
                        {formatDutyDate(report.createdAt)}</p>
              {mismatchStaff ? (
                        <div className="mt-3 grid gap-2 md:grid-cols-[1fr_1fr_auto] md:items-end">
                <label className="space-y-1 text-xs"><span className="font-medium">Reallocate to current department</span><Select value={reallocationReportId === report.id ? reallocationDepartmentId : ""} onValueChange={value => { setReallocationReportId(report.id); setReallocationDepartmentId(value); }}><SelectTrigger><SelectValue placeholder="Choose department" /></SelectTrigger><SelectContent>{(facilityDepartments ?? []).map(department => (
                                  <SelectItem key={department.id} value={String(department.id)}>{formatDepartmentLabel(department.id, department.departmentName)}</SelectItem>))}</SelectContent></Select></label>
                <label className="space-y-1 text-xs"><span className="font-medium">Reason</span><Input value={reallocationReportId === report.id ? reallocationReason : ""} onChange={event => { setReallocationReportId(report.id); setReallocationReason(event.target.value); }} placeholder="At least 10 characters" /></label>
                <div className="flex flex-col gap-2 sm:flex-row md:flex-col"><Button type="button" size="sm" disabled={reallocationReportId !== report.id || !reallocationDepartmentId || reallocationReason.trim().length < 10 || reallocationMutation.isPending} onClick={() => reallocationMutation.mutate({ institutionId, staffMemberId: mismatchStaff.id, departmentId: Number(reallocationDepartmentId), reason: reallocationReason.trim(), mismatchReportId: report.id ,
                                })}>{reallocationMutation.isPending ? "Saving…" : "Reallocate"}</Button>{<Button type="button" size="sm" variant="secondary" disabled={resolveMismatch.isPending} onClick={() => resolveMismatch.mutate({ institutionId, mismatchReportId: report.id, resolution: "already_corrected", reason: "Administrator confirmed the current roster state and is closing this stale mismatch report." })}>{resolveMismatch.isPending ? "Resolving…" : "Mark resolved"}</Button>}<Button type="button" size="sm" variant="destructive" disabled={removeMember.isPending || retireStaffRecord.isPending} onClick={() => { setRemovalTarget(mismatchStaff); setRemovalReason("Department mismatch reported; retiring from institution after administrator review."); setRemovalReportId(report.id); }}>Retire</Button></div>
              </div> ) : ( <p className="mt-2 text-xs text-amber-800">The linked staff row is no longer available. Refresh the roster and review the account’s membership history.</p>)}
            </div>))}
          </CardContent>
        </Card>)}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search name, email, department, or role" value={search} onChange={event => setSearch(event.target.value)} />
          </div>
          <Button type="button" size="sm" variant={showRetired ? "secondary" : "outline"} className="w-full sm:w-auto" onClick={() => setShowRetired(current => !current)}>
            {showRetired ? "Hide retired history" : "Show retired history"}
          </Button>
        </div>
        {unlinkTarget && (
          <div className="space-y-3 rounded-lg border border-amber-300 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/30">
            <div className="flex items-start gap-2"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" /><div className="min-w-0"><p className="font-medium text-amber-900 dark:text-amber-100">Unlink {unlinkTarget.staffName} from this institution?</p><p className="text-xs text-amber-800 dark:text-amber-200">This ends institutional access and future IERS duties but keeps the platform account, CPD history, and staff audit record. A later CPD attendance will not silently reactivate the membership.</p></div></div>
            <Input placeholder="Required reason (at least 10 characters)" value={unlinkReason} onChange={event => setUnlinkReason(event.target.value)} />
            <div className="flex flex-col gap-2 sm:flex-row"><Button type="button" className="w-full sm:w-auto" disabled={!unlinkTarget.membershipId || unlinkReason.trim().length < 10 || unlinkMember.isPending} onClick={() => unlinkTarget.membershipId && unlinkMember.mutate({ institutionId, membershipId: unlinkTarget.membershipId, reason: unlinkReason.trim() ,
                    })}>{unlinkMember.isPending ? "Unlinking…" : "Confirm unlink"}</Button><Button type="button" variant="outline" className="w-full sm:w-auto" disabled={unlinkMember.isPending} onClick={() => { setUnlinkTarget(null); setUnlinkReason(""); }}>Cancel</Button></div>
          </div>
        )}
        {restoreTarget && (
          <div className="space-y-3 rounded-lg border border-emerald-300 bg-emerald-50 p-4 dark:border-emerald-900 dark:bg-emerald-950/30">
            <div className="flex items-start gap-2">
              <UserCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700 dark:text-emerald-300" />
              <div className="min-w-0">
                <p className="font-medium text-emerald-900 dark:text-emerald-100">Restore {restoreTarget.staffName} to this institution?</p>
                <p className="text-xs text-emerald-800 dark:text-emerald-200">This restores a general institution link only. Previous IERS duties, product roles, and administrative scopes are not restored automatically; any new operational responsibility must be assigned and accepted again.</p>
              </div>
            </div>
            <Input placeholder="Required reason (at least 10 characters)" value={restoreReason} onChange={event => setRestoreReason(event.target.value)} />
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button type="button" className="w-full bg-emerald-700 hover:bg-emerald-800 sm:w-auto" disabled={restoreReason.trim().length < 10 || restoreRetiredLink.isPending} onClick={() => restoreRetiredLink.mutate({ institutionId, staffMemberId: restoreTarget.id, reason: restoreReason.trim() ,
                    })}>{restoreRetiredLink.isPending ? "Restoring…" : "Confirm re-link"}</Button>
              <Button type="button" variant="outline" className="w-full sm:w-auto" disabled={restoreRetiredLink.isPending} onClick={() => { setRestoreTarget(null); setRestoreReason(""); }}>Cancel</Button>
            </div>
          </div>
        )}
        {removalTarget && (
          <div className="space-y-3 rounded-lg border border-red-300 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/30">
            <div className="flex items-start gap-2">
              <UserMinus className="mt-0.5 h-4 w-4 shrink-0 text-red-700 dark:text-red-300" />
              <div className="min-w-0">
                <p className="font-medium text-red-900 dark:text-red-100">Remove {removalTarget.staffName} from this institution?</p>
                <p className="text-xs text-red-800 dark:text-red-200">This ends institutional access and future duties. It does not delete the person’s platform account, CPD history, or accepted historical IERS evidence.</p>
              </div>
            </div>
            <Input placeholder="Required reason (at least 10 characters)" value={removalReason} onChange={event => setRemovalReason(event.target.value)} />
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button type="button" variant="destructive" className="w-full sm:w-auto" disabled={removalReason.trim().length < 10 || removeMember.isPending || retireStaffRecord.isPending} onClick={() => { if (removalTarget.membershipId) { removeMember.mutate({ institutionId, membershipId: removalTarget.membershipId, reason: removalReason.trim(), mismatchReportId: removalReportId ?? undefined ,
                      }); } else { retireStaffRecord.mutate({ institutionId, staffMemberId: removalTarget.id, reason: removalReason.trim(), mismatchReportId: removalReportId ?? undefined ,
                      }); } }}>{removeMember.isPending || retireStaffRecord.isPending ? "Removing…" : removalTarget.membershipId ? "Confirm removal" : "Retire roster record"}</Button>
              <Button type="button" variant="outline" className="w-full sm:w-auto" disabled={removeMember.isPending} onClick={() => { setRemovalTarget(null); setRemovalReason(""); }}>Cancel</Button>
            </div>
          </div>
        )}
        {isLoading ? (
          <div className="flex items-center justify-center py-10 text-muted-foreground"><Loader2 className="mr-2 h-5 w-5 animate-spin" />Loading institutional roster…</div>
        ) : filtered.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">{search ? "No staff match this search." : "No staff are linked to this institution yet."}</div>
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Provider / staff member</TableHead>
                  <TableHead>Clinical role</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>IERS responsibility</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Institution access</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(member => {
                  const currentRole = (member.governanceRole ?? "general_staff") as GovernanceRole;
                  const isRemoved = member.removedAt != null || member.membershipStatus === "ended";
                  return (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div className="font-medium">{member.staffName}</div>
                        <div className="text-xs text-muted-foreground">{member.staffEmail}</div>
                      </TableCell>
                      <TableCell><Badge variant="outline" className="capitalize">{member.staffRole.replaceAll("_", " ")}</Badge></TableCell>
                      <TableCell className="text-sm text-muted-foreground">{member.department || "Not assigned"}</TableCell>
                      <TableCell><Badge variant="outline">Assigned from Role assignments</Badge></TableCell>
                      <TableCell><Badge variant={isRemoved ? "destructive" : member.facilityLinkStatus === "linked" ? "default" : "secondary"}>{isRemoved ? "Retired · access ended" : member.facilityLinkStatus === "linked" ? "Linked" : (member.facilityLinkStatus ?? "Roster only")}</Badge></TableCell>
                      <TableCell>
                        {isRemoved ? (member.userId ? (
                              <Button type="button" size="sm" variant="outline" className="text-emerald-700" onClick={() => { setRestoreTarget(member); setRestoreReason(""); }} disabled={restoreRetiredLink.isPending}><UserCheck className="mr-2 h-4 w-4" />Restore institution link</Button> ) : ( <span className="text-xs text-muted-foreground">Account link required before restoration</span>) ) : member.membershipId ? (
                            <div className="flex flex-wrap gap-2"><Button type="button" size="sm" variant="outline" className="text-amber-700" onClick={() => { setUnlinkTarget(member); setUnlinkReason(""); }} disabled={unlinkMember.isPending || removeMember.isPending || retireStaffRecord.isPending}><AlertTriangle className="mr-2 h-4 w-4" />Unlink</Button><Button type="button" size="sm" variant="outline" className="text-red-700" onClick={() => { setRemovalTarget(member); setRemovalReason(""); setRemovalReportId(null); }} disabled={removeMember.isPending || retireStaffRecord.isPending || unlinkMember.isPending}><UserMinus className="mr-2 h-4 w-4" />Retire</Button></div> ) : ( <Button type="button" size="sm" variant="outline" className="text-red-700" onClick={() => { setRemovalTarget(member); setRemovalReason(""); setRemovalReportId(null); }} disabled={removeMember.isPending || retireStaffRecord.isPending}><UserMinus className="mr-2 h-4 w-4" />Retire from roster</Button>)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
        <p className="text-xs text-muted-foreground">Use the roster import or add-staff workflow below to add people. A responsibility role should be assigned only after the institution confirms the provider’s operational scope.</p>
          </>
        )}
      </CardContent>
      </Card>

    {activeSection === "role_map" && (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5" />Institutional authority map</CardTitle>
          <CardDescription>Use the narrowest role that matches the work. Institution-wide roles govern the whole institution; Departmental Heads, ERCo staff, and Departmental CPD Coordinators remain limited to their department.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="border-b bg-muted/30 text-left text-xs uppercase tracking-wide text-muted-foreground"><tr><th className="p-3">Role</th><th className="p-3">Scope</th><th className="p-3">Authority</th><th className="p-3">Assignment owner</th></tr></thead>
              <tbody>
                <tr className="border-b"><td className="p-3 font-medium">Institutional administrator</td><td className="p-3">Whole institution</td><td className="p-3">Manages staff roles, institutional Emergency Response Coordinator, Institutional CPD Coordinator, Departmental Heads, product roles, and shared scopes.</td><td className="p-3">Platform/institution administration</td></tr>
                <tr className="border-b"><td className="p-3 font-medium">Institutional Emergency Response Coordinator</td><td className="p-3">Whole institution</td><td className="p-3">All IERS governance, readiness, ERCo, department-preparedness, response, evidence, and review roles.</td><td className="p-3">Institutional administrator</td></tr>
                <tr className="border-b"><td className="p-3 font-medium">Institutional CPD Coordinator</td><td className="p-3">Whole institution</td><td className="p-3">All CPD coordination, Departmental CPD Coordinator appointments, institutional CPD scheduling, attendance, and reporting.</td><td className="p-3">Institutional administrator</td></tr>
                <tr className="border-b"><td className="p-3 font-medium">Departmental Head</td><td className="p-3">Appointed department</td><td className="p-3">Assigns that department’s ERCo and Departmental CPD Coordinator; cannot administer another department.</td><td className="p-3">Institutional administrator</td></tr>
                <tr className="border-b"><td className="p-3 font-medium">ERCo</td><td className="p-3">Assigned department</td><td className="p-3">Manages the department UTL staffing roster. ERCo governance remains separate from dated responder duty acceptance.</td><td className="p-3">Institutional Chair, IERS governance, or Departmental Head</td></tr>
                <tr><td className="p-3 font-medium">Departmental CPD Coordinator</td><td className="p-3">Assigned department</td><td className="p-3">Manages the department CPD roster and department learning coordination.</td><td className="p-3">Institutional CPD Coordinator or Departmental Head</td></tr>
              </tbody>
            </table>
          </div>
          <div className="rounded-lg border border-blue-200 bg-blue-50/60 p-4 dark:border-blue-900 dark:bg-blue-950/20">
            <p className="font-medium text-sm text-blue-950 dark:text-blue-100">Where to assign each role</p>
            <p className="mt-1 text-xs text-blue-900/80 dark:text-blue-200/80">The platform keeps institutional administration, product permissions, and department appointments separate so a broad role cannot accidentally grant wider access.</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              <Button type="button" variant="outline" size="sm" onClick={() => setActiveSection("product_roles")}>Assign IERS / CPD product roles</Button>
              <Button type="button" variant="outline" size="sm" onClick={() => setActiveSection("scopes")}>Assign shared account scopes</Button>
              <Button type="button" variant="outline" size="sm" asChild><a href="?section=administration&adminTab=institution&peopleTab=access_links">Assign institutional administrator</a></Button>
              <Button type="button" variant="outline" size="sm" asChild><a href="?section=iers&iersTab=command">Assign ERCo / IERS department appointments</a></Button>
              <Button type="button" variant="outline" size="sm" asChild><a href="?section=learning&learningTab=governance">Assign Departmental CPD Coordinator</a></Button>
              <Button type="button" variant="outline" size="sm" asChild><a href="?section=administration&adminTab=institution&peopleTab=departments">Set department membership and scope</a></Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">Role assignment does not prove clinical competence, provider acceptance, or emergency dispatch availability. Those states remain separately recorded and auditable.</p>
        </CardContent>
      </Card>
    )}

    {activeSection === "duties" && (
        <Card>
      <CardHeader>
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
          <div>
            <CardTitle className="flex items-center gap-2"><CalendarClock className="h-5 w-5" />IERS duty assignments</CardTitle>
            <CardDescription>Read-only visibility for ERCo governance appointments, optional Assistant ERCo coverage, ERTL duties, and UTL duties. An ERCo appointment is not a day-to-day response shift; providers must accept their own dated UTL or ERTL duty in the Individual portal.</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => void refetchIersDuties()} disabled={iersDutiesFetching}>
            <RefreshCw className={`mr-2 h-4 w-4 ${iersDutiesFetching ? "animate-spin" : ""}`} />Refresh duties
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {iersDutiesLoading ? (
          <div className="flex items-center justify-center py-8 text-sm text-muted-foreground"><Loader2 className="mr-2 h-4 w-4 animate-spin" />Loading IERS duties…</div>
        ) : !(iersDuties?.erco.length || iersDuties?.ertl.length || iersDuties?.utl.length) ? (
          <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">No current or pending dated IERS duties are assigned.</div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {[
              ...(iersDuties?.erco ?? []),
              ...(iersDuties?.ertl ?? []),
              ...(iersDuties?.utl ?? []),
            ].map(duty => {
              const shiftType = "shiftType" in duty ? duty.shiftType : null;
              const readinessSignOffAt = "readinessSignOffAt" in duty ? duty.readinessSignOffAt : null;
              const weekLabel = "weekNumber" in duty && duty.weekNumber && duty.year ? `Week ${duty.weekNumber}, ${duty.year}` : null;
              return (
                <div key={`${duty.dutyType}-${duty.id}`} className="min-w-0 rounded-lg border bg-muted/10 p-4">
                  <div className="flex min-w-0 flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium break-words">{duty.providerName ?? "Provider not linked"}</p>
                      <p className="break-all text-xs text-muted-foreground">{duty.providerEmail ?? "No provider identity"}</p>
                    </div>
                    <div className="flex max-w-full flex-wrap gap-1">
                      <Badge variant="outline" className="whitespace-normal">{duty.dutyType}</Badge>
                      <Badge variant={dutyStatusVariant(duty.assignmentStatus)}>{duty.assignmentStatus.replaceAll("_", " ")}</Badge>
                    </div>
                  </div>
                  <div className="mt-3 grid min-w-0 gap-2 text-xs text-muted-foreground sm:grid-cols-2">
                    <span className="break-words"><strong className="text-foreground">Department:</strong> {" "}
                          {duty.departmentName ?? "Not assigned"}</span>
                    <span className="break-words"><strong className="text-foreground">Pole:</strong> {" "}
                          {duty.poleName ?? "Not assigned"}</span>
                      <span><strong className="text-foreground">Appointment/duty starts:</strong> {" "}
                          {formatDutyDate(duty.effectiveFrom)}</span>
                    <span><strong className="text-foreground">Appointment/duty ends:</strong> {" "}
                          {formatDutyDate(duty.effectiveUntil)}</span>
                    {weekLabel && (
                          <span><strong className="text-foreground">Rotation:</strong> {" "}
                            {weekLabel}</span>)}
                    {shiftType && (
                          <span><strong className="text-foreground">Shift:</strong> {" "}
                            {shiftType}</span>)}
                    <span><strong className="text-foreground">Accepted:</strong> {" "}
                          {formatDutyDate(duty.acceptedAt)}</span>
                    {readinessSignOffAt && (
                          <span><strong className="text-foreground">Readiness:</strong> {" "}
                            {formatDutyDate(readinessSignOffAt)}</span>)}
                  </div>
                  {duty.declineReason && (
                        <p className="mt-3 break-words rounded border border-red-200 bg-red-50 p-2 text-xs text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200"><strong>Decline reason:</strong> {duty.declineReason}</p>)}
                  <p className="mt-3 text-xs text-muted-foreground">This view is oversight only. An ERCo role is governance; a UTL or ERTL row is a separate dated duty. A role, roster row, or assignment does not prove provider acceptance, competency, or emergency dispatch.</p>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>)}

    {activeSection === "product_roles" && (
        <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><KeyRound className="h-5 w-5" />Product permissions</CardTitle>
                  <CardDescription>Assign a separate IERS or CPD product role to a linked provider. For IERS, the Lead, reviewer, response operator, and viewer roles govern portal access; dated ERCo, ERTL, and UTL duties remain separate and require provider acceptance.</CardDescription>

      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-2"><label className="text-sm font-medium">Product</label><select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={roleProduct} onChange={event => { setRoleProduct(event.target.value as "iers" | "cpd_portal"); setRoleKey(""); }}><option value="iers">IERS</option><option value="cpd_portal">CPD Portal</option></select></div>
          <div className="space-y-2"><label className="text-sm font-medium">Staff member</label><select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={roleStaffEmail} onChange={event => setRoleStaffEmail(event.target.value)}><option value="">Select staff member</option>{staff.map(member => (
                    <option key={member.id} value={member.staffEmail}>{member.staffName} — {member.staffEmail}</option>))}</select></div>
          <div className="space-y-2"><label className="text-sm font-medium">Product role</label><select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={roleKey} onChange={event => setRoleKey(event.target.value)}><option value="">Select role</option>{(roleDefinitions ?? []).map(definition => (
                    <option key={definition.roleKey} value={definition.roleKey}>{definition.label}</option>))}</select></div>
        </div>
        {roleKey && (
              <p className="text-xs text-muted-foreground">{roleDefinitions?.find(definition => definition.roleKey === roleKey)?.description}</p>)}
        <Button type="button" onClick={() => selectedRoleStaff && grantProductRole.mutate({ institutionId, productKey: roleProduct, invitedEmail: selectedRoleStaff.staffEmail, userId: selectedRoleStaff.userId ?? undefined, roleKey ,
                })} disabled={!selectedRoleStaff || !roleKey || grantProductRole.isPending}><KeyRound className="mr-2 h-4 w-4" />{grantProductRole.isPending ? "Assigning…" : "Assign product role"}</Button>

        <div className="rounded-lg border">
          <div className="border-b bg-muted/30 px-4 py-3 text-sm font-medium">Assigned and historical product roles</div>
          {productRolesLoading ? (
                <p className="p-4 text-sm text-muted-foreground">Loading product roles…</p> ) : !productRoles?.length ? (
                <p className="p-4 text-sm text-muted-foreground">No explicit product roles have been assigned yet. Existing institution administrators retain shared admin access.</p> ) : ( <div className="divide-y">{productRoles.map(assignment => (
                    <div key={assignment.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-medium">{assignment.invitedEmail}</p><p className="text-xs text-muted-foreground">{assignment.productName} · {" "}
                          {assignment.roleKey.replaceAll("_", " ")}</p><p className="mt-1 text-xs"><Badge variant={assignment.roleStatus === "active" ? "default" : assignment.roleStatus === "ended" ? "outline" : "secondary"}>{assignment.roleStatus}</Badge></p></div><div className="flex flex-wrap gap-2">{assignment.roleStatus === "active" && (
                          <Button type="button" size="sm" variant="outline" disabled={setProductRoleStatus.isPending} onClick={() => setProductRoleStatus.mutate({ institutionId, roleId: assignment.id, roleStatus: "suspended", reason: "Suspended by institution administrator pending role review." ,
                              })}>Suspend</Button>)}{assignment.roleStatus === "suspended" && (
                          <Button type="button" size="sm" variant="outline" disabled={setProductRoleStatus.isPending} onClick={() => setProductRoleStatus.mutate({ institutionId, roleId: assignment.id, roleStatus: "active", reason: "Reactivated by institution administrator after role review." ,
                              })}>Reactivate</Button>)}{assignment.roleStatus !== "ended" && (
                          <Button type="button" size="sm" variant="ghost" className="text-red-700" disabled={setProductRoleStatus.isPending} onClick={() => setProductRoleStatus.mutate({ institutionId, roleId: assignment.id, roleStatus: "ended", reason: "Ended by institution administrator." ,
                              })}>End</Button>)}</div></div>))}</div>)}
        </div>
      </CardContent>
    </Card>)}

    {activeSection === "scopes" && (
        <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5" />Shared institution scopes</CardTitle>
        <CardDescription>Assign non-product administrative responsibilities without granting IERS or CPD operational access.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-2"><label className="text-sm font-medium">Staff member</label><select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={accountScopeStaffEmail} onChange={event => setAccountScopeStaffEmail(event.target.value)}><option value="">Select staff member</option>{staff.map(member => (
                    <option key={member.id} value={member.staffEmail}>{member.staffName} — {member.staffEmail}</option>))}</select></div>
          <div className="space-y-2"><label className="text-sm font-medium">Institution scope</label><select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={accountScopeKey} onChange={event => setAccountScopeKey(event.target.value)}><option value="">Select scope</option>{(accountScopeDefinitions ?? []).map(definition => (
                    <option key={definition.scopeKey} value={definition.scopeKey}>{definition.label}</option>))}</select></div>
          <div className="flex items-end"><Button type="button" onClick={() => selectedAccountScopeStaff && grantAccountScope.mutate({ institutionId, invitedEmail: selectedAccountScopeStaff.staffEmail, userId: selectedAccountScopeStaff.userId ?? undefined, scopeKey: accountScopeKey ,
                    })} disabled={!selectedAccountScopeStaff || !accountScopeKey || grantAccountScope.isPending}><ShieldCheck className="mr-2 h-4 w-4" />{grantAccountScope.isPending ? "Assigning…" : "Assign shared scope"}</Button></div>
        </div>
        {accountScopeKey && (
              <p className="text-xs text-muted-foreground">{accountScopeDefinitions?.find(definition => definition.scopeKey === accountScopeKey)?.description}</p>)}
        <div className="rounded-lg border">
          <div className="border-b bg-muted/30 px-4 py-3 text-sm font-medium">Assigned and historical shared scopes</div>
          {accountScopesLoading ? (
                <p className="p-4 text-sm text-muted-foreground">Loading shared scopes…</p> ) : !accountScopes?.length ? (
                <p className="p-4 text-sm text-muted-foreground">No explicit shared scopes have been assigned.</p> ) : ( <div className="divide-y">{accountScopes.map(scope => (
                    <div key={scope.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-medium">{scope.invitedEmail}</p><p className="text-xs text-muted-foreground">{scope.scopeKey.replaceAll("_", " ")}</p><p className="mt-1 text-xs"><Badge variant={scope.scopeStatus === "active" ? "default" : scope.scopeStatus === "ended" ? "outline" : "secondary"}>{scope.scopeStatus}</Badge></p></div><div className="flex flex-wrap gap-2">{scope.scopeStatus === "active" && (
                          <Button type="button" size="sm" variant="outline" disabled={setAccountScopeStatus.isPending} onClick={() => setAccountScopeStatus.mutate({ institutionId, scopeId: scope.id, scopeStatus: "suspended", reason: "Suspended by institution administrator pending scope review." ,
                              })}>Suspend</Button>)}{scope.scopeStatus === "suspended" && (
                          <Button type="button" size="sm" variant="outline" disabled={setAccountScopeStatus.isPending} onClick={() => setAccountScopeStatus.mutate({ institutionId, scopeId: scope.id, scopeStatus: "active", reason: "Reactivated by institution administrator after scope review." ,
                              })}>Reactivate</Button>)}{scope.scopeStatus !== "ended" && (
                          <Button type="button" size="sm" variant="ghost" className="text-red-700" disabled={setAccountScopeStatus.isPending} onClick={() => setAccountScopeStatus.mutate({ institutionId, scopeId: scope.id, scopeStatus: "ended", reason: "Ended by institution administrator." ,
                              })}>End</Button>)}</div></div>))}</div>)}
        </div>
      </CardContent>
    </Card>)}
    </div>
  );
}


function RoleAssignmentCard({ title, scope, detail, actionLabel, onClick, href, disabled = false }: { title: string; scope: string; detail: string; actionLabel: string; onClick?: () => void; href?: string; disabled?: boolean }) {
  const content = (
    <>
      <div className="min-w-0">
        <p className="font-medium">{title}</p>
        <p className="mt-1 text-xs font-medium text-primary">{scope}</p>
        <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
      </div>
      <Button type="button" size="sm" variant="outline" className="mt-3 w-full" onClick={onClick} disabled={disabled}>{actionLabel}</Button>
    </>
  );
  return href ? <a className="block rounded-lg border bg-background p-4 transition-colors hover:border-primary/50 hover:bg-muted/30" href={href}>{content}</a> : <div className="rounded-lg border bg-background p-4">{content}</div>;
}
