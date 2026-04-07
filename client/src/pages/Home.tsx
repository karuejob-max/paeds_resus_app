import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { Stethoscope, Users, Building2, ArrowRight, Heart, Briefcase, Share2, BarChart3, Shield, Award, BookOpen, Zap } from "lucide-react";

type UserType = "individual" | "parent" | "institutional";

export default function Home() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const updateUserType = trpc.auth.updateUserType.useMutation({
    onSuccess: () => {
      utils.auth.me.invalidate();
    },
  });

  const userType = user?.userType ?? null;

  // Not logged in → login
  useEffect(() => {
    if (!loading && !user) {
      setLocation("/login");
    }
  }, [loading, user, setLocation]);

  // When user has chosen "parent" or "institution" in the Header, redirect to that area (so default landing matches role)
  const { role } = useUserRole();
  useEffect(() => {
    if (loading || !user) return;
    // If they explicitly chose a role via the header dropdown, respect that choice
    // (role takes precedence over userType from database)
    if (role === "provider") return; // Stay on provider hub
    if (role === "parent") {
      setLocation("/parent-safe-truth");
      return;
    }
    if (role === "institution") {
      setLocation("/institutional-portal");
      return;
    }
    // If no explicit role chosen yet, use userType from database
    if (userType === "parent") {
      setLocation("/parent-safe-truth");
      return;
    }
    if (userType === "institutional") {
      setLocation("/institutional-portal");
      return;
    }
  }, [user, userType, role, loading, setLocation]);

  const handleSetUserType = (type: UserType) => {
    updateUserType.mutate(
      { userType: type },
      {
        onSuccess: () => {
          if (type === "parent") setLocation("/parent-safe-truth");
          else if (type === "institutional") setLocation("/institutional-portal");
        },
      }
    );
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  // No userType set (e.g existing user) → show "Who are you?"
  if (!userType) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Welcome</CardTitle>
            <CardDescription>Choose how you&apos;ll use the platform so we can show you the right tools.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <RadioGroup
              onValueChange={(v) => handleSetUserType(v as UserType)}
              className="grid gap-3"
              disabled={updateUserType.isPending}
            >
              <Label className="flex items-center gap-3 rounded-lg border p-4 cursor-pointer hover:bg-muted/50 has-[[data-state=checked]]:border-primary">
                <RadioGroupItem value="individual" id="onb-individual" />
                <Stethoscope className="h-5 w-5" />
                <div>
                  <p className="font-medium">Healthcare provider</p>
                  <p className="text-sm text-muted-foreground">Paeds Resus, courses, and learning</p>
                </div>
              </Label>
              <Label className="flex items-center gap-3 rounded-lg border p-4 cursor-pointer hover:bg-muted/50 has-[[data-state=checked]]:border-primary">
                <RadioGroupItem value="parent" id="onb-parent" />
                <Users className="h-5 w-5" />
                <div>
                  <p className="font-medium">Parent or guardian</p>
                  <p className="text-sm text-muted-foreground">Safe-Truth and parent resources</p>
                </div>
              </Label>
              <Label className="flex items-center gap-3 rounded-lg border p-4 cursor-pointer hover:bg-muted/50 has-[[data-state=checked]]:border-primary">
                <RadioGroupItem value="institutional" id="onb-institutional" />
                <Building2 className="h-5 w-5" />
                <div>
                  <p className="font-medium">Institution</p>
                  <p className="text-sm text-muted-foreground">Hospital or organisation portal</p>
                </div>
              </Label>
            </RadioGroup>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Provider home (individual) — also reachable when switching to "Healthcare provider"; show hub + cross-context links
  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Hero Section: Fellowship Value Proposition */}
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950 rounded-lg p-6 md:p-8 border border-emerald-200 dark:border-emerald-800">
          <div className="flex items-start gap-4">
            <Award className="h-8 w-8 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-emerald-900 dark:text-emerald-100 mb-2">
                Become a Paeds Resus Fellow
              </h2>
              <p className="text-emerald-800 dark:text-emerald-200 mb-4">
                Earn your fellowship through a comprehensive 3-pillar qualification program. Complete courses, manage real ResusGPS cases, and participate in monthly Care Signal reporting to demonstrate mastery in pediatric emergency care.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white dark:bg-emerald-900/30 rounded p-3 border border-emerald-100 dark:border-emerald-700">
                  <p className="text-sm font-medium text-emerald-900 dark:text-emerald-100 flex items-center gap-2">
                    <BookOpen className="h-4 w-4" /> 26 Courses
                  </p>
                  <p className="text-xs text-emerald-700 dark:text-emerald-300">Master all emergency conditions</p>
                </div>
                <div className="bg-white dark:bg-emerald-900/30 rounded p-3 border border-emerald-100 dark:border-emerald-700">
                  <p className="text-sm font-medium text-emerald-900 dark:text-emerald-100 flex items-center gap-2">
                    <Zap className="h-4 w-4" /> ResusGPS Cases
                  </p>
                  <p className="text-xs text-emerald-700 dark:text-emerald-300">3+ cases per condition taught</p>
                </div>
                <div className="bg-white dark:bg-emerald-900/30 rounded p-3 border border-emerald-100 dark:border-emerald-700">
                  <p className="text-sm font-medium text-emerald-900 dark:text-emerald-100 flex items-center gap-2">
                    <Heart className="h-4 w-4" /> Care Signal
                  </p>
                  <p className="text-xs text-emerald-700 dark:text-emerald-300">24 months of incident reporting</p>
                </div>
              </div>
              <Button 
                onClick={() => setLocation("/fellowship")}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                View Your Fellowship Progress
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>

        {/* Main Navigation */}
        <div>
          <h1 className="text-2xl font-bold mb-2">Welcome back</h1>
          <p className="text-muted-foreground">Choose what you want to do next.</p>
        </div>

        {/* Primary Actions */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Fellowship Dashboard - Prominent */}
          <Card className="cursor-pointer hover:border-emerald-500/50 transition-colors border-2 border-emerald-200 dark:border-emerald-800 md:col-span-2" onClick={() => setLocation("/fellowship")}>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                  <Award className="h-5 w-5" />
                  Fellowship Qualification Dashboard
                </CardTitle>
                <CardDescription>Track your progress across all 3 pillars: Courses, ResusGPS cases, and Care Signal participation</CardDescription>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
          </Card>

          {/* ResusGPS */}
          <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setLocation("/resus")}>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Stethoscope className="h-5 w-5" />
                  ResusGPS
                </CardTitle>
                <CardDescription>Real-time paediatric emergency guidance. Cases count toward fellowship.</CardDescription>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
          </Card>

          {/* Courses */}
          <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setLocation("/fellowship")}>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Courses
                </CardTitle>
                <CardDescription>All 26 micro-courses. Complete to earn your fellowship.</CardDescription>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
          </Card>

          {/* Care Signal */}
          <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setLocation("/safe-truth")}>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5" />
                  Care Signal
                </CardTitle>
                <CardDescription>Report incidents. Monthly participation counts toward fellowship.</CardDescription>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
          </Card>
        </div>

        {/* Secondary Actions */}
        <div className="border-t pt-6">
          <h2 className="text-lg font-semibold mb-4">Other Resources</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setLocation("/learner-dashboard")}>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>My Learning</CardTitle>
                  <CardDescription>View your progress and certificates.</CardDescription>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
            </Card>
            <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setLocation("/referral")}>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Share2 className="h-5 w-5" />
                    Refer Colleagues
                  </CardTitle>
                  <CardDescription>Invite others and track referral impact.</CardDescription>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
            </Card>
            <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setLocation("/personal-impact")}>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Your Impact
                  </CardTitle>
                  <CardDescription>See the lives you&apos;ve helped save.</CardDescription>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
