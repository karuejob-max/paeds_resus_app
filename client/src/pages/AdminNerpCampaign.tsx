import { useEffect, useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, Download, Loader2, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";

const INSTITUTION_ID = 3;
const APPROVAL_PHRASE = "APPROVE NERP RECIPIENT SNAPSHOT";
const SEND_PHRASE = "SEND NERP CAMPAIGN TO APPROVED RECIPIENTS";

type SnapshotRow = {
  id: number;
  displayName: string;
  email: string;
  department: string | null;
  status: string;
  skipReason: string | null;
};

export default function AdminNerpCampaign() {
  const utils = trpc.useUtils();
  const preview = trpc.nerpCampaigns.previewAudience.useQuery({
    institutionId: INSTITUTION_ID,
    limit: 200,
  });
  const status = trpc.nerpCampaigns.getStatus.useQuery(undefined, { retry: false });
  const campaigns = trpc.nerpCampaigns.list.useQuery(undefined, { retry: false });
  const [campaignId, setCampaignId] = useState<number | null>(null);
  const [approvalConfirmation, setApprovalConfirmation] = useState("");
  const [sendConfirmation, setSendConfirmation] = useState("");
  const campaign = trpc.nerpCampaigns.getCampaign.useQuery(
    { campaignId: campaignId ?? 0 },
    { enabled: campaignId !== null, retry: false }
  );
  const currentTemplateVersion = status.data?.templateVersion;
  const currentCampaign = useMemo(
    () =>
      campaigns.data?.find(
        item =>
          item.templateVersion === currentTemplateVersion &&
          ["draft", "approved", "sending"].includes(item.status)
      ),
    [campaigns.data, currentTemplateVersion]
  );
  useEffect(() => {
    if (!campaigns.data || !currentTemplateVersion) return;
    if (currentCampaign?.id) {
      if (campaignId !== currentCampaign.id) setCampaignId(currentCampaign.id);
      return;
    }
    if (campaignId !== null) setCampaignId(null);
  }, [campaignId, campaigns.data, currentCampaign?.id, currentTemplateVersion]);

  const createDraft = trpc.nerpCampaigns.createDraft.useMutation({
    onSuccess: async result => {
      if (result.campaign?.id) setCampaignId(result.campaign.id);
      await campaigns.refetch();
    },
  });
  const approveSnapshot = trpc.nerpCampaigns.approveSnapshot.useMutation({
    onSuccess: async () => {
      setApprovalConfirmation("");
      await Promise.all([campaign.refetch(), campaigns.refetch(), preview.refetch()]);
    },
  });
  const sendCampaign = trpc.nerpCampaigns.sendApproved.useMutation({
    onSuccess: async () => {
      setSendConfirmation("");
      await Promise.all([campaign.refetch(), campaigns.refetch(), preview.refetch()]);
    },
  });

  const downloadCsv = () => {
    const rows = preview.data?.recipients.filter(row => row.sendable) ?? [];
    const header = ["name", "email", "department", "promotion_status"];
    const body = rows.map(row =>
      [row.name, row.email, row.department ?? "", row.promotionStatus]
        .map(value => `"${String(value).replaceAll('"', '""')}"`)
        .join(",")
    );
    const url = URL.createObjectURL(new Blob([[header.join(","), ...body].join("\n")], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "institution-3-nerp-current-eligible.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const providerReady = status.data?.provider.ready === true;
  const snapshot = (campaign.data?.recipients ?? []) as SnapshotRow[];
  const campaignStatus = campaign.data?.campaign?.status;

  return (
    <div className="min-h-screen bg-muted/20 px-4 py-8 md:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-slate-900 text-white">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">NERP campaign operations</h1>
            <p className="text-sm text-muted-foreground">
              Global Admin only · this page loads campaign data without the external-verification queues.
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Pre-send safety status</CardTitle>
            <CardDescription>
              The current NERP one-time campaign uses the separately documented opt-out policy. Every recipient is rechecked before delivery, and each delivered message receives a signed one-click unsubscribe link.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">Template</p>
              <p className="mt-1 text-sm font-medium">{currentTemplateVersion ?? "checking"}</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">Provider</p>
              <p className="mt-1 text-sm font-medium">{status.data?.provider.provider ?? "checking"} · {providerReady ? "ready" : "not ready"}</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">Automatic sending</p>
              <p className="mt-1 text-sm font-medium">Disabled</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">Current campaign</p>
              <p className="mt-1 text-sm font-medium">{campaignStatus ?? "No current draft"}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Current NERP nurse audience</CardTitle>
            <CardDescription>
              This is the live, suppression-aware preview for institution 3. It is not an approved recipient snapshot until you explicitly approve it.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {preview.isLoading ? <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Building the current preview…</div> : null}
            {preview.isError ? <div className="flex items-center gap-2 text-sm text-red-700"><AlertCircle className="h-4 w-4" />{preview.error.message}</div> : null}
            {preview.data ? (
              <>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
                  {[
                    ["Nurse records", preview.data.counts.totalNurses],
                    ["Eligible", preview.data.counts.sendable],
                    ["Suppressed", preview.data.counts.suppressed],
                    ["Needs review", preview.data.counts.needsReview],
                    ["Name excluded", preview.data.counts.excludedByName],
                    ["Suppression-only", preview.data.counts.suppressionOnly],
                  ].map(([label, value]) => <div key={label} className="rounded-lg border p-3"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 text-2xl font-bold">{value}</p></div>)}
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <Button type="button" variant="outline" onClick={downloadCsv} disabled={!preview.data.recipients.some(row => row.sendable)}><Download className="mr-2 h-4 w-4" />Download current eligible CSV</Button>
                  <Button type="button" onClick={() => createDraft.mutate({ institutionId: INSTITUTION_ID })} disabled={createDraft.isPending}>{currentCampaign?.status === "draft" ? "Use current draft" : "Create governed draft"}</Button>
                  <span className="text-sm text-muted-foreground">No automatic sending. The current preview is recomputed before approval.</span>
                </div>
                {createDraft.error ? <p className="text-sm text-red-700">{createDraft.error.message}</p> : null}
              </>
            ) : null}
          </CardContent>
        </Card>

        {campaign.data?.campaign ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between gap-3">
                <span>Governed draft: {campaign.data.campaign.subject}</span>
                <Badge variant={campaignStatus === "sent" ? "default" : "outline"}>{campaignStatus}</Badge>
              </CardTitle>
              <CardDescription>
                Snapshot count: {campaign.data.campaign.audienceCount} · {campaign.data.campaign.templateVersion}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border bg-background p-4">
                <p className="whitespace-pre-wrap text-sm leading-6">{campaign.data.campaign.bodyText}</p>
              </div>
              <p className="text-sm text-muted-foreground">
                Snapshot: {campaign.data.counts.audienceCount} · Sent: {campaign.data.counts.sentCount} · Failed: {campaign.data.counts.failedCount} · Pending: {campaign.data.counts.pendingCount} · Skipped: {campaign.data.counts.skippedCount}
              </p>
              {snapshot.length ? (
                <details className="rounded-md border bg-background p-3" open>
                  <summary className="cursor-pointer text-sm font-medium">Review immutable recipient snapshot ({snapshot.length})</summary>
                  <div className="mt-3 max-h-80 overflow-auto">
                    <table className="w-full min-w-[640px] text-sm"><thead className="bg-muted/40"><tr><th className="p-2 text-left">Name</th><th className="p-2 text-left">Email</th><th className="p-2 text-left">Department</th><th className="p-2 text-left">Delivery</th></tr></thead><tbody>{snapshot.map(row => <tr key={row.id} className="border-t"><td className="p-2">{row.displayName}</td><td className="p-2">{row.email}</td><td className="p-2">{row.department ?? "—"}</td><td className="p-2">{row.status}{row.skipReason ? ` · ${row.skipReason}` : ""}</td></tr>)}</tbody></table>
                  </div>
                </details>
              ) : <p className="text-sm text-amber-700">No recipient snapshot exists yet. The stale v3 draft is not selected; create a fresh current-template draft.</p>}
              {campaignStatus === "draft" ? (
                <div className="space-y-2 rounded-md border bg-background p-3">
                  <p className="text-sm">Type <strong>{status.data?.approvalPhrase ?? APPROVAL_PHRASE}</strong> to freeze the current suppression-aware recipient snapshot.</p>
                  <Input value={approvalConfirmation} onChange={event => setApprovalConfirmation(event.target.value)} placeholder={status.data?.approvalPhrase ?? APPROVAL_PHRASE} aria-label="NERP campaign approval confirmation" />
                  <Button type="button" onClick={() => approveSnapshot.mutate({ campaignId: campaign.data!.campaign.id, confirmation: approvalConfirmation })} disabled={approveSnapshot.isPending || approvalConfirmation !== (status.data?.approvalPhrase ?? APPROVAL_PHRASE)}>Approve recipient snapshot</Button>
                </div>
              ) : null}
              {campaignStatus === "approved" || campaignStatus === "failed" ? (
                <div className="space-y-2 rounded-md border border-amber-300 bg-amber-50 p-3 text-amber-950">
                  <p className="text-sm">Final send-time checks will re-read opt-outs and suppressions. Type <strong>{status.data?.sendPhrase ?? SEND_PHRASE}</strong> only after reviewing this exact snapshot and provider readiness.</p>
                  <Input value={sendConfirmation} onChange={event => setSendConfirmation(event.target.value)} placeholder={status.data?.sendPhrase ?? SEND_PHRASE} aria-label="NERP campaign send confirmation" />
                  <Button type="button" variant="destructive" onClick={() => sendCampaign.mutate({ campaignId: campaign.data!.campaign.id, confirmation: sendConfirmation })} disabled={sendCampaign.isPending || !providerReady || sendConfirmation !== (status.data?.sendPhrase ?? SEND_PHRASE)}>Send approved campaign</Button>
                </div>
              ) : null}
              {approveSnapshot.error ? <p className="text-sm text-red-700">{approveSnapshot.error.message}</p> : null}
              {sendCampaign.error ? <p className="text-sm text-red-700">{sendCampaign.error.message}</p> : null}
              {campaignStatus === "sent" ? <p className="flex items-center gap-2 text-sm text-emerald-700"><CheckCircle2 className="h-4 w-4" />Campaign delivery completed.</p> : null}
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
