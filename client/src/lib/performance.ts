/**
 * Performance optimization utilities
 */

/**
 * Debounce function to limit function calls
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function to limit function calls
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Lazy load images
 */
export function lazyLoadImages(): void {
  if ("IntersectionObserver" in window) {
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          img.src = img.dataset.src || "";
          img.classList.remove("lazy");
          imageObserver.unobserve(img);
        }
      });
    });

    document.querySelectorAll("img.lazy").forEach((img) => {
      imageObserver.observe(img);
    });
  }
}

/**
 * Preload critical resources
 */
export function preloadResources(urls: string[]): void {
  urls.forEach((url) => {
    const link = document.createElement("link");
    link.rel = "preload";
    link.as = "script";
    link.href = url;
    document.head.appendChild(link);
  });
}

/**
 * Measure performance metrics
 */
export function measurePerformance(label: string): () => void {
  const start = performance.now();

  return () => {
    const end = performance.now();
    console.log(`${label}: ${(end - start).toFixed(2)}ms`);
  };
}

/**
 * Cache API responses
 */
export class ResponseCache {
  private cache: Map<string, { data: unknown; timestamp: number }> = new Map();
  private ttl: number; // Time to live in milliseconds

  constructor(ttl: number = 5 * 60 * 1000) {
    // Default 5 minutes
    this.ttl = ttl;
  }

  set(key: string, data: unknown): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  get(key: string): unknown | null {
    const item = this.cache.get(key);

    if (!item) return null;

    if (Date.now() - item.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  clear(): void {
    this.cache.clear();
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }
}

/**
 * Request batching for API calls
 */
export class RequestBatcher {
  private queue: Array<{ key: string; resolve: (value: unknown) => void; reject: (error: unknown) => void }> = [];
  private timeout: NodeJS.Timeout | null = null;
  private batchSize: number;
  private batchDelay: number;
  private batchFn: (keys: string[]) => Promise<Record<string, unknown>>;

  constructor(
    batchFn: (keys: string[]) => Promise<Record<string, unknown>>,
    batchSize: number = 10,
    batchDelay: number = 50
  ) {
    this.batchFn = batchFn;
    this.batchSize = batchSize;
    this.batchDelay = batchDelay;
  }

  async request(key: string): Promise<unknown> {
    return new Promise((resolve, reject) => {
      this.queue.push({ key, resolve, reject });

      if (this.queue.length >= this.batchSize) {
        this.flush();
      } else if (!this.timeout) {
        this.timeout = setTimeout(() => this.flush(), this.batchDelay);
      }
    });
  }

  private async flush(): Promise<void> {
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }

    if (this.queue.length === 0) return;

    const batch = this.queue.splice(0, this.batchSize);
    const keys = batch.map((item) => item.key);

    try {
      const results = await this.batchFn(keys);

      batch.forEach((item) => {
        item.resolve(results[item.key]);
      });
    } catch (error) {
      batch.forEach((item) => {
        item.reject(error);
      });
    }

    if (this.queue.length > 0) {
      this.timeout = setTimeout(() => this.flush(), this.batchDelay);
    }
  }
}

/**
 * Virtual scrolling for large lists
 */
export interface VirtualScrollConfig {
  itemHeight: number;
  containerHeight: number;
  items: unknown[];
  bufferSize?: number;
}

export function calculateVisibleRange(
  scrollTop: number,
  config: VirtualScrollConfig
): { start: number; end: number } {
  const { itemHeight, containerHeight, items, bufferSize = 5 } = config;

  const start = Math.max(0, Math.floor(scrollTop / itemHeight) - bufferSize);
  const end = Math.min(items.length, Math.ceil((scrollTop + containerHeight) / itemHeight) + bufferSize);

  return { start, end };
}

/**
 * Monitor Core Web Vitals
 */
export function monitorWebVitals(): void {
  // Largest Contentful Paint (LCP)
  if ("PerformanceObserver" in window) {
    try {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as unknown as { renderTime?: number; loadTime?: number };
        console.log("LCP:", lastEntry.renderTime || lastEntry.loadTime);
      });
      lcpObserver.observe({ entryTypes: ["largest-contentful-paint"] });
    } catch (e) {
      // LCP not supported
    }

    // First Input Delay (FID)
    try {
      const fidObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          const fidEntry = entry as unknown as { processingDuration?: number };
          console.log("FID:", fidEntry.processingDuration);
        });
      });
      fidObserver.observe({ entryTypes: ["first-input"] });
    } catch (e) {
      // FID not supported
    }

    // Cumulative Layout Shift (CLS)
    try {
      const clsObserver = new PerformanceObserver((list) => {
        let clsValue = 0;
        list.getEntries().forEach((entry) => {
          const clsEntry = entry as unknown as { hadRecentInput?: boolean; value?: number };
          if (!clsEntry.hadRecentInput) {
            clsValue += clsEntry.value || 0;
          }
        });
        console.log("CLS:", clsValue);
      });
      clsObserver.observe({ entryTypes: ["layout-shift"] });
    } catch (e) {
      // CLS not supported
    }
  }
}

/**
 * Service Worker registration
 */
export async function registerServiceWorker(): Promise<void> {
  if ("serviceWorker" in navigator) {
    try {
      await navigator.serviceWorker.register("/sw.js");
      console.log("Service Worker registered successfully");
    } catch (error) {
      console.log("Service Worker registration failed:", error);
    }
  }
}
