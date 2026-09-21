export type SesEventType =
  | "send"
  | "delivery"
  | "bounce"
  | "complaint"
  | "reject"
  | "delivery_delay"
  | "subscription"
  | "rendering_failure"
  | "unknown";

export type SesDeliveryOutcome =
  | "delivered"
  | "bounced"
  | "complained"
  | "rejected"
  | "delayed"
  | "suppressed"
  | "unknown";

export type SesFeedbackEvent = {
  providerEventId: string;
  providerMessageId: string;
  eventType: SesEventType;
  outcome: SesDeliveryOutcome;
  recipientEmail: string | null;
  eventAt: Date | null;
  eventJson: string;
};

function normalizeEmail(value: unknown) {
  return typeof value === "string" && value.includes("@")
    ? value.trim().toLowerCase()
    : null;
}

function canonicalEventType(eventType: string): SesEventType {
  switch (eventType.toLowerCase()) {
    case "send":
    case "delivery":
    case "bounce":
    case "complaint":
    case "reject":
    case "subscription":
      return eventType.toLowerCase() as SesEventType;
    case "deliverydelay":
      return "delivery_delay";
    case "renderingfailure":
      return "rendering_failure";
    default:
      return "unknown";
  }
}

function outcomeFor(eventType: string): SesDeliveryOutcome {
  switch (eventType.toLowerCase()) {
    case "delivery":
      return "delivered";
    case "bounce":
      return "bounced";
    case "complaint":
      return "complained";
    case "reject":
      return "rejected";
    case "deliverydelay":
      return "delayed";
    case "suppression":
      return "suppressed";
    default:
      return "unknown";
  }
}

function eventDate(value: unknown) {
  if (typeof value !== "string") return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function normalizeSesNotification(
  snsMessageId: string,
  payload: Record<string, any>
): SesFeedbackEvent[] {
  const eventType = canonicalEventType(String(payload.eventType || payload.notificationType || "unknown"));
  const providerMessageId = String(payload.mail?.messageId || "").trim();
  if (!providerMessageId) return [];

  const recipients: string[] = [];
  const add = (value: unknown) => {
    const email = normalizeEmail(value);
    if (email && !recipients.includes(email)) recipients.push(email);
  };
  for (const value of payload.mail?.destination || []) add(value);
  for (const row of payload.bounce?.bouncedRecipients || []) add(row?.emailAddress);
  for (const row of payload.complaint?.complainedRecipients || []) add(row?.emailAddress);

  const serialized = JSON.stringify(payload);
  return (recipients.length ? recipients : [null]).map(recipientEmail => ({
    providerEventId: `${snsMessageId}:${eventType}:${recipientEmail || "all"}`,
    providerMessageId,
    eventType,
    outcome: outcomeFor(eventType),
    recipientEmail,
    eventAt: eventDate(
      payload.delivery?.timestamp ||
        payload.bounce?.timestamp ||
        payload.complaint?.timestamp ||
        payload.timestamp
    ),
    eventJson: serialized,
  }));
}
