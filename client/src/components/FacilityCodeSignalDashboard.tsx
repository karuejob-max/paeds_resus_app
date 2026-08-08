/**
 * Sibling of FacilityCareSignalDashboard.tsx, deliberately scoped down —
 * see facility-code-signal.service.ts for why (no v2 QI metrics, no
 * ResusGPS adoption, no roster-completeness check).
 */
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertTriangle } from "lucide-react";
import {
  CONDITION_CATEGORY_LABELS,
  PATIENT_CATEGORY_LABELS,
  OUTCOME_CATEGORY_LABELS,
} from "@/lib/code-signal";

type Props = {
  lastDays?: number;
};

export function FacilityCodeSignalDashboard({ lastDays = 90 }: Props) {
  const { data, isLoading } = trpc.institution.getCodeSignalFacilityDashboard.useQuery({ lastDays });

  if (isLoading || !data) {
    return (
      <p className="text-sm text-muted-foreground flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading facility Code Signal dashboard…
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Submissions ({data.lastDays}d)</CardDescription>
            <CardTitle className="text-2xl">{data.totalSubmissions}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>This month</CardDescription>
            <CardTitle className="text-2xl">{data.submissionsThisMonth}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pending review</CardDescription>
            <CardTitle className="text-2xl flex items-center gap-2">
              {data.pendingCount}
              {data.pendingCount > 0 ? <AlertTriangle className="h-5 w-5 text-amber-600" /> : null}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {Object.keys(data.conditionBreakdown).length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Presenting conditions ({data.lastDays}d)</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="text-sm space-y-1">
              {Object.entries(data.conditionBreakdown)
                .sort((a, b) => b[1] - a[1])
                .map(([code, n]) => (
                  <li key={code} className="flex justify-between">
                    <span>{CONDITION_CATEGORY_LABELS[code as keyof typeof CONDITION_CATEGORY_LABELS] ?? code}</span>
                    <Badge variant="secondary">{n}</Badge>
                  </li>
                ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      {Object.keys(data.patientCategoryBreakdown).length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Patient category ({data.lastDays}d)</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="text-sm space-y-1">
              {Object.entries(data.patientCategoryBreakdown)
                .sort((a, b) => b[1] - a[1])
                .map(([code, n]) => (
                  <li key={code} className="flex justify-between">
                    <span>{PATIENT_CATEGORY_LABELS[code as keyof typeof PATIENT_CATEGORY_LABELS] ?? code}</span>
                    <Badge variant="secondary">{n}</Badge>
                  </li>
                ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      {data.recentEvents.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent events</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="text-xs space-y-2 max-h-56 overflow-y-auto">
              {data.recentEvents.map((e) => (
                <li key={e.id} className="border-b border-border/50 pb-1">
                  <span className="font-medium">
                    {CONDITION_CATEGORY_LABELS[e.conditionCategory as keyof typeof CONDITION_CATEGORY_LABELS] ?? e.conditionCategory}
                  </span>{" "}
                  · {OUTCOME_CATEGORY_LABELS[e.outcomeCategory as keyof typeof OUTCOME_CATEGORY_LABELS] ?? e.outcomeCategory} ·{" "}
                  <Badge variant="outline">{e.status}</Badge>
                  <span className="text-muted-foreground block">
                    {new Date(e.eventDate).toLocaleDateString()}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : (
        <p className="text-sm text-muted-foreground">No Code Signal submissions for this facility in the selected window.</p>
      )}
    </div>
  );
}
