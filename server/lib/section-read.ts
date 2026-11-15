export type SectionRead<T> = {
  data: T;
  available: boolean;
};

export function resolveSettledRead<T>(
  result: PromiseSettledResult<T>,
  fallback: T,
): SectionRead<T> {
  return result.status === "fulfilled"
    ? { data: result.value, available: true }
    : { data: fallback, available: false };
}
