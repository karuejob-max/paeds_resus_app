import React, { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { AlertCircle, X } from "lucide-react";

interface FacilityOption {
  id: number;
  name: string;
  code?: string | null;
  county?: string | null;
  facilityType?: string | null;
}

interface FacilityAutocompleteProps {
  value: string;
  onSelect: (facility: FacilityOption | null) => void;
  onManualEntry: (name: string) => void;
  registrationNumber?: string;
  onRegistrationNumberChange?: (value: string) => void;
  isManualEntry: boolean;
  onManualEntryChange: (isManual: boolean) => void;
  entityLabel?: string;
}

export function FacilityAutocomplete({
  value,
  onSelect,
  onManualEntry,
  registrationNumber = "",
  onRegistrationNumberChange,
  isManualEntry,
  onManualEntryChange,
  entityLabel = "facility",
}: FacilityAutocompleteProps) {
  const [query, setQuery] = useState(value);
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<FacilityOption[]>([]);
  const [selectedFacility, setSelectedFacility] = useState<FacilityOption | null>(null);
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const searchFacilities = trpc.institution.searchKmhflFacilities.useQuery(
    { query: debouncedQuery, limit: 10 },
    { enabled: debouncedQuery.length >= 2 && !isManualEntry, staleTime: 5 * 60 * 1000 }
  );

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (searchFacilities.error) {
      setResults([]);
      setIsOpen(false);
      return;
    }
    if (searchFacilities.data) {
      setResults(searchFacilities.data);
      setIsOpen(true);
    }
  }, [searchFacilities.data, searchFacilities.error]);

  useEffect(() => {
    setIsLoading(searchFacilities.isLoading);
  }, [searchFacilities.isLoading]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setQuery(newValue);
    setSelectedFacility(null);
    // Keep the parent onboarding form synchronized even before a registry result is selected.
    // Otherwise the final submit can send the initial empty institutionName.
    onManualEntry(newValue);
    if (newValue.trim().length < 2) {
      setIsOpen(false);
      setResults([]);
    }
  };

  const handleSelectFacility = (facility: FacilityOption) => {
    setSelectedFacility(facility);
    setQuery(facility.name);
    setIsOpen(false);
    onSelect(facility);
    onManualEntryChange(false);
    // Auto-fill registration number if available
    if (facility.code && onRegistrationNumberChange) {
      onRegistrationNumberChange(facility.code);
    }
  };

  const handleClearSelection = () => {
    setSelectedFacility(null);
    setQuery("");
    setResults([]);
    setIsOpen(false);
    onSelect(null);
  };

  const handleManualEntry = () => {
    onManualEntryChange(true);
    setIsOpen(false);
    setSelectedFacility(null);
    onManualEntry(query);
  };

  return (
    <div ref={containerRef} className="space-y-3">
      <div>
        <Label htmlFor="facilitySearch">{entityLabel.charAt(0).toUpperCase() + entityLabel.slice(1)} name *</Label>
        <div className="relative">
          <Input
            ref={inputRef}
            id="facilitySearch"
            type="text"
            placeholder={`Search KMHFL snapshot or enter a ${entityLabel} name`}
            value={query}
            onChange={handleInputChange}
            onFocus={() => query.length > 0 && setIsOpen(true)}
            disabled={isManualEntry}
            className="pr-10"
          />
          {selectedFacility && (
            <button
              type="button"
              onClick={handleClearSelection}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Autocomplete dropdown */}
        {isOpen && !isManualEntry && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-border rounded-md shadow-lg">
            {isLoading && (
              <div className="p-3 text-sm text-muted-foreground text-center">Searching...</div>
            )}

            {!isLoading && results.length > 0 && (
              <ul className="max-h-48 overflow-y-auto">
                {results.map((facility) => (
                  <li key={facility.id}>
                    <button
                      type="button"
                      onClick={() => handleSelectFacility(facility)}
                      className="w-full px-3 py-2 text-left hover:bg-secondary transition-colors"
                    >
                      <div className="font-medium text-sm">{facility.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {facility.county && <span>{facility.county}</span>}
                        {facility.code && <span> • Code: {facility.code}</span>}
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {!isLoading && results.length === 0 && query.trim().length >= 2 && (
              <div className="p-3 text-sm text-muted-foreground text-center">
                No facilities found
              </div>
            )}

            {!isLoading && searchFacilities.error && (
              <div className="p-3 text-sm text-destructive text-center" role="alert">
                Facility registry search is unavailable. You can use manual entry.
              </div>
            )}

            {/* Fallback option */}
            {!isLoading && (
              <div className="border-t border-border p-2">
                <button
                  type="button"
                  onClick={handleManualEntry}
                  className="w-full px-3 py-2 text-left text-sm text-brand-orange hover:bg-secondary rounded transition-colors flex items-center gap-2"
                >
                  <AlertCircle className="h-4 w-4" />
                  My {entityLabel} is not listed
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {!isManualEntry && (
        <p className="text-xs text-muted-foreground">
          Registry matches are a maintained snapshot. Confirm the facility details before submitting.
        </p>
      )}

      {/* Manual entry mode */}
      {isManualEntry && (
        <div className="p-3 bg-secondary/50 rounded-md border border-border">
          <p className="text-sm text-muted-foreground mb-3">
            Enter your {entityLabel} name manually. You can still add a registration number below if available.
          </p>
          <Input
            type="text"
            placeholder={`Enter your ${entityLabel} name`}
            value={query}
            onChange={handleInputChange}
            className="mb-3"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              onManualEntryChange(false);
              setQuery("");
              setSelectedFacility(null);
            }}
          >
            Back to search
          </Button>
        </div>
      )}

      {/* Registration number field (optional) */}
      <div>
        <Label htmlFor="registrationNumber">
          Registration Number <span className="text-muted-foreground">(optional)</span>
        </Label>
        <Input
          id="registrationNumber"
          type="text"
          placeholder="e.g., REG-2024-001 (if known)"
          value={registrationNumber}
          onChange={(e) => onRegistrationNumberChange?.(e.target.value)}
        />
        {selectedFacility?.code && (
          <p className="text-xs text-muted-foreground mt-1">
            Auto-filled from KMHFL registry: {selectedFacility.code}
          </p>
        )}
      </div>
    </div>
  );
}
