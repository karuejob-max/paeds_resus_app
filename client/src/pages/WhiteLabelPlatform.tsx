import { useState } from "react";
import { useScrollToTop } from "@/hooks/useScrollToTop";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Palette,
  Globe,
  Settings,
  BarChart3,
  Users,
  Zap,
  Shield,
  CheckCircle2,
  ArrowRight,
  Smartphone,
  Mail,
  Phone,
} from "lucide-react";

export default function WhiteLabelPlatform() {
  const [selectedPlan, setSelectedPlan] = useState("enterprise");

  const features = [
    {
      icon: Palette,
      title: "Full Branding Customization",
      description: "Custom domain, logo, colors, and branding throughout the platform",
    },
    {
      icon: Globe,
      title: "Multi-Language Support",
      description: "Support for 50+ languages with automatic localization",
    },
    {
      icon: BarChart3,
      title: "Advanced Analytics",
      description: "Comprehensive dashboards and reporting for your organization",
    },
    {
      icon: Users,
      title: "Team Management",
      description: "Unlimited users, roles, and permissions",
    },
    {
      icon: Zap,
      title: "API Access",
      description: "Full REST API for custom integrations",
    },
    {
      icon: Shield,
      title: "Security & Compliance",
      description: "GDPR, HIPAA, SOX compliance built-in",
    },
  ];

  const plans = [
    {
      name: "Starter",
      price: "KES 500,000",
      period: "/month",
      description: "Perfect for small organizations",
      features: [
        "Up to 500 users",
        "Custom domain",
        "Basic branding",
        "Email support",
        "Monthly reporting",
      ],
      cta: "Get Started",
    },
    {
      name: "Professional",
      price: "KES 1,500,000",
      period: "/month",
      description: "For growing organizations",
      features: [
        "Up to 5,000 users",
        "Custom domain + SSL",
        "Full branding customization",
        "Priority support",
        "Real-time analytics",
        "API access",
      ],
      cta: "Get Started",
      recommended: true,
    },
    {
      name: "Enterprise",
      price: "Custom",
      period: "pricing",
      description: "For large-scale deployments",
      features: [
        "Unlimited users",
        "Dedicated infrastructure",
        "Custom integrations",
        "24/7 phone support",
        "Advanced analytics",
        "White-label mobile app",
        "SLA guarantee",
      ],
      cta: "Contact Sales",
    },
  ];

  const partners = [
    {
      name: "East Africa Health Initiative",
      region: "Kenya, Uganda, Tanzania",
      users: 5000,
      revenue: "KES 2.5M/month",
      status: "Active",
    },
    {
      name: "Southern Africa Medical Network",
      region: "South Africa, Zimbabwe, Botswana",
      users: 8000,
      revenue: "KES 4.2M/month",
      status: "Active",
    },
    {
      name: "West Africa Training Consortium",
      region: "Nigeria, Ghana, Cameroon",
      users: 3500,
      revenue: "KES 1.8M/month",
      status: "Active",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Hero */}
      <section className="bg-gradient-to-r from-indigo-900 to-indigo-800 text-white py-20 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex items-center justify-center gap-4 mb-6">
            <Palette className="w-12 h-12" />
            <h1 className="text-4xl font-bold">White-Label Platform</h1>
          </div>
          <p className="text-xl text-indigo-100 max-w-2xl mx-auto mb-8">
            Launch your own branded training platform in days, not months. Complete white-label solution with full customization.
          </p>
          <Button className="bg-white text-indigo-900 hover:bg-indigo-50" size="lg">
            Start Your Free Trial
          </Button>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Features Grid */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-slate-900 mb-12 text-center">Everything You Need</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardContent className="pt-6">
                    <Icon className="w-12 h-12 text-indigo-600 mb-4" />
                    <h3 className="font-bold text-slate-900 mb-2">{feature.title}</h3>
                    <p className="text-slate-600 text-sm">{feature.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Pricing */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-slate-900 mb-12 text-center">Transparent Pricing</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {plans.map((plan, index) => (
              <Card
                key={index}
                className={`hover:shadow-lg transition-all ${
                  plan.recommended ? "ring-2 ring-indigo-600 md:scale-105" : ""
                }`}
              >
                <CardHeader>
                  {plan.recommended && (
                    <Badge className="w-fit mb-4 bg-indigo-600">Recommended</Badge>
                  )}
                  <CardTitle>{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-slate-900">{plan.price}</span>
                    <span className="text-slate-600 ml-2">{plan.period}</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <ul className="space-y-3">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-slate-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="w-full"
                    variant={plan.recommended ? "default" : "outline"}
                  >
                    {plan.cta}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Customization */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-slate-900 mb-12 text-center">Full Customization</h2>
          <Tabs defaultValue="branding" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="branding">Branding</TabsTrigger>
              <TabsTrigger value="features">Features</TabsTrigger>
              <TabsTrigger value="integrations">Integrations</TabsTrigger>
              <TabsTrigger value="support">Support</TabsTrigger>
            </TabsList>

            <TabsContent value="branding" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Brand Your Platform</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-slate-900 mb-2">
                        Organization Name
                      </label>
                      <input
                        type="text"
                        placeholder="Your Organization"
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-900 mb-2">
                        Custom Domain
                      </label>
                      <input
                        type="text"
                        placeholder="training.yourcompany.com"
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                      />
                    </div>
                  </div>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-900 mb-2">
                        Primary Color
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          defaultValue="#4f46e5"
                          className="w-12 h-12 rounded cursor-pointer"
                        />
                        <span className="text-slate-600">#4f46e5</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-900 mb-2">
                        Secondary Color
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          defaultValue="#10b981"
                          className="w-12 h-12 rounded cursor-pointer"
                        />
                        <span className="text-slate-600">#10b981</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-900 mb-2">
                        Logo Upload
                      </label>
                      <Button variant="outline" className="w-full">
                        Upload Logo
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="features" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Enable/Disable Features</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      "Courses & Learning Paths",
                      "Certifications",
                      "Leaderboards",
                      "Gamification",
                      "Analytics",
                      "API Access",
                    ].map((feature) => (
                      <div key={feature} className="flex items-center gap-3 p-3 border rounded-lg">
                        <input type="checkbox" defaultChecked className="w-5 h-5" />
                        <span className="text-slate-900 font-medium">{feature}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="integrations" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Integrations</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    {["Salesforce", "Slack", "Google Workspace", "Zapier", "Power BI", "Tableau"].map(
                      (integration) => (
                        <div key={integration} className="flex items-center justify-between p-3 border rounded-lg">
                          <span className="font-medium text-slate-900">{integration}</span>
                          <Button variant="outline" size="sm">
                            Connect
                          </Button>
                        </div>
                      )
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="support" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Support Options</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 border rounded-lg flex items-start gap-4">
                    <Mail className="w-6 h-6 text-indigo-600 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-slate-900">Email Support</p>
                      <p className="text-sm text-slate-600">24-hour response time</p>
                    </div>
                  </div>
                  <div className="p-4 border rounded-lg flex items-start gap-4">
                    <Phone className="w-6 h-6 text-indigo-600 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-slate-900">Phone Support</p>
                      <p className="text-sm text-slate-600">Business hours support</p>
                    </div>
                  </div>
                  <div className="p-4 border rounded-lg flex items-start gap-4">
                    <Smartphone className="w-6 h-6 text-indigo-600 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-slate-900">Dedicated Account Manager</p>
                      <p className="text-sm text-slate-600">Enterprise plan only</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </section>

        {/* Partners */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-slate-900 mb-12 text-center">Successful Partners</h2>
          <div className="space-y-4">
            {partners.map((partner, index) => (
              <Card key={index}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-bold text-slate-900">{partner.name}</p>
                      <p className="text-sm text-slate-600">{partner.region}</p>
                    </div>
                    <div className="grid grid-cols-3 gap-8 text-right">
                      <div>
                        <p className="text-xs text-slate-600">Users</p>
                        <p className="font-bold text-slate-900">{partner.users.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-600">Monthly Revenue</p>
                        <p className="font-bold text-green-600">{partner.revenue}</p>
                      </div>
                      <div>
                        <Badge className="bg-green-100 text-green-800">{partner.status}</Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* CTA */}
        <Card className="bg-gradient-to-r from-indigo-50 to-blue-50 border-indigo-200">
          <CardContent className="pt-8">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-slate-900 mb-4">Ready to Launch?</h3>
              <p className="text-slate-600 mb-6 max-w-2xl mx-auto">
                Get your white-label platform up and running in 7 days. Our team handles setup, customization, and deployment.
              </p>
              <div className="flex gap-4 justify-center">
                <Button size="lg" className="bg-indigo-600 hover:bg-indigo-700">
                  Schedule Demo
                </Button>
                <Button size="lg" variant="outline">
                  View Documentation
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
