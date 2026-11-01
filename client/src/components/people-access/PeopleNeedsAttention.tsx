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
import { buildAdministrationUrl } from "@shared/institution-administration-location";
import type { PeopleFocus, PeopleView } from "@shared/institution-administration-location";

export function PeopleNeedsAttention({
  institutionId,
  onOpen,
}: {
  institutionId: number;
  onOpen: (view: PeopleView, focus?: PeopleFocus) => void;
}) {
  const staffQuery = trpc.institution.getStaffMembers.useQuery(
    { institutionId, includeRemoved: false },
    { staleTime: 30_000 }
  );
  const linksQuery = trpc.institution.getPendingLinkRequests.useQuery(
    { institutionId },
    { staleTime: 30_000 }
  );
  const mismatchQuery = trpc.institution.getDepartmentMismatchReports.useQuery(
    { institutionId },
    { staleTime: 30_000 }
  );
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
  const unavailable =
    staffQuery.isError || linksQuery.isError || mismatchQuery.isError ||
    headsQuery.isError || cpdQuery.isError || ercoQuery.isError;
  if (unavailable)
    return (
      <Card>
        <CardContent className="p-6 text-sm text-destructive">
          Could not load
        </CardContent>
      </Card>
    );
  if (staffQuery.isLoading || linksQuery.isLoading || mismatchQuery.isLoading || headsQuery.isLoading || cpdQuery.isLoading || ercoQuery.isLoading)
    return (
      <Card>
        <CardContent className="p-6 text-sm text-muted-foreground">
          Loading attention items…
        </CardContent>
      </Card>
    );
  const staff = staffQuery.data ?? [];
  const pendingLinks = linksQuery.data ?? [];
  const mismatches = mismatchQuery.data ?? [];
  const pendingAcceptances = [
    ...(headsQuery.data ?? []).map(row => row.assignmentStatus === "pending_acceptance" ? 1 : 0),
    ...(headsQuery.data ?? []).map(row => row.deputyAssignmentStatus === "pending_acceptance" ? 1 : 0),
    ...(cpdQuery.data ?? []).map(row => row.assignmentStatus === "pending_acceptance" ? 1 : 0),
    ...(cpdQuery.data ?? []).map(row => row.deputyAssignmentStatus === "pending_acceptance" ? 1 : 0),
    ...(ercoQuery.data ?? []).map(row => row.assignmentStatus === "pending_acceptance" ? 1 : 0),
    ...(ercoQuery.data ?? []).map(row => row.deputyAssignmentStatus === "pending_acceptance" ? 1 : 0),
  ].reduce<number>((total, value) => total + value, 0);
  const declinedAppointments = [
    ...(headsQuery.data ?? []).map(row => row.assignmentStatus === "declined" ? 1 : 0),
    ...(headsQuery.data ?? []).map(row => row.deputyAssignmentStatus === "declined" ? 1 : 0),
    ...(cpdQuery.data ?? []).map(row => row.assignmentStatus === "declined" ? 1 : 0),
    ...(cpdQuery.data ?? []).map(row => row.deputyAssignmentStatus === "declined" ? 1 : 0),
    ...(ercoQuery.data ?? []).map(row => row.assignmentStatus === "declined" ? 1 : 0),
    ...(ercoQuery.data ?? []).map(row => row.deputyAssignmentStatus === "declined" ? 1 : 0),
  ].reduce<number>((total, value) => total + value, 0);
  const missingDepartments = staff.filter(
    row =>
      !row.removedAt &&
      row.membershipStatus !== "ended" &&
      !row.department?.trim()
  ).length;
  const items = [
    {
      label: "Pending access links",
      count: pendingLinks.length,
      view: "inbox" as const,
      icon: Link2,
      detail: "Review provider requests before access is activated.",
    },
    {
      label: "Department mismatches",
      count: mismatches.length,
      view: "departments" as const,
      icon: AlertTriangle,
      detail: "Reconcile roster and CPD department evidence.",
    },
    {
      label: "People missing a department",
      count: missingDepartments,
      view: "directory" as const,
      icon: UserRound,
      detail: "Complete roster context before assigning scope.",
    },
    {
      label: "Appointments pending acceptance",
      count: pendingAcceptances,
      view: "roles" as const,
      focus: { kind: "role", slotKey: "dept_head" } as const,
      icon: UserRound,
      detail: "Follow up on named roles that are waiting for provider acceptance.",
    },
    {
      label: "Appointments declined",
      count: declinedAppointments,
      view: "roles" as const,
      focus: { kind: "role", slotKey: "dept_head" } as const,
      icon: AlertTriangle,
      detail: "Reassign declined operational appointments with an explicit reason.",
    },
  ].filter(item => item.count > 0);
  return (
    <Card
      className={
        items.length
          ? "border-amber-300 bg-amber-50/30"
          : "border-emerald-300 bg-emerald-50/30"
      }
    >
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Needs attention
        </CardTitle>
        <CardDescription>
          {items.length
            ? "Resolve these institution-scoped items before assigning operational access."
            : "No People & Access items require attention."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.length ? (
          items.map(({ label, count, view, focus, icon: Icon, detail }) => (
            <div
              key={label}
              className="flex min-w-0 flex-col gap-3 rounded-lg border bg-background p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex min-w-0 items-start gap-3">
                <Icon className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
                <div>
                  <p className="font-medium">
                    {label}{" "}
                    <Badge variant="secondary" className="ml-1">
                      {count}
                    </Badge>
                  </p>
                  <p className="text-xs text-muted-foreground">{detail}</p>
                </div>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="w-full shrink-0 sm:w-auto"
                onClick={() => onOpen(view, focus)}
              >
                Review <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          ))
        ) : (
          <p className="text-sm text-emerald-800">
            People, departments, and access links look clear.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export function peopleAttentionUrl(institutionId: number) {
  return buildAdministrationUrl({
    institutionId,
    lane: "institution",
    peopleView: "inbox",
  });
}
