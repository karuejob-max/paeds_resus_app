/**
 * useUndo Hook
 * 
 * Provides undo/redo functionality for ResusSession state.
 * Usage:
 *   const { canUndo, canRedo, undo, redo, getLastUndoDesc } = useUndo(session, setSession);
 */

import { ResusSession } from '@/lib/resus/abcdeEngine';
import {
  undo as undoAction,
  redo as redoAction,
  canUndo as checkCanUndo,
  canRedo as checkCanRedo,
  getLastUndoDescription,
  getLastRedoDescription,
} from '@/lib/resus/undo-manager';
import { useCallback, useEffect } from 'react';

export function useUndo(
  session: ResusSession | null,
  setSession: (session: ResusSession) => void
) {
  const canUndo = session ? checkCanUndo(session) : false;
  const canRedo = session ? checkCanRedo(session) : false;

  const undo = useCallback(() => {
    if (!session) return;
    const previousState = undoAction(session);
    if (previousState) {
      setSession(previousState);
    }
  }, [session, setSession]);

  const redo = useCallback(() => {
    if (!session) return;
    const nextState = redoAction(session);
    if (nextState) {
      setSession(nextState);
    }
  }, [session, setSession]);

  const getLastUndoDesc = useCallback(() => {
    return session ? getLastUndoDescription(session) : null;
  }, [session]);

  const getLastRedoDesc = useCallback(() => {
    return session ? getLastRedoDescription(session) : null;
  }, [session]);

  // Wire keyboard shortcuts (Cmd+Z / Ctrl+Z for undo, Cmd+Shift+Z / Ctrl+Shift+Z for redo)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const ctrlKey = isMac ? e.metaKey : e.ctrlKey;

      // Undo: Cmd+Z or Ctrl+Z
      if (ctrlKey && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }

      // Redo: Cmd+Shift+Z or Ctrl+Shift+Z
      if (ctrlKey && e.key === 'z' && e.shiftKey) {
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  return {
    canUndo,
    canRedo,
    undo,
    redo,
    getLastUndoDesc,
    getLastRedoDesc,
  };
}
