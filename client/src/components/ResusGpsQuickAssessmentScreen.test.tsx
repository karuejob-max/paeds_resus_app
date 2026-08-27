import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ResusGpsQuickAssessmentScreen } from './ResusGpsQuickAssessmentScreen';

describe('ResusGpsQuickAssessmentScreen', () => {
  afterEach(() => cleanup());
  it('auto-opens CPR-GPS after the three arrest checks are documented', async () => {
    const onAnswer = vi.fn();
    render(<ResusGpsQuickAssessmentScreen patientAge="5 years" onAnswer={onAnswer} />);

    fireEvent.click(screen.getByRole('button', { name: 'Unresponsive' }));
    fireEvent.click(screen.getAllByRole('button', { name: 'Absent' })[0]);
    fireEvent.click(screen.getAllByRole('button', { name: 'Absent' })[1]);

    await waitFor(() => expect(onAnswer).toHaveBeenCalledWith('cardiac_arrest'));
    expect(screen.getByRole('alert').textContent).toContain('CPR-GPS is opening automatically');
  });

  it('keeps the non-arrest branch explicit for a responsive patient with a pulse', () => {
    const onAnswer = vi.fn();
    render(<ResusGpsQuickAssessmentScreen patientAge="5 years" onAnswer={onAnswer} />);

    fireEvent.click(screen.getByRole('button', { name: 'Responsive' }));
    fireEvent.click(screen.getByRole('button', { name: 'Normal' }));
    fireEvent.click(screen.getByRole('button', { name: 'Present' }));

    expect(screen.getByRole('status').textContent).toContain('No cardiac arrest branch selected');
    fireEvent.click(screen.getByRole('button', { name: /Continue to XABCDE/ }));
    expect(onAnswer).toHaveBeenCalledWith('no_cardiac_arrest');
  });
});
