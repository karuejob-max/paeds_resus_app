import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertCircle, TrendingUp, Users, Heart, Zap, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";

type UserRole = "parent" | "provider" | "institution" | null;

export default function Home() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const [selectedRole, setSelectedRole] = useState<UserRole>(null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [livesSaved, setLivesSaved] = useState(232);

  // Load role from localStorage on mount
  useEffect(() => {
    const savedRole = localStorage.getItem("userRole") as UserRole;
    if (savedRole) {
      setSelectedRole(savedRole);
    } else if (isAuthenticated && !isLoading) {
      setShowRoleModal(true);
    }
  }, [isAuthenticated, isLoading]);

  // Simulate live counter
  useEffect(() => {
    const interval = setInterval(() => {
      setLivesSaved((prev) => prev + Math.floor(Math.random() * 3));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    localStorage.setItem("userRole", role || "");
    setShowRoleModal(false);
  };

  const getRoleContent = () => {
    switch (selectedRole) {
      case "provider":
        return {
          title: "Healthcare Provider Dashboard",
          description: "Access patient alerts and clinical protocols",
          primaryCTA: { text: "View Predictive Alerts", href: "/predictive-intervention" },
          secondaryCTA: { text: "Learning Path", href: "/learning-path" },
        };
      case "parent":
        return {
          title: "Child Health Resources",
          description: "Learn essential pediatric care and safety",
          primaryCTA: { text: "Start Learning", href: "/learning-path" },
          secondaryCTA: { text: "Emergency Guide", href: "/resources" },
        };
      case "institution":
        return {
          title: "Institutional Management",
          description: "Manage staff training and institutional analytics",
          primaryCTA: { text: "Admin Dashboard", href: "/admin" },
          secondaryCTA: { text: "Training Programs", href: "/training" },
        };
      default:
        return {
          title: "Welcome to Paeds Resus",
          description: "AI-powered child mortality reduction platform",
          primaryCTA: { text: "Get Started", href: "#" },
          secondaryCTA: { text: "Learn More", href: "#" },
        };
    }
  };

  const content = getRoleContent();

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      {/* Hero Section */}
      <section className="relative py-12 md:py-20 px-4 md:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
            {/* Left: Content */}
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20">
                <Zap className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-semibold text-blue-300">AI-Powered Child Mortality Reduction</span>
              </div>

              <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight">
                Machine Learning Saves Lives
              </h1>

              <p className="text-lg text-slate-300">
                Predictive interventions, personalized learning, and autonomous growth. Reach 1M healthcare workers and save 10M+ lives.
              </p>

              {/* Live Impact Counter */}
              <div className="bg-gradient-to-r from-red-500/10 to-red-500/5 border border-red-500/20 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <Heart className="w-6 h-6 text-red-400" />
                  <div>
                    <p className="text-sm text-slate-400">Lives Saved This Month</p>
                    <p className="text-3xl font-bold text-red-400">{livesSaved.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                {isAuthenticated ? (
                  <>
                    <Link href={content.primaryCTA.href}>
                      <Button className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold gap-2">
                        {content.primaryCTA.text}
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </Link>
                    <Link href={content.secondaryCTA.href}>
                      <Button variant="outline" className="w-full sm:w-auto">
                        {content.secondaryCTA.text}
                      </Button>
                    </Link>
                  </>
                ) : (
                  <>
                    <Button className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold gap-2">
                      Sign In
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" className="w-full sm:w-auto">
                      Create Account
                    </Button>
                  </>
                )}
              </div>

              {/* Social Proof */}
              <div className="flex flex-col sm:flex-row gap-6 pt-4 text-sm text-slate-400">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-green-400" />
                  <span>2,847 active healthcare workers</span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-blue-400" />
                  <span>50+ institutions</span>
                </div>
              </div>
            </div>

            {/* Right: Feature Cards */}
            <div className="space-y-4">
              <Card className="bg-slate-800/50 border-slate-700 hover:border-blue-500/50 transition-colors">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-semibold text-white mb-1">Predictive Alerts</h3>
                      <p className="text-sm text-slate-300">AI predicts patient deterioration 24+ hours in advance</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800/50 border-slate-700 hover:border-blue-500/50 transition-colors">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <TrendingUp className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-semibold text-white mb-1">Personalized Learning</h3>
                      <p className="text-sm text-slate-300">ML generates optimal learning paths for each user</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800/50 border-slate-700 hover:border-blue-500/50 transition-colors">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <Zap className="w-6 h-6 text-yellow-400 flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-semibold text-white mb-1">Autonomous Growth</h3>
                      <p className="text-sm text-slate-300">AI optimizes referrals and viral loops automatically</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-12 md:py-20 px-4 md:px-6 bg-slate-800/30">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-12">How Our AI Works</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                number: "01",
                title: "Real-Time Data",
                description: "Continuously ingests patient data, learning outcomes, and intervention results",
              },
              {
                number: "02",
                title: "ML Predictions",
                description: "Predicts patient deterioration, optimal learning paths, and viral growth opportunities",
              },
              {
                number: "03",
                title: "Autonomous Actions",
                description: "Automatically optimizes pricing, referrals, content, and interventions",
              },
            ].map((item) => (
              <Card key={item.number} className="bg-slate-800/50 border-slate-700">
                <CardContent className="pt-8">
                  <div className="text-4xl font-bold text-blue-400 mb-4">{item.number}</div>
                  <h3 className="text-xl font-semibold text-white mb-2">{item.title}</h3>
                  <p className="text-slate-300">{item.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ML Features Section */}
      <section className="py-12 md:py-20 px-4 md:px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-12">ML-Powered Features</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                title: "Patient Risk Dashboard",
                description: "See predicted patient deterioration with 87% accuracy",
                icon: AlertCircle,
              },
              {
                title: "Adaptive Learning",
                description: "Courses adjust difficulty based on your performance",
                icon: TrendingUp,
              },
              {
                title: "Impact Tracking",
                description: "See your real-time contribution to mortality reduction",
                icon: Heart,
              },
              {
                title: "Viral Growth",
                description: "AI-optimized referral system reaches 1M users",
                icon: Zap,
              },
            ].map((feature) => {
              const Icon = feature.icon;
              return (
                <Card key={feature.title} className="bg-slate-800/50 border-slate-700 hover:border-blue-500/50 transition-colors">
                  <CardContent className="pt-6">
                    <Icon className="w-8 h-8 text-blue-400 mb-4" />
                    <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                    <p className="text-slate-300 text-sm">{feature.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Impact Section */}
      <section className="py-12 md:py-20 px-4 md:px-6 bg-slate-800/30">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-12">Global Impact</h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { label: "Lives Saved", value: "47K+", color: "text-red-400" },
              { label: "Certifications", value: "12.3K", color: "text-blue-400" },
              { label: "Active Workers", value: "2.8K", color: "text-green-400" },
              { label: "Institutions", value: "50+", color: "text-yellow-400" },
            ].map((stat) => (
              <Card key={stat.label} className="bg-slate-800/50 border-slate-700">
                <CardContent className="pt-6 text-center">
                  <p className="text-sm text-slate-400 mb-2">{stat.label}</p>
                  <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Role Selection Modal */}
      <Dialog open={showRoleModal} onOpenChange={setShowRoleModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Welcome to Paeds Resus</DialogTitle>
            <DialogDescription>Help us personalize your experience. What best describes you?</DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-4">
            {[
              {
                role: "parent" as const,
                title: "Parent / Caregiver",
                description: "Access resources for parents and caregivers",
                icon: "👨‍👩‍👧",
              },
              {
                role: "provider" as const,
                title: "Healthcare Provider",
                description: "Access clinical protocols and professional development",
                icon: "👨‍⚕️",
              },
              {
                role: "institution" as const,
                title: "Institution / Hospital",
                description: "Manage institutional accounts and provider access",
                icon: "🏥",
              },
            ].map((option) => (
              <button
                key={option.role}
                onClick={() => handleRoleSelect(option.role)}
                className="w-full p-4 text-left border border-slate-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{option.icon}</span>
                  <div>
                    <p className="font-semibold text-slate-900">{option.title}</p>
                    <p className="text-sm text-slate-600">{option.description}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          <p className="text-xs text-slate-500 text-center">You can change this anytime in your account settings</p>
        </DialogContent>
      </Dialog>
    </div>
  );
}
