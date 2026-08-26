import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { CprArrestCommandConsole } from './CprArrestCommandConsole';
import type { CompressionCycleStatus } from '@/lib/resus/cpr-engine';
import type { LifeSupportPackResult } from '@/lib/resus/cpr-pack-resolver';

const pack: LifeSupportPackResult = {
  pack: 'PALS',
  label: 'Paediatric Advanced Life Support (PALS)',
  rationale: 'Test fixture',
};

const cycle: CompressionCycleStatus = {
  compressionElapsed: 40,
  countdownToRhythmCheck: 80,
  phase: 'compressions',
  nextAction: 'Continue high-quality compressions',
};

function renderConsole(overrides: Partial<React.ComponentProps<typeof CprArrestCommandConsole>> = {}) {
  return renderToStaticMarkup(
    <CprArrestCommandConsole
      phase="compressions"
      effectiveIsRunning
      effectiveRoscAchieved={false}
      effectiveArrestDuration={40}
      patientWeight={18}
      lifeSupportPack={pack}
      compressionCycle={cycle}
      reassessmentTime={10}
      rhythmWindowElapsed={null}
      activeAlerts={[]}
      effectiveCycleNumber={1}
      effectiveShockCount={0}
      effectiveEpiDoses={0}
      effectiveRhythmType={null}
      epiState="not_due"
      epiDose={0.18}
      shockEnergyLabel="36 J (PALS weight-based)"
      formatTime={(seconds) => `00:${seconds.toString().padStart(2, '0')}`}
      onStartArrest={vi.fn()}
      onPadsAttached={vi.fn()}
      onDeliverShock={vi.fn()}
      onDisarmDefib={vi.fn()}
      onGiveEpinephrine={vi.fn()}
      onShowRoscConfirm={vi.fn()}
      documentationLog={<div data-testid="documentation-log">Log</div>}
      {...overrides}
    />,
  );
}

describe('CprArrestCommandConsole', () => {
  it('keeps compressions and the next rhythm check as the first-viewport priority', () => {
    const html = renderConsole();

    expect(html).toContain('CONTINUE COMPRESSIONS');
    expect(html).toContain('Rhythm check in');
    expect(html).toContain('Keep hands on the chest.');
    expect(html).toContain('Confirm sustained pulse / ROSC');
    expect(html).toContain('data-testid="documentation-log"');
  });

  it('shows only the shock decision controls when a shockable rhythm is ready', () => {
    const html = renderConsole({
      phase: 'shock_ready',
      effectiveRhythmType: 'vf_pvt',
      shockEnergyLabel: 'Adult biphasic 120–200 J (follow device manufacturer setting)',
    });

    expect(html).toContain('CLEAR &amp; SHOCK');
    expect(html).toContain('Disarm');
    expect(html).not.toContain('CONTINUE COMPRESSIONS');
  });

  it('makes ROSC a deliberate recovery state rather than another crowded arrest action', () => {
    const html = renderConsole({
      effectiveIsRunning: false,
      effectiveRoscAchieved: true,
      effectiveArrestDuration: 125,
    });

    expect(html).toContain('ROSC ACHIEVED');
    expect(html).toContain('post-cardiac-arrest care');
  });

  it('keeps critical alerts visible while preserving the single action hierarchy', () => {
    const html = renderConsole({
      activeAlerts: [
        { type: 'reassessment_due', severity: 'critical', message: 'Reassess now' },
        { type: 'advanced_airway', severity: 'info', message: 'Consider airway' },
      ],
    });

    expect(html).toContain('Reassess now');
    expect(html).not.toContain('Consider airway');
  });
});
