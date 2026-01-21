import { useAuth } from "@/_core/hooks/useAuth";
import { useScrollToTop } from "@/hooks/useScrollToTop";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, Brain, Zap, Users, Award, TrendingUp } from "lucide-react";
import { getLoginUrl } from "@/const";
import { Link } from "wouter";

export default function Home() {
  useScrollToTop();
  const { user, isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 text-white py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
                No Child Should Die From Preventable Causes
              </h1>
              <p className="text-xl text-blue-100 mb-8">
                Paeds Resus Limited is transforming paediatric emergency care across Kenya through clinical excellence, systemic transparency, and nurse-led resuscitation.
              </p>
              <div className="flex gap-4">
                {isAuthenticated ? (
                  <>
                    <Link href="/dashboard">
                      <Button size="lg" className="bg-white text-blue-900 hover:bg-blue-50">
                        Go to Dashboard
                      </Button>
                    </Link>
                  </>
                ) : (
                  <>
                    <a href={getLoginUrl()}>
                      <Button size="lg" className="bg-white text-blue-900 hover:bg-blue-50">
                        Get Started
                      </Button>
                    </a>
                    <Link href="/about">
                      <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                        Learn More
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
            <div className="hidden md:block">
              <div className="bg-white/10 backdrop-blur rounded-lg p-8 border border-white/20">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Heart className="w-8 h-8 text-red-400" />
                    <span className="text-lg">500+ Elite Providers Trained</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Brain className="w-8 h-8 text-yellow-400" />
                    <span className="text-lg">Evidence-Based Protocols</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Zap className="w-8 h-8 text-orange-400" />
                    <span className="text-lg">Nurse-Led Excellence</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12">Our Mission</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <Brain className="w-6 h-6 text-blue-900" />
                </div>
                <CardTitle>Clinical Excellence</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Evidence-based protocols delivered by well-trained nurses and clinicians.</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-green-900" />
                </div>
                <CardTitle>Systemic Transparency</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Safe-Truth audits identify system failures, not individual blame.</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <Heart className="w-6 h-6 text-purple-900" />
                </div>
                <CardTitle>Nurse-Led Care</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Well-trained nurses prevent 80-90% of preventable child deaths.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Parent/Caregiver Featured Section */}
      <section className="py-16 px-4 bg-gradient-to-r from-purple-50 to-pink-50">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-4xl font-bold mb-6 text-purple-900">Protect Your Family</h2>
              <p className="text-xl text-gray-700 mb-4">Parents and caregivers can learn life-saving skills to protect children in emergencies.</p>
              <p className="text-gray-600 mb-8">Our courses teach you how to recognize emergencies, perform basic life support, and respond effectively when every second counts.</p>
              <Link href="/parents">
                <Button size="lg" className="bg-purple-900 hover:bg-purple-800">Learn Life-Saving Skills</Button>
              </Link>
            </div>
            <div className="bg-white rounded-lg p-8 shadow-lg">
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <Heart className="w-5 h-5 text-purple-900" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Hands-On Training</h3>
                    <p className="text-sm text-gray-600">Learn practical skills you can use immediately</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <Award className="w-5 h-5 text-purple-900" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Certification</h3>
                    <p className="text-sm text-gray-600">Get recognized for your life-saving knowledge</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <Zap className="w-5 h-5 text-purple-900" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Peace of Mind</h3>
                    <p className="text-sm text-gray-600">Know you can help in an emergency</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Audience Selection Section */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12">Choose Your Path</h2>
          <div className="grid md:grid-cols-2 gap-8">
            {/* Individual Provider */}
            <Link href="/providers">
              <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                    <Award className="w-6 h-6 text-blue-900" />
                  </div>
                  <CardTitle>Individual Provider</CardTitle>
                  <CardDescription>Healthcare Professional</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-6">Get certified in BLS, ACLS, or PALS. Join 500+ elite providers.</p>
                  <Button className="w-full">Explore Programs</Button>
                </CardContent>
              </Card>
            </Link>

            {/* Hospital Admin */}
            <Link href="/institutional">
              <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                    <TrendingUp className="w-6 h-6 text-green-900" />
                  </div>
                  <CardTitle>Hospital Admin</CardTitle>
                  <CardDescription>Institutional Partner</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-6">Train your staff. Reduce mortality. Get bulk discounts.</p>
                  <Button className="w-full">Get Pricing</Button>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 bg-blue-900 text-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold mb-2">500+</div>
              <p className="text-blue-100">Elite Providers Trained</p>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">50+</div>
              <p className="text-blue-100">Institutional Partners</p>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">1000+</div>
              <p className="text-blue-100">Lives Impacted</p>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">80-90%</div>
              <p className="text-blue-100">Preventable Deaths Reduced</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Transform Paediatric Care?</h2>
          <p className="text-xl text-gray-600 mb-8">
            Join hundreds of healthcare professionals and institutions making a difference in child survival.
          </p>
          {!isAuthenticated && (
            <a href={getLoginUrl()}>
              <Button size="lg" className="bg-blue-900 hover:bg-blue-800">
                Get Started Today
              </Button>
            </a>
          )}
        </div>
      </section>
    </div>
  );
}
