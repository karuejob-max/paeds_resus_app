/**
 * Paeds Resus Fellowship - Micro-Courses Landing Page
 * 
 * Single unified fellowship with 26 evidence-based micro-courses
 * Covers all pediatric emergency conditions with formative and summative assessments
 * 
 * Features:
 * - Course discovery and filtering (by condition, level, enrollment status)
 * - Enrollment with M-Pesa payment integration
 * - Progress tracking (modules, quizzes, certification)
 * - Fellowship qualification system (3-pillar: courses, ResusGPS, Care Signal)
 */

import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, Clock, DollarSign, Lock, CheckCircle2, BookOpen, Award, Zap, Heart, Brain, Flame } from 'lucide-react';
import { useLocation } from 'wouter';
import { useEffect, useState, useMemo } from 'react';
import { EnrollmentModal } from '@/components/EnrollmentModal';

type EmergencyType = 'respiratory' | 'shock' | 'seizure' | 'metabolic' | 'infectious' | 'burns' | 'trauma';
type Level = 'foundational' | 'advanced';

interface CourseCard {
  id: number;
  courseId: string;
  title: string;
  description: string;
  level: Level;
  emergencyType: EmergencyType;
  duration: number;
  price: number;
  prerequisiteId?: string;
  completed?: boolean;
  enrolled?: boolean;
}

const EMERGENCY_CATEGORIES: Record<EmergencyType, { label: string; icon: React.ReactNode; color: string }> = {
  respiratory: { label: '🫁 Respiratory', icon: <Zap className="h-5 w-5" />, color: 'bg-blue-100' },
  shock: { label: '⚡ Shock', icon: <Heart className="h-5 w-5" />, color: 'bg-red-100' },
  seizure: { label: '🧠 Seizure', icon: <Brain className="h-5 w-5" />, color: 'bg-purple-100' },
  metabolic: { label: '🧬 Metabolic', icon: <AlertCircle className="h-5 w-5" />, color: 'bg-orange-100' },
  infectious: { label: '🦠 Infectious', icon: <AlertCircle className="h-5 w-5" />, color: 'bg-green-100' },
  burns: { label: '🔥 Burns', icon: <Flame className="h-5 w-5" />, color: 'bg-amber-100' },
  trauma: { label: '🚑 Trauma', icon: <AlertCircle className="h-5 w-5" />, color: 'bg-gray-100' },
};

