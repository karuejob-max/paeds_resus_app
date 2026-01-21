import { useState } from "react";
import { useScrollToTop } from "@/hooks/useScrollToTop";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search,
  Filter,
  Star,
  Users,
  TrendingUp,
  DollarSign,
  Upload,
  Eye,
  Heart,
  Share2,
  Award,
  BookOpen,
} from "lucide-react";

export default function InstructorMarketplace() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");

  const instructors = [
    {
      id: 1,
      name: "Dr. Sarah Mwangi",
      specialty: "Pediatric Resuscitation",
      rating: 4.9,
      reviews: 456,
      students: 3200,
      earnings: 450000,
      courses: 5,
      image: "https://via.placeholder.com/100",
      verified: true,
      topCourse: "Advanced PALS",
    },
    {
      id: 2,
      name: "Prof. James Kipchoge",
      specialty: "Cardiac Emergency",
      rating: 4.8,
      reviews: 389,
      students: 2800,
      earnings: 380000,
      courses: 4,
      image: "https://via.placeholder.com/100",
      verified: true,
      topCourse: "ACLS Mastery",
    },
    {
      id: 3,
      name: "Dr. Emily Okonkwo",
      specialty: "Trauma Management",
      rating: 4.7,
      reviews: 312,
      students: 2100,
      earnings: 290000,
      courses: 3,
      image: "https://via.placeholder.com/100",
      verified: true,
      topCourse: "Trauma Protocols",
    },
    {
      id: 4,
      name: "Dr. Michael Kariuki",
      specialty: "Airway Management",
      rating: 4.6,
      reviews: 278,
      students: 1900,
      earnings: 250000,
      courses: 3,
      image: "https://via.placeholder.com/100",
      verified: true,
      topCourse: "Difficult Airways",
    },
  ];

  const courses = [
    {
      id: 1,
      title: "Advanced PALS",
      instructor: "Dr. Sarah Mwangi",
      rating: 4.9,
      students: 1200,
      earnings: 240000,
      price: 20000,
      category: "PALS",
    },
    {
      id: 2,
      title: "ACLS Mastery",
      instructor: "Prof. James Kipchoge",
      rating: 4.8,
      students: 980,
      earnings: 196000,
      price: 20000,
      category: "ACLS",
    },
    {
      id: 3,
      title: "Trauma Protocols",
      instructor: "Dr. Emily Okonkwo",
      rating: 4.7,
      students: 850,
      earnings: 170000,
      price: 20000,
      category: "Trauma",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Hero */}
      <section className="bg-gradient-to-r from-purple-900 to-purple-800 text-white py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <BookOpen className="w-12 h-12" />
            <h1 className="text-4xl font-bold">Instructor Marketplace</h1>
          </div>
          <p className="text-xl text-purple-100 max-w-2xl">
            Share your expertise, build your brand, and earn significant income. Join 500+ instructors earning millions.
          </p>
          <div className="mt-8 flex gap-4">
            <Button className="bg-white text-purple-900 hover:bg-purple-50">
              <Upload className="w-4 h-4 mr-2" />
              Create Course
            </Button>
            <Button variant="outline" className="text-white border-white hover:bg-purple-700">
              Learn More
            </Button>
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Search & Filter */}
        <div className="mb-8 space-y-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
              <Input
                placeholder="Search instructors or courses..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button variant="outline" size="icon">
              <Filter className="w-5 h-5" />
            </Button>
          </div>

          <div className="flex gap-2 flex-wrap">
            {["All", "Pediatrics", "Cardiac", "Trauma", "Airway"].map((cat) => (
              <Badge
                key={cat}
                variant={filterCategory === cat.toLowerCase() ? "default" : "secondary"}
                className="cursor-pointer"
                onClick={() => setFilterCategory(cat.toLowerCase())}
              >
                {cat}
              </Badge>
            ))}
          </div>
        </div>

        <Tabs defaultValue="instructors" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="instructors">Top Instructors</TabsTrigger>
            <TabsTrigger value="courses">Top Courses</TabsTrigger>
            <TabsTrigger value="earnings">Earnings Leaderboard</TabsTrigger>
          </TabsList>

          {/* Instructors Tab */}
          <TabsContent value="instructors" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {instructors.map((instructor) => (
                <Card key={instructor.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex gap-4 mb-4">
                      <img
                        src={instructor.image}
                        alt={instructor.name}
                        className="w-16 h-16 rounded-full"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-slate-900">{instructor.name}</h3>
                          {instructor.verified && (
                            <Award className="w-4 h-4 text-blue-600" />
                          )}
                        </div>
                        <p className="text-sm text-slate-600">{instructor.specialty}</p>
                        <div className="flex items-center gap-1 mt-1">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span className="font-semibold text-sm">{instructor.rating}</span>
                          <span className="text-xs text-slate-600">({instructor.reviews})</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 p-4 bg-slate-50 rounded-lg mb-4">
                      <div>
                        <p className="text-xs text-slate-600">Students</p>
                        <p className="font-bold text-slate-900">{(instructor.students / 1000).toFixed(1)}K</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-600">Courses</p>
                        <p className="font-bold text-slate-900">{instructor.courses}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-600">Earnings</p>
                        <p className="font-bold text-green-600">KES {(instructor.earnings / 1000).toFixed(0)}K</p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button className="flex-1" size="sm">
                        View Profile
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1">
                        <Heart className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Courses Tab */}
          <TabsContent value="courses" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {courses.map((course) => (
                <Card key={course.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle>{course.title}</CardTitle>
                        <CardDescription>{course.instructor}</CardDescription>
                      </div>
                      <Badge>{course.category}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-semibold">{course.rating}</span>
                      </div>
                      <span className="text-sm text-slate-600">{course.students} students</span>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-lg">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-xs text-slate-600">Price per Student</p>
                          <p className="font-bold text-slate-900">KES {course.price.toLocaleString()}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-slate-600">Total Earnings</p>
                          <p className="font-bold text-green-600">KES {(course.earnings / 1000).toFixed(0)}K</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button className="flex-1" size="sm">
                        <Eye className="w-4 h-4 mr-2" />
                        View
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1">
                        <Share2 className="w-4 h-4 mr-2" />
                        Share
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Earnings Tab */}
          <TabsContent value="earnings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Top Earners This Month</CardTitle>
                <CardDescription>Instructors with highest earnings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {instructors
                    .sort((a, b) => b.earnings - a.earnings)
                    .map((instructor, index) => (
                      <div key={instructor.id} className="flex items-center gap-4 p-4 border rounded-lg">
                        <div className="text-2xl font-bold text-slate-400 w-8 text-center">#{index + 1}</div>
                        <div className="flex-1">
                          <p className="font-semibold text-slate-900">{instructor.name}</p>
                          <p className="text-sm text-slate-600">{instructor.students} students</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-green-600">KES {(instructor.earnings / 1000).toFixed(0)}K</p>
                          <p className="text-xs text-slate-600">this month</p>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Platform Stats */}
        <div className="mt-12 grid md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-bold text-purple-600">500+</p>
              <p className="text-slate-600 mt-2">Active Instructors</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-bold text-blue-600">1,200+</p>
              <p className="text-slate-600 mt-2">Courses Available</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-bold text-green-600">$45M+</p>
              <p className="text-slate-600 mt-2">Total Paid Out</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-bold text-orange-600">98%</p>
              <p className="text-slate-600 mt-2">Satisfaction Rate</p>
            </CardContent>
          </Card>
        </div>

        {/* CTA */}
        <Card className="mt-12 bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
          <CardContent className="pt-8">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-slate-900 mb-4">Ready to Share Your Expertise?</h3>
              <p className="text-slate-600 mb-6 max-w-2xl mx-auto">
                Join our community of expert instructors and start earning. Average instructor earns KES 350,000+ per month.
              </p>
              <Button size="lg" className="bg-purple-600 hover:bg-purple-700">
                <Upload className="w-5 h-5 mr-2" />
                Create Your First Course
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
