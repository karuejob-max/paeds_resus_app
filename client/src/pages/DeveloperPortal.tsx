import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Code, Copy, ExternalLink, BookOpen, Zap, Shield, BarChart3 } from "lucide-react";

const DeveloperPortal: React.FC = () => {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copyToClipboard = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const apiEndpoints = [
    {
      name: "Authentication",
      description: "OAuth2 and JWT token management",
      endpoints: [
        { method: "POST", path: "/api/auth/login", description: "User login" },
        { method: "POST", path: "/api/auth/logout", description: "User logout" },
        { method: "GET", path: "/api/auth/me", description: "Get current user" },
      ],
    },
    {
      name: "Enrollment",
      description: "Manage user enrollments and registrations",
      endpoints: [
        { method: "POST", path: "/api/enrollment/create", description: "Create enrollment" },
        { method: "GET", path: "/api/enrollment/:id", description: "Get enrollment details" },
        { method: "PUT", path: "/api/enrollment/:id", description: "Update enrollment" },
      ],
    },
    {
      name: "Courses",
      description: "Course management and content delivery",
      endpoints: [
        { method: "GET", path: "/api/courses", description: "List all courses" },
        { method: "GET", path: "/api/courses/:id", description: "Get course details" },
        { method: "POST", path: "/api/courses", description: "Create course" },
      ],
    },
    {
      name: "Analytics",
      description: "Real-time analytics and reporting",
      endpoints: [
        { method: "GET", path: "/api/analytics/dashboard", description: "Get dashboard data" },
        { method: "GET", path: "/api/analytics/metrics", description: "Get metrics" },
        { method: "POST", path: "/api/analytics/events", description: "Track event" },
      ],
    },
  ];

  const codeExamples = [
    {
      id: "auth-example",
      language: "JavaScript",
      title: "Authentication Example",
      code: `const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'password123'
  })
});
const data = await response.json();
console.log('Token:', data.token);`,
    },
    {
      id: "enroll-example",
      language: "JavaScript",
      title: "Create Enrollment Example",
      code: `const response = await fetch('/api/enrollment/create', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_TOKEN'
  },
  body: JSON.stringify({
    courseId: 'course-123',
    userType: 'healthcare-provider',
    paymentMethod: 'mpesa'
  })
});
const enrollment = await response.json();
console.log('Enrollment created:', enrollment.id);`,
    },
    {
      id: "analytics-example",
      language: "JavaScript",
      title: "Track Analytics Event",
      code: `const response = await fetch('/api/analytics/events', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_TOKEN'
  },
  body: JSON.stringify({
    eventType: 'course_completed',
    eventData: {
      courseId: 'course-123',
      score: 95,
      duration: 3600
    },
    sessionId: 'session-456'
  })
});
const result = await response.json();
console.log('Event tracked:', result.success);`,
    },
  ];

  const sdks = [
    {
      name: "JavaScript SDK",
      description: "Official SDK for JavaScript/Node.js",
      install: "npm install @paeds-resus/sdk",
      docs: "https://docs.paeds-resus.com/js",
    },
    {
      name: "Python SDK",
      description: "Official SDK for Python",
      install: "pip install paeds-resus",
      docs: "https://docs.paeds-resus.com/python",
    },
    {
      name: "Go SDK",
      description: "Official SDK for Go",
      install: "go get github.com/paeds-resus/go-sdk",
      docs: "https://docs.paeds-resus.com/go",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <Code className="w-8 h-8 text-primary" />
            <h1 className="text-4xl font-bold">Developer Portal</h1>
          </div>
          <p className="text-xl text-muted-foreground">
            Build with Paeds Resus. Comprehensive API documentation and developer tools.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-12">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">API Endpoints</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">50+</div>
              <p className="text-xs text-muted-foreground mt-1">RESTful endpoints</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">SDKs Available</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">6</div>
              <p className="text-xs text-muted-foreground mt-1">Languages supported</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">API Rate Limit</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">10K</div>
              <p className="text-xs text-muted-foreground mt-1">Requests per hour</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Uptime SLA</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">99.9%</div>
              <p className="text-xs text-muted-foreground mt-1">Guaranteed uptime</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="endpoints" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="endpoints">API Endpoints</TabsTrigger>
            <TabsTrigger value="examples">Code Examples</TabsTrigger>
            <TabsTrigger value="sdks">SDKs</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>

          {/* API Endpoints Tab */}
          <TabsContent value="endpoints" className="space-y-6">
            {apiEndpoints.map((category, idx) => (
              <Card key={idx}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="w-5 h-5" />
                    {category.name}
                  </CardTitle>
                  <CardDescription>{category.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {category.endpoints.map((endpoint, endIdx) => (
                      <div key={endIdx} className="border rounded-lg p-4 bg-muted/50">
                        <div className="flex items-center gap-3 mb-2">
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${endpoint.method === "GET" ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800"}`}>
                            {endpoint.method}
                          </span>
                          <code className="text-sm font-mono">{endpoint.path}</code>
                        </div>
                        <p className="text-sm text-muted-foreground">{endpoint.description}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* Code Examples Tab */}
          <TabsContent value="examples" className="space-y-6">
            {codeExamples.map((example) => (
              <Card key={example.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{example.title}</CardTitle>
                      <CardDescription>{example.language}</CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(example.code, example.id)}
                    >
                      {copiedCode === example.id ? "Copied!" : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <pre className="bg-muted p-4 rounded-lg overflow-x-auto">
                    <code className="text-sm font-mono">{example.code}</code>
                  </pre>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* SDKs Tab */}
          <TabsContent value="sdks" className="space-y-6">
            {sdks.map((sdk, idx) => (
              <Card key={idx}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5" />
                    {sdk.name}
                  </CardTitle>
                  <CardDescription>{sdk.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm font-semibold mb-2">Installation:</p>
                    <div className="bg-muted p-3 rounded-lg flex items-center justify-between">
                      <code className="text-sm font-mono">{sdk.install}</code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(sdk.install, `sdk-${idx}`)}
                      >
                        {copiedCode === `sdk-${idx}` ? "Copied!" : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full" asChild>
                    <a href={sdk.docs} target="_blank" rel="noopener noreferrer">
                      View Documentation <ExternalLink className="w-4 h-4 ml-2" />
                    </a>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Security Best Practices
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Authentication</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    All API requests must include a valid JWT token in the Authorization header:
                  </p>
                  <pre className="bg-muted p-3 rounded text-sm font-mono overflow-x-auto">
                    Authorization: Bearer YOUR_JWT_TOKEN
                  </pre>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Rate Limiting</h4>
                  <p className="text-sm text-muted-foreground">
                    API requests are rate-limited to 10,000 requests per hour per API key. Exceeding this limit will result in a 429 Too Many Requests response.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">HTTPS Only</h4>
                  <p className="text-sm text-muted-foreground">
                    All API requests must be made over HTTPS. Requests made over HTTP will be rejected.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Data Encryption</h4>
                  <p className="text-sm text-muted-foreground">
                    All data in transit is encrypted using TLS 1.2 or higher. Sensitive data at rest is encrypted using AES-256.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  API Status & Monitoring
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <span className="text-sm font-medium">API Status</span>
                    <span className="text-sm font-semibold text-green-600">All Systems Operational</span>
                  </div>
                  <Button variant="outline" className="w-full" asChild>
                    <a href="https://status.paeds-resus.com" target="_blank" rel="noopener noreferrer">
                      View Status Page <ExternalLink className="w-4 h-4 ml-2" />
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Support Section */}
        <Card className="mt-12">
          <CardHeader>
            <CardTitle>Need Help?</CardTitle>
            <CardDescription>Get support from our developer community</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button variant="outline" className="h-auto flex-col py-4" asChild>
                <a href="https://docs.paeds-resus.com" target="_blank" rel="noopener noreferrer">
                  <BookOpen className="w-5 h-5 mb-2" />
                  <span>Full Documentation</span>
                </a>
              </Button>
              <Button variant="outline" className="h-auto flex-col py-4" asChild>
                <a href="https://community.paeds-resus.com" target="_blank" rel="noopener noreferrer">
                  <Code className="w-5 h-5 mb-2" />
                  <span>Community Forum</span>
                </a>
              </Button>
              <Button variant="outline" className="h-auto flex-col py-4" asChild>
                <a href="mailto:support@paeds-resus.com">
                  <Shield className="w-5 h-5 mb-2" />
                  <span>Contact Support</span>
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DeveloperPortal;
