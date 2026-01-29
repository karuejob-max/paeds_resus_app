import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, CheckCircle } from 'lucide-react';
import {
  OverrideReason,
  OverrideSeverity,
  validateOverrideReason,
  calculateOverrideSeverity,
  canClinicianOverride,
} from '@/lib/overrideSystem';

interface OverrideDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  actionTitle: string;
  recommendedAction: string;
  engineId: string;
  actionId: string;
  clinicianRole: string;
  onConfirm: (overrideData: {
    reason: OverrideReason;
    reasonDetails: string;
    overriddenAction: string;
  }) => void;
}

const OVERRIDE_REASONS: { value: OverrideReason; label: string; description: string }[] = [
  {
    value: 'clinical_judgment',
    label: 'Clinical Judgment',
    description: 'Based on clinical experience and patient assessment',
  },
  {
    value: 'patient_specific_factors',
    label: 'Patient-Specific Factors',
    description: 'Unique patient circumstances not captured by protocol',
  },
  {
    value: 'resource_unavailable',
    label: 'Resource Unavailable',
    description: 'Required resource not available at this facility',
  },
  {
    value: 'allergy_contraindication',
    label: 'Allergy/Contraindication',
    description: 'Patient allergy or medical contraindication',
  },
  {
    value: 'family_preference',
    label: 'Family Preference',
    description: 'Family/guardian preference documented',
  },
  {
    value: 'facility_protocol',
    label: 'Facility Protocol',
    description: 'Facility-specific protocol differs from recommendation',
  },
  {
    value: 'research_protocol',
    label: 'Research Protocol',
    description: 'Patient enrolled in research protocol',
  },
  {
    value: 'other',
    label: 'Other',
    description: 'Other reason (please specify)',
  },
];

export function OverrideDialog({
  open,
  onOpenChange,
  actionTitle,
  recommendedAction,
  engineId,
  actionId,
  clinicianRole,
  onConfirm,
}: OverrideDialogProps) {
  const [selectedReason, setSelectedReason] = useState<OverrideReason | ''>('');
  const [reasonDetails, setReasonDetails] = useState('');
  const [overriddenAction, setOverriddenAction] = useState('');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const severity = calculateOverrideSeverity(engineId, actionId);
  const permissions = canClinicianOverride(clinicianRole, severity);

  const handleConfirm = () => {
    if (!selectedReason) {
      setValidationErrors(['Please select a reason for override']);
      return;
    }

    if (!overriddenAction) {
      setValidationErrors(['Please specify the action being taken instead']);
      return;
    }

    const validation = validateOverrideReason(
      selectedReason as OverrideReason,
      reasonDetails,
      severity
    );

    if (!validation.valid) {
      setValidationErrors(validation.errors);
      return;
    }

    onConfirm({
      reason: selectedReason as OverrideReason,
      reasonDetails,
      overriddenAction,
    });

    // Reset form
    setSelectedReason('');
    setReasonDetails('');
    setOverriddenAction('');
    setValidationErrors([]);
    onOpenChange(false);
  };

  if (!permissions.canOverride) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Override Not Permitted
            </DialogTitle>
          </DialogHeader>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Your role ({clinicianRole}) does not have permission to override this recommendation.
              Please contact a senior clinician or consultant.
            </AlertDescription>
          </Alert>
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Clinical Override
          </DialogTitle>
          <DialogDescription>
            You are about to override a system recommendation. This action will be logged for quality
            improvement and audit purposes.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Severity Alert */}
          <Alert
            variant={severity === 'critical' ? 'destructive' : 'default'}
          >
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Severity: {severity.toUpperCase()}</strong>
              {severity === 'critical' && ' - This override will be flagged for immediate review'}
              {severity === 'high' && ' - This override requires detailed documentation'}
              {severity === 'medium' && ' - Please document your clinical reasoning'}
              {severity === 'low' && ' - Standard override documentation required'}
            </AlertDescription>
          </Alert>

          {/* Current Recommendation */}
          <div className="rounded-lg bg-blue-50 p-4">
            <p className="text-sm font-semibold text-blue-900">Recommended Action:</p>
            <p className="text-sm text-blue-800">{actionTitle}</p>
            <p className="mt-2 text-xs text-blue-700">{recommendedAction}</p>
          </div>

          {/* Override Reason */}
          <div className="space-y-2">
            <label className="text-sm font-semibold">
              Reason for Override <span className="text-red-500">*</span>
            </label>
            <Select value={selectedReason} onValueChange={(value) => setSelectedReason(value as OverrideReason)}>
              <SelectTrigger>
                <SelectValue placeholder="Select reason..." />
              </SelectTrigger>
              <SelectContent>
                {OVERRIDE_REASONS.map((reason) => (
                  <SelectItem key={reason.value} value={reason.value}>
                    <div>
                      <p className="font-medium">{reason.label}</p>
                      <p className="text-xs text-gray-500">{reason.description}</p>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Reason Details */}
          <div className="space-y-2">
            <label className="text-sm font-semibold">
              Detailed Explanation{' '}
              {(severity === 'high' || severity === 'critical') && (
                <span className="text-red-500">*</span>
              )}
            </label>
            <Textarea
              placeholder={
                severity === 'critical'
                  ? 'Critical override - provide comprehensive clinical reasoning (minimum 50 characters)...'
                  : 'Explain your clinical reasoning for this override...'
              }
              value={reasonDetails}
              onChange={(e) => setReasonDetails(e.target.value)}
              className="min-h-24"
            />
            <p className="text-xs text-gray-500">
              {reasonDetails.length} characters
              {(severity === 'high' || severity === 'critical') && (
                <span className={reasonDetails.length < 50 ? 'text-red-500' : 'text-green-500'}>
                  {' '}
                  (minimum 50 required)
                </span>
              )}
            </p>
          </div>

          {/* Alternative Action */}
          <div className="space-y-2">
            <label className="text-sm font-semibold">
              Action Being Taken Instead <span className="text-red-500">*</span>
            </label>
            <Textarea
              placeholder="Describe the alternative action you are taking..."
              value={overriddenAction}
              onChange={(e) => setOverriddenAction(e.target.value)}
              className="min-h-20"
            />
          </div>

          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <ul className="list-inside list-disc space-y-1">
                  {validationErrors.map((error, idx) => (
                    <li key={idx}>{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Audit Trail Notice */}
          <Alert>
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-xs">
              This override will be recorded with timestamp, clinician ID, patient data, and outcome tracking
              for quality improvement and governance audits.
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            variant={severity === 'critical' ? 'destructive' : 'default'}
          >
            Confirm Override
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
