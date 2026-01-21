import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, FileText, Video, BookOpen, Award, GraduationCap } from "lucide-react";
import { Link } from "wouter";

export default function Resources() {
  const resources = [
    {
      category: "Guidelines",
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Hero Section */}\n      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <Badge className="mb-4 bg-blue-100 text-blue-800 hover:bg-blue-100">
            Learning Materials
          </Badge>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
            Resources
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Download guides, videos, and study materials to enhance your learning
          </p>
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
          {resources.map((category) => {
            const Icon = category.icon;
            return (
              <div key={category.category}>
                <div className="flex items-center gap-3 mb-8">
                  <Icon className="w-8 h-8 text-blue-600" />
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
                          <Button className="flex-shrink-0">
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

      {/* Additional Resources */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Additional Resources</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>External Links</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-gray-600">Access external resources and references:</p>
                <ul className="space-y-2">
                  <li>
                    <a href="#" className="text-blue-600 hover:underline text-sm">
                      American Heart Association (AHA)
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-blue-600 hover:underline text-sm">
                      World Health Organization (WHO)
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-blue-600 hover:underline text-sm">
                      Kenya Medical Practitioners Board
                    </a>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Community Forum</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-gray-600">Connect with other learners and experts:</p>
                <Button variant="outline" className="w-full">
                  Join Forum
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Request Materials</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-gray-600">Need specific materials? Let us know:</p>
                <Button variant="outline" className="w-full">
                  Submit Request
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to Start Learning?</h2>
          <p className="text-xl text-gray-600 mb-8">
            Enroll in a program and get access to all these resources plus interactive training
          </p>
          <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
            Explore Programs
          </Button>
        </div>
      </section>
    </div>
  );
}
