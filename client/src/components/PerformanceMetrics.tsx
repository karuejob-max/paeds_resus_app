import React from "react";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader, TrendingUp, Users, Zap, Clock, CheckCircle } from "lucide-react";

interface PerformanceMetricsProps {
  userId?: number;
}

export function PerformanceMetrics({ userId }: PerformanceMetricsProps) {
  const { data: stats, isLoading } = trpc.performance.getProviderStats.useQuery({
    userId,
  });

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center h-32">
          <Loader className="w-6 h-6 animate-spin text-blue-500" />
        </div>
      </Card>
    );
  }

  if (!stats) {
    return (
      <Card className="p-6">
        <p className="text-center text-gray-500">No performance data available yet</p>
      </Card>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return "bg-green-100 text-green-800";
    if (score >= 75) return "bg-blue-100 text-blue-800";
    if (score >= 60) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return "Excellent";
    if (score >= 75) return "Good";
    if (score >= 60) return "Fair";
    return "Needs Improvement";
  };

  return (
    <div className="space-y-6">
      {/* Overall Performance Score */}
      <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Performance Score</h3>
          <Badge className={getScoreColor(Number(stats.performanceScore))}>
            {getScoreLabel(Number(stats.performanceScore))}
          </Badge>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="text-4xl font-bold text-blue-600">
              {Math.round(Number(stats.performanceScore))}
            </div>
            <p className="text-sm text-gray-600 mt-1">out of 100</p>
          </div>

          <div className="w-24 h-24 rounded-full bg-white border-4 border-blue-200 flex items-center justify-center">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {Math.round(Number(stats.performanceScore))}%
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Patients Served */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600">Patients Served</p>
            <Users className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.totalPatientsServed}</p>
          <p className="text-xs text-gray-500 mt-1">Total patients</p>
        </Card>

        {/* Interventions Completed */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600">Interventions</p>
            <Zap className="w-5 h-5 text-yellow-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.totalInterventions}</p>
          <p className="text-xs text-gray-500 mt-1">Total completed</p>
        </Card>

        {/* Success Rate */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600">Success Rate</p>
            <CheckCircle className="w-5 h-5 text-green-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {Math.round(Number(stats.successRate))}%
          </p>
          <p className="text-xs text-gray-500 mt-1">Success rate</p>
        </Card>

        {/* Average Response Time */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600">Avg Response Time</p>
            <Clock className="w-5 h-5 text-purple-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {Math.round(Number(stats.averageResponseTime))}
          </p>
          <p className="text-xs text-gray-500 mt-1">minutes</p>
        </Card>

        {/* Patients Improved */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600">Patients Improved</p>
            <TrendingUp className="w-5 h-5 text-green-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.patientsImproved}</p>
          <p className="text-xs text-gray-500 mt-1">Positive outcomes</p>
        </Card>

        {/* Certifications Completed */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600">Certifications</p>
            <CheckCircle className="w-5 h-5 text-indigo-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.certificationsCompleted}</p>
          <p className="text-xs text-gray-500 mt-1">Completed</p>
        </Card>
      </div>

      {/* Training Hours */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Training Progress</h3>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-600">Training Hours Completed</p>
            <p className="text-2xl font-bold text-blue-600">{stats.trainingHoursCompleted}</p>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-blue-500 to-indigo-600 h-3 rounded-full"
              style={{
                width: `${Math.min((Number(stats.trainingHoursCompleted) / 100) * 100, 100)}%`,
              }}
            />
          </div>

          <p className="text-xs text-gray-500">
            {stats.trainingHoursCompleted} / 100 hours target
          </p>
        </div>
      </Card>

      {/* Performance Breakdown */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Breakdown</h3>

        <div className="space-y-4">
          {/* Patient Care */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-700">Patient Care Quality</p>
              <span className="text-sm font-semibold text-blue-600">
                {Math.round(Number(stats.successRate))}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full"
                style={{ width: `${Number(stats.successRate)}%` }}
              />
            </div>
          </div>

          {/* Efficiency */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-700">Response Efficiency</p>
              <span className="text-sm font-semibold text-green-600">
                {Math.round(100 - Math.min(Number(stats.averageResponseTime) / 10, 100))}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full"
                style={{
                  width: `${Math.max(100 - Math.min(Number(stats.averageResponseTime) / 10, 100), 0)}%`,
                }}
              />
            </div>
          </div>

          {/* Experience */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-700">Experience & Training</p>
              <span className="text-sm font-semibold text-purple-600">
                {Math.round(Math.min((Number(stats.trainingHoursCompleted) / 100) * 100, 100))}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-purple-500 h-2 rounded-full"
                style={{
                  width: `${Math.min((Number(stats.trainingHoursCompleted) / 100) * 100, 100)}%`,
                }}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Last Updated */}
      <div className="text-center text-xs text-gray-500">
        Last updated: {new Date(stats.lastUpdated).toLocaleString()}
      </div>
    </div>
  );
}
