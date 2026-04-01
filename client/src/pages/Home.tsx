import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { Stethoscope, Users, Building2, ArrowRight, Heart, Briefcase, Share2, BarChart3, Shield } from "lucide-react";

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
    // If they explicitly chose provider role, show hub (don't redirect)
    if (role === "provider") return;
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

  // No userType set (e.g. existing user) → show "Who are you?"
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
      <div className="max-w-2xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold">Welcome back</h1>
          <p className="text-muted-foreground">Choose what you want to do next.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-1">
          <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setLocation("/resus")}>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Stethoscope className="h-5 w-5" />
                  ResusGPS
                </CardTitle>
                <CardDescription>Real-time paediatric emergency guidance at the point of care.</CardDescription>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
          </Card>
          <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setLocation("/safe-truth")}>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Safe-Truth (providers)
                </CardTitle>
                <CardDescription>Confidential event reporting for clinicians — separate from the parent Safe-Truth story.</CardDescription>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
          </Card>
          <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setLocation("/enroll")}>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Enrol in a course</CardTitle>
                <CardDescription>BLS, ACLS, PALS, and fellowship programmes.</CardDescription>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
          </Card>
          <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setLocation("/learner-dashboard")}>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>My learning</CardTitle>
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
                  Refer colleagues
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
                  Personal impact
                </CardTitle>
                <CardDescription>See how your contributions add up over time.</CardDescription>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
          </Card>

          <p className="text-sm text-muted-foreground pt-2">Use the same account as:</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setLocation("/institutional-portal")}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Briefcase className="h-4 w-4" />
                  Institution
                </CardTitle>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="pt-0">
                <CardDescription>Hospital or organisation portal, staff and analytics.</CardDescription>
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setLocation("/parent-safe-truth")}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Heart className="h-4 w-4" />
                  Parent & guardian
                </CardTitle>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="pt-0">
                <CardDescription>Safe-Truth and parent resources.</CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
