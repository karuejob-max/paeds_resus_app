/**
 * Per-provider Code Signal participation roster for institutional QI
 * appraisal use — CEO-requested 2026-08-08. Shows a period-aggregated
 * count only; never per-event detail, timestamps, or report content. See
 * institution.ts's getCodeSignalParticipationRoster for the privacy
 * reasoning (why this is a plain count, not a token/anonymity mechanism).
 */
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Users } from "lucide-react";

type Props = {
  lastDays?: number;
};

export function CodeSignalParticipationRoster({ lastDays = 90 }: Props) {
  const { data, isLoading } = trpc.institution.getCodeSignalParticipationRoster.useQuery({ lastDays });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Users className="h-4 w-4" />
          QI Participation ({lastDays}d)
        </CardTitle>
        <CardDescription>
          Report counts only — for appraisal use. Report content stays confidential; this roster never shows what
          was reported, only that a report was filed.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading…
          </p>
        ) : !data || data.roster.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No named Code Signal submissions from this facility's staff in the selected window.
          </p>
        ) : (
          <ul className="text-sm space-y-2">
            {data.roster.map((p) => (
              <li key={p.userId} className="flex items-center justify-between border-b border-border/50 pb-2">
                <span>{p.name ?? `Provider #${p.userId}`}</span>
                <Badge variant="secondary">{p.count} report{p.count === 1 ? "" : "s"}</Badge>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
