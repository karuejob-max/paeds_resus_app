import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, RotateCcw, CalendarPlus } from "lucide-react";
import { buildNarrativeDebrief, buildScriptedDebrief } from "@/lib/practiceLab/debrief";
import type { PracticeLabEvent } from "@shared/practice-lab-types";
import { getNextRehearsal, summarizeSimulationDomains } from "@shared/simulation-hub-mastery";
import { useState } from "react";

type Props = {
  trackName: string;
  scenarioName: string;
  score?: number;
  passed?: boolean;
  isFormative?: boolean;
  events: PracticeLabEvent[];
  onRetry: () => void;
  onBack: () => void;
  onBookSession?: () => void;
  showNarrative?: boolean;
};

export function PracticeLabDebrief({
  trackName,
  scenarioName,
  score,
  passed,
  isFormative = false,
  events,
  onRetry,
  onBack,
  onBookSession,
  showNarrative = true,
}: Props) {
  const [showAiNarrative, setShowAiNarrative] = useState(false);
  const scripted = buildScriptedDebrief({ trackName, scenarioName, score: score ?? 0, passed: passed ?? false, events, isFormative });
  const narrative = buildNarrativeDebrief({ trackName, scenarioName, score: score ?? 0, passed: passed ?? false, events, isFormative });
  const domains = summarizeSimulationDomains(events);
  const nextRehearsal = getNextRehearsal(domains);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {!isFormative && passed ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          ) : !isFormative ? (
            <XCircle className="h-5 w-5 text-amber-600" />
          ) : null}
          Debrief — {scenarioName}
        </CardTitle>
        {isFormative ? (
          <Badge variant="secondary">Formative coaching · not assessed</Badge>
        ) : (
          <Badge variant={passed ? "default" : "secondary"}>{score}/100</Badge>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <ul className="text-sm space-y-2">
          {scripted.map((line, i) => (
            <li key={i} className={line.startsWith("•") ? "ml-2 text-muted-foreground" : "font-medium"}>
              {line}
            </li>
          ))}
        </ul>

        <div className="rounded-lg border bg-muted/20 p-3 space-y-3">
          <div>
            <p className="text-sm font-semibold">Your performance map</p>
            <p className="text-xs text-muted-foreground">This is coaching evidence, not a public ranking.</p>
          </div>
          {isFormative ? (
            <div className="space-y-2 text-xs text-muted-foreground">
              <p>Recorded coaching signals:</p>
              <ul className="list-disc space-y-1 pl-5">
                {events.filter((event) => event.description).slice(0, 6).map((event, index) => <li key={`${event.timestamp}-${index}`}>{event.description}</li>)}
              </ul>
            </div>
          ) : (
            <>
              <div className="grid gap-2 sm:grid-cols-2">
                {domains.map((domain) => (
                  <div key={domain.id} className="space-y-1">
                    <div className="flex items-center justify-between text-xs"><span>{domain.label}</span><span className="text-muted-foreground">{domain.score === null ? "No evidence yet" : `${domain.score}%`}</span></div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted"><div className={`h-full rounded-full ${domain.score !== null && domain.score >= 70 ? "bg-emerald-500" : "bg-amber-500"}`} style={{ width: `${domain.score ?? 0}%` }} /></div>
                  </div>
                ))}
              </div>
              {nextRehearsal && nextRehearsal.score !== null && nextRehearsal.score < 70 && <div className="border-t pt-3 text-xs"><span className="font-semibold">Next rehearsal: {nextRehearsal.label}.</span> {nextRehearsal.coaching}</div>}
            </>
          )}
        </div>

        {showNarrative && !isFormative && (
          <div className="border-t pt-4">
            <Button variant="ghost" size="sm" onClick={() => setShowAiNarrative(!showAiNarrative)}>
              {showAiNarrative ? "Hide" : "Show"} narrative summary
            </Button>
            {showAiNarrative && (
              <p className="text-sm text-muted-foreground mt-2 italic">{narrative}</p>
            )}
          </div>
        )}

        <div className="flex flex-wrap gap-2 pt-2">
          <Button onClick={onRetry} variant="outline" className="gap-2">
            <RotateCcw className="h-4 w-4" />
            Retry scenario
          </Button>
          <Button onClick={onBack} variant="secondary">
            Back to track
          </Button>
          {onBookSession && (
            <Button onClick={onBookSession} variant="outline" className="gap-2">
              <CalendarPlus className="h-4 w-4" />
              Book skills session
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
