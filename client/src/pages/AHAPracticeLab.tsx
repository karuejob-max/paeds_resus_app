import { useState, useMemo, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  FlaskConical,
  Zap,
  Activity,
  Heart,
  Waves,
  CalendarPlus,
  RefreshCw,
  Lock,
} from "lucide-react";
import { PracticeLabGate } from "@/components/practice-lab/PracticeLabGate";
import { ShockNoShockTrack } from "@/components/practice-lab/ShockNoShockTrack";
import { AbcdeTrack } from "@/components/practice-lab/AbcdeTrack";
import { CardiacArrestTrack } from "@/components/practice-lab/CardiacArrestTrack";
import { RhythmRecognitionTrack } from "@/components/practice-lab/RhythmRecognitionTrack";
import { PartnershipPlaceholders } from "@/components/practice-lab/PartnershipPlaceholders";
import type { PracticeLabProgramType, PracticeLabTrackId } from "@shared/practice-lab-types";

const TRACK_META: Record<
  PracticeLabTrackId,
  { label: string; icon: typeof Zap; description: string }
> = {
  shock_no_shock: {
    label: "Shock / No Shock",
    icon: Zap,
    description: "Rhythm strip + context — shock, cardiovert, treat, or observe",
  },
  abcde: {
    label: "ABCDE Unstable Patient",
    icon: Activity,
    description: "Unstable brady/tachy → arrest → ROSC loop",
  },
  cardiac_arrest: {
    label: "Cardiac Arrest",
    icon: Heart,
    description: "Full CPR simulation with circular algorithm scoring",
  },
  rhythm_recognition: {
    label: "Rhythm Recognition",
    icon: Waves,
    description: "10+ strips — identify only or identify + first action",
  },
};

