import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProviderProfileForm } from "@/components/ProviderProfileForm";
import { AlertCircle, CheckCircle2, TrendingUp, Users, Award, DollarSign } from "lucide-react";

export default function ProviderProfile() {
  const { user, loading } = useAuth({ redirectOnUnauthenticated: true });
  const [activeTab, setActiveTab] = useState("profile");

  const profileQuery = trpc.provider.getProfile.useQuery();
  const dashboardQuery = trpc.provider.getDashboard.useQuery();
  const statsQuery = trpc.provider.getProviderStats.useQuery();

  if (loading || profileQuery.isLoading || dashboardQuery.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  const profile = profileQuery.data;
  const dashboard = dashboardQuery.data;
  const stats = statsQuery.data;

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">{user?.name || "Provider Profile"}</h1>
          <p className="text-gray-600 mt-2">Manage your professional profile and view your performance metrics</p>
        </div>

        {/* Profile Completion Status */}
        {profile && (profile.profileCompletionPercentage ?? 0) < 100 && (
          <Card className="mb-6 border-yellow-200 bg-yellow-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-yellow-900">Complete Your Profile</h3>
                  <p className="text-sm text-yellow-800 mt-1">
                    Your profile is {profile.profileCompletionPercentage ?? 0}% complete. Complete your profile to unlock all features.
                  </p>
                  <div className="w-full bg-yellow-200 rounded-full h-2 mt-3">
                    <div
                      className="bg-yellow-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${profile.profileCompletionPercentage ?? 0}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="comparison">Peer Comparison</TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <ProviderProfileForm />
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-6">
            {dashboard && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Lives Saved */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-600">Lives Saved</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-green-600">
                        {dashboard.currentMetrics.livesSavedCount}
                      </span>
                      <span className="text-xs text-gray-500">this month</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Diagnostic Accuracy */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-600">Diagnostic Accuracy</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-blue-600">
                        {Number(dashboard.currentMetrics.diagnosticAccuracy || 0).toFixed(1)}%
                      </span>
                      <span className="text-xs text-gray-500">accuracy</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Decision Speed */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-600">Avg Decision Time</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-purple-600">
                        {dashboard.currentMetrics.avgDecisionTime}
                      </span>
                      <span className="text-xs text-gray-500">seconds</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Earnings */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-600">Earnings</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-orange-600">
                        KES {((dashboard.currentMetrics.earnings ?? 0) / 100).toLocaleString()}
                      </span>
                      <span className="text-xs text-gray-500">this month</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Detailed Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>Monthly Performance Metrics</CardTitle>
                <CardDescription>Your performance this month</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium">Protocol Adherence</span>
                        <span className="text-sm font-semibold">
                          {Number(dashboard?.currentMetrics.protocolAdherence || 0).toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-600 h-2 rounded-full"
                          style={{ width: `${Number(dashboard?.currentMetrics.protocolAdherence || 0)}%` }}
                        ></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium">Patient Survival Rate</span>
                        <span className="text-sm font-semibold">
                          {Number(dashboard?.currentMetrics.patientSurvivalRate || 0).toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${Number(dashboard?.currentMetrics.patientSurvivalRate || 0)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Patients Monitored</span>
                      <span className="text-2xl font-bold">
                        {dashboard?.currentMetrics.patientsMonitoredCount}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Decisions Logged</span>
                      <span className="text-2xl font-bold">
                        {dashboard?.currentMetrics.decisionsLogged}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Courses Completed</span>
                      <span className="text-2xl font-bold">
                        {dashboard?.currentMetrics.coursesCompleted}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Peer Comparison Tab */}
          <TabsContent value="comparison" className="space-y-6">
            {stats && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Diagnostic Accuracy Comparison */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Diagnostic Accuracy</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm">Your Accuracy</span>
                        <span className="font-semibold">{stats.comparison.diagnosticAccuracy.mine}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${Math.min(stats.comparison.diagnosticAccuracy.mine, 100)}%` }}
                        ></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm">Peer Average</span>
                        <span className="font-semibold">{stats.comparison.diagnosticAccuracy.peers}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-gray-400 h-2 rounded-full"
                          style={{ width: `${Math.min(stats.comparison.diagnosticAccuracy.peers, 100)}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="pt-2 border-t">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-green-600" />
                        <span className="text-sm">
                          You're {stats.comparison.diagnosticAccuracy.percentile > 0 ? "above" : "below"} average by{" "}
                          <strong>{Math.abs(stats.comparison.diagnosticAccuracy.percentile)}%</strong>
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Decision Speed Comparison */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Decision Speed</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm">Your Speed</span>
                        <span className="font-semibold">{stats.comparison.decisionSpeed.mine}s</span>
                      </div>
                      <p className="text-xs text-gray-500">Lower is better</p>
                    </div>

                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm">Peer Average</span>
                        <span className="font-semibold">{stats.comparison.decisionSpeed.peers}s</span>
                      </div>
                      <p className="text-xs text-gray-500">Lower is better</p>
                    </div>

                    <div className="pt-2 border-t">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-green-600" />
                        <span className="text-sm">
                          You're {stats.comparison.decisionSpeed.percentile > 0 ? "faster" : "slower"} by{" "}
                          <strong>{Math.abs(stats.comparison.decisionSpeed.percentile)}%</strong>
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Protocol Adherence Comparison */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Protocol Adherence</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm">Your Adherence</span>
                        <span className="font-semibold">{stats.comparison.protocolAdherence.mine}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-600 h-2 rounded-full"
                          style={{ width: `${Math.min(stats.comparison.protocolAdherence.mine, 100)}%` }}
                        ></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm">Peer Average</span>
                        <span className="font-semibold">{stats.comparison.protocolAdherence.peers}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-gray-400 h-2 rounded-full"
                          style={{ width: `${Math.min(stats.comparison.protocolAdherence.peers, 100)}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="pt-2 border-t">
                      <div className="flex items-center gap-2">
                        <Award className="w-4 h-4 text-blue-600" />
                        <span className="text-sm">
                          You're {stats.comparison.protocolAdherence.percentile > 0 ? "above" : "below"} average by{" "}
                          <strong>{Math.abs(stats.comparison.protocolAdherence.percentile)}%</strong>
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Patient Survival Rate Comparison */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Patient Survival Rate</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm">Your Survival Rate</span>
                        <span className="font-semibold">{stats.comparison.patientSurvivalRate.mine}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-red-600 h-2 rounded-full"
                          style={{ width: `${Math.min(stats.comparison.patientSurvivalRate.mine, 100)}%` }}
                        ></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm">Peer Average</span>
                        <span className="font-semibold">{stats.comparison.patientSurvivalRate.peers}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-gray-400 h-2 rounded-full"
                          style={{ width: `${Math.min(stats.comparison.patientSurvivalRate.peers, 100)}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="pt-2 border-t">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                        <span className="text-sm">
                          You're {stats.comparison.patientSurvivalRate.percentile > 0 ? "above" : "below"} average by{" "}
                          <strong>{Math.abs(stats.comparison.patientSurvivalRate.percentile)}%</strong>
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
