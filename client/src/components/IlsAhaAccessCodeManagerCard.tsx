import { useState } from "react";
import { TicketCheck } from "lucide-react";
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

export function IlsAhaAccessCodeManagerCard({
  institutionId,
}: {
  institutionId: number;
}) {
  const [programType, setProgramType] =
    useState<(typeof courses)[number][0]>("bls");
  const [expiresAt, setExpiresAt] = useState("");
  const [maxRedemptions, setMaxRedemptions] = useState("1");
  const [reason, setReason] = useState(
    "Institution-sponsored ILSP course access"
  );
  const [issuedCode, setIssuedCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const utils = trpc.useUtils();
  const codesQuery =
    trpc.institutionalLifeSupport.listInstitutionalAhaAccessCodes.useQuery({
      institutionId,
    });
  const revoke =
    trpc.institutionalLifeSupport.revokeInstitutionalAhaAccessCode.useMutation({
      onSuccess: () => {
        setError(null);
        void utils.institutionalLifeSupport.listInstitutionalAhaAccessCodes.invalidate(
          {
            institutionId,
          }
        );
      },
      onError: err => setError(err.message),
    });
  const issue =
    trpc.institutionalLifeSupport.createInstitutionalAhaAccessCode.useMutation({
      onSuccess: result => {
        setIssuedCode(result.accessCode);
        setError(null);
      },
      onError: err => {
        setError(err.message);
        setIssuedCode(null);
      },
    });

  return (
    <Card className="border-violet-200 bg-violet-50/40 dark:border-violet-900 dark:bg-violet-950/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <TicketCheck className="h-4 w-4 text-violet-700" />
          Issue an ILSP course code
        </CardTitle>
        <CardDescription>
          Create an auditable institution-sponsored code. Share it only with
          assigned staff; the plaintext is shown once.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <Label htmlFor="ils-code-course">Course</Label>
            <select
              id="ils-code-course"
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
          <div className="space-y-2">
            <Label htmlFor="ils-code-expiry">Expires</Label>
            <Input
              id="ils-code-expiry"
              type="date"
              value={expiresAt}
              onChange={event => setExpiresAt(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ils-code-limit">Maximum learners</Label>
            <Input
              id="ils-code-limit"
              type="number"
              min={1}
              max={1000}
              value={maxRedemptions}
              onChange={event => setMaxRedemptions(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ils-code-reason">Reason</Label>
            <Input
              id="ils-code-reason"
              value={reason}
              onChange={event => setReason(event.target.value)}
            />
          </div>
        </div>
        <Button
          type="button"
          disabled={!expiresAt || reason.trim().length < 10 || issue.isPending}
          onClick={() =>
            issue.mutate({
              institutionId,
              programType,
              expiresAt,
              maxRedemptions: Number(maxRedemptions),
              reason: reason.trim(),
            })
          }
        >
          {issue.isPending ? "Issuing…" : "Issue course code"}
        </Button>
        {issuedCode && (
          <div
            className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900"
            role="status"
          >
            <strong>Copy this code now:</strong>{" "}
            <code className="ml-2 font-semibold">{issuedCode}</code>
            <div className="mt-1 text-xs">
              It will not be shown again after this screen.
            </div>
          </div>
        )}
        {codesQuery.data && codesQuery.data.length > 0 && (
          <div className="space-y-2 rounded-md border bg-background p-3 text-sm">
            <p className="font-semibold">Issued codes</p>
            {codesQuery.data.map(code => {
              const exhausted = code.redemptionCount >= code.maxRedemptions;
              const inactive = code.status !== "active";
              return (
                <div
                  key={code.id}
                  className="flex flex-wrap items-center justify-between gap-3 border-b py-2 last:border-0"
                >
                  <div>
                    <div className="font-medium">
                      {code.programType.toUpperCase()} ·{" "}
                      {code.accessCodePrefix ?? "code"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {code.redemptionCount}/{code.maxRedemptions} used ·
                      expires {new Date(code.expiresAt).toLocaleDateString()} ·{" "}
                      {code.status}
                    </div>
                  </div>
                  {!inactive && !exhausted && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={revoke.isPending}
                      onClick={() => {
                        const reason = window.prompt(
                          "Reason for revoking this code (minimum 10 characters):"
                        );
                        if (reason && reason.trim().length >= 10)
                          revoke.mutate({
                            institutionId,
                            entitlementId: code.id,
                            reason: reason.trim(),
                          });
                      }}
                    >
                      Revoke
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
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
