import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ExternalLink, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { FacilityRegistryPicker, KMHFR_PUBLIC_URL, describeFacility } from "@/components/FacilityRegistryPicker";

/**
 * Platform-admin queue for institution verification. A verified institution can receive provider
 * link requests. Institutions that were active before verification existed are listed under
 * "Grandfathered" so each can be reviewed.
 */
export default function AdminInstitutionVerification() {
  const utils = trpc.useUtils();
  const [filter, setFilter] = useState<"pending_review" | "grandfathered" | "unverified" | "archived">("pending_review");
  const { data, isLoading } = trpc.institutionVerification.listForReview.useQuery({ filter });
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [changingFacility, setChangingFacility] = useState<Record<number, boolean>>({});
  const [withoutRegistry, setWithoutRegistry] = useState<Record<number, boolean>>({});
  const setFacility = trpc.institutionVerification.adminSetFacility.useMutation({
    onSuccess: (result) => {
      toast.success(`Linked to ${result.facilityName}.`);
      void utils.institutionVerification.listForReview.invalidate();
    },
    onError: (error) => toast.error(error.message),
  });
  async function openEvidenceFile(institutionId: number) {
    try {
      const result = await utils.institutionVerification.evidenceFileUrl.fetch({ institutionId });
      window.open(result.url, "_blank", "noopener,noreferrer");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not open the file");
    }
  }
  const review = trpc.institutionVerification.review.useMutation({
    onSuccess: (result) => {
      toast.success(`Institution is now ${result.status.replace("_", " ")}.`);
      void utils.institutionVerification.listForReview.invalidate();
    },
    onError: (error) => toast.error(error.message),
  });
  const archive = trpc.institutionVerification.archive.useMutation({
    onSuccess: () => {
      toast.success("Institution archived.");
      void utils.institutionVerification.listForReview.invalidate();
    },
    onError: (error) => toast.error(error.message),
  });
  const restore = trpc.institutionVerification.restore.useMutation({
    onSuccess: () => {
      toast.success("Institution restored.");
      void utils.institutionVerification.listForReview.invalidate();
    },
    onError: (error) => toast.error(error.message),
  });
  const institutions = data?.institutions ?? [];

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <div className="flex items-center gap-2 mb-4">
        <ShieldCheck className="w-6 h-6 text-brand-teal" />
        <h1 className="text-2xl font-bold text-foreground">Institution verification</h1>
      </div>
      <div className="flex gap-2 mb-6">
        <Button size="sm" variant={filter === "pending_review" ? "default" : "outline"} onClick={() => setFilter("pending_review")}>Awaiting review</Button>
        <Button size="sm" variant={filter === "grandfathered" ? "default" : "outline"} onClick={() => setFilter("grandfathered")}>Grandfathered</Button>
        <Button size="sm" variant={filter === "unverified" ? "default" : "outline"} onClick={() => setFilter("unverified")}>Unverified</Button>
        <Button size="sm" variant={filter === "archived" ? "default" : "outline"} onClick={() => setFilter("archived")}>Archived</Button>
      </div>
      {isLoading ? (
        <p className="text-sm text-slate-500">Loading…</p>
      ) : institutions.length === 0 ? (
        <p className="text-sm text-slate-500">Nothing to review here.</p>
      ) : (
        <div className="space-y-6">
          {institutions.map((institution) => {
            const note = notes[institution.id] ?? "";
            const decide = (decision: "verify" | "reject" | "revoke") =>
              review.mutate({ institutionId: institution.id, decision, note, allowWithoutRegistry: withoutRegistry[institution.id] || undefined });
            const needsRegistry = !institution.facility && !institution.verificationFacilityNotListed && !withoutRegistry[institution.id];
            return (
              <Card key={institution.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between text-base">
                    <span>#{institution.id} {institution.companyName}</span>
                    <Badge variant="outline">{institution.verificationStatus.replace("_", " ")}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <p><strong>Contact:</strong> {institution.contactName} ({institution.contactEmail})</p>
                  <div className="space-y-2 rounded-md border p-3">
                    <p className="font-medium">Registry facility</p>
                    {institution.facility && !changingFacility[institution.id] ? (
                      <>
                        <p>
                          <strong>{institution.facility.name}</strong> — {describeFacility(institution.facility)}
                        </p>
                        <p className={institution.nameMatch === "match" ? "text-emerald-700" : "text-amber-800"}>
                          {institution.nameMatch === "match"
                            ? "The institution's name matches the registry name."
                            : institution.nameMatch === "partial"
                              ? `The names are only partly alike: "${institution.companyName}" vs "${institution.facility.name}". Check this is the right facility.`
                              : `The names differ: "${institution.companyName}" vs "${institution.facility.name}". Check this is the right facility.`}
                        </p>
                        <Button type="button" size="sm" variant="ghost" onClick={() => setChangingFacility((c) => ({ ...c, [institution.id]: true }))}>Change facility</Button>
                      </>
                    ) : (
                      <>
                        <p className="text-slate-600">
                          {institution.verificationFacilityNotListed ? "The institution says it is not in the registry list." : "No registry facility is linked yet."} Search the registry and link it. For a registry facility, its MFL code is copied onto the institution.
                        </p>
                        <FacilityRegistryPicker
                          selected={null}
                          onSelect={(facility) => {
                            if (!facility) return;
                            setFacility.mutate({ institutionId: institution.id, kmhflFacilityId: facility.id });
                            setChangingFacility((c) => ({ ...c, [institution.id]: false }));
                          }}
                        />
                      </>
                    )}
                    <p className="text-xs text-slate-500">
                      Typed registration number: {institution.registrationNumber ?? "—"} ·{" "}
                      <a className="underline" href={KMHFR_PUBLIC_URL} target="_blank" rel="noopener noreferrer">open the Ministry of Health registry</a>
                    </p>
                  </div>
                  {institution.verificationMethod && institution.verificationMethod !== "grandfathered" ? (
                    <p><strong>Evidence type:</strong> {institution.verificationMethod.replace(/_/g, " ")}{institution.verificationLicenceNumber ? ` · licence ${institution.verificationLicenceNumber}` : ""}</p>
                  ) : null}
                  {institution.hasEvidenceFile ? (
                    <p>
                      <Button type="button" size="sm" variant="outline" onClick={() => void openEvidenceFile(institution.id)}>
                        View uploaded file{institution.verificationEvidenceFileName ? ` (${institution.verificationEvidenceFileName})` : ""}
                      </Button>
                    </p>
                  ) : null}
                  {institution.verificationEvidenceUrl ? (
                    <p>
                      <a className="inline-flex items-center gap-1 text-brand-teal underline" href={institution.verificationEvidenceUrl} target="_blank" rel="noopener noreferrer">
                        Evidence link <ExternalLink className="h-3 w-3" />
                      </a>
                    </p>
                  ) : null}
                  {institution.verificationEvidenceNote ? <p><strong>Note from the institution:</strong> {institution.verificationEvidenceNote}</p> : null}
                  {institution.conflictingInstitutionId ? (
                    <p className="text-amber-800">Institution #{institution.conflictingInstitutionId} is already verified for this KMHFL facility. Revoke that claim before verifying this one.</p>
                  ) : null}
                  {institution.archivedAt ? (
                    <p className="text-slate-600">Archived: {institution.archiveReason}</p>
                  ) : null}
                  {!institution.facility && !institution.archivedAt && (institution.verificationStatus !== "verified" || institution.verificationMethod === "grandfathered") && !institution.verificationFacilityNotListed ? (
                    <label className="flex items-center gap-2 text-slate-700">
                      <Checkbox checked={Boolean(withoutRegistry[institution.id])} onCheckedChange={(checked) => setWithoutRegistry((c) => ({ ...c, [institution.id]: checked === true }))} />
                      This institution is genuinely not a registry facility (for example a training body)
                    </label>
                  ) : null}
                  <Input
                    placeholder="Decision note (required, recorded in the audit trail)"
                    value={note}
                    onChange={(event) => setNotes((current) => ({ ...current, [institution.id]: event.target.value }))}
                  />
                  <div className="flex flex-wrap gap-2">
                    {institution.archivedAt ? (
                      <Button size="sm" variant="outline" disabled={restore.isPending || note.trim().length < 3} onClick={() => restore.mutate({ institutionId: institution.id, reason: note })}>Restore</Button>
                    ) : (
                      <>
                    <Button size="sm" disabled={review.isPending || note.trim().length < 3 || needsRegistry || Boolean(institution.conflictingInstitutionId)} onClick={() => decide("verify")}>Verify</Button>
                    {institution.verificationStatus === "pending_review" ? (
                      <Button size="sm" variant="outline" disabled={review.isPending || note.trim().length < 3} onClick={() => decide("reject")}>Reject</Button>
                    ) : null}
                    {institution.verificationStatus === "verified" ? (
                      <Button size="sm" variant="outline" disabled={review.isPending || note.trim().length < 3} onClick={() => decide("revoke")}>Revoke</Button>
                    ) : (
                      <Button size="sm" variant="outline" disabled={archive.isPending || note.trim().length < 3} onClick={() => archive.mutate({ institutionId: institution.id, reason: note })}>Archive (duplicate or mistake)</Button>
                    )}
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
