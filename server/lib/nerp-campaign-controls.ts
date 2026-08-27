export type NerpSuppressionMatchType = "email" | "exact_name";

export type NerpSuppressionMatch = {
  id: number;
  matchType: NerpSuppressionMatchType;
  matchValue: string;
  reasonCode: string;
  note: string | null;
};

export function normalizedName(value: string | null | undefined) {
  return (value ?? "").trim().toLowerCase().replace(/\s+/g, " ");
}

export function normalizedEmail(value: string | null | undefined) {
  return (value ?? "").trim().toLowerCase();
}

export function validEmail(value: string | null | undefined) {
  return Boolean(value && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()));
}

export function normalizedSuppressionValue(
  matchType: NerpSuppressionMatchType,
  value: string
) {
  return matchType === "email" ? normalizedEmail(value) : normalizedName(value);
}

export function findCampaignSuppression(
  suppressions: NerpSuppressionMatch[],
  email: string | null | undefined,
  name: string | null | undefined
) {
  const candidateEmail = normalizedEmail(email);
  const candidateName = normalizedName(name);
  return suppressions.find(row =>
    (row.matchType === "email" && candidateEmail && row.matchValue === candidateEmail) ||
    (row.matchType === "exact_name" && candidateName && row.matchValue === candidateName)
  ) ?? null;
}
