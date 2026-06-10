/**
 * Zero-ambiguity clinical evidence capture — one field at a time, value or Not available.
 */

import { useState } from 'react';
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
                {resolved && entry && (
                  <p className="text-[11px] text-muted-foreground mt-1">
                    {formatResolvedValue(field, entry)}
                  </p>
                )}
              </div>
              {resolved && <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />}
            </div>

            {!resolved && (
              <div className="mt-2 space-y-2">
                {isPresence ? (
                  <div className="flex flex-wrap gap-1">
                    <Button
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => setEntry(field.id, { status: 'present' })}
                    >
                      Present
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                      onClick={() => setEntry(field.id, { status: 'absent' })}
                    >
                      Absent
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="h-7 text-xs"
                      onClick={() => setEntry(field.id, { status: 'not_available' })}
                    >
                      <Ban className="h-3 w-3 mr-1" /> Not assessed
                    </Button>
                  </div>
                ) : field.type === 'ketones' ? (
                  <KetonesFieldInput
                    field={field}
                    onSubmit={(value) => setEntry(field.id, { status: 'value', value })}
                    onNotAvailable={() => setEntry(field.id, { status: 'not_available' })}
                  />
                ) : field.type === 'numeric_with_units' ? (
                  <NumericWithUnitsFieldInput
                    field={field}
                    onSubmit={(value) => setEntry(field.id, { status: 'value', value })}
                    onNotAvailable={() => setEntry(field.id, { status: 'not_available' })}
                  />
                ) : (
                  <StandardValueFieldInput
                    field={field}
                    onSubmit={(value) => setEntry(field.id, { status: 'value', value })}
                    onNotAvailable={() => setEntry(field.id, { status: 'not_available' })}
                  />
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
