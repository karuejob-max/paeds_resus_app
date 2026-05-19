import { describe, it, expect, beforeEach } from 'vitest';
import {
  VoiceCPRIntegration,
  VoiceRespiratoryIntegration,
  VoiceAnaphylaxisIntegration,
} from './voice-cpr-integration';
import type { VoiceCommand } from './voice-recognition-service';

describe('Voice CPR Integration', () => {
  let integration: VoiceCPRIntegration;

  beforeEach(() => {
    integration = new VoiceCPRIntegration();
  });

  it('should track compression start and stop', () => {
    const startCmd: VoiceCommand = {
      command: 'compressions started',
      category: 'intervention',
      action: 'startCompressions',
      confidence: 0.95,
      timestamp: Date.now(),
    };

    const action = integration.processVoiceCommand(startCmd);
    expect(action?.action).toBe('start_compressions');
    expect(integration.getState().isCompressionActive).toBe(true);

    const stopCmd: VoiceCommand = {
      command: 'stop compressions',
      category: 'intervention',
      action: 'stopCompressions',
      confidence: 0.95,
      timestamp: Date.now() + 60000,
    };

    integration.processVoiceCommand(stopCmd);
    expect(integration.getState().isCompressionActive).toBe(false);
  });

  it('should track medication administration', () => {
    const epiCmd: VoiceCommand = {
      command: 'epi given',
      category: 'intervention',
      action: 'recordMedication',
      confidence: 0.95,
      timestamp: Date.now(),
    };

    const action = integration.processVoiceCommand(epiCmd);
    expect(action?.action).toBe('give_epinephrine');
    expect(integration.getMedicationSequence()).toContain('epinephrine');
  });

  it('should track shock delivery', () => {
    const shockCmd: VoiceCommand = {
      command: 'shock delivered',
      category: 'intervention',
      action: 'recordShock',
      confidence: 0.95,
      timestamp: Date.now(),
    };

    integration.processVoiceCommand(shockCmd);
    expect(integration.getShockSequence().length).toBe(1);
  });

  it('should identify cardiac rhythms', () => {
    const vfibCmd: VoiceCommand = {
      command: 'vfib',
      category: 'assessment',
      action: 'recordRhythm',
      confidence: 0.95,
      timestamp: Date.now(),
    };

    const action = integration.processVoiceCommand(vfibCmd);
    expect(action?.action).toBe('identify_vfib');
  });

  it('should determine medication due timing', () => {
    const epiCmd: VoiceCommand = {
      command: 'epi given',
      category: 'intervention',
      action: 'recordMedication',
      confidence: 0.95,
      timestamp: Date.now(),
    };

    integration.processVoiceCommand(epiCmd);
    expect(integration.isMedicationDue()).toBe(false);

    // Simulate 4 minutes passing
    integration.state.lastMedicationTime = Date.now() - 240000;
    expect(integration.isMedicationDue()).toBe(true);
  });

  it('should generate CPR summary', () => {
    const startCmd: VoiceCommand = {
      command: 'compressions started',
      category: 'intervention',
      action: 'startCompressions',
      confidence: 0.95,
      timestamp: Date.now(),
    };

    const epiCmd: VoiceCommand = {
      command: 'epi given',
      category: 'intervention',
      action: 'recordMedication',
      confidence: 0.95,
      timestamp: Date.now() + 30000,
    };

    const shockCmd: VoiceCommand = {
      command: 'shock delivered',
      category: 'intervention',
      action: 'recordShock',
      confidence: 0.95,
      timestamp: Date.now() + 60000,
    };

    integration.processVoiceCommand(startCmd);
    integration.processVoiceCommand(epiCmd);
    integration.processVoiceCommand(shockCmd);

    const summary = integration.generateCPRSummary();
    expect(summary.medicationsGiven).toContain('epinephrine');
    expect(summary.shocksDelivered).toBe(1);
    expect(summary.totalActions).toBe(3);
  });

  it('should reset state', () => {
    const epiCmd: VoiceCommand = {
      command: 'epi given',
      category: 'intervention',
      action: 'recordMedication',
      confidence: 0.95,
      timestamp: Date.now(),
    };

    integration.processVoiceCommand(epiCmd);
    expect(integration.getMedicationSequence().length).toBe(1);

    integration.resetState();
    expect(integration.getMedicationSequence().length).toBe(0);
    expect(integration.getActions().length).toBe(0);
  });
});

