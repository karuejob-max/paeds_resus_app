/**
 * Tests for Undo Manager
 * 
 * Validates undo/redo stack operations, state cloning, and edge cases.
 */

import { describe, it, expect } from 'vitest';
import {
  cloneSession,
  pushToUndoStack,
  undo,
  redo,
  canUndo,
  canRedo,
  getLastUndoDescription,
  getLastRedoDescription,
  clearUndoRedo,
} from './undo-manager';
import { createSession } from './abcdeEngine';

describe('Undo Manager', () => {
  describe('cloneSession', () => {
    it('should deep clone a session', () => {
      const session = createSession();
      const cloned = cloneSession(session);

      expect(cloned).toEqual(session);
      expect(cloned).not.toBe(session); // Different reference
      expect(cloned.findings).not.toBe(session.findings); // Deep clone
    });

    it('should handle nested objects', () => {
      const session = createSession();
      session.findings.push({
        id: 'test-1',
        letter: 'A',
        description: 'Test finding',
        severity: 'critical',
        timestamp: Date.now(),
      });

      const cloned = cloneSession(session);
      cloned.findings[0].description = 'Modified';

      expect(session.findings[0].description).toBe('Test finding');
      expect(cloned.findings[0].description).toBe('Modified');
    });
  });

  describe('pushToUndoStack', () => {
    it('should push state to undo stack', () => {
      const session = createSession();
      const result = pushToUndoStack(session, 'Test action');

      expect(result.undoStack.length).toBe(1);
      expect(result.undoStack[0]).toEqual(session);
      expect(result.lastActionId).toBe('Test action');
    });

    it('should clear redo stack when new action is taken', () => {
      const session = createSession();
      session.redoStack = [createSession()];

      const result = pushToUndoStack(session, 'New action');

      expect(result.redoStack.length).toBe(0);
    });

    it('should cap undo stack at 50 states', () => {
      let session = createSession();

      // Push 60 states
      for (let i = 0; i < 60; i++) {
        session = pushToUndoStack(session, `Action ${i}`);
      }

      expect(session.undoStack.length).toBe(50);
    });

    it('should preserve action description', () => {
      const session = createSession();
      const result = pushToUndoStack(session, 'Added HR 160');

      expect(result.lastActionId).toBe('Added HR 160');
    });
  });

  describe('undo', () => {
    it('should restore previous state', () => {
      let session = createSession();
      session.patientWeight = 10;

      session = pushToUndoStack(session, 'Set weight to 10');
      session.patientWeight = 20; // Modify state

      const undone = undo(session);

      expect(undone).not.toBeNull();
      expect(undone!.patientWeight).toBe(10);
    });

    it('should move current state to redo stack', () => {
      let session = createSession();
      session.patientWeight = 10;

      session = pushToUndoStack(session, 'Set weight');
      session.patientWeight = 20;

      const undone = undo(session);

      expect(undone!.redoStack.length).toBe(1);
      expect(undone!.redoStack[0].patientWeight).toBe(20);
    });

    it('should return null if nothing to undo', () => {
      const session = createSession();
      const result = undo(session);

      expect(result).toBeNull();
    });

    it('should cap redo stack at 50 states', () => {
      let session = createSession();

      // Create 60 undo states
      for (let i = 0; i < 60; i++) {
        session = pushToUndoStack(session, `Action ${i}`);
        session.patientWeight = i; // Modify state
      }

      // Undo all 60
      for (let i = 0; i < 60; i++) {
        const result = undo(session);
        if (result) session = result;
      }

      expect(session.redoStack.length).toBeLessThanOrEqual(50);
    });

    it('should update lastActionId with undo description', () => {
      let session = createSession();
      session = pushToUndoStack(session, 'Added HR 160');
      session.patientWeight = 20;

      const undone = undo(session);

      expect(undone!.lastActionId).toContain('Undid');
      expect(undone!.lastActionId).toContain('Added HR 160');
    });
  });

  describe('redo', () => {
    it('should restore redone state', () => {
      let session = createSession();
      session = pushToUndoStack(session, 'Set weight');
      session.patientWeight = 20;

      let undone = undo(session);
      expect(undone!.patientWeight).toBe(10);

      const redone = redo(undone!);

      expect(redone).not.toBeNull();
      expect(redone!.patientWeight).toBe(20);
    });

    it('should move current state to undo stack', () => {
      let session = createSession();
      session = pushToUndoStack(session, 'Set weight');
      session.patientWeight = 20;

      let undone = undo(session);
      const redone = redo(undone!);

      expect(redone!.undoStack.length).toBe(2);
    });

    it('should return null if nothing to redo', () => {
      const session = createSession();
      const result = redo(session);

      expect(result).toBeNull();
    });
  });

  describe('canUndo / canRedo', () => {
    it('should return false for empty undo stack', () => {
      const session = createSession();
      expect(canUndo(session)).toBe(false);
    });

    it('should return true when undo stack has items', () => {
      let session = createSession();
      session = pushToUndoStack(session, 'Action');

      expect(canUndo(session)).toBe(true);
    });

    it('should return false for empty redo stack', () => {
      const session = createSession();
      expect(canRedo(session)).toBe(false);
    });

    it('should return true when redo stack has items', () => {
      let session = createSession();
      session = pushToUndoStack(session, 'Action');
      session.patientWeight = 20;

      let undone = undo(session);
      expect(canRedo(undone!)).toBe(true);
    });
  });

  describe('getLastUndoDescription / getLastRedoDescription', () => {
    it('should return description of last undoable action', () => {
      let session = createSession();
      session = pushToUndoStack(session, 'Added HR 160');

      expect(getLastUndoDescription(session)).toBe('Added HR 160');
    });

    it('should return null if nothing to undo', () => {
      const session = createSession();
      expect(getLastUndoDescription(session)).toBeNull();
    });

    it('should return description of last redoable action', () => {
      let session = createSession();
      session = pushToUndoStack(session, 'Added HR 160');
      session.patientWeight = 20;

      let undone = undo(session);
      const desc = getLastRedoDescription(undone!);

      expect(desc).toBeTruthy();
    });

    it('should return null if nothing to redo', () => {
      const session = createSession();
      expect(getLastRedoDescription(session)).toBeNull();
    });
  });

  describe('clearUndoRedo', () => {
    it('should clear undo and redo stacks', () => {
      let session = createSession();
      session = pushToUndoStack(session, 'Action 1');
      session = pushToUndoStack(session, 'Action 2');
      session.patientWeight = 20;

      let undone = undo(session);
      const cleared = clearUndoRedo(undone!);

      expect(cleared.undoStack.length).toBe(0);
      expect(cleared.redoStack.length).toBe(0);
      expect(cleared.lastActionId).toBeUndefined();
    });
  });

  describe('Integration: Full undo/redo cycle', () => {
    it('should handle multiple undo/redo operations', () => {
      let session = createSession();

      // Action 1: Set weight to 10
      session = pushToUndoStack(session, 'Set weight to 10');
      session.patientWeight = 10;

      // Action 2: Set weight to 20
      session = pushToUndoStack(session, 'Set weight to 20');
      session.patientWeight = 20;

      // Action 3: Set weight to 30
      session = pushToUndoStack(session, 'Set weight to 30');
      session.patientWeight = 30;

      // Undo to 20
      let undone1 = undo(session);
      expect(undone1!.patientWeight).toBe(20);

      // Undo to 10
      let undone2 = undo(undone1!);
      expect(undone2!.patientWeight).toBe(10);

      // Redo to 20
      let redone1 = redo(undone2!);
      expect(redone1!.patientWeight).toBe(20);

      // Redo to 30
      let redone2 = redo(redone1!);
      expect(redone2!.patientWeight).toBe(30);

      expect(canUndo(redone2!)).toBe(true);
      expect(canRedo(redone2!)).toBe(false);
    });

    it('should clear redo stack when new action taken after undo', () => {
      let session = createSession();
      session = pushToUndoStack(session, 'Action 1');
      session.patientWeight = 10;

      session = pushToUndoStack(session, 'Action 2');
      session.patientWeight = 20;

      let undone = undo(session);
      expect(canRedo(undone!)).toBe(true);

      // New action taken
      undone = pushToUndoStack(undone!, 'Action 3');
      undone.patientWeight = 15;

      expect(canRedo(undone)).toBe(false);
    });
  });
});
