import { Building2, CheckCircle2, Clock3, ShieldCheck, UserCheck } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const ROLE_LABELS: Record<string, string> = {
  executive: "Executive sponsor",
  erc_chair: "Emergency Readiness Committee chair",
  erc_member: "Emergency Readiness Committee member",
  er_coordinator: "Emergency readiness coordinator",
  unit_team_leader: "Unit Team Leader",
  ert_leader: "ERT leader",
  ert_responder: "ERT responder",
  general_staff: "General staff",
};

function roleLabel(role: string) {
  return ROLE_LABELS[role] ?? "Institutional provider";
}

export default function ProviderInstitutionReadinessCard() {
  const utils = trpc.useUtils();
  const membershipsQuery = trpc.institution.getMyMemberships.useQuery(undefined, {
    staleTime: 30_000,
    retry: 1,
  });
  const acceptInvite = trpc.institution.acceptMembershipInvite.useMutation({
    onSuccess: async () => {
      toast.success("Institutional readiness responsibility accepted.");
      await utils.institution.getMyMemberships.invalidate();
    },
    onError: (error) => toast.error(error.message || "Could not accept the institution invitation."),
  });

  if (membershipsQuery.isLoading || membershipsQuery.isError) return null;

  const memberships = membershipsQuery.data ?? [];
  if (memberships.length === 0) return null;

  const pending = memberships.filter((membership) => membership.isPendingInvite);
  const active = memberships.filter((membership) => membership.membershipStatus === "active");

  return (
    <Card className="border-teal-200 overflow-hidden">
      <CardHeader className="bg-teal-50 border-b border-teal-100 pb-3">
        <CardTitle className="flex items-center gap-2 text-teal-900 text-base">
          <Building2 className="h-5 w-5" />
          Institutional Emergency Readiness
        </CardTitle>
        <CardDescription className="text-teal-800/80">
          Providers help operate readiness. Your assigned responsibility is visible here instead of being hidden in the admin portal.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 space-y-3">
        {pending.map((membership) => (
          <div key={membership.id} className="rounded-lg border border-amber-200 bg-amber-50 p-3 space-y-2">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-amber-950 text-sm">Invitation from {membership.companyName}</p>
                <p className="text-xs text-amber-900/80 mt-1">
                  You have been nominated as {roleLabel(membership.responsibilityRole)}.
                </p>
              </div>
              <Badge variant="outline" className="border-amber-300 text-amber-800 shrink-0">
                <Clock3 className="h-3 w-3 mr-1" /> Pending
              </Badge>
            </div>
            <Button
              size="sm"
              className="bg-teal-700 hover:bg-teal-800 text-white"
              disabled={acceptInvite.isPending}
              onClick={() => acceptInvite.mutate({ membershipId: membership.id })}
            >
              <UserCheck className="h-4 w-4 mr-2" />
              Accept responsibility
            </Button>
          </div>
        ))}

        {active.map((membership) => (
          <div key={membership.id} className="rounded-lg border border-teal-100 bg-white p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-slate-900 text-sm">{membership.companyName}</p>
                <p className="text-xs text-slate-600 mt-1">{roleLabel(membership.responsibilityRole)}</p>
                {(membership.department || membership.staffRole) && (
                  <p className="text-xs text-slate-500 mt-1">
                    {[membership.department, membership.staffRole].filter(Boolean).join(" · ")}
                  </p>
                )}
              </div>
              <Badge variant="outline" className="border-emerald-200 text-emerald-700 shrink-0">
                <CheckCircle2 className="h-3 w-3 mr-1" /> Active
              </Badge>
            </div>
            <div className="mt-3 flex items-start gap-2 rounded-md bg-slate-50 p-2.5 text-xs text-slate-600">
              <ShieldCheck className="h-4 w-4 text-teal-700 shrink-0 mt-0.5" />
              <span>Readiness tasks, shift responsibilities, activations, drills, and quality-improvement actions will be assigned to you here as your institution activates IERS.</span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
