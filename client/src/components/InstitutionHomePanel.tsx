import { useMemo } from "react";
import {
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  UsersRound,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export default function InstitutionHomePanel({
  institutionId,
  onOpenLearning,
  onOpenReadiness,
  onOpenIls,
  onOpenAdministration,
  iersEnabled,
}: {
  institutionId: number;
  onOpenLearning: () => void;
  onOpenReadiness: () => void;
  onOpenIls: () => void;
  onOpenAdministration: () => void;
  iersEnabled: boolean;
}) {
  const {
    data: stats,
    isLoading: statsLoading,
    isError: statsError,
  } = trpc.institution.getStats.useQuery({ institutionId });
  const {
    data: schedules,
    isLoading: schedulesLoading,
    isError: schedulesError,
  } = trpc.institution.getTrainingSchedules.useQuery(
    { institutionId },
    { enabled: iersEnabled }
  );

  const nextSession = useMemo(() => {
    const now = Date.now();
    return (schedules ?? [])
      .filter(
        session =>
          session.status !== "cancelled" &&
          new Date(session.scheduledDate).getTime() >= now
      )
      .sort(
        (a, b) =>
          new Date(a.scheduledDate).getTime() -
          new Date(b.scheduledDate).getTime()
      )[0];
  }, [schedules]);

  const completionRate = stats?.completionRate ?? 0;
  const attentionItems = [
    stats && stats.totalStaff === 0
      ? {
          label: "Add your institutional roster",
          detail:
            "Link or import staff before assigning learning or readiness work.",
          action: onOpenAdministration,
          actionLabel: "Open people & access",
          icon: UsersRound,
        }
      : null,
    stats && stats.totalStaff > 0 && stats.enrolledStaff < stats.totalStaff
      ? {
          label: "Enrol the remaining roster",
          detail: `${stats.totalStaff - stats.enrolledStaff} staff member(s) are not enrolled in the institutional learning roster.`,
          action: onOpenLearning,
          actionLabel: "Open learning operations",
          icon: ClipboardCheck,
        }
      : null,
    iersEnabled && !schedulesLoading && !schedulesError && !nextSession
      ? {
          label: "Schedule the next competency session",
          detail:
            "No future institutional competency session is currently scheduled.",
          action: onOpenLearning,
          actionLabel: "Schedule competency",
          icon: CalendarClock,
        }
      : null,
  ].filter(Boolean) as Array<{
    label: string;
    detail: string;
    action: () => void;
    actionLabel: string;
    icon: typeof UsersRound;
  }>;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Institutional attention</CardTitle>
          <CardDescription>
            Start with the next decision that keeps people, training, learning,
            and readiness moving. This is an institutional view; bedside
            response remains in the individual portal.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {statsError || (iersEnabled && schedulesError) ? (
            <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50/60 p-4 text-sm dark:border-amber-900 dark:bg-amber-950/20">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
              <div>
                <p className="font-semibold">
                  Current attention signals are unavailable
                </p>
                <p className="mt-1 text-muted-foreground">
                  Open the relevant lane directly; no action is inferred while
                  the summary is unavailable.
                </p>
              </div>
            </div>
          ) : statsLoading || schedulesLoading ? (
            <p className="text-sm text-muted-foreground">
              Loading current institutional signals…
            </p>
          ) : attentionItems.length === 0 ? (
            <div className="flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50/70 p-4 text-sm dark:border-emerald-900 dark:bg-emerald-950/20">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />
              <div>
                <p className="font-semibold text-emerald-950 dark:text-emerald-100">
                  No setup blocker detected
                </p>
                <p className="mt-1 text-emerald-900/80 dark:text-emerald-100/80">
                  Review Readiness and Learning for operational exceptions,
                  evidence, and overdue actions.
                </p>
              </div>
            </div>
          ) : (
            attentionItems.map(
              ({ label, detail, action, actionLabel, icon: Icon }) => (
                <div
                  key={label}
                  className="flex flex-col gap-3 rounded-lg border border-amber-200 bg-amber-50/60 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-amber-900 dark:bg-amber-950/20"
                >
                  <div className="flex items-start gap-3">
                    <Icon className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
                    <div>
                      <p className="font-semibold">{label}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {detail}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    className="shrink-0"
                    onClick={action}
                  >
                    {actionLabel}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              )
            )
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">
              Institutional roster
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">
              {statsLoading ? "—" : (stats?.totalStaff ?? 0)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              staff in the institution roster
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">
              Learning completion
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">
              {statsLoading ? "—" : String(completionRate) + "%"}
            </p>
            <Progress value={completionRate} className="mt-3 h-2" />
            <p className="mt-2 text-xs text-muted-foreground">
              completed roster learning records
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">
              Next competency session
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!iersEnabled ? (
              <p className="text-sm text-muted-foreground">
                Enable IERS to schedule competency sessions.
              </p>
            ) : schedulesError ? (
              <p className="text-sm text-muted-foreground">
                Schedule data unavailable.
              </p>
            ) : schedulesLoading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : nextSession ? (
              <>
                <p className="font-semibold">
                  {(nextSession.programType ?? "competency").toUpperCase()} · {""}
                  {new Date(nextSession.scheduledDate).toLocaleDateString()}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {nextSession.location || "Location not recorded"}
                </p>
              </>
            ) : (
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                No future session scheduled
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Choose the operating lane</CardTitle>
          <CardDescription>
            Use Readiness for IERS operations, ILS Program for Paeds Resus
            competency training and provider cohorts, Learning for CPD and staff
            development, and Administration for access and governance.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-4">
          <Button
            variant="outline"
            className="h-auto justify-start p-4 text-left"
            onClick={onOpenReadiness}
          >
            <div>
              <div className="font-semibold">Open Readiness</div>
              <div className="mt-1 text-xs text-muted-foreground">
                Teams, equipment, drills, evidence, and improvement.
              </div>
            </div>
            <ArrowRight className="ml-auto h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="h-auto justify-start p-4 text-left"
            onClick={onOpenIls}
          >
            <div>
              <div className="font-semibold">Open ILS Program</div>
              <div className="mt-1 text-xs text-muted-foreground">
                Paeds Resus competency training, practical assessment, and provider cohorts.
              </div>
            </div>
            <ArrowRight className="ml-auto h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="h-auto justify-start p-4 text-left"
            onClick={onOpenLearning}
          >
            <div>
              <div className="font-semibold">Open Learning</div>
              <div className="mt-1 text-xs text-muted-foreground">
                Cohorts, competency, CPD, certificates, and staff development.
              </div>
            </div>
            <ArrowRight className="ml-auto h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="h-auto justify-start p-4 text-left"
            onClick={onOpenAdministration}
          >
            <div>
              <div className="font-semibold">Open Administration</div>
              <div className="mt-1 text-xs text-muted-foreground">
                People, roles, access, contracts, renewal, and recovery.
              </div>
            </div>
            <ArrowRight className="ml-auto h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
