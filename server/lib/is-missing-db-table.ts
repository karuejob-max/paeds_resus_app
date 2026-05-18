/** True when MySQL/Drizzle failed because a table was never migrated (production schema drift). */
export function isMissingTableError(error: unknown, tableHint?: string): boolean {
  const msg = error instanceof Error ? error.message : String(error);
  if (!/doesn't exist|ER_NO_SUCH_TABLE|Failed query/i.test(msg)) {
    return false;
  }
  if (tableHint) {
    return msg.includes(tableHint) || msg.includes(`\`${tableHint}\``);
  }
  return true;
}
