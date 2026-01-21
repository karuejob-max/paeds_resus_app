import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, Users, Lightbulb, Share2, MessageCircle } from "lucide-react";
import { Link } from "wouter";

export default function RemembranceModule() {
  const [selectedTab, setSelectedTab] = useState<"story" | "support" | "impact">("story");

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-12 text-center">
          <Heart className="w-12 h-12 text-purple-600 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Remembrance & Learning</h1>
          <p className="text-lg text-gray-600">
            Honor your child's memory while helping improve care for other children
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-4 mb-8 border-b border-gray-200">
          {[
            { id: "story", label: "Share Your Story", icon: MessageCircle },
            { id: "support", label: "Find Support", icon: Users },
            { id: "impact", label: "See the Impact", icon: Lightbulb },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id as any)}
                className={`flex items-center gap-2 px-6 py-3 border-b-2 transition-colors ${
                  selectedTab === tab.id
                    ? "border-purple-600 text-purple-600"
                    : "border-transparent text-gray-600 hover:text-gray-900"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Share Your Story Tab */}
        {selectedTab === "story" && (
          <div className="space-y-8">
            <Card className="border-2 border-purple-200">
              <CardHeader>
                <CardTitle>Your Child's Story</CardTitle>
                <CardDescription>
                  Share your child's journey and the lessons learned to help improve hospital care
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-4">What We'd Like to Know</h3>
                  <ul className="space-y-3 text-gray-700">
                    <li className="flex gap-3">
                      <span className="text-purple-600 font-bold">•</span>
                      <span>Your child's name and age</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="text-purple-600 font-bold">•</span>
                      <span>What happened and when</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="text-purple-600 font-bold">•</span>
                      <span>Areas where care could have been better</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="text-purple-600 font-bold">•</span>
                      <span>What you wish had been different</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="text-purple-600 font-bold">•</span>
                      <span>Your recommendations for improvement</span>
                    </li>
                  </ul>
                </div>

                <Link href="/parent-safe-truth">
                  <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3">
                    <Heart className="w-4 h-4 mr-2" />
                    Share Your Child's Timeline
                  </Button>
                </Link>

                <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <p className="text-sm text-purple-900">
                    <strong>Your Privacy:</strong> You can choose to remain anonymous or share your name.
                    Your story will be treated with utmost respect and confidentiality.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Find Support Tab */}
        {selectedTab === "support" && (
          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Grief Support Resources</CardTitle>
                <CardDescription>You are not alone. Here are resources to help you heal</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {[
                  {
                    title: "Support Groups",
                    description: "Connect with other parents who have experienced similar loss",
                    icon: Users,
                  },
                  {
                    title: "Counseling Services",
                    description: "Professional grief counseling and mental health support",
                    icon: Heart,
                  },
                  {
                    title: "Spiritual Resources",
                    description: "Faith-based support and spiritual guidance",
                    icon: Heart,
                  },
                  {
                    title: "Community Events",
                    description: "Memorial events and community gatherings",
                    icon: Users,
                  },
                ].map((resource, index) => {
                  const Icon = resource.icon;
                  return (
                    <Card key={index} className="border border-gray-200">
                      <CardContent className="pt-6">
                        <div className="flex gap-4">
                          <Icon className="w-6 h-6 text-purple-600 flex-shrink-0" />
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 mb-2">{resource.title}</h3>
                            <p className="text-gray-600 text-sm mb-4">{resource.description}</p>
                            <Button variant="outline" size="sm">
                              Learn More
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </CardContent>
            </Card>
          </div>
        )}

        {/* See the Impact Tab */}
        {selectedTab === "impact" && (
          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>How Your Story Creates Change</CardTitle>
                <CardDescription>See the real impact of parent feedback on hospital improvements</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[
                    {
                      metric: "127",
                      label: "Hospital Improvements",
                      description: "Based on parent feedback",
                    },
                    {
                      metric: "2,450",
                      label: "Staff Trained",
                      description: "On communication and care gaps",
                    },
                    {
                      metric: "89%",
                      label: "Reduced Delays",
                      description: "In critical interventions",
                    },
                    {
                      metric: "1,200+",
                      label: "Lives Improved",
                      description: "Through systemic changes",
                    },
                  ].map((item, index) => (
                    <Card key={index} className="bg-purple-50 border-purple-200">
                      <CardContent className="pt-6 text-center">
                        <p className="text-4xl font-bold text-purple-600 mb-2">{item.metric}</p>
                        <p className="font-semibold text-gray-900 mb-1">{item.label}</p>
                        <p className="text-sm text-gray-600">{item.description}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <Card className="border-l-4 border-l-purple-600 bg-purple-50">
                  <CardContent className="pt-6">
                    <h3 className="font-semibold text-gray-900 mb-3">Recent Improvements</h3>
                    <ul className="space-y-2 text-sm text-gray-700">
                      <li>✓ 24/7 parent communication protocols implemented</li>
                      <li>✓ Reduced average doctor response time from 45 to 15 minutes</li>
                      <li>✓ New monitoring equipment in 45 hospitals</li>
                      <li>✓ Staff training on compassionate care completed</li>
                    </ul>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Bottom CTA */}
        <div className="mt-12 text-center">
          <p className="text-gray-600 mb-6">
            Your child's memory can make a real difference. Thousands of families are safer because of parents like you.
          </p>
          <Link href="/parent-safe-truth">
            <Button className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3">
              <Share2 className="w-4 h-4 mr-2" />
              Share Your Story Today
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
