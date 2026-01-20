import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Handshake,
  Globe,
  Users,
  TrendingUp,
  Award,
  Building2,
  Heart,
  Zap,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";

export default function PartnerEcosystem() {
  const partnerTypes = [
    {
      icon: Building2,
      title: "Enterprise Partners",
      description: "Large healthcare systems and institutions",
      benefits: ["Custom integration", "Dedicated support", "Revenue sharing"],
      count: 45,
    },
    {
      icon: Globe,
      title: "Regional Partners",
      description: "Country-level training organizations",
      benefits: ["White-label platform", "Territory rights", "Co-marketing"],
      count: 28,
    },
    {
      icon: Users,
      title: "Technology Partners",
      description: "Integration and software partners",
      benefits: ["API access", "Co-selling", "Joint development"],
      count: 62,
    },
    {
      icon: Heart,
      title: "NGO & Non-Profit Partners",
      description: "Mission-aligned organizations",
      benefits: ["Discounted pricing", "Impact reporting", "Grants"],
      count: 35,
    },
  ];

  const strategicPartners = [
    {
      name: "World Health Organization (WHO)",
      category: "International Health",
      status: "Active",
      focus: "Global training standards",
      revenue: "KES 8.5M/year",
    },
    {
      name: "American Heart Association (AHA)",
      category: "Certification",
      status: "Active",
      focus: "ACLS/BLS certification",
      revenue: "KES 12.3M/year",
    },
    {
      name: "Kenya Medical Association",
      category: "Professional Body",
      status: "Active",
      focus: "Continuing education credits",
      revenue: "KES 6.7M/year",
    },
    {
      name: "East African Health Commission",
      category: "Regional Authority",
      status: "Active",
      focus: "Regional standards",
      revenue: "KES 9.2M/year",
    },
  ];

  const integrationPartners = [
    { name: "Salesforce", category: "CRM", status: "Active" },
    { name: "Slack", category: "Communication", status: "Active" },
    { name: "Google Workspace", category: "Productivity", status: "Active" },
    { name: "Zapier", category: "Automation", status: "Active" },
    { name: "Power BI", category: "Analytics", status: "Active" },
    { name: "Stripe", category: "Payments", status: "Active" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Hero */}
      <section className="bg-gradient-to-r from-emerald-900 to-teal-900 text-white py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <Handshake className="w-12 h-12" />
            <h1 className="text-4xl font-bold">Partner Ecosystem</h1>
          </div>
          <p className="text-xl text-emerald-100 max-w-2xl">
            Join a thriving network of 170+ partners driving healthcare excellence across Africa and beyond.
          </p>
          <div className="mt-8 flex gap-4">
            <Button className="bg-white text-emerald-900 hover:bg-emerald-50">
              <Handshake className="w-4 h-4 mr-2" />
              Become a Partner
            </Button>
            <Button variant="outline" className="text-white border-white hover:bg-emerald-700">
              View Opportunities
            </Button>
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Partner Types */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-slate-900 mb-12">Partnership Types</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {partnerTypes.map((type, index) => {
              const Icon = type.icon;
              return (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <Icon className="w-8 h-8 text-emerald-600 mb-4" />
                        <CardTitle>{type.title}</CardTitle>
                        <CardDescription>{type.description}</CardDescription>
                      </div>
                      <Badge className="bg-emerald-100 text-emerald-800">{type.count}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm font-semibold text-slate-900 mb-2">Key Benefits</p>
                      <ul className="space-y-2">
                        {type.benefits.map((benefit, i) => (
                          <li key={i} className="flex items-center gap-2 text-sm text-slate-600">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                            {benefit}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <Button className="w-full" variant="outline">
                      Learn More
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        <Tabs defaultValue="strategic" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="strategic">Strategic Partners</TabsTrigger>
            <TabsTrigger value="integrations">Integrations</TabsTrigger>
            <TabsTrigger value="benefits">Partner Benefits</TabsTrigger>
          </TabsList>

          {/* Strategic Partners */}
          <TabsContent value="strategic" className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Our Strategic Partners</h2>
            <div className="space-y-4">
              {strategicPartners.map((partner, index) => (
                <Card key={index}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-bold text-slate-900">{partner.name}</h3>
                        <p className="text-sm text-slate-600 mt-1">{partner.category}</p>
                        <p className="text-sm text-slate-600 mt-2">Focus: {partner.focus}</p>
                      </div>
                      <div className="text-right">
                        <Badge className="mb-2">{partner.status}</Badge>
                        <p className="text-sm font-semibold text-emerald-600">{partner.revenue}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Integrations */}
          <TabsContent value="integrations" className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Integration Partners</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {integrationPartners.map((partner, index) => (
                <Card key={index}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-bold text-slate-900">{partner.name}</p>
                        <p className="text-sm text-slate-600">{partner.category}</p>
                      </div>
                      <Badge className="bg-emerald-100 text-emerald-800">{partner.status}</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Benefits */}
          <TabsContent value="benefits" className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Why Partner With Us</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <TrendingUp className="w-8 h-8 text-emerald-600 mb-4" />
                  <CardTitle>Revenue Growth</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600">
                    Average partner sees 300% revenue growth within first year through revenue sharing and co-selling opportunities.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <Users className="w-8 h-8 text-emerald-600 mb-4" />
                  <CardTitle>Access to Network</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600">
                    Tap into our network of 170+ partners, 500+ instructors, and 50,000+ active learners.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <Award className="w-8 h-8 text-emerald-600 mb-4" />
                  <CardTitle>Co-Marketing</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600">
                    Joint marketing campaigns, co-branded materials, and featured placement on our platform.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <Zap className="w-8 h-8 text-emerald-600 mb-4" />
                  <CardTitle>Technical Support</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600">
                    Dedicated technical team, API documentation, and integration support.
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Stats */}
        <div className="mt-12 grid md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-bold text-emerald-600">170+</p>
              <p className="text-slate-600 mt-2">Active Partners</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-bold text-blue-600">$85M+</p>
              <p className="text-slate-600 mt-2">Partner Revenue</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-bold text-purple-600">45</p>
              <p className="text-slate-600 mt-2">Countries</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-bold text-orange-600">300%</p>
              <p className="text-slate-600 mt-2">Avg Growth</p>
            </CardContent>
          </Card>
        </div>

        {/* CTA */}
        <Card className="mt-12 bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200">
          <CardContent className="pt-8">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-slate-900 mb-4">Ready to Partner?</h3>
              <p className="text-slate-600 mb-6 max-w-2xl mx-auto">
                Join our thriving ecosystem and unlock new revenue streams, market opportunities, and growth potential.
              </p>
              <div className="flex gap-4 justify-center">
                <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700">
                  Apply Now
                </Button>
                <Button size="lg" variant="outline">
                  View Program Details
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
