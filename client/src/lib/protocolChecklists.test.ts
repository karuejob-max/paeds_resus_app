/**
 * Protocol Checklist Tests
 * 
 * Verifies checklist templates load correctly and interventions
 * with checklists function properly.
 */

import { describe, it, expect } from 'vitest';
import {
  getChecklistTemplate,
  initializeChecklist,
  shockResuscitationChecklist,
  sepsisBundleChecklist,
  dkaManagementChecklist,
  intubationChecklist,
  anaphylaxisChecklist,
  statusEpilepticusChecklist
} from './protocolChecklists';

describe('Protocol Checklist Templates', () => {
  it('should load shock resuscitation checklist template', () => {
    const template = getChecklistTemplate('shock_resuscitation');
    expect(template).toBeDefined();
    expect(template?.title).toBe('Shock Resuscitation Protocol');
    expect(template?.steps.length).toBe(8);
    expect(template?.steps[0].label).toContain('IV/IO access');
    expect(template?.steps[0].critical).toBe(true);
  });

  it('should load sepsis bundle checklist template', () => {
    const template = getChecklistTemplate('sepsis_bundle');
    expect(template).toBeDefined();
    expect(template?.title).toBe('Sepsis Bundle (Hour-1)');
    expect(template?.steps.length).toBe(8);
    expect(template?.steps[0].label).toContain('blood cultures');
    expect(template?.steps[0].critical).toBe(true);
  });

  it('should load DKA management checklist template', () => {
    const template = getChecklistTemplate('dka_management');
    expect(template).toBeDefined();
    expect(template?.title).toBe('DKA Management Protocol');
    expect(template?.steps.length).toBe(9);
    expect(template?.steps[3].label).toContain('insulin infusion');
    expect(template?.steps[3].critical).toBe(true);
  });

  it('should load intubation checklist template', () => {
    const template = getChecklistTemplate('intubation');
    expect(template).toBeDefined();
    expect(template?.title).toBe('Rapid Sequence Intubation');
    expect(template?.steps.length).toBe(10);
    expect(template?.steps[0].label).toContain('Pre-oxygenate');
    expect(template?.steps[0].critical).toBe(true);
  });

  it('should load anaphylaxis checklist template', () => {
    const template = getChecklistTemplate('anaphylaxis');
    expect(template).toBeDefined();
    expect(template?.title).toBe('Anaphylaxis Protocol');
    expect(template?.steps.length).toBe(12);
    expect(template?.steps[0].label).toContain('IM epinephrine');
    expect(template?.steps[0].critical).toBe(true);
  });

  it('should load status epilepticus checklist template', () => {
    const template = getChecklistTemplate('status_epilepticus');
    expect(template).toBeDefined();
    expect(template?.title).toBe('Status Epilepticus Protocol');
    expect(template?.steps.length).toBe(8);
    expect(template?.steps[2].label).toContain('benzodiazepine');
    expect(template?.steps[2].critical).toBe(true);
  });

  it('should return undefined for invalid template ID', () => {
    const template = getChecklistTemplate('invalid_template');
    expect(template).toBeUndefined();
  });

  it('should initialize checklist with all steps marked as not completed', () => {
    const template = shockResuscitationChecklist;
    const initialized = initializeChecklist(template);
    
    expect(initialized.title).toBe(template.title);
    expect(initialized.steps.length).toBe(template.steps.length);
    expect(initialized.steps.every(step => step.completed === false)).toBe(true);
  });

  it('should preserve critical flags when initializing', () => {
    const template = shockResuscitationChecklist;
    const initialized = initializeChecklist(template);
    
    const criticalSteps = initialized.steps.filter(s => s.critical);
    expect(criticalSteps.length).toBeGreaterThan(0);
    expect(criticalSteps[0].label).toContain('IV/IO access');
  });

  it('should preserve notes when initializing', () => {
    const template = shockResuscitationChecklist;
    const initialized = initializeChecklist(template);
    
    const stepsWithNotes = initialized.steps.filter(s => s.note);
    expect(stepsWithNotes.length).toBeGreaterThan(0);
    expect(stepsWithNotes[0].note).toBeDefined();
  });

  it('should have unique IDs for all steps in each template', () => {
    const templates = [
      shockResuscitationChecklist,
      sepsisBundleChecklist,
      dkaManagementChecklist,
      intubationChecklist,
      anaphylaxisChecklist,
      statusEpilepticusChecklist
    ];

    templates.forEach(template => {
      const ids = template.steps.map(s => s.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });
  });

  it('should have at least one critical step in each template', () => {
    const templates = [
      shockResuscitationChecklist,
      sepsisBundleChecklist,
      dkaManagementChecklist,
      intubationChecklist,
      anaphylaxisChecklist,
      statusEpilepticusChecklist
    ];

    templates.forEach(template => {
      const criticalSteps = template.steps.filter(s => s.critical);
      expect(criticalSteps.length).toBeGreaterThan(0);
    });
  });
});
