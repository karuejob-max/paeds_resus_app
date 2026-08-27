import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { getOfflineSnapshot, getOfflineSnapshotFreshness, offlineStoreKeys, type OfflineSnapshotFreshness } from "@/lib/offline/platformOfflineStore";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  ClipboardCheck,
  FileText,
  Radio,
  ShieldCheck,
  Users,
  ScanLine,
  WifiOff,
} from "lucide-react";
import ProviderInstitutionReadinessCard from "@/components/ProviderInstitutionReadinessCard";
import ProviderIersActivationCard from "@/components/ProviderIersActivationCard";
import ProviderIersActionCard from "@/components/ProviderIersActionCard";
import ProviderIersDutyAssignmentCard from "@/components/ProviderIersDutyAssignmentCard";
import ProviderIersEvidenceCard from "@/components/ProviderIersEvidenceCard";
import ProviderIersOperationsCard from "@/components/ProviderIersOperationsCard";
import ProviderIersShiftTeamCard from "@/components/ProviderIersShiftTeamCard";
import ProviderShiftReadinessCard from "@/components/ProviderShiftReadinessCard";
import ProviderCrashCartReadinessCard from "@/components/ProviderCrashCartReadinessCard";

const TAB_VALUES = ["team", "readiness", "respond", "improve"] as const;
type TabValue = (typeof TAB_VALUES)[number];

function initialTab(): TabValue {
  if (typeof window === "undefined") return "team";
  const requested = new URLSearchParams(window.location.search).get("tab");
  return TAB_VALUES.includes(requested as TabValue) ? (requested as TabValue) : "team";
}

export default function ProviderMyShift() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabValue>(initialTab);
  const [isOnline, setIsOnline] = useState(() => typeof navigator === "undefined" || navigator.onLine);
  const [offlineSnapshotAt, setOfflineSnapshotAt] = useState<number | null>(null);
  const [offlineSnapshotFreshness, setOfflineSnapshotFreshness] = useState<OfflineSnapshotFreshness | null>(null);

  useEffect(() => {
    const refreshOnline = () => setIsOnline(navigator.onLine);
    window.addEventListener("online", refreshOnline);
    window.addEventListener("offline", refreshOnline);
    return () => {
      window.removeEventListener("online", refreshOnline);
      window.removeEventListener("offline", refreshOnline);
    };
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    void getOfflineSnapshot<any[]>(offlineStoreKeys.providerTeams(user.id, 0)).then((snapshot) => {
      if (cancelled) return;
      if (!snapshot) return;
      const freshness = getOfflineSnapshotFreshness(snapshot, Date.now(), 15 * 60 * 1000);
      setOfflineSnapshotFreshness(freshness);
      setOfflineSnapshotAt(freshness === "expired" ? null : snapshot.savedAt);
    });
    return () => {
      cancelled = true;
    };
  }, [user?.id]);
  const [showInstitutionResponsibilities, setShowInstitutionResponsibilities] = useState(false);

  const changeTab = (value: string) => {
    if (TAB_VALUES.includes(value as TabValue)) setActiveTab(value as TabValue);
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="mx-auto max-w-3xl space-y-4 px-4 py-5 sm:py-7">
        <div className="flex items-start gap-3">
          <Button type="button" variant="ghost" size="icon" className="mt-0.5 shrink-0" aria-label="Back to Today" onClick={() => setLocation("/home")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">Individual Platform</p>
            <h1 className="mt-1 text-2xl font-bold text-slate-950">My Shift</h1>
            <p className="mt-1 text-sm text-slate-500">Your dated ERT work, readiness, response, and improvement actions.</p>
          </div>
        </div>

        {!isOnline && offlineSnapshotAt && (
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="flex items-start gap-3 p-4 text-sm text-amber-950">
              <WifiOff className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
              <div>
                <p className="font-semibold">{offlineSnapshotFreshness === "stale" ? "Stale team snapshot available" : "Last saved team snapshot available"}</p>
                <p className="mt-1 text-xs text-amber-900/80">Saved {new Date(offlineSnapshotAt).toLocaleString()}. This is read-only and may no longer match the live roster. Acceptance, decline, reassignment, activation, arrival, and readiness submission require a live connection.</p>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="border-teal-200 bg-teal-50/60">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base text-teal-950"><ShieldCheck className="h-5 w-5 text-teal-700" />Use only the role and shift assigned to you</CardTitle>
            <CardDescription className="text-teal-900/75">A standing governance role is not the same as a dated response duty. Accepting a duty does not prove that you are responding or at the scene.</CardDescription>
          </CardHeader>
        </Card>

        <Tabs value={activeTab} onValueChange={changeTab} className="space-y-4">
          <TabsList className="grid h-auto w-full grid-cols-2 gap-1 bg-white p-1 sm:grid-cols-4">
            <TabsTrigger value="team" className="min-h-10 gap-1.5 px-2 text-xs sm:text-sm"><Users className="h-4 w-4" />Team & duties</TabsTrigger>
            <TabsTrigger value="readiness" className="min-h-10 gap-1.5 px-2 text-xs sm:text-sm"><ClipboardCheck className="h-4 w-4" />Readiness</TabsTrigger>
            <TabsTrigger value="respond" className="min-h-10 gap-1.5 px-2 text-xs sm:text-sm"><Radio className="h-4 w-4" />Respond</TabsTrigger>
            <TabsTrigger value="improve" className="min-h-10 gap-1.5 px-2 text-xs sm:text-sm"><FileText className="h-4 w-4" />Improve</TabsTrigger>
          </TabsList>

          <TabsContent value="team" className="space-y-4">
            <ProviderInstitutionReadinessCard />
            <ProviderIersShiftTeamCard />
            <Card className="border-slate-200 bg-white">
              <CardContent className="p-3">
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full justify-between px-2 text-left"
                  onClick={() => setShowInstitutionResponsibilities((visible) => !visible)}
                  aria-expanded={showInstitutionResponsibilities}
                >
                  <span>Institution responsibilities</span>
                  <span className="text-xs text-muted-foreground">{showInstitutionResponsibilities ? "Hide" : "Open when needed"}</span>
                </Button>
                {showInstitutionResponsibilities && <div className="mt-3"><ProviderIersDutyAssignmentCard /></div>}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="readiness" className="space-y-4">
            <ProviderShiftReadinessCard />
            <ProviderCrashCartReadinessCard />
            <Card className="border-slate-200 bg-white">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Readiness has two parts</CardTitle>
                <CardDescription>Accept the dated role first. Then the UTL/ERTL checks only what is actually present and records gaps instead of signing off blindly.</CardDescription>
              </CardHeader>
            </Card>
          </TabsContent>
          <TabsContent value="respond" className="space-y-4">
            <Card className="border-red-200 bg-red-50/60">
              <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div><p className="text-sm font-semibold text-red-950">Join an active resuscitation</p><p className="text-xs text-red-900/75">Scan the case QR shown in ResusGPS to link your arrival to the same code.</p></div>
                <Button type="button" className="w-full shrink-0 bg-red-600 text-white hover:bg-red-700 sm:w-auto" onClick={() => setLocation("/activation-scan")}><ScanLine className="mr-2 h-4 w-4" />Scan case QR</Button>
              </CardContent>
            </Card>
            <ProviderIersActivationCard />
            <ProviderIersOperationsCard />
          </TabsContent>
          <TabsContent value="improve" className="space-y-4">
            <ProviderIersEvidenceCard />
            <ProviderIersActionCard />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
