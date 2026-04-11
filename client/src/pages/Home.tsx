import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { Stethoscope, Users, Building2, Award, BookOpen } from "lucide-react";

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
                  <p className="font-medium">Healthcare Provider</p>
                  <p className="text-sm text-muted-foreground">Access ResusGPS, micro-courses, clinical tools, and learning dashboards for individual practice</p>
                </div>
              </Label>
              <Label className="flex items-center gap-3 rounded-lg border p-4 cursor-pointer hover:bg-muted/50 has-[[data-state=checked]]:border-primary">
                <RadioGroupItem value="parent" id="onb-parent" />
                <Heart className="h-5 w-5" />
                <div>
                  <p className="font-medium">Parent / Caregiver</p>
                  <p className="text-sm text-muted-foreground">Learn pediatric emergency response, first aid, and safety tips for your family</p>
                </div>
              </Label>
              <Label className="flex items-center gap-3 rounded-lg border p-4 cursor-pointer hover:bg-muted/50 has-[[data-state=checked]]:border-primary">
                <RadioGroupItem value="institutional" id="onb-institutional" />
                <Building2 className="h-5 w-5" />
                <div>
                  <p className="font-medium">Institution / Hospital</p>
                  <p className="text-sm text-muted-foreground">Manage staff training, track facility performance, and institutional subscriptions</p>
                </div>
              </Label>
            </RadioGroup>
          </CardContent>
          <div className="px-6 pb-4 text-center">
            <p className="text-xs text-muted-foreground">You can change your role anytime from the account menu</p>
          </div>
        </Card>
      </div>
    );
  }

  // Provider home (individual) — show minimal 2-button interface
  if (userType === "individual") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-md space-y-4">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold">What would you like to do?</h1>
          </div>

          <Button
            onClick={() => setLocation("/fellowship")}
            size="lg"
            className="w-full h-20 text-lg font-semibold"
          >
            <Award className="h-6 w-6 mr-3" />
            Fellowship
          </Button>

          <Button
            onClick={() => setLocation("/aha-courses")}
            size="lg"
            variant="outline"
            className="w-full h-20 text-lg font-semibold"
          >
            <BookOpen className="h-6 w-6 mr-3" />
            AHA Courses
          </Button>
        </div>
      </div>
    );
  }

  // Fallback (shouldn't reach here)
  return null;
}
