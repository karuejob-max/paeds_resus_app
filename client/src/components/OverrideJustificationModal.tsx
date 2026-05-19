/**
 * Phase 4: Override Justification Modal
 * 
 * Captures clinician justification when they override system recommendations.
 * Provides pre-defined templates and free-text option for flexibility.
 * Ensures accountability while maintaining workflow efficiency.
 */

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, CheckCircle } from 'lucide-react';
import { api } from '@/utils/api';

export type OverrideType =
  | 'skip_rhythm_check'
  | 'medication_timing'
  | 'shock_energy'
  | 'antiarrhythmic_selection'
  | 'skip_medication'
  | 'continue_cpr_beyond_protocol'
  | 'other';

interface OverrideJustificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (justification: string, templateId?: number) => Promise<void>;
  overrideType: OverrideType;
  recommendedAction: string;
  actualAction: string;
  isHighRisk?: boolean;
  cprSessionId: number;
}

const OVERRIDE_TYPE_LABELS: Record<OverrideType, string> = {
  skip_rhythm_check: 'Skipped Rhythm Check',
  medication_timing: 'Medication Timing Deviation',
  shock_energy: 'Shock Energy Adjustment',
  antiarrhythmic_selection: 'Antiarrhythmic Selection',
  skip_medication: 'Skipped Medication',
  continue_cpr_beyond_protocol: 'Extended CPR Beyond Protocol',
  other: 'Other Override',
};

const OVERRIDE_DESCRIPTIONS: Record<OverrideType, string> = {
  skip_rhythm_check: 'You skipped a scheduled rhythm assessment. This may impact treatment decisions.',
  medication_timing: 'You administered medication outside the recommended timing window.',
  shock_energy: 'You manually adjusted the defibrillation energy.',
  antiarrhythmic_selection: 'You selected a different antiarrhythmic than recommended.',
  skip_medication: 'You declined a recommended medication.',
  continue_cpr_beyond_protocol: 'You continued CPR beyond the standard termination time.',
  other: 'You made a clinical decision that deviated from the system recommendation.',
};

export const OverrideJustificationModal: React.FC<OverrideJustificationModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  overrideType,
  recommendedAction,
  actualAction,
  isHighRisk = false,
  cprSessionId,
}) => {
  const [justification, setJustification] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch justification templates
  const { data: templates } = api.cprOverride.getJustificationTemplates.useQuery({
    overrideType,
  });

  const handleSubmit = async () => {
    if (!justification.trim()) {
      setError('Please provide a justification for this override');
      return;
    }

    if (justification.trim().length < 10) {
      setError('Justification must be at least 10 characters');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onSubmit(justification, selectedTemplate ?? undefined);
      setJustification('');
      setSelectedTemplate(null);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to log override');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTemplateSelect = (templateId: number, templateText: string) => {
    setSelectedTemplate(templateId);
    setJustification(templateText);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isHighRisk && <AlertTriangle className="h-5 w-5 text-red-500" />}
            Clinical Override - Justification Required
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* High-Risk Warning */}
          {isHighRisk && (
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                <strong>High-Risk Override:</strong> This deviation from protocol is flagged for quality review.
                Your justification will be audited by clinical leadership.
              </AlertDescription>
            </Alert>
          )}

          {/* Override Context */}
          <div className="space-y-3 rounded-lg bg-gray-50 p-4">
            <div>
              <p className="text-sm font-semibold text-gray-700">Override Type</p>
              <p className="text-base font-bold text-gray-900">{OVERRIDE_TYPE_LABELS[overrideType]}</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-sm font-semibold text-gray-700">System Recommended</p>
                <p className="text-sm text-gray-900">{recommendedAction}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-700">You Did</p>
                <p className="text-sm text-gray-900">{actualAction}</p>
              </div>
            </div>

            <p className="text-sm italic text-gray-600">{OVERRIDE_DESCRIPTIONS[overrideType]}</p>
          </div>

          {/* Template Selection */}
          {templates && templates.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm font-semibold text-gray-700">Quick Justification (Optional)</p>
              <RadioGroup value={selectedTemplate?.toString() ?? ''} onValueChange={(val) => {
                const templateId = parseInt(val);
                const template = templates.find(t => t.id === templateId);
                if (template) {
                  handleTemplateSelect(templateId, template.templateText);
                }
              }}>
                <div className="space-y-2">
                  {templates.map((template) => (
                    <div key={template.id} className="flex items-start space-x-2">
                      <RadioGroupItem value={template.id.toString()} id={`template-${template.id}`} />
                      <Label htmlFor={`template-${template.id}`} className="flex-1 cursor-pointer">
                        <span className="text-sm font-medium text-gray-900">{template.templateText}</span>
                        <span className="ml-2 text-xs text-gray-500">({template.category})</span>
                      </Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            </div>
          )}

          {/* Custom Justification */}
          <div className="space-y-2">
            <Label htmlFor="justification" className="text-sm font-semibold text-gray-700">
              Your Justification
              <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="justification"
              placeholder="Explain why you made this clinical decision. Be specific about patient condition, equipment, or other factors that influenced your decision."
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              rows={4}
              className="resize-none"
            />
            <p className="text-xs text-gray-500">
              {justification.length}/500 characters
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">{error}</AlertDescription>
            </Alert>
          )}

          {/* Accountability Notice */}
          <Alert className="border-blue-200 bg-blue-50">
            <CheckCircle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              <strong>Accountability:</strong> This override will be logged with your name and timestamp for quality
              improvement audits. Your clinical reasoning helps us improve the system.
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !justification.trim()}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isSubmitting ? 'Logging...' : 'Log Override & Continue'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default OverrideJustificationModal;
