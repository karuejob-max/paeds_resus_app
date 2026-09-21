import { useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  FileText,
  Loader2,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

type IerpDesignation = "noi" | "coi_bsc" | "coi_diploma" | "moi";

const DESIGNATION_LABELS: Record<IerpDesignation, string> = {
  noi: "NOI (Nursing Officer Intern)",
  coi_bsc: "COI (BSc Clinical Officer Intern)",
  coi_diploma: "COI (Diploma Clinical Officer Intern)",
  moi: "MOI (Medical Officer Intern)",
};

function dateInputValue(value: Date | string | null | undefined) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

export function IerpInternProfileCard({
  compact = false,
}: {
  compact?: boolean;
}) {
  const profileQuery = trpc.ierp.getMyInternProfile.useQuery(undefined, {
    retry: false,
  });
  const evidenceQuery = trpc.ierp.getMyInternProfileEvidenceUrl.useQuery(
    undefined,
    {
      enabled: Boolean(profileQuery.data),
      retry: false,
    }
  );
  const utils = trpc.useUtils();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [designation, setDesignation] = useState<IerpDesignation>("noi");
  const [officialLetterReferenceNumber, setOfficialLetterReferenceNumber] =
    useState("");
  const [effectiveCommencementDate, setEffectiveCommencementDate] =
    useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const profile = profileQuery.data;
    if (!profile) return;
    setDesignation(profile.designation);
    setOfficialLetterReferenceNumber(profile.officialLetterReferenceNumber);
    setEffectiveCommencementDate(
      dateInputValue(profile.effectiveCommencementDate)
    );
  }, [profileQuery.data]);

  const submit = trpc.ierp.submitInternProfile.useMutation({
    onSuccess: async () => {
      toast.success(
        "Intern profile and deployment letter submitted for review."
      );
      setFile(null);
      setError(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      await Promise.all([
        utils.ierp.getMyInternProfile.invalidate(),
        utils.auth.me.invalidate(),
        utils.provider.getProfile.invalidate(),
      ]);
    },
    onError: mutationError => setError(mutationError.message),
  });

  const chooseFile = (candidate: File | undefined) => {
    setError(null);
    if (!candidate) return;
    if (candidate.size === 0 || candidate.size > 10 * 1024 * 1024) {
      setError(
        "The MoH deployment/posting letter must be between 1 byte and 10 MB."
      );
      return;
    }
    if (
      !(
        ["application/pdf", "image/jpeg", "image/png"] as readonly string[]
      ).includes(candidate.type)
    ) {
      setError(
        "Upload the MoH deployment/posting letter as a PDF, JPG, or PNG."
      );
      return;
    }
    setFile(candidate);
  };

  const save = () => {
    setError(null);
    if (!officialLetterReferenceNumber.trim()) {
      setError("Enter the official internship letter reference number.");
      return;
    }
    if (!effectiveCommencementDate) {
      setError("Enter the effective internship commencement date.");
      return;
    }
    if (!file && !profileQuery.data) {
      setError("Upload the MoH deployment/posting letter.");
      return;
    }
    if (!file) {
      setError(
        "Upload the replacement MoH deployment/posting letter before resubmitting."
      );
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") {
        setError("Could not read that document.");
        return;
      }
      submit.mutate({
        designation,
        officialLetterReferenceNumber: officialLetterReferenceNumber.trim(),
        effectiveCommencementDate,
        deploymentLetterFileName: file.name,
        deploymentLetterContentType: file.type as
          | "application/pdf"
          | "image/jpeg"
          | "image/png",
        deploymentLetterDataBase64: reader.result,
      });
    };
    reader.onerror = () => setError("Could not read that document.");
    reader.readAsDataURL(file);
  };

  const profile = profileQuery.data;
  const statusLabel =
    profile?.status === "verified"
      ? "Verified"
      : profile?.status === "pending"
        ? "Submitted — awaiting review"
        : profile?.status === "rejected"
          ? "Needs correction"
          : profile?.status === "revoked"
            ? "Revoked"
            : "Not registered";
  const statusVariant =
    profile?.status === "verified"
      ? "default"
      : profile?.status === "pending"
        ? "secondary"
        : "destructive";

  return (
    <Card
      className={
        compact
          ? "border-indigo-200 bg-indigo-50/30"
          : "border-indigo-200 bg-indigo-50/20"
      }
    >
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <FileText className="h-5 w-5 text-indigo-700" /> Intern profile for
          IERP
        </CardTitle>
        <CardDescription>
          Register your intern designation and submit the MoH deployment/posting
          letter before starting the Intern Emergency Readiness Program. The
          letter is stored privately for programme review.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {profile ? (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-background/70 p-3">
            <div>
              <p className="text-sm font-medium">Current registration</p>
              <p className="text-xs text-muted-foreground">
                {DESIGNATION_LABELS[profile.designation]} ·{" "}
                {profile.deploymentLetterFileName}
              </p>
              {evidenceQuery.data ? (
                <a
                  className="mt-1 inline-block text-xs font-medium text-indigo-700 underline"
                  href={evidenceQuery.data.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  View submitted letter
                </a>
              ) : null}
            </div>
            <Badge variant={statusVariant}>{statusLabel}</Badge>
          </div>
        ) : null}
        {profile?.status === "pending" ? (
          <div className="flex items-start gap-2 rounded-lg border border-indigo-200 bg-indigo-50 p-3 text-sm text-indigo-950">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              Your intern evidence is under review. You can continue to the
              IERP payment and the next available learning step while review is
              pending. If the evidence is rejected or revoked, access will pause
              and the reviewer’s reason will be shown here.
            </p>
          </div>
        ) : null}
        {profile?.status === "rejected" || profile?.status === "revoked" ? (
          <div className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              {profile.reviewReason ||
                "Please correct the intern evidence and submit it again."}
            </p>
          </div>
        ) : null}
        {profile?.status === "verified" ? (
          <div className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              Your intern profile is verified. You can continue with the IERP
              pathway.
            </p>
          </div>
        ) : null}
        {profileQuery.isError ? (
          <p className="text-sm text-amber-700">
            Intern profile data is temporarily unavailable. Please try again.
          </p>
        ) : null}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="ierp-intern-designation">Intern designation</Label>
            <Select
              value={designation}
              onValueChange={value => setDesignation(value as IerpDesignation)}
            >
              <SelectTrigger id="ierp-intern-designation">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(
                  Object.entries(DESIGNATION_LABELS) as Array<
                    [IerpDesignation, string]
                  >
                ).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ierp-letter-reference">
              Official internship letter reference number
            </Label>
            <Input
              id="ierp-letter-reference"
              value={officialLetterReferenceNumber}
              onChange={event =>
                setOfficialLetterReferenceNumber(event.target.value)
              }
              placeholder="e.g. MoH/INT/2026/00123"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ierp-commencement-date">
              Effective commencement date
            </Label>
            <Input
              id="ierp-commencement-date"
              type="date"
              value={effectiveCommencementDate}
              onChange={event =>
                setEffectiveCommencementDate(event.target.value)
              }
            />
            <p className="text-xs text-muted-foreground">
              This date determines the August–November deferred-access window.
            </p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ierp-deployment-letter">
              MoH deployment/posting letter
            </Label>
            <Input
              ref={fileInputRef}
              id="ierp-deployment-letter"
              type="file"
              accept="application/pdf,image/jpeg,image/png"
              onChange={event => chooseFile(event.target.files?.[0])}
            />
            <p className="text-xs text-muted-foreground">
              PDF, JPG, or PNG; maximum 10 MB.
              {file ? ` Selected: ${file.name}` : ""}
            </p>
          </div>
        </div>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <Button
          type="button"
          onClick={save}
          disabled={submit.isPending || profileQuery.isLoading}
        >
          {submit.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Upload className="mr-2 h-4 w-4" />
          )}
          {profile ? "Update intern profile" : "Submit intern profile"}
        </Button>
      </CardContent>
    </Card>
  );
}
