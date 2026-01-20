import { useState } from "react";
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

export default function LiveTraining() {
  const [selectedSession, setSelectedSession] = useState<number | null>(null);

  const upcomingSessions = [
    {
      id: 1,
      title: "Advanced PALS Training",
      instructor: "Dr. Sarah Mwangi",
      date: "2026-01-25",
      time: "14:00 - 16:00",
      capacity: 50,
      enrolled: 42,
      status: "open",
      price: 20000,
    },
    {
      id: 2,
      title: "Trauma Management Masterclass",
      instructor: "Prof. James Kipchoge",
      date: "2026-01-26",
      time: "10:00 - 12:00",
      capacity: 40,
      enrolled: 38,
      status: "almost-full",
      price: 25000,
    },
    {
      id: 3,
      title: "Pediatric Resuscitation Elite",
      instructor: "Dr. Emily Okonkwo",
      date: "2026-01-27",
      time: "15:00 - 17:00",
      capacity: 30,
      enrolled: 28,
      status: "almost-full",
      price: 30000,
    },
  ];

  const pastSessions = [
    {
      id: 101,
      title: "BLS Fundamentals",
      instructor: "Dr. Michael Kariuki",
      date: "2026-01-20",
      attendees: 45,
      rating: 4.8,
      recording: true,
    },
    {
      id: 102,
      title: "ACLS Advanced Protocols",
      instructor: "Dr. Sarah Mwangi",
      date: "2026-01-19",
      attendees: 38,
      rating: 4.9,
      recording: true,
    },
  ];

  const features = [
    { icon: Video, title: "HD Video Streaming", description: "Crystal clear 1080p video with adaptive bitrate" },
    { icon: Users, title: "Interactive Breakout Rooms", description: "Divide into groups for focused learning" },
    { icon: Share2, title: "Screen Sharing", description: "Share presentations and demonstrations" },
    { icon: BarChart3, title: "Real-time Analytics", description: "Track engagement and participation" },
    { icon: Download, title: "Recording & Playback", description: "Access sessions anytime, anywhere" },
    { icon: Calendar, title: "Scheduling Tools", description: "Calendar integration and reminders" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Hero */}
      <section className="bg-gradient-to-r from-red-900 to-orange-900 text-white py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <Video className="w-12 h-12" />
            <h1 className="text-4xl font-bold">Live Training Platform</h1>
          </div>
          <p className="text-xl text-red-100 max-w-2xl">
            Interactive virtual classrooms with real-time collaboration, breakout rooms, and professional recording.
          </p>
          <div className="mt-8 flex gap-4">
            <Button className="bg-white text-red-900 hover:bg-red-50">
              <Play className="w-4 h-4 mr-2" />
              Join Live Session
            </Button>
            <Button variant="outline" className="text-white border-white hover:bg-red-700">
              Schedule Training
            </Button>
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 py-12">
        <Tabs defaultValue="upcoming" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="upcoming">Upcoming Sessions</TabsTrigger>
            <TabsTrigger value="past">Past Sessions</TabsTrigger>
            <TabsTrigger value="features">Features</TabsTrigger>
          </TabsList>

          {/* Upcoming Sessions */}
          <TabsContent value="upcoming" className="space-y-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-slate-900">Upcoming Live Sessions</h2>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Schedule Session
              </Button>
            </div>

            <div className="space-y-4">
              {upcomingSessions.map((session) => (
                <Card
                  key={session.id}
                  className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => setSelectedSession(session.id)}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-slate-900">{session.title}</h3>
                        <p className="text-sm text-slate-600 mt-1">Instructor: {session.instructor}</p>
                      </div>
                      <Badge
                        variant={
                          session.status === "open"
                            ? "default"
                            : session.status === "almost-full"
                            ? "secondary"
                            : "destructive"
                        }
                      >
                        {session.status === "open"
                          ? "Open"
                          : session.status === "almost-full"
                          ? "Almost Full"
                          : "Full"}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-4 gap-4 mb-4 p-4 bg-slate-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-slate-600" />
                        <span className="text-sm text-slate-600">{session.date}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-slate-600" />
                        <span className="text-sm text-slate-600">{session.time}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-slate-600" />
                        <span className="text-sm text-slate-600">
                          {session.enrolled}/{session.capacity}
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-slate-900">KES {session.price.toLocaleString()}</p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button className="flex-1">
                        <Play className="w-4 h-4 mr-2" />
                        Join Session
                      </Button>
                      <Button variant="outline" className="flex-1">
                        <Share2 className="w-4 h-4 mr-2" />
                        Share
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Past Sessions */}
          <TabsContent value="past" className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Past Sessions & Recordings</h2>

            <div className="space-y-4">
              {pastSessions.map((session) => (
                <Card key={session.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-slate-900">{session.title}</h3>
                        <p className="text-sm text-slate-600 mt-1">
                          {session.instructor} • {session.date} • {session.attendees} attendees
                        </p>
                        <div className="flex items-center gap-1 mt-2">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm font-semibold">{session.rating}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4 mr-2" />
                          Watch Recording
                        </Button>
                        <Button variant="outline" size="sm">
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Features */}
          <TabsContent value="features" className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Platform Features</h2>

            <div className="grid md:grid-cols-2 gap-6">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <Card key={index}>
                    <CardContent className="pt-6">
                      <Icon className="w-8 h-8 text-red-600 mb-4" />
                      <h3 className="font-bold text-slate-900 mb-2">{feature.title}</h3>
                      <p className="text-slate-600 text-sm">{feature.description}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Technical Specs */}
            <Card>
              <CardHeader>
                <CardTitle>Technical Specifications</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <p className="font-semibold text-slate-900 mb-2">Video Quality</p>
                    <ul className="space-y-1 text-sm text-slate-600">
                      <li>• 1080p HD at 60fps</li>
                      <li>• Adaptive bitrate streaming</li>
                      <li>• Low latency (&lt;2 seconds)</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 mb-2">Capacity</p>
                    <ul className="space-y-1 text-sm text-slate-600">
                      <li>• Up to 500 concurrent participants</li>
                      <li>• Unlimited breakout rooms</li>
                      <li>• Screen sharing for all</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 mb-2">Recording</p>
                    <ul className="space-y-1 text-sm text-slate-600">
                      <li>• Automatic recording</li>
                      <li>• Cloud storage (30 days)</li>
                      <li>• Downloadable MP4</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 mb-2">Security</p>
                    <ul className="space-y-1 text-sm text-slate-600">
                      <li>• End-to-end encryption</li>
                      <li>• Password protected rooms</li>
                      <li>• GDPR compliant</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Pricing */}
        <Card className="mt-12 bg-gradient-to-r from-red-50 to-orange-50 border-red-200">
          <CardContent className="pt-8">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-slate-900 mb-4">Host Your Own Sessions</h3>
              <p className="text-slate-600 mb-6 max-w-2xl mx-auto">
                Unlimited live sessions with up to 500 participants. Included in Professional and Enterprise plans.
              </p>
              <Button size="lg" className="bg-red-600 hover:bg-red-700">
                Start Hosting
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
