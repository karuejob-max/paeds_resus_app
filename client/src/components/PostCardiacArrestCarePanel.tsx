import { CheckCircle2, ClipboardCheck, ShieldAlert } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  POST_CARDIAC_ARREST_CARE_ITEMS,
  type PostCardiacArrestCare,
} from '@/lib/resus/abcdeEngine';

interface Props {
  care?: PostCardiacArrestCare;
  lifeSupportPackLabel: string;
  onChange: (itemId: string, checked: boolean) => void;
}

export function PostCardiacArrestCarePanel({ care, lifeSupportPackLabel, onChange }: Props) {
  const completed = new Set(care?.completedItemIds ?? []);
  const complete = Boolean(care?.completedAt);

  return (
    <Card className="border-emerald-300 bg-emerald-50/30 dark:bg-emerald-950/20">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-base text-foreground">
              <ClipboardCheck className="h-5 w-5 text-emerald-600" />
              Post-cardiac arrest care after ROSC
            </CardTitle>
            <CardDescription className="mt-1">
              Continue the age-appropriate {lifeSupportPackLabel} post-arrest algorithm, local escalation policy, and senior review.
            </CardDescription>
          </div>
          <Badge variant={complete ? 'default' : 'outline'} className="shrink-0">
            {complete ? 'Recorded complete' : `${completed.size}/${POST_CARDIAC_ARREST_CARE_ITEMS.length}`}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <Alert className="border-amber-300 bg-amber-50/70 dark:bg-amber-950/20">
          <ShieldAlert className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-xs text-foreground">
            ROSC is not the end of resuscitation. Keep monitoring, treat reversible causes, document deterioration, and escalate early.
          </AlertDescription>
        </Alert>

        <div className="space-y-2" role="group" aria-label="Post-cardiac arrest care checklist">
          {POST_CARDIAC_ARREST_CARE_ITEMS.map((item) => {
            const checked = completed.has(item.id);
            return (
              <label
                key={item.id}
                className={`flex min-h-[52px] cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 text-sm transition-colors ${
                  checked ? 'border-emerald-400 bg-emerald-100/70 dark:bg-emerald-900/30' : 'border-border bg-background'
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(event) => onChange(item.id, event.target.checked)}
                  className="h-5 w-5 shrink-0 accent-emerald-600"
                />
                <span className="flex-1 text-foreground">{item.label}</span>
                {checked ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" aria-hidden /> : null}
              </label>
            );
          })}
        </div>

        <p className="text-xs text-muted-foreground">
          This checklist records that the recovery domains were addressed; it does not replace the governed NRP, PALS, or ACLS algorithm or local clinical orders.
        </p>
      </CardContent>
    </Card>
  );
}
