import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Heart, Shield, Users, AlertCircle, TrendingUp } from "lucide-react";
import { Link } from "wouter";

export default function ParentHub() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      {/* Hero Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
            Welcome to Your Parent Hub
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Learn essential pediatric emergency care skills to protect your child and family
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/courses">
              <Button className="bg-green-600 hover:bg-green-700 text-white px-8 py-3">
                Explore Courses
              </Button>
            </Link>
            <Link href="/safe-truth">
              <Button variant="outline" className="px-8 py-3 border-green-600 text-green-600">
                Share Your Story
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <BookOpen className="w-8 h-8 text-green-600 mb-2" />
                <CardTitle>Learn Emergency Care</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Take our courses on pediatric first aid, CPR, and emergency response
                </p>
                <Link href="/courses">
                  <Button variant="outline" className="w-full">
                    Start Learning
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <Heart className="w-8 h-8 text-red-600 mb-2" />
                <CardTitle>Share Your Experience</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Tell us about your child's healthcare journey to help improve hospital care
                </p>
                <Link href="/parent-safe-truth">
                  <Button variant="outline" className="w-full">
                    Share Story
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <Shield className="w-8 h-8 text-blue-600 mb-2" />
                <CardTitle>Emergency Resources</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Access guides, checklists, and emergency contact information
                </p>
                <Link href="/resources">
                  <Button variant="outline" className="w-full">
                    View Resources
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Featured Courses */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Popular Courses</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-l-4 border-l-green-600">
              <CardHeader>
                <CardTitle>Pediatric First Aid Basics</CardTitle>
                <CardDescription>3 hours • Beginner</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Learn essential first aid skills for children including wound care, choking, and burns
                </p>
                <Button className="bg-green-600 hover:bg-green-700 w-full">Enroll Now</Button>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-green-600">
              <CardHeader>
                <CardTitle>CPR for Parents</CardTitle>
                <CardDescription>2 hours • Beginner</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Master CPR techniques for infants and children to save lives in emergencies
                </p>
                <Button className="bg-green-600 hover:bg-green-700 w-full">Enroll Now</Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Community Section */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-green-50">
        <div className="max-w-6xl mx-auto text-center">
          <Users className="w-12 h-12 text-green-600 mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Join Our Community</h2>
          <p className="text-lg text-gray-600 mb-8">
            Connect with other parents, share experiences, and learn from experts
          </p>
          <Link href="/community">
            <Button className="bg-green-600 hover:bg-green-700 text-white px-8 py-3">
              Join Community
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
