/**
 * mobile/lib/engine/persistence.ts
 *
 * AsyncStorage session persistence for the mobile ABCDE engine.
 * Replaces the IndexedDB-based resusSessionStore.ts used in the web app.
 *
 * Stores:
 *   RESUS_SESSION_KEY  — active ResusSession (auto-saved every 5s)
 *   SAMPLE_HISTORY_KEY — last SAMPLE history (saved on case end)
 *   PROTOCOLS_USED_KEY — condition protocols used in current case
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ResusSession, SAMPLEHistory } from './index';

const RESUS_SESSION_KEY = 'resus_active_session_v2';
const SAMPLE_HISTORY_KEY = 'resus_sample_history_v1';
const PROTOCOLS_USED_KEY = 'resus_protocols_used_v1';
const MAX_SESSION_AGE_MS = 4 * 60 * 60 * 1000; // 4 hours

// ─── Active Session ──────────────────────────────────────────────────────────

export async function saveActiveSession(session: ResusSession): Promise<void> {
  try {
    const payload = {
      session,
      savedAt: new Date().toISOString(),
    };
    await AsyncStorage.setItem(RESUS_SESSION_KEY, JSON.stringify(payload));
  } catch (e) {
    console.warn('[persistence] Failed to save active session:', e);
  }
}

export async function loadActiveSession(): Promise<ResusSession | null> {
  try {
    const raw = await AsyncStorage.getItem(RESUS_SESSION_KEY);
    if (!raw) return null;
    const { session, savedAt } = JSON.parse(raw);
    const age = Date.now() - new Date(savedAt).getTime();
    if (age > MAX_SESSION_AGE_MS) {
      await clearActiveSession();
      return null;
    }
    // Only return if case is not idle
    if (session?.phase === 'IDLE') return null;
    return session as ResusSession;
  } catch (e) {
    console.warn('[persistence] Failed to load active session:', e);
    return null;
  }
}

export async function clearActiveSession(): Promise<void> {
  try {
    await AsyncStorage.removeItem(RESUS_SESSION_KEY);
  } catch (e) {
    console.warn('[persistence] Failed to clear active session:', e);
  }
}

// ─── SAMPLE History ──────────────────────────────────────────────────────────

export async function saveSampleHistory(sample: SAMPLEHistory): Promise<void> {
  try {
    await AsyncStorage.setItem(SAMPLE_HISTORY_KEY, JSON.stringify({
      sample,
      savedAt: new Date().toISOString(),
    }));
  } catch (e) {
    console.warn('[persistence] Failed to save SAMPLE history:', e);
  }
}

export async function loadLastSampleHistory(): Promise<SAMPLEHistory | null> {
  try {
    const raw = await AsyncStorage.getItem(SAMPLE_HISTORY_KEY);
    if (!raw) return null;
    const { sample } = JSON.parse(raw);
    return sample as SAMPLEHistory;
  } catch (e) {
    console.warn('[persistence] Failed to load SAMPLE history:', e);
    return null;
  }
}

export async function clearSampleHistory(): Promise<void> {
  try {
    await AsyncStorage.removeItem(SAMPLE_HISTORY_KEY);
  } catch (e) {
    console.warn('[persistence] Failed to clear SAMPLE history:', e);
  }
}

// ─── Protocols Used ──────────────────────────────────────────────────────────

export async function saveProtocolsUsed(protocols: string[]): Promise<void> {
  try {
    await AsyncStorage.setItem(PROTOCOLS_USED_KEY, JSON.stringify(protocols));
  } catch (e) {
    console.warn('[persistence] Failed to save protocols used:', e);
  }
}

export async function loadProtocolsUsed(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(PROTOCOLS_USED_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as string[];
  } catch (e) {
    return [];
  }
}

export async function clearProtocolsUsed(): Promise<void> {
  try {
    await AsyncStorage.removeItem(PROTOCOLS_USED_KEY);
  } catch (e) {
    console.warn('[persistence] Failed to clear protocols used:', e);
  }
}

// ─── Full Case Reset ─────────────────────────────────────────────────────────

export async function clearAllCaseData(): Promise<void> {
  await Promise.all([
    clearActiveSession(),
    clearProtocolsUsed(),
    // Note: SAMPLE history is intentionally preserved across cases
  ]);
}
