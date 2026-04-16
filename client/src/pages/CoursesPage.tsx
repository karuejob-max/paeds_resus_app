/**
 * Courses Page: Browse and enroll in micro-courses
 * Aligned with PSOT §16 (Learning products: UX, certificates, tiered courses)
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Users, Award, ShoppingCart } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';

export function CoursesPage() {
  const { data: courses, isLoading } = trpc.microCourses.listCourses.useQuery();
  const enrollMutation = trpc.courses.enroll.useMutation({
    onSuccess: () => {
      toast.success('Successfully enrolled in course!');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to enroll');
    },
  });

  if (isLoading) {
    return <div className="p-8">Loading courses...</div>;
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-2">Paediatric Emergency Micro-Courses</h1>
          <p className="text-lg text-muted-foreground">
            Condition-focused, short-form courses aligned with ResusGPS for low-resource hospitals
          </p>
        </div>

        {/* Course Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {courses?.map((course) => (
            <CourseCard key={course.id} course={course} onEnroll={enrollMutation.mutate} isEnrolling={enrollMutation.isPending} />
          ))}
        </div>

        {/* Learning Journeys Section */}
        <div className="mt-16 pt-12 border-t">
          <h2 className="text-2xl font-bold mb-6">Learning Journeys</h2>
          <p className="text-muted-foreground mb-8">
            Complete sequences of courses designed for comprehensive clinical mastery
          </p>

          <div className="grid gap-6 md:grid-cols-2">
            <LearningJourneyCard
              title="Paediatric Septic Shock Journey"
              description="Master recognition and management of septic shock from foundational to advanced"
              courses={['Septic Shock I', 'Septic Shock II']}
              duration={90}
              priceCents={40000}
            />
            <LearningJourneyCard
              title="Paediatric Asthma Journey"
              description="From acute asthma exacerbation to status asthmaticus management"
              courses={['Asthma I', 'Asthma II']}
              duration={90}
              priceCents={40000}
              comingSoon
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Course Card: Show course details and enroll button
 */
function CourseCard({ course, onEnroll, isEnrolling }: { course: any; onEnroll: any; isEnrolling: boolean }) {
  const priceKes = (course.price / 100).toFixed(0);

  return (
    <Card className="flex flex-col h-full hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between mb-2">
          <Badge variant="outline">{course.level}</Badge>
          <Badge variant="secondary">KES {priceKes}</Badge>
        </div>
        <CardTitle className="text-xl">{course.courseDisplayName}</CardTitle>
        <CardDescription>{course.description}</CardDescription>
      </CardHeader>

      <CardContent className="flex-1 space-y-4">
        {/* Course Details */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>{course.duration} minutes</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>{course.targetAudience}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Award className="h-4 w-4" />
            <span>Certificate included</span>
          </div>
        </div>

        {/* ResusGPS Alignment */}
        <div className="pt-2 border-t">
          <p className="text-xs font-semibold text-muted-foreground mb-2">ResusGPS Alignment</p>
          <div className="flex gap-1">
            {course.alignment?.map((letter: string) => (
              <Badge key={letter} variant="outline" className="font-mono text-xs">
                {letter}
              </Badge>
            ))}
          </div>
        </div>

        {/* Enroll Button */}
        <Button
          className="w-full mt-4"
          onClick={() => onEnroll({ courseId: course.courseId ?? course.id })}
          disabled={isEnrolling}
        >
          <ShoppingCart className="h-4 w-4 mr-2" />
          {isEnrolling ? 'Enrolling...' : 'Enroll Now'}
        </Button>
      </CardContent>
    </Card>
  );
}

/**
 * Learning Journey Card: Show course sequence
 */
function LearningJourneyCard({
  title,
  description,
  courses,
  duration,
  priceCents,
  comingSoon,
}: {
  title: string;
  description: string;
  courses: string[];
  duration: number;
  priceCents: number;
  comingSoon?: boolean;
}) {
  const priceKes = (priceCents / 100).toFixed(0);

  return (
    <Card className={`flex flex-col h-full ${comingSoon ? 'opacity-60' : 'hover:shadow-lg transition-shadow'}`}>
      <CardHeader>
        <div className="flex items-start justify-between mb-2">
          {comingSoon && <Badge variant="outline">Coming Soon</Badge>}
          <Badge variant="secondary">KES {priceKes} total</Badge>
        </div>
        <CardTitle className="text-xl">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>

      <CardContent className="flex-1 space-y-4">
        {/* Course Sequence */}
        <div className="space-y-2">
          <p className="text-sm font-semibold text-foreground">Courses included:</p>
          <ul className="space-y-1">
            {courses.map((course, index) => (
              <li key={index} className="text-sm text-muted-foreground flex items-center gap-2">
                <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-primary/10 text-xs font-semibold">
                  {index + 1}
                </span>
                {course}
              </li>
            ))}
          </ul>
        </div>

        {/* Journey Details */}
        <div className="pt-2 border-t space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>{duration} minutes total</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Award className="h-4 w-4" />
            <span>2 certificates</span>
          </div>
        </div>

        {/* Enroll Button */}
        <Button className="w-full mt-4" disabled={comingSoon}>
          {comingSoon ? 'Coming Soon' : 'Enroll in Journey'}
        </Button>
      </CardContent>
    </Card>
  );
}
