import { useState } from "react";
import { useScrollToTop } from "@/hooks/useScrollToTop";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Code,
  Download,
  Star,
  Users,
  TrendingUp,
  Lock,
  Zap,
  BookOpen,
  Github,
  Copy,
  ExternalLink,
} from "lucide-react";

export default function APIMarketplace() {
  const [selectedAPI, setSelectedAPI] = useState<number | null>(null);

  const apis = [
    {
      id: 1,
      name: "Learning Analytics API",
      description: "Real-time learner progress, engagement metrics, and predictive analytics",
      category: "Analytics",
      rating: 4.9,
      reviews: 234,
      downloads: 1200,
      price: "Free - $500/mo",
      endpoints: 15,
      status: "production",
      docs: "/docs/learning-analytics",
    },
    {
      id: 2,
      name: "Certification API",
      description: "Issue, verify, and manage digital certificates and credentials",
      category: "Credentials",
      rating: 4.8,
      reviews: 189,
      downloads: 890,
      price: "Free - $300/mo",
      endpoints: 12,
      status: "production",
      docs: "/docs/certification",
    },
    {
      id: 3,
      name: "Enrollment API",
      description: "Bulk enrollment, user provisioning, and team management",
      category: "Users",
      rating: 4.7,
      reviews: 156,
      downloads: 756,
      price: "Free - $400/mo",
      endpoints: 18,
      status: "production",
      docs: "/docs/enrollment",
    },
    {
      id: 4,
      name: "Content Management API",
      description: "Create, update, and manage courses, lessons, and assessments",
      category: "Content",
      rating: 4.6,
      reviews: 123,
      downloads: 645,
      price: "Free - $600/mo",
      endpoints: 22,
      status: "production",
      docs: "/docs/content",
    },
    {
      id: 5,
      name: "Reporting & Export API",
      description: "Generate custom reports, export data, and compliance documentation",
      category: "Reporting",
      rating: 4.8,
      reviews: 178,
      downloads: 834,
      price: "Free - $350/mo",
      endpoints: 14,
      status: "production",
      docs: "/docs/reporting",
    },
    {
      id: 6,
      name: "Payment Integration API",
      description: "Process payments, manage subscriptions, and handle billing",
      category: "Payments",
      rating: 4.9,
      reviews: 201,
      downloads: 1050,
      price: "Free - $800/mo",
      endpoints: 16,
      status: "production",
      docs: "/docs/payments",
    },
  ];

  const integrations = [
    {
      name: "Salesforce",
      category: "CRM",
      status: "available",
      description: "Sync learner data and manage institutional relationships",
    },
    {
      name: "Slack",
      category: "Communication",
      status: "available",
      description: "Send notifications and updates to your Slack workspace",
    },
    {
      name: "Google Workspace",
      category: "Productivity",
      status: "available",
      description: "Integrate with Gmail, Calendar, and Google Drive",
    },
    {
      name: "Zapier",
      category: "Automation",
      status: "available",
      description: "Connect to 5000+ apps with Zapier",
    },
    {
      name: "Power BI",
      category: "Analytics",
      status: "coming",
      description: "Advanced analytics and business intelligence",
    },
    {
      name: "Tableau",
      category: "Analytics",
      status: "coming",
      description: "Create interactive dashboards and visualizations",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Hero */}
      <section className="bg-gradient-to-r from-blue-900 to-blue-800 text-white py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <Code className="w-12 h-12" />
            <h1 className="text-4xl font-bold">API Marketplace</h1>
          </div>
          <p className="text-xl text-blue-100 max-w-2xl">
            Build powerful integrations with our comprehensive API ecosystem. Connect, extend, and scale your platform.
          </p>
          <div className="mt-8 flex gap-4">
            <Button className="bg-white text-blue-900 hover:bg-blue-50">
              <BookOpen className="w-4 h-4 mr-2" />
              View Documentation
            </Button>
            <Button variant="outline" className="text-white border-white hover:bg-blue-700">
              <Github className="w-4 h-4 mr-2" />
              View on GitHub
            </Button>
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 py-12">
        <Tabs defaultValue="apis" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="apis">APIs ({apis.length})</TabsTrigger>
            <TabsTrigger value="integrations">Integrations ({integrations.length})</TabsTrigger>
            <TabsTrigger value="sdks">SDKs & Libraries</TabsTrigger>
          </TabsList>

          {/* APIs Tab */}
          <TabsContent value="apis" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {apis.map((api) => (
                <Card
                  key={api.id}
                  className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => setSelectedAPI(api.id)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{api.name}</CardTitle>
                        <Badge className="mt-2" variant="secondary">
                          {api.category}
                        </Badge>
                      </div>
                      <Badge className="bg-green-100 text-green-800">{api.status}</Badge>
                    </div>
                    <CardDescription>{api.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-semibold">{api.rating}</span>
                        <span className="text-slate-600">({api.reviews} reviews)</span>
                      </div>
                      <span className="text-slate-600">{api.downloads} downloads</span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg">
                      <div>
                        <p className="text-xs text-slate-600">Pricing</p>
                        <p className="font-semibold text-slate-900">{api.price}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-600">Endpoints</p>
                        <p className="font-semibold text-slate-900">{api.endpoints}</p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button className="flex-1" size="sm">
                        <Zap className="w-4 h-4 mr-2" />
                        Get Started
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1">
                        <BookOpen className="w-4 h-4 mr-2" />
                        Docs
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Integrations Tab */}
          <TabsContent value="integrations" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {integrations.map((integration) => (
                <Card key={integration.name}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-slate-900">{integration.name}</h3>
                        <p className="text-sm text-slate-600">{integration.category}</p>
                      </div>
                      <Badge
                        variant={integration.status === "available" ? "default" : "secondary"}
                      >
                        {integration.status === "available" ? "Available" : "Coming Soon"}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-600 mb-4">{integration.description}</p>
                    <Button
                      className="w-full"
                      disabled={integration.status !== "available"}
                    >
                      {integration.status === "available" ? "Install" : "Notify Me"}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* SDKs Tab */}
          <TabsContent value="sdks" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {[
                { lang: "JavaScript/TypeScript", repo: "paeds-resus-js" },
                { lang: "Python", repo: "paeds-resus-python" },
                { lang: "Go", repo: "paeds-resus-go" },
                { lang: "Java", repo: "paeds-resus-java" },
              ].map((sdk) => (
                <Card key={sdk.lang}>
                  <CardHeader>
                    <CardTitle className="text-lg">{sdk.lang}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-slate-900 text-slate-100 p-4 rounded-lg font-mono text-sm">
                      npm install @paeds-resus/{sdk.repo}
                    </div>
                    <div className="flex gap-2">
                      <Button className="flex-1" size="sm">
                        <Download className="w-4 h-4 mr-2" />
                        Install
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        GitHub
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Code Example */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Start Example</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-slate-900 text-slate-100 p-6 rounded-lg font-mono text-sm overflow-x-auto">
                  <pre>{`import { PaedsResus } from '@paeds-resus/js';

const client = new PaedsResus({
  apiKey: 'sk_live_xxxxxxxxxxxxx'
});

// Get learner analytics
const analytics = await client.analytics.getLearner({
  learnerId: 'learner_123'
});

// Issue certificate
const cert = await client.certificates.issue({
  learnerId: 'learner_123',
  courseId: 'bls_101',
  issueDate: new Date()
});`}</pre>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Developer Stats */}
        <div className="mt-12 grid md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-bold text-blue-600">2,450+</p>
              <p className="text-slate-600 mt-2">Active Developers</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-bold text-green-600">8,900+</p>
              <p className="text-slate-600 mt-2">API Calls/Day</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-bold text-purple-600">99.99%</p>
              <p className="text-slate-600 mt-2">Uptime SLA</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-bold text-orange-600">$2.5M+</p>
              <p className="text-slate-600 mt-2">Developer Earnings</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
