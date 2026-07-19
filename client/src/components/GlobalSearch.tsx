import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "@/components/ui/command";
import { useAuth } from "@/_core/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { trpc } from "@/lib/trpc";
import { getAnalyticsSessionId } from "@/lib/analytics-session";
import {
  buildPlatformSearchIndex,
  filterPlatformSearchItems,
  groupSearchResults,
  normalizeSearchQuery,
  SEARCH_CATEGORY_ORDER,
  type AppRole,
  type PlatformSearchItem,
  type SearchContext,
} from "@/lib/platform-search-index";
import { cn } from "@/lib/utils";

function mapUserTypeToRole(ut: string | null | undefined): AppRole {
  if (!ut) return null;
  const m: Record<string, AppRole> = {
    individual: "provider",
    institutional: "institution",
  };
  return m[ut] ?? null;
}

function HighlightMatch({ text, query }: { text: string; query: string }) {
  const q = normalizeSearchQuery(query);
  if (!q) return <>{text}</>;
  const lower = text.toLowerCase();
  const idx = lower.indexOf(q);
  if (idx < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="rounded-sm bg-primary/15 px-0.5 font-medium text-foreground">
        {text.slice(idx, idx + q.length)}
      </mark>
      {text.slice(idx + q.length)}
    </>
  );
}

type GlobalSearchProps = {
  className?: string;
  /** Full-width bar for mobile menus; default is icon-only in header. */
  variant?: "icon" | "bar";
};

export function GlobalSearch({ className, variant = "icon" }: GlobalSearchProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [, setLocation] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { role } = useUserRole();
  const trackEventMutation = trpc.events.trackEvent.useMutation();

  const isAdmin = (user as { role?: string })?.role === "admin";
  const effectiveRole = isAuthenticated ? role ?? mapUserTypeToRole(user?.userType) : null;

  const context: SearchContext = useMemo(
    () => ({
      isAuthenticated,
      isAdmin,
      role: effectiveRole,
    }),
    [isAuthenticated, isAdmin, effectiveRole]
  );

  const index = useMemo(() => buildPlatformSearchIndex(), []);
  const results = useMemo(
    () => filterPlatformSearchItems(index, query, context),
    [index, query, context]
  );
  const grouped = useMemo(() => groupSearchResults(results), [results]);

  const navigateTo = useCallback(
    (item: PlatformSearchItem) => {
      const q = normalizeSearchQuery(query);
      void trackEventMutation.mutate({
        eventType: "navigation",
        eventName: "global_search_navigate",
        pageUrl: typeof window !== "undefined" ? window.location.pathname : "/",
        sessionId: getAnalyticsSessionId(),
        eventData: {
          destination: item.href,
          label: item.label,
          category: item.category,
          query: q || undefined,
        },
      });
      setOpen(false);
      setQuery("");
      setLocation(item.href);
    },
    [query, setLocation, trackEventMutation]
  );

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  const isMac =
    typeof navigator !== "undefined" && /Mac|iPhone|iPad|iPod/.test(navigator.platform);

  return (
    <>
      {variant === "bar" ? (
        <Button
          type="button"
          variant="outline"
          className={cn("w-full justify-start gap-2 text-muted-foreground font-normal", className)}
          aria-label="Search platform"
          onClick={() => setOpen(true)}
        >
          <Search className="h-4 w-4 shrink-0" />
          <span className="truncate">Search courses, tools, help…</span>
          <CommandShortcut className="ml-auto hidden xs:inline">
            {isMac ? "⌘K" : "Ctrl+K"}
          </CommandShortcut>
        </Button>
      ) : (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn("shrink-0 text-foreground", className)}
          aria-label="Search platform"
          onClick={() => setOpen(true)}
        >
          <Search className="h-5 w-5" />
        </Button>
      )}

      <CommandDialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) setQuery("");
        }}
        title="Search Paeds Resus"
        description="Jump to any page, course, or tool"
        className="top-[8%] translate-y-0 sm:max-w-xl max-w-[calc(100%-0.5rem)] p-0"
      >
        <CommandInput
          placeholder="Search courses, ResusGPS, fellowship, help…"
          value={query}
          onValueChange={setQuery}
        />
        <CommandList className="max-h-[min(60vh,420px)]">
          <CommandEmpty>No results found.</CommandEmpty>
          {SEARCH_CATEGORY_ORDER.map((category) => {
            const items = grouped[category];
            if (!items?.length) return null;
            return (
              <CommandGroup key={category} heading={category}>
                {items.map((item) => (
                  <CommandItem
                    key={item.id}
                    value={`${item.label} ${item.href} ${item.keywords?.join(" ") ?? ""}`}
                    onSelect={() => navigateTo(item)}
                  >
                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="truncate font-medium">
                        <HighlightMatch text={item.label} query={query} />
                      </span>
                      {item.description ? (
                        <span className="truncate text-xs text-muted-foreground">
                          {item.description}
                        </span>
                      ) : (
                        <span className="truncate text-xs text-muted-foreground">{item.href}</span>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            );
          })}
        </CommandList>
        <div className="hidden border-t px-3 py-2 text-xs text-muted-foreground sm:flex sm:items-center sm:justify-between">
          <span>Navigate with ↑ ↓ · Enter to open · Esc to close</span>
          <CommandShortcut>{isMac ? "⌘" : "Ctrl+"}K</CommandShortcut>
        </div>
      </CommandDialog>
    </>
  );
}

export default GlobalSearch;
