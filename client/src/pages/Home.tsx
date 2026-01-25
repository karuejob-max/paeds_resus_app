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
  Trophy,
  Brain,
  Shield,
  Lock,
  Award,
  Smartphone,
  Globe,
  Briefcase,
} from "lucide-react";

export default function Home() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedRole, setSelectedRole] = useState<"provider" | "parent" | "institution" | null>(null);

  // Determine user's role if logged in
  const userRole = user?.role === "admin" ? "provider" : selectedRole;

  return (
    <div className="min-h-screen bg-white">
      {/* ROLE SELECTOR - Persistent and Prominent */}
      {!user && !userRole && (
        <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
          <div className="max-w-6xl mx-auto px-4 py-8">
            <h2 className="text-2xl font-bold mb-6 text-center">Who are you?</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Healthcare Provider */}
              <button
                onClick={() => setSelectedRole("provider")}
                className="p-6 bg-white/10 hover:bg-white/20 rounded-lg border border-white/30 transition-all text-left"
              >
                <Stethoscope className="w-8 h-8 mb-3" />
                <h3 className="font-bold text-lg mb-2">Healthcare Provider</h3>
                <p className="text-sm text-blue-100">
                  Doctor, nurse, paramedic, or other clinical staff
                </p>
              </button>

              {/* Parent/Caregiver */}
              <button
                onClick={() => setSelectedRole("parent")}
                className="p-6 bg-white/10 hover:bg-white/20 rounded-lg border border-white/30 transition-all text-left"
              >
                <Heart className="w-8 h-8 mb-3" />
                <h3 className="font-bold text-lg mb-2">Parent/Caregiver</h3>
                <p className="text-sm text-blue-100">
                  Learn CPR and emergency response for your child
                </p>
              </button>

              {/* Institution */}
              <button
                onClick={() => setSelectedRole("institution")}
                className="p-6 bg-white/10 hover:bg-white/20 rounded-lg border border-white/30 transition-all text-left"
              >
                <Briefcase className="w-8 h-8 mb-3" />
                <h3 className="font-bold text-lg mb-2">Institution</h3>
                <p className="text-sm text-blue-100">
                  Hospital, school, or organization
                </p>
              </button>
            </div>
          </div>
        </section>
      )}

      {/* HEALTHCARE PROVIDER HERO */}
      {(userRole === "provider" || user?.role === "admin") && (
        <>
          {/* Hero Section */}
          <section className="bg-gradient-to-br from-blue-50 via-white to-blue-50 px-4 md:px-8 py-16 md:py-24">
            <div className="max-w-6xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                <div>
                  <Badge className="mb-4 bg-blue-100 text-blue-800 hover:bg-blue-100">
                    For Healthcare Providers
                  </Badge>
                  <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                    Make the Right Call in <span className="text-red-600">30 Seconds</span>
                  </h1>
                  <p className="text-xl text-gray-700 mb-8 leading-relaxed">
                    AI-powered clinical decision support that guides you through every pediatric emergency. From recognition to intervention—every second counts.
                  </p>
                  <div className="flex gap-4 flex-wrap mb-8">
                    <Button size="lg" onClick={() => setLocation("/patients")} className="bg-red-600 hover:bg-red-700">
                      Start Now <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                    <Button size="lg" variant="outline" onClick={() => setLocation("/protocols")}>
                      View Protocols
                    </Button>
                  </div>
                  <p className="text-sm text-gray-600 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    No credit card required. Start immediately.
                  </p>
                </div>

                {/* Trust Signals */}
                <div className="space-y-4">
                  <Card className="border-2 border-green-200 bg-green-50">
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-4">
                        <Shield className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                        <div>
                          <h3 className="font-bold text-green-900 mb-1">Trusted by 500+ Facilities</h3>
                          <p className="text-sm text-green-800">
                            Used in hospitals across East Africa
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-2 border-blue-200 bg-blue-50">
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-4">
                        <Award className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                        <div>
                          <h3 className="font-bold text-blue-900 mb-1">Evidence-Based Protocols</h3>
                          <p className="text-sm text-blue-800">
                            Based on latest pediatric emergency guidelines
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-2 border-purple-200 bg-purple-50">
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-4">
                        <Lock className="w-6 h-6 text-purple-600 flex-shrink-0 mt-1" />
                        <div>
                          <h3 className="font-bold text-purple-900 mb-1">HIPAA Compliant</h3>
                          <p className="text-sm text-purple-800">
                            Your patient data is secure and encrypted
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </section>

          {/* Key Features for Providers */}
          <section className="bg-white px-4 md:px-8 py-16">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-3xl font-bold text-center mb-4">What You Get</h2>
              <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
                Everything you need to handle pediatric emergencies with confidence
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Feature 1 */}
                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <Clock className="w-8 h-8 text-red-600 mb-2" />
                    <CardTitle>Real-Time Decision Support</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">
                      AI analyzes vital signs and guides you through the exact steps needed in critical moments
                    </p>
                  </CardContent>
                </Card>

                {/* Feature 2 */}
                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <Brain className="w-8 h-8 text-blue-600 mb-2" />
                    <CardTitle>Predictive Risk Scoring</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">
                      Know which patients are deteriorating before it's too late. 87% prediction accuracy.
                    </p>
                  </CardContent>
                </Card>

                {/* Feature 3 */}
                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <FileText className="w-8 h-8 text-indigo-600 mb-2" />
                    <CardTitle>AI Lab Analysis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">
                      Upload tests and imaging. Get instant AI interpretation and differential diagnosis.
                    </p>
                  </CardContent>
                </Card>

                {/* Feature 4 */}
                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <AlertCircle className="w-8 h-8 text-orange-600 mb-2" />
                    <CardTitle>Safe-Truth Reporting</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">
                      Confidential incident reporting. Learn from system gaps. Improve outcomes.
                    </p>
                  </CardContent>
                </Card>

                {/* Feature 5 */}
                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <Trophy className="w-8 h-8 text-yellow-600 mb-2" />
                    <CardTitle>Performance Tracking</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">
                      See your impact. Track lives saved. Compete on leaderboards. Earn badges.
                    </p>
                  </CardContent>
                </Card>

                {/* Feature 6 */}
                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <BookOpen className="w-8 h-8 text-green-600 mb-2" />
                    <CardTitle>Continuous Learning</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">
                      AI-generated courses tailored to your knowledge gaps. Stay current. Get certified.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="bg-red-600 text-white px-4 md:px-8 py-16">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-4xl font-bold mb-4">Ready to Save Lives?</h2>
              <p className="text-xl text-red-100 mb-8">
                Join 500+ healthcare providers who trust Paeds Resus
              </p>
              <Button size="lg" onClick={() => setLocation("/patients")} className="bg-white text-red-600 hover:bg-gray-100">
                Get Started Now <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </section>
        </>
      )}

      {/* PARENT/CAREGIVER HERO */}
      {userRole === "parent" && (
        <>
          {/* Hero Section */}
          <section className="bg-gradient-to-br from-green-50 via-white to-green-50 px-4 md:px-8 py-16 md:py-24">
            <div className="max-w-6xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                <div>
                  <Badge className="mb-4 bg-green-100 text-green-800 hover:bg-green-100">
                    For Parents & Caregivers
                  </Badge>
                  <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                    Be Ready When It Matters Most
                  </h1>
                  <p className="text-xl text-gray-700 mb-8 leading-relaxed">
                    Learn CPR and emergency response in just 30 minutes. Simple, practical, life-saving skills you can use today.
                  </p>
                  <div className="flex gap-4 flex-wrap mb-8">
                    <Button size="lg" onClick={() => setLocation("/enrollment")} className="bg-green-600 hover:bg-green-700">
                      Enroll Now <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                    <Button size="lg" variant="outline" onClick={() => setLocation("/resources")}>
                      Free Resources
                    </Button>
                  </div>
                  <p className="text-sm text-gray-600 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    Certificate included. Learn at your own pace.
                  </p>
                </div>

                {/* Trust Signals */}
                <div className="space-y-4">
                  <Card className="border-2 border-green-200 bg-green-50">
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-4">
                        <Heart className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                        <div>
                          <h3 className="font-bold text-green-900 mb-1">10,000+ Parents Trained</h3>
                          <p className="text-sm text-green-800">
                            Join families who are prepared
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-2 border-blue-200 bg-blue-50">
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-4">
                        <Smartphone className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                        <div>
                          <h3 className="font-bold text-blue-900 mb-1">Learn on Your Phone</h3>
                          <p className="text-sm text-blue-800">
                            30-minute lessons. Anytime, anywhere.
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-2 border-purple-200 bg-purple-50">
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-4">
                        <Award className="w-6 h-6 text-purple-600 flex-shrink-0 mt-1" />
                        <div>
                          <h3 className="font-bold text-purple-900 mb-1">Get Certified</h3>
                          <p className="text-sm text-purple-800">
                            Official CPR certificate upon completion
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </section>

          {/* Courses for Parents */}
          <section className="bg-white px-4 md:px-8 py-16">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-3xl font-bold text-center mb-4">Choose Your Course</h2>
              <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
                All courses include video, practice, and certification
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* BLS Course */}
                <Card className="border-2 hover:shadow-lg transition-all">
                  <CardHeader>
                    <CardTitle>Basic Life Support (BLS)</CardTitle>
                    <CardDescription>For infants and children</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 mb-6">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                        <span>CPR techniques for infants and children</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                        <span>Recovery position and choking relief</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                        <span>When and how to call for help</span>
                      </li>
                    </ul>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-green-600">KES 500</span>
                      <Button onClick={() => setLocation("/enrollment")}>Enroll</Button>
                    </div>
                  </CardContent>
                </Card>

                {/* First Aid Course */}
                <Card className="border-2 hover:shadow-lg transition-all">
                  <CardHeader>
                    <CardTitle>First Aid Essentials</CardTitle>
                    <CardDescription>Handle common emergencies</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 mb-6">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                        <span>Wound care and bleeding control</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                        <span>Burns, fractures, and sprains</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                        <span>Fever, allergies, and poisoning</span>
                      </li>
                    </ul>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-green-600">KES 300</span>
                      <Button onClick={() => setLocation("/enrollment")}>Enroll</Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="bg-green-600 text-white px-4 md:px-8 py-16">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-4xl font-bold mb-4">Your Child's Safety Starts Here</h2>
              <p className="text-xl text-green-100 mb-8">
                Start learning CPR today. Be prepared for tomorrow.
              </p>
              <Button size="lg" onClick={() => setLocation("/enrollment")} className="bg-white text-green-600 hover:bg-gray-100">
                Enroll Now <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </section>
        </>
      )}

      {/* INSTITUTION HERO */}
      {userRole === "institution" && (
        <>
          {/* Hero Section */}
          <section className="bg-gradient-to-br from-purple-50 via-white to-purple-50 px-4 md:px-8 py-16 md:py-24">
            <div className="max-w-6xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                <div>
                  <Badge className="mb-4 bg-purple-100 text-purple-800 hover:bg-purple-100">
                    For Institutions
                  </Badge>
                  <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                    Train Your Team. Save Lives.
                  </h1>
                  <p className="text-xl text-gray-700 mb-8 leading-relaxed">
                    Equip your entire staff with clinical decision support and emergency protocols. Proven to improve patient outcomes.
                  </p>
                  <div className="flex gap-4 flex-wrap mb-8">
                    <Button size="lg" onClick={() => setLocation("/institutional-onboarding")} className="bg-purple-600 hover:bg-purple-700">
                      Get a Quote <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                    <Button size="lg" variant="outline" onClick={() => setLocation("/case-studies")}>
                      See Case Studies
                    </Button>
                  </div>
                  <p className="text-sm text-gray-600 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    Free consultation with our team
                  </p>
                </div>

                {/* ROI Signals */}
                <div className="space-y-4">
                  <Card className="border-2 border-green-200 bg-green-50">
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-4">
                        <TrendingUp className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                        <div>
                          <h3 className="font-bold text-green-900 mb-1">40% Faster Response</h3>
                          <p className="text-sm text-green-800">
                            Average time to intervention reduced
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-2 border-blue-200 bg-blue-50">
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-4">
                        <BarChart3 className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                        <div>
                          <h3 className="font-bold text-blue-900 mb-1">Proven ROI</h3>
                          <p className="text-sm text-blue-800">
                            Payback in 6 months. 500+ hospitals trust us.
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-2 border-purple-200 bg-purple-50">
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-4">
                        <Users className="w-6 h-6 text-purple-600 flex-shrink-0 mt-1" />
                        <div>
                          <h3 className="font-bold text-purple-900 mb-1">Bulk Pricing</h3>
                          <p className="text-sm text-purple-800">
                            From KES 2,000 per staff member/year
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </section>

          {/* Institutional Benefits */}
          <section className="bg-white px-4 md:px-8 py-16">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-3xl font-bold text-center mb-4">What Your Institution Gets</h2>
              <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
                Complete system for training, tracking, and improving clinical outcomes
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <Users className="w-8 h-8 text-purple-600 mb-2" />
                    <CardTitle>Bulk Staff Training</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">
                      Train entire departments at once. Bulk pricing starts at KES 2,000 per person/year.
                    </p>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <BarChart3 className="w-8 h-8 text-blue-600 mb-2" />
                    <CardTitle>Institutional Dashboard</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">
                      Track staff performance, outcomes, and compliance. Real-time analytics and reporting.
                    </p>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <Award className="w-8 h-8 text-yellow-600 mb-2" />
                    <CardTitle>Certification Management</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">
                      Automatic certification tracking and renewal reminders. Compliance made easy.
                    </p>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <AlertCircle className="w-8 h-8 text-red-600 mb-2" />
                    <CardTitle>Safe-Truth System</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">
                      Confidential incident reporting. Identify system gaps. Improve patient safety.
                    </p>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <Zap className="w-8 h-8 text-orange-600 mb-2" />
                    <CardTitle>Dedicated Support</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">
                      Implementation team, training, and ongoing support. We ensure success.
                    </p>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <Globe className="w-8 h-8 text-green-600 mb-2" />
                    <CardTitle>Referral Network</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">
                      Connect with 500+ facilities. Seamless patient transfers and peer learning.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </section>

          {/* Pricing Section */}
          <section className="bg-gray-50 px-4 md:px-8 py-16">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-3xl font-bold text-center mb-4">Transparent Pricing</h2>
              <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
                No hidden fees. No long-term contracts. Cancel anytime.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Starter */}
                <Card className="border-2">
                  <CardHeader>
                    <CardTitle>Starter</CardTitle>
                    <CardDescription>For small clinics</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-6">
                      <span className="text-4xl font-bold">KES 2,000</span>
                      <span className="text-gray-600">/person/year</span>
                    </div>
                    <ul className="space-y-2 mb-6">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                        <span>Up to 10 staff</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                        <span>Clinical decision support</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                        <span>Basic reporting</span>
                      </li>
                    </ul>
                    <Button className="w-full" onClick={() => setLocation("/institutional-onboarding")}>
                      Get Started
                    </Button>
                  </CardContent>
                </Card>

                {/* Professional */}
                <Card className="border-2 border-purple-600 relative">
                  <div className="absolute top-0 right-0 bg-purple-600 text-white px-4 py-1 text-sm font-bold rounded-bl-lg">
                    POPULAR
                  </div>
                  <CardHeader>
                    <CardTitle>Professional</CardTitle>
                    <CardDescription>For hospitals</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-6">
                      <span className="text-4xl font-bold">KES 1,500</span>
                      <span className="text-gray-600">/person/year</span>
                    </div>
                    <ul className="space-y-2 mb-6">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                        <span>Up to 100 staff</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                        <span>All Starter features</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                        <span>Safe-Truth reporting</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                        <span>Advanced analytics</span>
                      </li>
                    </ul>
                    <Button className="w-full bg-purple-600 hover:bg-purple-700" onClick={() => setLocation("/institutional-onboarding")}>
                      Get Started
                    </Button>
                  </CardContent>
                </Card>

                {/* Enterprise */}
                <Card className="border-2">
                  <CardHeader>
                    <CardTitle>Enterprise</CardTitle>
                    <CardDescription>For large networks</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-6">
                      <span className="text-4xl font-bold">Custom</span>
                      <span className="text-gray-600">/person/year</span>
                    </div>
                    <ul className="space-y-2 mb-6">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                        <span>Unlimited staff</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                        <span>All Professional features</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                        <span>Dedicated account manager</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                        <span>Custom integrations</span>
                      </li>
                    </ul>
                    <Button variant="outline" className="w-full" onClick={() => setLocation("/institutional-onboarding")}>
                      Contact Sales
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="bg-purple-600 text-white px-4 md:px-8 py-16">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-4xl font-bold mb-4">Ready to Transform Your Institution?</h2>
              <p className="text-xl text-purple-100 mb-8">
                Get a free consultation and custom quote
              </p>
              <Button size="lg" onClick={() => setLocation("/institutional-onboarding")} className="bg-white text-purple-600 hover:bg-gray-100">
                Schedule a Demo <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </section>
        </>
      )}

      {/* Footer */}
      <footer className="bg-gray-900 text-white px-4 md:px-8 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="font-bold mb-4">Paeds Resus</h3>
              <p className="text-gray-400 text-sm">
                AI-powered clinical decision support for pediatric emergencies
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white">Features</a></li>
                <li><a href="#" className="hover:text-white">Pricing</a></li>
                <li><a href="#" className="hover:text-white">Security</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white">About</a></li>
                <li><a href="#" className="hover:text-white">Blog</a></li>
                <li><a href="#" className="hover:text-white">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white">Help Center</a></li>
                <li><a href="#" className="hover:text-white">Privacy</a></li>
                <li><a href="#" className="hover:text-white">Terms</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-sm text-gray-400">
            <p>&copy; 2026 Paeds Resus. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
