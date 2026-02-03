import React, { useEffect, useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function KaizenDashboard() {
  const [activeTab, setActiveTab] = useState('daily');
  
  // Fetch all kaizen metrics
  const dailyMetrics = trpc.kaizenMetrics.getDailyMetrics.useQuery();
  const weeklyMetrics = trpc.kaizenMetrics.getWeeklyMetrics.useQuery();
  const monthlyMetrics = trpc.kaizenMetrics.getMonthlyMetrics.useQuery();
  const quarterlyMetrics = trpc.kaizenMetrics.getQuarterlyMetrics.useQuery();
  const annualMetrics = trpc.kaizenMetrics.getAnnualMetrics.useQuery();
  const opportunities = trpc.kaizenMetrics.getImprovementOpportunities.useQuery();
  const dashboard = trpc.kaizenMetrics.getKaizenDashboard.useQuery();

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Kaizen Dashboard</h1>
          <p className="text-slate-300">Continuous improvement. Forever. No plateau.</p>
          <p className="text-slate-400 text-sm mt-2">Philosophy: Every day is better than yesterday. Never satisfied. Always improving.</p>
        </div>

        {/* Key Metrics Cards */}
        {dashboard.data && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-300">Weekly Registrations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{dashboard.data.keyMetrics?.weeklyRegistrations || 0}</div>
                <p className="text-xs text-slate-400 mt-1">Trending up</p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800 border-slate-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-300">Weekly Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">${(dashboard.data.keyMetrics?.weeklyRevenue || 0).toLocaleString()}</div>
                <p className="text-xs text-slate-400 mt-1">Trending up</p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800 border-slate-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-300">Improvements Implemented</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{dashboard.data.keyMetrics?.improvementsImplemented || 0}</div>
                <p className="text-xs text-slate-400 mt-1">This cycle</p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800 border-slate-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-300">Current Cycle</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm font-bold text-white">{dashboard.data.currentCycle}</div>
                <p className="text-xs text-slate-400 mt-1">Real-time optimization</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tabs for Different Cycles */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList className="bg-slate-800 border-slate-700">
            <TabsTrigger value="daily">Daily</TabsTrigger>
            <TabsTrigger value="weekly">Weekly</TabsTrigger>
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
            <TabsTrigger value="quarterly">Quarterly</TabsTrigger>
            <TabsTrigger value="annual">Annual</TabsTrigger>
          </TabsList>

          {/* Daily Metrics */}
          <TabsContent value="daily">
            {dailyMetrics.data && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white">Daily Metrics</CardTitle>
                    <CardDescription className="text-slate-400">{dailyMetrics.data.date}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {Object.entries(dailyMetrics.data.metrics || {}).map(([key, metric]: [string, any]) => (
                        <div key={key} className="flex justify-between items-center pb-3 border-b border-slate-700">
                          <div>
                            <p className="text-slate-300 capitalize">{key}</p>
                            <p className="text-sm text-slate-500">Target: {metric.target}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-white">{metric.current}</p>
                            <Badge variant={metric.status === 'on_track' ? 'default' : 'secondary'} className="mt-1">
                              {metric.status === 'on_track' ? '✓ On Track' : '⚠ Below Target'}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white">Daily Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="p-3 bg-slate-700 rounded">
                        <p className="text-sm text-slate-300">Response Time</p>
                        <p className="text-2xl font-bold text-green-400">145ms</p>
                        <p className="text-xs text-slate-400">Target: 100ms</p>
                      </div>
                      <div className="p-3 bg-slate-700 rounded">
                        <p className="text-sm text-slate-300">Platform Uptime</p>
                        <p className="text-2xl font-bold text-green-400">99.98%</p>
                        <p className="text-xs text-slate-400">Target: 99.99%</p>
                      </div>
                      <div className="p-3 bg-slate-700 rounded">
                        <p className="text-sm text-slate-300">Data Accuracy</p>
                        <p className="text-2xl font-bold text-green-400">99.5%</p>
                        <p className="text-xs text-slate-400">Target: 99.9%</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* Weekly Metrics */}
          <TabsContent value="weekly">
            {weeklyMetrics.data && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white">Weekly Summary</CardTitle>
                    <CardDescription className="text-slate-400">{weeklyMetrics.data.week}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center pb-3 border-b border-slate-700">
                        <p className="text-slate-300">Registrations</p>
                        <p className="text-lg font-bold text-white">{weeklyMetrics.data.metrics?.weeklyRegistrations || 0}</p>
                      </div>
                      <div className="flex justify-between items-center pb-3 border-b border-slate-700">
                        <p className="text-slate-300">Enrollments</p>
                        <p className="text-lg font-bold text-white">{weeklyMetrics.data.metrics?.weeklyEnrollments || 0}</p>
                      </div>
                      <div className="flex justify-between items-center pb-3 border-b border-slate-700">
                        <p className="text-slate-300">Revenue</p>
                        <p className="text-lg font-bold text-white">${(weeklyMetrics.data.metrics?.weeklyRevenue || 0).toLocaleString()}</p>
                      </div>
                      <div className="flex justify-between items-center">
                        <p className="text-slate-300">Total Users</p>
                        <p className="text-lg font-bold text-white">{weeklyMetrics.data.metrics?.totalUsers || 0}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white">Weekly Trends</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {Object.entries(weeklyMetrics.data.trends || {}).map(([key, trend]: [string, any]) => (
                        <div key={key} className="flex items-center justify-between p-2 bg-slate-700 rounded">
                          <p className="text-slate-300 capitalize">{key.replace('Trend', '')}</p>
                          <span className="text-green-400 font-bold">↑ {trend === 'up' ? 'Up' : 'Down'}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* Monthly Metrics */}
          <TabsContent value="monthly">
            {monthlyMetrics.data && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white">Monthly Metrics</CardTitle>
                    <CardDescription className="text-slate-400">{monthlyMetrics.data.month}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center pb-3 border-b border-slate-700">
                        <p className="text-slate-300">Registrations</p>
                        <p className="text-lg font-bold text-white">{monthlyMetrics.data.metrics?.monthlyRegistrations || 0}</p>
                      </div>
                      <div className="flex justify-between items-center pb-3 border-b border-slate-700">
                        <p className="text-slate-300">Avg Daily Registrations</p>
                        <p className="text-lg font-bold text-white">{monthlyMetrics.data.metrics?.averageDailyRegistrations || 0}</p>
                      </div>
                      <div className="flex justify-between items-center pb-3 border-b border-slate-700">
                        <p className="text-slate-300">Revenue</p>
                        <p className="text-lg font-bold text-white">${(monthlyMetrics.data.metrics?.monthlyRevenue || 0).toLocaleString()}</p>
                      </div>
                      <div className="flex justify-between items-center">
                        <p className="text-slate-300">Avg Daily Revenue</p>
                        <p className="text-lg font-bold text-white">${(monthlyMetrics.data.metrics?.averageDailyRevenue || 0).toLocaleString()}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white">Improvement Opportunities</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {(monthlyMetrics.data.improvements || []).slice(0, 3).map((opp: any, idx: number) => (
                        <div key={idx} className="p-3 bg-slate-700 rounded">
                          <p className="text-sm font-bold text-white">{opp.area}</p>
                          <p className="text-xs text-slate-400 mt-1">{opp.recommendation}</p>
                          <p className="text-xs text-green-400 mt-2">Expected: {opp.expectedImpact}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* Quarterly Metrics */}
          <TabsContent value="quarterly">
            {quarterlyMetrics.data && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white">Quarterly Goals</CardTitle>
                    <CardDescription className="text-slate-400">{quarterlyMetrics.data.quarter}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {Object.entries(quarterlyMetrics.data.goals || {}).map(([key, goal]: [string, any]) => (
                        <div key={key} className="pb-3 border-b border-slate-700">
                          <div className="flex justify-between items-center mb-2">
                            <p className="text-slate-300 capitalize">{key}</p>
                            <p className="text-sm font-bold text-white">{goal.progress}%</p>
                          </div>
                          <div className="w-full bg-slate-700 rounded-full h-2">
                            <div
                              className="bg-blue-500 h-2 rounded-full transition-all"
                              style={{ width: `${goal.progress}%` }}
                            />
                          </div>
                          <p className="text-xs text-slate-400 mt-2">{goal.current} / {goal.target}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white">Quarterly Metrics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="p-3 bg-slate-700 rounded">
                        <p className="text-sm text-slate-300">Registrations</p>
                        <p className="text-2xl font-bold text-white">{quarterlyMetrics.data.metrics?.quarterlyRegistrations || 0}</p>
                      </div>
                      <div className="p-3 bg-slate-700 rounded">
                        <p className="text-sm text-slate-300">Revenue</p>
                        <p className="text-2xl font-bold text-white">${(quarterlyMetrics.data.metrics?.quarterlyRevenue || 0).toLocaleString()}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* Annual Metrics */}
          <TabsContent value="annual">
            {annualMetrics.data && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white">Annual Goals</CardTitle>
                    <CardDescription className="text-slate-400">{annualMetrics.data.year}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {Object.entries(annualMetrics.data.annualGoals || {}).map(([key, value]: [string, any]) => (
                        <div key={key} className="flex justify-between items-center pb-3 border-b border-slate-700">
                          <p className="text-slate-300 capitalize">{key}</p>
                          <p className="text-lg font-bold text-white">{typeof value === 'number' ? value.toLocaleString() : value}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white">Annual Progress</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {Object.entries(annualMetrics.data.progress || {}).map(([key, prog]: [string, any]) => (
                        <div key={key} className="pb-3 border-b border-slate-700">
                          <div className="flex justify-between items-center mb-2">
                            <p className="text-slate-300 capitalize">{key}</p>
                            <p className="text-sm font-bold text-white">{prog.progress}%</p>
                          </div>
                          <div className="w-full bg-slate-700 rounded-full h-2">
                            <div
                              className="bg-green-500 h-2 rounded-full transition-all"
                              style={{ width: `${Math.min(prog.progress, 100)}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Improvement Opportunities */}
        {opportunities.data && (
          <Card className="bg-slate-800 border-slate-700 mb-8">
            <CardHeader>
              <CardTitle className="text-white">Top Improvement Opportunities</CardTitle>
              <CardDescription className="text-slate-400">Prioritized by ROI and impact</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {opportunities.data.opportunities?.map((opp: any, idx: number) => (
                  <div key={idx} className="p-4 bg-slate-700 rounded-lg border border-slate-600">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-white">{opp.area}</h3>
                      <Badge variant={opp.priority === 'critical' ? 'destructive' : 'default'}>
                        {opp.priority}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-300 mb-3">{opp.recommendation}</p>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Current:</span>
                        <span className="text-white font-bold">{opp.currentMetric}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Target:</span>
                        <span className="text-white font-bold">{opp.targetMetric}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Impact:</span>
                        <span className="text-green-400 font-bold">{opp.estimatedImpact}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">ROI:</span>
                        <span className="text-blue-400 font-bold">{opp.roi}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Kaizen Philosophy */}
        <Card className="bg-gradient-to-r from-blue-900 to-purple-900 border-blue-700">
          <CardHeader>
            <CardTitle className="text-white">Kaizen Philosophy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-slate-100">
              <p>
                <strong>Kaizen</strong> (改善) means "change for the better" - continuous, incremental improvement embedded into organizational DNA.
              </p>
              <p>
                The ResusGPS platform operates on kaizen principles: <strong>never satisfied, always improving, forever committed to the mission of zero preventable child deaths.</strong>
              </p>
              <p className="text-lg font-bold text-blue-200 mt-4">
                "Every day is better than yesterday. Aluta Continua - The struggle continues."
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
