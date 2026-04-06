import { useState, useEffect } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Loader2, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

interface CourseStats {
  total: number;
  byLevel: Record<string, number>;
  byCategory: Record<string, number>;
}

export default function AdminCoursesPanel() {
  const { user } = useAuth();
  const [stats, setStats] = useState<CourseStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // tRPC mutations
  const seedMutation = trpc.courses.seedCourses.useMutation();
  const listCoursesQuery = trpc.courses.listAll.useQuery();

  // Verify admin access
  if (user?.email !== 'karuejob@gmail.com') {
    return (
      <div className="p-8 text-center">
        <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
        <p className="text-red-600 font-semibold">Admin access required</p>
      </div>
    );
  }

  // Calculate course statistics
  const calculateStats = (courses: any[]) => {
    if (!courses || courses.length === 0) {
      return null;
    }

    const byLevel: Record<string, number> = {};
    const byCategory: Record<string, number> = {};

    courses.forEach((course) => {
      byLevel[course.level] = (byLevel[course.level] || 0) + 1;
      byCategory[course.emergencyType] = (byCategory[course.emergencyType] || 0) + 1;
    });

    return {
      total: courses.length,
      byLevel,
      byCategory,
    };
  };

  // Update stats when courses load
  useEffect(() => {
    if (listCoursesQuery.data) {
      const newStats = calculateStats(listCoursesQuery.data);
      setStats(newStats);
    }
  }, [listCoursesQuery.data]);

  // Handle seed courses
  const handleSeedCourses = async () => {
    setIsLoading(true);
    try {
      const result = await seedMutation.mutateAsync();
      toast.success('✅ Courses seeded successfully!', {
        description: result.message,
        duration: 5000,
      });

      // Refresh course list
      await listCoursesQuery.refetch();
    } catch (error) {
      toast.error('❌ Failed to seed courses', {
        description: error instanceof Error ? error.message : 'Unknown error',
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle refresh
  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      await listCoursesQuery.refetch();
      toast.success('✅ Course list refreshed');
    } catch (error) {
      toast.error('Failed to refresh courses');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Admin: Course Management</h1>
        <p className="text-slate-600">Manage micro-courses, seed database, and monitor enrollment</p>
      </div>

      {/* Seed Courses Section */}
      <Card className="border-2 border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Seed Courses to Database
          </CardTitle>
          <CardDescription>
            Populate microCourses table with all 26 courses (foundational + advanced tiers)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-white p-4 rounded-lg border border-blue-100">
            <h3 className="font-semibold text-slate-900 mb-2">What will be seeded:</h3>
            <ul className="text-sm text-slate-700 space-y-1">
              <li>✓ 26 micro-courses across 8 emergency categories</li>
              <li>✓ Foundational tier: 45 min, 800 KES each</li>
              <li>✓ Advanced tier: 60 min, 1200 KES each</li>
              <li>✓ Prerequisites enforced (advanced requires foundational)</li>
              <li>✓ 260 total quiz questions (10 per course)</li>
            </ul>
          </div>

          <Button
            onClick={handleSeedCourses}
            disabled={seedMutation.isPending || isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 h-12 text-base font-semibold"
          >
            {seedMutation.isPending || isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Seeding courses...
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-2 h-5 w-5" />
                Seed All 26 Courses
              </>
            )}
          </Button>

          <p className="text-xs text-slate-500 text-center">
            Duplicates will be skipped. Safe to run multiple times.
          </p>
        </CardContent>
      </Card>

      {/* Course Statistics */}
      {stats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Course Statistics</span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isLoading}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Total Courses */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-lg border border-green-200">
              <div className="text-4xl font-bold text-green-700 mb-2">{stats.total}</div>
              <p className="text-green-700 font-semibold">Total Courses Seeded</p>
            </div>

            {/* By Level */}
            <div>
              <h3 className="font-semibold text-slate-900 mb-3">By Difficulty Level</h3>
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(stats.byLevel).map(([level, count]) => (
                  <div key={level} className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <div className="text-2xl font-bold text-slate-900">{count}</div>
                    <p className="text-sm text-slate-600 capitalize">{level} Courses</p>
                    <Badge variant="outline" className="mt-2">
                      {level === 'foundational' ? '45 min, 800 KES' : '60 min, 1200 KES'}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

            {/* By Emergency Type */}
            <div>
              <h3 className="font-semibold text-slate-900 mb-3">By Emergency Category</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Object.entries(stats.byCategory).map(([category, count]) => (
                  <div key={category} className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <div className="text-xl font-bold text-slate-900">{count}</div>
                    <p className="text-xs text-slate-600 capitalize">{category}</p>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {listCoursesQuery.isLoading && (
        <Card>
          <CardContent className="p-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600 mb-4" />
            <p className="text-slate-600">Loading course data...</p>
          </CardContent>
        </Card>
      )}

      {/* Verification Link */}
      <Card className="bg-slate-50 border-slate-200">
        <CardHeader>
          <CardTitle className="text-base">Verify Courses</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-600 mb-4">
            After seeding, verify all courses appear in the catalog:
          </p>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => {
              window.location.href = '/courses';
            }}
          >
            View Course Catalog →
          </Button>
        </CardContent>
      </Card>

      {/* Debug Info */}
      <Card className="bg-gray-50 border-gray-200">
        <CardHeader>
          <CardTitle className="text-sm text-gray-700">Debug Information</CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-gray-600 space-y-1 font-mono">
          <p>Admin: {user?.email}</p>
          <p>Courses Loaded: {stats?.total || 0}</p>
          <p>Seed Status: {seedMutation.isPending ? 'In Progress' : 'Ready'}</p>
        </CardContent>
      </Card>
    </div>
  );
}
