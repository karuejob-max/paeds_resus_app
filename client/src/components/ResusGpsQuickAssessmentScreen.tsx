import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { ArrowRight, CheckCircle2, CircleHelp, Heart, Siren, UserRound, Wind } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { getAgeCategory, resolveBlsAssessment, type BLSAssessmentAnswer } from '@/lib/resus/abcdeEngine';

type Responsiveness = 'responsive' | 'unresponsive';
type Breathing = 'normal' | 'abnormal' | 'absent';
type Pulse = 'present' | 'absent' | 'unknown';

interface ResusGpsQuickAssessmentScreenProps {
  patientAge?: string | null;
  onAnswer: (answer: BLSAssessmentAnswer) => void;
}

const CHOICE_STYLE = 'w-full min-h-[56px] justify-start text-left whitespace-normal';

function ChoiceButton({
  active,
  children,
  onClick,
  tone = 'default',
}: {
  active: boolean;
  children: ReactNode;
  onClick: () => void;
  tone?: 'default' | 'danger' | 'warning';
}) {
  return (
    <Button
      type="button"
      variant="outline"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        CHOICE_STYLE,
        active && tone === 'danger' && 'border-red-500 bg-red-500/15 text-red-700 dark:text-red-200 ring-2 ring-red-500/30',
        active && tone === 'warning' && 'border-amber-500 bg-amber-500/15 text-amber-800 dark:text-amber-100 ring-2 ring-amber-500/30',
        active && tone === 'default' && 'border-primary bg-primary/10 ring-2 ring-primary/20',
      )}
    >
      {children}
    </Button>
  );
}

