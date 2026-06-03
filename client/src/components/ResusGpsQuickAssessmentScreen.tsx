import { useMemo, useState, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
  deriveQuickAssessmentRecommendation,
  QUICK_ASSESSMENT_PILLARS,
  toggleQuickAssessmentCue,
  type QuickAssessmentPillarId,
} from '@/lib/resus/resusGpsUxHelpers';
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  Eye,
  Heart,
  Siren,
} from 'lucide-react';

const PILLAR_ICON: Record<QuickAssessmentPillarId, ReactNode> = {
  appearance: <Eye className="h-5 w-5" aria-hidden />,
  work_of_breathing: <Activity className="h-5 w-5" aria-hidden />,
  circulation: <Heart className="h-5 w-5" aria-hidden />,
};

const PILLAR_ACCENT: Record<QuickAssessmentPillarId, string> = {
  appearance: 'border-violet-500/30 bg-violet-500/10',
  work_of_breathing: 'border-sky-500/30 bg-sky-500/10',
  circulation: 'border-rose-500/30 bg-rose-500/10',
};

interface ResusGpsQuickAssessmentScreenProps {
  onAnswer: (answer: 'sick' | 'not_sick') => void;
}

export function ResusGpsQuickAssessmentScreen({ onAnswer }: ResusGpsQuickAssessmentScreenProps) {
  const [selectedCueIds, setSelectedCueIds] = useState<Set<string>>(() => new Set());

  const recommendation = useMemo(
    () => deriveQuickAssessmentRecommendation(selectedCueIds),
    [selectedCueIds]
  );

  const recommendationTone =
    recommendation.level === 'sick'
      ? 'border-destructive/40 bg-destructive/10 text-destructive'
      : recommendation.level === 'reassess'
        ? 'border-amber-500/40 bg-amber-500/10 text-amber-950 dark:text-amber-50'
        : 'border-border bg-muted/40 text-muted-foreground';

  return (
    <div className="flex flex-col min-h-[70vh] px-3 sm:px-4 py-6 max-w-lg mx-auto w-full">
      <header className="text-center mb-5">
        <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-1">Quick look</h2>
        <p className="text-sm text-muted-foreground leading-snug max-w-sm mx-auto">
          Three seconds across the room — does this patient look sick?
        </p>
      </header>

      <div className="space-y-3 mb-4">
        {QUICK_ASSESSMENT_PILLARS.map((pillar) => {
          const pillarSelected = pillar.cues.some((c) => selectedCueIds.has(c.id));
          return (
            <Card
              key={pillar.id}
              className={cn(
                'border transition-colors',
                pillarSelected ? PILLAR_ACCENT[pillar.id] : 'border-border bg-card'
              )}
            >
              <CardContent className="pt-4 pb-3 px-3 sm:px-4">
                <div className="flex items-start gap-2 mb-3">
                  <span className={cn('mt-0.5 opacity-80', pillarSelected && 'text-foreground')}>
                    {PILLAR_ICON[pillar.id]}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-foreground text-sm sm:text-base">{pillar.label}</p>
                    <p className="text-xs text-muted-foreground leading-snug">{pillar.scanFor}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {pillar.cues.map((cue) => {
                    const active = selectedCueIds.has(cue.id);
                    return (
                      <button
                        key={cue.id}
                        type="button"
                        aria-pressed={active}
                        onClick={() => setSelectedCueIds((prev) => toggleQuickAssessmentCue(prev, cue.id))}
                        className={cn(
                          'rounded-full px-3 py-1.5 text-xs sm:text-sm font-medium border transition-colors min-h-[36px]',
                          active
                            ? 'border-destructive/60 bg-destructive/15 text-destructive'
                            : 'border-border bg-background text-foreground hover:bg-muted/60'
                        )}
                      >
                        {cue.label}
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div
        className={cn('rounded-xl border px-3 py-2.5 mb-4 text-center', recommendationTone)}
        role="status"
        aria-live="polite"
      >
        <p className="text-sm font-medium leading-snug">{recommendation.headline}</p>
        <p className="text-xs opacity-90 mt-0.5 leading-snug">{recommendation.detail}</p>
      </div>

      <div className="space-y-3 mt-auto">
        <Button
          size="lg"
          variant="destructive"
          className="w-full py-6 text-base sm:text-lg font-bold min-h-[52px]"
          onClick={() => onAnswer('sick')}
        >
          <Siren className="h-5 w-5 mr-2 shrink-0" aria-hidden />
          Patient looks sick
        </Button>
        <Button
          size="lg"
          variant="outline"
          className="w-full py-5 text-base min-h-[48px]"
          onClick={() => onAnswer('not_sick')}
        >
          <CheckCircle2 className="h-5 w-5 mr-2 shrink-0" aria-hidden />
          Patient looks well
        </Button>
      </div>

      <p className="text-center text-xs text-muted-foreground mt-4 flex items-center justify-center gap-1 leading-snug">
        <ArrowRight className="h-3 w-3 shrink-0" aria-hidden />
        Next: ABCDE primary survey — airway, breathing, circulation, disability, exposure
      </p>
    </div>
  );
}
