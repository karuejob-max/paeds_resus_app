/**
 * Zero-ambiguity clinical evidence capture — one field at a time, value or Not available.
 */

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Ban } from 'lucide-react';
import {
  clinicalEvidenceProgress,
  isClinicalEvidenceFieldResolved,
  setClinicalEvidenceEntry,
  type ClinicalEvidenceEntry,
  type ClinicalEvidenceFieldDef,
  type ClinicalEvidenceRecord,
} from '@shared/clinical-evidence';

interface StructuredClinicalEvidencePanelProps {
  title: string;
  description: string;
  fields: ClinicalEvidenceFieldDef[];
  record: ClinicalEvidenceRecord;
  onChange: (next: ClinicalEvidenceRecord) => void;
}

export function StructuredClinicalEvidencePanel({
  title,
  description,
  fields,
  record,
  onChange,
}: StructuredClinicalEvidencePanelProps) {
  const progress = clinicalEvidenceProgress(fields, record);

  function setEntry(fieldId: string, entry: ClinicalEvidenceEntry) {
    onChange(setClinicalEvidenceEntry(record, fieldId, entry));
  }

  if (fields.length === 0) return null;

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
        <div className="flex items-center gap-2 mt-2">
          <Progress value={progress.percent} className="h-1.5 flex-1" />
          <span className="text-[10px] text-muted-foreground shrink-0">
            {progress.completed}/{progress.total}
          </span>
        </div>
      </div>

      {fields.map((field) => {
        const entry = record[field.id];
        const resolved = isClinicalEvidenceFieldResolved(entry);
        const isPresence = field.type === 'presence';

        return (
          <div
            key={field.id}
            className={`rounded-lg border p-3 ${
              resolved ? 'border-green-500/30 bg-green-500/5' : 'border-border bg-accent/10'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                {field.phase && (
                  <Badge variant="outline" className="text-[9px] mb-1">
                    {field.phase}
                  </Badge>
                )}
                <p className="text-sm font-medium text-foreground">{field.label}</p>
                {resolved && (
                  <p className="text-[11px] text-muted-foreground mt-1">
                    {entry!.status === 'not_available'
                      ? 'Not available (documented)'
                      : entry!.status === 'present'
                        ? 'Present'
                        : entry!.status === 'absent'
                          ? 'Absent'
                          : `${entry!.status === 'value' ? entry!.value : ''}${field.unit ? ` ${field.unit}` : ''}`}
                  </p>
                )}
              </div>
              {resolved && <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />}
            </div>

            {!resolved && (
              <div className="mt-2 space-y-2">
                {isPresence ? (
                  <div className="flex flex-wrap gap-1">
                    <Button size="sm" className="h-7 text-xs" onClick={() => setEntry(field.id, { status: 'present' })}>
                      Present
                    </Button>
                    <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setEntry(field.id, { status: 'absent' })}>
                      Absent
                    </Button>
                    <Button size="sm" variant="secondary" className="h-7 text-xs" onClick={() => setEntry(field.id, { status: 'not_available' })}>
                      <Ban className="h-3 w-3 mr-1" /> Not assessed
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="flex gap-2">
                      <Input
                        type={field.type === 'numeric' ? 'number' : 'text'}
                        inputMode={field.type === 'numeric' ? 'decimal' : 'text'}
                        placeholder={field.placeholder ?? `Enter ${field.label}`}
                        className="text-sm bg-background"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            const val = (e.target as HTMLInputElement).value.trim();
                            if (val) setEntry(field.id, { status: 'value', value: val });
                          }
                        }}
                      />
                      {field.unit && (
                        <span className="text-xs text-muted-foreground self-center shrink-0">{field.unit}</span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      <Button
                        size="sm"
                        className="h-7 text-xs"
                        onClick={(e) => {
                          const input = (e.currentTarget.parentElement?.previousElementSibling?.querySelector('input') as HTMLInputElement);
                          const val = input?.value.trim();
                          if (val) setEntry(field.id, { status: 'value', value: val });
                        }}
                      >
                        Submit value
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="h-7 text-xs"
                        onClick={() => setEntry(field.id, { status: 'not_available' })}
                      >
                        <Ban className="h-3 w-3 mr-1" /> Not available
                      </Button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
