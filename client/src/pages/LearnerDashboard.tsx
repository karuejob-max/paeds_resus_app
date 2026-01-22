import { useAuth } from "@/_core/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, BookOpen, FileText, Users } from "lucide-react";
import { useLocation } from "wouter";
import { getLoginUrl } from "@/const";

export default function LearnerDashboard() {
  const { user, isAuthenticated } = useAuth();
  const { role: selectedRole } = useUserRole();
  const [, navigate] = useLocation();

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-slate-50 to-slate-100">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Sign In Required</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600 mb-4">Sign in to access your dashboard</p>
            <a href={getLoginUrl()}>
              <Button className="w-full bg-blue-900 hover:bg-blue-800">Sign In</Button>
            </a>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-slate-900 mb-2">Welcome, {user?.name}!</h1>
        <p className="text-lg text-slate-600 mb-8">
          {selectedRole === "parent"
            ? "Share your healthcare journey and help improve pediatric care"
            : selectedRole === "provider"
            ? "Log clinical events and contribute to system improvements"
            : "Manage your institution's training programs"}
        </p>

        {!selectedRole ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <AlertCircle className="w-16 h-16 text-orange-600 mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-2">Select Your Role</h2>
                <p className="text-slate-600 mb-6">Choose how you'll use the platform</p>
                <div className="flex gap-3 justify-center flex-wrap">
                  <Button onClick={() => navigate("/")}>Go Back</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : selectedRole === "parent" ? (
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Your Stories
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-blue-600 mb-2">0</p>
                <p className="text-slate-600 mb-4">Healthcare journey events shared</p>
                <Button className="w-full" onClick={() => navigate("/parent-safe-truth")}>
                  Share Your Story
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Community Impact
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-green-600 mb-2">3</p>
                <p className="text-slate-600 mb-4">System improvements identified</p>
                <Button variant="outline" className="w-full">View Impact</Button>
              </CardContent>
            </Card>
          </div>
        ) : selectedRole === "provider" ? (
          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Events Logged
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-blue-600 mb-2">0</p>
                <p className="text-slate-600 mb-4">Clinical events submitted</p>
                <Button className="w-full" onClick={() => navigate("/safe-truth")}>
                  Log Event
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  Certification
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 mb-4">BLS Certification</p>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate("/payment")}
                >
                  Enroll Now
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  System Gaps
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-orange-600 mb-2">5</p>
                <p className="text-slate-600">Gaps identified from events</p>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Staff Members
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-blue-600 mb-2">0</p>
                <p className="text-slate-600">Enrolled in training</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Completion Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-green-600 mb-2">0%</p>
                <p className="text-slate-600">Course completion</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Certifications</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-purple-600 mb-2">0</p>
                <p className="text-slate-600">Issued</p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
