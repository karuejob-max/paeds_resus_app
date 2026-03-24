/**
 * HI-B2B-3 / P3-GOV-1: RFC4180-style CSV for institutional incidents (governance export).
 * Omits free-text `notes` by default for committee sharing.
 */

export type IncidentCsvRow = {
  id: number;
  incidentDate: Date | string | null | undefined;
  incidentType: string | null | undefined;
  patientAge: number | null | undefined;
  responseTime: number | null | undefined;
  outcome: string | null | undefined;
  neurologicalStatus: string | null | undefined;
  staffInvolved: unknown;
  protocolsUsed: unknown;
  systemGapsIdentified: unknown;
  improvementsImplemented: string | null | undefined;
  notes?: string | null | undefined;
};

function escapeCsvCell(val: string): string {
  if (/[",\n\r]/.test(val)) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return val;
}

function jsonish(v: unknown): string {
  if (v == null || v === "") return "";
  if (typeof v === "string") return v;
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}

function formatDate(d: Date | string | null | undefined): string {
  if (d == null) return "";
  try {
    return new Date(d).toISOString();
  } catch {
    return String(d);
  }
}

/** Columns suitable for governance; excludes `notes`. */
export function buildIncidentsGovernanceCsv(rows: IncidentCsvRow[]): string {
  const headers = [
    "id",
    "incidentDate",
    "incidentType",
    "patientAge",
    "responseTime",
    "outcome",
    "neurologicalStatus",
    "staffInvolved",
    "protocolsUsed",
    "systemGapsIdentified",
    "improvementsImplemented",
  ];
  const lines = [headers.join(",")];
  for (const row of rows) {
    const cells = [
      String(row.id),
      formatDate(row.incidentDate),
      row.incidentType ?? "",
      row.patientAge != null ? String(row.patientAge) : "",
      row.responseTime != null ? String(row.responseTime) : "",
      row.outcome ?? "",
      row.neurologicalStatus ?? "",
      jsonish(row.staffInvolved),
      jsonish(row.protocolsUsed),
      jsonish(row.systemGapsIdentified),
      row.improvementsImplemented ?? "",
    ].map(escapeCsvCell);
    lines.push(cells.join(","));
  }
  return lines.join("\r\n");
}

export function downloadCsv(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
