import { AlertTriangle, ArrowRight, Link2, UserRound } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { buildAdministrationUrl, type PeopleFocus, type PeopleView } from "@shared/institution-administration-location";
import { buildRoleRegister, resolveHolderNames, type RoleSlot } from "@shared/institution-role-register";

export function PeopleNeedsAttention({
  institutionId,
  onOpen,
}: {
  institutionId: number;
  onOpen: (view: PeopleView, focus?: PeopleFocus) => void;
}) {
  const staffQuery = trpc.institution.getStaffMembers.useQuery(
    { institutionId, includeRemoved: false },
    { staleTime: 30_000 },
  );
  const linksQuery = trpc.institution.getPendingLinkRequests.useQuery(
    { institutionId },
    { staleTime: 30_000 },
  );
  const mismatchQuery = trpc.institution.getDepartmentMismatchReports.useQuery(
    { institutionId },
    { staleTime: 30_000 },
  );
  const departmentsQuery = trpc.institution.getFacilityDepartments.useQuery({ institutionId }, { staleTime: 30_000 });
  const adminsQuery = trpc.institutionAdmins.list.useQuery({ institutionId }, { staleTime: 30_000 });
  const productRolesQuery = trpc.institutionProducts.listProductRoles.useQuery({ institutionId }, { staleTime: 30_000 });
  const headsQuery = trpc.institutionAccountability.listDepartmentHeadAppointments.useQuery(
    { institutionId, includeEnded: false },
    { staleTime: 30_000 },
  );
  const cpdQuery = trpc.institutionLearning.listEducationCoordinators.useQuery(
    { institutionId },
    { staleTime: 30_000 },
  );
  const ercoQuery = trpc.institution.getDepartmentResponseCoordinators.useQuery(
    { institutionId },
    { staleTime: 30_000 },
  );
  const queries = [staffQuery, linksQuery, mismatchQuery, departmentsQuery, adminsQuery, productRolesQuery, headsQuery, cpdQuery, ercoQuery];
  if (queries.some(query => query.isError)) {
    return <Card><CardContent className="p-6 text-sm text-destructive">Could not load People &amp; Access attention items.</CardContent></Card>;
  }
  if (queries.some(query => query.isLoading)) {
    return <Card><CardContent className="p-6 text-sm text-muted-foreground">Loading attention items…</CardContent></Card>;
  }

  const staff = staffQuery.data ?? [];
  const roleRegister = buildRoleRegister({
    departments: departmentsQuery.data ?? [],
    admins: [
      ...(adminsQuery.data?.admins ?? []),
      ...(adminsQuery.data?.pendingInvites ?? []).map(invite => ({
        id: invite.id,
        name: invite.invitedName,
        email: invite.invitedEmail,
        roleStatus: "pending_acceptance",
      })),
    ],
    productRoles: resolveHolderNames(productRolesQuery.data ?? [], staff),
    heads: resolveHolderNames(headsQuery.data ?? [], staff),
    ercos: resolveHolderNames(ercoQuery.data ?? [], staff),
    cpdCoordinators: resolveHolderNames(cpdQuery.data ?? [], staff),
  });

  const attentionSlots = (() => {
    const labels: Record<RoleSlot["kind"], string> = {
      institution_admin: "Institutional administrator",
      iers_coordinator: "Institutional ERCo",
      cpd_coordinator: "Institutional CPD Coordinator",
      dept_head: "Departmental Head",
      dept_head_deputy: "Deputy Departmental Head",
      erco: "ERCo",
      erco_deputy: "Deputy ERCo",
      cpd_dept_coordinator: "Departmental CPD Coordinator",
      cpd_dept_coordinator_deputy: "Deputy Departmental CPD Coordinator",
    };
    const slots = [
      ...roleRegister.institutionWide.map(slot => ({ slot, departmentLabel: "" })),
      ...roleRegister.departments.flatMap(row => row.slots.map(slot => ({ slot, departmentLabel: row.label }))),
    ];
    return slots
      .filter(({ slot }) => slot.status === "pending_acceptance" || slot.status === "declined")
      .map(({ slot, departmentLabel }) => ({
        label: `${labels[slot.kind]}${departmentLabel ? ` · ${departmentLabel}` : ""}`,
        count: 1,
        view: "roles" as const,
        focus: { kind: "role", slotKey: `${slot.kind}-${slot.departmentId ?? "institution"}` } as const,
        icon: slot.status === "declined" ? AlertTriangle : UserRound,
        detail: slot.status === "declined"
          ? "This current appointment was declined and needs an explicit replacement decision."
          : "This current appointment is waiting for provider acceptance.",
      }));
  })();

  const missingDepartments = staff.filter(
    row => !row.removedAt && row.membershipStatus !== "ended" && !row.department?.trim(),
  ).length;
  const items = [
    {
      label: "Pending access links",
      count: linksQuery.data?.length ?? 0,
      view: "inbox" as const,
      focus: undefined,
      icon: Link2,
      detail: "Review provider requests before access is activated.",
    },
    {
      label: "Department mismatches",
      count: mismatchQuery.data?.length ?? 0,
      view: "departments" as const,
      focus: undefined,
      icon: AlertTriangle,
      detail: "Reconcile roster and CPD department evidence.",
    },
    {
      label: "People missing a department",
      count: missingDepartments,
      view: "directory" as const,
      focus: undefined,
      icon: UserRound,
      detail: "Complete roster context before assigning scope.",
    },
    ...attentionSlots,
  ].filter(item => item.count > 0);

  return (
    <Card className={items.length ? "border-amber-300 bg-amber-50/30" : "border-emerald-300 bg-emerald-50/30"}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5" />Needs attention</CardTitle>
        <CardDescription>{items.length ? "Resolve these institution-scoped items before assigning operational access." : "No People &amp; Access items require attention."}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.length ? items.map(({ label, count, view, focus, icon: Icon, detail }) => (
          <div key={`${label}-${focus?.kind ?? "none"}-${focus?.kind === "role" ? focus.slotKey : ""}`} className="flex min-w-0 flex-col gap-3 rounded-lg border bg-background p-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-start gap-3"><Icon className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" /><div><p className="font-medium">{label} <Badge variant="secondary" className="ml-1">{count}</Badge></p><p className="text-xs text-muted-foreground">{detail}</p></div></div>
            <Button type="button" size="sm" variant="outline" className="w-full shrink-0 sm:w-auto" onClick={() => onOpen(view, focus)}>Review <ArrowRight className="ml-1 h-4 w-4" /></Button>
          </div>
        )) : <p className="text-sm text-emerald-800">People, departments, and access links look clear.</p>}
      </CardContent>
    </Card>
  );
}

export function peopleAttentionUrl(institutionId: number) {
  return buildAdministrationUrl({ institutionId, lane: "institution", peopleView: "inbox" });
}
