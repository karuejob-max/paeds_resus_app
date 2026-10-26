import { useState } from "react";
import { KeyRound } from "lucide-react";
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
import { Label } from "@/components/ui/label";

const courses = [
  ["bls", "BLS"],
  ["acls", "ACLS"],
  ["pals", "PALS"],
  ["nrp", "NRP"],
] as const;

type Course = (typeof courses)[number][0];
type CodePreview = {
  institutionId: number;
  companyName: string | null;
  departmentId: number | null;
  programType: string;
  expiresAt: Date;
  remainingRedemptions: number;
};

export function IlsAhaAccessCodeCard() {
  const [accessCode, setAccessCode] = useState("");
  const [programType, setProgramType] = useState<Course>("bls");
  const [preview, setPreview] = useState<CodePreview | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const utils = trpc.useUtils();
  const previewQuery =
    trpc.institutionalLifeSupport.previewInstitutionalAhaAccessCode.useQuery(
      { accessCode: accessCode.trim(), programType },
      { enabled: false, retry: false }
    );
  const redeem =
    trpc.institutionalLifeSupport.redeemInstitutionalAhaAccessCode.useMutation({
      onSuccess: result => {
        setMessage(result.message);
        setError(null);
        setPreview(null);
        setAccessCode("");
        void utils.institutionalLifeSupport.getMyEnrollment.invalidate();
      },
      onError: err => {
        setError(err.message);
        setMessage(null);
      },
    });

  async function reviewCode() {
    setMessage(null);
    setError(null);
    const result = await previewQuery.refetch();
    if (result.error) {
      setError(result.error.message);
      setPreview(null);
      return;
    }
    setPreview(result.data ?? null);
  }

  return (
    <Card className="border-sky-200 bg-sky-50/40 dark:border-sky-900 dark:bg-sky-950/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <KeyRound className="h-4 w-4 text-sky-700" />
          Have an institution course code?
        </CardTitle>
        <CardDescription>
          Review the sponsoring institution, course, scope, expiry, and
          remaining seats before you accept access. A code never grants clinical
          role authority.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-[1fr_180px_auto] sm:items-end">
          <div className="space-y-2">
            <Label htmlFor="ils-access-code">Access code</Label>
            <Input
              id="ils-access-code"
              value={accessCode}
              onChange={event => {
                setAccessCode(event.target.value.toUpperCase());
                setPreview(null);
              }}
              placeholder="PAEDS-XXXXXXXXXX"
              autoComplete="off"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ils-access-course">Course</Label>
            <select
              id="ils-access-course"
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={programType}
              onChange={event => {
                setProgramType(event.target.value as Course);
                setPreview(null);
              }}
            >
              {courses.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <Button
            type="button"
            disabled={accessCode.trim().length < 8 || previewQuery.isFetching}
            onClick={() => void reviewCode()}
          >
            {previewQuery.isFetching ? "Reviewing…" : "Review code"}
          </Button>
        </div>
        {preview && (
          <div className="space-y-3 rounded-md border border-sky-200 bg-white p-4 text-sm dark:bg-slate-950">
            <p>
              <strong>{preview.programType.toUpperCase()}</strong> sponsored by{" "}
              <strong>{preview.companyName ?? "your institution"}</strong>.
            </p>
            <p>
              {preview.departmentId
                ? "This code is limited to your assigned department."
                : "This code applies across your institution."}{" "}
              It expires on {new Date(preview.expiresAt).toLocaleDateString()}{" "}
              and has {preview.remainingRedemptions} remaining seat(s).
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                disabled={redeem.isPending}
                onClick={() =>
                  redeem.mutate({
                    accessCode: accessCode.trim(),
                    programType,
                  })
                }
              >
                {redeem.isPending
                  ? "Activating…"
                  : "Accept and activate course"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setPreview(null)}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
        {message && (
          <p className="text-sm text-emerald-700" role="status">
            {message}
          </p>
        )}
        {error && (
          <p className="text-sm text-red-700" role="alert">
            {error}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
