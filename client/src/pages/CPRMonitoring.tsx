/**
 * CPR Session Monitoring Dashboard
 * 
 * Global monitoring dashboard for tracking all cardiac arrest sessions in real-time.
 * Provides session analytics, outcome tracking, and quality metrics.
 */

import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Heart, 
  Activity, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Search,
  Filter,
  Download,
  RefreshCw,
  TrendingUp,
  Users
} from 'lucide-react';

export default function CPRMonitoring() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed' | 'abandoned'>('all');
  const [outcomeFilter, setOutcomeFilter] = useState<'all' | 'ROSC' | 'pCOSCA' | 'mortality' | 'ongoing'>('all');

  // Fetch all CPR sessions with real-time updates
  const { data: sessions, isLoading, refetch } = trpc.cprSession.getAllSessions.useQuery(
    undefined,
    { refetchInterval: 5000 } // Refresh every 5 seconds for real-time monitoring
  );

  // Calculate statistics
  const stats = sessions ? {
    total: sessions.length,
    active: sessions.filter(s => s.status === 'active').length,
    rosc: sessions.filter(s => s.outcome === 'ROSC').length,
    mortality: sessions.filter(s => s.outcome === 'mortality').length,
    avgDuration: sessions.filter(s => s.totalDuration).reduce((acc, s) => acc + (s.totalDuration || 0), 0) / sessions.filter(s => s.totalDuration).length || 0,
  } : { total: 0, active: 0, rosc: 0, mortality: 0, avgDuration: 0 };

  // Filter sessions
  const filteredSessions = sessions?.filter(session => {
    const matchesSearch = searchQuery === '' || 
      session.sessionCode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      session.id.toString().includes(searchQuery);
    const matchesStatus = statusFilter === 'all' || session.status === statusFilter;
    const matchesOutcome = outcomeFilter === 'all' || session.outcome === outcomeFilter;
    return matchesSearch && matchesStatus && matchesOutcome;
  }) || [];

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getOutcomeBadge = (outcome: string | null) => {
    if (!outcome) return <Badge className="bg-gray-600">Unknown</Badge>;
    switch (outcome) {
      case 'ROSC':
        return <Badge className="bg-green-600">ROSC</Badge>;
      case 'pCOSCA':
        return <Badge className="bg-blue-600">pCOSCA</Badge>;
      case 'mortality':
        return <Badge className="bg-red-600">Mortality</Badge>;
      case 'ongoing':
        return <Badge className="bg-yellow-600 animate-pulse">Ongoing</Badge>;
      default:
        return <Badge className="bg-gray-600">{outcome}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-red-600 animate-pulse">Active</Badge>;
      case 'completed':
        return <Badge className="bg-green-600">Completed</Badge>;
      case 'abandoned':
        return <Badge className="bg-gray-600">Abandoned</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading sessions...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold flex items-center gap-3">
              <Heart className="h-8 w-8 text-red-500" />
              CPR Session Monitoring
            </h1>
            <p className="text-gray-400 mt-2">Real-time global cardiac arrest session tracking</p>
          </div>
          <Button
            onClick={() => refetch()}
            variant="outline"
            className="border-gray-700 text-white"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Sessions</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <Activity className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Active Now</p>
                  <p className="text-2xl font-bold text-red-500">{stats.active}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-red-500 animate-pulse" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">ROSC Achieved</p>
                  <p className="text-2xl font-bold text-green-500">{stats.rosc}</p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Mortality</p>
                  <p className="text-2xl font-bold text-red-500">{stats.mortality}</p>
                </div>
                <XCircle className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Avg Duration</p>
                  <p className="text-2xl font-bold">{formatDuration(Math.round(stats.avgDuration))}</p>
                </div>
                <Clock className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search by session code or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-gray-800 border-gray-700 text-white"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-white"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="abandoned">Abandoned</option>
            </select>

            <select
              value={outcomeFilter}
              onChange={(e) => setOutcomeFilter(e.target.value as any)}
              className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-white"
            >
              <option value="all">All Outcomes</option>
              <option value="ROSC">ROSC</option>
              <option value="pCOSCA">pCOSCA</option>
              <option value="mortality">Mortality</option>
              <option value="ongoing">Ongoing</option>
            </select>
          </div>
        </div>
      </div>

      {/* Sessions Table */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">All Sessions ({filteredSessions.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left p-3 text-gray-400 font-semibold">Session ID</th>
                  <th className="text-left p-3 text-gray-400 font-semibold">Code</th>
                  <th className="text-left p-3 text-gray-400 font-semibold">Status</th>
                  <th className="text-left p-3 text-gray-400 font-semibold">Outcome</th>
                  <th className="text-left p-3 text-gray-400 font-semibold">Patient</th>
                  <th className="text-left p-3 text-gray-400 font-semibold">Duration</th>
                  <th className="text-left p-3 text-gray-400 font-semibold">Started</th>
                  <th className="text-left p-3 text-gray-400 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSessions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center p-8 text-gray-400">
                      No sessions found
                    </td>
                  </tr>
                ) : (
                  filteredSessions.map((session) => (
                    <tr key={session.id} className="border-b border-gray-700 hover:bg-gray-750">
                      <td className="p-3 font-mono">#{session.id}</td>
                      <td className="p-3 font-mono font-bold">{session.sessionCode ?? 'N/A'}</td>
                      <td className="p-3">{getStatusBadge(session.status)}</td>
                      <td className="p-3">{getOutcomeBadge(session.outcome)}</td>
                      <td className="p-3">
                        {session.patientWeight ? `${session.patientWeight}kg` : 'N/A'}
                        {session.patientAgeMonths ? ` • ${session.patientAgeMonths}mo` : ''}
                      </td>
                      <td className="p-3">{formatDuration(session.totalDuration)}</td>
                      <td className="p-3 text-sm text-gray-400">
                        {new Date(session.startTime).toLocaleString()}
                      </td>
                      <td className="p-3">
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-gray-600 text-white text-xs"
                          onClick={() => {
                            window.location.href = `/cpr-monitoring/session/${session.id}`;
                          }}
                        >
                          View Details
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
