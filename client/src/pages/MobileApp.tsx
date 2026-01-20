import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Smartphone,
  Download,
  Star,
  Users,
  Zap,
  Lock,
  Wifi,
  Bell,
  BookOpen,
  Award,
  Share2,
  Apple,
  Play,
  CheckCircle2,
} from "lucide-react";

export default function MobileApp() {
  const features = [
    {
      icon: Wifi,
      title: "Offline Access",
      description: "Download courses and access offline anywhere, anytime",
    },
    {
      icon: Bell,
      title: "Smart Notifications",
      description: "Personalized reminders and course updates",
    },
    {
      icon: Zap,
      title: "Lightning Fast",
      description: "Optimized for speed on all network conditions",
    },
    {
      icon: Lock,
      title: "Secure",
      description: "Enterprise-grade encryption and security",
    },
    {
      icon: BookOpen,
      title: "Rich Content",
      description: "Videos, quizzes, and interactive lessons",
    },
    {
      icon: Award,
      title: "Achievements",
      description: "Earn badges and track your progress",
    },
  ];

  const appStats = [
    { label: "Downloads", value: "150K+", icon: Download },
    { label: "Rating", value: "4.8★", icon: Star },
    { label: "Active Users", value: "45K+", icon: Users },
    { label: "Courses", value: "500+", icon: BookOpen },
  ];

  const reviews = [
    {
      name: "Dr. James Mwangi",
      role: "Pediatrician",
      rating: 5,
      text: "The mobile app makes it so easy to learn on the go. Perfect for busy healthcare professionals.",
    },
    {
      name: "Sarah Kipchoge",
      role: "Nurse",
      rating: 5,
      text: "Love the offline feature. I can study during my commute without worrying about data.",
    },
    {
      name: "Prof. Emily Okonkwo",
      role: "Medical Director",
      rating: 4.5,
      text: "Great app. The push notifications keep our team engaged and on track.",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Hero */}
      <section className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="flex items-center gap-4 mb-6">
                <Smartphone className="w-12 h-12" />
                <h1 className="text-4xl font-bold">Mobile App</h1>
              </div>
              <p className="text-xl text-blue-100 mb-8">
                Learn anytime, anywhere. Download the Paeds Resus app and access world-class training on your mobile device.
              </p>
              <div className="flex gap-4 flex-wrap">
                <Button className="bg-white text-blue-900 hover:bg-blue-50">
                  <Apple className="w-5 h-5 mr-2" />
                  Download for iOS
                </Button>
                <Button className="bg-white text-blue-900 hover:bg-blue-50">
                  <Play className="w-5 h-5 mr-2" />
                  Download for Android
                </Button>
              </div>
            </div>
            <div className="flex justify-center">
              <div className="relative w-64 h-96 bg-gradient-to-br from-blue-400 to-indigo-600 rounded-3xl shadow-2xl flex items-center justify-center">
                <div className="text-center text-white">
                  <Smartphone className="w-32 h-32 mx-auto opacity-50" />
                  <p className="mt-4 text-lg font-semibold">Mobile App Preview</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* App Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-16">
          {appStats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index}>
                <CardContent className="pt-6 text-center">
                  <Icon className="w-8 h-8 text-blue-600 mx-auto mb-4" />
                  <p className="text-3xl font-bold text-slate-900">{stat.value}</p>
                  <p className="text-slate-600 mt-2">{stat.label}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Features */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-slate-900 mb-12 text-center">Powerful Features</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardContent className="pt-6">
                    <Icon className="w-8 h-8 text-blue-600 mb-4" />
                    <h3 className="font-bold text-slate-900 mb-2">{feature.title}</h3>
                    <p className="text-slate-600 text-sm">{feature.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Screenshots */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-slate-900 mb-12 text-center">App Screenshots</h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { title: "Dashboard", desc: "Track your progress" },
              { title: "Courses", desc: "Browse all courses" },
              { title: "Lessons", desc: "Interactive learning" },
              { title: "Achievements", desc: "Earn badges" },
            ].map((screen, index) => (
              <Card key={index}>
                <CardContent className="pt-6">
                  <div className="bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg h-64 flex items-center justify-center mb-4">
                    <Smartphone className="w-24 h-24 text-blue-300" />
                  </div>
                  <p className="font-bold text-slate-900">{screen.title}</p>
                  <p className="text-sm text-slate-600">{screen.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* System Requirements */}
        <Card className="mb-16">
          <CardHeader>
            <CardTitle>System Requirements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Apple className="w-5 h-5" />
                  iOS Requirements
                </h3>
                <ul className="space-y-2 text-slate-600">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                    iOS 14.0 or later
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                    150 MB storage space
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                    Compatible with iPhone 11+
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Play className="w-5 h-5" />
                  Android Requirements
                </h3>
                <ul className="space-y-2 text-slate-600">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                    Android 9.0 or later
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                    200 MB storage space
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                    2GB RAM minimum
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Reviews */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-slate-900 mb-12 text-center">User Reviews</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {reviews.map((review, index) => (
              <Card key={index}>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < Math.floor(review.rating)
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-slate-300"
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-slate-600 mb-4">{review.text}</p>
                  <div>
                    <p className="font-bold text-slate-900">{review.name}</p>
                    <p className="text-sm text-slate-600">{review.role}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Premium Features */}
        <Card className="mb-16">
          <CardHeader>
            <CardTitle>Premium Features</CardTitle>
            <CardDescription>Unlock advanced features with a subscription</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              {[
                "Unlimited offline downloads",
                "Priority support",
                "Advanced analytics",
                "Custom learning paths",
                "Early access to new courses",
                "Exclusive webinars",
              ].map((feature, index) => (
                <div key={index} className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0" />
                  <span className="text-slate-700">{feature}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* CTA */}
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="pt-8">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-slate-900 mb-4">Download Now</h3>
              <p className="text-slate-600 mb-8 max-w-2xl mx-auto">
                Join 150,000+ healthcare professionals learning on the Paeds Resus mobile app.
              </p>
              <div className="flex gap-4 justify-center flex-wrap">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                  <Apple className="w-5 h-5 mr-2" />
                  App Store
                </Button>
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                  <Play className="w-5 h-5 mr-2" />
                  Google Play
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
