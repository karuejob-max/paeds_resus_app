import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Building2,
  CheckCircle2,
  Link2,
  Loader2,
  Search,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

type SearchResult = {
  id: number;
  name: string;
  county: string | null;
  country: string;
  institutionalAccountId: number | null;
  badge: string;
};

function statusLabel(status: string) {
  switch (status) {
    case "approved":
      return "Approved";
    case "rejected":
      return "Not approved";
    case "withdrawn":
      return "Withdrawn";
    default:
      return "Pending review";
  }
}

function statusClass(status: string) {
  switch (status) {
    case "approved":
      return "border-emerald-200 bg-emerald-50 text-emerald-800";
    case "rejected":
      return "border-red-200 bg-red-50 text-red-800";
    case "withdrawn":
      return "border-slate-200 bg-slate-50 text-slate-700";
    default:
      return "border-amber-200 bg-amber-50 text-amber-800";
  }
}

export function ProviderFacilityLinkingCard() {
  const [query, setQuery] = useState("");
  const [selectedFacility, setSelectedFacility] = useState<SearchResult | null>(
    null
  );
  const utils = trpc.useUtils();
  const requestsQuery = trpc.facilityLinking.getMyRequests.useQuery(undefined, {
    staleTime: 10_000,
  });
  const searchQuery = trpc.facilities.search.useQuery(
    { query, limit: 8 },
    { enabled: query.trim().length >= 2, staleTime: 30_000 }
  );
  const requestMutation = trpc.facilityLinking.requestLink.useMutation({
    onSuccess: async result => {
      if (result.status === "already_linked") {
        toast.success("Your account is already linked to this institution.");
      } else if (result.duplicate) {
        toast.message("Your request is already pending review.");
      } else {
        toast.success("Link request sent to the institution administrator.");
      }
      setSelectedFacility(null);
      setQuery("");
      await utils.facilityLinking.getMyRequests.invalidate();
      await utils.institution.getMyMemberships.invalidate();
    },
    onError: error =>
      toast.error(
        error.message || "Could not submit the facility link request."
      ),
  });
  const withdrawMutation = trpc.facilityLinking.withdrawRequest.useMutation({
    onSuccess: async () => {
      toast.success("Facility link request withdrawn.");
      await utils.facilityLinking.getMyRequests.invalidate();
    },
    onError: error =>
      toast.error(error.message || "Could not withdraw the request."),
  });

  const requests = requestsQuery.data ?? [];
  const pendingInstitutionIds = new Set(
    requests
      .filter(request => request.status === "pending")
      .map(request => request.institutionalAccountId)
  );
  const selectedIsEligible = Boolean(selectedFacility?.institutionalAccountId);
  const selectedAlreadyPending =
    selectedFacility?.institutionalAccountId != null
      ? pendingInstitutionIds.has(selectedFacility.institutionalAccountId)
      : false;

  return (
    <Card className="border-teal-200 bg-white">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Link2 className="h-5 w-5 text-teal-700" /> Facility relationships
        </CardTitle>
        <CardDescription>
          Search for a facility already registered on the institutional portal
          and request a general staff link. Selecting a facility for
          care-delivery context does not submit a membership request or create
          an IERS duty.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label
            htmlFor="facility-link-search"
            className="text-sm font-medium text-slate-800"
          >
            Find a registered facility
          </label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              id="facility-link-search"
              className="pl-9"
              placeholder="Search hospital or clinic name"
              value={query}
              onChange={event => {
                setQuery(event.target.value);
                setSelectedFacility(null);
              }}
            />
          </div>
          {searchQuery.isFetching ? (
            <p className="flex items-center gap-1 text-xs text-slate-500">
              <Loader2 className="h-3 w-3 animate-spin" /> Searching facilities…
            </p>
          ) : null}
          {query.trim().length >= 2 &&
          !searchQuery.isFetching &&
          (searchQuery.data?.results.length ?? 0) === 0 ? (
            <p className="text-xs text-slate-500">
              No matching facilities found. Community facilities cannot receive
              an institutional membership request.
            </p>
          ) : null}
          {searchQuery.data?.results.length ? (
            <div className="divide-y overflow-hidden rounded-lg border bg-white">
              {(searchQuery.data.results as SearchResult[]).map(facility => (
                <button
                  key={facility.id}
                  type="button"
                  className="flex w-full items-start justify-between gap-3 px-3 py-3 text-left text-sm hover:bg-teal-50/70 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:ring-inset"
                  onClick={() => {
                    setSelectedFacility(facility);
                    setQuery(facility.name);
                  }}
                >
                  <span className="min-w-0">
                    <span className="block truncate font-medium text-slate-900">
                      {facility.name}
                    </span>
                    <span className="mt-1 block text-xs text-slate-500">
                      {[facility.county, facility.country]
                        .filter(Boolean)
                        .join(" · ") || "Location unavailable"}
                    </span>
                  </span>
                  <Badge
                    variant={
                      facility.institutionalAccountId ? "default" : "outline"
                    }
                    className="shrink-0"
                  >
                    {facility.institutionalAccountId
                      ? "Registered institution"
                      : facility.badge}
                  </Badge>
                </button>
              ))}
            </div>
          ) : null}
        </div>

        {selectedFacility ? (
          <div className="rounded-lg border border-teal-100 bg-teal-50/50 p-3">
            <div className="flex items-start gap-3">
              <Building2 className="mt-0.5 h-5 w-5 shrink-0 text-teal-700" />
              <div className="min-w-0 flex-1">
                <p className="font-medium text-slate-900">
                  {selectedFacility.name}
                </p>
                <p className="mt-1 text-xs text-slate-600">
                  {selectedIsEligible
                    ? "This facility is owned by a registered institutional account."
                    : "This facility is not attached to an institutional account."}
                </p>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {selectedIsEligible ? (
                <Button
                  type="button"
                  size="sm"
                  disabled={selectedAlreadyPending || requestMutation.isPending}
                  onClick={() =>
                    requestMutation.mutate({
                      facilityId: selectedFacility.id,
                      relationshipType: "permanent_staff",
                    })
                  }
                >
                  {requestMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Link2 className="mr-2 h-4 w-4" />
                  )}
                  {selectedAlreadyPending
                    ? "Request pending"
                    : "Request general staff link"}
                </Button>
              ) : (
                <span className="text-xs font-medium text-slate-600">
                  Community facilities cannot receive institutional membership
                  requests.
                </span>
              )}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedFacility(null);
                  setQuery("");
                }}
              >
                Clear
              </Button>
            </div>
          </div>
        ) : null}

        <div className="space-y-2">
          {requests.length > 0 ? (
            requests.map(request => (
              <div
                key={request.id}
                className="flex flex-col gap-3 rounded-lg border border-slate-200 p-3 sm:flex-row sm:items-start sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="font-medium text-slate-900">
                    {request.facilityName}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {request.institutionName}
                    {request.department ? ` · ${request.department}` : ""}
                  </p>
                  <span
                    className={`mt-2 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${statusClass(request.status)}`}
                  >
                    {request.status === "approved" ? (
                      <CheckCircle2 className="h-3 w-3" />
                    ) : request.status === "rejected" ? (
                      <XCircle className="h-3 w-3" />
                    ) : null}
                    {statusLabel(request.status)}
                  </span>
                  {request.reviewReason && request.status !== "pending" ? (
                    <p className="mt-2 text-xs text-slate-600">
                      {request.reviewReason}
                    </p>
                  ) : null}
                </div>
                {request.status === "pending" ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={withdrawMutation.isPending}
                    onClick={() =>
                      withdrawMutation.mutate({ requestId: request.id })
                    }
                  >
                    Withdraw
                  </Button>
                ) : null}
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-500">
              No direct facility link requests yet. Existing CPD-derived
              relationships and active memberships remain listed below.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
