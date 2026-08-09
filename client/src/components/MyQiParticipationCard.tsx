/**
 * Personal QI participation tracker for a provider's own dashboard —
 * CEO-requested 2026-08-09: individuals should be able to track their own
 * progress the same way institutions can track their roster.
 *
 * Uses the existing getEventHistory queries (Care Signal + Code Signal),
 * requesting limit: 1 purely to read their `total` field cheaply — no new
 * backend query needed, since both already return a total count scoped to
 * the current user.
 *
 * Deliberately shows only the provider's own NAMED submissions (what
 * getEventHistory already scopes to `userId = ctx.user.id`) — anonymous or
 * pseudonymous submissions genuinely cannot be tied back to the provider
 * afterward, by design, so they don't appear here either. That's not a
 * gap; it's the same choice the institutional roster respects.
 */
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { HeartPulse, Siren, Loader2 } from "lucide-react";

export function MyQiParticipationCard() {
  const careSignal = trpc.careSignalEvents.getEventHistory.useQuery({ limit: 1, offset: 0 });
  const codeSignal = trpc.codeSignalEvents.getEventHistory.useQuery({ limit: 1, offset: 0 });

  const isLoading = careSignal.isLoading || codeSignal.isLoading;
  const careTotal = careSignal.data?.total ?? 0;
  const codeTotal = codeSignal.data?.total ?? 0;

  return (
    <Card className="border-emerald-200 overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">My QI Participation</CardTitle>
        <CardDescription>
          Reports you've filed under your name — your institution can see these counts too, for appraisal use. Report
          content always stays confidential; only the count is shared.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading…
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <Siren className="h-6 w-6 text-red-600 shrink-0" />
              <div>
                <p className="text-2xl font-bold">{careTotal}</p>
                <p className="text-xs text-muted-foreground">Care Signal reports</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <HeartPulse className="h-6 w-6 text-brand-teal shrink-0" />
              <div>
                <p className="text-2xl font-bold">{codeTotal}</p>
                <p className="text-xs text-muted-foreground">Code Signal reports</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
