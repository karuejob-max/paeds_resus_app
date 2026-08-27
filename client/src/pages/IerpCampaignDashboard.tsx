import { useState } from "react";
import { AlertCircle, CheckCircle2, Eye, FileText, MailCheck, PauseCircle, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function IerpCampaignDashboard() {
  const [selectedCampaignId, setSelectedCampaignId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [selectedInternProfileId, setSelectedInternProfileId] = useState<number | null>(null);
  const [internReviewReason, setInternReviewReason] = useState("");
  const { data: safety } = trpc.ierpCampaigns.getSafetyStatus.useQuery(undefined, { retry: false });
  const { data: internProfiles, refetch: refetchInternProfiles } = trpc.ierp.listInternProfiles.useQuery(undefined, { retry: false });
  const internEvidence = trpc.ierp.getInternProfileEvidenceUrl.useQuery(
    { profileId: selectedInternProfileId ?? 0 },
    { enabled: selectedInternProfileId !== null, retry: false },
  );
  const { data: campaigns, refetch: refetchCampaigns } = trpc.ierpCampaigns.list.useQuery(undefined, { retry: false });
  const preview = trpc.ierpCampaigns.previewAudience.useQuery(
    { campaignId: selectedCampaignId ?? 0 },
    { enabled: selectedCampaignId !== null, retry: false }
  );
  const createDraft = trpc.ierpCampaigns.createDraft.useMutation({
    onSuccess: async (result) => {
      toast.success(`Draft ${result.campaignId} created. Sending remains disabled.`);
      setName(""); setSubject(""); setBody("");
      await refetchCampaigns();
    },
    onError: (error) => toast.error(error.message),
  });
  const pause = trpc.ierpCampaigns.pause.useMutation({
    onSuccess: async () => { toast.success("Campaign paused."); await refetchCampaigns(); },
    onError: (error) => toast.error(error.message),
  });
  const reviewInternProfile = trpc.ierp.reviewInternProfile.useMutation({
    onSuccess: async () => {
      toast.success("Intern profile review saved.");
      setInternReviewReason("");
      await refetchInternProfiles();
    },
    onError: (error) => toast.error(error.message),
  });

  return (
    <main className="container max-w-6xl py-8 space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-indigo-700">IERP operations</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Paused campaign workspace</h1>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">Create templates, inspect consent-safe audiences, and review exclusions. This release cannot send promotional email.</p>
      </div>
      <div className="flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
        <div><p className="font-semibold">Promotional sending is disabled</p><p className="mt-1">Every campaign is draft or paused. There is no active send worker or release path in this initiative.</p></div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><MailCheck className="h-5 w-5" />Create a draft</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Input placeholder="Campaign name" value={name} onChange={(event) => setName(event.target.value)} />
            <Input placeholder="Subject" value={subject} onChange={(event) => setSubject(event.target.value)} />
            <Textarea placeholder="Message body" value={body} onChange={(event) => setBody(event.target.value)} rows={7} />
            <Button
              className="w-full"
              disabled={!name.trim() || !subject.trim() || !body.trim() || createDraft.isPending}
              onClick={() => createDraft.mutate({ name, subject, body, templateVersion: "ierp-v1", audienceFilter: {} })}
            >
              {createDraft.isPending ? "Saving…" : "Save draft"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Campaigns</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {!campaigns?.length ? <p className="text-sm text-muted-foreground">No IERP campaigns yet.</p> : campaigns.map((campaign) => <div key={campaign.id} className="flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-medium">{campaign.name}</p><p className="text-xs text-muted-foreground">{campaign.scheduleState} · template {campaign.templateVersion}</p></div><div className="flex gap-2"><Button size="sm" variant="outline" onClick={() => { setSelectedCampaignId(campaign.id); void preview.refetch(); }}><Eye className="mr-1 h-4 w-4" />Preview</Button>{campaign.scheduleState !== "paused" && <Button size="sm" variant="outline" onClick={() => pause.mutate({ campaignId: campaign.id })}><PauseCircle className="mr-1 h-4 w-4" />Pause</Button>}</div></div>)}
          </CardContent>
        </Card>
      </div>

      {preview.data && (
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><AlertCircle className="h-5 w-5" />Audience preview — {preview.data.total} IERP enrolments</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">Eligible: <strong>{preview.data.eligible.length}</strong> · Excluded: <strong>{preview.data.excluded.length}</strong>. Eligibility requires an opted-in IERP preference, a usable email address, no global suppression, and matching filters.</p>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-lg border border-green-200 bg-green-50 p-3"><p className="text-sm font-semibold text-green-900">Eligible preview</p>{preview.data.eligible.slice(0, 20).map((row) => <p key={row.userId} className="mt-2 text-xs text-green-900">{row.name ?? "Unnamed"} · {row.email}</p>)}</div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3"><p className="text-sm font-semibold text-slate-900">Exclusion reasons</p>{preview.data.excluded.slice(0, 20).map((row) => <p key={row.userId} className="mt-2 text-xs text-slate-700">{row.name ?? "Unnamed"} · {row.reasons.join(", ")}</p>)}</div>
            </div>
            <Button disabled className="w-full sm:w-auto">Promotional sending disabled</Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" />Intern profile evidence</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">Review the private MoH deployment/posting letter and the structured internship details. Submitted profiles can start IERP; rejected or revoked profiles are blocked until corrected.</p>
          {!internProfiles?.length ? <p className="text-sm text-muted-foreground">No intern profiles have been submitted.</p> : internProfiles.map((profile) => (
            <div key={profile.id} className="rounded-lg border p-3">
              <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                <div className="text-sm">
                  <p className="font-medium">{profile.userName ?? "Unnamed learner"} {profile.userEmail ? `· ${profile.userEmail}` : ""}</p>
                  <p className="text-xs text-muted-foreground">{profile.designation} · Ref {profile.officialLetterReferenceNumber} · Commenced {new Date(profile.effectiveCommencementDate).toLocaleDateString()}</p>
                  <p className="text-xs text-muted-foreground">{profile.status} · {profile.deploymentLetterFileName}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => setSelectedInternProfileId(profile.id)} disabled={!profile.evidenceAvailable}>View letter</Button>
                  <Button size="sm" variant="outline" onClick={() => reviewInternProfile.mutate({ profileId: profile.id, decision: "verified", reason: internReviewReason.trim() || "MoH deployment/posting evidence reviewed and accepted." })} disabled={reviewInternProfile.isPending}><CheckCircle2 className="mr-1 h-4 w-4" />Verify</Button>
                  <Button size="sm" variant="outline" onClick={() => reviewInternProfile.mutate({ profileId: profile.id, decision: "rejected", reason: internReviewReason.trim() || "Please correct and resubmit the intern evidence." })} disabled={reviewInternProfile.isPending}>Reject</Button>
                </div>
              </div>
            </div>
          ))}
          <Input value={internReviewReason} onChange={(event) => setInternReviewReason(event.target.value)} placeholder="Optional review reason (used for the selected action)" />
          {internEvidence.data ? <a className="inline-block text-sm font-medium text-indigo-700 underline" href={internEvidence.data.url} target="_blank" rel="noreferrer">Open selected private letter</a> : null}
        </CardContent>
      </Card>

      {safety && <p className="text-xs text-muted-foreground">Safety status: {safety.promotionalSendingEnabled ? "enabled" : "disabled"}; allowed states: {safety.allowedScheduleStates.join(" / ")}.</p>}
    </main>
  );
}
