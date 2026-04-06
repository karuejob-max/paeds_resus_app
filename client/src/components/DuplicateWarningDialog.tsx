/**
 * Duplicate Medication Warning Dialog
 * 
 * Shows when provider attempts to order a medication that's already active.
 * Allows override if clinically necessary.
 */

import { AlertTriangle, CheckCircle2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { DuplicateCheckResult } from '@/lib/resus/medication-deduplication';

interface DuplicateWarningDialogProps {
  open: boolean;
  result: DuplicateCheckResult;
  onContinue: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function DuplicateWarningDialog({
  open,
  result,
  onContinue,
  onCancel,
  isLoading = false,
}: DuplicateWarningDialogProps) {
  if (!result.isDuplicate) return null;

  const isDanger = result.severity === 'danger';

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle
              className={`h-5 w-5 ${isDanger ? 'text-red-500' : 'text-amber-500'}`}
            />
            <DialogTitle>
              {isDanger ? 'Duplicate Medication Alert' : 'Medication Already Given'}
            </DialogTitle>
          </div>
          <DialogDescription className="pt-2">
            {result.message}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {result.existingIntervention && (
            <div
              className={`p-3 rounded-lg border ${
                isDanger
                  ? 'bg-red-500/10 border-red-500/30'
                  : 'bg-amber-500/10 border-amber-500/30'
              }`}
            >
              <div className="flex items-start gap-2">
                <CheckCircle2
                  className={`h-4 w-4 shrink-0 mt-0.5 ${
                    isDanger ? 'text-red-500' : 'text-amber-500'
                  }`}
                />
                <div className="text-sm">
                  <p className="font-medium">Active Intervention</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {result.existingIntervention.action}
                  </p>
                  {result.existingIntervention.dose && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Dose: {result.existingIntervention.dose.dosePerKg}{' '}
                      {result.existingIntervention.dose.unit}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {isDanger && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30">
              <p className="text-xs font-medium text-red-600">
                ⚠️ Giving this medication now could cause overdosing.
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onCancel} disabled={isLoading}>
            <X className="h-4 w-4 mr-1" />
            Cancel
          </Button>
          {result.allowOverride && (
            <Button
              variant={isDanger ? 'destructive' : 'default'}
              onClick={onContinue}
              disabled={isLoading}
            >
              {isDanger ? 'Give Anyway' : 'Continue'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
