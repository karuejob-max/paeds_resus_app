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
import { AlertCircle, AlertTriangle, CheckCircle2, Clock, FileLock2, Upload } from "lucide-react";
import { toast } from "sonner";
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

function credentialLabel(value: string): string {
  if (value === "paeds_resus_bls_provider" || value === "paeds_resus_bls_cognitive" || value === "paeds_resus_bls_simulation") return "Paeds Resus BLS Provider";
  if (value.startsWith("paeds_resus_")) return `Paeds Resus ${value.replace("paeds_resus_", "").replaceAll("_", " ").replace(/\b\w/g, char => char.toUpperCase())}`;
  return value.replaceAll("_", " ").replace(/\b\w/g, char => char.toUpperCase());
}

const LICENSED_IDENTITIES = new Set(["nurse", "doctor", "pharmacist", "paramedic", "lab_tech", "respiratory_therapist", "midwife"]);
const KENYA_CADRE_SUGGESTIONS = ["KRCHN", "KRN", "KRM", "KRPCCN", "Clinical Officer", "Medical Officer", "Pharmacist", "Pharmaceutical Technologist", "Laboratory Technologist"];
const DAY_MS = 24 * 60 * 60 * 1000;

type SubmittedRow = {
  id: number;
  credentialType: string;
  displayStatus: string;
  issuedAt: string | Date | null;
  expiresAt: string | Date | null;
  reviewReason?: string | null;
  createdAt?: string | Date | null;
};

/** One plain sentence about where the learner's licence stands and what to do next. */
function LicenceStatusBanner({ licence, renewalPending }: { licence: SubmittedRow | undefined; renewalPending?: SubmittedRow }) {
  if (licence && renewalPending && licence.displayStatus !== "pending") {
    return (
      <div className="flex items-start gap-3 rounded-lg border border-blue-300 bg-blue-50 p-4 text-sm">
        <Clock className="mt-0.5 h-5 w-5 shrink-0 text-blue-700" />
        <div>
          <p className="font-semibold">Your renewal is waiting for review</p>
          <p className="mt-1 text-muted-foreground">Submitted {dateLabel(renewalPending.createdAt)}. Your current licence stays valid until {dateLabel(licence.expiresAt)}. You will be notified when the renewal is decided.</p>
        </div>
      </div>
    );
  }
  if (!licence) {
    return (
      <div className="flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
        <div>
          <p className="font-semibold">You have not added your professional licence yet</p>
          <p className="mt-1 text-muted-foreground">Add it once and we will track the renewal date for you. It unlocks emergency-response roles and shows you as duty-ready.</p>
        </div>
      </div>
    );
  }
  const expires = licence.expiresAt ? new Date(licence.expiresAt) : null;
  const daysLeft = expires ? Math.ceil((expires.getTime() - Date.now()) / DAY_MS) : null;
  switch (licence.displayStatus) {
    case "pending":
      return (
        <div className="flex items-start gap-3 rounded-lg border border-blue-300 bg-blue-50 p-4 text-sm">
          <Clock className="mt-0.5 h-5 w-5 shrink-0 text-blue-700" />
          <div>
            <p className="font-semibold">Your licence is waiting for review</p>
            <p className="mt-1 text-muted-foreground">Submitted {dateLabel(licence.createdAt)}. You do not need to do anything else. You will get a notification and an email when it is decided.</p>
          </div>
        </div>
      );
    case "rejected":
      return (
        <div className="flex items-start gap-3 rounded-lg border border-red-300 bg-red-50 p-4 text-sm">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-700" />
          <div>
            <p className="font-semibold">Your licence was not accepted</p>
            <p className="mt-1">{licence.reviewReason ? `Reviewer's note: ${licence.reviewReason}` : "Open the form below and submit it again."}</p>
            <p className="mt-1 text-muted-foreground">Correct that and submit it again below.</p>
          </div>
        </div>
      );
    case "revoked":
      return (
        <div className="flex items-start gap-3 rounded-lg border border-red-300 bg-red-50 p-4 text-sm">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-700" />
          <div>
            <p className="font-semibold">Your licence was withdrawn</p>
            <p className="mt-1">{licence.reviewReason ? `Reason: ${licence.reviewReason}` : "Submit your current licence below."}</p>
          </div>
        </div>
      );
    case "expired":
      return (
        <div className="flex items-start gap-3 rounded-lg border border-red-300 bg-red-50 p-4 text-sm">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-700" />
          <div>
            <p className="font-semibold">Your licence expired on {dateLabel(licence.expiresAt)}</p>
            <p className="mt-1 text-muted-foreground">Submit your renewed licence below. Until it is verified you cannot take clinical emergency-response duties.</p>
          </div>
        </div>
      );
    case "expiring":
      return (
        <div className="flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
          <div>
            <p className="font-semibold">Your licence expires in {daysLeft} {daysLeft === 1 ? "day" : "days"} ({dateLabel(licence.expiresAt)})</p>
            <p className="mt-1 text-muted-foreground">Add your renewed licence now. The current one stays valid while the new one is reviewed.</p>
          </div>
        </div>
      );
    default:
      return (
        <div className="flex items-start gap-3 rounded-lg border border-emerald-300 bg-emerald-50 p-4 text-sm">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />
          <div>
            <p className="font-semibold">Your licence is verified</p>
            <p className="mt-1 text-muted-foreground">Valid until {dateLabel(licence.expiresAt)}. We will remind you before it expires.</p>
          </div>
        </div>
      );
  }
}

