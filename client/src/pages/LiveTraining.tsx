import { useScrollToTop } from "@/hooks/useScrollToTop";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Video,
  Users,
  Calendar,
  Clock,
  MapPin,
  Star,
  Play,
  Plus,
  Settings,
  Share2,
  Download,
  Eye,
  BarChart3,
} from "lucide-react";
import { useState } from "react";

export default function LiveTraining() {
  useScrollToTop();
  const [activeTab, setActiveTab] = useState("upcoming");
  const [selectedSession, setSelectedSession] = useState<number | null>(null);

  const upcomingSessions = [
    {
      id: 1,
      title: "BLS Fundamentals - Live Session",
      instructor: "Dr. Sarah Kipchoge",
      date: "2026-01-25",
      time: "14:00 - 16:00",
      participants: 45,
      capacity: 50,
      level: "Beginner",
      description: "Learn the basics of Basic Life Support with hands-on demonstrations",
    },
    {
      id: 2,
      title: "ACLS Advanced Techniques",
      instructor: "Dr. James Mwangi",
      date: "2026-01-26",
      time: "10:00 - 12:00",
      participants: 32,
      capacity: 40,
      level: "Advanced",
      description: "Advanced cardiac life support techniques and protocols",
    },
    {
      id: 3,
      title: "PALS Pediatric Emergency",
      instructor: "Nurse Mary Kariuki",
      date: "2026-01-27",
      time: "15:00 - 17:00",
      participants: 28,
      capacity: 35,
      level: "Intermediate",
      description: "Pediatric Advanced Life Support for emergency situations",
    },
  ];

  const recordedSessions = [
    {
      id: 101,
      title: "BLS Certification Exam Prep",
      instructor: "Dr. Ahmed Hassan",
      duration: "2h 30m",
      views: 1250,
      rating: 4.8,
    },
    {
      id: 102,
      title: "Airway Management Masterclass",
      instructor: "Dr. Sarah Kipchoge",
      duration: "1h 45m",
      views: 892,
      rating: 4.9,
    },
    {
      id: 103,
      title: "Shock Management Protocol",
      instructor: "Dr. James Mwangi",
      duration: "2h 15m",
      views: 756,
      rating: 4.7,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Live Training Sessions</h1>
          <p className="text-gray-600">Join interactive live training with expert instructors</p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upcoming">Upcoming Sessions</TabsTrigger>
            <TabsTrigger value="recorded">Recorded Sessions</TabsTrigger>
          </TabsList>

          {/* Upcoming Sessions */}
          <TabsContent value="upcoming" className="space-y-6">
            {upcomingSessions.map((session) => (
              <Card key={session.id} className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Video className="w-5 h-5 text-red-600" />
                        {session.title}
                      </CardTitle>
                      <CardDescription className="mt-2">
                        Instructor: {session.instructor}
                      </CardDescription>
                    </div>
                    <Badge variant="outline">{session.level}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6 mb-6">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-gray-700">
                        <Calendar className="w-4 h-4" />
                        <span>{session.date}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-700">
                        <Clock className="w-4 h-4" />
                        <span>{session.time}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-700">
                        <Users className="w-4 h-4" />
                        <span>{session.participants}/{session.capacity} participants</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-gray-600 mb-4">{session.description}</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <Button className="flex-1 bg-red-600 hover:bg-red-700">
                      <Play className="w-4 h-4 mr-2" />
                      Join Live Session
                    </Button>
                    <Button variant="outline" className="flex-1">
                      <Share2 className="w-4 h-4 mr-2" />
                      Share
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* Recorded Sessions */}
          <TabsContent value="recorded" className="space-y-6">
            {recordedSessions.map((session) => (
              <Card key={session.id} className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Play className="w-5 h-5 text-blue-600" />
                        {session.title}
                      </CardTitle>
                      <CardDescription className="mt-2">
                        Instructor: {session.instructor}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-6 mb-6">
                    <div className="flex items-center gap-2 text-gray-700">
                      <Clock className="w-4 h-4" />
                      <span>{session.duration}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-700">
                      <Eye className="w-4 h-4" />
                      <span>{session.views} views</span>
                    </div>
                    <div className="flex items-center gap-2 text-yellow-600">
                      <Star className="w-4 h-4 fill-current" />
                      <span>{session.rating} rating</span>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <Button className="flex-1">
                      <Play className="w-4 h-4 mr-2" />
                      Watch Recording
                    </Button>
                    <Button variant="outline" className="flex-1">
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>

        {/* Features Section */}
        <Card>
          <CardHeader>
            <CardTitle>Live Training Features</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="flex items-start gap-4">
                <Video className="w-6 h-6 text-blue-600 mt-1" />
                <div>
                  <h4 className="font-semibold text-gray-900">HD Video Streaming</h4>
                  <p className="text-sm text-gray-600">Crystal clear video quality for all sessions</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <Users className="w-6 h-6 text-blue-600 mt-1" />
                <div>
                  <h4 className="font-semibold text-gray-900">Interactive Q&A</h4>
                  <p className="text-sm text-gray-600">Ask questions and get instant answers</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <Download className="w-6 h-6 text-blue-600 mt-1" />
                <div>
                  <h4 className="font-semibold text-gray-900">Recording Access</h4>
                  <p className="text-sm text-gray-600">Access recordings anytime after the session</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
