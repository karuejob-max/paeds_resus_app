/**
 * Admin Notifications Dashboard
 * 
 * Real-time alerts for facility leaders: streak milestones, training gaps, engagement drops.
 * Drives institutional intelligence and Pillar C engagement.
 * 
 * Strategic alignment: Pillar C institutional intelligence through actionable alerts
 */

import { useState, useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertTriangle,
  Flame,
  TrendingDown,
  AlertCircle,
  CheckCircle2,
  Clock,
  Users,
  Activity,
} from 'lucide-react';
import { toast } from 'sonner';

interface NotificationAlert {
  id: string;
  type: 'streak_milestone' | 'training_gap' | 'engagement_drop' | 'critical_gap';
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  staffName?: string;
  condition?: string;
  metadata: Record<string, any>;
  createdAt: Date;
  read: boolean;
}

export function AdminNotificationsDashboard({ institutionId }: { institutionId: number }) {
  const [filter, setFilter] = useState<'all' | 'unread' | 'critical'>('all');
  const [expandedAlert, setExpandedAlert] = useState<string | null>(null);

  // Fetch alerts
  const { data: alertsData, isLoading, refetch } = trpc.adminNotifications.getAlerts.useQuery({
    institutionId,
    limit: 50,
    filter,
  });

  // Fetch facility aggregation
  const { data: facilityData } = trpc.adminNotifications.getFacilityAggregation.useQuery({
    institutionId,
  });

  // Mark as read mutation
  const markAsRead = trpc.adminNotifications.markAsRead.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  // Dismiss alert mutation
  const dismissAlert = trpc.adminNotifications.dismissAlert.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'info':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getSeverityIcon = (severity: string, type: string) => {
    if (type === 'streak_milestone') return <Flame className="w-5 h-5 text-orange-500" />;
    if (type === 'training_gap') return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
    if (type === 'engagement_drop') return <TrendingDown className="w-5 h-5 text-red-500" />;
    if (type === 'critical_gap') return <AlertCircle className="w-5 h-5 text-red-600" />;
    return <CheckCircle2 className="w-5 h-5 text-blue-500" />;
  };

  return (
    <div className="space-y-6">
      {/* Facility Summary */}
      {facilityData && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Sessions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{facilityData.totalSessions}</div>
              <p className="text-xs text-gray-500 mt-1">Last 7 days</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Active Staff</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{facilityData.activeStaff}</div>
              <p className="text-xs text-gray-500 mt-1">Practicing this week</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Avg Sessions/Staff</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{facilityData.avgSessionsPerStaff}</div>
              <p className="text-xs text-gray-500 mt-1">Per person</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Engagement Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">↑ {facilityData.engagementTrend}</div>
              <p className="text-xs text-gray-500 mt-1">Week-over-week</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Alerts Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Real-Time Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={filter} onValueChange={(v) => setFilter(v as any)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">All ({alertsData?.total || 0})</TabsTrigger>
              <TabsTrigger value="unread">Unread ({alertsData?.unreadCount || 0})</TabsTrigger>
              <TabsTrigger value="critical">Critical ({alertsData?.criticalCount || 0})</TabsTrigger>
            </TabsList>

            <TabsContent value={filter} className="mt-4">
              <ScrollArea className="h-[600px] pr-4">
                {isLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-gray-500">Loading alerts...</p>
                  </div>
                ) : alertsData?.alerts && alertsData.alerts.length > 0 ? (
                  <div className="space-y-3">
                    {alertsData.alerts.map((alert: NotificationAlert) => (
                      <div
                        key={alert.id}
                        className={`border rounded-lg p-4 cursor-pointer transition-all ${getSeverityColor(alert.severity)}`}
                        onClick={() => setExpandedAlert(expandedAlert === alert.id ? null : alert.id)}
                      >
                        <div className="flex items-start gap-3">
                          {getSeverityIcon(alert.severity, alert.type)}
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold">{alert.title}</h4>
                              <Badge variant="outline" className="text-xs">
                                {alert.type.replace(/_/g, ' ')}
                              </Badge>
                            </div>
                            <p className="text-sm mt-1">{alert.message}</p>

                            {expandedAlert === alert.id && (
                              <div className="mt-3 pt-3 border-t border-current border-opacity-20">
                                <div className="text-xs space-y-1">
                                  {alert.condition && <p><strong>Condition:</strong> {alert.condition}</p>}
                                  {alert.staffName && <p><strong>Staff:</strong> {alert.staffName}</p>}
                                  <p><strong>Time:</strong> {new Date(alert.createdAt).toLocaleString()}</p>
                                </div>

                                <div className="flex gap-2 mt-3">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      markAsRead.mutate({ alertId: alert.id });
                                    }}
                                  >
                                    Mark Read
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      dismissAlert.mutate({ alertId: alert.id });
                                    }}
                                  >
                                    Dismiss
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-gray-500">No alerts at this time</p>
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Top Performers */}
      {facilityData && facilityData.topPerformers && facilityData.topPerformers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Top Performers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {facilityData.topPerformers.map((performer: any, idx: number) => (
                <div key={performer.userId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="text-lg font-bold text-gray-400">#{idx + 1}</div>
                    <div>
                      <p className="font-semibold">Staff #{performer.userId}</p>
                      <p className="text-sm text-gray-600">{performer.sessions} sessions</p>
                    </div>
                  </div>
                  <Badge variant="secondary">{performer.conditionsMastered} conditions</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
