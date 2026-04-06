/**
 * HI-PLAT-1: Single-line JSON logs for Render/log aggregators (search by tag, correlate IDs).
 */
export type StructuredLogValue = string | number | boolean | null | undefined;

export function logStructured(tag: string, fields: Record<string, StructuredLogValue>): void {
  const payload: Record<string, StructuredLogValue> = {
    ts: new Date().toISOString(),
    tag,
    ...fields,
  };
  console.log(JSON.stringify(payload));
}
