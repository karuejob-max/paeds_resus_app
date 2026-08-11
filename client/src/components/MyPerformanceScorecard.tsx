/**
 * Individual "My Performance" scorecard — CEO-requested 2026-08-09, Phase 1
 * (aggregates existing data only; see provider-performance.service.ts for
 * what's deliberately NOT included yet — shift huddles, code
 * team-lead/participation — and the stated limitations on what IS shown
 * here, especially CPD attendance matching and Life Support expiry being
 * an assumed 2-year window, not a stored fact).
 *
 * The facility-median comparison is private — shown only to this
 * provider, about themselves, never as a named leaderboard. Matches the
 * CEO-approved "no ranking" decision.
 */
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, GraduationCap, HeartPulse, ClipboardCheck, ShieldCheck, AlertTriangle } from "lucide-react";

const FLAG_LABELS: Record<string, string> = {
  no_cpd_this_period: "No CPD sessions this period",
  life_support_cert_expired: "A Life Support certification has expired",
  life_support_cert_expiring_soon: "A Life Support certification expires soon",
  no_qi_reports_this_period: "No QI reports filed this period",
};

const LIFE_SUPPORT_STATUS_STYLE: Record<string, string> = {
  valid: "bg-green-100 text-green-700",
  expiring_soon: "bg-amber-100 text-amber-700",
  expired: "bg-red-200 text-red-900",
};

const PROGRAM_LABELS: Record<string, string> = { bls: "BLS", acls: "ACLS", pals: "PALS" };

export function MyPerformanceScorecard() {
  const { data, isLoading } = trpc.institution.getMyPerformanceScorecard.useQuery({ lastDays: 90 });

  if (isLoading) {
    return (
      <Card className="border-border/80 shadow-sm">
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading your performance summary…
          </p>
        </CardContent>
      </Card>
    );
  }

  const sc = data?.scorecard;
  if (!sc) return null;

  return (
    <Card className="border-border/80 shadow-sm">
      <CardHeader>
        <CardTitle>My Performance ({data?.lastDays ?? 90}d)</CardTitle>
        <CardDescription>
          A private summary for your own professional growth — never shared with peers, only visible to you and,
          for counts only, your institution.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {sc.priorityFlags.length > 0 ? (
          <div className="rounded-md border border-amber-300 bg-amber-50 dark:bg-amber-950/20 p-3 space-y-1">
            <p className="text-sm font-medium flex items-center gap-2 text-amber-800 dark:text-amber-200">
              <AlertTriangle className="h-4 w-4" />
              Priority areas
            </p>
            <ul className="text-sm text-amber-800 dark:text-amber-200 list-disc list-inside">
              {sc.priorityFlags.map((f) => (
                <li key={f}>{FLAG_LABELS[f] ?? f}</li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="rounded-md border border-green-300 bg-green-50 dark:bg-green-950/20 p-3 text-sm text-green-800 dark:text-green-200 flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" />
            No priority gaps flagged this period.
          </div>
        )}

        <div className="grid sm:grid-cols-3 gap-4">
          <div className="flex items-start gap-3">
            <GraduationCap className="h-5 w-5 text-violet-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-lg font-bold">
                {sc.cpd.sessionsPresented + sc.cpd.sessionsAttended}
              </p>
              <p className="text-xs text-muted-foreground">
                CPD sessions ({sc.cpd.sessionsPresented} presented, {sc.cpd.sessionsAttended} attended) ·{" "}
                {sc.cpd.pointsEarned} pts
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <ClipboardCheck className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-lg font-bold">{sc.qi.careSignalCount + sc.qi.codeSignalCount}</p>
              <p className="text-xs text-muted-foreground">
                QI reports ({sc.qi.careSignalCount} Care Signal, {sc.qi.codeSignalCount} Code Signal)
                {data?.departmentMedianQiCount != null ? (
                  <> · department median: {data.departmentMedianQiCount}</>
                ) : data?.facilityMedianQiCount != null ? (
                  <> · facility median: {data.facilityMedianQiCount}</>
                ) : null}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <HeartPulse className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-lg font-bold">{sc.crashCartAudits}</p>
              <p className="text-xs text-muted-foreground">Crash cart audits</p>
            </div>
          </div>
        </div>

        {sc.lifeSupport.length > 0 ? (
          <div>
            <p className="text-sm font-medium mb-2">Life Support certifications</p>
            <div className="flex flex-wrap gap-2">
              {sc.lifeSupport.map((l) => (
                <Badge key={l.programType} className={LIFE_SUPPORT_STATUS_STYLE[l.status] ?? ""}>
                  {PROGRAM_LABELS[l.programType] ?? l.programType} —{" "}
                  {l.status === "valid" ? "valid" : l.status === "expiring_soon" ? "expiring soon" : "expired"}
                </Badge>
              ))}
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
