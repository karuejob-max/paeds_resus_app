import { useEffect, useMemo, useState, type FormEvent } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertCircle, ArrowRight, CheckCircle2, FileLock2, Upload } from "lucide-react";
import { Link } from "wouter";
import { SearchableDropdown } from "./CadreProgressiveSelector";
import {
  getDefaultLicensingBody,
  getCountryName,
  PROFESSIONAL_COUNTRIES,
} from "@shared/professional-licensing";

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

function completedYearsSince(dateValue: string): number | null {
  if (!dateValue) return null;
  const issued = new Date(`${dateValue}T00:00:00`);
  if (Number.isNaN(issued.getTime())) return null;
  const now = new Date();
  if (issued > now) return null;
  let years = now.getFullYear() - issued.getFullYear();
  const anniversary = new Date(now.getFullYear(), issued.getMonth(), issued.getDate());
  if (anniversary > now) years -= 1;
  return Math.max(0, years);
}

type ProviderCredentialsCardProps = {
  onExperienceDerived?: (years: number) => void;
};

export function ProviderCredentialsCard({ onExperienceDerived }: ProviderCredentialsCardProps) {
  const credentialsQuery =
    trpc.institutionAccountability.getMyCredentials.useQuery();
  const { data: user } = trpc.auth.me.useQuery();
  const submitCredential =
    trpc.institutionAccountability.submitCredential.useMutation({
      onSuccess: async () => {
        setMessage("Credential submitted for verification.");
        setShowNerpNextStep(isRegulatory && isNurseProfile);
        setEvidenceFile(null);
        await credentialsQuery.refetch();
      },
      onError: error => setMessage(error.message),
    });
  const [credentialType, setCredentialType] =
    useState<CredentialType>("regulatory_license");
  const [issuer, setIssuer] = useState("");
  const [issuerTouched, setIssuerTouched] = useState(false);
  const [countryCode, setCountryCode] = useState("");
  const [jurisdiction, setJurisdiction] = useState("");
  const [credentialNumber, setCredentialNumber] = useState("");
  const [issuedAt, setIssuedAt] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [showNerpNextStep, setShowNerpNextStep] = useState(false);

  const isNurseProfile = useMemo(() => {
    const providerType = (user as { providerType?: string | null } | null | undefined)?.providerType;
    const cadre = (user as { cadre?: string | null } | null | undefined)?.cadre ?? "";
    const registeredNurseCadres = new Set([
      "MSN",
      "HND",
      "BSN",
      "BSM",
      "KRCHN",
      "KRNM",
      "KRN",
      "KRM",
      "KECHN",
      "Other RN",
      "Other Diploma RN",
      "Other Certificate RN",
    ]);
    return providerType === "nurse" || registeredNurseCadres.has(cadre);
  }, [user]);

  const countryOptions = useMemo(
    () => PROFESSIONAL_COUNTRIES.map(country => ({ value: country.code, label: country.name })),
    []
  );
  const isRegulatory = credentialType === "regulatory_license";
  const selectedCountryName = getCountryName(countryCode);

  useEffect(() => {
    if (!isRegulatory || !countryCode || issuerTouched) return;
    const defaultIssuer = getDefaultLicensingBody({
      countryCode,
      countryName: selectedCountryName,
      isNurse: isNurseProfile,
    });
    setIssuer(defaultIssuer);
    setJurisdiction(selectedCountryName ?? "");
  }, [countryCode, isNurseProfile, isRegulatory, issuerTouched, selectedCountryName]);

  useEffect(() => {
    const regulatory = (credentialsQuery.data ?? []).find(
      row => row.credentialType === "regulatory_license" && row.sourceType !== "paeds_resus"
    );
    if (!regulatory) return;
    if (!issuer) setIssuer(regulatory.issuer ?? "");
    if (!jurisdiction && regulatory.jurisdiction) {
      setJurisdiction(regulatory.jurisdiction);
      const matchingCountry = PROFESSIONAL_COUNTRIES.find(
        country => country.name.toLowerCase() === regulatory.jurisdiction?.trim().toLowerCase()
      );
      if (matchingCountry) setCountryCode(matchingCountry.code);
    }
  }, [credentialsQuery.data, issuer, jurisdiction]);

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
    setShowNerpNextStep(false);
    if (isRegulatory && !countryCode) {
      setMessage("Select the country where your regulatory licence is held.");
      return;
    }
    try {
      const evidenceBase64 = evidenceFile
        ? await asDataUrl(evidenceFile)
        : undefined;
      await submitCredential.mutateAsync({
        credentialType,
        issuer: issuer.trim() || getDefaultLicensingBody({
          countryCode,
          countryName: selectedCountryName,
          isNurse: isNurseProfile,
        }),
        jurisdiction: selectedCountryName || jurisdiction || undefined,
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
          Regulatory licences and external AHA evidence are private records and
          remain pending until an authorised verifier reviews them. Select the
          country where you are licensed; nurses in Kenya will see Nursing Council
          of Kenya (NCK) prefilled. Use this section for your single regulatory
          Licence number. Issue date and Valid until are optional for NERP, but
          both become mandatory before you can accept or use an ERT clinical
          responsibility. An expired licence blocks ERT duties. To add an AHA
          certificate, choose an External AHA credential in the form below and
          upload the certificate there. Your IERP intern profile remains a separate record.
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
                  Issued {dateLabel(row.issuedAt)} · Valid until {dateLabel(row.expiresAt)}
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
              For a regulatory licence, choose your jurisdiction first. The
              licensing body is suggested from your country and professional
              identity, but you can edit it when your regulator is regional or
              profession-specific. Enter the Licence number once here and upload
              evidence for review. NERP may proceed with missing dates, but ERT
              clinical duties require a verified Licence number, Issue date, and
              Valid until date. Maximum file size is 5 MB; PDF, JPG, and PNG are
              accepted.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-1 text-sm">
              <span className="font-medium">Credential type</span>
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
              <span className="font-medium">
                {isRegulatory
                  ? isNurseProfile
                    ? "Nursing council / licensing body"
                    : "Professional licensing body"
                  : "Issuing organisation"}
              </span>
              <input
                className="w-full rounded-md border bg-background px-3 py-2"
                value={issuer}
                placeholder={isRegulatory ? "Suggested from your country" : "e.g., American Heart Association"}
                onChange={event => {
                  setIssuer(event.target.value);
                  setIssuerTouched(true);
                }}
                required
              />
            </label>
            {isRegulatory ? (
              <label className="space-y-1 text-sm">
                <span className="font-medium">Licence jurisdiction / country *</span>
                <SearchableDropdown
                  value={countryCode}
                  onChange={value => {
                    setCountryCode(value);
                    const countryName = getCountryName(value);
                    setJurisdiction(countryName ?? "");
                  }}
                  options={countryOptions}
                  placeholder="Search and select a country"
                  searchPlaceholder="Type a few letters…"
                  emptyText="No country found."
                  searchAlwaysVisible
                />
              </label>
            ) : (
              <label className="space-y-1 text-sm">
                <span className="font-medium">Jurisdiction (optional)</span>
                <input
                  className="w-full rounded-md border bg-background px-3 py-2"
                  placeholder="Country or regulator jurisdiction"
                  value={jurisdiction}
                  onChange={event => setJurisdiction(event.target.value)}
                />
              </label>
            )}
            <label className="space-y-1 text-sm">
              <span className="font-medium">
                {isRegulatory ? "Licence number *" : "Reference (optional — not a licence number)"}
              </span>
              <input
                className="w-full rounded-md border bg-background px-3 py-2"
                value={credentialNumber}
                onChange={event => setCredentialNumber(event.target.value)}
                placeholder={isRegulatory ? "Enter your regulatory licence number" : "Optional course reference"}
                required={isRegulatory}
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-medium">
                Issue date{isRegulatory ? " (optional for NERP)" : " *"}
              </span>
              <input
                className="w-full rounded-md border bg-background px-3 py-2"
                type="date"
                value={issuedAt}
                onChange={event => {
                  const nextIssuedAt = event.target.value;
                  setIssuedAt(nextIssuedAt);
                  const derivedYears = completedYearsSince(nextIssuedAt);
                  if (derivedYears !== null) onExperienceDerived?.(derivedYears);
                }}
                required={!isRegulatory}
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-medium">
                Valid until{isRegulatory ? " (optional for NERP)" : " *"}
              </span>
              <input
                className="w-full rounded-md border bg-background px-3 py-2"
                type="date"
                value={expiresAt}
                onChange={event => setExpiresAt(event.target.value)}
                required={!isRegulatory}
              />
            </label>
            {isRegulatory ? (
              <p className="md:col-span-2 text-xs text-muted-foreground">
                NERP eligibility checks a verified current NCK licence. ERT
                responsibilities are stricter: dates must be recorded and Valid
                until must still be in the future.
              </p>
            ) : (
              <div className="md:col-span-2 rounded-lg border border-blue-200 bg-blue-50/70 p-3 text-sm dark:border-blue-900/50 dark:bg-blue-950/20">
                <p className="font-semibold text-blue-950 dark:text-blue-100">Adding an AHA certificate</p>
                <p className="mt-1 text-blue-900/80 dark:text-blue-100/80">
                  Choose External AHA BLS, ACLS, PALS, NRP, or other above, enter the issuing organisation and certificate reference, add the issue and Valid until dates, then upload the certificate below for verification.
                </p>
              </div>
            )}
          </div>
          <label className="flex cursor-pointer items-center gap-2 rounded-md border border-dashed p-3 text-sm">
            <Upload className="h-4 w-4" />
            <span className="flex-1">
              {isRegulatory ? "Upload private licence evidence" : "Upload AHA certificate evidence"}
            </span>
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
          {isRegulatory && isNurseProfile ? (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50/70 p-4 dark:border-emerald-900/50 dark:bg-emerald-950/20" role="status">
              <p className="font-semibold text-emerald-950 dark:text-emerald-100">Next step: open your NERP pathway</p>
              <p className="mt-1 text-sm text-emerald-900/80 dark:text-emerald-100/80">
                {showNerpNextStep
                  ? "Your Licence evidence is waiting for verification. Open NERP to see your verification status and the next programme step. Enrollment remains locked until an authorised verifier confirms the required NCK licence."
                  : "After submitting your Licence evidence, open NERP to check your verification status and continue to the programme setup when approved. Enrollment remains locked until an authorised verifier confirms the required NCK licence."}
              </p>
              <Button asChild type="button" variant="cta" className="mt-3">
                <Link href="/programs/nerp-acls">
                  Check NERP and continue <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          ) : null}
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
                    {row.credentialNumber
                      ? ` · ${row.credentialType === "regulatory_license" ? "Licence no." : "Reference"}: ${row.credentialNumber}`
                      : ""} · Valid until {dateLabel(row.expiresAt)}
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
