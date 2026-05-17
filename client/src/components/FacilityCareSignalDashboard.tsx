import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Loader2, Building2, Users, AlertTriangle } from "lucide-react";

type Props = {
  facilityId?: number;
  facilityName?: string;
  lastDays?: number;
  /** When true, uses institution router (hospital admin) — facility name from linked account. */
  institutionMode?: boolean;
};

export function FacilityCareSignalDashboard({
  facilityId,
  facilityName = "",
  lastDays = 90,
  institutionMode = false,
}: Props) {
  const adminQuery = trpc.adminStats.getFacilityCareSignalDashboard.useQuery(
    { facilityId, facilityName: facilityName || undefined, lastDays },
    {
      enabled:
        !institutionMode && Boolean(facilityId || facilityName.trim().length > 0),
    }
  );
  const institutionQuery = trpc.institution.getCareSignalFacilityDashboard.useQuery(
    { lastDays },
    { enabled: institutionMode }
  );
  const { data, isLoading } = institutionMode ? institutionQuery : adminQuery;

  if (isLoading || !data) {
    return (
      <p className="text-sm text-muted-foreground flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading facility Care Signal dashboard…
      </p>
    );
  }

  const reporterRate =
    data.providersRegistered > 0
      ? Math.round((data.uniqueReporters / data.providersRegistered) * 100)
      : 0;

  return (
    <div className="space-y-4">
      {data.facilityCounty || data.facilityCountry ? (
        <p className="text-sm text-muted-foreground">
          Location: {[data.facilityCounty, data.facilityCountry].filter(Boolean).join(", ")}
        </p>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
            <CardDescription>Under review</CardDescription>
            <CardTitle className="text-2xl flex items-center gap-2">
              {data.underReviewCount}
              {data.underReviewCount > 0 ? (
                <AlertTriangle className="h-5 w-5 text-amber-600" />
              ) : null}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Reporter coverage</CardDescription>
            <CardTitle className="text-2xl">
              {data.uniqueReporters}/{data.providersRegistered}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={reporterRate} className="h-2" />
            <p className="text-xs text-muted-foreground mt-1">{reporterRate}% of roster submitted</p>
          </CardContent>
        </Card>
      </div>

      {data.topGaps.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Top system gaps
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="text-sm space-y-1">
              {data.topGaps.map((g) => (
                <li key={g.gap} className="flex justify-between">
                  <span>{g.gap}</span>
                  <Badge variant="secondary">{g.count}</Badge>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      {data.providersWithoutSubmissionList.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-5 w-5" />
              Providers without Care Signal ({data.providersWithoutSubmission})
            </CardTitle>
            <CardDescription>Roster at this facility with no submission in window</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="text-xs space-y-1 max-h-40 overflow-y-auto">
              {data.providersWithoutSubmissionList.map((p) => (
                <li key={p.userId}>
                  {p.userName ?? "—"} · {p.userEmail ?? "—"}
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
                  <span className="font-medium">{e.eventType}</span> · {e.outcome} ·{" "}
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
        <p className="text-sm text-muted-foreground">No Care Signal submissions for this facility in the selected window.</p>
      )}
    </div>
  );
}
