import { useEffect, useState, useCallback, useRef } from "react";
import { getPerformanceSocket, closePerformanceSocket, PerformanceUpdate } from "@/lib/performanceSocket";

export function usePerformanceSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<PerformanceUpdate | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const socketRef = useRef<any>(null);

  useEffect(() => {
    const socket = getPerformanceSocket();
    socketRef.current = socket;

    // Connect to WebSocket
    socket.connect().catch((err) => {
      console.error("Failed to connect to performance socket:", err);
      setError(err);
    });

    // Listen for connection events
    const unsubscribeConnected = socket.on("connected", () => {
      setIsConnected(true);
      setError(null);
    });

    const unsubscribeDisconnected = socket.on("disconnected", () => {
      setIsConnected(false);
    });

    const unsubscribeError = socket.on("error", (err) => {
      setError(err);
    });

    // Listen for performance updates
    const unsubscribeUpdate = socket.on("stats_update", (data) => {
      setLastUpdate({ ...data, type: "stats_update" });
    });

    const unsubscribeAchievement = socket.on("achievement_unlocked", (data) => {
      setLastUpdate({ ...data, type: "achievement_unlocked" });
    });

    const unsubscribeRankChange = socket.on("rank_change", (data) => {
      setLastUpdate({ ...data, type: "rank_change" });
    });

    const unsubscribeEvent = socket.on("event", (data) => {
      setLastUpdate({ ...data, type: "event" });
    });

    return () => {
      unsubscribeConnected();
      unsubscribeDisconnected();
      unsubscribeError();
      unsubscribeUpdate();
      unsubscribeAchievement();
      unsubscribeRankChange();
      unsubscribeEvent();
    };
  }, []);

  const subscribe = useCallback((userId: number) => {
    const socket = getPerformanceSocket();
    socket.subscribeToUser(userId);
  }, []);

  const unsubscribe = useCallback((userId: number) => {
    const socket = getPerformanceSocket();
    socket.unsubscribeFromUser(userId);
  }, []);

  const requestUpdate = useCallback((userId: number) => {
    const socket = getPerformanceSocket();
    socket.requestUpdate(userId);
  }, []);

  const disconnect = useCallback(() => {
    closePerformanceSocket();
    setIsConnected(false);
  }, []);

  return {
    isConnected,
    lastUpdate,
    error,
    subscribe,
    unsubscribe,
    requestUpdate,
    disconnect,
  };
}
