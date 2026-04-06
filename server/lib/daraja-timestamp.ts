/**
 * Daraja STK / Lipa Na M-Pesa Online `Password` field uses:
 *   Base64(BusinessShortCode + PassKey + Timestamp)
 * Timestamp must be `YYYYMMDDHHmmss` in **Kenya local time (EAT)**.
 * Using UTC (`toISOString()`) or the server's default timezone causes **400.002.02 Invalid Timestamp**.
 */
export function getDarajaTimestampNairobi(): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Nairobi",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(new Date());

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? "";

  return `${get("year")}${get("month")}${get("day")}${get("hour")}${get("minute")}${get("second")}`;
}
