import { describe, it, expect, beforeEach } from 'vitest';
import {
  VoiceRecognitionService,
  ClinicalVoiceCommandParser,
  VoiceFeedbackService,
} from './voice-recognition-service';
import { VOICE_COMMAND_SCHEMA, getCommandsByEmergencyType, getCommandsByPriority } from './voice-command-schema';

describe('Voice Recognition Service - Comprehensive', () => {
  let service: VoiceRecognitionService;

  beforeEach(() => {
    service = new VoiceRecognitionService({
      language: 'en-US',
      continuous: true,
      interimResults: true,
    });
  });

  it('should initialize with correct configuration', () => {
    expect(service.isSupported()).toBe(true);
    expect(service.getIsListening()).toBe(false);
  });

  it('should support language switching', () => {
    service.setLanguage('es-ES');
    expect(service.isSupported()).toBe(true);
  });

  it('should manage confidence threshold', () => {
    service.setConfidenceThreshold(0.8);
    expect(service.isSupported()).toBe(true);

    // Test boundary values
    service.setConfidenceThreshold(0);
    service.setConfidenceThreshold(1);
    service.setConfidenceThreshold(1.5); // Should clamp to 1
  });

  it('should maintain command buffer', () => {
    const buffer = service.getCommandBuffer();
    expect(Array.isArray(buffer)).toBe(true);

    service.clearCommandBuffer();
    expect(service.getCommandBuffer().length).toBe(0);
  });
});

describe('Clinical Voice Command Parser - Comprehensive', () => {
  let parser: ClinicalVoiceCommandParser;

  beforeEach(() => {
    parser = new ClinicalVoiceCommandParser();
  });

  it('should parse exact command matches', () => {
    const command = parser.parseCommand('epi given');
    expect(command).not.toBeNull();
    expect(command?.confidence).toBe(1.0);
  });

  it('should parse fuzzy command matches', () => {
    const command = parser.parseCommand('give epi');
    expect(command).not.toBeNull();
    expect(command?.confidence).toBeGreaterThan(0.7);
  });

  it('should handle case-insensitive matching', () => {
    const cmd1 = parser.parseCommand('EPI GIVEN');
    const cmd2 = parser.parseCommand('epi given');
    expect(cmd1?.action).toBe(cmd2?.action);
  });

  it('should reject low-confidence matches', () => {
    const command = parser.parseCommand('xyz abc def');
    expect(command).toBeNull();
  });

  it('should return all available commands', () => {
    const commands = parser.getAvailableCommands();
    expect(Array.isArray(commands)).toBe(true);
    expect(commands.length).toBeGreaterThan(0);
  });

  it('should support custom command addition', () => {
    const initialCount = parser.getAvailableCommands().length;
    parser.addCustomCommand('test command', 'intervention', 'test_action', 'test');
    const newCount = parser.getAvailableCommands().length;
    expect(newCount).toBeGreaterThan(initialCount);
  });

  it('should calculate similarity correctly', () => {
    // Test exact match
    const exact = parser.parseCommand('epi given');
    expect(exact?.confidence).toBe(1.0);

    // Test high similarity
    const similar = parser.parseCommand('epi give');
    expect(similar?.confidence).toBeGreaterThan(0.7);
  });
});

describe('Voice Command Schema - Comprehensive', () => {
  it('should have all required emergency types', () => {
    const emergencyTypes = [
      'cpr',
      'cardiac_arrest',
      'status_asthmaticus',
      'bronchiolitis',
      'pneumonia',
      'ards',
      'upper_airway',
      'anaphylaxis',
      'septic_shock',
      'dka',
      'status_epilepticus',
      'trauma',
    ];

    emergencyTypes.forEach(type => {
      const commands = getCommandsByEmergencyType(type);
      expect(commands.length).toBeGreaterThan(0);
    });
  });

  it('should have critical priority commands', () => {
    const criticalCommands = getCommandsByPriority('critical');
    expect(criticalCommands.length).toBeGreaterThan(0);
    criticalCommands.forEach(cmd => {
      expect(cmd.priority).toBe('critical');
    });
  });

  it('should have high priority commands', () => {
    const highCommands = getCommandsByPriority('high');
    expect(highCommands.length).toBeGreaterThan(0);
  });

  it('should have normal and low priority commands', () => {
    const normalCommands = getCommandsByPriority('normal');
    const lowCommands = getCommandsByPriority('low');
    expect(normalCommands.length + lowCommands.length).toBeGreaterThan(0);
  });

  it('should have multi-phrase support for commands', () => {
    Object.values(VOICE_COMMAND_SCHEMA).forEach(cmd => {
      expect(cmd.phrases.length).toBeGreaterThan(0);
      expect(cmd.phrases.every(p => typeof p === 'string')).toBe(true);
    });
  });

  it('should have descriptions for all commands', () => {
    Object.values(VOICE_COMMAND_SCHEMA).forEach(cmd => {
      expect(cmd.description.length).toBeGreaterThan(0);
    });
  });

  it('should have valid action names', () => {
    Object.values(VOICE_COMMAND_SCHEMA).forEach(cmd => {
      expect(cmd.action.length).toBeGreaterThan(0);
      expect(['intervention', 'assessment', 'navigation', 'system']).toContain(cmd.category);
    });
  });
});

