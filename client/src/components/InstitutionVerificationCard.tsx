import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { FacilityRegistryPicker, type RegistryFacility } from "@/components/FacilityRegistryPicker";

const MAX_FILE_BYTES = 5 * 1024 * 1024;

type FacilityKind = "private" | "public" | "other";

const KINDS: { value: FacilityKind; label: string; method: "kmpdc_licence" | "county_letter" | "other"; help: string }[] = [
  {
    value: "private",
    label: "Private, faith-based or community facility",
    method: "kmpdc_licence",
    help: "Enter your current KMPDC licence or registration number and attach a copy of the licence.",
  },
  {
    value: "public",
    label: "Public (county or national government) facility",
    method: "county_letter",
    help: "Attach a letter on official letterhead, signed by the Medical Superintendent or the County / Sub-county Health office, confirming your administrator.",
  },
  {
    value: "other",
    label: "Something else",
    method: "other",
    help: "Attach whatever shows who you are (for example a registration certificate) and explain in the note.",
  },
];

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error("Could not read the file"));
    reader.readAsDataURL(file);
  });
}

/**
 * Verification for an institution, shown to its administrators. One short form: pick the facility
 * from the Ministry of Health registry, say what kind of facility it is, attach the evidence.
 * Providers can send link requests to an institution only once it is verified.
 */
export function InstitutionVerificationCard({ institutionId }: { institutionId: number }) {
  const utils = trpc.useUtils();
  const { data } = trpc.institutionVerification.status.useQuery({ institutionId });
  const [facility, setFacility] = useState<RegistryFacility | null>(null);
  const [notListed, setNotListed] = useState(false);
  const [kind, setKind] = useState<FacilityKind>("private");
  const [licence, setLicence] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [link, setLink] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (data?.facility && !facility) setFacility(data.facility);
    // Only prefill from the saved facility once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.facility?.id]);

  const submit = trpc.institutionVerification.submitEvidence.useMutation({
    onSuccess: () => {
      toast.success("Sent for review. You will be notified of the decision.");
      setFile(null);
      setLink("");
      setNote("");
      void utils.institutionVerification.status.invalidate({ institutionId });
    },
    onError: (error) => toast.error(error.message),
    onSettled: () => setBusy(false),
  });
  if (!data) return null;

  const status = data.verificationStatus;
  const canSubmit = status === "unverified" || status === "rejected";
  const selectedKind = KINDS.find((entry) => entry.value === kind)!;

  const missing: string[] = [];
  if (!facility && !notListed) missing.push("choose your facility from the registry (or say it is not listed)");
  if (notListed && note.trim().length < 10) missing.push("explain in the note why you are not in the registry list");
  if (kind === "private" && licence.trim().length < 3) missing.push("enter your KMPDC licence number");
  if (!file && !link.trim()) missing.push("attach a file (or paste a link)");
  if (link.trim() && !link.trim().startsWith("https://")) missing.push("the link must start with https://");

  async function send() {
    if (file && file.size > MAX_FILE_BYTES) {
      toast.error("That file is larger than 5 MB. Upload a smaller scan or photo.");
      return;
    }
    setBusy(true);
    try {
      const dataUrl = file ? await readAsDataUrl(file) : undefined;
      submit.mutate({
        institutionId,
        method: selectedKind.method,
        kmhflFacilityId: notListed ? undefined : facility?.id,
        facilityNotListed: notListed || undefined,
        licenceNumber: kind === "private" ? licence.trim() : undefined,
        evidenceUrl: link.trim() || undefined,
        evidenceBase64: dataUrl,
        evidenceFileName: file?.name,
        evidenceContentType: file?.type,
        note: note.trim() || undefined,
      });
    } catch (error) {
      setBusy(false);
      toast.error(error instanceof Error ? error.message : "Could not read the file");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <ShieldCheck className="h-5 w-5" /> Institution verification
          <Badge variant="outline">
            {status === "verified" ? "Verified" : status === "pending_review" ? "Awaiting review" : status === "rejected" ? "Not approved" : "Not verified"}
          </Badge>
        </CardTitle>
        <CardDescription>
          Providers can send link requests to your institution only once it is verified. It takes about two minutes.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        {status === "verified" && data.grandfathered ? (
          <p>Your institution was active before verification was introduced, so it stays verified while a platform administrator reviews it. You may be asked for evidence.</p>
        ) : null}
        {status === "verified" && !data.grandfathered ? <p>Your institution is verified.</p> : null}
        {status === "pending_review" ? (
          <div className="space-y-1">
            <p>Your evidence is with a platform administrator. You will be notified of the decision.</p>
            {data.facility ? <p className="text-slate-600">Facility: {data.facility.name}{data.facility.code ? ` (MFL ${data.facility.code})` : ""}</p> : null}
            {data.verificationEvidenceFileName ? <p className="text-slate-600">File sent: {data.verificationEvidenceFileName}</p> : null}
          </div>
        ) : null}
        {status === "rejected" && data.verificationReviewNote ? (
          <p className="rounded-md border border-amber-300 bg-amber-50 p-3">Not approved: {data.verificationReviewNote}. Fix this and send it again below.</p>
        ) : null}
        {data.facilityClaimedElsewhere && status !== "verified" ? (
          <p className="text-amber-800">Another institution has already been verified for the facility you selected. A platform administrator will need to resolve this before yours can be verified.</p>
        ) : null}

        {canSubmit ? (
          <div className="space-y-5">
            <section className="space-y-2">
              <h3 className="font-medium">1. Find your facility</h3>
              {notListed ? null : <FacilityRegistryPicker selected={facility} onSelect={setFacility} />}
              <label className="flex items-center gap-2 text-slate-700">
                <Checkbox checked={notListed} onCheckedChange={(checked) => { setNotListed(checked === true); if (checked === true) setFacility(null); }} />
                My institution is not in the registry list (for example a training body, or a new facility)
              </label>
            </section>

            <section className="space-y-2">
              <h3 className="font-medium">2. What kind of institution is it?</h3>
              <div className="space-y-1">
                {KINDS.map((entry) => (
                  <label key={entry.value} className="flex items-center gap-2">
                    <input type="radio" name={`kind-${institutionId}`} checked={kind === entry.value} onChange={() => setKind(entry.value)} />
                    {entry.label}
                  </label>
                ))}
              </div>
              <p className="text-slate-600">{selectedKind.help}</p>
              {kind === "private" ? (
                <Input placeholder="KMPDC licence or registration number" value={licence} onChange={(event) => setLicence(event.target.value)} />
              ) : null}
            </section>

            <section className="space-y-2">
              <h3 className="font-medium">3. Attach the evidence</h3>
              <Input
                type="file"
                accept="application/pdf,image/jpeg,image/png,image/webp"
                onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              />
              <p className="text-xs text-slate-500">PDF, JPG or PNG, up to 5 MB. A clear phone photo is fine. Only platform administrators can see it.</p>
              <Input placeholder="…or paste an https:// link instead (optional)" value={link} onChange={(event) => setLink(event.target.value)} />
              <Textarea placeholder={notListed ? "Tell the reviewer why you are not in the registry list (required)" : "Anything the reviewer should know (optional)"} value={note} onChange={(event) => setNote(event.target.value)} />
            </section>

            {missing.length > 0 ? <p className="text-slate-600">Still needed: {missing.join("; ")}.</p> : null}
            <Button size="sm" disabled={busy || missing.length > 0} onClick={() => void send()}>
              {busy ? "Sending…" : "Send for verification"}
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
