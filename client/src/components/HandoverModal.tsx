import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { HandoverSummary } from './HandoverSummary';
import { SBARHandover } from '@/lib/sbarHandover';

interface HandoverModalProps {
  isOpen: boolean;
  handover: SBARHandover | null;
  onClose: () => void;
  onExport?: (format: 'text' | 'pdf' | 'email') => void;
}

export function HandoverModal({ isOpen, handover, onClose, onExport }: HandoverModalProps) {
  if (!handover) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] w-full max-w-4xl overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>Clinical Handover Summary</DialogTitle>
              <DialogDescription>
                Review and export patient handover for escalation to higher level of care
              </DialogDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="mt-4">
          <HandoverSummary handover={handover} onExport={onExport} />
        </div>

        <div className="mt-6 flex justify-end gap-2 border-t pt-4">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button onClick={onClose} className="bg-blue-600 hover:bg-blue-700">
            Proceed with Escalation
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
