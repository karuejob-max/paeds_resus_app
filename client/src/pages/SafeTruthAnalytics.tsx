import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart3,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Users,
  Calendar,
  Download,
  Filter,
  Search,
} from "lucide-react";

interface Incident {
  id: string;
  date: Date;
  facility: string;
  eventType: string;
  outcome: "survived" | "neurologically_intact" | "poor_outcome";
  gapCategory: string;
  description: string;
  recommendations: string[];
}

export default function SafeTruthAnalytics() {
  const [selectedFacility, setSelectedFacility] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState("30days");
  const [activeTab, setActiveTab] = useState("overview");

  // Mock incident data
  const incidents: Incident[] = [
    {
      id: "1",
      date: new Date("2026-01-20"),
      facility: "Kenyatta National Hospital",
      eventType: "Cardiac Arrest",
      outcome: "neurologically_intact",
      gapCategory: "Knowledge",
      description: "Delayed recognition of cardiac arrest in pediatric patient",
      recommendations: [
        "Implement pediatric vital signs recognition training",
        "Create visual guides for normal vs abnormal vitals",
      ],
    },
    {
      id: "2",
      date: new Date("2026-01-18"),
      facility: "Nairobi Hospital",
      eventType: "Respiratory Failure",
      outcome: "survived",
      gapCategory: "Resources",
      description: "Limited oxygen supply during resuscitation",
      recommendations: [
        "Increase oxygen cylinder inventory",
        "Implement daily equipment checks",
        "Train staff on oxygen conservation",
      ],
    },
    {
      id: "3",
      date: new Date("2026-01-15"),
      facility: "Aga Khan Hospital",
      eventType: "Sepsis",
      outcome: "neurologically_intact",
      gapCategory: "Communication",
      description: "Delayed communication between departments",
      recommendations: [
        "Establish rapid escalation protocols",
        "Implement inter-departmental communication drills",
      ],
    },
  ];

  const stats = {
    totalIncidents: 47,
    neurointactSurvival: 85,
    facilitiesReporting: 12,
    gapsClosed: 23,
    avgResponseTime: 4.2,
  };

  const gapAnalysis = [
    { category: "Knowledge", count: 18, percentage: 38 },
    { category: "Resources", count: 12, percentage: 26 },
    { category: "Communication", count: 10, percentage: 21 },
    { category: "Leadership", count: 7, percentage: 15 },
  ];

  const outcomeDistribution = [
    { label: "Neurologically Intact", count: 40, color: "bg-green-500" },
    { label: "Survived", count: 5, color: "bg-blue-500" },
    { label: "Poor Outcome", count: 2, color: "bg-red-500" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Safe-Truth Analytics</h1>
          <p className="text-lg text-slate-600">
            Incident analysis and system gap identification for continuous improvement
          </p>
        </div>

        {/* KPI Cards */}
        <div className="grid md:grid-cols-5 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Total Incidents</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-blue-600">{stats.totalIncidents}</p>
              <p className="text-xs text-slate-500 mt-1">Last 30 days</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Neurointact Survival</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-600">{stats.neurointactSurvival}%</p>
              <p className="text-xs text-slate-500 mt-1">Success rate</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Facilities</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-purple-600">{stats.facilitiesReporting}</p>
              <p className="text-xs text-slate-500 mt-1">Reporting</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Gaps Closed</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-orange-600">{stats.gapsClosed}</p>
              <p className="text-xs text-slate-500 mt-1">Improvements</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Avg Response</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-teal-600">{stats.avgResponseTime}m</p>
              <p className="text-xs text-slate-500 mt-1">Minutes</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="gaps">Gap Analysis</TabsTrigger>
            <TabsTrigger value="incidents">Incidents</TabsTrigger>
            <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Outcome Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {outcomeDistribution.map((outcome) => (
                    <div key={outcome.label}>
                      <div className="flex justify-between mb-2">
                        <span className="font-medium text-sm">{outcome.label}</span>
                        <span className="text-sm font-bold">
                          {outcome.count} ({Math.round((outcome.count / stats.totalIncidents) * 100)}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div
                          className={`${outcome.color} h-2 rounded-full`}
                          style={{ width: `${(outcome.count / stats.totalIncidents) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Incident Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 bg-slate-100 rounded-lg flex items-center justify-center">
                  <p className="text-slate-600">Chart visualization (integrate with chart library)</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Gap Analysis Tab */}
          <TabsContent value="gaps" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>System Gaps by Category</CardTitle>
                <CardDescription>Breakdown of identified system gaps</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {gapAnalysis.map((gap) => (
                  <div key={gap.category}>
                    <div className="flex justify-between mb-2">
                      <span className="font-medium">{gap.category}</span>
                      <span className="text-sm font-bold">{gap.count} gaps ({gap.percentage}%)</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-3">
                      <div
                        className="bg-blue-600 h-3 rounded-full"
                        style={{ width: `${gap.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Gap Categories Explained</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-l-4 border-blue-500 pl-4">
                  <p className="font-medium">Knowledge Gaps</p>
                  <p className="text-sm text-slate-600">
                    Staff lack understanding or training in specific clinical areas
                  </p>
                </div>
                <div className="border-l-4 border-orange-500 pl-4">
                  <p className="font-medium">Resource Gaps</p>
                  <p className="text-sm text-slate-600">
                    Inadequate equipment, medications, or infrastructure
                  </p>
                </div>
                <div className="border-l-4 border-purple-500 pl-4">
                  <p className="font-medium">Communication Gaps</p>
                  <p className="text-sm text-slate-600">
                    Poor information flow between departments or team members
                  </p>
                </div>
                <div className="border-l-4 border-green-500 pl-4">
                  <p className="font-medium">Leadership Gaps</p>
                  <p className="text-sm text-slate-600">
                    Lack of clear protocols, policies, or organizational support
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Incidents Tab */}
          <TabsContent value="incidents" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Incidents</CardTitle>
                <CardDescription>Confidential incident reports and analysis</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {incidents.map((incident) => (
                    <div
                      key={incident.id}
                      className="border rounded-lg p-4 hover:bg-slate-50 transition"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-slate-900">{incident.eventType}</h4>
                          <p className="text-sm text-slate-600">{incident.facility}</p>
                        </div>
                        <Badge
                          className={
                            incident.outcome === "neurologically_intact"
                              ? "bg-green-100 text-green-700"
                              : incident.outcome === "survived"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-red-100 text-red-700"
                          }
                        >
                          {incident.outcome.replace(/_/g, " ").toUpperCase()}
                        </Badge>
                      </div>

                      <p className="text-sm text-slate-700 mb-3">{incident.description}</p>

                      <div className="flex items-center gap-4 text-xs text-slate-600 mb-3">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {incident.date.toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          Gap: {incident.gapCategory}
                        </span>
                      </div>

                      <div>
                        <p className="text-xs font-semibold text-slate-700 mb-2">Recommendations:</p>
                        <ul className="text-xs text-slate-600 space-y-1">
                          {incident.recommendations.map((rec, idx) => (
                            <li key={idx} className="flex gap-2">
                              <CheckCircle2 className="w-3 h-3 text-green-600 flex-shrink-0 mt-0.5" />
                              {rec}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Recommendations Tab */}
          <TabsContent value="recommendations" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Actionable Recommendations</CardTitle>
                <CardDescription>System improvements based on incident analysis</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  {
                    title: "Implement Pediatric Vital Signs Training",
                    impact: "High",
                    timeline: "2 weeks",
                    status: "In Progress",
                  },
                  {
                    title: "Increase Oxygen Cylinder Inventory",
                    impact: "High",
                    timeline: "1 week",
                    status: "Completed",
                  },
                  {
                    title: "Establish Rapid Escalation Protocols",
                    impact: "Medium",
                    timeline: "3 weeks",
                    status: "Planned",
                  },
                  {
                    title: "Create Visual Vital Signs Guides",
                    impact: "Medium",
                    timeline: "2 weeks",
                    status: "In Progress",
                  },
                ].map((rec, idx) => (
                  <div key={idx} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-slate-900">{rec.title}</h4>
                      <Badge
                        variant="outline"
                        className={
                          rec.status === "Completed"
                            ? "bg-green-50 text-green-700"
                            : rec.status === "In Progress"
                            ? "bg-blue-50 text-blue-700"
                            : "bg-slate-50 text-slate-700"
                        }
                      >
                        {rec.status}
                      </Badge>
                    </div>
                    <div className="flex gap-4 text-sm text-slate-600">
                      <span>Impact: {rec.impact}</span>
                      <span>Timeline: {rec.timeline}</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Export Report</CardTitle>
              </CardHeader>
              <CardContent>
                <Button className="w-full gap-2 bg-teal-600 hover:bg-teal-700">
                  <Download className="w-4 h-4" />
                  Download Compliance Report
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
