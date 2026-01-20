import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";

export default function StakeholderHome() {
  const { data: user } = trpc.auth.me.useQuery();
  const [userType, setUserType] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      // Determine user type from metadata or role
      const type = (user as any).userType || user.role || "learner";
      setUserType(type);
    }
  }, [user]);

  if (!userType) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {userType === "healthcare_provider" && <HealthcareProviderHome />}
      {userType === "institution" && <InstitutionHome />}
      {userType === "parent" && <ParentHome />}
      {userType === "learner" && <LearnerHome />}
      {userType === "admin" && <AdminHome />}
      {!["healthcare_provider", "institution", "parent", "learner", "admin"].includes(userType) && (
        <DefaultHome />
      )}
    </div>
  );
}

function HealthcareProviderHome() {
  const { data: analytics } = trpc.analytics.getDashboardSummary.useQuery();
  // const { data: personalization } = trpc.personalization.getRecommendations.useQuery({
  //   userType: "healthcare_provider",
  // });

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Welcome, Healthcare Provider</h1>
        <p className="text-xl text-gray-600">
          Empower your team with world-class pediatric resuscitation training
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <Card>
          <CardHeader>
            <CardTitle>Team Members</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">0</p>
            <p className="text-sm text-gray-600">Enrolled in training</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Completion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">0%</p>
            <p className="text-sm text-gray-600">Average progress</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Certificates</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">0</p>
            <p className="text-sm text-gray-600">Issued to team</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Impact</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">0</p>
            <p className="text-sm text-gray-600">Lives potentially saved</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Get started with your team training</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/enrollment">
              <Button className="w-full justify-start">+ Enroll Team Members</Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="outline" className="w-full justify-start">
                📊 View Team Progress
              </Button>
            </Link>
            <Link href="/institutional-management">
              <Button variant="outline" className="w-full justify-start">
                ⚙️ Manage Institution
              </Button>
            </Link>
            <Link href="/analytics">
              <Button variant="outline" className="w-full justify-start">
                📈 View Analytics
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recommended Courses</CardTitle>
            <CardDescription>Tailored for your team's needs</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-3 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-gray-900">BLS for Healthcare Providers</h4>
              <p className="text-sm text-gray-600">4 hours • Beginner</p>
              <Button size="sm" className="mt-2">
                Start Course
              </Button>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-gray-900">PALS Certification</h4>
              <p className="text-sm text-gray-600">16 hours • Intermediate</p>
              <Button size="sm" className="mt-2">
                Start Course
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function InstitutionHome() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Welcome, Institution</h1>
        <p className="text-xl text-gray-600">
          Scale pediatric resuscitation training across your organization
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <Card>
          <CardHeader>
            <CardTitle>Total Learners</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">0</p>
            <p className="text-sm text-gray-600">Across all programs</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Programs</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">0</p>
            <p className="text-sm text-gray-600">Active training programs</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>ROI</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">0%</p>
            <p className="text-sm text-gray-600">Return on investment</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Impact Score</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">0</p>
            <p className="text-sm text-gray-600">Lives impacted</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Institution Management</CardTitle>
            <CardDescription>Manage your organization's training programs</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/institutional-management">
              <Button className="w-full justify-start">⚙️ Manage Institution</Button>
            </Link>
            <Link href="/analytics">
              <Button variant="outline" className="w-full justify-start">
                📊 View Analytics
              </Button>
            </Link>
            <Link href="/enrollment">
              <Button variant="outline" className="w-full justify-start">
                👥 Bulk Enrollment
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Featured Programs</CardTitle>
            <CardDescription>Popular training programs for institutions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-3 bg-green-50 rounded-lg">
              <h4 className="font-semibold text-gray-900">Hospital-Wide BLS Program</h4>
              <Badge className="mt-2">Recommended</Badge>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <h4 className="font-semibold text-gray-900">Pediatric Emergency Response</h4>
              <Badge className="mt-2">Popular</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ParentHome() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Welcome, Parent</h1>
        <p className="text-xl text-gray-600">Learn life-saving skills to protect your child</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        <Card>
          <CardHeader>
            <CardTitle>Your Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">0%</p>
            <p className="text-sm text-gray-600">Course completion</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Certificates</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">0</p>
            <p className="text-sm text-gray-600">Earned certificates</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Knowledge</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">0</p>
            <p className="text-sm text-gray-600">Skills learned</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Start Learning</CardTitle>
            <CardDescription>Essential skills for parents</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/enrollment">
              <Button className="w-full justify-start">🎓 Enroll in a Course</Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="outline" className="w-full justify-start">
                📚 My Courses
              </Button>
            </Link>
            <Link href="/search">
              <Button variant="outline" className="w-full justify-start">
                🔍 Browse Courses
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Parent-Focused Courses</CardTitle>
            <CardDescription>Designed for parents and caregivers</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-3 bg-purple-50 rounded-lg">
              <h4 className="font-semibold text-gray-900">Infant CPR & First Aid</h4>
              <p className="text-sm text-gray-600">2 hours • Beginner</p>
              <Button size="sm" className="mt-2">
                Enroll Now
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function LearnerHome() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Welcome Back, Learner</h1>
        <p className="text-xl text-gray-600">Continue your journey to becoming a resuscitation expert</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <Card>
          <CardHeader>
            <CardTitle>Courses Enrolled</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">0</p>
            <p className="text-sm text-gray-600">Active courses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Completion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">0%</p>
            <p className="text-sm text-gray-600">Overall progress</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Certificates</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">0</p>
            <p className="text-sm text-gray-600">Earned</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Points</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">0</p>
            <p className="text-sm text-gray-600">Gamification points</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Continue Learning</CardTitle>
            <CardDescription>Pick up where you left off</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/dashboard">
              <Button className="w-full justify-start">📚 My Courses</Button>
            </Link>
            <Link href="/learner-progress">
              <Button variant="outline" className="w-full justify-start">
                📈 View Progress
              </Button>
            </Link>
            <Link href="/search">
              <Button variant="outline" className="w-full justify-start">
                🔍 Explore Courses
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Achievements</CardTitle>
            <CardDescription>Your badges and milestones</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-3 bg-yellow-50 rounded-lg">
              <p className="text-sm text-gray-600">Complete your first course to earn badges!</p>
              <Button size="sm" className="mt-2">
                Start Now
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function AdminHome() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Admin Dashboard</h1>
        <p className="text-xl text-gray-600">Platform management and oversight</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <Card>
          <CardHeader>
            <CardTitle>Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">0</p>
            <p className="text-sm text-gray-600">Registered users</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Active Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">0</p>
            <p className="text-sm text-gray-600">Currently online</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">$0</p>
            <p className="text-sm text-gray-600">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Health</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">100%</p>
            <p className="text-sm text-gray-600">Uptime</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Admin Tools</CardTitle>
            <CardDescription>Platform management</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/admin-dashboard">
              <Button className="w-full justify-start">📊 Admin Dashboard</Button>
            </Link>
            <Link href="/analytics">
              <Button variant="outline" className="w-full justify-start">
                📈 Analytics
              </Button>
            </Link>
            <Link href="/sms-management">
              <Button variant="outline" className="w-full justify-start">
                📱 SMS Management
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
            <CardDescription>Platform health and metrics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-3 bg-green-50 rounded-lg">
              <p className="text-sm font-semibold text-green-900">✓ All Systems Operational</p>
              <p className="text-xs text-gray-600 mt-1">Last checked: Just now</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function DefaultHome() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Welcome to Paeds Resus</h1>
        <p className="text-xl text-gray-600">
          World-class pediatric resuscitation training for healthcare professionals
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Get Started</CardTitle>
            <CardDescription>Choose your learning path</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/enrollment">
              <Button className="w-full justify-start">🎓 Enroll Now</Button>
            </Link>
            <Link href="/search">
              <Button variant="outline" className="w-full justify-start">
                🔍 Browse Courses
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Verify Certificate</CardTitle>
            <CardDescription>Check certificate authenticity</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/certificate-verification">
              <Button className="w-full justify-start">✓ Verify Certificate</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
