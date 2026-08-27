import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  PlatformAccountAutocomplete,
  type PlatformAccountOption,
} from "@/components/PlatformAccountAutocomplete";
import { AlertCircle, Users } from "lucide-react";
import { toast } from "sonner";

/**
 * North Star §6.1 multi-admin: lets the current admin see who administers
 * the institution, link another existing Paeds Resus account, and remove an
 * admin (blocked below the minimum of two, and the founding admin cannot be
 * removed here).
 */
export function AccountAdminsWidget({
  institutionId,
}: {
  institutionId: number;
}) {
  const utils = trpc.useUtils();
  const { user } = useAuth();
  const { data, isLoading } = trpc.institutionAdmins.list.useQuery({
    institutionId,
  });
  const [selectedAdmin, setSelectedAdmin] =
    useState<PlatformAccountOption | null>(null);

  const inviteMutation = trpc.institutionAdmins.invite.useMutation({
    onSuccess: result => {
      const messages: Record<string, string> = {
        linked: "Administrator account linked.",
        already_admin: "That person is already an administrator.",
      };
      toast.success(messages[result.status] ?? "Done");
      setSelectedAdmin(null);
      void utils.institutionAdmins.list.invalidate({ institutionId });
    },
    onError: err => toast.error(err.message),
  });

  const removeMutation = trpc.institutionAdmins.remove.useMutation({
    onSuccess: () => {
      toast.success("Administrator removed");
      void utils.institutionAdmins.list.invalidate({ institutionId });
    },
    onError: err => toast.error(err.message),
  });

  if (isLoading)
    return (
      <p className="text-sm text-slate-500 py-4 text-center">
        Loading administrators…
      </p>
    );

  const admins = data?.admins ?? [];
  const pendingInvites = data?.pendingInvites ?? [];
  const totalCount = admins.length;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Account administrators
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            This account belongs to your organization, not to one person. Keep
            at least two administrators linked to Paeds Resus accounts so access
            is not lost if someone becomes unreachable.
          </p>

          {totalCount < 2 && (
            <Alert className="mb-4 border-amber-200 bg-amber-50">
              <AlertCircle className="h-4 w-4 text-amber-700" />
              <AlertDescription className="text-amber-900">
                Only {totalCount} administrator{totalCount === 1 ? "" : "s"} on
                this account — add a second below to protect it.
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
                  <th className="py-2 px-3 font-semibold text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {admins.map(admin => (
                  <tr key={admin.userId} className="border-b last:border-0">
                    <td className="py-2 px-3">{admin.name}</td>
                    <td className="py-2 px-3">{admin.email}</td>
                    <td className="py-2 px-3">
                      <Badge variant="outline">
                        {admin.isOriginalOwner
                          ? "Founding administrator"
                          : "Administrator"}
                      </Badge>
                    </td>
                    <td className="py-2 px-3 text-right">
                      {admin.userId !== user?.id && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-red-200 text-red-600 hover:bg-red-50"
                          onClick={() =>
                            removeMutation.mutate({
                              institutionId,
                              adminUserId: admin.userId,
                            })
                          }
                          disabled={removeMutation.isPending}
                        >
                          Remove
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
                {pendingInvites.map(invite => (
                  <tr
                    key={`invite-${invite.id}`}
                    className="border-b last:border-0 bg-slate-50/50"
                  >
                    <td className="py-2 px-3">{invite.invitedName || "—"}</td>
                    <td className="py-2 px-3">{invite.invitedEmail}</td>
                    <td className="py-2 px-3">
                      <Badge
                        variant="outline"
                        className="border-amber-300 text-amber-700"
                      >
                        Not linked — account required
                      </Badge>
                    </td>
                    <td className="py-2 px-3" />
                  </tr>
                ))}
                {admins.length === 0 && pendingInvites.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="py-4 px-3 text-center text-slate-400"
                    >
                      No administrators found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="border-t pt-4 space-y-3">
            <div>
              <h3 className="text-sm font-semibold">
                Add an existing Paeds Resus administrator
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Search by name or email and select the account. New accounts
                must be created through Paeds Resus registration before they can
                be linked here.
              </p>
            </div>
            <PlatformAccountAutocomplete
              selectedAccount={selectedAdmin}
              onSelect={setSelectedAdmin}
            />
            <Button
              size="sm"
              onClick={() =>
                selectedAdmin &&
                inviteMutation.mutate({
                  institutionId,
                  userId: selectedAdmin.id,
                })
              }
              disabled={!selectedAdmin || inviteMutation.isPending}
            >
              {inviteMutation.isPending ? "Linking…" : "Link administrator"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
