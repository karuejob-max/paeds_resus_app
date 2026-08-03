import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Award, Building2, Users, BarChart3, AlertCircle } from "lucide-react";

export default function AdminCpdAnalytics() {
  const analyticsQuery = trpc.cpd.getPlatformCpdAnalytics.useQuery();

  if (analyticsQuery.isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (analyticsQuery.isError) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <AlertCircle className="mx-auto h-10 w-10 text-amber-500 mb-2" />
        <h2 className="text-lg font-semibold">Admin Access Restricted</h2>
        <p className="text-sm text-muted-foreground mt-1">
          {analyticsQuery.error.message || "Platform admin privileges are required."}
        </p>
      </div>
    );
  }

  const data = analyticsQuery.data;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-600 text-white">
          <BarChart3 className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">National CPD & Learning Radar</h1>
          <p className="text-sm text-muted-foreground">
            Cross-institutional continuous professional development & cadre participation benchmarks
          </p>
        </div>
      </div>

      {/* Global Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-blue-100 bg-gradient-to-br from-blue-50/50 to-white dark:border-blue-900/30">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Platform CPD Sessions</CardTitle>
            <Award className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data?.totalPlatformEvents}</div>
            <p className="text-xs text-muted-foreground mt-1">Conducted across Kenya & Regional hospitals</p>
          </CardContent>
        </Card>

        <Card className="border-emerald-100 bg-gradient-to-br from-emerald-50/50 to-white dark:border-emerald-900/30">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">National Registrations</CardTitle>
            <Users className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data?.totalPlatformAttendees}</div>
            <p className="text-xs text-muted-foreground mt-1">Registered clinician check-ins</p>
          </CardContent>
        </Card>

        <Card className="border-purple-100 bg-gradient-to-br from-purple-50/50 to-white dark:border-purple-900/30">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Partner Hospitals</CardTitle>
            <Building2 className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data?.hospitalLeaderboard.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Active institutional accounts</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Hospital Activity Leaderboard */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Hospital Activity Leaderboard</CardTitle>
            <CardDescription>Hospitals with the highest CPD frequency and turnout</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Hospital</TableHead>
                  <TableHead>CPD Sessions</TableHead>
                  <TableHead className="text-right">Attendees</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.hospitalLeaderboard.map((h) => (
                  <TableRow key={h.id}>
                    <TableCell className="font-medium">{h.name}</TableCell>
                    <TableCell>{h.eventCount} Sessions</TableCell>
                    <TableCell className="text-right">
                      <Badge variant="outline">{h.attendeeCount} Registered</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* National Cadre Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">National Cadre Participation</CardTitle>
            <CardDescription>Breakdown of continuous learning turnout by professional cadre</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cadre</TableHead>
                  <TableHead className="text-right">Total Turnout</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.cadreDistribution.map((c) => (
                  <TableRow key={c.cadre}>
                    <TableCell className="font-medium">{c.cadre}</TableCell>
                    <TableCell className="text-right font-bold">{c.count}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
