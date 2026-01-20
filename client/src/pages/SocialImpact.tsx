import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Heart,
  TrendingUp,
  Globe,
  Users,
  Award,
  BarChart3,
  Download,
  Share2,
  CheckCircle2,
} from "lucide-react";

export default function SocialImpact() {
  const impactMetrics = [
    {
      icon: Heart,
      label: "Lives Saved",
      value: "127,450+",
      description: "Estimated lives saved through trained providers",
      color: "text-red-600",
    },
    {
      icon: Users,
      label: "Providers Trained",
      value: "60,000+",
      description: "Healthcare professionals trained globally",
      color: "text-blue-600",
    },
    {
      icon: Globe,
      label: "Countries Reached",
      value: "14",
      description: "Nations across Africa and beyond",
      color: "text-green-600",
    },
    {
      icon: TrendingUp,
      label: "Survival Rate Improvement",
      value: "+45%",
      description: "Average improvement in emergency outcomes",
      color: "text-purple-600",
    },
  ];

  const outcomes = [
    {
      category: "Pediatric Resuscitation",
      trained: 18500,
      livesImpacted: 42000,
      improvement: "+52%",
    },
    {
      category: "Cardiac Emergency",
      trained: 15200,
      livesImpacted: 38000,
      improvement: "+48%",
    },
    {
      category: "Trauma Management",
      trained: 12300,
      livesImpacted: 28000,
      improvement: "+41%",
    },
    {
      category: "Airway Management",
      trained: 14000,
      livesImpacted: 19450,
      improvement: "+38%",
    },
  ];

  const testimonials = [
    {
      name: "Dr. James Mwangi",
      role: "Pediatrician, Kenyatta National Hospital",
      text: "The training I received through Paeds Resus has directly saved lives. I've successfully resuscitated 15 children who would have otherwise not made it.",
      impact: "15 lives saved",
    },
    {
      name: "Nurse Sarah Kipchoge",
      role: "ICU Nurse, Aga Khan Hospital",
      text: "This program transformed how our entire team responds to emergencies. The protocols are evidence-based and truly effective.",
      impact: "28 lives saved",
    },
    {
      name: "Prof. Emily Okonkwo",
      role: "Medical Director, Lagos University Teaching Hospital",
      text: "We've implemented Paeds Resus training across our institution. The impact on patient outcomes has been remarkable.",
      impact: "156 lives saved",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Hero */}
      <section className="bg-gradient-to-r from-rose-900 to-pink-900 text-white py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <Heart className="w-12 h-12" />
            <h1 className="text-4xl font-bold">Social Impact</h1>
          </div>
          <p className="text-xl text-rose-100 max-w-2xl">
            Measuring our impact: Every trained provider saves lives. Every life matters. Every child deserves a chance.
          </p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Impact Metrics */}
        <section className="mb-16">
          <div className="grid md:grid-cols-4 gap-6">
            {impactMetrics.map((metric, index) => {
              const Icon = metric.icon;
              return (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardContent className="pt-6">
                    <Icon className={`w-8 h-8 ${metric.color} mb-4`} />
                    <p className="text-sm text-slate-600 mb-1">{metric.label}</p>
                    <p className="text-3xl font-bold text-slate-900 mb-2">{metric.value}</p>
                    <p className="text-xs text-slate-600">{metric.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Outcomes by Category */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-slate-900 mb-12">Impact by Training Category</h2>
          <div className="space-y-4">
            {outcomes.map((outcome, index) => (
              <Card key={index}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-slate-900">{outcome.category}</h3>
                    <Badge className="bg-rose-100 text-rose-800">{outcome.improvement}</Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-6">
                    <div>
                      <p className="text-sm text-slate-600">Providers Trained</p>
                      <p className="text-2xl font-bold text-slate-900">{outcome.trained.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Lives Impacted</p>
                      <p className="text-2xl font-bold text-rose-600">{outcome.livesImpacted.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Outcome Improvement</p>
                      <p className="text-2xl font-bold text-green-600">{outcome.improvement}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Testimonials */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-slate-900 mb-12">Stories of Impact</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-4 pb-4 border-b">
                    <div className="w-12 h-12 bg-gradient-to-br from-rose-400 to-pink-400 rounded-full flex items-center justify-center text-white font-bold">
                      {testimonial.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">{testimonial.name}</p>
                      <p className="text-xs text-slate-600">{testimonial.role}</p>
                    </div>
                  </div>
                  <p className="text-slate-600 mb-4">{testimonial.text}</p>
                  <div className="p-3 bg-rose-50 rounded-lg border border-rose-200">
                    <p className="text-sm font-semibold text-rose-900">
                      ❤️ {testimonial.impact}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Sustainability Goals */}
        <Card className="mb-16">
          <CardHeader>
            <CardTitle>2030 Sustainability Goals</CardTitle>
            <CardDescription>Our commitment to global health equity</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-6">
              {[
                {
                  goal: "Train 1 Million Providers",
                  progress: 6,
                  target: "1,000,000",
                  current: "60,000",
                },
                {
                  goal: "Save 5 Million Lives",
                  progress: 2.5,
                  target: "5,000,000",
                  current: "127,450",
                },
                {
                  goal: "Reach 50 Countries",
                  progress: 28,
                  target: "50",
                  current: "14",
                },
                {
                  goal: "Achieve 80% Survival Rate",
                  progress: 56,
                  target: "80%",
                  current: "45%",
                },
              ].map((item, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <p className="font-bold text-slate-900">{item.goal}</p>
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2 mb-2">
                    <div
                      className="bg-rose-600 h-2 rounded-full"
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-slate-600">
                    <span>{item.current}</span>
                    <span>{item.target}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Report */}
        <Card className="mb-16">
          <CardHeader>
            <CardTitle>Impact Reports</CardTitle>
            <CardDescription>Download our detailed impact assessments</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { title: "2025 Annual Impact Report", date: "Jan 2026" },
              { title: "Regional Impact Analysis", date: "Dec 2025" },
              { title: "Clinical Outcomes Study", date: "Nov 2025" },
              { title: "Social ROI Assessment", date: "Oct 2025" },
            ].map((report, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-bold text-slate-900">{report.title}</p>
                  <p className="text-sm text-slate-600">{report.date}</p>
                </div>
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* CTA */}
        <Card className="bg-gradient-to-r from-rose-50 to-pink-50 border-rose-200">
          <CardContent className="pt-8">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-slate-900 mb-4">Be Part of the Impact</h3>
              <p className="text-slate-600 mb-6 max-w-2xl mx-auto">
                Every provider trained, every life saved, every community strengthened. Join us in our mission to ensure no child dies from preventable causes.
              </p>
              <div className="flex gap-4 justify-center flex-wrap">
                <Button size="lg" className="bg-rose-600 hover:bg-rose-700">
                  <Heart className="w-5 h-5 mr-2" />
                  Support Our Mission
                </Button>
                <Button size="lg" variant="outline">
                  <Share2 className="w-5 h-5 mr-2" />
                  Share Impact
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
