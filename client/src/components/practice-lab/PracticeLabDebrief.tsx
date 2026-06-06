import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, RotateCcw, CalendarPlus } from "lucide-react";
import { buildNarrativeDebrief, buildScriptedDebrief } from "@/lib/practiceLab/debrief";
import type { PracticeLabEvent } from "@shared/practice-lab-types";
import { useState } from "react";

type Props = {
  trackName: string;
  scenarioName: string;
  score: number;
  passed: boolean;
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
  events,
  onRetry,
  onBack,
  onBookSession,
  showNarrative = true,
}: Props) {
  const [showAiNarrative, setShowAiNarrative] = useState(false);
  const scripted = buildScriptedDebrief({ trackName, scenarioName, score, passed, events });
  const narrative = buildNarrativeDebrief({ trackName, scenarioName, score, passed, events });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {passed ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          ) : (
            <XCircle className="h-5 w-5 text-amber-600" />
          )}
          Debrief — {scenarioName}
        </CardTitle>
        <Badge variant={passed ? "default" : "secondary"}>{score}/100</Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <ul className="text-sm space-y-2">
          {scripted.map((line, i) => (
            <li key={i} className={line.startsWith("•") ? "ml-2 text-muted-foreground" : "font-medium"}>
              {line}
            </li>
          ))}
        </ul>

        {showNarrative && (
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
