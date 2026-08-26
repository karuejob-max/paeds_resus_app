/** @vitest-environment jsdom */
import 'fake-indexeddb/auto';
import { afterEach, describe, expect, it } from 'vitest';
import {
  acknowledgeCprGpsEvent,
  clearCprGpsSnapshot,
  enqueueCprGpsEvent,
  loadCprGpsEventOutbox,
  loadCprGpsSnapshot,
  persistCprGpsSnapshot,
} from './cprGpsSessionStore';

const snapshot = {
  caseKey: 'simulation-case-1',
  savedAt: Date.now(),
  arrestDuration: 42,
  compressionElapsed: 42,
  cycleNumber: 1,
  cycleTime: 42,
  phase: 'compressions' as const,
  engineState: {
    shockCount: 0,
    epiDoses: 0,
    lastEpiTime: null,
    antiarrhythmicDoses: 0,
    rhythmType: 'unknown' as const,
    phase: 'compressions' as const,
  },
  rhythmType: null,
  roscAchieved: false,
  advancedAirwayPlaced: false,
  defibrillatorDelayed: false,
  defibCharging: false,
  chargeForShock: false,
  rhythmWindowElapsed: null,
  reassessmentTime: 0,
  events: [],
};

describe('cprGpsSessionStore', () => {
  afterEach(async () => {
    clearCprGpsSnapshot(snapshot.caseKey);
    const items = await loadCprGpsEventOutbox(snapshot.caseKey);
    for (const item of items) acknowledgeCprGpsEvent(item.localEventId);
  });

  it('persists and loads a case-scoped CPR snapshot', async () => {
    persistCprGpsSnapshot(snapshot);
    await new Promise((resolve) => setTimeout(resolve, 0));
    await expect(loadCprGpsSnapshot(snapshot.caseKey)).resolves.toMatchObject({
      caseKey: snapshot.caseKey,
      arrestDuration: 42,
      phase: 'compressions',
    });
  });

  it('queues and acknowledges an offline event without patient identifiers', async () => {
    enqueueCprGpsEvent({
      localEventId: 'local-event-1',
      caseKey: snapshot.caseKey,
      sessionId: null,
      eventType: 'note',
      eventTime: 42,
      description: 'Offline simulation note',
      queuedAt: Date.now(),
    });
    await new Promise((resolve) => setTimeout(resolve, 0));
    await expect(loadCprGpsEventOutbox(snapshot.caseKey)).resolves.toHaveLength(1);
    acknowledgeCprGpsEvent('local-event-1');
    await new Promise((resolve) => setTimeout(resolve, 0));
    await expect(loadCprGpsEventOutbox(snapshot.caseKey)).resolves.toHaveLength(0);
  });
});
