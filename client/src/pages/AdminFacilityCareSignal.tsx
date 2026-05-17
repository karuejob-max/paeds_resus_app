import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FacilityCareSignalDashboard } from "@/components/FacilityCareSignalDashboard";
import { Badge } from "@/components/ui/badge";
import { Shield, Building2, MapPin, Globe, Merge, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function AdminFacilityCareSignal() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, setLocation] = useLocation();
  const [tab, setTab] = useState("facility");
  const [facilityKey, setFacilityKey] = useState("");
  const [county, setCounty] = useState("");
  const [country, setCountry] = useState("Kenya");
  const [mergeSource, setMergeSource] = useState("");
  const [mergeTarget, setMergeTarget] = useState("");

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

  const { data: geoAreas } = trpc.facilities.listGeographicAreas.useQuery(undefined, {
    enabled: adminOk,
  });

  const { data: mergeList } = trpc.facilities.listForMerge.useQuery(
    { limit: 150 },
    { enabled: adminOk && tab === "merge" }
  );

  const { data: countyDashboard } = trpc.facilities.getGeographicCareSignalDashboard.useQuery(
    { level: "county", name: county, lastDays: 90 },
    { enabled: adminOk && tab === "county" && county.length > 0 }
  );

  const { data: countryDashboard } = trpc.facilities.getGeographicCareSignalDashboard.useQuery(
    { level: "country", name: country, lastDays: 90 },
    { enabled: adminOk && tab === "country" && country.length > 0 }
  );

  const mergeMutation = trpc.facilities.mergeFacilities.useMutation({
    onSuccess: (r) => {
      toast.success(`Merged facility ${r.sourceFacilityId} → ${r.targetFacilityId}`);
      setMergeSource("");
      setMergeTarget("");
    },
    onError: (e) => toast.error(e.message),
  });

  useEffect(() => {
    if (!facilityKey && facilityList?.facilities?.[0]) {
      const f = facilityList.facilities[0];
      setFacilityKey(f.facilityId > 0 ? `id:${f.facilityId}` : `name:${f.facilityName}`);
    }
  }, [facilityList, facilityKey]);

  useEffect(() => {
    if (!county && geoAreas?.counties?.[0]) setCounty(geoAreas.counties[0]);
    if (!country && geoAreas?.countries?.[0]) setCountry(geoAreas.countries[0]);
  }, [geoAreas, county, country]);

  if (loading || !adminOk) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  const selectedFacility = facilityList?.facilities.find((f) =>
    f.facilityId > 0 ? facilityKey === `id:${f.facilityId}` : facilityKey === `name:${f.facilityName}`
  );

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Building2 className="h-7 w-7" />
                Care Signal geography
              </h1>
              <p className="text-muted-foreground text-sm">
                Facility, county, and country QI — powered by provider-selected facilities
              </p>
            </div>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => setLocation("/admin")}>
            ← Admin hub
          </Button>
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="facility">Facility</TabsTrigger>
            <TabsTrigger value="county">County</TabsTrigger>
            <TabsTrigger value="country">Country</TabsTrigger>
            <TabsTrigger value="merge">Merge aliases</TabsTrigger>
          </TabsList>

          <TabsContent value="facility" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Select facility</CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={facilityKey} onValueChange={setFacilityKey}>
                  <SelectTrigger className="max-w-md">
                    <SelectValue placeholder="Choose facility" />
                  </SelectTrigger>
                  <SelectContent>
                    {(facilityList?.facilities ?? []).map((f) => {
                      const key = f.facilityId > 0 ? `id:${f.facilityId}` : `name:${f.facilityName}`;
                      return (
                        <SelectItem key={key} value={key}>
                          {f.facilityName}
                          {f.county ? ` · ${f.county}` : ""} ({f.eventCount})
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
            {selectedFacility ? (
              <FacilityCareSignalDashboard
                facilityId={selectedFacility.facilityId > 0 ? selectedFacility.facilityId : undefined}
                facilityName={
                  selectedFacility.facilityId > 0 ? undefined : selectedFacility.facilityName
                }
                lastDays={90}
              />
            ) : (
              <p className="text-sm text-muted-foreground">No facility data yet.</p>
            )}
          </TabsContent>

          <TabsContent value="county" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  County rollup
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={county} onValueChange={setCounty}>
                  <SelectTrigger className="max-w-xs">
                    <SelectValue placeholder="County" />
                  </SelectTrigger>
                  <SelectContent>
                    {(geoAreas?.counties ?? []).map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
            {countyDashboard ? (
              <GeoSummary data={countyDashboard} />
            ) : null}
          </TabsContent>

          <TabsContent value="country" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Country rollup
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={country} onValueChange={setCountry}>
                  <SelectTrigger className="max-w-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(geoAreas?.countries ?? []).map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
            {countryDashboard ? <GeoSummary data={countryDashboard} /> : null}
          </TabsContent>

          <TabsContent value="merge" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Merge className="h-5 w-5" />
                  Merge duplicate facilities
                </CardTitle>
                <CardDescription>
                  Moves Care Signal events and provider profiles from the source name to the canonical
                  target. Source row is marked merged.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Source (duplicate)</Label>
                    <Select value={mergeSource} onValueChange={setMergeSource}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select source" />
                      </SelectTrigger>
                      <SelectContent>
                        {(mergeList?.facilities ?? []).map((f) => (
                          <SelectItem key={f.id} value={String(f.id)}>
                            {f.name} {f.county ? `· ${f.county}` : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Target (keep)</Label>
                    <Select value={mergeTarget} onValueChange={setMergeTarget}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select target" />
                      </SelectTrigger>
                      <SelectContent>
                        {(mergeList?.facilities ?? []).map((f) => (
                          <SelectItem key={f.id} value={String(f.id)}>
                            {f.name} {f.county ? `· ${f.county}` : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button
                  type="button"
                  disabled={!mergeSource || !mergeTarget || mergeMutation.isPending}
                  onClick={() =>
                    mergeMutation.mutate({
                      sourceFacilityId: Number(mergeSource),
                      targetFacilityId: Number(mergeTarget),
                    })
                  }
                >
                  {mergeMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Merge facilities"
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function GeoSummary({
  data,
}: {
  data: {
    name: string;
    level: string;
    facilitiesInArea: number;
    totalSubmissions: number;
    underReviewCount: number;
    topGaps: Array<{ gap: string; count: number }>;
    topFacilities: Array<{ facilityName: string; count: number }>;
  };
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Facilities in area</CardDescription>
          <CardTitle className="text-2xl">{data.facilitiesInArea}</CardTitle>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Submissions (90d)</CardDescription>
          <CardTitle className="text-2xl">{data.totalSubmissions}</CardTitle>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Under review</CardDescription>
          <CardTitle className="text-2xl">{data.underReviewCount}</CardTitle>
        </CardHeader>
      </Card>
      <Card className="sm:col-span-2 lg:col-span-1">
        <CardHeader className="pb-2">
          <CardDescription>Top gaps</CardDescription>
        </CardHeader>
        <CardContent className="text-xs space-y-1">
          {data.topGaps.map((g) => (
            <div key={g.gap} className="flex justify-between">
              <span>{g.gap}</span>
              <Badge variant="secondary">{g.count}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>
      {data.topFacilities.length > 0 ? (
        <Card className="sm:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Top facilities</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="text-sm space-y-1">
              {data.topFacilities.map((f) => (
                <li key={f.facilityName} className="flex justify-between">
                  <span>{f.facilityName}</span>
                  <span className="text-muted-foreground">{f.count}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
