/**
 * Institutional "Staff Performance" roster — CEO-requested 2026-08-09,
 * Phase 1. Same scorecard as MyPerformanceScorecard.tsx, per provider, for
 * an admin's own appraisal/attention-prioritization use. Deliberately not
 * a public leaderboard — visible only here, to institution admins.
 */
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertTriangle } from "lucide-react";

const FLAG_LABELS: Record<string, string> = {
  no_cpd_this_period: "No CPD",
  life_support_cert_expired: "Cert expired",
  life_support_cert_expiring_soon: "Cert expiring",
  no_qi_reports_this_period: "No QI reports",
};

export function StaffPerformanceRoster({ lastDays = 90 }: { lastDays?: number }) {
  const { data, isLoading } = trpc.institution.getStaffPerformanceRoster.useQuery({ lastDays });

  return (
    <Card className="border-border/80 shadow-sm">
      <CardHeader>
        <CardTitle>Staff Performance ({lastDays}d)</CardTitle>
        <CardDescription>
          CPD, Life Support status, QI participation, and crash cart audits per staff member — for appraisal and
          attention-prioritization use. Not visible to staff about each other.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading…
          </p>
        ) : !data || data.roster.length === 0 ? (
          <p className="text-sm text-muted-foreground">No staff linked to this facility yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground border-b">
                  <th className="py-2 pr-3">Provider</th>
                  <th className="py-2 pr-3">CPD</th>
                  <th className="py-2 pr-3">QI reports</th>
                  <th className="py-2 pr-3">Crash cart audits</th>
                  <th className="py-2 pr-3">Life Support</th>
                  <th className="py-2 pr-3">Priority areas</th>
                </tr>
              </thead>
              <tbody>
                {data.roster.map((p) => (
                  <tr key={p.userId} className="border-b border-border/50">
                    <td className="py-2 pr-3 font-medium">{p.name ?? `Provider #${p.userId}`}</td>
                    <td className="py-2 pr-3">{p.cpd.sessionsAttended + p.cpd.sessionsPresented}</td>
                    <td className="py-2 pr-3">{p.qi.careSignalCount + p.qi.codeSignalCount}</td>
                    <td className="py-2 pr-3">{p.crashCartAudits}</td>
                    <td className="py-2 pr-3">
                      {p.lifeSupport.length === 0 ? (
                        <span className="text-muted-foreground">—</span>
                      ) : (
                        p.lifeSupport.map((l) => l.programType.toUpperCase()).join(", ")
                      )}
                    </td>
                    <td className="py-2 pr-3">
                      {p.priorityFlags.length === 0 ? (
                        <span className="text-muted-foreground">—</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {p.priorityFlags.map((f) => (
                            <Badge key={f} variant="outline" className="text-xs border-amber-400 text-amber-700 gap-1">
                              <AlertTriangle className="h-3 w-3" />
                              {FLAG_LABELS[f] ?? f}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
