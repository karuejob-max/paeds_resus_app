import { useEffect, useRef, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Link2, Building2, ShieldCheck } from "lucide-react";
import {
  resolveAdministrationLocation,
  buildAdministrationUrl,
  type PeopleView,
} from "@shared/institution-administration-location";
import { trpc } from "@/lib/trpc";
import { InstitutionPeopleRolesPanel } from "@/components/InstitutionPeopleRolesPanel";
import { InstitutionDepartmentReconciliationPanel } from "@/components/InstitutionDepartmentReconciliationPanel";
import { AccountAdminsWidget } from "@/components/AccountAdminsWidget";
import { PendingLinkRequestsWidget } from "@/components/PendingLinkRequestsWidget";
import StaffBulkImport from "@/components/StaffBulkImport";
import { PeopleNeedsAttention } from "./PeopleNeedsAttention";
import { SetupChecklist } from "./SetupChecklist";
import { MismatchInbox } from "./MismatchInbox";
import { choosePeopleAccessView } from "./people-access-navigation";

function locationFromWindow() {
  return typeof window === "undefined"
    ? { lane: "institution" as const }
    : resolveAdministrationLocation(window.location.search);
}

export function PeopleAccessShell({
  institutionId,
  institutionProfileReady = true,
}: {
  institutionId: number;
  institutionProfileReady?: boolean;
}) {
  const location = locationFromWindow();
  const explicitView = location.peopleView;
  const [view, setView] = useState<PeopleView>(
    choosePeopleAccessView({ explicitView })
  );
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
  const departmentsQuery = trpc.institution.getFacilityDepartments.useQuery(
    { institutionId },
    { staleTime: 60_000 }
  );
  const consumedFocus = useRef(false);
  const [focus, setFocus] = useState(location.focus);
  const setPeopleView = (next: PeopleView) => {
    setView(next);
    if (typeof window !== "undefined")
      window.history.replaceState(
        null,
        "",
        buildAdministrationUrl({
          institutionId,
          lane: "institution",
          peopleView: next,
        })
      );
  };
  useEffect(() => {
    if (
      !explicitView &&
      !consumedFocus.current &&
      !location.focus &&
      !staffQuery.isLoading &&
      !linksQuery.isLoading &&
      !mismatchQuery.isLoading &&
      !staffQuery.isError &&
      !linksQuery.isError &&
      !mismatchQuery.isError
    ) {
      const missingDepartments = (staffQuery.data ?? []).filter(
        row =>
          !row.removedAt &&
          row.membershipStatus !== "ended" &&
          !row.department?.trim()
      ).length;
      setView(
        choosePeopleAccessView({
          explicitView,
          attentionCount:
            (linksQuery.data?.length ?? 0) +
            (mismatchQuery.data?.length ?? 0) +
            missingDepartments,
        })
      );
    }
    if (consumedFocus.current || !location.focus) return;
    consumedFocus.current = true;
    setView(
      location.focus.kind === "link-request" ||
        location.focus.kind === "mismatch"
        ? "inbox"
        : "roles"
    );
    setFocus(location.focus);
  }, [
    explicitView,
    location.focus,
    staffQuery.data,
    staffQuery.isError,
    staffQuery.isLoading,
    linksQuery.data,
    linksQuery.isError,
    linksQuery.isLoading,
    mismatchQuery.data,
    mismatchQuery.isError,
    mismatchQuery.isLoading,
  ]);
  const focusTarget =
    focus?.kind === "link-request" || focus?.kind === "mismatch"
      ? focus
      : undefined;
  const checklistInputs = {
    institutionProfile: institutionProfileReady,
    staffRoster: staffQuery.isError || staffQuery.isLoading ? null : (staffQuery.data?.length ?? 0) > 0,
    peopleAccess: staffQuery.isError || staffQuery.isLoading ? null : true,
    departments: departmentsQuery.isError || departmentsQuery.isLoading ? null : (departmentsQuery.data?.length ?? 0) > 0,
    accessLinks: linksQuery.isError || linksQuery.isLoading ? null : true,
  } as const;
  return (
    <div className="min-w-0 space-y-5">
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">People & access</h2>
          <p className="text-sm text-muted-foreground">
            Maintain the institutional directory, responsibilities, departments,
            and account access.
          </p>
        </div>
        <Badge variant="outline" className="w-fit">
          Institution-scoped
        </Badge>
      </div>
      <SetupChecklist activeView={view} inputs={checklistInputs} />
      <Tabs
        value={view}
        onValueChange={value => setPeopleView(value as PeopleView)}
        className="min-w-0 space-y-5"
      >
        <TabsList className="grid h-auto w-full grid-cols-1 gap-1 min-[420px]:grid-cols-2 md:grid-cols-5">
          <TabsTrigger
            value="inbox"
            className="min-w-0 whitespace-normal px-2 py-2 text-xs sm:text-sm"
          >
            <Link2 className="mr-1.5 hidden h-4 w-4 sm:block" />
            Needs attention
          </TabsTrigger>
          <TabsTrigger
            value="roles"
            className="min-w-0 whitespace-normal px-2 py-2 text-xs sm:text-sm"
          >
            <ShieldCheck className="mr-1.5 hidden h-4 w-4 sm:block" />
            Roles
          </TabsTrigger>
          <TabsTrigger
            value="directory"
            className="min-w-0 whitespace-normal px-2 py-2 text-xs sm:text-sm"
          >
            <Users className="mr-1.5 hidden h-4 w-4 sm:block" />
            Directory
          </TabsTrigger>
          <TabsTrigger
            value="departments"
            className="min-w-0 whitespace-normal px-2 py-2 text-xs sm:text-sm"
          >
            <Building2 className="mr-1.5 hidden h-4 w-4 sm:block" />
            Departments
          </TabsTrigger>
          <TabsTrigger
            value="admins"
            className="min-w-0 whitespace-normal px-2 py-2 text-xs sm:text-sm"
          >
            <ShieldCheck className="mr-1.5 hidden h-4 w-4 sm:block" />
            Admins & access
          </TabsTrigger>
        </TabsList>
        <TabsContent value="inbox" className="mt-0 space-y-5">
          <PeopleNeedsAttention
            institutionId={institutionId}
            onOpen={setPeopleView}
          />
          <MismatchInbox institutionId={institutionId} focus={focusTarget} />
        </TabsContent>
        <TabsContent value="roles" className="mt-0">
          <InstitutionPeopleRolesPanel
            institutionId={institutionId}
            initialSection="assignments"
          />
        </TabsContent>
        <TabsContent value="directory" className="mt-0 space-y-5">
          <InstitutionPeopleRolesPanel
            institutionId={institutionId}
            initialSection="roster"
          />
          <div className="flex flex-col gap-2 rounded-lg border bg-muted/20 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-medium">Import staff</p>
              <p className="text-sm text-muted-foreground">
                Add roster-only people from the existing CSV workflow; access is
                never granted automatically.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                document
                  .getElementById("people-access-import")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
            >
              Open import
            </Button>
          </div>
          <div id="people-access-import">
            <StaffBulkImport institutionId={institutionId} />
          </div>
        </TabsContent>
        <TabsContent value="departments" className="mt-0">
          <InstitutionDepartmentReconciliationPanel
            institutionId={institutionId}
          />
        </TabsContent>
        <TabsContent
          value="admins"
          className="mt-0 grid min-w-0 gap-6 xl:grid-cols-2"
        >
          <AccountAdminsWidget institutionId={institutionId} />
          <PendingLinkRequestsWidget
            institutionId={institutionId}
            focusRequestId={
              focus?.kind === "link-request" ? focus.id : undefined
            }
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
