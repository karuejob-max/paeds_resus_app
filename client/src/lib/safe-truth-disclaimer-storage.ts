/**
 * Client-side storage for the Safe-Truth emergency-services disclaimer
 * acknowledgment (gap-analysis queue item #11, Phase A/B).
 *
 * Replaces the old SafeTruthGuardianGate.tsx, which reads
 * `legal.getMyConsentStatus` — a per-logged-in-user record, structurally
 * incompatible with §2.2's no-account requirement. This is plain
 * localStorage, same pattern as fellowship-token-storage.ts: not tied to
 * any account, resets if the device/browser storage is cleared (shown
 * again next time, which is an acceptable, low-friction outcome for a
 * safety reminder — not a security control).
 */
const DEVICE_SESSION_KEY = "paeds_resus_safe_truth_device_session_id";
const DISCLAIMER_ACK_KEY = "paeds_resus_safe_truth_disclaimer_acked_v1";

export function getOrCreateDeviceSessionId(): string {
  try {
    const existing = window.localStorage.getItem(DEVICE_SESSION_KEY);
    if (existing) return existing;
    const created = crypto.randomUUID();
    window.localStorage.setItem(DEVICE_SESSION_KEY, created);
    return created;
  } catch {
    // Storage unavailable (private browsing, etc.) — generate an ephemeral
    // one for this page load. The disclaimer will just show again next time.
    return crypto.randomUUID();
  }
}

export function hasAcknowledgedDisclaimer(): boolean {
  try {
    return window.localStorage.getItem(DISCLAIMER_ACK_KEY) === "true";
  } catch {
    return false;
  }
}

export function markDisclaimerAcknowledged(): void {
  try {
    window.localStorage.setItem(DISCLAIMER_ACK_KEY, "true");
  } catch {
    // Ignore — worst case, shown again next visit.
  }
}
