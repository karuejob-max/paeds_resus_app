// Guideline Management Dashboard
// Admin interface for monitoring guideline updates and managing protocol revisions

import { useState } from 'react';
import { trpc } from '../lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  FileText,
  RefreshCw,
  AlertTriangle,
  TrendingUp,
} from 'lucide-react';

export default function GuidelineManagement() {
  const [selectedProtocol, setSelectedProtocol] = useState<string | null>(null);

  // Fetch flagged protocols
  const { data: flaggedProtocols, isLoading: loadingProtocols } =
    trpc.guidelines.getFlaggedProtocols.useQuery();

  // Fetch recent guideline changes
  const { data: recentChanges, isLoading: loadingChanges } =
    trpc.guidelines.getRecentChanges.useQuery();

  // Fetch guideline statistics
  const { data: stats } = trpc.guidelines.getStatistics.useQuery();

  // Mutation to mark protocol as reviewed
  const markReviewed = trpc.guidelines.markProtocolReviewed.useMutation({
    onSuccess: () => {
      // Refresh data
      window.location.reload();
    },
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-500';
      case 'high':
        return 'bg-orange-500';
      case 'moderate':
        return 'bg-yellow-500';
      case 'low':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'destructive';
      case 'high':
        return 'default';
      case 'normal':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Guideline Version Control</h1>
        <p className="text-muted-foreground">
          Monitor guideline updates and manage protocol revisions
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Flagged Protocols</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.flaggedCount || 0}</div>
            <p className="text-xs text-muted-foreground">Require review</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Changes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.pendingChanges || 0}</div>
            <p className="text-xs text-muted-foreground">Unimplemented</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Protocols</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.currentCount || 0}</div>
            <p className="text-xs text-muted-foreground">Up to date</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Check</CardTitle>
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.lastCheck || 'Never'}</div>
            <p className="text-xs text-muted-foreground">Guidelines monitored</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="flagged" className="space-y-4">
        <TabsList>
          <TabsTrigger value="flagged">Flagged Protocols</TabsTrigger>
          <TabsTrigger value="changes">Recent Changes</TabsTrigger>
          <TabsTrigger value="guidelines">All Guidelines</TabsTrigger>
        </TabsList>

        {/* Flagged Protocols Tab */}
        <TabsContent value="flagged" className="space-y-4">
          {loadingProtocols ? (
            <div className="text-center py-8">Loading...</div>
          ) : flaggedProtocols && flaggedProtocols.length > 0 ? (
            flaggedProtocols.map((protocol: any) => (
              <Card key={protocol.id} className="border-l-4 border-l-orange-500">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {protocol.protocolName}
                        <Badge variant={getPriorityColor(protocol.priority)}>
                          {protocol.priority}
                        </Badge>
                      </CardTitle>
                      <CardDescription>
                        Protocol ID: {protocol.protocolId} • {protocol.pendingChanges} pending
                        change(s)
                      </CardDescription>
                    </div>
                    <Button
                      size="sm"
                      onClick={() =>
                        markReviewed.mutate({
                          protocolId: protocol.protocolId,
                        })
                      }
                    >
                      Mark Reviewed
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-5 w-5 text-orange-500 mt-0.5" />
                      <div>
                        <p className="font-medium">Flag Reason:</p>
                        <p className="text-sm text-muted-foreground whitespace-pre-line">
                          {protocol.flagReason}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>Last Updated: {new Date(protocol.lastUpdated).toLocaleDateString()}</span>
                      <span>Next Review: {new Date(protocol.nextReviewDue).toLocaleDateString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="py-8 text-center">
                <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <p className="text-lg font-medium">All protocols are up to date</p>
                <p className="text-sm text-muted-foreground">No flagged protocols requiring review</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Recent Changes Tab */}
        <TabsContent value="changes" className="space-y-4">
          {loadingChanges ? (
            <div className="text-center py-8">Loading...</div>
          ) : recentChanges && recentChanges.length > 0 ? (
            recentChanges.map((change: any) => (
              <Card key={change.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {change.guidelineTitle}
                        <Badge className={getSeverityColor(change.severity)}>
                          {change.severity}
                        </Badge>
                      </CardTitle>
                      <CardDescription>
                        {change.organization} • {change.previousVersion} → {change.newVersion}
                      </CardDescription>
                    </div>
                    <Badge variant={change.reviewStatus === 'implemented' ? 'default' : 'outline'}>
                      {change.reviewStatus}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <p className="font-medium mb-1">Change Description:</p>
                      <p className="text-sm text-muted-foreground">{change.changeDescription}</p>
                    </div>
                    <div>
                      <p className="font-medium mb-1">Clinical Impact:</p>
                      <p className="text-sm text-muted-foreground">{change.clinicalImpact}</p>
                    </div>
                    {change.affectedProtocols && change.affectedProtocols.length > 0 && (
                      <div>
                        <p className="font-medium mb-2">Affected Protocols:</p>
                        <div className="flex flex-wrap gap-2">
                          {change.affectedProtocols.map((protocolId: string) => (
                            <Badge key={protocolId} variant="secondary">
                              {protocolId}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="text-sm text-muted-foreground">
                      Detected: {new Date(change.detectedAt).toLocaleString()}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="py-8 text-center">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-lg font-medium">No recent guideline changes</p>
                <p className="text-sm text-muted-foreground">Check back later for updates</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* All Guidelines Tab */}
        <TabsContent value="guidelines" className="space-y-4">
          <Card>
            <CardContent className="py-8 text-center">
              <TrendingUp className="h-12 w-12 text-blue-500 mx-auto mb-4" />
              <p className="text-lg font-medium">Guideline Registry</p>
              <p className="text-sm text-muted-foreground">
                Tracking guidelines from AHA, WHO, ACOG, ERC, ILCOR, AAP
              </p>
              <Button className="mt-4">View All Guidelines</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
