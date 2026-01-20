import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlayCircle, CheckCircle, Clock, Award, BookOpen } from "lucide-react";

export default function AHAeLearning() {
  const courses = [
    {
      id: 1,
      title: "BLS for Healthcare Providers",
      provider: "American Heart Association",
      duration: "3-4 hours",
      status: "Completed",
      completedDate: "Jan 10, 2026",
      certificate: true,
      progress: 100,
      lessons: 12,
      icon: "🫀",
    },
    {
      id: 2,
      title: "ACLS Provider",
      provider: "American Heart Association",
      duration: "6-8 hours",
      status: "In Progress",
      progress: 65,
      lessons: 18,
      icon: "⚡",
    },
    {
      id: 3,
      title: "PALS Provider",
      provider: "American Heart Association",
      duration: "8-10 hours",
      status: "In Progress",
      progress: 45,
      lessons: 20,
      icon: "👶",
    },
    {
      id: 4,
      title: "Neonatal Resuscitation Program",
      provider: "American Heart Association",
      duration: "4-5 hours",
      status: "Not Started",
      progress: 0,
      lessons: 15,
      icon: "👼",
    },
    {
      id: 5,
      title: "First Aid",
      provider: "American Heart Association",
      duration: "2-3 hours",
      status: "Not Started",
      progress: 0,
      lessons: 8,
      icon: "🩹",
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed":
        return "bg-green-100 text-green-800";
      case "In Progress":
        return "bg-blue-100 text-blue-800";
      case "Not Started":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Completed":
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case "In Progress":
        return <Clock className="w-5 h-5 text-blue-600" />;
      case "Not Started":
        return <PlayCircle className="w-5 h-5 text-gray-600" />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <section className="bg-white border-b py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-4">
            <div className="text-4xl">❤️</div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                AHA eLearning Integration
              </h1>
              <p className="text-gray-600">
                Access American Heart Association courses directly from your dashboard
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Stats */}
      <section className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-6">
            <Card>
              <CardContent className="pt-6">
                <CheckCircle className="w-8 h-8 text-green-600 mb-3" />
                <p className="text-sm text-gray-600 mb-1">Completed</p>
                <p className="text-3xl font-bold text-gray-900">1</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <Clock className="w-8 h-8 text-blue-600 mb-3" />
                <p className="text-sm text-gray-600 mb-1">In Progress</p>
                <p className="text-3xl font-bold text-gray-900">2</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <PlayCircle className="w-8 h-8 text-gray-600 mb-3" />
                <p className="text-sm text-gray-600 mb-1">Not Started</p>
                <p className="text-3xl font-bold text-gray-900">2</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <Award className="w-8 h-8 text-yellow-600 mb-3" />
                <p className="text-sm text-gray-600 mb-1">Certificates</p>
                <p className="text-3xl font-bold text-gray-900">1</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Courses */}
      <section className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-8">
              <TabsTrigger value="all">All Courses</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
              <TabsTrigger value="inprogress">In Progress</TabsTrigger>
              <TabsTrigger value="notstarted">Not Started</TabsTrigger>
            </TabsList>

            {/* All Courses */}
            <TabsContent value="all">
              <div className="grid md:grid-cols-2 gap-6">
                {courses.map((course) => (
                  <Card key={course.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="text-4xl">{course.icon}</div>
                        <Badge className={getStatusColor(course.status)}>
                          {course.status}
                        </Badge>
                      </div>

                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        {course.title}
                      </h3>
                      <p className="text-sm text-gray-600 mb-4">
                        {course.provider}
                      </p>

                      <div className="space-y-3 mb-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Clock className="w-4 h-4" />
                          {course.duration}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <BookOpen className="w-4 h-4" />
                          {course.lessons} lessons
                        </div>
                      </div>

                      {course.progress > 0 && (
                        <div className="mb-4">
                          <div className="flex justify-between text-sm mb-2">
                            <span className="text-gray-600">Progress</span>
                            <span className="font-semibold text-gray-900">
                              {course.progress}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all"
                              style={{ width: `${course.progress}%` }}
                            />
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2">
                        {course.status === "Completed" ? (
                          <>
                            <Button className="flex-1 bg-green-600 hover:bg-green-700">
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Completed
                            </Button>
                            {course.certificate && (
                              <Button variant="outline" className="flex-1">
                                <Award className="w-4 h-4 mr-2" />
                                Certificate
                              </Button>
                            )}
                          </>
                        ) : course.status === "In Progress" ? (
                          <Button className="flex-1 bg-blue-600 hover:bg-blue-700">
                            <PlayCircle className="w-4 h-4 mr-2" />
                            Continue
                          </Button>
                        ) : (
                          <Button className="flex-1 bg-blue-600 hover:bg-blue-700">
                            <PlayCircle className="w-4 h-4 mr-2" />
                            Start Course
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Completed */}
            <TabsContent value="completed">
              <div className="grid md:grid-cols-2 gap-6">
                {courses
                  .filter((c) => c.status === "Completed")
                  .map((course) => (
                    <Card key={course.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="text-4xl">{course.icon}</div>
                          <Badge className="bg-green-100 text-green-800">
                            Completed
                          </Badge>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                          {course.title}
                        </h3>
                        <p className="text-sm text-gray-600 mb-4">
                          Completed on {course.completedDate}
                        </p>
                        <Button className="w-full bg-green-600 hover:bg-green-700">
                          <Award className="w-4 h-4 mr-2" />
                          View Certificate
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </TabsContent>

            {/* In Progress */}
            <TabsContent value="inprogress">
              <div className="grid md:grid-cols-2 gap-6">
                {courses
                  .filter((c) => c.status === "In Progress")
                  .map((course) => (
                    <Card key={course.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="text-4xl">{course.icon}</div>
                          <Badge className="bg-blue-100 text-blue-800">
                            In Progress
                          </Badge>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                          {course.title}
                        </h3>
                        <div className="mb-4">
                          <div className="flex justify-between text-sm mb-2">
                            <span className="text-gray-600">Progress</span>
                            <span className="font-semibold text-gray-900">
                              {course.progress}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${course.progress}%` }}
                            />
                          </div>
                        </div>
                        <Button className="w-full bg-blue-600 hover:bg-blue-700">
                          <PlayCircle className="w-4 h-4 mr-2" />
                          Continue
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </TabsContent>

            {/* Not Started */}
            <TabsContent value="notstarted">
              <div className="grid md:grid-cols-2 gap-6">
                {courses
                  .filter((c) => c.status === "Not Started")
                  .map((course) => (
                    <Card key={course.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="text-4xl">{course.icon}</div>
                          <Badge className="bg-gray-100 text-gray-800">
                            Not Started
                          </Badge>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                          {course.title}
                        </h3>
                        <p className="text-sm text-gray-600 mb-4">
                          {course.duration} • {course.lessons} lessons
                        </p>
                        <Button className="w-full bg-blue-600 hover:bg-blue-700">
                          <PlayCircle className="w-4 h-4 mr-2" />
                          Start Course
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* About AHA Integration */}
      <section className="py-8 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl font-bold mb-6">About AHA eLearning</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Official Certification</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">
                  All AHA courses are officially recognized and provide certifications
                  that are valid worldwide. Your certificates are automatically saved
                  in your profile.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Seamless Integration</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">
                  Access AHA courses directly from your Paeds Resus dashboard. Your
                  progress is tracked and integrated with your learning profile.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Expert Instructors</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">
                  Learn from American Heart Association certified instructors with
                  extensive experience in emergency cardiac care.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Flexible Learning</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">
                  Study at your own pace with lifetime access to course materials.
                  Pause and resume anytime, from any device.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
