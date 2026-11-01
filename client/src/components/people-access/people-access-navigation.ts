import type { PeopleView } from "@shared/institution-administration-location";

export function choosePeopleAccessView({
  explicitView,
  attentionCount,
  unavailable,
}: {
  explicitView?: PeopleView;
  attentionCount?: number;
  unavailable?: boolean;
}): PeopleView {
  if (explicitView) return explicitView;
  if (unavailable || attentionCount == null) return "roles";
  return attentionCount > 0 ? "inbox" : "roles";
}
