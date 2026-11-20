const tails = new Map<string, Promise<unknown>>();
/** A process-local safeguard; durable pending rows retain uncertainty across restarts. */
export async function withStkCourseLock<T>(
  key: string,
  work: () => Promise<T>
): Promise<T> {
  const previous = tails.get(key) ?? Promise.resolve();
  const current = previous.catch(() => undefined).then(work);
  tails.set(key, current);
  try {
    return await current;
  } finally {
    if (tails.get(key) === current) tails.delete(key);
  }
}
