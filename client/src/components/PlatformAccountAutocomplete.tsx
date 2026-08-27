import { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";

export type PlatformAccountOption = {
  id: number;
  name: string;
  email: string;
};

type PlatformAccountAutocompleteProps = {
  selectedAccount: PlatformAccountOption | null;
  onSelect: (account: PlatformAccountOption | null) => void;
  label?: string;
  required?: boolean;
};

export function PlatformAccountAutocomplete({
  selectedAccount,
  onSelect,
  label = "Search Paeds Resus accounts",
  required = false,
}: PlatformAccountAutocompleteProps) {
  const [query, setQuery] = useState(selectedAccount?.name ?? "");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const searchAccounts = trpc.institution.searchPlatformAccounts.useQuery(
    { query, limit: 8 },
    {
      enabled: !selectedAccount && query.trim().length >= 2,
      staleTime: 30_000,
    }
  );

  useEffect(() => {
    if (selectedAccount) setQuery(selectedAccount.name);
  }, [selectedAccount]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleQueryChange = (value: string) => {
    setQuery(value);
    onSelect(null);
    setIsOpen(value.trim().length >= 2);
  };

  const handleSelect = (account: PlatformAccountOption) => {
    setQuery(account.name);
    setIsOpen(false);
    onSelect(account);
  };

  const clearSelection = () => {
    setQuery("");
    setIsOpen(false);
    onSelect(null);
  };

  const results = (searchAccounts.data ?? []) as PlatformAccountOption[];
  const canSearch = query.trim().length >= 2;

  return (
    <div ref={containerRef} className="relative space-y-2">
      <label
        htmlFor="platform-account-search"
        className="text-sm font-medium text-foreground"
      >
        {label} {required && <span className="text-destructive">*</span>}
      </label>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          id="platform-account-search"
          value={query}
          onChange={event => handleQueryChange(event.target.value)}
          onFocus={() => canSearch && !selectedAccount && setIsOpen(true)}
          placeholder="Type a name or email address"
          autoComplete="off"
          role="combobox"
          aria-expanded={isOpen}
          aria-controls="platform-account-results"
          aria-autocomplete="list"
          className="pl-9 pr-10"
          required={required && !selectedAccount}
        />
        {query && (
          <button
            type="button"
            onClick={clearSelection}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label="Clear selected administrator"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {isOpen && !selectedAccount && canSearch && (
        <div
          id="platform-account-results"
          role="listbox"
          className="absolute z-50 mt-1 w-full overflow-hidden rounded-md border border-border bg-popover shadow-lg"
        >
          {searchAccounts.isLoading && (
            <p className="p-3 text-sm text-muted-foreground">
              Searching Paeds Resus accounts…
            </p>
          )}
          {searchAccounts.isError && (
            <p className="p-3 text-sm text-destructive">
              Account search is unavailable. Try again.
            </p>
          )}
          {!searchAccounts.isLoading &&
            !searchAccounts.isError &&
            results.length === 0 && (
              <div className="space-y-2 p-3 text-sm text-muted-foreground">
                <p>No Paeds Resus account found for that name or email.</p>
                <p>Ask the colleague to create and verify a Paeds Resus account, then return here and search again. We cannot link an unregistered email address.</p>
              </div>
            )}
          {!searchAccounts.isLoading && results.length > 0 && (
            <ul className="max-h-60 overflow-y-auto py-1">
              {results.map(account => (
                <li key={account.id} role="option" aria-selected={false}>
                  <button
                    type="button"
                    onClick={() => handleSelect(account)}
                    className="w-full px-3 py-2 text-left transition-colors hover:bg-accent"
                  >
                    <span className="block font-medium text-foreground">
                      {account.name}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      {account.email}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {selectedAccount && (
        <p className="text-xs text-emerald-700 dark:text-emerald-300">
          Selected existing Paeds Resus account: {selectedAccount.email}
        </p>
      )}
      {!selectedAccount && query.trim().length === 1 && (
        <p className="text-xs text-muted-foreground">
          Type at least 2 characters to search.
        </p>
      )}
    </div>
  );
}
