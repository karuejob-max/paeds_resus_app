import { useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { KeyRound, Loader2, RefreshCw, Search, ShieldCheck, Users } from "lucide-react";

const GOVERNANCE_ROLES = [
  ["general_staff", "General staff"],
  ["executive", "Hospital executive"],
  ["erc_chair", "ERC chair"],
  ["erc_member", "ERC member"],
  ["er_coordinator", "ER coordinator"],
  ["unit_team_leader", "Unit team leader"],
  ["ert_leader", "ERT leader"],
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
};

function roleLabel(role: string | null | undefined): string {
  return GOVERNANCE_ROLES.find(([value]) => value === role)?.[1] ?? "General staff";
}

export function InstitutionPeopleRolesPanel({ institutionId }: { institutionId: number }) {
  const utils = trpc.useUtils();
  const [search, setSearch] = useState("");
  const [roleProduct, setRoleProduct] = useState<"iers" | "cpd_portal">("iers");
  const [roleStaffEmail, setRoleStaffEmail] = useState("");
  const [roleKey, setRoleKey] = useState("");
  const [accountScopeStaffEmail, setAccountScopeStaffEmail] = useState("");
  const [accountScopeKey, setAccountScopeKey] = useState("");
  const { data, isLoading, isFetching, refetch } = trpc.institution.getStaffMembers.useQuery({ institutionId });
  const { data: productRoles, isLoading: productRolesLoading, refetch: refetchProductRoles } = trpc.institutionProducts.listProductRoles.useQuery({ institutionId });
  const { data: roleDefinitions } = trpc.institutionProducts.getRoleDefinitions.useQuery({ productKey: roleProduct });
  const { data: accountScopes, isLoading: accountScopesLoading, refetch: refetchAccountScopes } = trpc.institutionProducts.listAccountScopes.useQuery({ institutionId });
  const { data: accountScopeDefinitions } = trpc.institutionProducts.getAccountScopeDefinitions.useQuery();
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

  const staff = (data ?? []) as StaffRow[];
  const selectedRoleStaff = staff.find((member) => member.staffEmail.toLowerCase() === roleStaffEmail.toLowerCase());
  const selectedAccountScopeStaff = staff.find((member) => member.staffEmail.toLowerCase() === accountScopeStaffEmail.toLowerCase());
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return staff;
    return staff.filter((member) => [member.staffName, member.staffEmail, member.staffRole, member.department ?? "", roleLabel(member.governanceRole)].some((value) => value.toLowerCase().includes(query)));
  }, [search, staff]);

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
          <span>Assigning an IERS responsibility role does not create a CPD record or grant a product subscription. Product access and clinical responsibility remain separate controls.</span>
        </div>
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search name, email, department, or role" value={search} onChange={(event) => setSearch(event.target.value)} />
        </div>
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
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((member) => {
                  const currentRole = (member.governanceRole ?? "general_staff") as GovernanceRole;
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
                      <TableCell><Badge variant={member.facilityLinkStatus === "linked" ? "default" : "secondary"}>{member.facilityLinkStatus === "linked" ? "Linked" : member.facilityLinkStatus ?? "Roster only"}</Badge></TableCell>
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

    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><KeyRound className="h-5 w-5" />Product permissions</CardTitle>
        <CardDescription>Assign a separate product role to a linked provider. Shared institutional admin access remains separate from these assignments.</CardDescription>
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
    </Card>

    <Card>
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
    </Card>
    </div>
  );
}

export default InstitutionPeopleRolesPanel;
