import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserCheck } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

/**
 * People who joined this institution before it had to approve its members (self-selected facility
 * or CPD attendance). Each person is reviewed one at a time. Department reviewers can confirm
 * someone or pass them on ("not in my department"); only institution-level reviewers can remove
 * someone or assign a department. The panel hides itself for anyone with no review responsibility.
 */
export function LegacyMemberReviewPanel({ institutionId }: { institutionId: number }) {
  const utils = trpc.useUtils();
  const scope = trpc.institutionMemberReview.myScope.useQuery({ institutionId });
  const list = trpc.institutionMemberReview.list.useQuery({ institutionId }, { enabled: Boolean(scope.data) });
  const [chosen, setChosen] = useState<Record<number, string>>({});

  const refresh = () => utils.institutionMemberReview.list.invalidate({ institutionId });
  const done = (message: string) => () => {
    toast.success(message);
    void refresh();
  };
  const failed = (error: { message: string }) => toast.error(error.message);
  const confirm = trpc.institutionMemberReview.confirm.useMutation({ onSuccess: done("Confirmed."), onError: failed });
  const notMine = trpc.institutionMemberReview.notInMyDepartment.useMutation({ onSuccess: done("Passed to the institution-level reviewers."), onError: failed });
  const remove = trpc.institutionMemberReview.remove.useMutation({ onSuccess: done("Access ended."), onError: failed });
  const assign = trpc.institutionMemberReview.assignDepartment.useMutation({ onSuccess: done("Department assigned."), onError: failed });

  if (!scope.data || !list.data || list.data.members.length === 0) return null;
  const isInstitution = list.data.tier === "institution";
  const busy = confirm.isPending || notMine.isPending || remove.isPending || assign.isPending;

  const ask = (question: string) => window.prompt(question)?.trim() ?? "";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <UserCheck className="h-5 w-5" /> Members to review
          <Badge variant="outline">{list.data.members.length}</Badge>
        </CardTitle>
        <CardDescription>
          These people joined before the institution had to approve its members. Confirm each person who works here.
          {isInstitution
            ? " You can also remove someone or assign them a department."
            : " If someone is not in your department, pass them on; the institution-level reviewers will decide."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {list.data.members.map((member) => (
          <div key={member.membershipId} className="rounded-lg border p-3 text-sm space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-medium">{member.name}</p>
                <p className="text-xs text-muted-foreground">{member.email} · {member.department ?? "No department"}</p>
              </div>
              {member.flagCount > 0 ? <Badge variant="outline" className="border-amber-300 text-amber-800">Flagged by {member.flagCount}</Badge> : null}
            </div>
            {isInstitution && member.flags.length > 0 ? (
              <ul className="list-disc pl-5 text-xs text-amber-900">
                {member.flags.map((flag, index) => <li key={index}>{flag.note ?? "No note"}</li>)}
              </ul>
            ) : null}
            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm" disabled={busy} onClick={() => confirm.mutate({ institutionId, membershipId: member.membershipId })}>Confirm</Button>
              {!isInstitution ? (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busy}
                  onClick={() => {
                    const note = ask("Why is this person not in your department? (for example: works in theatre, or I don't recognise them)");
                    if (note.length >= 3) notMine.mutate({ institutionId, membershipId: member.membershipId, note });
                  }}
                >
                  Not in my department
                </Button>
              ) : (
                <>
                  <select
                    className="rounded-md border px-2 py-1 text-xs"
                    value={chosen[member.membershipId] ?? ""}
                    onChange={(event) => setChosen((current) => ({ ...current, [member.membershipId]: event.target.value }))}
                  >
                    <option value="">Assign department…</option>
                    {list.data.departments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}
                  </select>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busy || !chosen[member.membershipId]}
                    onClick={() => assign.mutate({ institutionId, membershipId: member.membershipId, departmentId: Number(chosen[member.membershipId]) })}
                  >
                    Assign
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-700"
                    disabled={busy}
                    onClick={() => {
                      const reason = ask(`Why is ${member.name} being removed? Their access, roles and future duties here will end.`);
                      if (reason.length >= 3) remove.mutate({ institutionId, membershipId: member.membershipId, reason });
                    }}
                  >
                    Remove
                  </Button>
                </>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
