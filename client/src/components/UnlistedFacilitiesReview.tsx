import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { FacilityRegistryPicker, KMHFR_PUBLIC_URL } from "@/components/FacilityRegistryPicker";

/**
 * Facilities that reporters added because they could not find them in the Ministry of Health list.
 * Each is either matched to its registry facility (reports move across) or confirmed as genuinely unlisted.
 */
export function UnlistedFacilitiesReview() {
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.facilities.listAwaitingReview.useQuery();
  const [matching, setMatching] = useState<number | null>(null);
  const refresh = () => void utils.facilities.listAwaitingReview.invalidate();
  const resolve = trpc.facilities.resolveUnlisted.useMutation({
    onSuccess: (result) => {
      toast.success(`Matched to MFL ${result.mflCode}. Reports moved: ${result.movedEvents}.`);
      setMatching(null);
      refresh();
    },
    onError: (error) => toast.error(error.message),
  });
  const confirm = trpc.facilities.confirmUnlisted.useMutation({
    onSuccess: () => {
      toast.success("Kept as its own facility.");
      refresh();
    },
    onError: (error) => toast.error(error.message),
  });

  const facilities = data ?? [];
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Facilities awaiting a registry check</CardTitle>
        <CardDescription>
          Added by reporters because they could not find them in the Ministry of Health list. Check each one on the{" "}
          <a className="underline" href={KMHFR_PUBLIC_URL} target="_blank" rel="noopener noreferrer">registry</a>.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {isLoading ? <p>Loading…</p> : null}
        {!isLoading && facilities.length === 0 ? <p className="text-slate-600">Nothing waiting.</p> : null}
        {facilities.map((facility) => (
          <div key={facility.id} className="space-y-2 rounded-md border p-3">
            <p>
              <strong>{facility.name}</strong> · {[facility.county, facility.country].filter(Boolean).join(" · ")}
            </p>
            <p className="text-slate-600">
              Reports: {facility.careSignalReports} Care Signal, {facility.codeSignalReports} Code Signal
            </p>
            {matching === facility.id ? (
              <div className="space-y-2">
                <FacilityRegistryPicker
                  selected={null}
                  onSelect={(registry) => {
                    if (registry) resolve.mutate({ facilityId: facility.id, kmhflFacilityId: registry.id });
                  }}
                  disabled={resolve.isPending}
                />
                <Button size="sm" variant="ghost" onClick={() => setMatching(null)}>Cancel</Button>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                <Button size="sm" onClick={() => setMatching(facility.id)}>It is in the registry — match it</Button>
                <Button size="sm" variant="outline" disabled={confirm.isPending} onClick={() => confirm.mutate({ facilityId: facility.id })}>Genuinely not listed — keep</Button>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
