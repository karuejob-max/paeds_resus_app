import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useScrollToTop } from "@/hooks/useScrollToTop";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
} from "recharts";
import {
  TrendingUp,
  Brain,
  Target,
  AlertCircle,
  CheckCircle2,
  Zap,
  Download,
  Share2,
} from "lucide-react";

export default function AnalyticsIntelligence() {
  const predictiveData = [
    { week: "Week 1", predicted: 65, actual: 62 },
    { week: "Week 2", predicted: 72, actual: 70 },
    { week: "Week 3", predicted: 78, actual: 81 },
    { week: "Week 4", predicted: 85, actual: 83 },
    { week: "Week 5", predicted: 88, actual: 92 },
    { week: "Week 6", predicted: 92, actual: 95 },
  ];

  const learnerSegments = [
    { segment: "High Performers", count: 145, avgScore: 92, retention: 98 },
    { segment: "On Track", count: 234, avgScore: 78, retention: 85 },
    { segment: "At Risk", count: 58, avgScore: 62, retention: 45 },
    { segment: "Struggling", count: 23, avgScore: 45, retention: 20 },
  ];

  const recommendations = [
    {
      type: "intervention",
      title: "Early Intervention Needed",
      description: "23 learners showing signs of struggle. Recommend personalized coaching.",
      priority: "high",
      impact: "Potential 40% improvement",
    },
    {
      type: "opportunity",
      title: "Advanced Track Candidates",
      description: "145 high performers ready for advanced certification programs.",
      priority: "medium",
      impact: "KES 5.2M revenue opportunity",
    },
    {
      type: "insight",
      title: "Optimal Learning Time",
      description: "Data shows 78% higher completion when courses taken 2-4 PM.",
      priority: "low",
      impact: "Schedule optimization",
    },
  ];

  const benchmarks = [
    { metric: "Completion Rate", your: 86, industry: 72, target: 90 },
    { metric: "Satisfaction Score", your: 4.7, industry: 4.2, target: 4.8 },
    { metric: "Time to Certification", your: 18, industry: 24, target: 14 },
    { metric: "Retention Rate", your: 82, industry: 65, target: 90 },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Hero */}
      <section className="bg-gradient-to-r from-cyan-900 to-blue-900 text-white py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <Brain className="w-12 h-12" />
            <h1 className="text-4xl font-bold">Analytics Intelligence</h1>
          </div>
          <p className="text-xl text-cyan-100 max-w-2xl">
            AI-powered insights to predict outcomes, identify at-risk learners, and optimize learning paths.
          </p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 py-12">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="predictions">Predictions</TabsTrigger>
            <TabsTrigger value="segments">Segments</TabsTrigger>
            <TabsTrigger value="benchmarks">Benchmarks</TabsTrigger>
            <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-600">Predicted Completion</p>
                      <p className="text-3xl font-bold text-slate-900">92%</p>
                      <p className="text-xs text-green-600 mt-1">↑ 6% from last month</p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-600">At-Risk Learners</p>
                      <p className="text-3xl font-bold text-slate-900">23</p>
                      <p className="text-xs text-orange-600 mt-1">Needs intervention</p>
                    </div>
                    <AlertCircle className="w-8 h-8 text-orange-500" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-600">Avg Learning Time</p>
                      <p className="text-3xl font-bold text-slate-900">18 hrs</p>
                      <p className="text-xs text-blue-600 mt-1">To certification</p>
                    </div>
                    <Zap className="w-8 h-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-600">Accuracy Score</p>
                      <p className="text-3xl font-bold text-slate-900">94%</p>
                      <p className="text-xs text-purple-600 mt-1">Model confidence</p>
                    </div>
                    <CheckCircle2 className="w-8 h-8 text-purple-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Key Insights */}
            <Card>
              <CardHeader>
                <CardTitle>Key Insights</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-4">
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-green-900">Strong Cohort Performance</p>
                    <p className="text-sm text-green-700">Current cohort trending 14% above historical average</p>
                  </div>
                </div>
                <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg flex items-start gap-4">
                  <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-orange-900">Intervention Opportunity</p>
                    <p className="text-sm text-orange-700">23 learners identified for early intervention. Estimated 40% improvement with coaching.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Predictions Tab */}
          <TabsContent value="predictions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Completion Rate Prediction</CardTitle>
                <CardDescription>AI-predicted vs actual completion rates</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={predictiveData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="week" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="predicted" stroke="#3b82f6" strokeDasharray="5 5" name="AI Prediction" />
                    <Line type="monotone" dataKey="actual" stroke="#10b981" name="Actual" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Predictive Models</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { name: "Completion Predictor", accuracy: 94, status: "production" },
                  { name: "Dropout Risk Model", accuracy: 91, status: "production" },
                  { name: "Learning Path Optimizer", accuracy: 88, status: "beta" },
                  { name: "Skill Gap Analyzer", accuracy: 89, status: "production" },
                ].map((model) => (
                  <div key={model.name} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-semibold text-slate-900">{model.name}</p>
                      <Badge variant={model.status === "production" ? "default" : "secondary"}>
                        {model.status}
                      </Badge>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${model.accuracy}%` }}
                      />
                    </div>
                    <p className="text-sm text-slate-600 mt-2">{model.accuracy}% accuracy</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Segments Tab */}
          <TabsContent value="segments" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Learner Segmentation</CardTitle>
                <CardDescription>AI-identified learner segments</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {learnerSegments.map((segment) => (
                    <div key={segment.segment} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <p className="font-bold text-slate-900">{segment.segment}</p>
                          <p className="text-sm text-slate-600">{segment.count} learners</p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-slate-900">{segment.count}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-slate-600">Avg Score</p>
                          <p className="font-semibold text-slate-900">{segment.avgScore}%</p>
                        </div>
                        <div>
                          <p className="text-slate-600">Retention</p>
                          <p className="font-semibold text-slate-900">{segment.retention}%</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Benchmarks Tab */}
          <TabsContent value="benchmarks" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance Benchmarks</CardTitle>
                <CardDescription>Your performance vs industry standards</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart
                    data={benchmarks}
                    layout="vertical"
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="metric" type="category" width={150} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="your" fill="#3b82f6" name="Your Performance" />
                    <Bar dataKey="industry" fill="#9ca3af" name="Industry Average" />
                    <Bar dataKey="target" fill="#10b981" name="Target" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Recommendations Tab */}
          <TabsContent value="recommendations" className="space-y-6">
            <div className="space-y-4">
              {recommendations.map((rec, index) => (
                <Card key={index}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="font-bold text-slate-900">{rec.title}</h3>
                        <p className="text-sm text-slate-600 mt-1">{rec.description}</p>
                      </div>
                      <Badge
                        variant={
                          rec.priority === "high"
                            ? "destructive"
                            : rec.priority === "medium"
                            ? "secondary"
                            : "outline"
                        }
                      >
                        {rec.priority}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t">
                      <span className="text-sm text-slate-600">Impact: {rec.impact}</span>
                      <Button size="sm" variant="outline">
                        Take Action
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Export & Share */}
            <Card>
              <CardHeader>
                <CardTitle>Export & Share</CardTitle>
              </CardHeader>
              <CardContent className="flex gap-4">
                <Button className="flex-1">
                  <Download className="w-4 h-4 mr-2" />
                  Download Report
                </Button>
                <Button variant="outline" className="flex-1">
                  <Share2 className="w-4 h-4 mr-2" />
                  Share Insights
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Pricing */}
        <Card className="mt-12 bg-gradient-to-r from-cyan-50 to-blue-50 border-cyan-200">
          <CardContent className="pt-8">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-slate-900 mb-4">Unlock Intelligence</h3>
              <p className="text-slate-600 mb-6 max-w-2xl mx-auto">
                Advanced analytics and AI-powered insights available on Professional and Enterprise plans.
              </p>
              <Button size="lg" className="bg-cyan-600 hover:bg-cyan-700">
                Upgrade to Analytics
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
