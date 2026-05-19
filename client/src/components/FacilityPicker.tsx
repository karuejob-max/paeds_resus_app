import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Building2, Loader2 } from "lucide-react";
import { COMMON_FACILITY_COUNTRIES, KENYA_COUNTIES } from "@shared/kenya-counties";

export type FacilitySelection = {
  facilityId: number;
  facilityName: string;
  county: string | null;
  country: string;
};

type Props = {
  value: FacilitySelection | null;
  onChange: (value: FacilitySelection | null) => void;
  required?: boolean;
  showProfileHint?: boolean;
};

export function FacilityPicker({ value, onChange, required, showProfileHint = true }: Props) {
  const [query, setQuery] = useState(value?.facilityName ?? "");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCounty, setNewCounty] = useState("");
  const [newCountry, setNewCountry] = useState("Kenya");

  const utils = trpc.useUtils();

  const { data: profile } = trpc.provider.getProfile.useQuery(undefined, {
    retry: false,
  });

  const { data: searchData, isFetching } = trpc.facilities.search.useQuery(
    { query, limit: 12 },
    { enabled: query.trim().length >= 2 && !value }
  );

  const setMyFacility = trpc.facilities.setMyFacility.useMutation({
    onSuccess: (r) => {
      onChange({
        facilityId: r.facility.id,
        facilityName: r.facility.name,
        county: r.facility.county,
        country: r.facility.country,
      });
      setQuery(r.facility.name);
    },
  });

  const createFacility = trpc.facilities.createCommunityFacility.useMutation({
    onSuccess: (r) => {
      void setMyFacility.mutateAsync({ facilityId: r.id });
      setShowAddForm(false);
    },
  });

  useEffect(() => {
    if (value) return;
    if (profile?.facilityId && profile.facilityName) {
      onChange({
        facilityId: profile.facilityId,
        facilityName: profile.facilityName,
        county: profile.facilityRegion ?? null,
        country: profile.facilityCountry ?? "Kenya",
      });
      setQuery(profile.facilityName);
    }
  }, [profile?.facilityId, profile?.facilityName, profile?.facilityRegion, profile?.facilityCountry, value, onChange]);

  const selectResult = (r: {
    id: number;
    name: string;
    county: string | null;
    country: string;
  }) => {
    onChange({
      facilityId: r.id,
      facilityName: r.name,
      county: r.county,
      country: r.country,
    });
    setQuery(r.name);
    void setMyFacility.mutate({ facilityId: r.id });
  };

  return (
    <div className="space-y-3">
      <div>
        <Label className="flex items-center gap-2">
          <Building2 className="h-4 w-4" />
          Facility where care was delivered
          {required ? <span className="text-destructive">*</span> : null}
        </Label>
        {showProfileHint ? (
          <p className="text-xs text-muted-foreground mt-1">
            Used for facility, county, and national quality insights. Select your hospital or clinic —
            not your home address.
          </p>
        ) : null}
      </div>

      {value ? (
        <div className="flex items-center gap-2 p-3 border rounded-lg bg-muted/30">
          <div className="flex-1 text-sm">
            <p className="font-medium">{value.facilityName}</p>
            <p className="text-muted-foreground text-xs">
              {[value.county, value.country].filter(Boolean).join(" · ") || "Location not set"}
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              onChange(null);
              setQuery("");
            }}
          >
            Change
          </Button>
        </div>
      ) : (
        <>
          <Input
            placeholder="Search facility name…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {isFetching ? (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin" />
              Searching…
            </p>
          ) : null}
          {searchData?.results && searchData.results.length > 0 ? (
            <div className="border rounded-lg divide-y max-h-48 overflow-y-auto">
              {searchData.results.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  className="w-full text-left px-3 py-2 hover:bg-muted/50 text-sm flex justify-between gap-2"
                  onClick={() => selectResult(f)}
                >
                  <span>{f.name}</span>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {f.badge}
                    {f.county ? ` · ${f.county}` : ""}
                    {f.country ? ` · ${f.country}` : ""}
                  </span>
                </button>
              ))}
            </div>
          ) : query.trim().length >= 2 ? (
            <p className="text-xs text-muted-foreground">No matches — add your facility below.</p>
          ) : null}
        </>
      )}

      {!value && (
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => setShowAddForm((v) => !v)}>
            Facility not listed
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={async () => {
              const res = await utils.facilities.search.fetch({ query: "Outreach", limit: 5 });
              const outreach = res?.results?.find((r) => r.name.toLowerCase().includes("outreach"));
              if (outreach) selectResult(outreach);
            }}
          >
            Outreach / multiple sites
          </Button>
        </div>
      )}

      {showAddForm && !value ? (
        <div className="border rounded-lg p-3 space-y-3 bg-muted/20">
          <p className="text-sm font-medium">Add your facility</p>
          <div className="space-y-2">
            <Label>Facility name</Label>
            <Input value={newName} onChange={(e) => setNewName(e.target.value)} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>County / region</Label>
              <Select value={newCounty} onValueChange={setNewCounty}>
                <SelectTrigger>
                  <SelectValue placeholder="Select county" />
                </SelectTrigger>
                <SelectContent>
                  {KENYA_COUNTIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Country</Label>
              <Select value={newCountry} onValueChange={setNewCountry}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COMMON_FACILITY_COUNTRIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button
            type="button"
            size="sm"
            disabled={
              createFacility.isPending ||
              newName.trim().length < 2 ||
              (newCountry === "Kenya" && !newCounty)
            }
            onClick={() =>
              createFacility.mutate({
                name: newName.trim(),
                county: newCounty,
                country: newCountry,
              })
            }
          >
            {createFacility.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save facility"}
          </Button>
        </div>
      ) : null}

      {required && !value ? (
        <Alert>
          <AlertDescription className="text-sm">
            Select a facility to continue. This links your report to the right county and national QI
            picture.
          </AlertDescription>
        </Alert>
      ) : null}
    </div>
  );
}
