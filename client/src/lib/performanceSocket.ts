/**
 * WebSocket client for real-time performance updates
 * Handles connection, reconnection, and event streaming
 */

export interface PerformanceUpdate {
  userId: number;
  metric: string;
  value: number;
  timestamp: number;
  type: "stats_update" | "achievement_unlocked" | "rank_change" | "event";
}

export interface PerformanceSocketConfig {
  url: string;
  reconnectAttempts?: number;
  reconnectDelay?: number;
  heartbeatInterval?: number;
}

export class PerformanceSocket {
  private ws: WebSocket | null = null;
  private url: string;
  private reconnectAttempts: number;
  private reconnectDelay: number;
  private heartbeatInterval: number;
  private currentAttempt = 0;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private listeners: Map<string, Set<(data: any) => void>> = new Map();
  private isIntentionallyClosed = false;

  constructor(config: PerformanceSocketConfig) {
    this.url = config.url;
    this.reconnectAttempts = config.reconnectAttempts || 5;
    this.reconnectDelay = config.reconnectDelay || 3000;
    this.heartbeatInterval = config.heartbeatInterval || 30000;
  }

  /**
   * Connect to WebSocket server
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
          console.log("[PerformanceSocket] Connected");
          this.currentAttempt = 0;
          this.startHeartbeat();
          this.emit("connected");
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this.handleMessage(data);
          } catch (error) {
            console.error("[PerformanceSocket] Error parsing message:", error);
          }
        };

        this.ws.onerror = (error) => {
          console.error("[PerformanceSocket] Error:", error);
          this.emit("error", error);
          reject(error);
        };

        this.ws.onclose = () => {
          console.log("[PerformanceSocket] Disconnected");
          this.stopHeartbeat();
          this.emit("disconnected");

          if (!this.isIntentionallyClosed && this.currentAttempt < this.reconnectAttempts) {
            this.attemptReconnect();
          }
        };
      } catch (error) {
        console.error("[PerformanceSocket] Connection error:", error);
        reject(error);
      }
    });
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    this.isIntentionallyClosed = true;
    this.stopHeartbeat();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  /**
   * Subscribe to performance updates
   */
  on(event: string, callback: (data: any) => void): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    // Return unsubscribe function
    return () => {
      const listeners = this.listeners.get(event);
      if (listeners) {
        listeners.delete(callback);
      }
    };
  }

  /**
   * Send message to server
   */
  send(type: string, data: any): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn("[PerformanceSocket] WebSocket not connected");
      return;
    }

    try {
      this.ws.send(JSON.stringify({ type, data, timestamp: Date.now() }));
    } catch (error) {
      console.error("[PerformanceSocket] Error sending message:", error);
    }
  }

  /**
   * Request performance update for specific user
   */
  requestUpdate(userId: number): void {
    this.send("request_update", { userId });
  }

  /**
   * Subscribe to user performance updates
   */
  subscribeToUser(userId: number): void {
    this.send("subscribe", { userId });
  }

  /**
   * Unsubscribe from user performance updates
   */
  unsubscribeFromUser(userId: number): void {
    this.send("unsubscribe", { userId });
  }

  /**
   * Get connection status
   */
  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  // Private methods

  private handleMessage(data: any): void {
    const { type, payload } = data;

    switch (type) {
      case "stats_update":
        this.emit("stats_update", payload);
        break;

      case "achievement_unlocked":
        this.emit("achievement_unlocked", payload);
        break;

      case "rank_change":
        this.emit("rank_change", payload);
        break;

      case "event":
        this.emit("event", payload);
        break;

      case "pong":
        // Heartbeat response
        break;

      default:
        this.emit(type, payload);
    }
  }

  private emit(event: string, data?: any): void {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error(`[PerformanceSocket] Error in listener for '${event}':`, error);
        }
      });
    }
  }

  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      if (this.isConnected()) {
        this.send("ping", {});
      }
    }, this.heartbeatInterval);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private attemptReconnect(): void {
    this.currentAttempt++;
    const delay = this.reconnectDelay * Math.pow(2, this.currentAttempt - 1);

    console.log(
      `[PerformanceSocket] Reconnecting in ${delay}ms (attempt ${this.currentAttempt}/${this.reconnectAttempts})`
    );

    setTimeout(() => {
      this.connect().catch((error) => {
        console.error("[PerformanceSocket] Reconnection failed:", error);
      });
    }, delay);
  }
}

/**
 * Singleton instance for performance socket
 */
let performanceSocket: PerformanceSocket | null = null;

export function getPerformanceSocket(): PerformanceSocket {
  if (!performanceSocket) {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const url = `${protocol}//${window.location.host}/api/performance`;

    performanceSocket = new PerformanceSocket({
      url,
      reconnectAttempts: 5,
      reconnectDelay: 3000,
      heartbeatInterval: 30000,
    });
  }

  return performanceSocket;
}

export function closePerformanceSocket(): void {
  if (performanceSocket) {
    performanceSocket.disconnect();
    performanceSocket = null;
  }
}