export default function AHAPracticeLab() {
  const [, setLocation] = useLocation();
  const { data: access, isLoading: accessLoading } = trpc.practiceLab.getAccess.useQuery();

  const [programType, setProgramType] = useState<PracticeLabProgramType>("pals");
  const [enrollmentId, setEnrollmentId] = useState<number | null>(null);
  const [activeTrack, setActiveTrack] = useState<PracticeLabTrackId>("shock_no_shock");
  const [boosterScenarioId, setBoosterScenarioId] = useState<string | undefined>();

  const enrollments = access?.enrollments ?? [];

  useEffect(() => {
    if (enrollments.length > 0 && enrollmentId == null) {
      setEnrollmentId(enrollments[0].id);
      setProgramType(enrollments[0].programType as PracticeLabProgramType);
    }
  }, [enrollments, enrollmentId]);

  const selectedEnrollment = useMemo(() => {
    if (enrollmentId) return enrollments.find((e) => e.id === enrollmentId);
    return enrollments[0];
  }, [enrollmentId, enrollments]);

  const effectiveProgram = (selectedEnrollment?.programType ?? programType) as PracticeLabProgramType;
  const effectiveEnrollmentId = selectedEnrollment?.id ?? enrollmentId;

  const { data: boosters } = trpc.practiceLab.getDueBoosters.useQuery(
    { enrollmentId: effectiveEnrollmentId! },
    { enabled: !!effectiveEnrollmentId && !!access?.hasAccess }
  );

  const { data: weakDomains } = trpc.practiceLab.getWeakDomainSuggestions.useQuery(
    { enrollmentId: effectiveEnrollmentId! },
    { enabled: !!effectiveEnrollmentId && !!access?.hasAccess }
  );

  if (accessLoading) {
    return (
      <div className="min-h-screen bg-background p-8 flex items-center justify-center">
        <p className="text-muted-foreground">Loading Practice Lab…</p>
      </div>
    );
  }

  if (!access?.hasAccess) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8">
        <div className="max-w-lg mx-auto space-y-4">
          <Button variant="ghost" size="sm" onClick={() => setLocation("/aha-courses")} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            AHA Hub
          </Button>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Enrollment required
              </CardTitle>
              <CardDescription>
                Active or completed AHA enrollment (BLS, ACLS, PALS, NRP, or Heartsaver) is required for Practice Lab.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => setLocation("/aha-courses")}>Go to AHA Hub</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const trackProps = {
    programType: effectiveProgram,
    enrollmentId: effectiveEnrollmentId!,
    onBookSession: () => setLocation("/aha-book-session"),
    initialScenarioId: boosterScenarioId,
  };

  return (
    <PracticeLabGate>
      <div className="min-h-screen bg-background p-4 md:p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-start gap-4">
            <Button variant="ghost" size="sm" onClick={() => setLocation("/aha-courses")} className="gap-2 shrink-0">
              <ArrowLeft className="h-4 w-4" />
              AHA Hub
            </Button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
                <FlaskConical className="h-8 w-8" />
                AHA Practice Lab
              </h1>
              <p className="text-muted-foreground mt-1">
                Self-guided simulation — supplemental to your AHA course
              </p>
            </div>
          </div>

          <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20">
            <CardContent className="pt-4 text-xs text-muted-foreground">
              Supplemental practice only. Does not issue AHA certification. Not for live patient care. Algorithms
              reference AHA 2025 (PALS / ACLS).
            </CardContent>
          </Card>

          {enrollments.length > 1 && (
            <div className="flex flex-wrap gap-2">
              {enrollments.map((e) => (
                <Button
                  key={e.id}
                  size="sm"
                  variant={effectiveEnrollmentId === e.id ? "default" : "outline"}
                  onClick={() => {
                    setEnrollmentId(e.id);
                    setProgramType(e.programType as PracticeLabProgramType);
                  }}
                >
                  {String(e.programType).toUpperCase()}
                </Button>
              ))}
            </div>
          )}

          {(boosters?.due?.length ?? 0) > 0 && (
            <Card className="border-blue-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Booster scenarios due
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {boosters!.due.map((b) => (
                  <Button
                    key={`${b.trackId}-${b.scenarioId}`}
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setActiveTrack(b.trackId as PracticeLabTrackId);
                      setBoosterScenarioId(b.scenarioId);
                    }}
                  >
                    {b.trackId.replace(/_/g, " ")} — {b.scenarioId}
                  </Button>
                ))}
              </CardContent>
            </Card>
          )}

          {(weakDomains?.suggestedTracks?.length ?? 0) > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Suggested from exam performance</CardTitle>
                <CardDescription>Based on summative quiz areas scoring below 70%</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {weakDomains!.suggestedTracks.map((t) => (
                  <Badge
                    key={t}
                    className="cursor-pointer"
                    onClick={() => setActiveTrack(t)}
                  >
                    {TRACK_META[t]?.label ?? t}
                  </Badge>
                ))}
              </CardContent>
            </Card>
          )}

          <Tabs value={activeTrack} onValueChange={(v) => {
            setActiveTrack(v as PracticeLabTrackId);
            setBoosterScenarioId(undefined);
          }}>
            <TabsList className="flex flex-wrap h-auto gap-1">
              {(Object.keys(TRACK_META) as PracticeLabTrackId[]).map((id) => {
                const meta = TRACK_META[id];
                const Icon = meta.icon;
                return (
                  <TabsTrigger key={id} value={id} className="gap-1 text-xs sm:text-sm">
                    <Icon className="h-3 w-3" />
                    {meta.label}
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {(Object.keys(TRACK_META) as PracticeLabTrackId[]).map((id) => (
              <TabsContent key={id} value={id} className="mt-4 space-y-4">
                <p className="text-sm text-muted-foreground">{TRACK_META[id].description}</p>
                {id === "shock_no_shock" && <ShockNoShockTrack {...trackProps} />}
                {id === "abcde" && <AbcdeTrack {...trackProps} />}
                {id === "cardiac_arrest" && <CardiacArrestTrack {...trackProps} />}
                {id === "rhythm_recognition" && <RhythmRecognitionTrack {...trackProps} />}
              </TabsContent>
            ))}
          </Tabs>

          <Card>
            <CardContent className="pt-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="font-semibold">Ready for hands-on skills?</p>
                <p className="text-sm text-muted-foreground">
                  Practice Lab supplements cognitive learning — book a practical session for certification.
                </p>
              </div>
              <Button variant="outline" className="gap-2 shrink-0" onClick={() => setLocation("/aha-book-session")}>
                <CalendarPlus className="h-4 w-4" />
                Book skills session
              </Button>
            </CardContent>
          </Card>

          <PartnershipPlaceholders />
        </div>
      </div>
    </PracticeLabGate>
  );
}
