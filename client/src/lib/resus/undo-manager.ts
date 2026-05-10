/**
 * Undo Manager for ResusGPS
 * 
 * Manages undo/redo stacks for ResusSession state.
 * - Capped at 50 states to prevent memory issues
 * - Deep clones states to prevent reference issues
 * - Tracks action descriptions for UI feedback
 */

import { ResusSession } from './abcdeEngine';

export interface UndoAction {
  id: string;
  description: string;
  timestamp: number;
}

const MAX_STACK_SIZE = 50;

/**
 * Deep clone a ResusSession to prevent reference issues
 */
export function cloneSession(session: ResusSession): ResusSession {
  return JSON.parse(JSON.stringify(session));
}

/** Checkpoint saved before an edit — must not nest prior undo/redo stacks (avoids exponential JSON size). */
function cloneCheckpointForUndo(session: ResusSession): ResusSession {
  const c = cloneSession(session);
  c.undoStack = [];
  c.redoStack = [];
  c.undoActionLabels = [];
  c.lastActionId = undefined;
  return c;
}

/** Full session frozen at undo time for redo — strips nested stacks only; keeps labels for redo restore. */
function cloneForRedoStack(session: ResusSession): ResusSession {
  const c = cloneSession(session);
  c.undoStack = [];
  c.redoStack = [];
  return c;
}

/**
 * Push current state to undo stack before making changes
 * Clears redo stack when new action is taken
 */
export function pushToUndoStack(
  session: ResusSession,
  actionDescription: string
): ResusSession {
  const cloned = cloneCheckpointForUndo(session);
  
  // Add current state to undo stack
  const newUndoStack = [...(session.undoStack || []), cloned];
  let newLabels = [...(session.undoActionLabels || []), actionDescription];
  
  // Cap undo stack at MAX_STACK_SIZE
  if (newUndoStack.length > MAX_STACK_SIZE) {
    newUndoStack.shift();
    newLabels.shift();
  }
  
  // Clear redo stack when new action is taken
  return {
    ...session,
    undoStack: newUndoStack,
    undoActionLabels: newLabels,
    redoStack: [],
    lastActionId: actionDescription,
  };
}

/**
 * Undo last action
 * Moves current state to redo stack, restores from undo stack
 */
export function undo(session: ResusSession): ResusSession | null {
  if (!session.undoStack || session.undoStack.length === 0) {
    return null; // Nothing to undo
  }
  
  // Pop from undo stack
  const previousState = session.undoStack[session.undoStack.length - 1];
  const newUndoStack = session.undoStack.slice(0, -1);
  
  // Push current state to redo stack
  const cloned = cloneForRedoStack(session);
  const newRedoStack = [...(session.redoStack || []), cloned];
  
  // Cap redo stack at MAX_STACK_SIZE
  if (newRedoStack.length > MAX_STACK_SIZE) {
    newRedoStack.shift();
  }

  const labels = session.undoActionLabels || [];
  const undoneDescription = labels[labels.length - 1] ?? session.lastActionId ?? 'action';
  const newUndoLabels = labels.slice(0, -1);
  
  return {
    ...previousState,
    undoStack: newUndoStack,
    redoStack: newRedoStack,
    undoActionLabels: newUndoLabels,
    lastActionId: `Undid: ${undoneDescription}`,
  };
}

/**
 * Redo last undone action
 * Moves current state to undo stack, restores from redo stack
 */
export function redo(session: ResusSession): ResusSession | null {
  if (!session.redoStack || session.redoStack.length === 0) {
    return null; // Nothing to redo
  }
  
  // Pop from redo stack
  const nextState = session.redoStack[session.redoStack.length - 1];
  const newRedoStack = session.redoStack.slice(0, -1);
  
  // Push current state to undo stack
  const cloned = cloneCheckpointForUndo(session);
  const newUndoStack = [...(session.undoStack || []), cloned];
  
  // Cap undo stack at MAX_STACK_SIZE
  if (newUndoStack.length > MAX_STACK_SIZE) {
    newUndoStack.shift();
  }
  
  return {
    ...nextState,
    undoStack: newUndoStack,
    redoStack: newRedoStack,
    undoActionLabels: nextState.undoActionLabels ?? [],
    lastActionId: `Redid: ${nextState.lastActionId || 'action'}`,
  };
}

/**
 * Check if undo is available
 */
export function canUndo(session: ResusSession): boolean {
  return (session.undoStack?.length || 0) > 0;
}

/**
 * Check if redo is available
 */
export function canRedo(session: ResusSession): boolean {
  return (session.redoStack?.length || 0) > 0;
}

/**
 * Get description of last undoable action
 */
export function getLastUndoDescription(session: ResusSession): string | null {
  const labels = session.undoActionLabels || [];
  if (labels.length) {
    return labels[labels.length - 1] ?? null;
  }
  // Legacy stacks saved without parallel labels
  if (!session.undoStack?.length) return null;
  const lastState = session.undoStack[session.undoStack.length - 1];
  return lastState.lastActionId || null;
}

/**
 * Get description of last redoable action
 */
export function getLastRedoDescription(session: ResusSession): string | null {
  if (!session.redoStack || session.redoStack.length === 0) {
    return null;
  }
  
  const lastState = session.redoStack[session.redoStack.length - 1];
  return lastState.lastActionId || 'action';
}

/**
 * Clear all undo/redo history (e.g., when starting new session)
 */
export function clearUndoRedo(session: ResusSession): ResusSession {
  return {
    ...session,
    undoStack: [],
    redoStack: [],
    undoActionLabels: [],
    lastActionId: undefined,
  };
}
