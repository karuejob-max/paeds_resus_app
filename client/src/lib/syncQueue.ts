// @ts-nocheck
/**
 * Background Sync Queue for Offline Mutations
 * 
 * Queues tRPC mutations when offline and automatically retries
 * when connectivity returns. Implements exponential backoff.
 */

import {
  queueMutation,
  getPendingMutations,
  deleteMutation,
  type PendingMutation,
} from './offlineDB';

const MAX_RETRIES = 5;
const INITIAL_RETRY_DELAY = 1000; // 1 second
const MAX_RETRY_DELAY = 60000; // 1 minute

/**
 * Queue a tRPC mutation for background sync
 */
export async function queueTRPCMutation(
  procedure: string,
  input: unknown
): Promise<void> {
  const mutation: Omit<PendingMutation, 'id'> = {
    url: `/api/trpc/${procedure}`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ input }),
    timestamp: Date.now(),
    retryCount: 0,
    maxRetries: MAX_RETRIES,
  };

  await queueMutation(mutation);
  console.log('[Sync Queue] Queued mutation:', procedure);

  // Trigger sync if online
  if (navigator.onLine) {
    await syncPendingMutations();
  }
}

/**
 * Sync all pending mutations
 */
export async function syncPendingMutations(): Promise<{
  synced: number;
  failed: number;
}> {
  console.log('[Sync Queue] Starting sync...');

  const mutations = await getPendingMutations();
  console.log(`[Sync Queue] Found ${mutations.length} pending mutations`);

  let synced = 0;
  let failed = 0;

  for (const mutation of mutations) {
    try {
      const success = await retryMutation(mutation);
      if (success) {
        await deleteMutation(mutation.id!);
        synced++;
        console.log(`[Sync Queue] Synced mutation ${mutation.id}`);
      } else {
        failed++;
        console.log(`[Sync Queue] Failed to sync mutation ${mutation.id}`);
      }
    } catch (error) {
      console.error(`[Sync Queue] Error syncing mutation ${mutation.id}:`, error);
      failed++;
    }
  }

  console.log(`[Sync Queue] Sync complete: ${synced} synced, ${failed} failed`);

  return { synced, failed };
}

/**
 * Retry a single mutation with exponential backoff
 */
async function retryMutation(mutation: PendingMutation): Promise<boolean> {
  // Check if max retries exceeded
  if (mutation.retryCount >= mutation.maxRetries) {
    console.error(`[Sync Queue] Max retries exceeded for mutation ${mutation.id}`);
    return false;
  }

  // Calculate retry delay with exponential backoff
  const delay = Math.min(
    INITIAL_RETRY_DELAY * Math.pow(2, mutation.retryCount),
    MAX_RETRY_DELAY
  );

  console.log(
    `[Sync Queue] Retrying mutation ${mutation.id} (attempt ${mutation.retryCount + 1}/${mutation.maxRetries}) after ${delay}ms`
  );

  // Wait for retry delay
  await new Promise((resolve) => setTimeout(resolve, delay));

  try {
    const response = await fetch(mutation.url, {
      method: mutation.method,
      headers: mutation.headers,
      body: mutation.body,
      credentials: 'include',
    });

    if (response.ok) {
      console.log(`[Sync Queue] Mutation ${mutation.id} succeeded`);
      return true;
    } else {
      console.error(
        `[Sync Queue] Mutation ${mutation.id} failed with status ${response.status}`
      );

      // Increment retry count
      mutation.retryCount++;

      // If not max retries, queue for next attempt
      if (mutation.retryCount < mutation.maxRetries) {
        await queueMutation(mutation);
      }

      return false;
    }
  } catch (error) {
    console.error(`[Sync Queue] Network error for mutation ${mutation.id}:`, error);

    // Increment retry count
    mutation.retryCount++;

    // If not max retries, queue for next attempt
    if (mutation.retryCount < mutation.maxRetries) {
      await queueMutation(mutation);
    }

    return false;
  }
}

/**
 * Register background sync event
 */
export function registerBackgroundSync(): void {
  if (!('serviceWorker' in navigator) || !('sync' in ServiceWorkerRegistration.prototype)) {
    console.warn('[Sync Queue] Background sync not supported');
    return;
  }

  // Listen for online event
  window.addEventListener('online', async () => {
    console.log('[Sync Queue] Network connection restored, triggering sync');

    try {
      // Request background sync
      const registration = await navigator.serviceWorker.ready;
      await registration.sync.register('sync-mutations');
      console.log('[Sync Queue] Background sync registered');
    } catch (error) {
      console.error('[Sync Queue] Failed to register background sync:', error);

      // Fallback: sync immediately
      await syncPendingMutations();
    }
  });

  // Periodic sync check (every 30 seconds when online)
  setInterval(async () => {
    if (navigator.onLine) {
      const mutations = await getPendingMutations();
      if (mutations.length > 0) {
        console.log('[Sync Queue] Periodic sync check: pending mutations found');
        await syncPendingMutations();
      }
    }
  }, 30000);

  console.log('[Sync Queue] Background sync registered');
}

/**
 * Get sync queue status
 */
export async function getSyncQueueStatus(): Promise<{
  pending: number;
  oldestTimestamp: number | null;
}> {
  const mutations = await getPendingMutations();

  return {
    pending: mutations.length,
    oldestTimestamp:
      mutations.length > 0
        ? Math.min(...mutations.map((m) => m.timestamp))
        : null,
  };
}

/**
 * Clear all pending mutations (use with caution)
 */
export async function clearSyncQueue(): Promise<void> {
  const mutations = await getPendingMutations();

  for (const mutation of mutations) {
    await deleteMutation(mutation.id!);
  }

  console.log('[Sync Queue] Cleared all pending mutations');
}

/**
 * Intercept tRPC mutations and queue when offline
 */
export function createOfflineInterceptor() {
  return {
    async onError(opts: { error: unknown; type: string }) {
      // Check if error is network-related
      const isNetworkError =
        opts.error instanceof TypeError &&
        (opts.error.message.includes('fetch') ||
          opts.error.message.includes('network'));

      if (isNetworkError && opts.type === 'mutation') {
        console.log('[Sync Queue] Network error detected, queuing mutation');
        // Mutation will be queued by the calling code
      }

      return opts;
    },
  };
}

console.log('[Sync Queue] Sync queue module loaded');
