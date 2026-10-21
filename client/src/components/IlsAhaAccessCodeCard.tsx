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

export function IlsAhaAccessCodeCard() {
  const [accessCode, setAccessCode] = useState("");
  const [programType, setProgramType] =
    useState<(typeof courses)[number][0]>("bls");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const utils = trpc.useUtils();
  const redeem =
    trpc.institutionalLifeSupport.redeemInstitutionalAhaAccessCode.useMutation({
      onSuccess: result => {
        setMessage(result.message);
        setError(null);
        setAccessCode("");
        void utils.institutionalLifeSupport.getMyEnrollment.invalidate();
      },
      onError: err => {
        setError(err.message);
        setMessage(null);
      },
    });

  return (
    <Card className="border-sky-200 bg-sky-50/40 dark:border-sky-900 dark:bg-sky-950/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <KeyRound className="h-4 w-4 text-sky-700" />
          Have an institution course code?
        </CardTitle>
        <CardDescription>
          Enter the code provided by your institution. It is limited to the
          assigned institution or department and can be used only while it
          remains active.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-[1fr_180px_auto] sm:items-end">
          <div className="space-y-2">
            <Label htmlFor="ils-access-code">Access code</Label>
            <Input
              id="ils-access-code"
              value={accessCode}
              onChange={event =>
                setAccessCode(event.target.value.toUpperCase())
              }
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
              onChange={event =>
                setProgramType(event.target.value as typeof programType)
              }
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
            disabled={accessCode.trim().length < 8 || redeem.isPending}
            onClick={() =>
              redeem.mutate({ accessCode: accessCode.trim(), programType })
            }
          >
            {redeem.isPending ? "Checking…" : "Redeem code"}
          </Button>
        </div>
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
