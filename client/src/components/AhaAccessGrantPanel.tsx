import { useState } from "react";
import { ShieldCheck, UserPlus, XCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AHA_PROGRAM_LABELS, AHA_PROGRAM_TYPES, type AhaProgramType } from "@shared/aha-pathways";

export default function AhaAccessGrantPanel() {
  const [query, setQuery] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [programType, setProgramType] = useState<AhaProgramType | "">("");
  const [reason, setReason] = useState("");
  const [expiresAt, setExpiresAt] = useState("");

  const usersQuery = trpc.adminLearning.searchAhaGrantUsers.useQuery(
    { query: query.trim() },
    { enabled: query.trim().length >= 2 }
  );
  const grantsQuery = trpc.adminLearning.listAhaAccessGrants.useQuery();
  const grantMutation = trpc.adminLearning.grantAhaAccess.useMutation({
    onSuccess: () => {
      setSelectedUserId(null);
      setReason("");
      setExpiresAt("");
      void grantsQuery.refetch();
    },
  });
  const revokeMutation = trpc.adminLearning.revokeAhaAccess.useMutation({
    onSuccess: () => void grantsQuery.refetch(),
  });

  const selectedUser = usersQuery.data?.find((candidate) => candidate.id === selectedUserId);
  const submitGrant = () => {
    if (!selectedUserId || reason.trim().length < 10) return;
    grantMutation.mutate({
      userId: selectedUserId,
      programType: programType || null,
      reason: reason.trim(),
      ...(expiresAt ? { expiresAt } : {}),
    });
  };

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <ShieldCheck className="h-5 w-5 text-primary" />
          AHA access grants
        </CardTitle>
        <CardDescription>
          Grant temporary free access to a named reviewer or authorised learner. Grants bypass payment only; they do not bypass clinical prerequisites. Every grant is auditable and revocable.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="aha-grant-user-search">Find provider</label>
            <Input
              id="aha-grant-user-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Name or email"
            />
            {usersQuery.data && usersQuery.data.length > 0 && (
              <div className="rounded-md border bg-background text-sm">
                {usersQuery.data.map((candidate) => (
                  <button
                    type="button"
                    key={candidate.id}
                    onClick={() => setSelectedUserId(candidate.id)}
                    className={`block w-full border-b px-3 py-2 text-left last:border-b-0 hover:bg-muted ${selectedUserId === candidate.id ? "bg-muted" : ""}`}
                  >
                    <span className="font-medium">{candidate.name || "Unnamed provider"}</span>
                    <span className="ml-2 text-muted-foreground">{candidate.email || `User #${candidate.id}`}</span>
                  </button>
                ))}
              </div>
            )}
            {selectedUser && <p className="text-xs text-muted-foreground">Selected: {selectedUser.name || selectedUser.email || `User #${selectedUser.id}`}</p>}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="aha-grant-program">Course scope</label>
            <select id="aha-grant-program" value={programType} onChange={(event) => setProgramType(event.target.value as AhaProgramType | "")} className="h-10 w-full rounded-md border bg-background px-3 text-sm">
              <option value="">All AHA courses</option>
              {AHA_PROGRAM_TYPES.map((type) => <option key={type} value={type}>{AHA_PROGRAM_LABELS[type]}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="aha-grant-reason">Reason</label>
            <Input id="aha-grant-reason" value={reason} onChange={(event) => setReason(event.target.value)} placeholder="e.g. Course-review team access" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="aha-grant-expires">Expiry (optional)</label>
            <Input id="aha-grant-expires" type="date" value={expiresAt} onChange={(event) => setExpiresAt(event.target.value)} />
          </div>
        </div>
        <Button type="button" onClick={submitGrant} disabled={!selectedUserId || reason.trim().length < 10 || grantMutation.isPending}>
          <UserPlus className="mr-2 h-4 w-4" />
          {grantMutation.isPending ? "Granting…" : "Grant access"}
        </Button>
        {grantMutation.error && <p className="text-sm text-destructive">{grantMutation.error.message}</p>}

        <div className="space-y-2">
          <h3 className="text-sm font-semibold">Recent grants</h3>
          {grantsQuery.data?.length ? grantsQuery.data.map((grant) => {
            const active = !grant.revokedAt && (!grant.expiresAt || new Date(grant.expiresAt).getTime() > Date.now());
            return (
              <div key={grant.id} className="flex flex-col gap-2 rounded-md border p-3 text-sm sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium">{grant.userName || grant.userEmail || `User #${grant.userId}`} · {grant.programType ? AHA_PROGRAM_LABELS[grant.programType] : "All AHA courses"}</p>
                  <p className="text-xs text-muted-foreground">{grant.reason}{grant.expiresAt ? ` · expires ${new Date(grant.expiresAt).toLocaleDateString()}` : " · no expiry"}</p>
                </div>
                {active ? <Button type="button" size="sm" variant="outline" onClick={() => { const revokeReason = window.prompt("Reason for revoking this grant:"); if (revokeReason?.trim()) revokeMutation.mutate({ grantId: grant.id, reason: revokeReason.trim() }); }} disabled={revokeMutation.isPending}><XCircle className="mr-1 h-4 w-4" />Revoke</Button> : <span className="text-xs text-muted-foreground">Inactive</span>}
              </div>
            );
          }) : <p className="text-sm text-muted-foreground">No named-user AHA grants recorded.</p>}
        </div>
      </CardContent>
    </Card>
  );
}
