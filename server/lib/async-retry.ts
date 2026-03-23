/**
 * Run an async operation with retries (transient DB / network failures).
 * Used by M-Pesa webhook so Safaricom can retry on 5xx if all attempts fail.
 */
export async function runWithRetries<T>(
  fn: () => Promise<T>,
  options: { retries: number; delayMs: number; label?: string } = {
    retries: 3,
    delayMs: 250,
  }
): Promise<T> {
  const { retries, delayMs, label } = options;
  let lastError: unknown;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (e) {
      lastError = e;
      const tag = label ? `[${label}]` : "[retry]";
      console.warn(`${tag} attempt ${attempt}/${retries} failed:`, e instanceof Error ? e.message : e);
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, delayMs * attempt));
      }
    }
  }
  throw lastError;
}
