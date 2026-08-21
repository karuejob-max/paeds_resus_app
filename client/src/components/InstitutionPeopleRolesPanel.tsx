import { useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Loader2, RefreshCw, Search, ShieldCheck, Users } from "lucide-react";

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
  const { data, isLoading, isFetching, refetch } = trpc.institution.getStaffMembers.useQuery({ institutionId });
  const updateRole = trpc.institution.updateStaffGovernanceRole.useMutation({
    onSuccess: async () => {
      toast.success("Responsibility role updated");
      await utils.institution.getStaffMembers.invalidate({ institutionId });
    },
    onError: (error) => toast.error(error.message || "Could not update responsibility role"),
  });

  const staff = (data ?? []) as StaffRow[];
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return staff;
    return staff.filter((member) => [member.staffName, member.staffEmail, member.staffRole, member.department ?? "", roleLabel(member.governanceRole)].some((value) => value.toLowerCase().includes(query)));
  }, [search, staff]);

  return (
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
  );
}

export default InstitutionPeopleRolesPanel;
