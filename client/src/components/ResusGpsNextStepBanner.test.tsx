import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ResusGpsNextStepBanner } from './ResusGpsNextStepBanner';

describe('ResusGpsNextStepBanner', () => {
  it('stacks below survey status and exposes the explicit re-check action', () => {
    const onReassess = vi.fn();

    render(
      <ResusGpsNextStepBanner
        stackedUnderSurvey
        banner={{
          kind: 'reassessment',
          message: 'Re-check perfusion',
          detail: 'After fluid bolus',
          interventionId: 'intervention-1',
        }}
        onReassess={onReassess}
      />
    );

    expect(screen.getByRole('status').className).toContain(
      'top-[calc(var(--resus-topbar-offset,3rem)+5.5rem)]'
    );
    fireEvent.click(screen.getByRole('button', { name: 'Re-check' }));
    expect(onReassess).toHaveBeenCalledWith('intervention-1');
    expect(screen.queryByRole('button', { name: 'Later' })).toBeNull();
  });
});