describe('Voice Respiratory Integration', () => {
  let integration: VoiceRespiratoryIntegration;

  beforeEach(() => {
    integration = new VoiceRespiratoryIntegration();
  });

  it('should track oxygen therapy', () => {
    const oxyCmd: VoiceCommand = {
      command: 'oxygen on',
      category: 'intervention',
      action: 'recordOxygenTherapy',
      confidence: 0.95,
      timestamp: Date.now(),
    };

    integration.processVoiceCommand(oxyCmd);
    const interventions = integration.getInterventions();
    expect(interventions).toContainEqual(
      expect.objectContaining({ type: 'oxygen_therapy' })
    );
  });

  it('should track intubation', () => {
    const intCmd: VoiceCommand = {
      command: 'intubated',
      category: 'intervention',
      action: 'recordIntubation',
      confidence: 0.95,
      timestamp: Date.now(),
    };

    integration.processVoiceCommand(intCmd);
    const interventions = integration.getInterventions();
    expect(interventions).toContainEqual(
      expect.objectContaining({ type: 'intubation' })
    );
  });

  it('should track bag-mask ventilation', () => {
    const bmvCmd: VoiceCommand = {
      command: 'bag mask',
      category: 'intervention',
      action: 'recordBagMask',
      confidence: 0.95,
      timestamp: Date.now(),
    };

    integration.processVoiceCommand(bmvCmd);
    const interventions = integration.getInterventions();
    expect(interventions).toContainEqual(
      expect.objectContaining({ type: 'bag_mask_ventilation' })
    );
  });

  it('should track steroid administration', () => {
    const sterCmd: VoiceCommand = {
      command: 'steroids given',
      category: 'intervention',
      action: 'recordMedication',
      confidence: 0.95,
      timestamp: Date.now(),
    };

    integration.processVoiceCommand(sterCmd);
    const interventions = integration.getInterventions();
    expect(interventions).toContainEqual(
      expect.objectContaining({ type: 'medication_steroids' })
    );
  });
});

describe('Voice Anaphylaxis Integration', () => {
  let integration: VoiceAnaphylaxisIntegration;

  beforeEach(() => {
    integration = new VoiceAnaphylaxisIntegration();
  });

  it('should track IM epinephrine administration', () => {
    const epiCmd: VoiceCommand = {
      command: 'epi im',
      category: 'intervention',
      action: 'recordMedication',
      confidence: 0.95,
      timestamp: Date.now(),
    };

    integration.processVoiceCommand(epiCmd);
    const interventions = integration.getInterventions();
    expect(interventions).toContainEqual(
      expect.objectContaining({ type: 'epinephrine_im' })
    );
  });

  it('should track antihistamine administration', () => {
    const antiCmd: VoiceCommand = {
      command: 'antihistamine',
      category: 'intervention',
      action: 'recordMedication',
      confidence: 0.95,
      timestamp: Date.now(),
    };

    integration.processVoiceCommand(antiCmd);
    const interventions = integration.getInterventions();
    expect(interventions).toContainEqual(
      expect.objectContaining({ type: 'antihistamine' })
    );
  });

  it('should track IV access', () => {
    const ivCmd: VoiceCommand = {
      command: 'iv access',
      category: 'intervention',
      action: 'recordIVAccess',
      confidence: 0.95,
      timestamp: Date.now(),
    };

    integration.processVoiceCommand(ivCmd);
    const interventions = integration.getInterventions();
    expect(interventions).toContainEqual(
      expect.objectContaining({ type: 'iv_access' })
    );
  });

  it('should determine epinephrine repeat due timing', () => {
    const epiCmd: VoiceCommand = {
      command: 'epi im',
      category: 'intervention',
      action: 'recordMedication',
      confidence: 0.95,
      timestamp: Date.now(),
    };

    integration.processVoiceCommand(epiCmd);
    expect(integration.isEpinephrineRepeatDue()).toBe(false);

    // Simulate 20 minutes passing
    integration.epinephrineGivenTime = Date.now() - 1200000;
    expect(integration.isEpinephrineRepeatDue()).toBe(true);
  });

  it('should reset state', () => {
    const epiCmd: VoiceCommand = {
      command: 'epi im',
      category: 'intervention',
      action: 'recordMedication',
      confidence: 0.95,
      timestamp: Date.now(),
    };

    integration.processVoiceCommand(epiCmd);
    expect(integration.getInterventions().length).toBe(1);

    integration.resetState();
    expect(integration.getInterventions().length).toBe(0);
  });
});
