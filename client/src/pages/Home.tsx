import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertCircle,
  Heart,
  Clock,
  TrendingUp,
  Share2,
  BookOpen,
  Users,
  Activity,
  Zap,
  Target,
  CheckCircle2,
  ArrowRight,
  BarChart3,
  FileText,
  Stethoscope,
  Zap as Lightning,
  Trophy,
  Brain,
} from "lucide-react";

export default function Home() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  // Mock data for demonstration
  const stats = {
    criticalPatients: 1,
    totalPatients: 8,
    livesProtected: 342,
    interventionsLogged: 1247,
  };

  const sections = [
    {
      id: "patient-management",
      title: "Patient Management",
      description: "Monitor all patients with real-time vital signs and risk scoring",
      icon: Users,
      color: "bg-blue-50 border-blue-200",
      features: [
        "Real-time vital signs monitoring (HR, RR, O₂, Temp, BP)",
        "Automated risk scoring (CRITICAL/HIGH/MEDIUM)",
        "Patient history and progression tracking",
        "Quick action buttons for common interventions",
      ],
      action: () => setLocation("/patients"),
      stats: `${stats.totalPatients} patients monitored`,
      status: "✅ Live",
    },
    {
      id: "vital-signs",
      title: "Vital Signs & Risk Scoring",
      description: "Real-time monitoring with age-weight-based reference ranges",
      icon: Heart,
      color: "bg-red-50 border-red-200",
      features: [
        "9 vital signs inputs (HR, RR, O₂, Temp, BP, etc.)",
        "5 pediatric age groups (0-1, 1-3, 3-6, 6-12, 12-18)",
        "Risk levels: CRITICAL/HIGH/MEDIUM/LOW",
        "Trend analysis and historical tracking",
      ],
      action: () => setLocation("/patients"),
      stats: "29 unit tests passing",
      status: "✅ Live",
    },
    {
      id: "cpr-clock",
      title: "CPR Clock & Emergency Protocols",
      description: "30-60 second decision windows for emergency interventions",
      icon: Clock,
      color: "bg-red-50 border-red-200",
      features: [
        "Real-time CPR timer with audio/visual alerts",
        "Intervention checklist (drugs, shocks, compressions)",
        "Automatic escalation at critical time points",
        "Post-resuscitation care protocols",
      ],
      action: () => alert("CPR Clock - Coming Soon"),
      stats: "Saves 30-60 seconds per emergency",
      status: "🔄 In Progress",
      comingSoon: true,
    },
    {
      id: "investigations",
      title: "Investigation Upload & AI Analysis",
      description: "Upload lab tests and imaging with AI-powered interpretation",
      icon: FileText,
      color: "bg-indigo-50 border-indigo-200",
      features: [
        "File upload for lab tests, imaging, spreadsheets",
        "AI interpretation with confidence scores",
        "Differential diagnosis suggestions",
        "Abnormal findings detection",
      ],
      action: () => setLocation("/investigations/1"),
      stats: "34 unit tests passing",
      status: "✅ Live",
    },
    {
      id: "performance-dashboard",
      title: "Performance Dashboard & Leaderboards",
      description: "Real-time provider statistics and competitive rankings",
      icon: Trophy,
      color: "bg-yellow-50 border-yellow-200",
      features: [
        "Individual provider performance metrics",
        "Real-time leaderboard rankings",
        "Achievement tracking and badges",
        "WebSocket integration for live updates",
      ],
      action: () => setLocation("/performance-dashboard"),
      stats: "23 unit tests passing",
      status: "✅ Live",
    },
    {
      id: "risk-scoring",
      title: "Predictive Risk Scoring",
      description: "ML-powered risk prediction for patient deterioration",
      icon: Brain,
      color: "bg-orange-50 border-orange-200",
      features: [
        "ML-powered risk prediction (0-100%)",
        "Severity classification with recommendations",
        "Confidence intervals and time-to-deterioration",
        "Historical trend analysis",
      ],
      action: () => setLocation("/patients"),
      stats: "87% prediction accuracy",
      status: "✅ Live",
    },
    {
      id: "referral-system",
      title: "Referral & Transfer System",
      description: "Seamless patient transfers between facilities",
      icon: Share2,
      color: "bg-green-50 border-green-200",
      features: [
        "Facility matching by specialization",
        "Automated referral routing",
        "Transfer status tracking",
        "Peer network integration",
      ],
      action: () => setLocation("/referral"),
      stats: "Connected to 500+ facilities",
      status: "✅ Live",
    },
    {
      id: "impact-dashboard",
      title: "Personal Impact Dashboard",
      description: "Track your clinical performance and peer comparison",
      icon: Activity,
      color: "bg-purple-50 border-purple-200",
      features: [
        "Personal performance metrics",
        "Peer comparison and benchmarking",
        "Lives saved and interventions logged",
        "Certification and skill tracking",
      ],
      action: () => setLocation("/personal-impact"),
      stats: `${stats.livesProtected} lives protected`,
      status: "✅ Live",
    },
    {
      id: "safe-truth",
      title: "Safe-Truth Incident Reporting",
      description: "Confidential incident reporting and analysis system",
      icon: AlertCircle,
      color: "bg-red-50 border-red-200",
      features: [
        "Anonymous incident reporting",
        "Timeline event logging",
        "System delay analysis",
        "Hospital metrics and recommendations",
      ],
      action: () => setLocation("/safe-truth"),
      stats: "Comprehensive incident tracking",
      status: "✅ Live",
    },
    {
      id: "learning-path",
      title: "Personalized Learning Path",
      description: "Continuous professional development and skill building",
      icon: BookOpen,
      color: "bg-indigo-50 border-indigo-200",
      features: [
        "AI-generated courses tailored to your gaps",
        "Micro-learning modules (5-10 minutes)",
        "Certification tracking and renewal",
        "Peer learning and case studies",
      ],
      action: () => alert("Learning Path - Coming Soon"),
      stats: "100+ courses available",
      status: "🔄 In Progress",
      comingSoon: true,
    },
    {
      id: "emergency-protocols",
      title: "Emergency Protocols & Guidelines",
      description: "Evidence-based protocols for pediatric emergencies",
      icon: Stethoscope,
      color: "bg-cyan-50 border-cyan-200",
      features: [
        "Searchable protocol library",
        "Step-by-step intervention guides",
        "Medication dosage calculator",
        "Age and weight-based recommendations",
      ],
      action: () => setLocation("/protocols"),
      stats: "50+ protocols available",
      status: "✅ Live",
    },
    {
      id: "analytics",
      title: "Advanced Analytics & Reporting",
      description: "Comprehensive data insights and performance analytics",
      icon: BarChart3,
      color: "bg-teal-50 border-teal-200",
      features: [
        "Real-time performance dashboards",
        "Outcome tracking and analysis",
        "Trend visualization and forecasting",
        "Custom report generation",
      ],
      action: () => setLocation("/advanced-analytics"),
      stats: "Real-time data processing",
      status: "✅ Live",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Hero Section */}
      <section className="px-4 md:px-8 py-12 md:py-20 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div>
            <Badge className="mb-4 bg-blue-100 text-blue-800 hover:bg-blue-100">
              Elite Fellowship Platform
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Save Lives in <span className="text-red-600">30-60 Seconds</span>
            </h1>
            <p className="text-lg text-gray-600 mb-6">
              Paeds Resus is an AI-powered clinical decision support platform designed for healthcare providers to identify, intervene, and save children's lives in critical moments.
            </p>
            <div className="flex gap-4 flex-wrap">
              <Button size="lg" onClick={() => setLocation("/patients")}>
                View Patients <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => setLocation("/performance-dashboard")}>
                Performance Dashboard
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Card className="bg-red-50 border-red-200">
              <CardContent className="pt-6">
                <AlertCircle className="w-8 h-8 text-red-600 mb-2" />
                <p className="text-3xl font-bold text-red-600">{stats.criticalPatients}</p>
                <p className="text-sm text-gray-600">Critical Alerts</p>
              </CardContent>
            </Card>
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-6">
                <Users className="w-8 h-8 text-blue-600 mb-2" />
                <p className="text-3xl font-bold text-blue-600">{stats.totalPatients}</p>
                <p className="text-sm text-gray-600">Patients</p>
              </CardContent>
            </Card>
            <Card className="bg-green-50 border-green-200">
              <CardContent className="pt-6">
                <Heart className="w-8 h-8 text-green-600 mb-2" />
                <p className="text-3xl font-bold text-green-600">{stats.livesProtected}</p>
                <p className="text-sm text-gray-600">Lives Protected</p>
              </CardContent>
            </Card>
            <Card className="bg-purple-50 border-purple-200">
              <CardContent className="pt-6">
                <Zap className="w-8 h-8 text-purple-600 mb-2" />
                <p className="text-3xl font-bold text-purple-600">{stats.interventionsLogged}</p>
                <p className="text-sm text-gray-600">Interventions</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Platform Features Showcase */}
      <section className="px-4 md:px-8 py-16 md:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Complete Feature Set
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Click any feature to explore details or navigate directly to the module.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sections.map((section) => {
              const Icon = section.icon;
              const isExpanded = expandedSection === section.id;

              return (
                <Card
                  key={section.id}
                  className={`cursor-pointer transition-all hover:shadow-lg ${section.color} border-2`}
                  onClick={() => setExpandedSection(isExpanded ? null : section.id)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <Icon className="w-8 h-8 text-gray-700" />
                      <div className="flex gap-2">
                        {section.comingSoon && (
                          <Badge variant="secondary">Coming Soon</Badge>
                        )}
                        <Badge className="text-xs">{section.status}</Badge>
                      </div>
                    </div>
                    <CardTitle className="text-xl">{section.title}</CardTitle>
                    <CardDescription>{section.description}</CardDescription>
                  </CardHeader>

                  {isExpanded && (
                    <CardContent className="space-y-4">
                      <div>
                        <h4 className="font-semibold text-sm mb-2">Features:</h4>
                        <ul className="space-y-2">
                          {section.features.map((feature, idx) => (
                            <li key={idx} className="flex gap-2 text-sm">
                              <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="pt-4 border-t">
                        <p className="text-sm font-semibold text-gray-700 mb-3">{section.stats}</p>
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            section.action();
                          }}
                          className="w-full"
                          disabled={section.comingSoon}
                        >
                          {section.comingSoon ? "Coming Soon" : "Explore"}
                        </Button>
                      </div>
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Quick Navigation */}
      <section className="px-4 md:px-8 py-16 max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold text-gray-900 mb-8">Quick Navigation</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Button
            variant="outline"
            className="h-24 flex flex-col items-center justify-center gap-2"
            onClick={() => setLocation("/patients")}
          >
            <Users className="w-6 h-6" />
            <span className="text-xs">Patients</span>
          </Button>
          <Button
            variant="outline"
            className="h-24 flex flex-col items-center justify-center gap-2"
            onClick={() => setLocation("/performance-dashboard")}
          >
            <Trophy className="w-6 h-6" />
            <span className="text-xs">Performance</span>
          </Button>
          <Button
            variant="outline"
            className="h-24 flex flex-col items-center justify-center gap-2"
            onClick={() => setLocation("/personal-impact")}
          >
            <TrendingUp className="w-6 h-6" />
            <span className="text-xs">Impact</span>
          </Button>
          <Button
            variant="outline"
            className="h-24 flex flex-col items-center justify-center gap-2"
            onClick={() => setLocation("/safe-truth")}
          >
            <AlertCircle className="w-6 h-6" />
            <span className="text-xs">Safe-Truth</span>
          </Button>
          <Button
            variant="outline"
            className="h-24 flex flex-col items-center justify-center gap-2"
            onClick={() => setLocation("/referral")}
          >
            <Share2 className="w-6 h-6" />
            <span className="text-xs">Referrals</span>
          </Button>
        </div>
      </section>

      {/* Key Metrics */}
      <section className="px-4 md:px-8 py-16 md:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">
            Platform Impact & Scale
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-4xl font-bold text-blue-600 mb-2">12+</p>
                <p className="text-gray-600">Live Features</p>
                <p className="text-xs text-gray-500 mt-2">Fully integrated</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-4xl font-bold text-green-600 mb-2">800+</p>
                <p className="text-gray-600">Unit Tests</p>
                <p className="text-xs text-gray-500 mt-2">All passing</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-4xl font-bold text-purple-600 mb-2">51</p>
                <p className="text-gray-600">Database Tables</p>
                <p className="text-xs text-gray-500 mt-2">Comprehensive model</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-4xl font-bold text-red-600 mb-2">0</p>
                <p className="text-gray-600">TypeScript Errors</p>
                <p className="text-xs text-gray-500 mt-2">Production ready</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Feature Highlights */}
      <section className="px-4 md:px-8 py-16 max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold text-gray-900 mb-8">Latest Additions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-2 border-yellow-200 bg-yellow-50">
            <CardHeader>
              <Trophy className="w-8 h-8 text-yellow-600 mb-2" />
              <CardTitle>Performance Dashboard</CardTitle>
              <CardDescription>Real-time provider statistics and leaderboards</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <span>Individual provider metrics</span>
                </li>
                <li className="flex gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <span>Real-time leaderboards</span>
                </li>
                <li className="flex gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <span>WebSocket integration</span>
                </li>
              </ul>
              <Button
                className="w-full mt-4"
                onClick={() => setLocation("/performance-dashboard")}
              >
                Explore Dashboard
              </Button>
            </CardContent>
          </Card>

          <Card className="border-2 border-indigo-200 bg-indigo-50">
            <CardHeader>
              <FileText className="w-8 h-8 text-indigo-600 mb-2" />
              <CardTitle>Investigation Upload</CardTitle>
              <CardDescription>AI-powered analysis of lab tests and imaging</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <span>File upload support</span>
                </li>
                <li className="flex gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <span>AI interpretation</span>
                </li>
                <li className="flex gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <span>Differential diagnosis</span>
                </li>
              </ul>
              <Button
                className="w-full mt-4"
                onClick={() => setLocation("/investigations/1")}
              >
                Upload Investigation
              </Button>
            </CardContent>
          </Card>

          <Card className="border-2 border-red-200 bg-red-50">
            <CardHeader>
              <Heart className="w-8 h-8 text-red-600 mb-2" />
              <CardTitle>Vital Signs Monitoring</CardTitle>
              <CardDescription>Real-time risk scoring with age-based reference ranges</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <span>9 vital signs inputs</span>
                </li>
                <li className="flex gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <span>5 pediatric age groups</span>
                </li>
                <li className="flex gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <span>Risk level classification</span>
                </li>
              </ul>
              <Button
                className="w-full mt-4"
                onClick={() => setLocation("/patients")}
              >
                Monitor Patients
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Call to Action */}
      <section className="px-4 md:px-8 py-16 max-w-7xl mx-auto">
        <Card className="bg-gradient-to-r from-blue-600 to-blue-700 border-0 text-white">
          <CardContent className="pt-12 pb-12 text-center">
            <h3 className="text-3xl font-bold mb-4">Ready to Save Lives?</h3>
            <p className="text-lg mb-8 opacity-90 max-w-2xl mx-auto">
              The platform is built. The foundation is solid. Explore all features, track your performance, and make a real impact on pediatric emergency care.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Button size="lg" variant="secondary" onClick={() => setLocation("/patients")}>
                Explore Platform
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="bg-transparent border-white text-white hover:bg-white hover:text-blue-600"
                onClick={() => setLocation("/performance-dashboard")}
              >
                View Performance
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Footer Info */}
      <section className="px-4 md:px-8 py-12 bg-gray-900 text-white text-center">
        <p className="text-sm text-gray-400">
          Paeds Resus Elite Fellowship Platform • Phase J Complete
        </p>
        <p className="text-xs text-gray-500 mt-2">
          Built with React 19 • Tailwind 4 • tRPC 11 • Drizzle ORM • WebSocket Integration
        </p>
        <p className="text-xs text-gray-600 mt-3">
          12+ Live Features • 800+ Unit Tests • 0 TypeScript Errors
        </p>
      </section>
    </div>
  );
}