export function ProviderCredentialsCard() {
  const credentialsQuery = trpc.institutionAccountability.getMyCredentials.useQuery();
  const { data: user } = trpc.auth.me.useQuery();
  const [credentialType, setCredentialType] = useState<CredentialType>("regulatory_license");
  const [issuer, setIssuer] = useState("");
  const [issuerTouched, setIssuerTouched] = useState(false);
  const [editIssuer, setEditIssuer] = useState(false);
  const [countryCode, setCountryCode] = useState("KE");
  const [jurisdiction, setJurisdiction] = useState("Kenya");
  const [cadre, setCadre] = useState("");
  const [credentialNumber, setCredentialNumber] = useState("");
  const [issuedAt, setIssuedAt] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [showForm, setShowForm] = useState<boolean | null>(null);

  const submitCredential = trpc.institutionAccountability.submitCredential.useMutation({
    onSuccess: async () => {
      toast.success("Submitted. You will be notified when it has been reviewed.");
      setMessage("");
      setEvidenceFile(null);
      setCredentialNumber("");
      setIssuedAt("");
      setExpiresAt("");
      setShowForm(false);
      await credentialsQuery.refetch();
    },
    onError: error => setMessage(error.message),
  });

  const providerType = (user as { providerType?: string | null } | null | undefined)?.providerType ?? null;
  const isNurseProfile = useMemo(() => {
    const profileCadre = (user as { cadre?: string | null } | null | undefined)?.cadre ?? "";
    const registeredNurseCadres = new Set(["MSN", "HND", "BSN", "BSM", "KRCHN", "KRNM", "KRN", "KRM", "KECHN", "Other RN", "Other Diploma RN", "Other Certificate RN"]);
    return providerType === "nurse" || registeredNurseCadres.has(profileCadre);
  }, [providerType, user]);
  const hasLicensedIdentity = isNurseProfile || (providerType != null && LICENSED_IDENTITIES.has(providerType));

  const countryOptions = useMemo(() => PROFESSIONAL_COUNTRIES.map(country => ({ value: country.code, label: country.name })), []);
  const isRegulatory = credentialType === "regulatory_license";
  const selectedCountryName = getCountryName(countryCode);

  useEffect(() => {
    if (!isRegulatory || !countryCode || issuerTouched) return;
    setIssuer(getDefaultLicensingBody({ countryCode, countryName: selectedCountryName, isNurse: isNurseProfile, providerType }));
    setJurisdiction(selectedCountryName ?? "");
  }, [countryCode, isNurseProfile, isRegulatory, issuerTouched, providerType, selectedCountryName]);

  useEffect(() => {
    if (cadre) return;
    const profileCadre = (user as { cadre?: string | null } | null | undefined)?.cadre?.trim();
    if (profileCadre) setCadre(profileCadre);
  }, [cadre, user]);

  const submitted = useMemo(
    () => (credentialsQuery.data ?? []).filter(row => row.sourceType !== "paeds_resus" && row.displayStatus !== "superseded"),
    [credentialsQuery.data],
  );
  const derived = useMemo(() => (credentialsQuery.data ?? []).filter(row => row.sourceType === "paeds_resus"), [credentialsQuery.data]);
  const regulatoryRows = submitted.filter(row => row.credentialType === "regulatory_license");
  const renewalPending = regulatoryRows.find(row => row.displayStatus === "pending");
  // The licence in force wins over a renewal waiting for review; otherwise the newest record.
  const licence = regulatoryRows.find(row => ["current", "expiring", "expired"].includes(row.displayStatus)) ?? regulatoryRows[0];
  const derivedSummary = useMemo(() => {
    const grouped = new Map<string, (typeof derived)[number]>();
    for (const row of derived) {
      const key = row.credentialType.startsWith("paeds_resus_bls_") ? "paeds_resus_bls" : row.credentialType;
      const existing = grouped.get(key);
      const preferred = row.credentialType.endsWith("_provider") || !existing || existing.credentialType.endsWith("_cognitive") || existing.credentialType.endsWith("_simulation");
      if (preferred) grouped.set(key, row);
    }
    return Array.from(grouped.values());
  }, [derived]);

  // Open the form straight away when there is something to do; keep it tucked away when the licence is fine.
  const needsLicence = !licence || (["rejected", "revoked", "expired"].includes(licence.displayStatus) && !renewalPending);
  const identityBlocked = isRegulatory && !hasLicensedIdentity && providerType == null;
  const formOpen = !identityBlocked && (showForm ?? (needsLicence && credentialType === "regulatory_license"));

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    const missing = [
      isRegulatory && !countryCode && "country",
      !issuer.trim() && "licensing body",
      isRegulatory && !cadre.trim() && "cadre (for example KRCHN)",
      isRegulatory && !credentialNumber.trim() && "licence number",
      !issuedAt && (isRegulatory ? "date first licensed" : "issue date"),
      !expiresAt && "valid-until date",
      !evidenceFile && "photo or PDF of the licence",
    ].filter(Boolean) as string[];
    if (missing.length) {
      setMessage(`Still needed: ${missing.join(", ")}.`);
      return;
    }
    if (issuedAt >= expiresAt) {
      setMessage("The valid-until date must be after the date first licensed.");
      return;
    }
    if (new Date(`${issuedAt}T00:00:00`) > new Date()) {
      setMessage("The date first licensed cannot be in the future.");
      return;
    }
    if (expiresAt && new Date(`${expiresAt}T23:59:59`) < new Date()) {
      setMessage("That licence has already expired. Submit the renewed licence instead.");
      return;
    }
    if (evidenceFile) {
      if (!["application/pdf", "image/jpeg", "image/png"].includes(evidenceFile.type)) {
        setMessage("Use a PDF, JPG or PNG file. Photos from your phone camera are fine.");
        return;
      }
      if (evidenceFile.size > 5 * 1024 * 1024) {
        setMessage("That file is over 5 MB. Take the photo again at a lower quality or scan it as a PDF.");
        return;
      }
    }
    try {
      const evidenceBase64 = evidenceFile ? await asDataUrl(evidenceFile) : undefined;
      await submitCredential.mutateAsync({
        credentialType,
        issuer: issuer.trim(),
        jurisdiction: selectedCountryName || jurisdiction || undefined,
        cadre: cadre.trim() || undefined,
        credentialNumber: credentialNumber.trim() || undefined,
        issuedAt: issuedAt || undefined,
        expiresAt: expiresAt || undefined,
        evidenceBase64,
        evidenceFileName: evidenceFile?.name,
        evidenceContentType: evidenceFile?.type as "application/pdf" | "image/jpeg" | "image/png" | undefined,
      });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Submission failed. Please try again.");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileLock2 className="h-5 w-5 text-primary" /> Your professional licence
        </CardTitle>
        <CardDescription>
          Your licence and certificates are private. Only authorised reviewers can see them. Keeping a verified, current licence on file unlocks emergency-response roles.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {identityBlocked ? null : <LicenceStatusBanner licence={licence} renewalPending={renewalPending} />}

        {identityBlocked ? (
          <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm">
            <p className="font-semibold">First tell us your professional role</p>
            <p className="mt-1 text-muted-foreground">We use it to suggest your licensing body and to check that a licence applies to you.</p>
            <a href="#identity" className="mt-2 inline-block font-medium text-primary underline">Set my professional role</a>
          </div>
        ) : null}

        {!formOpen ? (
          <div className="flex flex-wrap gap-2">
            {identityBlocked ? null : (
              <Button type="button" variant="outline" onClick={() => { setCredentialType("regulatory_license"); setShowForm(true); }}>
                {licence ? "Renew or replace my licence" : "Add my licence"}
              </Button>
            )}
            <Button type="button" variant="ghost" onClick={() => { setCredentialType("external_aha_bls"); setIssuerTouched(false); setIssuer(""); setShowForm(true); }}>
              Add an AHA certificate
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border p-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-semibold">{isRegulatory ? "Add your licence" : "Add an AHA certificate"}</h3>
              <Button type="button" size="sm" variant="ghost" onClick={() => { setShowForm(false); setMessage(""); setCredentialType("regulatory_license"); }}>
                Cancel
              </Button>
            </div>

            {!isRegulatory ? (
              <label className="block space-y-1 text-sm">
                <span className="font-medium">Which certificate?</span>
                <select className="w-full rounded-md border bg-background px-3 py-2" value={credentialType} onChange={event => setCredentialType(event.target.value as CredentialType)}>
                  {externalTypes.map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </label>
            ) : null}

            <div className="grid gap-4 md:grid-cols-2">
              {isRegulatory ? (
                <>
                  <label className="space-y-1 text-sm">
                    <span className="font-medium">Country where you are licensed *</span>
                    <SearchableDropdown
                      value={countryCode}
                      onChange={value => { setCountryCode(value); setJurisdiction(getCountryName(value) ?? ""); setIssuerTouched(false); }}
                      options={countryOptions}
                      placeholder="Search and select a country"
                      searchPlaceholder="Type a few letters…"
                      emptyText="No country found."
                      selectedStateLabel="Country selected"
                      emptySelectionLabel="No country selected"
                      searchAlwaysVisible
                    />
                  </label>
                  <div className="space-y-1 text-sm">
                    <span className="font-medium">Licensing body</span>
                    {editIssuer ? (
                      <input className="w-full rounded-md border bg-background px-3 py-2" value={issuer} onChange={event => { setIssuer(event.target.value); setIssuerTouched(true); }} />
                    ) : (
                      <p className="rounded-md border bg-muted/30 px-3 py-2">
                        {issuer || "Choose your country first"}{" "}
                        <button type="button" className="ml-1 text-xs font-medium text-primary underline" onClick={() => setEditIssuer(true)}>Change</button>
                      </p>
                    )}
                  </div>
                  <label className="space-y-1 text-sm">
                    <span className="font-medium">Cadre *</span>
                    <input className="w-full rounded-md border bg-background px-3 py-2" list="licence-cadres" value={cadre} onChange={event => setCadre(event.target.value)} placeholder="Start typing, for example KRCHN" />
                    <datalist id="licence-cadres">
                      {KENYA_CADRE_SUGGESTIONS.map(option => <option key={option} value={option} />)}
                    </datalist>
                  </label>
                  <label className="space-y-1 text-sm">
                    <span className="font-medium">Licence number *</span>
                    <input className="w-full rounded-md border bg-background px-3 py-2" value={credentialNumber} onChange={event => setCredentialNumber(event.target.value)} placeholder="As printed on your current licence" />
                    <span className="block text-xs text-muted-foreground">Use the number labelled “Licence number”, not your index, registration or degree number.</span>
                  </label>
                </>
              ) : (
                <label className="space-y-1 text-sm md:col-span-2">
                  <span className="font-medium">Issuing organisation *</span>
                  <input className="w-full rounded-md border bg-background px-3 py-2" value={issuer} onChange={event => { setIssuer(event.target.value); setIssuerTouched(true); }} placeholder="e.g., American Heart Association" />
                </label>
              )}
              <label className="space-y-1 text-sm">
                <span className="font-medium">{isRegulatory ? "Date first licensed *" : "Issue date *"}</span>
                <input className="w-full rounded-md border bg-background px-3 py-2" type="date" value={issuedAt} onChange={event => setIssuedAt(event.target.value)} />
                {isRegulatory ? <span className="block text-xs text-muted-foreground">Not the latest renewal. If you cannot find it, use the earliest date on your documents. A reviewer can correct it.</span> : null}
              </label>
              <label className="space-y-1 text-sm">
                <span className="font-medium">Valid until *</span>
                <input className="w-full rounded-md border bg-background px-3 py-2" type="date" value={expiresAt} onChange={event => setExpiresAt(event.target.value)} />
              </label>
            </div>

            <label className="flex cursor-pointer flex-wrap items-center gap-2 rounded-md border border-dashed p-3 text-sm">
              <Upload className="h-4 w-4" />
              <span className="flex-1">Photo or PDF of your {isRegulatory ? "licence" : "certificate"} *</span>
              <input className="max-w-[240px] text-xs" type="file" accept="application/pdf,image/jpeg,image/png" onChange={event => setEvidenceFile(event.target.files?.[0] ?? null)} />
              <span className="w-full text-xs text-muted-foreground">{evidenceFile?.name ?? "PDF, JPG or PNG, up to 5 MB. A clear phone photo is fine."}</span>
            </label>

            {message ? (
              <p className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  {message}
                  {message.toLowerCase().includes("professional identity") ? <> <a href="#identity" className="font-medium underline">Set my professional role</a></> : null}
                </span>
              </p>
            ) : null}
            <Button type="submit" disabled={submitCredential.isPending}>
              {submitCredential.isPending ? "Uploading…" : "Submit for review"}
            </Button>
          </form>
        )}

        {submitted.length ? (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold">Your submissions</h3>
            {submitted.map(row => (
              <div key={row.id} className="rounded-lg border p-3 text-sm">
                <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-medium">{row.sourceLabel}</p>
                    <p className="text-xs text-muted-foreground">
                      {row.issuer}
                      {row.credentialNumber ? ` · ${row.credentialType === "regulatory_license" ? "Licence no." : "Reference"}: ${row.credentialNumber}` : ""} · Valid until {dateLabel(row.expiresAt)}
                    </p>
                  </div>
                  <span className="rounded-full bg-muted px-2 py-1 text-xs capitalize">{statusLabel(row.displayStatus)}</span>
                </div>
                {row.reviewReason && (row.displayStatus === "rejected" || row.displayStatus === "revoked") ? (
                  <p className="mt-2 rounded-md bg-red-50 px-3 py-2 text-xs text-red-800">Reviewer's note: {row.reviewReason}</p>
                ) : null}
              </div>
            ))}
          </div>
        ) : null}

        {derivedSummary.length ? (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold">Paeds Resus certificates you have earned</h3>
            <div className="grid gap-3 md:grid-cols-2">
              {derivedSummary.map(row => (
                <details key={row.id} className="rounded-lg border bg-muted/20 p-3">
                  <summary className="cursor-pointer list-none">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold">{credentialLabel(row.credentialType)}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{row.sourceLabel}</p>
                      </div>
                      <span className="text-xs font-medium text-primary">View details</span>
                    </div>
                    <p className="mt-2 flex items-center gap-1 text-xs capitalize"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> {statusLabel(row.displayStatus)}</p>
                  </summary>
                  <div className="mt-3 border-t pt-3 text-xs text-muted-foreground">
                    <p>Issued {dateLabel(row.issuedAt)} · Valid until {dateLabel(row.expiresAt)}</p>
                  </div>
                </details>
              ))}
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
