import { useState, useMemo } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Clock, DollarSign, Lock, CheckCircle2 } from 'lucide-react';
import MpesaEnrollmentModal from '@/components/MpesaEnrollmentModal';

type EmergencyType = 'respiratory' | 'shock' | 'seizure' | 'toxicology' | 'metabolic' | 'infectious' | 'burns' | 'trauma';
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

const EMERGENCY_CATEGORIES: Record<EmergencyType, { label: string; color: string }> = {
  respiratory: { label: '🫁 Respiratory', color: 'bg-blue-100' },
  shock: { label: '⚡ Shock', color: 'bg-red-100' },
  seizure: { label: '🧠 Seizure', color: 'bg-purple-100' },
  toxicology: { label: '☠️ Toxicology', color: 'bg-yellow-100' },
  metabolic: { label: '🧬 Metabolic', color: 'bg-orange-100' },
  infectious: { label: '🦠 Infectious', color: 'bg-green-100' },
  burns: { label: '🔥 Burns', color: 'bg-amber-100' },
  trauma: { label: '🚑 Trauma', color: 'bg-gray-100' },
};

export default function CourseCatalog() {
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<EmergencyType | 'all'>('all');
  const [selectedLevel, setSelectedLevel] = useState<Level | 'all'>('all');
  const [showEnrolledOnly, setShowEnrolledOnly] = useState(false);
  const [mpesaModalOpen, setMpesaModalOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<CourseCard | null>(null);

  // Query all courses
  const { data: coursesData, isLoading } = trpc.courses.listAll.useQuery();
  const { data: enrollmentsData } = trpc.courses.getUserEnrollments.useQuery({ userId: user?.id || 0 }, { enabled: !!user });

  // Get enrollment status for each course
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

  // Group by emergency type
  const groupedCourses = useMemo(() => {
    const grouped: Record<EmergencyType, CourseCard[]> = {
      respiratory: [],
      shock: [],
      seizure: [],
      toxicology: [],
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Paediatric Resuscitation Courses</h1>
          <p className="text-lg text-slate-600">Master 26 critical emergency protocols with expert-led micro-courses</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Category Filter */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-3">Emergency Type</label>
        
              <div className="grid grid-cols-2 gap-2 mt-2">
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
                    {label}
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
                  All Categories
                </button>
              </div>
            </div>

            {/* Level Filter */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-3">Difficulty Level</label>
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
                {showEnrolledOnly ? '✓ Completed Courses' : 'All Courses'}
              </button>
              <p className="text-xs text-slate-500 mt-2">
                {filteredCourses.length} course{filteredCourses.length !== 1 ? 's' : ''} available
              </p>
            </div>
          </div>
        </div>

        {/* Courses Grid */}
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-slate-600">Loading courses...</p>
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg">
            <AlertCircle className="mx-auto h-12 w-12 text-slate-400 mb-4" />
            <p className="text-slate-600 font-medium">No courses match your filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course: CourseCard) => {
              const enrollment = enrollmentMap[course.id];
              const isCompleted = enrollment?.completed;
              const isEnrolled = enrollment?.status === 'active' || isCompleted;
              const isAdmin = user?.email === 'karuejob@gmail.com';

              return (
                <Card key={course.id} className={`flex flex-col transition-all hover:shadow-lg ${isCompleted ? 'border-green-200 bg-green-50' : ''}`}>
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

                  <CardContent className="flex-1">
                    {/* Course Details */}
                    <div className="space-y-3 mb-4">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Clock className="h-4 w-4" />
                        <span>{course.duration} minutes</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <DollarSign className="h-4 w-4" />
                        <span>{(course.price / 100).toLocaleString('en-KE', { style: 'currency', currency: 'KES' })}</span>
                      </div>

                      {/* Prerequisite Badge */}
                      {course.prerequisiteId && (
                        <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 p-2 rounded">
                          <Lock className="h-4 w-4" />
                          <span>Requires prerequisite course</span>
                        </div>
                      )}

                      {/* Quiz Score */}
                      {isCompleted && enrollment?.quizScore && (
                        <div className="bg-green-100 text-green-800 p-2 rounded text-sm font-medium">
                          ✓ Quiz Score: {enrollment.quizScore}%
                        </div>
                      )}
                    </div>

                    {/* Enrollment Button */}
                    <EnrollmentButton
                      course={course}
                      isEnrolled={isEnrolled}
                      isCompleted={isCompleted}
                      isAdmin={isAdmin}
                      userId={user?.id}
                    />
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function EnrollmentButton({
  course,
  isEnrolled,
  isCompleted,
  isAdmin,
  userId,
}: {
  course: CourseCard;
  isEnrolled: boolean;
  isCompleted: boolean;
  isAdmin: boolean;
  userId?: number;
}) {
  const [mpesaModalOpen, setMpesaModalOpen] = useState(false);
  const adminAccessMutation = trpc.courses.grantAdminAccess.useMutation();

  const handleEnroll = async () => {
    if (!userId) return;

    if (isAdmin) {
      // Admin gets free access
      await adminAccessMutation.mutateAsync({
        courseId: course.courseId,
      });
    } else {
      // Regular user: open M-Pesa enrollment modal
      setMpesaModalOpen(true);
    }
  };

  if (isCompleted) {
    return (
      <Button disabled className="w-full bg-green-600 hover:bg-green-700">
        ✓ Completed
      </Button>
    );
  }

  if (isEnrolled) {
    return (
      <Button disabled className="w-full bg-blue-600 hover:bg-blue-700">
        → Continue Learning
      </Button>
    );
  }

  return (
    <>
      <Button
        onClick={handleEnroll}
        disabled={adminAccessMutation.isPending}
        className="w-full bg-blue-600 hover:bg-blue-700"
      >
        {isAdmin ? '✓ Get Free Access' : '💳 Enroll Now'}
      </Button>
      {!isAdmin && (
        <MpesaEnrollmentModal
          open={mpesaModalOpen}
          onOpenChange={setMpesaModalOpen}
          courseId={course.courseId}
          courseTitle={course.title}
          price={course.price}
          duration={course.duration}
        />
      )}
    </>
  );
}
