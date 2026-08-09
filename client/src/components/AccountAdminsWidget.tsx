import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Users } from "lucide-react";
import { toast } from "sonner";

/**
 * North Star §6.1 multi-admin: lets the current admin see who else
 * administers this institution, invite another admin (by email — linked
 * immediately if that email already has an account, otherwise a pending
 * invite claimed on next login), and remove an admin (blocked below the
 * minimum of two, and the founding admin can't be removed here — that's a
 * primary-ownership transfer, a separate operation).
 *
 * Extracted from client/src/pages/InstitutionalPortal.tsx (2026-08-08) --
 * that page is not routed anywhere, so there was no reachable way to invite
 * or manage a second admin at all, defeating the whole point of this
 * feature (preventing account lockout). The accept-invite half
 * (PendingAdminInviteBanner.tsx, mounted at the App.tsx layout level) was
 * already live; this is the missing invite/manage half.
 */
export function AccountAdminsWidget({ institutionId }: { institutionId: number }) {
  const utils = trpc.useUtils();
  const { user } = useAuth();
  const { data, isLoading } = trpc.institutionAdmins.list.useQuery({ institutionId });
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [invitePhone, setInvitePhone] = useState("");

  const inviteMutation = trpc.institutionAdmins.invite.useMutation({
    onSuccess: (result) => {
      const messages: Record<string, string> = {
        linked: "Added as an admin immediately — they already had an account.",
        invited: "Invite sent — they'll be added automatically on their next sign-in.",
        already_admin: "That person is already an admin.",
        already_invited: "There's already a pending invite for that email.",
      };
      toast.success(messages[result.status] ?? "Done");
      setInviteEmail("");
      setInviteName("");
      setInvitePhone("");
      void utils.institutionAdmins.list.invalidate({ institutionId });
    },
    onError: (err) => toast.error(err.message),
  });

  const removeMutation = trpc.institutionAdmins.remove.useMutation({
    onSuccess: () => {
      toast.success("Admin removed");
      void utils.institutionAdmins.list.invalidate({ institutionId });
    },
    onError: (err) => toast.error(err.message),
  });

  if (isLoading) return <p className="text-sm text-slate-500 py-4 text-center">Loading admins…</p>;

  const admins = data?.admins ?? [];
  const pendingInvites = data?.pendingInvites ?? [];
  const totalCount = admins.length + pendingInvites.length;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Account Admins
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            This account belongs to your institution, not to one person. Keep at least two admins so
            the account is never locked out if someone becomes unreachable.
          </p>

          {totalCount < 2 && (
            <Alert className="mb-4 border-amber-200 bg-amber-50">
              <AlertCircle className="h-4 w-4 text-amber-700" />
              <AlertDescription className="text-amber-900">
                Only {totalCount} admin{totalCount === 1 ? "" : "s"} on this account — add a second
                below to protect it.
              </AlertDescription>
            </Alert>
          )}

          <div className="overflow-x-auto border rounded-lg mb-6">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b bg-slate-50">
                  <th className="py-2 px-3 font-semibold">Name</th>
                  <th className="py-2 px-3 font-semibold">Email</th>
                  <th className="py-2 px-3 font-semibold">Status</th>
                  <th className="py-2 px-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {admins.map((a) => (
                  <tr key={a.userId} className="border-b last:border-0">
                    <td className="py-2 px-3">{a.name}</td>
                    <td className="py-2 px-3">{a.email}</td>
                    <td className="py-2 px-3">
                      <Badge variant="outline">{a.isOriginalOwner ? "Founding admin" : "Admin"}</Badge>
                    </td>
                    <td className="py-2 px-3 text-right">
                      {a.userId !== user?.id && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-red-200 text-red-600 hover:bg-red-50"
                          onClick={() => removeMutation.mutate({ institutionId, adminUserId: a.userId })}
                          disabled={removeMutation.isPending}
                        >
                          Remove
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
                {pendingInvites.map((inv) => (
                  <tr key={`invite-${inv.id}`} className="border-b last:border-0 bg-slate-50/50">
                    <td className="py-2 px-3">{inv.invitedName || "—"}</td>
                    <td className="py-2 px-3">{inv.invitedEmail}</td>
                    <td className="py-2 px-3">
                      <Badge variant="outline" className="border-amber-300 text-amber-700">
                        Invited — pending
                      </Badge>
                    </td>
                    <td className="py-2 px-3" />
                  </tr>
                ))}
                {totalCount === 0 && (
                  <tr>
                    <td colSpan={4} className="py-4 px-3 text-center text-slate-400">
                      No admins found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="border-t pt-4">
            <h3 className="text-sm font-semibold mb-3">Invite another admin</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Input
                placeholder="Full name"
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
              />
              <Input
                type="email"
                placeholder="Email address"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
              <Input
                placeholder="Phone (optional)"
                value={invitePhone}
                onChange={(e) => setInvitePhone(e.target.value)}
              />
            </div>
            <Button
              className="mt-3"
              size="sm"
              onClick={() =>
                inviteMutation.mutate({
                  institutionId,
                  email: inviteEmail,
                  name: inviteName || undefined,
                  phone: invitePhone || undefined,
                })
              }
              disabled={!inviteEmail || inviteMutation.isPending}
            >
              {inviteMutation.isPending ? "Sending…" : "Send invite"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
