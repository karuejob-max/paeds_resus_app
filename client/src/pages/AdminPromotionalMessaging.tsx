import { useState } from "react";
import { ArrowLeft, Loader2, Mail, ShieldCheck } from "lucide-react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const CADRES = [
  ["nurse", "Nurses"],
  ["doctor", "Doctors"],
  ["pharmacist", "Pharmacists"],
  ["paramedic", "Paramedics"],
  ["lab_tech", "Laboratory staff"],
  ["respiratory_therapist", "Respiratory therapists"],
  ["midwife", "Midwives"],
  ["support_staff", "Support staff"],
  ["other", "Other providers"],
  ["intern", "Interns"],
] as const;

type Cadre = (typeof CADRES)[number][0];

type RecipientRow = {
  userId: number;
  displayName: string;
  email: string;
  cadre: string | null;
  department: string | null;
  consentStatus: string;
  eligible: boolean;
  reasons: string[];
};

export default function AdminPromotionalMessaging() {
  const [cadres, setCadres] = useState<Cadre[]>(["nurse"]);
  const [subject, setSubject] = useState("A Paeds Resus learning opportunity");
  const [name, setName] = useState("Programme update");
  const [bodyText, setBodyText] = useState(
    "We are sharing an optional learning opportunity that may be relevant to your professional development. Please review the details at your convenience."
  );
  const [campaignId, setCampaignId] = useState<number | null>(null);
  const [approvalConfirmation, setApprovalConfirmation] = useState("");
  const [sendConfirmation, setSendConfirmation] = useState("");
  const utils = trpc.useUtils();
  const status = trpc.promotionalCampaigns.getStatus.useQuery();
  const preview = trpc.promotionalCampaigns.previewAudience.useQuery({
    filter: { cadres, includeUsersWithoutInstitutionStaffRow: true },
    consentPolicy: "opt_in",
    limit: 5000,
  });
  const campaign = trpc.promotionalCampaigns.getCampaign.useQuery(
    { campaignId: campaignId as number },
    { enabled: campaignId != null }
  );
  const createDraft = trpc.promotionalCampaigns.createDraft.useMutation({
    onSuccess: result => {
      setCampaignId(result.campaign?.id ?? null);
      toast.success("Draft created. Review the audience before approval.");
      void utils.promotionalCampaigns.list.invalidate();
    },
    onError: error => toast.error(error.message),
  });
  const approveSnapshot = trpc.promotionalCampaigns.approveSnapshot.useMutation(
    {
      onSuccess: result => {
        setCampaignId(result.campaign?.id ?? campaignId);
        setApprovalConfirmation("");
        void utils.promotionalCampaigns.getCampaign.invalidate({
          campaignId: campaignId as number,
        });
        toast.success("Recipient snapshot approved.");
      },
      onError: error => toast.error(error.message),
    }
  );
  const sendCampaign = trpc.promotionalCampaigns.sendApproved.useMutation({
    onSuccess: result => {
      setSendConfirmation("");
      void utils.promotionalCampaigns.getCampaign.invalidate({
        campaignId: campaignId as number,
      });
      toast.success(
        result.success
          ? "Campaign delivery completed."
          : "Campaign completed with failures or skips."
      );
    },
    onError: error => toast.error(error.message),
  });

  const toggleCadre = (cadre: Cadre) => {
    setCadres(current =>
      current.includes(cadre)
        ? current.filter(value => value !== cadre)
        : [...current, cadre]
    );
    setCampaignId(null);
    setApprovalConfirmation("");
    setSendConfirmation("");
  };
  const campaignData = campaign.data?.campaign;

  return (
    <div className="min-h-screen bg-muted/30 p-4 md:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex items-start gap-3">
          <Link href="/admin">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Back to Admin Hub"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Governed promotional messaging
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Global Admin only. Choose controlled audience segments, review the
              opt-in-filtered list, freeze it, and send only after an exact
              confirmation.
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" /> Safety boundary
            </CardTitle>
            <CardDescription>
              Promotional messages are separate from mandatory account, payment,
              certificate, clinical, and IERS notices. Future campaigns require
              explicit user opt-in. Every message receives a signed one-click
              unsubscribe link, and the server checks consent and suppression
              again immediately before delivery.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Provider:{" "}
            <strong>{status.data?.provider.provider ?? "checking"}</strong> ·{" "}
            {status.data?.provider.ready ? "ready" : "not ready"}. Automatic
            sending is disabled. Current policy:{" "}
            <strong>opt-in required</strong>.
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Audience and message</CardTitle>
            <CardDescription>
              Audience selection is segment-based. Do not paste an arbitrary
              email list. Interns are derived from the IERP intern profile where
              available; names, cadre, and department remain visible only to
              Global Admin.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <p className="mb-2 text-sm font-medium">Cadres</p>
              <div className="flex flex-wrap gap-2">
                {CADRES.map(([value, label]) => (
                  <label
                    key={value}
                    className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={cadres.includes(value)}
                      onChange={() => toggleCadre(value)}
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-1 text-sm">
                <span className="font-medium">Campaign name</span>
                <Input
                  value={name}
                  onChange={event => setName(event.target.value)}
                />
              </label>
              <label className="space-y-1 text-sm">
                <span className="font-medium">Subject</span>
                <Input
                  value={subject}
                  onChange={event => setSubject(event.target.value)}
                />
              </label>
            </div>
            <label className="block space-y-1 text-sm">
              <span className="font-medium">Message</span>
              <textarea
                value={bodyText}
                onChange={event => setBodyText(event.target.value)}
                className="min-h-36 w-full rounded-md border bg-background p-3 leading-6"
              />
            </label>
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="outline">Opt-in required</Badge>
              <span className="text-xs text-muted-foreground">
                The current NERP one-time campaign remains on its separately
                documented opt-out policy; use the NERP verification page for
                that campaign.
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Audience preview</CardTitle>
            <CardDescription>
              The preview is live and read-only. Only users with valid email,
              selected cadre, explicit promotional opt-in, and no active
              unsubscribe, hard-bounce, or manual suppression are eligible.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {preview.isLoading ? (
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Building preview…
              </p>
            ) : null}
            {preview.error ? (
              <p className="text-sm text-red-700">{preview.error.message}</p>
            ) : null}
            {preview.data ? (
              <>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                  {[
                    ["Total", preview.data.counts.total],
                    ["Eligible", preview.data.counts.eligible],
                    ["Opted in", preview.data.counts.optedIn],
                    ["Suppressed", preview.data.counts.suppressed],
                    ["Consent needed", preview.data.counts.consentRequired],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-lg border p-3">
                      <p className="text-xs text-muted-foreground">{label}</p>
                      <p className="mt-1 text-2xl font-bold">{value}</p>
                    </div>
                  ))}
                </div>
                <details className="rounded-md border p-3">
                  <summary className="cursor-pointer text-sm font-medium">
                    Review matching users and exclusion reasons
                  </summary>
                  <div className="mt-3 max-h-80 overflow-auto">
                    <table className="w-full min-w-[760px] text-sm">
                      <thead className="bg-muted/40">
                        <tr>
                          <th className="p-2 text-left">Name</th>
                          <th className="p-2 text-left">Email</th>
                          <th className="p-2 text-left">Cadre</th>
                          <th className="p-2 text-left">Department</th>
                          <th className="p-2 text-left">Result</th>
                        </tr>
                      </thead>
                      <tbody>
                        {preview.data.candidates.map((row: RecipientRow) => (
                          <tr
                            key={`${row.userId}-${row.email}`}
                            className="border-t"
                          >
                            <td className="p-2">{row.displayName}</td>
                            <td className="p-2">{row.email || "—"}</td>
                            <td className="p-2">{row.cadre || "—"}</td>
                            <td className="p-2">{row.department || "—"}</td>
                            <td className="p-2">
                              {row.eligible ? (
                                <Badge>Eligible</Badge>
                              ) : (
                                <span className="text-muted-foreground">
                                  {row.reasons.join(", ")}
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </details>
                <Button
                  type="button"
                  onClick={() =>
                    createDraft.mutate({
                      name,
                      subject,
                      bodyText,
                      filter: {
                        cadres,
                        includeUsersWithoutInstitutionStaffRow: true,
                      },
                      consentPolicy: "opt_in",
                    })
                  }
                  disabled={
                    createDraft.isPending ||
                    !cadres.length ||
                    !subject.trim() ||
                    !bodyText.trim() ||
                    !name.trim()
                  }
                >
                  <Mail className="mr-2 h-4 w-4" /> Create draft from this
                  preview
                </Button>
              </>
            ) : null}
          </CardContent>
        </Card>

        {campaignData ? (
          <Card>
            <CardHeader>
              <CardTitle>Campaign lifecycle: {campaignData.status}</CardTitle>
              <CardDescription>
                Snapshot: {campaignData.audienceCount} · sent:{" "}
                {campaignData.sentCount} · failed: {campaignData.failedCount} ·
                skipped: {campaignData.skippedCount}. Review the immutable
                recipient snapshot before approval.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {campaign.data?.recipients.length ? (
                <details className="rounded-md border p-3">
                  <summary className="cursor-pointer text-sm font-medium">
                    Review immutable recipient snapshot
                  </summary>
                  <div className="mt-3 max-h-72 overflow-auto">
                    <table className="w-full min-w-[700px] text-sm">
                      <thead className="bg-muted/40">
                        <tr>
                          <th className="p-2 text-left">Name</th>
                          <th className="p-2 text-left">Email</th>
                          <th className="p-2 text-left">Cadre</th>
                          <th className="p-2 text-left">Department</th>
                          <th className="p-2 text-left">Delivery</th>
                        </tr>
                      </thead>
                      <tbody>
                        {campaign.data.recipients.map(
                          (row: {
                            id: number;
                            displayName: string;
                            email: string;
                            cadre: string | null;
                            department: string | null;
                            status: string;
                            skipReason: string | null;
                          }) => (
                            <tr key={row.id} className="border-t">
                              <td className="p-2">{row.displayName}</td>
                              <td className="p-2">{row.email}</td>
                              <td className="p-2">{row.cadre || "—"}</td>
                              <td className="p-2">{row.department || "—"}</td>
                              <td className="p-2">
                                {row.status}
                                {row.skipReason ? ` · ${row.skipReason}` : ""}
                              </td>
                            </tr>
                          )
                        )}
                      </tbody>
                    </table>
                  </div>
                </details>
              ) : null}
              {campaignData.status === "draft" ? (
                <div className="space-y-2 rounded-md border bg-background p-3">
                  <p className="text-sm">
                    Type <strong>{status.data?.approvalPhrase}</strong> to
                    freeze the opt-in-filtered snapshot.
                  </p>
                  <Input
                    value={approvalConfirmation}
                    onChange={event =>
                      setApprovalConfirmation(event.target.value)
                    }
                    placeholder={status.data?.approvalPhrase}
                  />
                  <Button
                    type="button"
                    onClick={() =>
                      approveSnapshot.mutate({
                        campaignId: campaignData.id,
                        confirmation: approvalConfirmation,
                      })
                    }
                    disabled={
                      approveSnapshot.isPending ||
                      approvalConfirmation !== status.data?.approvalPhrase
                    }
                  >
                    Approve recipient snapshot
                  </Button>
                </div>
              ) : null}
              {campaignData.status === "approved" ||
              campaignData.status === "failed" ? (
                <div className="space-y-2 rounded-md border border-amber-300 bg-amber-50 p-3 text-amber-950">
                  <p className="text-sm">
                    This is the final delivery action. Type{" "}
                    <strong>{status.data?.sendPhrase}</strong> only after
                    reviewing the displayed snapshot and provider readiness.
                  </p>
                  <Input
                    value={sendConfirmation}
                    onChange={event => setSendConfirmation(event.target.value)}
                    placeholder={status.data?.sendPhrase}
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() =>
                      sendCampaign.mutate({
                        campaignId: campaignData.id,
                        confirmation: sendConfirmation,
                      })
                    }
                    disabled={
                      sendCampaign.isPending ||
                      !status.data?.provider.ready ||
                      sendConfirmation !== status.data?.sendPhrase
                    }
                  >
                    Send approved campaign
                  </Button>
                </div>
              ) : null}
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
