export const IERP_PROMOTIONAL_SENDING_ENABLED = false as const;

export function getIerpEmailSafetyStatus() {
  return {
    programKey: "ierp" as const,
    promotionalSendingEnabled: IERP_PROMOTIONAL_SENDING_ENABLED,
    allowedScheduleStates: ["draft", "paused"] as const,
  };
}

export function blockIerpPromotionalSend() {
  return {
    success: false as const,
    blocked: true as const,
    reason: "IERP promotional sending is disabled. Use audience preview only.",
  };
}
