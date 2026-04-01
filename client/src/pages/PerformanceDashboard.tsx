import React, { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { PerformanceMetrics } from "@/components/PerformanceMetrics";
import { ProviderLeaderboard } from "@/components/ProviderLeaderboard";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader, RefreshCw, TrendingUp, AlertCircle } from "lucide-react";

export function PerformanceDashboard() {
  const { user } = useAuth();
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30000); // 30 seconds

  // Fetch provider stats
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = trpc.performance.getProviderStats.useQuery(
    { userId: user?.id },
    { enabled: !!user?.id }
  );

  // Fetch top performers
  const { data: topPerformers, isLoading: topLoading } = trpc.performance.getTopPerformers.useQuery(
    { limit: 5 }
  );

  // Fetch recent events
  const { data: recentEvents, isLoading: eventsLoading, refetch: refetchEvents } = trpc.performance.getRecentEvents.useQuery(
    { userId: user?.id, limit: 10 },
    { enabled: !!user?.id }
  );

  // Auto-refresh logic
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      refetchStats();
      refetchEvents();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, refetchStats, refetchEvents]);

  const handleManualRefresh = () => {
    refetchStats();
    refetchEvents();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Performance Dashboard</h1>
              <p className="text-muted-foreground mt-1">Track your performance metrics and compete on leaderboards</p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleManualRefresh}
                disabled={statsLoading || eventsLoading}
                className="p-2 rounded-lg bg-brand-surface text-brand-orange hover:bg-brand-surface/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <RefreshCw className={`w-5 h-5 ${statsLoading || eventsLoading ? "animate-spin" : ""}`} />
              </button>

              <label className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted hover:bg-muted/80 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="w-4 h-4"
                />
                <span className="text-sm font-medium text-foreground">Auto-refresh</span>
              </label>

              {autoRefresh && (
                <select
                  value={refreshInterval}
                  onChange={(e) => setRefreshInterval(Number(e.target.value))}
                  className="px-3 py-2 rounded-lg bg-muted text-sm font-medium text-foreground border border-border"
                >
                  <option value={10000}>10s</option>
                  <option value={30000}>30s</option>
                  <option value={60000}>1m</option>
                  <option value={300000}>5m</option>
                </select>
              )}
            </div>
          </div>

          {/* Status Indicator */}
          <div className="flex items-center gap-2 text-sm">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-muted-foreground">
              {autoRefresh ? `Refreshing every ${refreshInterval / 1000}s` : "Manual refresh only"}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Your Performance Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-foreground">Your Performance</h2>
            {statsLoading && <Loader className="w-5 h-5 animate-spin text-brand-orange" />}
          </div>

          {statsLoading ? (
            <Card className="p-12">
              <div className="flex items-center justify-center">
                <Loader className="w-6 h-6 animate-spin text-brand-orange" />
              </div>
            </Card>
          ) : (
            <PerformanceMetrics userId={user?.id} />
          )}
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Leaderboards */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-foreground">Leaderboards</h2>
            </div>

            <ProviderLeaderboard initialCategory="performance" limit={10} />
          </div>

          {/* Right Column - Quick Stats and Events */}
          <div className="space-y-6">
            {/* Top Performers Quick View */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Top Performers</h3>

              {topLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader className="w-5 h-5 animate-spin text-brand-orange" />
                </div>
              ) : topPerformers && topPerformers.length > 0 ? (
                <div className="space-y-3">
                  {topPerformers.map((performer: any, index: number) => (
                    <div key={performer.userId} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-yellow-600">#{index + 1}</span>
                        <div>
                          <p className="font-medium text-foreground text-sm">{performer.userName}</p>
                          <p className="text-xs text-muted-foreground">{performer.providerType}</p>
                        </div>
                      </div>
                      <p className="font-bold text-brand-orange">{Math.round(Number(performer.performanceScore))}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-3">No performance data available yet</p>
                  <p className="text-sm text-muted-foreground mb-4">Start using ResusGPS to track your performance metrics</p>
                  <a href="/resus-gps" className="inline-block px-4 py-2 bg-brand-orange text-white rounded-md text-sm hover:opacity-90 transition">
                    Go to ResusGPS
                  </a>
                </div>
              )}
            </Card>

            {/* Recent Events */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Recent Activity</h3>

              {eventsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader className="w-5 h-5 animate-spin text-brand-orange" />
                </div>
              ) : recentEvents && recentEvents.length > 0 ? (
                <div className="space-y-3">
                  {recentEvents.map((event: any) => (
                    <div key={event.id} className="p-3 rounded-lg bg-muted/50 border-l-4 border-brand-orange">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-foreground text-sm">{event.eventType}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(event.createdAt).toLocaleString()}
                          </p>
                        </div>

                        {event.severity && (
                          <Badge
                            className={
                              event.severity === "critical"
                                ? "bg-red-100 text-red-800"
                                : event.severity === "warning"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-green-100 text-green-800"
                            }
                          >
                            {event.severity}
                          </Badge>
                        )}
                      </div>

                      {event.eventData && (
                        <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                          {JSON.stringify(event.eventData).substring(0, 100)}...
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-muted-foreground mb-3">No recent activity yet</p>
                  <p className="text-sm text-muted-foreground mb-4">Log clinical events in Safe-Truth to see your activity here</p>
                  <a href="/safe-truth" className="inline-block px-4 py-2 bg-brand-orange text-white rounded-md text-sm hover:opacity-90 transition">
                    Log event in Safe-Truth
                  </a>
                </div>
              )}
            </Card>

            {/* Performance Tips */}
            <Card className="p-6 bg-brand-surface border-border">
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-brand-orange flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-foreground mb-2">Performance Tips</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Maintain consistent response times to improve efficiency</li>
                    <li>• Complete more interventions to climb the leaderboard</li>
                    <li>• Improve success rate by following best practices</li>
                    <li>• Invest in training to unlock certifications</li>
                  </ul>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
