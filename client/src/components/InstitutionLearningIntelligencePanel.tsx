import { useMemo, useState, type ReactNode } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Download,
  FileBarChart2,
  Flag,
  GraduationCap,
  Printer,
  UsersRound,
} from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const AUDIENCE_COLORS = ["#2563eb", "#059669", "#7c3aed", "#ea580c", "#0891b2"];
const COURSE_ORDER = ["bls", "acls", "pals", "nrp", "heartsaver", "instructor"];

function statusLabel(status: string) {
  return status
    .replaceAll("_", " ")
    .replace(/\b\w/g, letter => letter.toUpperCase());
}

function statusVariant(
  status: string
): "default" | "secondary" | "outline" | "destructive" {
  if (status === "strong" || status === "met") return "default";
  if (status === "needs_support") return "destructive";
  if (status === "on_track" || status === "in_progress") return "secondary";
  return "outline";
}

export default function InstitutionLearningIntelligencePanel({
  institutionId,
  onOpenReadiness,
}: {
  institutionId: number;
  onOpenReadiness?: () => void;
}) {
  const [periodType, setPeriodType] = useState<
    "monthly" | "quarterly" | "annual"
  >("quarterly");
  const dashboard = trpc.institutionLearning.getDashboard.useQuery(
    { institutionId, periodType },
    { enabled: !!institutionId, staleTime: 30_000 }
  );
  const report = trpc.institutionLearning.getShareableReport.useQuery(
    { institutionId, periodType },
    { enabled: false }
  );
  const data = dashboard.data;
  const courseSummary = useMemo(() => {
    if (!data) return [];
    return COURSE_ORDER.map(programType => {
      const rows = data.courses.filter(
        course => course.programType === programType
      );
      return {
        programType,
        assigned: rows.length,
        cognitive: rows.filter(row => row.cognitiveComplete).length,
        phase2: rows.filter(row => row.phase2Status === "completed").length,
        phase3: rows.filter(row => row.phase3Status === "completed").length,
        completed: rows.filter(row => row.completed).length,
      };
    }).filter(row => row.assigned > 0);
  }, [data]);

  const downloadReport = async () => {
    try {
      const result = await report.refetch();
      if (!result.data?.csv) throw new Error("Report data was not available");
      const blob = new Blob([result.data.csv], {
        type: "text/csv;charset=utf-8",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `paeds-resus-learning-${result.data.period.periodStart}-to-${result.data.period.periodEnd}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success("Learning report downloaded");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Could not prepare the learning report"
      );
    }
  };

  if (dashboard.isLoading) {
    return (
      <Card>
        <CardContent className="py-10 text-sm text-muted-foreground">
          Loading learning intelligence…
        </CardContent>
      </Card>
    );
  }
  if (dashboard.isError || !data) {
    return (
      <Card className="border-amber-200 bg-amber-50/50">
        <CardHeader>
          <CardTitle className="text-base">
            Learning intelligence unavailable
          </CardTitle>
          <CardDescription>
            We could not load this institution’s learning records. No
            performance conclusion should be drawn from a failed data load.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={() => dashboard.refetch()}>
            Try again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-white dark:border-blue-900 dark:from-blue-950/30 dark:to-background">
        <CardHeader className="gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileBarChart2 className="h-5 w-5 text-blue-700" />
              Learning intelligence
            </CardTitle>
            <CardDescription className="mt-1 max-w-3xl">
              See whether learning is reaching the facility, which departments
              need support, who is participating, and how life-support learning
              is progressing. These are administrative signals—not a bedside
              competence or accreditation score.
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <select
              className="h-9 rounded-md border bg-background px-3 text-sm"
              value={periodType}
              onChange={event =>
                setPeriodType(event.target.value as typeof periodType)
              }
              aria-label="Report period"
            >
              <option value="monthly">This month</option>
              <option value="quarterly">This quarter</option>
              <option value="annual">This year</option>
            </select>
            <Button
              variant="outline"
              size="sm"
              onClick={downloadReport}
              disabled={report.isFetching}
            >
              <Download className="mr-2 h-4 w-4" />
              {report.isFetching ? "Preparing…" : "Download CSV"}
            </Button>
            <Button variant="outline" size="sm" onClick={() => window.print()}>
              <Printer className="mr-2 h-4 w-4" />
              Print / share
            </Button>
            {onOpenReadiness && (
              <Button variant="outline" size="sm" onClick={onOpenReadiness}>
                <Flag className="mr-2 h-4 w-4" />
                Readiness report
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <p className="rounded-lg border border-blue-200/70 bg-white/70 p-3 text-sm text-blue-950 dark:border-blue-800 dark:bg-blue-950/20 dark:text-blue-100">
            {data.narrative}
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard
          label="Sessions"
          value={data.summary.totalSessions}
          detail="Recorded in period"
        />
        <MetricCard
          label="Attendance records"
          value={data.summary.totalAttendanceRecords}
          detail={`${data.summary.peopleAttended} people represented`}
        />
        <MetricCard
          label="Roster-seat coverage"
          value={`${data.summary.attendanceRate}%`}
          detail={`${data.summary.expectedAttendanceSeats} expected seats`}
        />
        <MetricCard
          label="Departments"
          value={data.departments.length}
          detail={`${data.departments.filter(row => row.status === "needs_support").length} need support`}
        />
        <MetricCard
          label="Targets met"
          value={`${data.targets.filter(target => target.status === "met").length}/${data.targets.length}`}
          detail="Active learning targets"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Department participation
            </CardTitle>
            <CardDescription>
              Departments with low coverage need a support conversation, not a
              punitive ranking.
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            {data.departments.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data.departments
                    .slice()
                    .sort((a, b) => b.attendanceRate - a.attendanceRate)}
                  layout="vertical"
                  margin={{ left: 12, right: 18, top: 4, bottom: 4 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" domain={[0, 100]} unit="%" />
                  <YAxis
                    dataKey="department"
                    type="category"
                    width={120}
                    tick={{ fontSize: 11 }}
                  />
                  <Tooltip formatter={value => [`${value}%`, "Attendance"]} />
                  <Bar
                    dataKey="attendanceRate"
                    fill="#2563eb"
                    radius={[0, 5, 5, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState text="No department attendance data for this period." />
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              What kind of learning is happening?
            </CardTitle>
            <CardDescription>
              Audience mix for the selected period.
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            {data.summary.sessionsByAudience.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.summary.sessionsByAudience}
                    dataKey="count"
                    nameKey="label"
                    cx="50%"
                    cy="45%"
                    outerRadius={90}
                    innerRadius={48}
                  >
                    {data.summary.sessionsByAudience.map((row, index) => (
                      <Cell
                        key={row.audienceScope}
                        fill={AUDIENCE_COLORS[index % AUDIENCE_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState text="No classified sessions for this period." />
            )}
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="departments">
        <TabsList className="grid h-auto w-full grid-cols-2 gap-1 sm:grid-cols-4">
          <TabsTrigger value="departments">Departments</TabsTrigger>
          <TabsTrigger value="individuals">Individuals</TabsTrigger>
          <TabsTrigger value="courses">Life-support courses</TabsTrigger>
          <TabsTrigger value="targets">Targets</TabsTrigger>
        </TabsList>
        <TabsContent value="departments" className="mt-4">
          <DataTable
            headers={["Department", "Sessions", "Attendance", "Status"]}
          >
            {data.departments.map(row => (
              <tr key={row.departmentId} className="border-b last:border-0">
                <td className="px-3 py-3 font-medium">{row.department}</td>
                <td className="px-3 py-3">{row.sessionsAvailable}</td>
                <td className="px-3 py-3">
                  <div className="flex min-w-32 items-center gap-2">
                    <Progress value={row.attendanceRate} className="h-2" />
                    <span className="text-xs">{row.attendanceRate}%</span>
                  </div>
                </td>
                <td className="px-3 py-3">
                  <Badge variant={statusVariant(row.status)}>
                    {statusLabel(row.status)}
                  </Badge>
                </td>
              </tr>
            ))}
          </DataTable>
        </TabsContent>
        <TabsContent value="individuals" className="mt-4">
          <DataTable
            headers={[
              "Person",
              "Department",
              "Attendance",
              "CNE",
              "Clinical",
              "Status",
            ]}
          >
            {data.individuals.map(row => (
              <tr key={row.staffId} className="border-b last:border-0">
                <td className="px-3 py-3">
                  <div className="font-medium">{row.fullName}</div>
                  <div className="text-xs text-muted-foreground">
                    {row.email}
                  </div>
                </td>
                <td className="px-3 py-3">{row.department}</td>
                <td className="px-3 py-3">
                  {row.attendedSessions}/{row.eligibleSessions} (
                  {row.attendanceRate}%)
                </td>
                <td className="px-3 py-3">{row.cneAttended}</td>
                <td className="px-3 py-3">{row.clinicalAttended}</td>
                <td className="px-3 py-3">
                  <Badge variant={statusVariant(row.status)}>
                    {statusLabel(row.status)}
                  </Badge>
                </td>
              </tr>
            ))}
          </DataTable>
        </TabsContent>
        <TabsContent value="courses" className="mt-4">
          <DataTable
            headers={[
              "Course",
              "Assigned",
              "Cognitive",
              "Phase 2",
              "Phase 3",
              "Complete",
            ]}
          >
            {courseSummary.map(row => (
              <tr key={row.programType} className="border-b last:border-0">
                <td className="px-3 py-3 font-medium">
                  {row.programType.toUpperCase()}
                </td>
                <td className="px-3 py-3">{row.assigned}</td>
                <td className="px-3 py-3">
                  {row.cognitive}/{row.assigned}
                </td>
                <td className="px-3 py-3">
                  {row.phase2}/{row.assigned}
                </td>
                <td className="px-3 py-3">
                  {row.phase3}/{row.assigned}
                </td>
                <td className="px-3 py-3">
                  {row.completed}/{row.assigned}
                </td>
              </tr>
            ))}
          </DataTable>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {data.courses.map(row => (
              <div
                key={`${row.staffId}-${row.programType}`}
                className="rounded-lg border p-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">{row.fullName}</p>
                    <p className="text-xs text-muted-foreground">
                      {row.department} · {row.programType.toUpperCase()}
                    </p>
                  </div>
                  <Badge variant={row.completed ? "default" : "outline"}>
                    {row.stage === "not_started"
                      ? "Not started"
                      : statusLabel(row.stage)}
                  </Badge>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[11px]">
                  <Stage label="Cognitive" done={row.cognitiveComplete} />
                  <Stage
                    label="Phase 2"
                    done={row.phase2Status === "completed"}
                    active={row.phase2Status === "in_progress"}
                  />
                  <Stage
                    label="Phase 3"
                    done={row.phase3Status === "completed"}
                  />
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
        <TabsContent value="targets" className="mt-4">
          <DataTable
            headers={[
              "Scope",
              "Metric",
              "Actual / target",
              "Progress",
              "Status",
            ]}
          >
            {data.targets.map(row => (
              <tr key={row.id} className="border-b last:border-0">
                <td className="px-3 py-3">
                  <div className="font-medium">{row.scopeLabel}</div>
                  <div className="text-xs text-muted-foreground capitalize">
                    {row.scope}
                  </div>
                </td>
                <td className="px-3 py-3">{statusLabel(row.metricKey)}</td>
                <td className="px-3 py-3">
                  {row.actualValue} / {row.targetValue}
                </td>
                <td className="px-3 py-3">
                  <div className="flex min-w-32 items-center gap-2">
                    <Progress value={row.progressPercent} className="h-2" />
                    <span className="text-xs">{row.progressPercent}%</span>
                  </div>
                </td>
                <td className="px-3 py-3">
                  <Badge variant={statusVariant(row.status)}>
                    {statusLabel(row.status)}
                  </Badge>
                </td>
              </tr>
            ))}
          </DataTable>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function MetricCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string | number;
  detail: string;
}) {
  return (
    <Card>
      <CardContent className="pt-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {label}
            </p>
            <p className="mt-2 text-2xl font-semibold tracking-tight">
              {value}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
          </div>
          <UsersRound className="h-5 w-5 text-blue-700" />
        </div>
      </CardContent>
    </Card>
  );
}
function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex h-full items-center justify-center text-center text-sm text-muted-foreground">
      {text}
    </div>
  );
}
function DataTable({
  headers,
  children,
}: {
  headers: string[];
  children: ReactNode;
}) {
  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full min-w-[680px] text-sm">
        <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            {headers.map(header => (
              <th key={header} className="px-3 py-3 font-medium">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}
function Stage({
  label,
  done,
  active,
}: {
  label: string;
  done: boolean;
  active?: boolean;
}) {
  return (
    <div
      className={`rounded-md border p-2 ${done ? "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200" : active ? "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200" : "text-muted-foreground"}`}
    >
      <GraduationCap className="mx-auto mb-1 h-3.5 w-3.5" />
      <span>{label}</span>
      <div className="mt-1 font-medium">
        {done ? "Done" : active ? "In progress" : "Pending"}
      </div>
    </div>
  );
}
