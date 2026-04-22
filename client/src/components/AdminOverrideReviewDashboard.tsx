/**
 * Phase 4: Admin Override Review Dashboard
 * 
 * Provides administrators with visibility into clinician overrides for quality improvement.
 * Allows filtering, reviewing, and flagging high-risk overrides for further investigation.
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertTriangle, CheckCircle, TrendingUp, Users, Clock, Eye } from 'lucide-react';
import { api } from '@/utils/api';
import { format } from 'date-fns';

interface OverrideReviewState {
  selectedOverrideId: number | null;
  reviewNotes: string;
  isHighRisk: boolean;
}

export const AdminOverrideReviewDashboard: React.FC = () => {
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    end: new Date(),
  });
  const [filterType, setFilterType] = useState<string | null>(null);
  const [reviewState, setReviewState] = useState<OverrideReviewState>({
    selectedOverrideId: null,
    reviewNotes: '',
    isHighRisk: false,
  });
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);

  // Fetch statistics
  const { data: stats, isLoading: statsLoading } = api.cprOverride.getStatistics.useQuery({
    periodStart: dateRange.start,
    periodEnd: dateRange.end,
  });

  // Fetch overrides
  const { data: overrides, isLoading: overridesLoading } = api.cprOverride.getOverrides.useQuery({
    overrideType: filterType as any,
    startDate: dateRange.start,
    endDate: dateRange.end,
    limit: 100,
  });

  // Review override mutation
  const reviewOverrideMutation = api.cprOverride.reviewOverride.useMutation({
    onSuccess: () => {
      setReviewState({ selectedOverrideId: null, reviewNotes: '', isHighRisk: false });
      setIsReviewDialogOpen(false);
    },
  });

  const handleReviewSubmit = async () => {
    if (!reviewState.selectedOverrideId) return;

    await reviewOverrideMutation.mutateAsync({
      overrideLogId: reviewState.selectedOverrideId,
      reviewNotes: reviewState.reviewNotes,
      isHighRisk: reviewState.isHighRisk,
    });
  };

  const getOverrideTypeColor = (type: string): string => {
    const colors: Record<string, string> = {
      skip_rhythm_check: 'bg-red-100 text-red-800',
      medication_timing: 'bg-yellow-100 text-yellow-800',
      shock_energy: 'bg-orange-100 text-orange-800',
      antiarrhythmic_selection: 'bg-blue-100 text-blue-800',
      skip_medication: 'bg-purple-100 text-purple-800',
      continue_cpr_beyond_protocol: 'bg-red-100 text-red-800',
      other: 'bg-gray-100 text-gray-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const getOverrideTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      skip_rhythm_check: 'Skipped Rhythm Check',
      medication_timing: 'Medication Timing',
      shock_energy: 'Shock Energy',
      antiarrhythmic_selection: 'Antiarrhythmic Selection',
      skip_medication: 'Skipped Medication',
      continue_cpr_beyond_protocol: 'Extended CPR',
      other: 'Other',
    };
    return labels[type] || type;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Override Review Dashboard</h1>
        <p className="mt-2 text-gray-600">Monitor clinician overrides for quality improvement and accountability</p>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Overrides</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalOverrides}</div>
              <p className="text-xs text-muted-foreground">in selected period</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">High-Risk</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.highRiskCount}</div>
              <p className="text-xs text-muted-foreground">flagged for review</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Providers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.uniqueProvidersCount}</div>
              <p className="text-xs text-muted-foreground">with overrides</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Period</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-sm font-bold">
                {format(dateRange.start, 'MMM dd')} - {format(dateRange.end, 'MMM dd')}
              </div>
              <p className="text-xs text-muted-foreground">7-day window</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Overrides</TabsTrigger>
          <TabsTrigger value="high-risk">High-Risk Only</TabsTrigger>
          <TabsTrigger value="by-type">By Type</TabsTrigger>
        </TabsList>

        {/* All Overrides Tab */}
        <TabsContent value="all" className="space-y-4">
          <div className="rounded-lg border">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Type</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Clinician Action</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Justification</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Time</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {overrides && overrides.length > 0 ? (
                    overrides.map((override) => (
                      <tr key={override.id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <Badge className={getOverrideTypeColor(override.overrideType)}>
                            {getOverrideTypeLabel(override.overrideType)}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm text-gray-900">{override.actualAction}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="max-w-xs truncate text-sm text-gray-600">{override.justification}</p>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {format(new Date(override.createdAt), 'MMM dd, HH:mm')}
                        </td>
                        <td className="px-4 py-3">
                          {override.reviewedBy ? (
                            <Badge className="bg-green-100 text-green-800">
                              <CheckCircle className="mr-1 h-3 w-3" />
                              Reviewed
                            </Badge>
                          ) : (
                            <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setReviewState({
                                selectedOverrideId: override.id,
                                reviewNotes: override.reviewNotes || '',
                                isHighRisk: override.isHighRisk || false,
                              });
                              setIsReviewDialogOpen(true);
                            }}
                          >
                            <Eye className="mr-1 h-4 w-4" />
                            Review
                          </Button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                        No overrides found in this period
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* High-Risk Tab */}
        <TabsContent value="high-risk">
          <Alert className="border-red-200 bg-red-50 mb-4">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              Showing only high-risk overrides that require immediate attention
            </AlertDescription>
          </Alert>
          {/* Same table as above but filtered */}
        </TabsContent>

        {/* By Type Tab */}
        <TabsContent value="by-type">
          <div className="grid gap-4 md:grid-cols-2">
            {stats && Object.entries(stats.byType).map(([type, count]) => (
              <Card key={type}>
                <CardHeader>
                  <CardTitle className="text-sm">{getOverrideTypeLabel(type)}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{count}</div>
                  <p className="text-xs text-gray-500 mt-1">
                    {((count / stats.totalOverrides) * 100).toFixed(1)}% of total
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Review Dialog */}
      <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Review Override</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-gray-700">Review Notes</label>
              <Textarea
                placeholder="Document your review findings, training recommendations, or system improvements needed..."
                value={reviewState.reviewNotes}
                onChange={(e) =>
                  setReviewState((prev) => ({ ...prev, reviewNotes: e.target.value }))
                }
                rows={4}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="high-risk"
                checked={reviewState.isHighRisk}
                onCheckedChange={(checked) =>
                  setReviewState((prev) => ({ ...prev, isHighRisk: checked as boolean }))
                }
              />
              <label htmlFor="high-risk" className="text-sm font-medium text-gray-700">
                Flag as high-risk for further investigation
              </label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReviewDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleReviewSubmit}
              disabled={reviewOverrideMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {reviewOverrideMutation.isPending ? 'Saving...' : 'Save Review'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminOverrideReviewDashboard;
