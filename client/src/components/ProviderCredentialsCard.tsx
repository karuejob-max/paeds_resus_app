import { useMemo, useState, type FormEvent } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertCircle, CheckCircle2, FileLock2, Upload } from "lucide-react";

const externalTypes = [
  ["external_aha_bls", "External AHA BLS"],
  ["external_aha_acls", "External AHA ACLS"],
  ["external_aha_pals", "External AHA PALS"],
  ["external_aha_nrp", "External AHA NRP"],
  ["external_aha_other", "External AHA other"],
] as const;

type CredentialType = "regulatory_license" | (typeof externalTypes)[number][0];

function asDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () =>
      reject(new Error("Could not read the evidence file."));
    reader.readAsDataURL(file);
  });
}

function dateLabel(value: string | Date | null | undefined): string {
  if (!value) return "Not recorded";
  return new Date(value).toLocaleDateString();
}

function statusLabel(value: string): string {
  return value.replaceAll("_", " ");
}

export function ProviderCredentialsCard() {
  const credentialsQuery =
    trpc.institutionAccountability.getMyCredentials.useQuery();
  const submitCredential =
    trpc.institutionAccountability.submitCredential.useMutation({
      onSuccess: async () => {
        setMessage("Credential submitted for verification.");
        setEvidenceFile(null);
        await credentialsQuery.refetch();
      },
      onError: error => setMessage(error.message),
    });
  const [credentialType, setCredentialType] =
    useState<CredentialType>("regulatory_license");
  const [issuer, setIssuer] = useState("Regulatory authority");
  const [jurisdiction, setJurisdiction] = useState("");
  const [credentialNumber, setCredentialNumber] = useState("");
  const [issuedAt, setIssuedAt] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");

  const derived = useMemo(
    () =>
      (credentialsQuery.data ?? []).filter(
        row => row.sourceType === "paeds_resus"
      ),
    [credentialsQuery.data]
  );
  const submitted = useMemo(
    () =>
      (credentialsQuery.data ?? []).filter(
        row => row.sourceType !== "paeds_resus"
      ),
    [credentialsQuery.data]
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    try {
      const evidenceBase64 = evidenceFile
        ? await asDataUrl(evidenceFile)
        : undefined;
      await submitCredential.mutateAsync({
        credentialType,
        issuer,
        jurisdiction: jurisdiction || undefined,
        credentialNumber: credentialNumber || undefined,
        issuedAt: issuedAt || undefined,
        expiresAt: expiresAt || undefined,
        evidenceBase64,
        evidenceFileName: evidenceFile?.name,
        evidenceContentType: evidenceFile?.type as
          | "application/pdf"
          | "image/jpeg"
          | "image/png"
          | undefined,
      });
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Credential submission failed."
      );
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileLock2 className="h-5 w-5 text-primary" /> Professional
          credentials
        </CardTitle>
        <CardDescription>
          Licences and external AHA certificates are private evidence records.
          They remain pending until an authorised verifier reviews them. To join
          NERP, submit your Nursing Council of Kenya licence number and licence
          evidence here; the licence must be verified and current before NERP
          access is granted. External BLS or ACLS evidence supports review, while
          Paeds Resus achievements below are filled automatically from verified
          learning records.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-3 md:grid-cols-3">
          {derived.length ? (
            derived.map(row => (
              <div key={row.id} className="rounded-lg border bg-muted/20 p-3">
                <p className="text-sm font-semibold">
                  {statusLabel(row.credentialType)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {row.sourceLabel}
                </p>
                <p className="mt-2 flex items-center gap-1 text-xs capitalize">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />{" "}
                  {statusLabel(row.displayStatus)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Issued {dateLabel(row.issuedAt)} · Expires{" "}
                  {dateLabel(row.expiresAt)}
                </p>
              </div>
            ))
          ) : (
            <div className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground md:col-span-3">
              No Paeds Resus Life Support competency has been derived yet.
              Complete the relevant learning and competency gates in the
              Learning Portal.
            </div>
          )}
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-lg border p-4"
        >
          <div>
            <h3 className="font-semibold">
              Add or renew a professional credential
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              For NERP, choose Regulatory licence, enter issuer “Nursing Council
              of Kenya” (or NCK), and enter your licence number. Upload the licence
              evidence for review. A verified licence establishes professional
              eligibility; it does not by itself create NERP Phase 2 or Phase 3
              completion. Maximum
              file size is 5 MB; PDF, JPG, and PNG are accepted.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-1 text-sm">
              <span className="font-medium">Credential</span>
              <select
                className="w-full rounded-md border bg-background px-3 py-2"
                value={credentialType}
                onChange={event =>
                  setCredentialType(event.target.value as CredentialType)
                }
              >
                <option value="regulatory_license">Regulatory licence</option>
                {externalTypes.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-medium">Issuer / regulator</span>
              <input
                className="w-full rounded-md border bg-background px-3 py-2"
                value={issuer}
                onChange={event => setIssuer(event.target.value)}
                required
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-medium">Jurisdiction</span>
              <input
                className="w-full rounded-md border bg-background px-3 py-2"
                placeholder="Country or regulator jurisdiction"
                value={jurisdiction}
                onChange={event => setJurisdiction(event.target.value)}
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-medium">Licence/certificate number</span>
              <input
                className="w-full rounded-md border bg-background px-3 py-2"
                value={credentialNumber}
                onChange={event => setCredentialNumber(event.target.value)}
                required={credentialType === "regulatory_license"}
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-medium">Issue date</span>
              <input
                className="w-full rounded-md border bg-background px-3 py-2"
                type="date"
                value={issuedAt}
                onChange={event => setIssuedAt(event.target.value)}
                required={credentialType !== "regulatory_license"}
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-medium">Expiry date</span>
              <input
                className="w-full rounded-md border bg-background px-3 py-2"
                type="date"
                value={expiresAt}
                onChange={event => setExpiresAt(event.target.value)}
                required
              />
            </label>
          </div>
          <label className="flex cursor-pointer items-center gap-2 rounded-md border border-dashed p-3 text-sm">
            <Upload className="h-4 w-4" />
            <span className="flex-1">Upload private evidence</span>
            <input
              className="max-w-[220px] text-xs"
              type="file"
              accept="application/pdf,image/jpeg,image/png"
              onChange={event =>
                setEvidenceFile(event.target.files?.[0] ?? null)
              }
              required
            />
            <span className="text-xs text-muted-foreground">
              {evidenceFile?.name ?? "No file selected"}
            </span>
          </label>
          {message ? (
            <p className="flex items-start gap-2 text-sm text-muted-foreground">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              {message}
            </p>
          ) : null}
          <Button type="submit" disabled={submitCredential.isPending}>
            {submitCredential.isPending
              ? "Uploading…"
              : "Submit for verification"}
          </Button>
        </form>

        <div className="space-y-2">
          <h3 className="font-semibold">Submitted credentials</h3>
          {submitted.length ? (
            submitted.map(row => (
              <div
                key={row.id}
                className="flex flex-col gap-1 rounded-lg border p-3 text-sm md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <p className="font-medium">{row.sourceLabel}</p>
                  <p className="text-xs text-muted-foreground">
                    {row.issuer}
                    {row.credentialNumber ? ` · ${row.credentialNumber}` : ""} ·
                    Expires {dateLabel(row.expiresAt)}
                  </p>
                </div>
                <span className="rounded-full bg-muted px-2 py-1 text-xs capitalize">
                  {statusLabel(row.displayStatus)}
                </span>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">
              No regulatory or external AHA credentials submitted.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
