import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { Stethoscope, Users, Building2, Award, BookOpen, ChevronRight } from "lucide-react";
import { FeatureDiscoveryDashboard } from "@/components/FeatureDiscoveryDashboard";
import { QuickStartGuide } from "@/components/QuickStartGuide";
import { FeatureTour } from "@/components/FeatureTour";
import { useEffect, useState, useMemo } from "react";

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
  const { role, setUserRole } = useUserRole();

  // Not logged in → login
  useEffect(() => {
    if (!loading && !user) {
      setLocation("/login");
    }
  }, [loading, user, setLocation]);

  // When user has chosen a role in the Header, redirect to that area
  useEffect(() => {
    if (loading || !user) return;
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
          else setUserRole("provider");
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

  // No userType set → show "Who are you?"
  if (!userType) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Welcome to ResusGPS</h1>
            <p className="text-lg text-muted-foreground">
              Real-time clinical decision support for pediatric emergencies. Tell us who you are so we can personalize your experience.
            </p>
          </div>

          <div className="grid gap-4">
            {/* Healthcare Provider */}
            <Card
              className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-primary"
              onClick={() => handleSetUserType("individual")}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Stethoscope className="w-6 h-6 text-primary" />
                    <div>
                      <CardTitle>Healthcare Provider</CardTitle>
                      <CardDescription>Nurse, doctor, or clinical officer</CardDescription>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  Access ResusGPS bedside tool, complete the Paeds Resus Fellowship, manage patients, and track your clinical performance.
                </p>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>✓ Real-time clinical decision support</li>
                  <li>✓ Micro-courses and Fellowship certification</li>
                  <li>✓ Patient management and tracking</li>
                  <li>✓ Performance analytics</li>
                </ul>
              </CardContent>
            </Card>

            {/* Parent/Caregiver */}
            <Card
              className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-primary"
              onClick={() => handleSetUserType("parent")}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Users className="w-6 h-6 text-primary" />
                    <div>
                      <CardTitle>Parent / Caregiver</CardTitle>
                      <CardDescription>Learning for family members</CardDescription>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  Learn pediatric first aid, access safety resources, and understand when to seek emergency care.
                </p>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>✓ Pediatric first aid training</li>
                  <li>✓ Safety resources and guides</li>
                  <li>✓ Emergency response information</li>
                  <li>✓ Family-focused learning</li>
                </ul>
              </CardContent>
            </Card>

            {/* Institution */}
            <Card
              className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-primary"
              onClick={() => handleSetUserType("institutional")}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Building2 className="w-6 h-6 text-primary" />
                    <div>
                      <CardTitle>Institution</CardTitle>
                      <CardDescription>Hospital, school, or organization</CardDescription>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  Train your staff, track facility-wide outcomes, and improve emergency response capabilities.
                </p>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>✓ Staff training and certification</li>
                  <li>✓ Facility-wide analytics</li>
                  <li>✓ Outcome tracking</li>
                  <li>✓ Institutional reporting</li>
                </ul>
              </CardContent>
            </Card>
          </div>

          <p className="text-center text-sm text-muted-foreground mt-8">
            💡 You can change your role anytime from the header dropdown
          </p>
        </div>
      </div>
    );
  }

  // User has a role → show feature discovery dashboard
  const effectiveRole = useMemo(() => {
    if (role === "provider" || role === "parent" || role === "institution") return role;
    if (userType === "individual") return "provider";
    if (userType === "parent") return "parent";
    if (userType === "institutional") return "institution";
    return "provider";
  }, [role, userType]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <FeatureTour />
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            {effectiveRole === "provider" && "Provider Dashboard"}
            {effectiveRole === "parent" && "Learning Dashboard"}
            {effectiveRole === "institution" && "Institutional Dashboard"}
          </h1>
          <p className="text-muted-foreground">
            {effectiveRole === "provider" && "Access clinical tools, complete your Fellowship, and manage patients."}
            {effectiveRole === "parent" && "Learn pediatric first aid and access safety resources."}
            {effectiveRole === "institution" && "Train your staff and track facility-wide outcomes."}
          </p>
        </div>

        {/* Quick Start Guide */}
        <QuickStartGuide userRole={effectiveRole} />

        {/* Feature Discovery Dashboard */}
        <FeatureDiscoveryDashboard userRole={effectiveRole} />

        {/* Quick Links Section */}
        <div className="mt-12 pt-8 border-t">
          <h2 className="text-xl font-bold mb-4">Quick Links</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="justify-start" asChild>
              <a href="/help">Help & Support</a>
            </Button>
            <Button variant="outline" className="justify-start" asChild>
              <a href="/about">About ResusGPS</a>
            </Button>
            <Button variant="outline" className="justify-start" asChild>
              <a href="/privacy">Privacy Policy</a>
            </Button>
            <Button variant="outline" className="justify-start" asChild>
              <a href="/terms">Terms of Use</a>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
