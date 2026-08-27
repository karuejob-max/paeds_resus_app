import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { useState } from 'react';
import { StructuredClinicalEvidencePanel } from './StructuredClinicalEvidencePanel';
import type { ClinicalEvidenceFieldDef, ClinicalEvidenceRecord } from '@shared/clinical-evidence';

const fields: ClinicalEvidenceFieldDef[] = [
  { id: 'history', label: 'Relevant history', type: 'text', phase: 'SAMPLE' },
  { id: 'symptoms', label: 'Current symptoms', type: 'text', phase: 'Symptoms' },
];

function Harness() {
  const [record, setRecord] = useState<ClinicalEvidenceRecord>({});
  return (
    <StructuredClinicalEvidencePanel
      title="SAMPLE"
      description="Document each field."
      fields={fields}
      record={record}
      onChange={setRecord}
    />
  );
}

describe('StructuredClinicalEvidencePanel', () => {
  afterEach(() => cleanup());

  it('shows one unresolved field at a time and preserves reviewable resolved entries', () => {
    render(<Harness />);

    expect(screen.getByText('Relevant history')).toBeTruthy();
    expect(screen.queryByText('Current symptoms')).toBeNull();

    fireEvent.change(screen.getByPlaceholderText('Enter Relevant history'), { target: { value: 'No known illness' } });
    fireEvent.click(screen.getByRole('button', { name: 'Submit value' }));

    expect(screen.getByText('Current symptoms')).toBeTruthy();
    expect(screen.getByRole('button', { name: /Relevant history/ })).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: /Not available/ }));
    expect(screen.getByText('All fields documented')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: /Relevant history/ }));
    expect(screen.getByText('Recorded: No known illness')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Change this entry' })).toBeTruthy();
  });
});
