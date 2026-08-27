import { useEffect, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import ProviderTodayActivationCard from "@/components/ProviderTodayActivationCard";
import IersNotificationSetup from "@/components/IersNotificationSetup";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertTriangle,
  ArrowRight,
  BellRing,
  BookOpen,
  Building2,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  HeartPulse,
  Loader2,
  Siren,
  Users,
  ScanLine,
} from "lucide-react";

function formatDutyDate(value: Date | string | null | undefined) {
  if (!value) return "Date pending";
  return new Date(value).toLocaleDateString();
}

function formatDutyTime(
  startTime: string | null | undefined,
  endTime: string | null | undefined,
  endDayOffset: number | null | undefined,
) {
  if (!startTime || !endTime) return "Exact hours pending";
  return `${startTime.slice(0, 5)}–${endTime.slice(0, 5)}${endDayOffset === 1 ? " (+1 day)" : ""}`;
}

export type Attention = {
  eyebrow: string;
  title: string;
  detail: string;
  action: string;
  destination: string;
  tone: "red" | "amber" | "blue" | "teal";
};

type DutySummary = {
  departmentName?: string | null;
  shiftDate?: Date | string | null;
  startDate?: Date | string | null;
  endDate?: Date | string | null;
  shiftStartTime?: string | null;
  shiftEndTime?: string | null;
  shiftEndDayOffset?: number | null;
};

export type ProviderTodaySignals = {
  activeActivation: { location: string; department?: string | null } | null;
  pendingMembership: { companyName: string } | null;
  currentPendingRole: { roleScope: string; roleKey: string } | null;
  pendingReadiness: boolean;
  nextUtl: DutySummary | null;
  nextErtl: DutySummary | null;
};

export function buildProviderTodayAttention(signals: ProviderTodaySignals): Attention {
  const { activeActivation, pendingMembership, currentPendingRole, pendingReadiness, nextUtl, nextErtl } = signals;
  const nextDuty = nextUtl ?? nextErtl;

  if (activeActivation) {
    return {
      eyebrow: "Live action",
      title: "A facility activation needs your response",
      detail: `${activeActivation.location}${activeActivation.department ? ` · ${activeActivation.department}` : ""}`,
      action: "Open activation response",
      destination: "/my-shift?tab=respond",
      tone: "red",
    };
  }
  if (pendingMembership) {
    return {
      eyebrow: "Institutional responsibility",
      title: `Confirm your responsibility at ${pendingMembership.companyName}`,
      detail: "Accept the institutional invitation before using any governance or dated shift controls.",
      action: "Review invitation",
      destination: "/my-shift?tab=team",
      tone: "amber",
    };
  }
  if (currentPendingRole) {
    return {
      eyebrow: "Shift responsibility",
      title: `A dated ${currentPendingRole.roleScope === "ertl" ? "ERTL / Scene Commander" : currentPendingRole.roleKey.replaceAll("_", " ")} responsibility needs your response`,
      detail: "Accept the dated responsibility or decline it with a reason. Acceptance does not prove that you are at the scene.",
      action: "Open My Shift",
      destination: "/my-shift?tab=team",
      tone: "amber",
    };
  }
  if (pendingReadiness) {
    return {
      eyebrow: "Readiness",
      title: "A shift readiness check is waiting",
      detail: "Open the exact dated task and confirm only what you have actually checked.",
      action: "Open readiness",
      destination: "/my-shift?tab=readiness",
      tone: "blue",
    };
  }
  if (nextDuty) {
    const isErtl = Boolean(nextDuty.startDate);
    return {
      eyebrow: "Next shift",
      title: isErtl ? "Your next ERTL duty is scheduled" : "Your next UTL duty is scheduled",
      detail: isErtl
        ? `${nextDuty.departmentName ?? "Department"} · ${formatDutyDate(nextDuty.startDate)}–${formatDutyDate(nextDuty.endDate)}`
        : `${nextDuty.departmentName ?? "Department"} · ${formatDutyDate(nextDuty.shiftDate)} · ${formatDutyTime(nextDuty.shiftStartTime, nextDuty.shiftEndTime, nextDuty.shiftEndDayOffset)}`,
      action: "Open My Shift",
      destination: "/my-shift?tab=team",
      tone: "teal",
    };
  }
  return {
    eyebrow: "Ready when needed",
    title: "Open ResusGPS for bedside guidance",
    detail: "Use the structured emergency workflow when a seriously ill child needs assessment and action.",
    action: "Open ResusGPS",
    destination: "/resus",
    tone: "teal",
  };
}