export default function MicroCoursesLanding() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedCategory, setSelectedCategory] = useState<EmergencyType | 'all'>('all');
  const [selectedLevel, setSelectedLevel] = useState<Level | 'all'>('all');
  const [showEnrolledOnly, setShowEnrolledOnly] = useState(false);
  const [mpesaModalOpen, setMpesaModalOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<CourseCard | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      setLocation('/login');
    }
  }, [loading, user, setLocation]);

  // Query all courses
  const { data: coursesData, isLoading } = trpc.courses.listAll.useQuery(undefined, {
    enabled: Boolean(user),
    refetchOnWindowFocus: false,
    staleTime: 60_000,
  });

  // Query user enrollments
  const { data: enrollmentsData } = trpc.courses.getUserEnrollments.useQuery(
    { userId: user?.id || 0 },
    { enabled: !!user, refetchOnWindowFocus: false, staleTime: 30_000 }
  );

  // Query fellowship progress
  const { data: progress } = trpc.fellowship.getProgress.useQuery(undefined, {
    enabled: Boolean(user),
    refetchOnWindowFocus: false,
    staleTime: 60_000,
  });

  // Get enrollment status map
  const enrollmentMap = useMemo(() => {
    if (!enrollmentsData) return {};
    return enrollmentsData.reduce(
      (acc, enrollment) => {
        acc[enrollment.microCourseId] = {
          status: enrollment.enrollmentStatus,
          completed: enrollment.enrollmentStatus === 'completed',
          quizScore: enrollment.quizScore,
        };
        return acc;
      },
      {} as Record<number, { status: string; completed: boolean; quizScore?: number }>
    );
  }, [enrollmentsData]);

  // Filter courses
  const filteredCourses = useMemo(() => {
    if (!coursesData) return [];

    return coursesData.filter((course: CourseCard) => {
      const categoryMatch = selectedCategory === 'all' || course.emergencyType === selectedCategory;
      const levelMatch = selectedLevel === 'all' || course.level === selectedLevel;
      const enrollmentMatch = !showEnrolledOnly || enrollmentMap[course.id]?.completed;

      return categoryMatch && levelMatch && enrollmentMatch;
    });
  }, [coursesData, selectedCategory, selectedLevel, showEnrolledOnly, enrollmentMap]);

  // Group courses by emergency type
  const groupedCourses = useMemo(() => {
    const grouped: Record<EmergencyType, CourseCard[]> = {
      respiratory: [],
      shock: [],
      seizure: [],
      metabolic: [],
      infectious: [],
      burns: [],
      trauma: [],
    };

    filteredCourses.forEach((course: CourseCard) => {
      grouped[course.emergencyType].push(course);
    });

    return grouped;
  }, [filteredCourses]);

  const handleEnrollClick = (course: CourseCard) => {
    setSelectedCourse(course);
    setMpesaModalOpen(true);
  };

  const handleEnrollmentSuccess = () => {
    setMpesaModalOpen(false);
    setSelectedCourse(null);
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <div className="animate-spin mb-4">
            <Award className="h-12 w-12 text-blue-600 mx-auto" />
          </div>
          <p className="text-slate-600 font-medium">Loading your fellowship journey...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-3 mb-4">
            <Award className="h-8 w-8" />
            <h1 className="text-4xl md:text-5xl font-bold">Paeds Resus Fellowship</h1>
          </div>
          <p className="text-lg text-blue-100 mb-6 max-w-2xl">
            Master 26 evidence-based micro-courses covering all pediatric emergency conditions. 
            Complete formative assessments, pass summative exams, and earn your fellowship certification.
          </p>

          {/* Fellowship Progress Overview */}
          {progress && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
              <div className="bg-white/10 backdrop-blur rounded-lg p-4">
                <div className="text-sm text-blue-100 mb-2">Courses Completed</div>
                <div className="text-3xl font-bold">{progress.coursesPillar.completed}/{progress.coursesPillar.required}</div>
                <Progress value={progress.coursesPillar.percentage} className="mt-2 h-2" />
              </div>
              <div className="bg-white/10 backdrop-blur rounded-lg p-4">
                <div className="text-sm text-blue-100 mb-2">ResusGPS Cases</div>
                <div className="text-3xl font-bold">{progress.resusGPSPillar.casesCompleted}</div>
                <Progress value={progress.resusGPSPillar.percentage} className="mt-2 h-2" />
              </div>
              <div className="bg-white/10 backdrop-blur rounded-lg p-4">
                <div className="text-sm text-blue-100 mb-2">Overall Progress</div>
                <div className="text-3xl font-bold">{progress.overallPercentage}%</div>
                <Progress value={progress.overallPercentage} className="mt-2 h-2" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Filters */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Filter Courses</CardTitle>
            <CardDescription>Find courses by emergency type, difficulty level, or completion status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Emergency Type Filter */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3">Emergency Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(EMERGENCY_CATEGORIES).map(([key, { label }]) => (
                    <button
                      key={key}
                      onClick={() => setSelectedCategory(key as EmergencyType)}
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        selectedCategory === key
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {label.split(' ')[0]}
                    </button>
                  ))}
                  <button
                    onClick={() => setSelectedCategory('all')}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors col-span-2 ${
                      selectedCategory === 'all'
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    All Types
                  </button>
                </div>
              </div>

              {/* Level Filter */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3">Difficulty</label>
                <div className="space-y-2">
                  {['all', 'foundational', 'advanced'].map((level) => (
                    <button
                      key={level}
                      onClick={() => setSelectedLevel(level as Level | 'all')}
                      className={`w-full px-4 py-2 rounded-md text-sm font-medium transition-colors text-left ${
                        selectedLevel === level
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {level === 'all' ? 'All Levels' : level.charAt(0).toUpperCase() + level.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3">Status</label>
                <button
                  onClick={() => setShowEnrolledOnly(!showEnrolledOnly)}
                  className={`w-full px-4 py-2 rounded-md text-sm font-medium transition-colors text-left ${
                    showEnrolledOnly
                      ? 'bg-green-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {showEnrolledOnly ? '✓ Completed Only' : 'All Courses'}
                </button>
                <p className="text-xs text-slate-500 mt-2">
                  {filteredCourses.length} course{filteredCourses.length !== 1 ? 's' : ''} available
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Courses Grid */}
        {filteredCourses.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border">
            <AlertCircle className="mx-auto h-12 w-12 text-slate-400 mb-4" />
            <p className="text-slate-600 font-medium">No courses match your filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course: CourseCard) => {
              const enrollment = enrollmentMap[course.id];
              const isCompleted = enrollment?.completed;
              const isEnrolled = enrollment?.status === 'active' || isCompleted;

              return (
                <Card
                  key={course.id}
                  className={`flex flex-col transition-all hover:shadow-lg ${
                    isCompleted ? 'border-green-200 bg-green-50' : ''
                  }`}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <Badge
                        variant={course.level === 'foundational' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {course.level === 'foundational' ? '📚 Foundational' : '🎓 Advanced'}
                      </Badge>
                      {isCompleted && <CheckCircle2 className="h-5 w-5 text-green-600" />}
                    </div>
                    <CardTitle className="text-lg">{course.title}</CardTitle>
                    <CardDescription className="text-sm">{course.description}</CardDescription>
                  </CardHeader>

                  <CardContent className="flex-1 flex flex-col">
                    {/* Course Details */}
                    <div className="space-y-3 mb-4 flex-1">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Clock className="h-4 w-4" />
                        <span>{course.duration} minutes</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <DollarSign className="h-4 w-4" />
                        <span>KES {(course.price / 100).toLocaleString()}</span>
                      </div>

                      {/* Prerequisite Badge */}
                      {course.prerequisiteId && (
                        <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 p-2 rounded">
                          <Lock className="h-4 w-4" />
                          <span>Requires prerequisite</span>
                        </div>
                      )}

                      {/* Quiz Score */}
                      {isCompleted && enrollment?.quizScore && (
                        <div className="bg-green-100 text-green-800 p-2 rounded text-sm font-medium">
                          ✓ Quiz Score: {enrollment.quizScore}%
                        </div>
                      )}
                    </div>

                    {/* Action Button */}
                    {isCompleted ? (
                      <Button disabled className="w-full" variant="outline">
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Completed
                      </Button>
                    ) : isEnrolled ? (
                      <Button className="w-full" variant="outline">
                        <BookOpen className="h-4 w-4 mr-2" />
                        Continue Learning
                      </Button>
                    ) : (
                      <Button
                        onClick={() => handleEnrollClick(course)}
                        className="w-full"
                      >
                        Enroll Now
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Enrollment Modal */}
      {selectedCourse && (
        <EnrollmentModal
          isOpen={mpesaModalOpen}
          onClose={() => {
            setMpesaModalOpen(false);
            setSelectedCourse(null);
          }}
          course={selectedCourse}
          onEnrollmentSuccess={handleEnrollmentSuccess}
        />
      )}
    </div>
  );
}
