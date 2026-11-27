import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ExternalLink, Search } from "lucide-react";
import { trpc } from "@/lib/trpc";

export interface RegistryFacility {
  id: number;
  name: string;
  code?: string | null;
  county?: string | null;
  facilityType?: string | null;
}

export const KMHFR_PUBLIC_URL = "https://kmhfr.health.go.ke/public/facilities";

/** Describes a registry facility on one line so similarly named facilities can be told apart. */
export function describeFacility(facility: RegistryFacility): string {
  const code = facility.code ? (isOfficialMflCode(facility.code) ? `MFL code ${facility.code}` : `sample entry ${facility.code} (not an official MFL code)`) : "no MFL code";
  return [code, facility.county, facility.facilityType].filter(Boolean).join(" · ");
}

/** Official MFL codes are numeric. Anything else came from the sample list. */
export function isOfficialMflCode(code: string | null | undefined): boolean {
  return /^\d{4,6}$/.test((code ?? "").trim());
}

/**
 * Pick a facility from the Kenya Master Health Facility List. Search by name, MFL code or county.
 * Every result shows its code, county and type, so similarly named facilities are not confused.
 */
export function FacilityRegistryPicker({
  selected,
  onSelect,
  disabled,
}: {
  selected: RegistryFacility | null;
  onSelect: (facility: RegistryFacility | null) => void;
  disabled?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(query.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [query]);
  const search = trpc.institution.searchKmhflFacilities.useQuery(
    { query: debounced, limit: 8 },
    { enabled: debounced.length >= 2 && !selected, staleTime: 5 * 60 * 1000 },
  );

  if (selected) {
    return (
      <div className="flex items-start justify-between gap-3 rounded-md border border-emerald-300 bg-emerald-50 p-3 text-sm">
        <div className="flex gap-2">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
          <div>
            <p className="font-medium">{selected.name}</p>
            <p className="text-slate-600">{describeFacility(selected)}</p>
          </div>
        </div>
        {!disabled ? (
          <Button type="button" size="sm" variant="ghost" onClick={() => { onSelect(null); setQuery(""); }}>
            Change
          </Button>
        ) : null}
      </div>
    );
  }

  const results = search.data ?? [];
  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
        <Input
          className="pl-9"
          placeholder="Type the facility name, MFL code or county"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          disabled={disabled}
        />
      </div>
      {debounced.length >= 2 && !search.isLoading && results.length === 0 ? (
        <p className="text-sm text-slate-600">No match. Check the spelling, or search by MFL code.</p>
      ) : null}
      {results.length > 0 ? (
        <ul className="divide-y rounded-md border">
          {results.map((facility) => (
            <li key={facility.id}>
              <button type="button" className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50" onClick={() => onSelect(facility)}>
                <span className="font-medium">{facility.name}</span>
                <span className="block text-slate-600">{describeFacility(facility)}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <a className="inline-flex items-center gap-1 text-xs text-brand-teal underline" href={KMHFR_PUBLIC_URL} target="_blank" rel="noopener noreferrer">
        Look up your facility on the Ministry of Health registry <ExternalLink className="h-3 w-3" />
      </a>
    </div>
  );
}