export function ResusGpsQuickAssessmentScreen({ patientAge, onAnswer }: ResusGpsQuickAssessmentScreenProps) {
  const [responsiveness, setResponsiveness] = useState<Responsiveness | null>(null);
  const [breathing, setBreathing] = useState<Breathing | null>(null);
  const [pulse, setPulse] = useState<Pulse | null>(null);

  const ageCategory = getAgeCategory(patientAge ?? null);
  const pulseSite = ageCategory === 'neonate' || ageCategory === 'infant'
    ? 'brachial pulse'
    : ageCategory === 'child'
      ? 'carotid or femoral pulse'
      : 'carotid pulse';

  const decision = useMemo(() => {
    if (!responsiveness || !breathing || !pulse) return null;
    return resolveBlsAssessment(responsiveness, breathing, pulse);
  }, [responsiveness, breathing, pulse]);

  const canContinue = decision !== null;
  const autoAdvancedArrestRef = useRef(false);

  useEffect(() => {
    if (decision !== 'cardiac_arrest' || autoAdvancedArrestRef.current) return;
    autoAdvancedArrestRef.current = true;
    onAnswer('cardiac_arrest');
  }, [decision, onAnswer]);

  return (
    <div className="flex flex-col min-h-[70vh] px-3 sm:px-4 py-4 sm:py-6 max-w-xl mx-auto w-full">
      <header className="mb-4 sm:mb-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">Step 1 · BLS assessment</p>
            <h2 className="text-xl sm:text-2xl font-bold text-foreground mt-1">Is this cardiac arrest?</h2>
            <p className="text-sm text-muted-foreground leading-snug mt-1">
              Check responsiveness, normal breathing, and a pulse. If unsure, treat the arrest pathway as the safer branch and call for help.
            </p>
          </div>
          <Badge variant="outline" className="shrink-0">Age: {patientAge || 'not entered'}</Badge>
        </div>
      </header>

      <div className="space-y-3">
        <Card className={cn('border', responsiveness && 'border-primary/50')}>
          <CardHeader className="pb-2 px-3 sm:px-4">
            <CardTitle className="text-sm sm:text-base flex items-center gap-2">
              <UserRound className="h-5 w-5 text-violet-600" aria-hidden />
              1. Responsiveness
            </CardTitle>
            <p className="text-xs text-muted-foreground">Tap the patient and speak loudly.</p>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-2 px-3 sm:px-4 pb-3">
            <ChoiceButton active={responsiveness === 'responsive'} onClick={() => setResponsiveness('responsive')}>
              <CheckCircle2 className="h-5 w-5 mr-2 shrink-0 text-green-600" aria-hidden />
              Responsive
            </ChoiceButton>
            <ChoiceButton active={responsiveness === 'unresponsive'} tone="danger" onClick={() => setResponsiveness('unresponsive')}>
              <Siren className="h-5 w-5 mr-2 shrink-0 text-red-600" aria-hidden />
              Unresponsive
            </ChoiceButton>
          </CardContent>
        </Card>

        <Card className={cn('border', breathing && 'border-primary/50')}>
          <CardHeader className="pb-2 px-3 sm:px-4">
            <CardTitle className="text-sm sm:text-base flex items-center gap-2">
              <Wind className="h-5 w-5 text-sky-600" aria-hidden />
              2. Breathing
            </CardTitle>
            <p className="text-xs text-muted-foreground">Look for normal breathing; gasping is not normal breathing.</p>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-2 px-3 sm:px-4 pb-3">
            <ChoiceButton active={breathing === 'normal'} onClick={() => setBreathing('normal')}>
              <CheckCircle2 className="h-5 w-5 mr-2 shrink-0 text-green-600" aria-hidden />
              Normal
            </ChoiceButton>
            <ChoiceButton active={breathing === 'abnormal'} tone="warning" onClick={() => setBreathing('abnormal')}>
              <CircleHelp className="h-5 w-5 mr-2 shrink-0 text-amber-600" aria-hidden />
              Abnormal / gasping
            </ChoiceButton>
            <ChoiceButton active={breathing === 'absent'} tone="danger" onClick={() => setBreathing('absent')}>
              <Siren className="h-5 w-5 mr-2 shrink-0 text-red-600" aria-hidden />
              Absent
            </ChoiceButton>
          </CardContent>
        </Card>

        <Card className={cn('border', pulse && 'border-primary/50')}>
          <CardHeader className="pb-2 px-3 sm:px-4">
            <CardTitle className="text-sm sm:text-base flex items-center gap-2">
              <Heart className="h-5 w-5 text-rose-600" aria-hidden />
              3. Pulse
            </CardTitle>
            <p className="text-xs text-muted-foreground">Check for no more than 10 seconds at the age-appropriate site: {pulseSite}.</p>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-2 px-3 sm:px-4 pb-3">
            <ChoiceButton active={pulse === 'present'} onClick={() => setPulse('present')}>
              <CheckCircle2 className="h-5 w-5 mr-2 shrink-0 text-green-600" aria-hidden />
              Present
            </ChoiceButton>
            <ChoiceButton active={pulse === 'absent'} tone="danger" onClick={() => setPulse('absent')}>
              <Siren className="h-5 w-5 mr-2 shrink-0 text-red-600" aria-hidden />
              Absent
            </ChoiceButton>
            <ChoiceButton active={pulse === 'unknown'} tone="warning" onClick={() => setPulse('unknown')}>
              <CircleHelp className="h-5 w-5 mr-2 shrink-0 text-amber-600" aria-hidden />
              Not sure
            </ChoiceButton>
          </CardContent>
        </Card>
      </div>

      {decision === 'cardiac_arrest' && (
        <div className="mt-4 rounded-xl border-2 border-red-500 bg-red-500/10 p-3" role="alert">
          <p className="font-bold text-red-800 dark:text-red-200">Cardiac arrest suspected</p>
            <p className="text-sm text-red-900/80 dark:text-red-100/80 mt-1">Call for help and start chest compressions. CPR-GPS is opening automatically.</p>
        </div>
      )}
      {decision === 'no_cardiac_arrest' && (
        <div className="mt-4 rounded-xl border border-primary/40 bg-primary/10 p-3" role="status">
          <p className="font-bold text-foreground">No cardiac arrest branch selected</p>
          <p className="text-sm text-muted-foreground mt-1">Continue to XABCDE primary survey. Airway and breathing threats remain urgent.</p>
        </div>
      )}

      <div className="mt-4 sm:mt-5">
        <Button
          size="lg"
          className={cn('w-full min-h-[56px] text-base sm:text-lg font-bold', decision === 'cardiac_arrest' && 'bg-red-600 hover:bg-red-700')}
          disabled={!canContinue}
          onClick={() => onAnswer(decision!)}
        >
          {decision === 'cardiac_arrest' ? 'Open CPR-GPS now' : 'Continue to XABCDE primary survey'}
          <ArrowRight className="h-5 w-5 ml-2" aria-hidden />
        </Button>
      </div>

      <p className="text-center text-xs text-muted-foreground mt-3 leading-snug">
        The next step is age-aware guidance. Do not wait for a perfect history before treating immediate threats.
      </p>
    </div>
  );
}
