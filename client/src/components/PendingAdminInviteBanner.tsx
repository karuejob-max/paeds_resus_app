import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { ShieldCheck, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

/**
 * North Star §6.1 multi-admin: shows a dismissible banner when the logged-in
 * user has a pending institutionalAdminInvites row addressed to their email
 * — from either a live admin's invite or an approved recovery request.
 * Mounted once at the App.tsx layout level (alongside <Header />) so it
 * surfaces regardless of which dashboard the user lands on.
 */
export function PendingAdminInviteBanner() {
  const { isAuthenticated } = useAuth();
  const utils = trpc.useUtils();
  const [dismissedIds, setDismissedIds] = useState<Set<number>>(new Set());
  const { data } = trpc.institutionAdmins.myPendingInvites.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const accept = trpc.institutionAdmins.acceptInvite.useMutation({
    onSuccess: () => {
      toast.success("You're now an admin for that institution.");
      void utils.institutionAdmins.myPendingInvites.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  if (!isAuthenticated) return null;
  const invites = (data?.invites ?? []).filter((i) => !dismissedIds.has(i.id));
  if (invites.length === 0) return null;

  return (
    <div className="bg-brand-teal/5 border-b border-brand-teal/20">
      {invites.map((invite) => (
        <div
          key={invite.id}
          className="max-w-5xl mx-auto px-4 py-2 flex items-center justify-between gap-3 text-sm"
        >
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-brand-teal flex-shrink-0" />
            <span>
              You've been invited to become an admin for <strong>{invite.companyName}</strong>
              {invite.source === "recovery_approval" ? " (account recovery approved)" : ""}.
            </span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              size="sm"
              variant="cta"
              onClick={() => accept.mutate({ inviteId: invite.id })}
              disabled={accept.isPending}
            >
              Accept
            </Button>
            <button
              type="button"
              aria-label="Dismiss"
              onClick={() => setDismissedIds((prev) => new Set(prev).add(invite.id))}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
