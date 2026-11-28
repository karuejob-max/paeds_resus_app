import { useState } from "react";
import { BadgeCheck } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";

const STATE_LABEL: Record<string, string> = {
  no_licence: "Not submitted",
  pending_review: "Awaiting review",
  rejected: "Rejected",
  revoked: "Revoked",
  expired: "Expired",
  expiring: "Expiring soon",
  current: "Current",
};

/** Licence follow-up for institution administrators, credential managers and department heads. Hidden for everyone else. */
export function LicenceFollowUpPanel({ institutionId }: { institutionId: number }) {
  const utils = trpc.useUtils();
  const summary = trpc.institutionLicenceFollowup.summary.useQuery({ institutionId });
  const [date, setDate] = useState("");
  const refresh = () => utils.institutionLicenceFollowup.summary.invalidate({ institutionId });
  const setDeadline = trpc.institutionLicenceFollowup.setDeadline.useMutation({
    onSuccess: (r) => { toast.success(r.announced ? `Deadline saved. ${r.announced} people were notified in the app and ${r.emailed} by email.` : "Deadline saved."); void refresh(); },
    onError: (e) => toast.error(e.message),
  });
  const remind = trpc.institutionLicenceFollowup.remindMissing.useMutation({
    onSuccess: (r) => { toast.success(`Reminded ${r.sent} people (${r.emailed} emails sent).${r.skippedRecently ? ` ${r.skippedRecently} were reminded within the last week and were skipped.` : ""}`); void refresh(); },
    onError: (e) => toast.error(e.message),
  });
  const data = summary.data;
  if (!data) return null;
  const { counts } = data;
  const deadline = data.deadline ? new Date(data.deadline) : null;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <BadgeCheck className="h-5 w-5" /> Professional licences
          {counts.mustAct > 0 ? <Badge variant="outline" className="border-amber-300 text-amber-800">{counts.mustAct} to follow up</Badge> : null}
        </CardTitle>
        <CardDescription>
          Licensed staff need a verified licence for emergency-response roles and so renewals are tracked. People are reminded in the app and by email; nobody is locked out of learning.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          {[
            ["Licensed staff", counts.licensedStaff],
            ["Verified, current", counts.current],
            ["Awaiting review", counts.pending],
            ["Expiring soon", counts.expiring],
            ["Need to act", counts.mustAct],
          ].map(([label, value]) => (
            <div key={label as string} className="rounded-lg border p-2.5">
              <p className="text-xl font-semibold">{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>
        {counts.identityMissing > 0 ? (
          <p className="text-xs text-muted-foreground">{counts.identityMissing} people have not set their professional role yet, so we cannot tell whether a licence applies to them. They are reminded as well.</p>
        ) : null}

        {data.canSetDeadline ? (
          <div className="flex flex-wrap items-end gap-2 rounded-lg border bg-muted/20 p-3">
            <div className="space-y-1">
              <p className="text-xs font-medium">Licence deadline {deadline ? `(now ${deadline.toLocaleDateString()})` : "(not set)"}</p>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-44" />
            </div>
            <Button size="sm" disabled={!date || setDeadline.isPending} onClick={() => setDeadline.mutate({ institutionId, deadline: new Date(`${date}T23:59:59`), notifyStaff: true })}>
              Set deadline and notify staff
            </Button>
            {deadline ? (
              <Button size="sm" variant="ghost" disabled={setDeadline.isPending} onClick={() => setDeadline.mutate({ institutionId, deadline: null, notifyStaff: false })}>
                Clear
              </Button>
            ) : null}
            <p className="w-full text-xs text-muted-foreground">Existing staff are due by this date. People who join later get 30 days from the day they join.</p>
          </div>
        ) : null}

        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">Each person is reminded in the app and by email at most once a week.</p>
          <Button size="sm" variant="outline" disabled={counts.mustAct + counts.identityMissing === 0 || remind.isPending} onClick={() => remind.mutate({ institutionId })}>
            Remind {counts.mustAct} {counts.mustAct === 1 ? "person" : "people"}
          </Button>
        </div>

        {data.people.length > 0 ? (
          <div className="max-h-96 space-y-1.5 overflow-y-auto">
            {data.people.map((person) => (
              <div key={person.staffId} className="flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2">
                <div>
                  <p className="font-medium">{person.name}</p>
                  <p className="text-xs text-muted-foreground">{person.department ?? "No department"}</p>
                </div>
                <div className="flex items-center gap-2">
                  {person.overdue ? <Badge variant="outline" className="border-red-300 text-red-700">Overdue</Badge> : null}
                  <Badge variant="outline">{person.identityMissing ? "Role not set" : STATE_LABEL[person.state]}</Badge>
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
