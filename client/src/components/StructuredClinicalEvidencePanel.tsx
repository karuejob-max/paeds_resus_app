/**
 * Zero-ambiguity clinical evidence capture — one field at a time, value or Not available.
 */

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CheckCircle2, Ban } from 'lucide-react';
import {
  URINE_KETONE_SEMIQUANT,
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

function formatResolvedValue(field: ClinicalEvidenceFieldDef, entry: ClinicalEvidenceEntry): string {
  if (entry.status === 'not_available') return 'Not available (documented)';
  if (entry.status === 'present') return 'Present';
  if (entry.status === 'absent') return 'Absent';
  if (entry.status !== 'value') return '';

  if (field.type === 'ketones') {
    const [spec, rest] = entry.value.split(':');
    if (spec === 'urine') return `Urine: ${rest}`;
    if (spec === 'blood') {
      const [val, unit] = rest.split('|');
      return `Blood: ${val} ${unit || 'mmol/L'}`;
    }
  }
  if (field.type === 'numeric_with_units' && entry.value.includes('|')) {
    const [val, unit] = entry.value.split('|');
    return `${val} ${unit}`;
  }
  return `${entry.value}${field.unit ? ` ${field.unit}` : ''}`;
}

function KetonesFieldInput({
  field,
  onSubmit,
  onNotAvailable,
}: {
  field: ClinicalEvidenceFieldDef;
  onSubmit: (value: string) => void;
  onNotAvailable: () => void;
}) {
  const [specimen, setSpecimen] = useState<'urine' | 'blood' | ''>('');
  const [urineLevel, setUrineLevel] = useState('');
  const [bloodValue, setBloodValue] = useState('');

  return (
    <div className="space-y-2">
      <Select value={specimen} onValueChange={(v) => setSpecimen(v as 'urine' | 'blood')}>
        <SelectTrigger className="h-8 text-xs bg-background">
          <SelectValue placeholder="Select specimen (urine or blood)" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="urine">Urine</SelectItem>
          <SelectItem value="blood">Blood</SelectItem>
        </SelectContent>
      </Select>

      {specimen === 'urine' && (
        <Select value={urineLevel} onValueChange={setUrineLevel}>
          <SelectTrigger className="h-8 text-xs bg-background">
            <SelectValue placeholder="Semiquantitative result" />
          </SelectTrigger>
          <SelectContent>
            {URINE_KETONE_SEMIQUANT.map((level) => (
              <SelectItem key={level} value={level}>
                {level}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {specimen === 'blood' && (
        <div className="flex gap-2">
          <Input
            type="number"
            inputMode="decimal"
            placeholder="e.g. 4.2"
            className="text-sm bg-background"
            value={bloodValue}
            onChange={(e) => setBloodValue(e.target.value)}
          />
          <span className="text-xs text-muted-foreground self-center shrink-0">mmol/L</span>
        </div>
      )}

      <div className="flex flex-wrap gap-1">
        <Button
          size="sm"
          className="h-7 text-xs"
          disabled={
            specimen === '' ||
            (specimen === 'urine' && !urineLevel) ||
            (specimen === 'blood' && !bloodValue.trim())
          }
          onClick={() => {
            if (specimen === 'urine' && urineLevel) onSubmit(`urine:${urineLevel}`);
            if (specimen === 'blood' && bloodValue.trim())
              onSubmit(`blood:${bloodValue.trim()}|mmol/L`);
          }}
        >
          Submit value
        </Button>
        <Button size="sm" variant="secondary" className="h-7 text-xs" onClick={onNotAvailable}>
          <Ban className="h-3 w-3 mr-1" /> Not available
        </Button>
      </div>
    </div>
  );
}

function NumericWithUnitsFieldInput({
  field,
  onSubmit,
  onNotAvailable,
}: {
  field: ClinicalEvidenceFieldDef;
  onSubmit: (value: string) => void;
  onNotAvailable: () => void;
}) {
  const [value, setValue] = useState('');
  const [unit, setUnit] = useState(field.unitOptions?.[0] ?? '');

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          type="number"
          inputMode="decimal"
          placeholder={field.placeholder ?? `Enter ${field.label}`}
          className="text-sm bg-background"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        {field.unitOptions && field.unitOptions.length > 0 && (
          <Select value={unit} onValueChange={setUnit}>
            <SelectTrigger className="h-9 w-[110px] text-xs bg-background shrink-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {field.unitOptions.map((u) => (
                <SelectItem key={u} value={u}>
                  {u}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
      <div className="flex flex-wrap gap-1">
        <Button
          size="sm"
          className="h-7 text-xs"
          disabled={!value.trim() || !unit}
          onClick={() => onSubmit(`${value.trim()}|${unit}`)}
        >
          Submit value
        </Button>
        <Button size="sm" variant="secondary" className="h-7 text-xs" onClick={onNotAvailable}>
          <Ban className="h-3 w-3 mr-1" /> Not available
        </Button>
      </div>
    </div>
  );
}

function StandardValueFieldInput({
  field,
  onSubmit,
  onNotAvailable,
}: {
  field: ClinicalEvidenceFieldDef;
  onSubmit: (value: string) => void;
  onNotAvailable: () => void;
}) {
  const inputType = field.type === 'numeric' || field.type === 'glucose_vitals' ? 'number' : 'text';

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          type={inputType}
          inputMode={inputType === 'number' ? 'decimal' : 'text'}
          placeholder={field.placeholder ?? `Enter ${field.label}`}
          className="text-sm bg-background"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              const val = (e.target as HTMLInputElement).value.trim();
              if (val) onSubmit(val);
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
            const input = e.currentTarget.parentElement?.previousElementSibling?.querySelector(
              'input'
            ) as HTMLInputElement;
            const val = input?.value.trim();
            if (val) onSubmit(val);
          }}
        >
          Submit value
        </Button>
        <Button size="sm" variant="secondary" className="h-7 text-xs" onClick={onNotAvailable}>
          <Ban className="h-3 w-3 mr-1" /> Not available
        </Button>
      </div>
    </div>
  );
}

export function StructuredClinicalEvidencePanel({
  title,
  description,
  fields,
  record,
  onChange,
}: StructuredClinicalEvidencePanelProps) {
  const progress = clinicalEvidenceProgress(fields, record);
  const [activeFieldId, setActiveFieldId] = useState<string | null>(
    fields.find((field) => !isClinicalEvidenceFieldResolved(record[field.id]))?.id ?? fields[0]?.id ?? null,
  );
  const [reviewingResolved, setReviewingResolved] = useState(false);

  const unresolvedFields = fields.filter((field) => !isClinicalEvidenceFieldResolved(record[field.id]));
  const resolvedFields = fields.filter((field) => isClinicalEvidenceFieldResolved(record[field.id]));
  const nextUnresolvedFieldId = unresolvedFields[0]?.id;
  const activeField = fields.find((field) => field.id === activeFieldId) ?? unresolvedFields[0];

  useEffect(() => {
    if (!activeFieldId || !fields.some((field) => field.id === activeFieldId)) {
      setActiveFieldId(nextUnresolvedFieldId ?? fields[0]?.id ?? null);
      setReviewingResolved(false);
      return;
    }
    if (!reviewingResolved && isClinicalEvidenceFieldResolved(record[activeFieldId])) {
      setActiveFieldId(nextUnresolvedFieldId ?? activeFieldId);
    }
  }, [activeFieldId, fields, nextUnresolvedFieldId, record, reviewingResolved]);

  function commitEntry(fieldId: string, entry: ClinicalEvidenceEntry) {
    setReviewingResolved(false);
    onChange(setClinicalEvidenceEntry(record, fieldId, entry));
  }

  function clearEntry(fieldId: string) {
    const next = { ...record };
    delete next[fieldId];
    setActiveFieldId(fieldId);
    setReviewingResolved(false);
    onChange(next);
  }

  if (fields.length === 0 || !activeField) return null;

  const activeIndex = fields.findIndex((field) => field.id === activeField.id);
  const activeEntry = record[activeField.id];
  const activeResolved = isClinicalEvidenceFieldResolved(activeEntry);
  const isPresence = activeField.type === 'presence';

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

      {unresolvedFields.length === 0 && !(reviewingResolved && activeResolved) ? (
        <div className="rounded-lg border border-green-500/30 bg-green-500/5 p-3 text-sm text-foreground">
          <p className="font-medium text-green-700 dark:text-green-300">All fields documented</p>
          <p className="text-xs text-muted-foreground mt-1">Review any entry below if it needs correction.</p>
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-accent/10 p-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <Badge variant="outline" className="text-[9px] mb-1">
                Field {activeIndex + 1} of {fields.length}
              </Badge>
              <p className="text-sm font-medium text-foreground">{activeField.label}</p>
              {activeField.phase && <p className="text-[10px] text-muted-foreground mt-1">{activeField.phase}</p>}
              {activeResolved && activeEntry && (
                <p className="text-[11px] text-muted-foreground mt-1">Recorded: {formatResolvedValue(activeField, activeEntry)}</p>
              )}
            </div>
            {activeResolved && <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />}
          </div>

          {!activeResolved ? (
            <div className="mt-3 space-y-2">
              {isPresence ? (
                <div className="flex flex-wrap gap-1">
                  <Button size="sm" className="h-9 text-xs" onClick={() => commitEntry(activeField.id, { status: 'present' })}>
                    Present
                  </Button>
                  <Button size="sm" variant="outline" className="h-9 text-xs" onClick={() => commitEntry(activeField.id, { status: 'absent' })}>
                    Absent
                  </Button>
                  <Button size="sm" variant="secondary" className="h-9 text-xs" onClick={() => commitEntry(activeField.id, { status: 'not_available' })}>
                    <Ban className="h-3 w-3 mr-1" /> Not assessed
                  </Button>
                </div>
              ) : activeField.type === 'ketones' ? (
                <KetonesFieldInput
                  key={activeField.id}
                  field={activeField}
                  onSubmit={(value) => commitEntry(activeField.id, { status: 'value', value })}
                  onNotAvailable={() => commitEntry(activeField.id, { status: 'not_available' })}
                />
              ) : activeField.type === 'numeric_with_units' ? (
                <NumericWithUnitsFieldInput
                  key={activeField.id}
                  field={activeField}
                  onSubmit={(value) => commitEntry(activeField.id, { status: 'value', value })}
                  onNotAvailable={() => commitEntry(activeField.id, { status: 'not_available' })}
                />
              ) : (
                <StandardValueFieldInput
                  key={activeField.id}
                  field={activeField}
                  onSubmit={(value) => commitEntry(activeField.id, { status: 'value', value })}
                  onNotAvailable={() => commitEntry(activeField.id, { status: 'not_available' })}
                />
              )}
            </div>
          ) : (
            <div className="mt-3 flex flex-wrap gap-2">
              <Button type="button" size="sm" variant="outline" className="h-8 text-xs" onClick={() => clearEntry(activeField.id)}>
                Change this entry
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-8 text-xs"
                onClick={() => {
                  setReviewingResolved(false);
                  setActiveFieldId(nextUnresolvedFieldId ?? activeField.id);
                }}
              >
                Return to remaining fields
              </Button>
            </div>
          )}
        </div>
      )}

      {resolvedFields.length > 0 && (
        <div className="rounded-lg border border-green-500/20 bg-green-500/5 p-2">
          <div className="flex items-center justify-between gap-2 mb-1">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Documented</p>
            <span className="text-[10px] text-muted-foreground">Tap to review</span>
          </div>
          <div className="max-h-32 overflow-y-auto space-y-1">
            {resolvedFields.map((field) => {
              const entry = record[field.id];
              return (
                <button
                  key={field.id}
                  type="button"
                  className="w-full rounded-md px-2 py-1.5 text-left text-xs hover:bg-background/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  onClick={() => {
                    setActiveFieldId(field.id);
                    setReviewingResolved(true);
                  }}
                >
                  <span className="font-medium text-foreground">{field.label}</span>
                  <span className="text-muted-foreground"> — {entry ? formatResolvedValue(field, entry) : 'Recorded'}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {activeIndex > 0 && (
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="h-8 text-xs"
          onClick={() => {
            setActiveFieldId(fields[activeIndex - 1]?.id ?? null);
            setReviewingResolved(true);
          }}
        >
          Review previous field
        </Button>
      )}
    </div>
  );
}
