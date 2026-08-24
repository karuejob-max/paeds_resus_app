import { useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { AlertTriangle, CalendarClock, KeyRound, Loader2, RefreshCw, Search, ShieldCheck, UserMinus, Users } from "lucide-react";

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
  return GOVERNANCE_ROLES.find(([value]) => value === role)?.[1] ?? "General staff";
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

export function InstitutionPeopleRolesPanel({ institutionId }: { institutionId: number }) {
  const utils = trpc.useUtils();
  const [search, setSearch] = useState("");
  const [roleProduct, setRoleProduct] = useState<"iers" | "cpd_portal">("iers");
  const [roleStaffEmail, setRoleStaffEmail] = useState("");
  const [roleKey, setRoleKey] = useState("");
  const [accountScopeStaffEmail, setAccountScopeStaffEmail] = useState("");
  const [accountScopeKey, setAccountScopeKey] = useState("");
  const [removalTarget, setRemovalTarget] = useState<StaffRow | null>(null);
  const [removalReason, setRemovalReason] = useState("");
  const [unlinkTarget, setUnlinkTarget] = useState<StaffRow | null>(null);
  const [unlinkReason, setUnlinkReason] = useState("");
  const [removalReportId, setRemovalReportId] = useState<number | null>(null);
  const [reallocationReportId, setReallocationReportId] = useState<number | null>(null);
  const [reallocationDepartmentId, setReallocationDepartmentId] = useState("");
  const [reallocationReason, setReallocationReason] = useState("");
  const [activeSection, setActiveSection] = useState<"roster" | "duties" | "product_roles" | "scopes">("roster");
  const { data, isLoading, isFetching, refetch } = trpc.institution.getStaffMembers.useQuery({ institutionId }, {
    enabled: !!institutionId,
    staleTime: 30_000,
  });
  const { data: mismatchReports } = trpc.institution.getDepartmentMismatchReports.useQuery({ institutionId }, {
    enabled: !!institutionId,
    staleTime: 30_000,
  });
  const { data: facilityDepartments } = trpc.institution.getFacilityDepartments.useQuery({ institutionId }, {
    enabled: !!institutionId,
    staleTime: 60_000,
  });
  const { data: productRoles, isLoading: productRolesLoading, refetch: refetchProductRoles } = trpc.institutionProducts.listProductRoles.useQuery({ institutionId }, {
    enabled: !!institutionId && activeSection === "product_roles",
    staleTime: 30_000,
  });
  const { data: roleDefinitions } = trpc.institutionProducts.getRoleDefinitions.useQuery({ productKey: roleProduct }, {
    enabled: activeSection === "product_roles",
    staleTime: 300_000,
  });
  const { data: accountScopes, isLoading: accountScopesLoading, refetch: refetchAccountScopes } = trpc.institutionProducts.listAccountScopes.useQuery({ institutionId }, {
    enabled: !!institutionId && activeSection === "scopes",
    staleTime: 30_000,
  });
  const { data: accountScopeDefinitions } = trpc.institutionProducts.getAccountScopeDefinitions.useQuery(undefined, {
    enabled: activeSection === "scopes",
    staleTime: 300_000,
  });
  const { data: iersDuties, isLoading: iersDutiesLoading, isFetching: iersDutiesFetching, refetch: refetchIersDuties } = trpc.institution.getInstitutionIersDutyAssignments.useQuery({ institutionId }, {
    enabled: !!institutionId && activeSection === "duties",
    staleTime: 30_000,
  });
  const updateRole = trpc.institution.updateStaffGovernanceRole.useMutation({
    onSuccess: async () => {
      toast.success("Responsibility role updated");
      await utils.institution.getStaffMembers.invalidate({ institutionId });
    },
    onError: (error) => toast.error(error.message || "Could not update responsibility role"),
  });
  const grantProductRole = trpc.institutionProducts.grantProductRole.useMutation({
    onSuccess: async () => {
      toast.success("Product role assigned");
      setRoleKey("");
      await utils.institutionProducts.listProductRoles.invalidate({ institutionId });
      await refetchProductRoles();
    },
    onError: (error) => toast.error(error.message || "Could not assign product role"),
  });
  const setProductRoleStatus = trpc.institutionProducts.setProductRoleStatus.useMutation({
    onSuccess: async () => {
      toast.success("Product role status updated");
      await utils.institutionProducts.listProductRoles.invalidate({ institutionId });
      await refetchProductRoles();
    },
    onError: (error) => toast.error(error.message || "Could not update product role status"),
  });
  const grantAccountScope = trpc.institutionProducts.grantAccountScope.useMutation({
    onSuccess: async () => {
      toast.success("Institution scope assigned");
      setAccountScopeKey("");
      await utils.institutionProducts.listAccountScopes.invalidate({ institutionId });
      await refetchAccountScopes();
    },
    onError: (error) => toast.error(error.message || "Could not assign institution scope"),
  });
  const setAccountScopeStatus = trpc.institutionProducts.setAccountScopeStatus.useMutation({
    onSuccess: async () => {
      toast.success("Institution scope status updated");
      await utils.institutionProducts.listAccountScopes.invalidate({ institutionId });
      await refetchAccountScopes();
    },
    onError: (error) => toast.error(error.message || "Could not update institution scope status"),
  });
  const removeMember = trpc.institution.removeInstitutionMember.useMutation({
    onSuccess: async () => {
      toast.success("Person removed from this institution");
      setRemovalTarget(null);
      setRemovalReason("");
      setRemovalReportId(null);
      await Promise.all([
        utils.institution.getStaffMembers.invalidate({ institutionId }),
        utils.institution.getInstitutionIersDutyAssignments.invalidate({ institutionId }),
        utils.institution.getDepartmentMismatchReports.invalidate({ institutionId }),
      ]);
    },
    onError: (error) => toast.error(error.message || "Could not remove this person"),
  });
  const unlinkMember = trpc.institution.unlinkInstitutionMember.useMutation({
    onSuccess: async () => {
      toast.success("Person unlinked from this institution; CPD history was retained.");
      setUnlinkTarget(null);
      setUnlinkReason("");
      await Promise.all([
        utils.institution.getStaffMembers.invalidate({ institutionId }),
        utils.institution.getDepartmentMismatchReports.invalidate({ institutionId }),
        utils.institution.getInstitutionIersDutyAssignments.invalidate({ institutionId }),
      ]);
    },
    onError: (error) => toast.error(error.message || "Could not unlink this person"),
  });
  const reallocationMutation = trpc.institution.reallocateInstitutionStaffDepartment.useMutation({
    onSuccess: async () => {
      toast.success("Staff department reallocated; any old IERS duties were ended for review.");
      setReallocationReportId(null);
      setReallocationDepartmentId("");
      setReallocationReason("");
      await Promise.all([
        utils.institution.getStaffMembers.invalidate({ institutionId }),
        utils.institution.getDepartmentMismatchReports.invalidate({ institutionId }),
        utils.institution.getInstitutionIersDutyAssignments.invalidate({ institutionId }),
      ]);
    },
    onError: (error) => toast.error(error.message || "Could not reallocate this department"),
  });

  const staff = (data ?? []) as StaffRow[];
  const selectedRoleStaff = staff.find((member) => member.staffEmail.toLowerCase() === roleStaffEmail.toLowerCase());
  const selectedAccountScopeStaff = staff.find((member) => member.staffEmail.toLowerCase() === accountScopeStaffEmail.toLowerCase());
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return staff;
    return staff.filter((member) => [member.staffName, member.staffEmail, member.staffRole, member.department ?? "", roleLabel(member.governanceRole)].some((value) => value.toLowerCase().includes(query)));
  }, [search, staff]);
  const mismatchReviews = useMemo(() => (mismatchReports ?? []).map((report) => {
    let details: { staffMemberId?: number | null; providerUserId?: number | null; departmentId?: number | null; reason?: string } = {};
    try { details = report.notes ? JSON.parse(report.notes) as typeof details : {}; } catch { details = {}; }
    return { report, details, staff: staff.find((member) => member.id === details.staffMemberId || member.userId === details.providerUserId) ?? null };
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
        <div className="grid grid-cols-2 gap-2 rounded-lg border bg-muted/20 p-1 sm:grid-cols-4" aria-label="People and roles sections">
          {([
            ["roster", "People roster"],
            ["duties", "IERS duties"],
            ["product_roles", "Product roles"],
            ["scopes", "Shared scopes"],
          ] as const).map(([value, label]) => (
            <Button key={value} type="button" size="sm" variant={activeSection === value ? "default" : "ghost"} className="min-w-0 whitespace-normal text-xs sm:text-sm" onClick={() => setActiveSection(value)}>{label}</Button>
          ))}
        </div>
        {mismatchReviews.length > 0 && <Card className="border-amber-300 bg-amber-50/40 dark:border-amber-900 dark:bg-amber-950/20">
          <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-base"><AlertTriangle className="h-4 w-4 text-amber-700" />Department mismatch alerts</CardTitle><CardDescription>ERCos have flagged providers whose CPD/profile evidence points to a department but whose current institutional roster does not. Resolve each alert by reallocating the department or retiring the person; no new IERS duty is assigned automatically.</CardDescription></CardHeader>
          <CardContent className="space-y-3">
            {mismatchReviews.map(({ report, details, staff: mismatchStaff }) => <div key={report.id} className="rounded-lg border bg-background p-3">
              <p className="text-sm font-medium">{report.gapIdentified}</p>
              <p className="mt-1 text-xs text-muted-foreground">Reason: {details.reason ?? "Not provided"} · Reported {formatDutyDate(report.createdAt)}</p>
              {mismatchStaff ? <div className="mt-3 grid gap-2 md:grid-cols-[1fr_1fr_auto] md:items-end">
                <label className="space-y-1 text-xs"><span className="font-medium">Reallocate to current department</span><Select value={reallocationReportId === report.id ? reallocationDepartmentId : ""} onValueChange={(value) => { setReallocationReportId(report.id); setReallocationDepartmentId(value); }}><SelectTrigger><SelectValue placeholder="Choose department" /></SelectTrigger><SelectContent>{(facilityDepartments ?? []).map((department) => <SelectItem key={department.id} value={String(department.id)}>{department.departmentName}</SelectItem>)}</SelectContent></Select></label>
                <label className="space-y-1 text-xs"><span className="font-medium">Reason</span><Input value={reallocationReportId === report.id ? reallocationReason : ""} onChange={(event) => { setReallocationReportId(report.id); setReallocationReason(event.target.value); }} placeholder="At least 10 characters" /></label>
                <div className="flex flex-col gap-2 sm:flex-row md:flex-col"><Button type="button" size="sm" disabled={reallocationReportId !== report.id || !reallocationDepartmentId || reallocationReason.trim().length < 10 || reallocationMutation.isPending} onClick={() => reallocationMutation.mutate({ institutionId, staffMemberId: mismatchStaff.id, departmentId: Number(reallocationDepartmentId), reason: reallocationReason.trim(), mismatchReportId: report.id })}>{reallocationMutation.isPending ? "Saving…" : "Reallocate"}</Button><Button type="button" size="sm" variant="destructive" disabled={!mismatchStaff.membershipId || removeMember.isPending} onClick={() => { setRemovalTarget(mismatchStaff); setRemovalReason("Department mismatch reported; retiring from institution after administrator review."); setRemovalReportId(report.id); }}>Retire</Button></div>
              </div> : <p className="mt-2 text-xs text-amber-800">The linked staff row is no longer available. Refresh the roster and review the account’s membership history.</p>}
            </div>)}
          </CardContent>
        </Card>}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search name, email, department, or role" value={search} onChange={(event) => setSearch(event.target.value)} />
        </div>
        {unlinkTarget && (
          <div className="space-y-3 rounded-lg border border-amber-300 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/30">
            <div className="flex items-start gap-2"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" /><div className="min-w-0"><p className="font-medium text-amber-900 dark:text-amber-100">Unlink {unlinkTarget.staffName} from this institution?</p><p className="text-xs text-amber-800 dark:text-amber-200">This ends institutional access and future IERS duties but keeps the platform account, CPD history, and staff audit record. A later CPD attendance will not silently reactivate the membership.</p></div></div>
            <Input placeholder="Required reason (at least 10 characters)" value={unlinkReason} onChange={(event) => setUnlinkReason(event.target.value)} />
            <div className="flex flex-col gap-2 sm:flex-row"><Button type="button" className="w-full sm:w-auto" disabled={!unlinkTarget.membershipId || unlinkReason.trim().length < 10 || unlinkMember.isPending} onClick={() => unlinkTarget.membershipId && unlinkMember.mutate({ institutionId, membershipId: unlinkTarget.membershipId, reason: unlinkReason.trim() })}>{unlinkMember.isPending ? "Unlinking…" : "Confirm unlink"}</Button><Button type="button" variant="outline" className="w-full sm:w-auto" disabled={unlinkMember.isPending} onClick={() => { setUnlinkTarget(null); setUnlinkReason(""); }}>Cancel</Button></div>
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
            <Input placeholder="Required reason (at least 10 characters)" value={removalReason} onChange={(event) => setRemovalReason(event.target.value)} />
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button type="button" variant="destructive" className="w-full sm:w-auto" disabled={!removalTarget.membershipId || removalReason.trim().length < 10 || removeMember.isPending} onClick={() => removalTarget.membershipId && removeMember.mutate({ institutionId, membershipId: removalTarget.membershipId, reason: removalReason.trim(), mismatchReportId: removalReportId ?? undefined })}>{removeMember.isPending ? "Removing…" : "Confirm removal"}</Button>
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
                {filtered.map((member) => {
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
                      <TableCell>
                        <Select value={currentRole} onValueChange={(value) => updateRole.mutate({ institutionId, staffMemberId: member.id, governanceRole: value as GovernanceRole })} disabled={updateRole.isPending}>
                          <SelectTrigger className="w-[190px]"><SelectValue /></SelectTrigger>
                          <SelectContent>{GOVERNANCE_ROLES.map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell><Badge variant={isRemoved ? "destructive" : member.facilityLinkStatus === "linked" ? "default" : "secondary"}>{isRemoved ? "Removed" : member.facilityLinkStatus === "linked" ? "Linked" : member.facilityLinkStatus ?? "Roster only"}</Badge></TableCell>
                      <TableCell>
                        {isRemoved ? <span className="text-xs text-muted-foreground">Access ended</span> : member.membershipId ? <div className="flex flex-wrap gap-2"><Button type="button" size="sm" variant="outline" className="text-amber-700" onClick={() => { setUnlinkTarget(member); setUnlinkReason(""); }} disabled={unlinkMember.isPending || removeMember.isPending}><AlertTriangle className="mr-2 h-4 w-4" />Unlink</Button><Button type="button" size="sm" variant="outline" className="text-red-700" onClick={() => { setRemovalTarget(member); setRemovalReason(""); setRemovalReportId(null); }} disabled={removeMember.isPending || unlinkMember.isPending}><UserMinus className="mr-2 h-4 w-4" />Retire</Button></div> : <span className="text-xs text-muted-foreground">No membership</span>}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
        <p className="text-xs text-muted-foreground">Use the roster import or add-staff workflow below to add people. A responsibility role should be assigned only after the institution confirms the provider’s operational scope.</p>
      </CardContent>
    </Card>

    {activeSection === "duties" && <Card>
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
            ].map((duty) => {
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
                    <span className="break-words"><strong className="text-foreground">Department:</strong> {duty.departmentName ?? "Not assigned"}</span>
                    <span className="break-words"><strong className="text-foreground">Pole:</strong> {duty.poleName ?? "Not assigned"}</span>
                      <span><strong className="text-foreground">Appointment/duty starts:</strong> {formatDutyDate(duty.effectiveFrom)}</span>
                    <span><strong className="text-foreground">Appointment/duty ends:</strong> {formatDutyDate(duty.effectiveUntil)}</span>
                    {weekLabel && <span><strong className="text-foreground">Rotation:</strong> {weekLabel}</span>}
                    {shiftType && <span><strong className="text-foreground">Shift:</strong> {shiftType}</span>}
                    <span><strong className="text-foreground">Accepted:</strong> {formatDutyDate(duty.acceptedAt)}</span>
                    {readinessSignOffAt && <span><strong className="text-foreground">Readiness:</strong> {formatDutyDate(readinessSignOffAt)}</span>}
                  </div>
                  {duty.declineReason && <p className="mt-3 break-words rounded border border-red-200 bg-red-50 p-2 text-xs text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200"><strong>Decline reason:</strong> {duty.declineReason}</p>}
                  <p className="mt-3 text-xs text-muted-foreground">This view is oversight only. An ERCo role is governance; a UTL or ERTL row is a separate dated duty. A role, roster row, or assignment does not prove provider acceptance, competency, or emergency dispatch.</p>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>}

    {activeSection === "product_roles" && <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><KeyRound className="h-5 w-5" />Product permissions</CardTitle>
                  <CardDescription>Assign a separate IERS or CPD product role to a linked provider. For IERS, the Lead, reviewer, response operator, and viewer roles govern portal access; dated ERCo, ERTL, and UTL duties remain separate and require provider acceptance.</CardDescription>

      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-2"><label className="text-sm font-medium">Product</label><select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={roleProduct} onChange={(event) => { setRoleProduct(event.target.value as "iers" | "cpd_portal"); setRoleKey(""); }}><option value="iers">IERS</option><option value="cpd_portal">CPD Portal</option></select></div>
          <div className="space-y-2"><label className="text-sm font-medium">Staff member</label><select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={roleStaffEmail} onChange={(event) => setRoleStaffEmail(event.target.value)}><option value="">Select staff member</option>{staff.map((member) => <option key={member.id} value={member.staffEmail}>{member.staffName} — {member.staffEmail}</option>)}</select></div>
          <div className="space-y-2"><label className="text-sm font-medium">Product role</label><select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={roleKey} onChange={(event) => setRoleKey(event.target.value)}><option value="">Select role</option>{(roleDefinitions ?? []).map((definition) => <option key={definition.roleKey} value={definition.roleKey}>{definition.label}</option>)}</select></div>
        </div>
        {roleKey && <p className="text-xs text-muted-foreground">{roleDefinitions?.find((definition) => definition.roleKey === roleKey)?.description}</p>}
        <Button type="button" onClick={() => selectedRoleStaff && grantProductRole.mutate({ institutionId, productKey: roleProduct, invitedEmail: selectedRoleStaff.staffEmail, userId: selectedRoleStaff.userId ?? undefined, roleKey })} disabled={!selectedRoleStaff || !roleKey || grantProductRole.isPending}><KeyRound className="mr-2 h-4 w-4" />{grantProductRole.isPending ? "Assigning…" : "Assign product role"}</Button>

        <div className="rounded-lg border">
          <div className="border-b bg-muted/30 px-4 py-3 text-sm font-medium">Assigned and historical product roles</div>
          {productRolesLoading ? <p className="p-4 text-sm text-muted-foreground">Loading product roles…</p> : !productRoles?.length ? <p className="p-4 text-sm text-muted-foreground">No explicit product roles have been assigned yet. Existing institution administrators retain shared admin access.</p> : <div className="divide-y">{productRoles.map((assignment) => <div key={assignment.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-medium">{assignment.invitedEmail}</p><p className="text-xs text-muted-foreground">{assignment.productName} · {assignment.roleKey.replaceAll("_", " ")}</p><p className="mt-1 text-xs"><Badge variant={assignment.roleStatus === "active" ? "default" : assignment.roleStatus === "ended" ? "outline" : "secondary"}>{assignment.roleStatus}</Badge></p></div><div className="flex flex-wrap gap-2">{assignment.roleStatus === "active" && <Button type="button" size="sm" variant="outline" disabled={setProductRoleStatus.isPending} onClick={() => setProductRoleStatus.mutate({ institutionId, roleId: assignment.id, roleStatus: "suspended", reason: "Suspended by institution administrator pending role review." })}>Suspend</Button>}{assignment.roleStatus === "suspended" && <Button type="button" size="sm" variant="outline" disabled={setProductRoleStatus.isPending} onClick={() => setProductRoleStatus.mutate({ institutionId, roleId: assignment.id, roleStatus: "active", reason: "Reactivated by institution administrator after role review." })}>Reactivate</Button>}{assignment.roleStatus !== "ended" && <Button type="button" size="sm" variant="ghost" className="text-red-700" disabled={setProductRoleStatus.isPending} onClick={() => setProductRoleStatus.mutate({ institutionId, roleId: assignment.id, roleStatus: "ended", reason: "Ended by institution administrator." })}>End</Button>}</div></div>)}</div>}
        </div>
      </CardContent>
    </Card>}

    {activeSection === "scopes" && <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5" />Shared institution scopes</CardTitle>
        <CardDescription>Assign non-product administrative responsibilities without granting IERS or CPD operational access.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-2"><label className="text-sm font-medium">Staff member</label><select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={accountScopeStaffEmail} onChange={(event) => setAccountScopeStaffEmail(event.target.value)}><option value="">Select staff member</option>{staff.map((member) => <option key={member.id} value={member.staffEmail}>{member.staffName} — {member.staffEmail}</option>)}</select></div>
          <div className="space-y-2"><label className="text-sm font-medium">Institution scope</label><select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={accountScopeKey} onChange={(event) => setAccountScopeKey(event.target.value)}><option value="">Select scope</option>{(accountScopeDefinitions ?? []).map((definition) => <option key={definition.scopeKey} value={definition.scopeKey}>{definition.label}</option>)}</select></div>
          <div className="flex items-end"><Button type="button" onClick={() => selectedAccountScopeStaff && grantAccountScope.mutate({ institutionId, invitedEmail: selectedAccountScopeStaff.staffEmail, userId: selectedAccountScopeStaff.userId ?? undefined, scopeKey: accountScopeKey })} disabled={!selectedAccountScopeStaff || !accountScopeKey || grantAccountScope.isPending}><ShieldCheck className="mr-2 h-4 w-4" />{grantAccountScope.isPending ? "Assigning…" : "Assign shared scope"}</Button></div>
        </div>
        {accountScopeKey && <p className="text-xs text-muted-foreground">{accountScopeDefinitions?.find((definition) => definition.scopeKey === accountScopeKey)?.description}</p>}
        <div className="rounded-lg border">
          <div className="border-b bg-muted/30 px-4 py-3 text-sm font-medium">Assigned and historical shared scopes</div>
          {accountScopesLoading ? <p className="p-4 text-sm text-muted-foreground">Loading shared scopes…</p> : !accountScopes?.length ? <p className="p-4 text-sm text-muted-foreground">No explicit shared scopes have been assigned.</p> : <div className="divide-y">{accountScopes.map((scope) => <div key={scope.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-medium">{scope.invitedEmail}</p><p className="text-xs text-muted-foreground">{scope.scopeKey.replaceAll("_", " ")}</p><p className="mt-1 text-xs"><Badge variant={scope.scopeStatus === "active" ? "default" : scope.scopeStatus === "ended" ? "outline" : "secondary"}>{scope.scopeStatus}</Badge></p></div><div className="flex flex-wrap gap-2">{scope.scopeStatus === "active" && <Button type="button" size="sm" variant="outline" disabled={setAccountScopeStatus.isPending} onClick={() => setAccountScopeStatus.mutate({ institutionId, scopeId: scope.id, scopeStatus: "suspended", reason: "Suspended by institution administrator pending scope review." })}>Suspend</Button>}{scope.scopeStatus === "suspended" && <Button type="button" size="sm" variant="outline" disabled={setAccountScopeStatus.isPending} onClick={() => setAccountScopeStatus.mutate({ institutionId, scopeId: scope.id, scopeStatus: "active", reason: "Reactivated by institution administrator after scope review." })}>Reactivate</Button>}{scope.scopeStatus !== "ended" && <Button type="button" size="sm" variant="ghost" className="text-red-700" disabled={setAccountScopeStatus.isPending} onClick={() => setAccountScopeStatus.mutate({ institutionId, scopeId: scope.id, scopeStatus: "ended", reason: "Ended by institution administrator." })}>End</Button>}</div></div>)}</div>}
        </div>
      </CardContent>
    </Card>}
    </div>
  );
}

export default InstitutionPeopleRolesPanel;
