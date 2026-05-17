import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FacilityCareSignalDashboard } from "@/components/FacilityCareSignalDashboard";
import { Shield, Building2 } from "lucide-react";

export default function AdminFacilityCareSignal() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, setLocation] = useLocation();
  const [facilityName, setFacilityName] = useState("");

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) {
      setLocation("/login");
      return;
    }
    if ((user as { role?: string })?.role !== "admin") {
      setLocation("/");
    }
  }, [user, isAuthenticated, loading, setLocation]);

  const adminOk = Boolean(isAuthenticated && (user as { role?: string })?.role === "admin");

  const { data: facilityList } = trpc.adminStats.listCareSignalFacilities.useQuery(
    { limit: 100 },
    { enabled: adminOk }
  );

  useEffect(() => {
    if (!facilityName && facilityList?.facilities?.[0]?.facilityName) {
      setFacilityName(facilityList.facilities[0].facilityName);
    }
  }, [facilityList, facilityName]);

  if (loading || !adminOk) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Building2 className="h-7 w-7" />
                Facility Care Signal
              </h1>
              <p className="text-muted-foreground text-sm">
                Per-hospital QI dashboard from Care Signal submissions and provider roster
              </p>
            </div>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => setLocation("/admin")}>
            ← Admin hub
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Select facility</CardTitle>
            <CardDescription>
              Facility name is matched to metadata on Care Signal events and provider profiles
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={facilityName} onValueChange={setFacilityName}>
              <SelectTrigger className="max-w-md">
                <SelectValue placeholder="Choose facility" />
              </SelectTrigger>
              <SelectContent>
                {(facilityList?.facilities ?? []).map((f) => (
                  <SelectItem key={f.facilityName} value={f.facilityName}>
                    {f.facilityName} ({f.eventCount})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {facilityName ? (
          <FacilityCareSignalDashboard facilityName={facilityName} lastDays={90} />
        ) : (
          <p className="text-sm text-muted-foreground">No facilities with Care Signal data yet.</p>
        )}
      </div>
    </div>
  );
}