function toneClasses(tone: Attention["tone"]) {
  return {
    red: "border-red-200 bg-red-50 text-red-950",
    amber: "border-amber-200 bg-amber-50 text-amber-950",
    blue: "border-blue-200 bg-blue-50 text-blue-950",
    teal: "border-teal-200 bg-teal-50 text-teal-950",
  }[tone];
}

export default function ProviderToday() {
  const { user, loading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();

  const membershipsQuery = trpc.institution.getMyMemberships.useQuery(undefined, {
    enabled: isAuthenticated,
    staleTime: 30_000,
    retry: 1,
  });
  const hasActiveMembership = Boolean(membershipsQuery.data?.some((membership) => membership.membershipStatus === "active"));
  const [secondaryQueriesReady, setSecondaryQueriesReady] = useState(false);
  useEffect(() => {
    if (!isAuthenticated || !hasActiveMembership) {
      setSecondaryQueriesReady(false);
      return;
    }
    const timer = window.setTimeout(() => setSecondaryQueriesReady(true), 250);
    return () => window.clearTimeout(timer);
  }, [hasActiveMembership, isAuthenticated]);
  const activationsQuery = trpc.iers.getMyActivations.useQuery(undefined, {
    enabled: isAuthenticated && hasActiveMembership,
    staleTime: 15_000,
    // ProviderActivationAlert owns the urgent five-second poll globally. This
    // observer reads the shared cache without starting a second timer.
    refetchInterval: false,
    retry: 1,
  });
  const dutiesQuery = trpc.institution.getMyProviderDutyAssignments.useQuery(undefined, {
    enabled: isAuthenticated && hasActiveMembership && secondaryQueriesReady,
    staleTime: 15_000,
    retry: 1,
  });
  const teamsQuery = trpc.iersShiftTeam.listMyShiftTeams.useQuery({ horizonDays: 0 }, {
    enabled: isAuthenticated && hasActiveMembership,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 1,
  });
  const readinessQuery = trpc.iers.getMyShiftReadiness.useQuery(undefined, {
    enabled: isAuthenticated && hasActiveMembership && secondaryQueriesReady,
    staleTime: 30_000,
    retry: 1,
  });

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <Card className="w-full max-w-xl">
          <CardContent className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Preparing your provider workspace…
          </CardContent>
        </Card>
      </div>
    );
  }

  const activeMemberships = (membershipsQuery.data ?? []).filter(
    (membership) => membership.membershipStatus === "active",
  );
  const primaryMembership = activeMemberships[0];
  const pendingMembership = (membershipsQuery.data ?? []).find((membership) => membership.isPendingInvite);
  const activeActivations = activationsQuery.data ?? [];
  const teams = teamsQuery.data ?? [];
  const currentTeam = teams.find((team) => team.teamState === "current") ?? null;
  const currentPendingRole = teams
    .flatMap((team) => team.assignments)
    .find(
      (assignment) =>
        assignment.isCurrentUser &&
        ["approved", "pending_acceptance"].includes(assignment.assignmentStatus),
    );
  const pendingReadiness = (readinessQuery.data ?? []).some((shift) => !shift.readinessSignOffAt);
  const nextUtl = dutiesQuery.data?.nextUtl ?? null;
  const nextErtl = dutiesQuery.data?.nextErtl ?? null;
  const nextDuty = nextUtl ?? nextErtl;
  const workplaceDataLoading = membershipsQuery.isLoading || (hasActiveMembership && (!secondaryQueriesReady || [activationsQuery, dutiesQuery, teamsQuery, readinessQuery].some((query) => query.isLoading)));
  const attention = workplaceDataLoading
    ? {
        eyebrow: "Checking your workspace",
        title: "Checking for a provider action",
        detail: "Your emergency tools are ready. We are checking for any dated duty, activation, or readiness task.",
        action: "Open ResusGPS",
        destination: "/resus",
        tone: "teal" as const,
      }
    : buildProviderTodayAttention({
        activeActivation: activeActivations[0] ? { location: activeActivations[0].location, department: activeActivations[0].department } : null,
        pendingMembership: pendingMembership ? { companyName: pendingMembership.companyName } : null,
        currentPendingRole: currentPendingRole ? { roleScope: currentPendingRole.roleScope, roleKey: currentPendingRole.roleKey } : null,
        pendingReadiness,
        nextUtl,
        nextErtl,
      });

  const isRefreshing =
    membershipsQuery.isFetching ||
    activationsQuery.isFetching ||
    dutiesQuery.isFetching ||
    teamsQuery.isFetching ||
    readinessQuery.isFetching;

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="mx-auto max-w-2xl space-y-4 px-4 py-5 sm:py-7">
        <header className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-bold text-slate-950">
              Welcome back{user.name ? `, ${user.name.split(" ")[0]}` : ""}
            </h1>
          </div>
          {isRefreshing && <Loader2 className="mt-2 h-4 w-4 shrink-0 animate-spin text-slate-400" aria-label="Refreshing" />}
        </header>

        {primaryMembership ? (
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600">
            <Building2 className="h-4 w-4 shrink-0 text-teal-700" />
            {activeMemberships.length === 1 ? (
              <span className="min-w-0 truncate">
                {primaryMembership.companyName}
                {primaryMembership.department ? ` · ${primaryMembership.department}` : ""}
                {primaryMembership.staffRole ? ` · ${primaryMembership.staffRole}` : ""}
              </span>
            ) : (
              <span className="min-w-0 truncate">{activeMemberships.length} active facilities linked · exact scope appears in each workspace</span>
            )}
            {activeMemberships.length > 1 && <Badge variant="outline" className="ml-auto shrink-0">Review in Records</Badge>}
          </div>
        ) : null}

        <IersNotificationSetup enabled={hasActiveMembership} />

        <ProviderTodayActivationCard
          currentTeam={currentTeam ? { teamId: currentTeam.teamId, institutionId: currentTeam.institutionId, poleName: currentTeam.poleName } : null}
          isLoading={teamsQuery.isLoading || membershipsQuery.isLoading}
          hasActiveMembership={hasActiveMembership}
        />

        <Card className={`overflow-hidden border ${toneClasses(attention.tone)}`}>
          <CardHeader className="pb-3">
            <p className="text-xs font-semibold uppercase tracking-wide opacity-70">{attention.eyebrow}</p>
            <CardTitle className="mt-1 text-lg">{attention.title}</CardTitle>
            <CardDescription className="text-current/75">{attention.detail}</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <Button
              type="button"
              className={attention.tone === "red" ? "bg-red-700 text-white hover:bg-red-800" : "bg-teal-800 text-white hover:bg-teal-900"}
              onClick={() => setLocation(attention.destination)}
            >
              {attention.action} <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        {membershipsQuery.isError || activationsQuery.isError || dutiesQuery.isError || teamsQuery.isError ? (
          <Alert className="border-amber-200 bg-amber-50 text-amber-950">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Some workplace details could not refresh</AlertTitle>
            <AlertDescription className="flex flex-wrap items-center gap-2 text-amber-900/80">
              Your emergency tools remain available. Open My Shift to retry the relevant workspace.
              <Button type="button" size="sm" variant="outline" onClick={() => { void membershipsQuery.refetch(); void activationsQuery.refetch(); void dutiesQuery.refetch(); void teamsQuery.refetch(); void utils.iers.getMyShiftReadiness.invalidate(); }}>
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        ) : null}

        <section aria-labelledby="quick-actions-heading">
          <div className="mb-2 flex items-center justify-between">
            <h2 id="quick-actions-heading" className="text-sm font-semibold text-slate-900">Open a workspace</h2>
            <span className="text-xs text-slate-500">Choose only what you need</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button type="button" onClick={() => setLocation("/resus")} className="rounded-xl border border-red-200 bg-white p-4 text-left shadow-sm transition hover:border-red-300 hover:bg-red-50/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500">
              <Siren className="h-5 w-5 text-red-700" />
              <p className="mt-3 text-sm font-semibold text-slate-900">ResusGPS</p>
              <p className="mt-1 text-xs text-slate-500">Bedside emergency guidance</p>
            </button>
            <button type="button" onClick={() => setLocation("/my-shift")} className="rounded-xl border border-teal-200 bg-white p-4 text-left shadow-sm transition hover:border-teal-300 hover:bg-teal-50/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500">
              <Users className="h-5 w-5 text-teal-700" />
              <p className="mt-3 text-sm font-semibold text-slate-900">My Shift</p>
              <p className="mt-1 text-xs text-slate-500">ERT, duties, readiness, reports</p>
            </button>
            <button type="button" onClick={() => setLocation("/learn")} className="rounded-xl border border-violet-200 bg-white p-4 text-left shadow-sm transition hover:border-violet-300 hover:bg-violet-50/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500">
              <BookOpen className="h-5 w-5 text-violet-700" />
              <p className="mt-3 text-sm font-semibold text-slate-900">Learn</p>
              <p className="mt-1 text-xs text-slate-500">Fellowship and AHA training</p>
            </button>
            <button type="button" onClick={() => setLocation("/records")} className="rounded-xl border border-blue-200 bg-white p-4 text-left shadow-sm transition hover:border-blue-300 hover:bg-blue-50/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
              <FileText className="h-5 w-5 text-blue-700" />
              <p className="mt-3 text-sm font-semibold text-slate-900">My Records</p>
              <p className="mt-1 text-xs text-slate-500">CPD, certificates, profile</p>
            </button>
          </div>
        </section>

        <div className="grid gap-3 sm:grid-cols-3">
          <Button type="button" variant="outline" className="h-auto justify-start gap-2 bg-white py-3" onClick={() => setLocation("/care-signal")}>
            <HeartPulse className="h-4 w-4 text-blue-700" /> Report to Care Signal
          </Button>
          <Button type="button" variant="outline" className="h-auto justify-start gap-2 bg-white py-3" onClick={() => setLocation("/code-signal")}>
            <BellRing className="h-4 w-4 text-amber-700" /> Anonymous Code Signal
          </Button>
          <Button type="button" variant="outline" className="h-auto justify-start gap-2 bg-white py-3" onClick={() => setLocation("/iers/orientation")}>
            <ClipboardCheck className="h-4 w-4 text-teal-700" /> IERS guide
          </Button>
          <Button type="button" variant="outline" className="h-auto justify-start gap-2 bg-white py-3" onClick={() => setLocation("/learning/guide")}>
            <BookOpen className="h-4 w-4 text-violet-700" /> Learning guide
          </Button>
          <Button type="button" variant="outline" className="h-auto justify-start gap-2 bg-white py-3" onClick={() => setLocation("/activation-scan")}>
            <ScanLine className="h-4 w-4 text-red-700" /> Scan case QR
          </Button>
        </div>

        {!membershipsQuery.isLoading && !membershipsQuery.isError && activeMemberships.length === 0 ? (
          <p className="text-center text-xs text-slate-500">No active facility workspace is linked yet. You can still use ResusGPS, Learn, and My Records.</p>
        ) : null}

        {(teams.length > 0 || nextDuty || pendingReadiness) && (
          <p className="flex items-center justify-center gap-2 text-center text-xs text-slate-500">
            <CalendarClock className="h-3.5 w-3.5" />
            Your full dated rota and operational controls are in My Shift.
          </p>
        )}

        {!workplaceDataLoading && !activeActivations.length && !currentPendingRole && !pendingReadiness && !nextDuty && !teams.length ? (
          <div className="flex items-center justify-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
            <CheckCircle2 className="h-4 w-4" /> No provider action is waiting right now.
          </div>
        ) : null}
      </div>
    </div>
  );
}