describe('Voice Command Schema - CPR Commands', () => {
  it('should have all critical CPR interventions', () => {
    const cprCommands = getCommandsByEmergencyType('cpr');
    const interventions = cprCommands.filter(c => c.category === 'intervention');

    const requiredActions = [
      'recordMedication', // epi, amiodarone
      'recordShock',
      'startCompressions',
      'stopCompressions',
    ];

    requiredActions.forEach(action => {
      expect(interventions.some(c => c.action === action)).toBe(true);
    });
  });

  it('should have all CPR assessment commands', () => {
    const cprCommands = getCommandsByEmergencyType('cpr');
    const assessments = cprCommands.filter(c => c.category === 'assessment');

    const requiredActions = [
      'recordRhythmCheck',
      'recordRhythm',
      'checkPulse',
      'checkBreathing',
    ];

    requiredActions.forEach(action => {
      expect(assessments.some(c => c.action === action)).toBe(true);
    });
  });
});

describe('Voice Command Schema - Respiratory Commands', () => {
  it('should have respiratory emergency commands', () => {
    const emergencyTypes = ['status_asthmaticus', 'bronchiolitis', 'pneumonia', 'ards', 'upper_airway'];

    emergencyTypes.forEach(type => {
      const commands = getCommandsByEmergencyType(type);
      expect(commands.length).toBeGreaterThan(0);

      // Should have oxygen-related commands
      const hasOxygen = commands.some(c =>
        c.action === 'recordOxygenTherapy'
      );
      expect(hasOxygen).toBe(true);
    });
  });
});

describe('Voice Command Schema - Anaphylaxis Commands', () => {
  it('should have anaphylaxis-specific commands', () => {
    const commands = getCommandsByEmergencyType('anaphylaxis');
    expect(commands.length).toBeGreaterThan(0);

    // Should have IM epi command
    const hasEpiIM = commands.some(c =>
      c.action === 'recordMedication' && c.phrases.some(p => p.includes('epi im'))
    );
    expect(hasEpiIM).toBe(true);
  });
});

describe('Voice Command Schema - Septic Shock Commands', () => {
  it('should have septic shock-specific commands', () => {
    const commands = getCommandsByEmergencyType('septic_shock');
    expect(commands.length).toBeGreaterThan(0);

    // Should have fluid resuscitation command
    const hasFluids = commands.some(c =>
      c.action === 'recordFluidResuscitation'
    );
    expect(hasFluids).toBe(true);

    // Should have antibiotic command
    const hasAntibiotics = commands.some(c =>
      c.action === 'recordMedication' && c.phrases.some(p => p.includes('antibiotic'))
    );
    expect(hasAntibiotics).toBe(true);
  });
});

describe('Voice Command Schema - DKA Commands', () => {
  it('should have DKA-specific commands', () => {
    const commands = getCommandsByEmergencyType('dka');
    expect(commands.length).toBeGreaterThan(0);

    // Should have insulin command
    const hasInsulin = commands.some(c =>
      c.action === 'recordMedication' && c.phrases.some(p => p.includes('insulin'))
    );
    expect(hasInsulin).toBe(true);

    // Should have potassium command
    const hasK = commands.some(c =>
      c.action === 'recordMedication' && c.phrases.some(p => p.includes('potassium'))
    );
    expect(hasK).toBe(true);
  });
});

describe('Voice Command Schema - Status Epilepticus Commands', () => {
  it('should have status epilepticus-specific commands', () => {
    const commands = getCommandsByEmergencyType('status_epilepticus');
    expect(commands.length).toBeGreaterThan(0);

    // Should have benzodiazepine command
    const hasBenzo = commands.some(c =>
      c.action === 'recordMedication' && c.phrases.some(p => p.includes('benzodiazepine') || p.includes('lorazepam'))
    );
    expect(hasBenzo).toBe(true);
  });
});

describe('Voice Feedback Service', () => {
  let service: VoiceFeedbackService;

  beforeEach(() => {
    service = new VoiceFeedbackService();
  });

  it('should check audio support', () => {
    expect(typeof service.isAudioSupported()).toBe('boolean');
  });

  it('should toggle feedback enabled state', () => {
    service.setEnabled(false);
    service.setEnabled(true);
    // Should not throw
  });

  it('should play feedback tones without errors', () => {
    expect(() => {
      service.playCommandRecognized();
      service.playCommandError();
      service.playListeningStarted();
    }).not.toThrow();
  });
});

describe('Voice Command Coverage Analysis', () => {
  it('should have comprehensive command coverage', () => {
    const schema = VOICE_COMMAND_SCHEMA;
    const totalCommands = Object.keys(schema).length;
    expect(totalCommands).toBeGreaterThanOrEqual(40);
  });

  it('should have balanced priority distribution', () => {
    const critical = getCommandsByPriority('critical');
    const high = getCommandsByPriority('high');
    const normal = getCommandsByPriority('normal');
    const low = getCommandsByPriority('low');

    expect(critical.length).toBeGreaterThan(0);
    expect(high.length).toBeGreaterThan(0);
    expect(normal.length + low.length).toBeGreaterThan(0);
  });

  it('should have no duplicate command actions', () => {
    const actions = new Set<string>();
    const duplicates: string[] = [];

    Object.values(VOICE_COMMAND_SCHEMA).forEach(cmd => {
      if (actions.has(cmd.action)) {
        duplicates.push(cmd.action);
      }
      actions.add(cmd.action);
    });

    expect(duplicates.length).toBe(0);
  });

  it('should have consistent phrase formatting', () => {
    Object.values(VOICE_COMMAND_SCHEMA).forEach(cmd => {
      cmd.phrases.forEach(phrase => {
        expect(phrase.length).toBeGreaterThan(0);
        expect(phrase).toBe(phrase.toLowerCase());
      });
    });
  });
});
