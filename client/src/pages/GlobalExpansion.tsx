import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Globe, TrendingUp, Users, Building2, Zap, CheckCircle2, MapPin, DollarSign } from "lucide-react";

export default function GlobalExpansion() {
  const regions = [
    {
      name: "East Africa",
      status: "Active",
      countries: 5,
      users: 25000,
      revenue: "KES 45M/year",
      growth: "+180%",
    },
    {
      name: "West Africa",
      status: "Expanding",
      countries: 3,
      users: 12000,
      revenue: "KES 18M/year",
      growth: "+240%",
    },
    {
      name: "Southern Africa",
      status: "Active",
      countries: 4,
      users: 18000,
      revenue: "KES 32M/year",
      growth: "+160%",
    },
    {
      name: "North Africa",
      status: "Launching",
      countries: 2,
      users: 5000,
      revenue: "KES 8M/year",
      growth: "+320%",
    },
    {
      name: "Asia Pacific",
      status: "Planning",
      countries: 0,
      users: 0,
      revenue: "TBD",
      growth: "Coming 2026",
    },
    {
      name: "Europe",
      status: "Planning",
      countries: 0,
      users: 0,
      revenue: "TBD",
      growth: "Coming 2026",
    },
  ];

  const opportunities = [
    {
      region: "India",
      market: "$2.5B",
      potential: "High",
      timeline: "Q2 2026",
    },
    {
      region: "Nigeria",
      market: "$1.8B",
      potential: "Very High",
      timeline: "Q1 2026",
    },
    {
      region: "South Africa",
      market: "$1.2B",
      potential: "High",
      timeline: "Q3 2026",
    },
    {
      region: "Egypt",
      market: "$900M",
      potential: "Medium",
      timeline: "Q4 2026",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Hero */}
      <section className="bg-gradient-to-r from-amber-900 to-orange-900 text-white py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <Globe className="w-12 h-12" />
            <h1 className="text-4xl font-bold">Global Expansion</h1>
          </div>
          <p className="text-xl text-amber-100 max-w-2xl">
            Scaling healthcare excellence across Africa and beyond. Our vision: 1 million trained providers by 2030.
          </p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Global Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-16">
          <Card>
            <CardContent className="pt-6 text-center">
              <Globe className="w-8 h-8 text-amber-600 mx-auto mb-4" />
              <p className="text-3xl font-bold text-slate-900">14</p>
              <p className="text-slate-600 mt-2">Countries Active</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <Users className="w-8 h-8 text-blue-600 mx-auto mb-4" />
              <p className="text-3xl font-bold text-slate-900">60K+</p>
              <p className="text-slate-600 mt-2">Global Users</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <DollarSign className="w-8 h-8 text-green-600 mx-auto mb-4" />
              <p className="text-3xl font-bold text-slate-900">KES 103M</p>
              <p className="text-slate-600 mt-2">Annual Revenue</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <TrendingUp className="w-8 h-8 text-purple-600 mx-auto mb-4" />
              <p className="text-3xl font-bold text-slate-900">+195%</p>
              <p className="text-slate-600 mt-2">YoY Growth</p>
            </CardContent>
          </Card>
        </div>

        {/* Regional Performance */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-slate-900 mb-12">Regional Performance</h2>
          <div className="space-y-4">
            {regions.map((region, index) => (
              <Card key={index}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <MapPin className="w-5 h-5 text-amber-600" />
                        <h3 className="font-bold text-slate-900">{region.name}</h3>
                        <Badge
                          variant={
                            region.status === "Active"
                              ? "default"
                              : region.status === "Expanding"
                              ? "secondary"
                              : "outline"
                          }
                        >
                          {region.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-600">
                        {region.countries} countries • {region.users.toLocaleString()} users
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-slate-900">{region.revenue}</p>
                      <p className={`text-sm font-semibold ${region.growth.includes("+") ? "text-green-600" : "text-slate-600"}`}>
                        {region.growth}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Market Opportunities */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-slate-900 mb-12">Market Opportunities</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {opportunities.map((opp, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{opp.region}</span>
                    <Badge className="bg-amber-100 text-amber-800">{opp.potential}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-slate-600">Market Size</p>
                    <p className="text-2xl font-bold text-slate-900">{opp.market}</p>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t">
                    <span className="text-sm text-slate-600">Launch Timeline</span>
                    <span className="font-semibold text-slate-900">{opp.timeline}</span>
                  </div>
                  <Button className="w-full">Learn More</Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Strategy */}
        <Card className="mb-16">
          <CardHeader>
            <CardTitle>Expansion Strategy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-3 gap-6">
              <div className="p-4 border rounded-lg">
                <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-amber-600" />
                  Local Partnerships
                </h3>
                <p className="text-sm text-slate-600">
                  Partner with local healthcare organizations and training centers to ensure cultural fit and local expertise.
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-amber-600" />
                  Localization
                </h3>
                <p className="text-sm text-slate-600">
                  Translate content, adapt curriculum, and customize pricing for each market's unique needs.
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-amber-600" />
                  Scalable Growth
                </h3>
                <p className="text-sm text-slate-600">
                  Leverage white-label platform and franchise model for rapid, sustainable expansion.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Vision */}
        <Card className="bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
          <CardContent className="pt-8">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-slate-900 mb-4">Our Vision</h3>
              <p className="text-slate-600 mb-6 max-w-2xl mx-auto">
                By 2030, we aim to train 1 million healthcare providers across 50+ countries, saving millions of lives through accessible, world-class emergency care training.
              </p>
              <div className="flex gap-4 justify-center">
                <Button size="lg" className="bg-amber-600 hover:bg-amber-700">
                  Join Our Mission
                </Button>
                <Button size="lg" variant="outline">
                  View Roadmap
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
