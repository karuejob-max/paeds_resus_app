import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Heart,
  Clock,
  Users,
  Award,
  ArrowRight,
  CheckCircle2,
  Zap,
  Shield,
} from "lucide-react";
import { getLoginUrl } from "@/const";

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  // If user is logged in, redirect to appropriate dashboard
  if (isAuthenticated) {
    if (user?.role === "admin" || user?.role === "provider") {
      setLocation("/provider-dashboard");
    } else if (user?.role === "parent") {
      setLocation("/learner-dashboard");
    } else {
      setLocation("/institutional-dashboard");
    }
    return null;
  }

  return (
    <div className="min-h-screen bg-white">
      {/* HERO SECTION - Single, Compelling CTA */}
      <section className="bg-gradient-to-br from-red-50 via-white to-red-50 px-4 md:px-8 py-20 md:py-32">
        <div className="max-w-4xl mx-auto text-center">
          {/* Main Headline */}
          <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight">
            Save a Child's Life
            <br />
            <span className="text-red-600">in 30 Seconds</span>
          </h1>

          {/* Subheadline */}
          <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
            Master pediatric resuscitation with AI-powered clinical decision support. Learn CPR, get certified, and save lives.
          </p>

          {/* Primary CTA */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <a href={getLoginUrl()}>
              <Button className="bg-red-600 hover:bg-red-700 h-14 px-8 text-lg">
                Get Started Now <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </a>
            <Button
              variant="outline"
              className="h-14 px-8 text-lg"
              onClick={() => {
                document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              Learn More
            </Button>
          </div>

          {/* Trust Signal */}
          <p className="text-sm text-gray-600">
            ✓ No credit card required • ✓ Start in 60 seconds • ✓ 10,000+ trained
          </p>
        </div>
      </section>

      {/* HOW IT WORKS - Progressive Disclosure */}
      <section id="how-it-works" className="px-4 md:px-8 py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16">How It Works</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1: Learn */}
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold mb-3">1. Learn</h3>
              <p className="text-gray-600">
                Access video lessons, interactive modules, and practice scenarios at your own pace.
              </p>
            </div>

            {/* Step 2: Practice */}
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold mb-3">2. Practice</h3>
              <p className="text-gray-600">
                Use our CPR simulator and interactive tools to build muscle memory and confidence.
              </p>
            </div>

            {/* Step 3: Get Certified */}
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold mb-3">3. Get Certified</h3>
              <p className="text-gray-600">
                Complete assessments and receive official certificates valid worldwide.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES - What You Get */}
      <section className="px-4 md:px-8 py-20">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16">Why Choose Paeds Resus?</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Feature 1 */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex gap-4">
                  <Shield className="w-8 h-8 text-red-600 flex-shrink-0" />
                  <div>
                    <h3 className="font-bold text-lg mb-2">AI-Powered Support</h3>
                    <p className="text-gray-600">
                      Real-time clinical decision support for pediatric emergencies.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Feature 2 */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex gap-4">
                  <Clock className="w-8 h-8 text-blue-600 flex-shrink-0" />
                  <div>
                    <h3 className="font-bold text-lg mb-2">Learn at Your Pace</h3>
                    <p className="text-gray-600">
                      Complete courses in as little as 30 minutes, anytime, anywhere.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Feature 3 */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex gap-4">
                  <Award className="w-8 h-8 text-green-600 flex-shrink-0" />
                  <div>
                    <h3 className="font-bold text-lg mb-2">Official Certificates</h3>
                    <p className="text-gray-600">
                      Get recognized certifications for BLS, ACLS, PALS, and more.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Feature 4 */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex gap-4">
                  <Users className="w-8 h-8 text-purple-600 flex-shrink-0" />
                  <div>
                    <h3 className="font-bold text-lg mb-2">For Everyone</h3>
                    <p className="text-gray-600">
                      Healthcare providers, parents, schools, and institutions.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* SOCIAL PROOF - Trust Signals */}
      <section className="px-4 md:px-8 py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <p className="text-4xl font-bold text-red-600 mb-2">10,000+</p>
              <p className="text-gray-600">Healthcare providers trained</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-blue-600 mb-2">50,000+</p>
              <p className="text-gray-600">Lives potentially saved</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-green-600 mb-2">100%</p>
              <p className="text-gray-600">Official certification rate</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA SECTION - Final Call to Action */}
      <section className="px-4 md:px-8 py-20 bg-gradient-to-r from-red-600 to-red-700 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Save Lives?</h2>
          <p className="text-xl mb-8 text-red-100">
            Start your journey to becoming a certified pediatric resuscitation expert today.
          </p>
          <a href={getLoginUrl()}>
            <Button className="bg-white text-red-600 hover:bg-gray-100 h-14 px-8 text-lg">
              Get Started Now <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </a>
        </div>
      </section>

      {/* FOOTER - Minimal */}
      <footer className="bg-gray-900 text-gray-400 px-4 md:px-8 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="text-white font-bold mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="hover:text-white">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Pricing
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Security
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="hover:text-white">
                    About
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Contact
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">Support</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="hover:text-white">
                    Help Center
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Privacy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Terms
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">Connect</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="hover:text-white">
                    Twitter
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    LinkedIn
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Facebook
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-sm">
            <p>© 2026 Paeds Resus. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
