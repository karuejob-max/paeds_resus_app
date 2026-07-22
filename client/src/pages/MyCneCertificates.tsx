import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Award, Download, Loader2, Inbox, Key } from "lucide-react";
import CpdClaimDialog from "@/components/CpdClaimDialog";

/**
 * Self-service CNE certificate portal for any logged-in user (nurse). Lists all
 * CNE attendance records matched to the user's account email and lets them
 * download each certificate as a PDF via the existing Express route
 * (/api/cne/certificate/:attendeeId), which authorizes the nurse by matching email.
 */
export default function MyCneCertificates() {
  const { user, loading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  const [claimDialogOpen, setClaimDialogOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<{
    attendeeId: number;
    eventId: number;
    eventName: string;
    cpdCode: string;
  } | null>(null);

  // Redirect unauthenticated users to login (consistent with other authed pages).
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      setLocation("/login");
    }
  }, [loading, isAuthenticated, setLocation]);

  const certificatesQuery = trpc.cne.myCertificates.useQuery(undefined, {
    enabled: Boolean(user),
    staleTime: 30_000,
  });

  const records = certificatesQuery.data?.records ?? [];
  const matchedEmail = certificatesQuery.data?.email ?? user?.email ?? null;

  const cadreLabel = (cadre: string, cadreOther: string | null) =>
    cadre === "Other" ? cadreOther?.trim() || "Other" : cadre;

  if (loading || !user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10">
          <Award className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">My CNE Certificates</h1>
          <p className="text-sm text-muted-foreground">
            Continuing Nursing Education sessions you have attended.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Attendance records</CardTitle>
          <CardDescription>
            {matchedEmail
              ? `Showing certificates linked to ${matchedEmail}. Registered with a different email? Use that account to see those records.`
              : "Your account has no email on file, so we cannot match CNE registrations."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {certificatesQuery.isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : certificatesQuery.isError ? (
            <div className="py-8 text-center">
              <p className="text-sm text-destructive">
                {certificatesQuery.error?.message || "Failed to load your certificates."}
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => certificatesQuery.refetch()}
              >
                Try again
              </Button>
            </div>
          ) : records.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                <Inbox className="h-7 w-7 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium">No CNE certificates yet</p>
              <p className="max-w-md text-xs text-muted-foreground">
                When you register for a CNE session using this account&apos;s email
                {matchedEmail ? ` (${matchedEmail})` : ""}, your certificate will appear here for
                download.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Session</TableHead>
                  <TableHead>Institution</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Cadre</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((r) => (
                  <TableRow key={r.attendeeId}>
                    <TableCell className="font-medium">{r.eventName}</TableCell>
                    <TableCell className="text-sm">{r.institutionName}</TableCell>
                    <TableCell className="text-sm">{r.eventDate}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{cadreLabel(r.cadre, r.cadreOther)}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {r.cpdCode && (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => {
                              setSelectedRecord({
                                attendeeId: r.attendeeId,
                                eventId: r.eventId,
                                eventName: r.eventName,
                                cpdCode: r.cpdCode as string,
                              });
                              setClaimDialogOpen(true);
                            }}
                          >
                            <Key className="mr-1 h-3.5 w-3.5" />
                            Claim CPD Points
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            window.open(`/api/cne/certificate/${r.attendeeId}`, "_blank")
                          }
                        >
                          <Download className="mr-1 h-3.5 w-3.5" />
                          PDF
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {selectedRecord && (
        <CpdClaimDialog
          open={claimDialogOpen}
          onOpenChange={setClaimDialogOpen}
          attendeeId={selectedRecord.attendeeId}
          eventId={selectedRecord.eventId}
          eventName={selectedRecord.eventName}
          cpdCode={selectedRecord.cpdCode}
          userEmail={user.email || ""}
        />
      )}
    </div>
  );
}
