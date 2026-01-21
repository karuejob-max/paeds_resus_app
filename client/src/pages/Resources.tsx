import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, FileText, Video, BookOpen, Award, MessageCircle, Lock, LogIn } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";

export default function Resources() {
  const { isAuthenticated, user } = useAuth();
  const [activeTab, setActiveTab] = useState<"parent" | "provider">("parent");

  // Parent/Caregiver Resources
  const parentResources = [
    {
      category: "Emergency Preparedness",
      icon: FileText,
      items: [
        {
          title: "When to Call Emergency Services",
          description: "Guide for parents on recognizing emergencies and calling for help",
          type: "PDF",
          size: "1.2 MB",
          downloads: 3200,
        },
        {
          title: "Home First Aid Kit Checklist",
          description: "Essential items every home should have for emergencies",
          type: "PDF",
          size: "0.8 MB",
          downloads: 2100,
        },
        {
          title: "Pediatric CPR for Parents",
          description: "Step-by-step guide for parents to learn CPR",
          type: "PDF",
          size: "1.5 MB",
          downloads: 4500,
        },
      ],
    },
    {
      category: "Child Health Videos",
      icon: Video,
      items: [
        {
          title: "Recognizing Signs of Distress in Children",
          description: "Video guide for parents to identify when a child needs medical help",
          type: "Video",
          duration: "8 min",
          downloads: 2800,
        },
        {
          title: "Basic First Aid for Common Injuries",
          description: "How to handle cuts, burns, and other common childhood injuries",
          type: "Video",
          duration: "10 min",
          downloads: 3100,
        },
        {
          title: "Fever Management at Home",
          description: "Understanding and managing fever in children",
          type: "Video",
          duration: "7 min",
          downloads: 2400,
        },
      ],
    },
    {
      category: "Health Information",
      icon: BookOpen,
      items: [
        {
          title: "Common Childhood Illnesses Guide",
          description: "Information about common illnesses and when to seek care",
          type: "PDF",
          size: "2.1 MB",
          downloads: 1950,
        },
        {
          title: "Immunization Schedule",
          description: "Kenya's recommended childhood immunization schedule",
          type: "PDF",
          size: "0.9 MB",
          downloads: 1650,
        },
        {
          title: "Nutrition for Growing Children",
          description: "Guide to proper nutrition for healthy child development",
          type: "PDF",
          size: "1.8 MB",
          downloads: 1420,
        },
      ],
    },
  ];

  // Healthcare Provider Resources
  const providerResources = [
    {
      category: "Clinical Protocols",
      icon: FileText,
      items: [
        {
          title: "Pediatric Advanced Life Support (PALS) Guidelines",
          description: "Comprehensive guidelines for advanced pediatric life support",
          type: "PDF",
          size: "2.4 MB",
          downloads: 1250,
        },
        {
          title: "Neonatal Resuscitation Program (NRP)",
          description: "Evidence-based neonatal resuscitation protocols",
          type: "PDF",
          size: "1.8 MB",
          downloads: 980,
        },
        {
          title: "Pediatric Trauma Management",
          description: "Comprehensive trauma management for pediatric patients",
          type: "PDF",
          size: "3.2 MB",
          downloads: 750,
        },
      ],
    },
    {
      category: "Video Tutorials",
      icon: Video,
      items: [
        {
          title: "CPR Techniques for Children",
          description: "Step-by-step video guide for pediatric CPR",
          type: "Video",
          duration: "12 min",
          downloads: 2100,
        },
        {
          title: "Airway Management Procedures",
          description: "Detailed video on airway intubation techniques",
          type: "Video",
          duration: "18 min",
          downloads: 1680,
        },
        {
          title: "Shock Recognition and Management",
          description: "Video guide on recognizing and managing shock in children",
          type: "Video",
          duration: "15 min",
          downloads: 1420,
        },
      ],
    },
    {
      category: "Study Materials",
      icon: BookOpen,
      items: [
        {
          title: "Pediatric Emergency Medicine Handbook",
          description: "Complete reference handbook for pediatric emergencies",
          type: "PDF",
          size: "5.6 MB",
          downloads: 890,
        },
        {
          title: "Case Study Collection",
          description: "Real-world case studies for learning and practice",
          type: "PDF",
          size: "2.1 MB",
          downloads: 650,
        },
        {
          title: "Quick Reference Cards",
          description: "Printable quick reference cards for emergency procedures",
          type: "PDF",
          size: "1.2 MB",
          downloads: 1950,
        },
      ],
    },
    {
      category: "Certification Prep",
      icon: Award,
      items: [
        {
          title: "PALS Exam Preparation Guide",
          description: "Complete study guide for PALS certification exam",
          type: "PDF",
          size: "3.4 MB",
          downloads: 2340,
        },
        {
          title: "Practice Exam Questions",
          description: "500+ practice questions with detailed explanations",
          type: "PDF",
          size: "2.8 MB",
          downloads: 1780,
        },
        {
          title: "Certification Requirements Checklist",
          description: "Comprehensive checklist for certification requirements",
          type: "PDF",
          size: "0.8 MB",
          downloads: 1120,
        },
      ],
    },
  ];

  // Provider Communication Channels
  const providerChannels = [
    {
      name: "Telegram - Resources",
      icon: MessageCircle,
      url: "https://t.me/paedsresuscriticalcare",
      description: "Books, guidelines, and updates on paediatric emergencies",
    },
    {
      name: "Telegram - Cardiology",
      icon: MessageCircle,
      url: "https://t.me/paedsresus",
      description: "Paediatric cardiology resources",
    },
    {
      name: "WhatsApp Channel",
      icon: MessageCircle,
      url: "https://whatsapp.com/channel/0029Vaax0toBadmcRFz4S81r",
      description: "Healthcare provider updates and resources",
    },
  ];

  const currentResources = activeTab === "parent" ? parentResources : providerResources;

  // Authentication gate
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#1a4d4d] to-[#0d3333] flex items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Lock className="w-12 h-12 mx-auto text-[#ff6633] mb-4" />
            <CardTitle className="text-2xl">Access Resources</CardTitle>
            <CardDescription>Sign in to access our comprehensive resource library</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              Our resources are designed specifically for our community members. Sign in to access:
            </p>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-center gap-2">
                <span className="text-[#ff6633]">✓</span> Clinical protocols and guidelines
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[#ff6633]">✓</span> Training materials and videos
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[#ff6633]">✓</span> Case studies and best practices
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[#ff6633]">✓</span> Certification preparation materials
              </li>
            </ul>
            <a href={getLoginUrl()} className="block">
              <Button className="w-full bg-[#ff6633] hover:bg-[#e55a22] text-white">
                <LogIn className="w-4 h-4 mr-2" />
                Sign In to Access Resources
              </Button>
            </a>
            <p className="text-xs text-center text-gray-500">
              Don't have an account? <a href={getLoginUrl()} className="text-[#ff6633] hover:underline">Sign up now</a>
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-[#1a4d4d] to-[#0d3333] text-white">
        <div className="max-w-4xl mx-auto text-center">
          <Badge className="mb-4 bg-[#ff6633] text-white hover:bg-[#e55a22]">
            Knowledge Hub
          </Badge>
          <h1 className="text-4xl sm:text-5xl font-bold mb-6">
            Resources & Learning Materials
          </h1>
          <p className="text-xl text-gray-200">
            Access comprehensive resources tailored for your role
          </p>
        </div>
      </section>

      {/* Tab Navigation */}
      <section className="py-8 px-4 sm:px-6 lg:px-8 border-b border-gray-200">
        <div className="max-w-6xl mx-auto">
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => setActiveTab("parent")}
              className={`px-6 py-3 rounded-lg font-semibold transition ${
                activeTab === "parent"
                  ? "bg-[#1a4d4d] text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              👨‍👩‍👧 Parent/Caregiver Resources
            </button>
            <button
              onClick={() => setActiveTab("provider")}
              className={`px-6 py-3 rounded-lg font-semibold transition ${
                activeTab === "provider"
                  ? "bg-[#1a4d4d] text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              👨‍⚕️ Healthcare Provider Resources
            </button>
          </div>
        </div>
      </section>

      {/* Learning Programs Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-blue-50 border-b border-blue-200">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold mb-8 text-center">Learning Programs</h2>
          <div className="grid md:grid-cols-5 gap-4">
            <Link href="/elite-fellowship">
              <Card className="hover:shadow-lg transition cursor-pointer">
                <CardContent className="pt-6 text-center">
                  <div className="text-4xl mb-3">🎓</div>
                  <h3 className="font-semibold text-sm">Elite Fellowship</h3>
                  <p className="text-xs text-gray-600 mt-1">Mastery program</p>
                </CardContent>
              </Card>
            </Link>
            <Link href="/safe-truth">
              <Card className="hover:shadow-lg transition cursor-pointer">
                <CardContent className="pt-6 text-center">
                  <div className="text-4xl mb-3">🛠️</div>
                  <h3 className="font-semibold text-sm">Safe-Truth Tool</h3>
                  <p className="text-xs text-gray-600 mt-1">Assessment tool</p>
                </CardContent>
              </Card>
            </Link>
            <Link href="/training-schedules">
              <Card className="hover:shadow-lg transition cursor-pointer">
                <CardContent className="pt-6 text-center">
                  <div className="text-4xl mb-3">📅</div>
                  <h3 className="font-semibold text-sm">Training Schedules</h3>
                  <p className="text-xs text-gray-600 mt-1">Upcoming courses</p>
                </CardContent>
              </Card>
            </Link>
            <Link href="/aha-elearning">
              <Card className="hover:shadow-lg transition cursor-pointer">
                <CardContent className="pt-6 text-center">
                  <div className="text-4xl mb-3">❤️</div>
                  <h3 className="font-semibold text-sm">AHA eLearning</h3>
                  <p className="text-xs text-gray-600 mt-1">Online courses</p>
                </CardContent>
              </Card>
            </Link>
            <Link href="/success-stories">
              <Card className="hover:shadow-lg transition cursor-pointer">
                <CardContent className="pt-6 text-center">
                  <div className="text-4xl mb-3">⭐</div>
                  <h3 className="font-semibold text-sm">Success Stories</h3>
                  <p className="text-xs text-gray-600 mt-1">Learn from others</p>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </section>

      {/* Resources by Category */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto space-y-12">
          {currentResources.map((category) => {
            const Icon = category.icon;
            return (
              <div key={category.category}>
                <div className="flex items-center gap-3 mb-8">
                  <Icon className="w-8 h-8 text-[#1a4d4d]" />
                  <h2 className="text-3xl font-bold">{category.category}</h2>
                </div>

                <div className="grid gap-4">
                  {category.items.map((item, idx) => (
                    <Card key={idx} className="hover:shadow-lg transition-shadow">
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                              {item.title}
                            </h3>
                            <p className="text-gray-600 mb-4">{item.description}</p>
                            <div className="flex flex-wrap gap-3">
                              <Badge variant="outline">
                                {item.type}
                              </Badge>
                              <Badge variant="secondary">
                                {"size" in item ? `${item.size}` : `${item.duration}`}
                              </Badge>
                              <span className="text-sm text-gray-500">
                                {item.downloads} downloads
                              </span>
                            </div>
                          </div>
                          <Button className="flex-shrink-0 bg-[#ff6633] hover:bg-[#e55a22]">
                            <Download className="w-4 h-4 mr-2" />
                            Download
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Provider Communication Channels - Only for Providers */}
      {activeTab === "provider" && (
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50 border-t border-gray-200">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold mb-4 text-center">Healthcare Provider Channels</h2>
            <p className="text-center text-gray-600 mb-8">
              Join our exclusive channels for resources, updates, and professional development
            </p>
            <div className="grid md:grid-cols-3 gap-6">
              {providerChannels.map((channel) => (
                <a
                  key={channel.name}
                  href={channel.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-white hover:shadow-lg border border-gray-200 p-6 rounded-lg transition"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <channel.icon className="w-6 h-6 text-[#ff6633]" />
                    <span className="font-semibold text-gray-900">{channel.name}</span>
                  </div>
                  <p className="text-sm text-gray-600">{channel.description}</p>
                </a>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">Need More Support?</h2>
          <p className="text-xl text-gray-600 mb-8">
            {activeTab === "parent"
              ? "Have questions about your child's health? Contact our support team."
              : "Looking for specific clinical resources? Use our AI assistant for instant support."}
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/contact">
              <Button className="bg-[#1a4d4d] hover:bg-[#0d3333]">
                Contact Support
              </Button>
            </Link>
            {activeTab === "provider" && (
              <Button className="bg-[#ff6633] hover:bg-[#e55a22]">
                Chat with AI Assistant
              </Button>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
