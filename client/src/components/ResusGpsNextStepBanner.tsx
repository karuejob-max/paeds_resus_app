import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { PrimaryNextStepBanner } from '@/lib/resus/resusGpsUxHelpers';
import { ArrowRight, CheckCircle2, GraduationCap, Stethoscope } from 'lucide-react';

interface ResusGpsNextStepBannerProps {
  banner: PrimaryNextStepBanner;
  onReassess?: (interventionId: string) => void;
  onDismissReassessment?: () => void;
  className?: string;
}

export function ResusGpsNextStepBanner({
  banner,
  onReassess,
  onDismissReassessment,
  className,
}: ResusGpsNextStepBannerProps) {
  const Icon =
    banner.kind === 'reassessment'
      ? Stethoscope
      : banner.kind === 'fellowship_saved'
        ? CheckCircle2
        : banner.kind === 'fellowship_primary'
          ? GraduationCap
          : ArrowRight;

  const tone =
    banner.kind === 'reassessment'
      ? 'border-cyan-500/40 bg-cyan-500/10 text-cyan-950 dark:text-cyan-50'
      : banner.kind === 'fellowship_saved'
        ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-950 dark:text-emerald-50'
        : banner.kind === 'fellowship_primary'
          ? 'border-emerald-500/40 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-950 dark:text-emerald-50'
          : 'border-primary/30 bg-primary/5 text-foreground';

  return (
    <div
      className={cn(
        'sticky top-[var(--resus-topbar-offset,3rem)] z-20 border-b px-3 py-2',
        tone,
        className
      )}
      role="status"
      aria-live="polite"
    >
      <div className="container max-w-2xl flex items-start gap-2">
        <Icon className="h-4 w-4 shrink-0 mt-0.5 opacity-80" aria-hidden />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium leading-snug">{banner.message}</p>
          {banner.detail && (
            <p className="text-xs opacity-80 mt-0.5 leading-snug">{banner.detail}</p>
          )}
        </div>
        {banner.kind === 'reassessment' && banner.interventionId && onReassess && (
          <div className="flex shrink-0 gap-1">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="h-8 text-xs"
              onClick={() => onReassess(banner.interventionId!)}
            >
              Re-check
            </Button>
            {onDismissReassessment && (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-8 text-xs"
                onClick={onDismissReassessment}
              >
                Later
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
