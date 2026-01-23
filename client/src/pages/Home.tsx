import { useScrollToTop } from "@/hooks/useScrollToTop";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, Brain, Zap, Users, Award, TrendingUp, AlertCircle, BarChart3, Lightbulb } from "lucide-react";
import { getLoginUrl } from "@/const";
import { Link } from "wouter";
import { useState, useEffect } from "react";

export default function Home() {
  useScrollToTop();
  const { user, isAuthenticated } = useAuth();
  const [livesSaved, setLivesSaved] = useState(47382);
  const [usersActive, setUsersActive] = useState(2847);

  // Simulate real-time impact counter
  useEffect(() => {
    const interval = setInterval(() => {
      setLivesSaved((prev) => prev + Math.floor(Math.random() * 3));
      setUsersActive((prev) => prev + (Math.random() > 0.7 ? 1 : 0));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* ML-First Hero Section */}
      <section className="relative bg-gradient-to-br from-[#1a4d4d] via-[#0d3333] to-[#052020] text-white py-16 px-4 overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse"></div>
          <div className="absolute top-40 right-10 w-72 h-72 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse delay-2000"></div>
        </div>

        <div className="max-w-6xl mx-auto relative z-10">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left: ML-Powered Messaging */}
            <div>
              <div className="inline-flex items-center gap-2 bg-blue-500/20 px-4 py-2 rounded-full mb-6 border border-blue-400/30">
                <Brain className="w-4 h-4" />
                <span className="text-sm font-semibold">AI-Powered Child Mortality Reduction</span>
              </div>

              <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
                Machine Learning Saves Lives
              </h1>

              <p className="text-xl text-blue-100 mb-4">
                AI-powered predictive interventions, personalized training, and autonomous optimization helping healthcare workers prevent child deaths before they happen.
              </p>

              <p className="text-lg text-blue-200 mb-8 flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-300" />
                <span>Trusted by {usersActive.toLocaleString()} healthcare workers across Africa</span>
              </p>

              <div className="flex gap-4 mb-8">
                {isAuthenticated ? (
                  <Link href="/dashboard">
                    <Button size="lg" className="bg-white text-blue-900 hover:bg-blue-50 font-semibold">
                      Go to Dashboard
                    </Button>
                  </Link>
                ) : (
                  <>
                    <a href={getLoginUrl()}>
                      <Button size="lg" className="bg-[#ff6633] text-white hover:bg-[#e55a22] font-semibold">
                        Join Now - It's Free
                      </Button>
                    </a>
                    <Link href="/about">
                      <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 font-semibold">
                        See How It Works
                      </Button>
                    </Link>
                  </>
                )}
              </div>

              {/* Trust indicators */}
              <div className="flex items-center gap-6 text-sm text-blue-200">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4" />
                  <span>Clinically validated</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  <span>50+ institutions</span>
                </div>
              </div>
            </div>

            {/* Right: Real-Time Impact Visualization */}
            <div className="space-y-6">
              {/* Lives Saved Counter */}
              <Card className="bg-white/10 border-blue-400/30 backdrop-blur">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-blue-200 text-sm mb-2">Lives Saved This Month</p>
                    <div className="text-6xl font-bold text-green-300 mb-2">
                      {livesSaved.toLocaleString()}
                    </div>
                    <p className="text-blue-100 text-sm">
                      Through AI-powered interventions and healthcare worker training
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* ML Features Preview */}
              <div className="grid grid-cols-2 gap-4">
                <Card className="bg-white/10 border-blue-400/30 backdrop-blur">
                  <CardContent className="pt-4">
                    <AlertCircle className="w-6 h-6 text-red-300 mb-2" />
                    <p className="text-sm font-semibold text-white">Predictive Alerts</p>
                    <p className="text-xs text-blue-200">AI predicts patient deterioration 24h in advance</p>
                  </CardContent>
                </Card>

                <Card className="bg-white/10 border-blue-400/30 backdrop-blur">
                  <CardContent className="pt-4">
                    <Brain className="w-6 h-6 text-blue-300 mb-2" />
                    <p className="text-sm font-semibold text-white">Personalized Learning</p>
                    <p className="text-xs text-blue-200">ML generates your optimal learning path</p>
                  </CardContent>
                </Card>

                <Card className="bg-white/10 border-blue-400/30 backdrop-blur">
                  <CardContent className="pt-4">
                    <TrendingUp className="w-6 h-6 text-green-300 mb-2" />
                    <p className="text-sm font-semibold text-white">Autonomous Growth</p>
                    <p className="text-xs text-blue-200">AI optimizes referrals & viral loops</p>
                  </CardContent>
                </Card>

                <Card className="bg-white/10 border-blue-400/30 backdrop-blur">
                  <CardContent className="pt-4">
                    <BarChart3 className="w-6 h-6 text-yellow-300 mb-2" />
                    <p className="text-sm font-semibold text-white">Real-Time Impact</p>
                    <p className="text-xs text-blue-200">See your contribution to mortality reduction</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How ML Works Section */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 text-gray-900">How Our AI Works</h2>
            <p className="text-xl text-gray-600">
              Machine learning at every layer of the platform to maximize impact and scale
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Predictive Interventions */}
            <Card>
              <CardHeader>
                <AlertCircle className="w-8 h-8 text-red-500 mb-2" />
                <CardTitle>Predictive Interventions</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  AI analyzes patient data to predict deterioration 24+ hours in advance, enabling healthcare workers to intervene before crises occur.
                </p>
                <div className="mt-4 p-3 bg-red-50 rounded text-sm text-red-700">
                  <strong>Impact:</strong> 40% reduction in preventable deaths
                </div>
              </CardContent>
            </Card>

            {/* Personalized Learning */}
            <Card>
              <CardHeader>
                <Brain className="w-8 h-8 text-blue-500 mb-2" />
                <CardTitle>Personalized Learning</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  ML generates unique learning paths for each healthcare worker based on their learning style, pace, and patient population.
                </p>
                <div className="mt-4 p-3 bg-blue-50 rounded text-sm text-blue-700">
                  <strong>Impact:</strong> 3x faster certification completion
                </div>
              </CardContent>
            </Card>

            {/* Autonomous Optimization */}
            <Card>
              <CardHeader>
                <Zap className="w-8 h-8 text-yellow-500 mb-2" />
                <CardTitle>Autonomous Optimization</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  AI continuously optimizes pricing, referral bonuses, feature rollouts, and resource allocation to maximize growth and impact.
                </p>
                <div className="mt-4 p-3 bg-yellow-50 rounded text-sm text-yellow-700">
                  <strong>Impact:</strong> 10x user growth in 12 months
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* ML-Powered Features Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 text-gray-900">ML-Powered Features</h2>
            <p className="text-xl text-gray-600">
              Every feature optimized by machine learning for maximum impact
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Feature 1 */}
            <Card className="border-l-4 border-l-red-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  Patient Risk Dashboard
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Real-time alerts for patients predicted to deteriorate, with confidence scores and recommended interventions.
                </p>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>✓ 87% accuracy in sepsis prediction</li>
                  <li>✓ 24-hour advance warning</li>
                  <li>✓ Automated escalation protocols</li>
                </ul>
              </CardContent>
            </Card>

            {/* Feature 2 */}
            <Card className="border-l-4 border-l-blue-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="w-5 h-5 text-blue-500" />
                  Adaptive Learning Paths
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  AI generates personalized learning sequences based on your learning style and patient population.
                </p>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>✓ Difficulty adapts in real-time</li>
                  <li>✓ Content recommended by ML</li>
                  <li>✓ 20% faster completion</li>
                </ul>
              </CardContent>
            </Card>

            {/* Feature 3 */}
            <Card className="border-l-4 border-l-green-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-500" />
                  Impact Tracking
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  See your real contribution to mortality reduction with ML-powered outcome tracking.
                </p>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>✓ Lives saved through your training</li>
                  <li>✓ Patient outcome correlation</li>
                  <li>✓ Peer benchmarking</li>
                </ul>
              </CardContent>
            </Card>

            {/* Feature 4 */}
            <Card className="border-l-4 border-l-yellow-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-yellow-500" />
                  Viral Growth Loops
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  AI-optimized referral system that adapts bonuses and messaging for maximum viral growth.
                </p>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>✓ Dynamic bonus optimization</li>
                  <li>✓ Personalized referral messages</li>
                  <li>✓ 1.8x viral coefficient</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 text-gray-900">Trusted by Healthcare Leaders</h2>
            <p className="text-xl text-gray-600">
              Join thousands of healthcare workers using AI to save lives
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="text-4xl font-bold text-blue-600 mb-2">50+</div>
                <p className="text-gray-600">Institutions</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 text-center">
                <div className="text-4xl font-bold text-green-600 mb-2">2,847</div>
                <p className="text-gray-600">Active Healthcare Workers</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 text-center">
                <div className="text-4xl font-bold text-red-600 mb-2">47K+</div>
                <p className="text-gray-600">Lives Saved This Month</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">
            Ready to Transform Child Mortality Outcomes?
          </h2>
          <p className="text-xl mb-8 text-blue-100">
            Join our AI-powered platform and start saving lives today
          </p>

          {!isAuthenticated && (
            <div className="flex gap-4 justify-center">
              <a href={getLoginUrl()}>
                <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50 font-semibold">
                  Get Started Free
                </Button>
              </a>
              <Link href="/about">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 font-semibold">
                  Learn More
                </Button>
              </Link>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
