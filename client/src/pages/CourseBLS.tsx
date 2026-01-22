import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle2,
  Clock,
  BookOpen,
  Play,
  Download,
  Award,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface Module {
  id: string;
  title: string;
  duration: number;
  lessons: Lesson[];
  completed: boolean;
}

interface Lesson {
  id: string;
  title: string;
  duration: number;
  type: "video" | "reading" | "quiz" | "practical";
  completed: boolean;
}

export default function CourseBLS() {
  const [expandedModule, setExpandedModule] = useState<string | null>("module-1");
  const [progress, setProgress] = useState(25);

  const modules: Module[] = [
    {
      id: "module-1",
      title: "Module 1: Introduction to BLS",
      duration: 45,
      completed: true,
      lessons: [
        {
          id: "lesson-1",
          title: "What is BLS?",
          duration: 10,
          type: "video",
          completed: true,
        },
        {
          id: "lesson-2",
          title: "Chain of Survival",
          duration: 15,
          type: "video",
          completed: true,
        },
        {
          id: "lesson-3",
          title: "Introduction Quiz",
          duration: 20,
          type: "quiz",
          completed: true,
        },
      ],
    },
    {
      id: "module-2",
      title: "Module 2: CPR Fundamentals",
      duration: 120,
      completed: false,
      lessons: [
        {
          id: "lesson-4",
          title: "Chest Compressions Technique",
          duration: 30,
          type: "video",
          completed: false,
        },
        {
          id: "lesson-5",
          title: "Rescue Breathing",
          duration: 30,
          type: "video",
          completed: false,
        },
        {
          id: "lesson-6",
          title: "CPR Cycle",
          duration: 30,
          type: "reading",
          completed: false,
        },
        {
          id: "lesson-7",
          title: "CPR Practical Assessment",
          duration: 30,
          type: "practical",
          completed: false,
        },
      ],
    },
    {
      id: "module-3",
      title: "Module 3: AED Usage",
      duration: 60,
      completed: false,
      lessons: [
        {
          id: "lesson-8",
          title: "AED Overview",
          duration: 20,
          type: "video",
          completed: false,
        },
        {
          id: "lesson-9",
          title: "Operating an AED",
          duration: 25,
          type: "video",
          completed: false,
        },
        {
          id: "lesson-10",
          title: "AED Quiz",
          duration: 15,
          type: "quiz",
          completed: false,
        },
      ],
    },
    {
      id: "module-4",
      title: "Module 4: Special Scenarios",
      duration: 90,
      completed: false,
      lessons: [
        {
          id: "lesson-11",
          title: "BLS in Infants",
          duration: 30,
          type: "video",
          completed: false,
        },
        {
          id: "lesson-12",
          title: "BLS in Children",
          duration: 30,
          type: "video",
          completed: false,
        },
        {
          id: "lesson-13",
          title: "Special Scenarios Quiz",
          duration: 30,
          type: "quiz",
          completed: false,
        },
      ],
    },
    {
      id: "module-5",
      title: "Module 5: Final Certification",
      duration: 120,
      completed: false,
      lessons: [
        {
          id: "lesson-14",
          title: "Certification Exam",
          duration: 60,
          type: "quiz",
          completed: false,
        },
        {
          id: "lesson-15",
          title: "Practical Skills Assessment",
          duration: 60,
          type: "practical",
          completed: false,
        },
      ],
    },
  ];

  const getLessonIcon = (type: string) => {
    switch (type) {
      case "video":
        return <Play className="w-4 h-4" />;
      case "reading":
        return <BookOpen className="w-4 h-4" />;
      case "quiz":
        return <AlertCircle className="w-4 h-4" />;
      case "practical":
        return <Award className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const totalLessons = modules.reduce((acc, m) => acc + m.lessons.length, 0);
  const completedLessons = modules.reduce(
    (acc, m) => acc + m.lessons.filter((l) => l.completed).length,
    0
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center">
              <Heart className="w-6 h-6 text-teal-600" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-slate-900">Basic Life Support (BLS)</h1>
              <p className="text-slate-600">Certification Course • 8 hours total</p>
            </div>
          </div>
        </div>

        {/* Progress Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Your Progress</span>
              <Badge className="bg-teal-600">{progress}% Complete</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Progress value={progress} className="h-3" />
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-teal-600">
                  {completedLessons}/{totalLessons}
                </p>
                <p className="text-sm text-slate-600">Lessons Completed</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600">2.5</p>
                <p className="text-sm text-slate-600">Hours Completed</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-orange-600">5.5</p>
                <p className="text-sm text-slate-600">Hours Remaining</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Course Description */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>About This Course</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-slate-700">
              This comprehensive Basic Life Support course teaches the essential skills needed to respond to cardiac
              emergencies and save lives. You'll learn CPR techniques, AED operation, and how to handle special
              scenarios in pediatric and adult patients.
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex gap-3">
                <Clock className="w-5 h-5 text-teal-600 flex-shrink-0 mt-1" />
                <div>
                  <p className="font-medium">Duration</p>
                  <p className="text-sm text-slate-600">8 hours of training</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Award className="w-5 h-5 text-teal-600 flex-shrink-0 mt-1" />
                <div>
                  <p className="font-medium">Certification</p>
                  <p className="text-sm text-slate-600">Valid for 2 years</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Course Modules */}
        <div className="space-y-4 mb-8">
          <h2 className="text-2xl font-bold text-slate-900">Course Modules</h2>

          {modules.map((module) => (
            <Card key={module.id}>
              <div
                className="p-6 cursor-pointer hover:bg-slate-50 transition"
                onClick={() =>
                  setExpandedModule(expandedModule === module.id ? null : module.id)
                }
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    {module.completed ? (
                      <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0" />
                    ) : (
                      <div className="w-6 h-6 rounded-full border-2 border-slate-300 flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900">{module.title}</h3>
                      <p className="text-sm text-slate-600">
                        {module.lessons.filter((l) => l.completed).length}/{module.lessons.length} lessons •{" "}
                        {module.duration} minutes
                      </p>
                    </div>
                  </div>
                  {expandedModule === module.id ? (
                    <ChevronUp className="w-5 h-5 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-400" />
                  )}
                </div>
              </div>

              {expandedModule === module.id && (
                <div className="border-t px-6 py-4 space-y-3 bg-slate-50">
                  {module.lessons.map((lesson) => (
                    <div
                      key={lesson.id}
                      className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200 hover:border-slate-300 transition"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <div className="flex-shrink-0 text-slate-400">
                          {getLessonIcon(lesson.type)}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-slate-900">{lesson.title}</p>
                          <p className="text-xs text-slate-600">
                            {lesson.type.charAt(0).toUpperCase() + lesson.type.slice(1)} • {lesson.duration} min
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {lesson.completed ? (
                          <Badge className="bg-green-100 text-green-700">Completed</Badge>
                        ) : (
                          <Button size="sm" variant="outline">
                            Start
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          ))}
        </div>

        {/* Call to Action */}
        <Card className="bg-gradient-to-r from-teal-50 to-blue-50 border-teal-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-slate-900 mb-1">Ready to continue?</h3>
                <p className="text-sm text-slate-600">
                  You're {progress}% through the course. Keep up the great progress!
                </p>
              </div>
              <Button className="bg-teal-600 hover:bg-teal-700 gap-2">
                <Play className="w-4 h-4" />
                Continue Learning
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Import Heart icon
import { Heart } from "lucide-react";
