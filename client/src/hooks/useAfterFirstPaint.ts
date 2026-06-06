import { useEffect, useState } from "react";

/**
 * Becomes true after the first paint so non-critical tRPC queries can wait
 * without blocking initial route render or competing with auth.me on the wire.
 */
export function useAfterFirstPaint(): boolean {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const markReady = () => setReady(true);

    if (typeof requestIdleCallback !== "undefined") {
      const id = requestIdleCallback(markReady, { timeout: 1500 });
      return () => cancelIdleCallback(id);
    }

    const timer = window.setTimeout(markReady, 0);
    return () => window.clearTimeout(timer);
  }, []);

  return ready;
}
