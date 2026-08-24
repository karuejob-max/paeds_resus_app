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
import { Award, Building2, Download, Inbox, Key, Link2, Loader2, MapPin } from "lucide-react";
import { toast } from "sonner";
import CpdClaimDialog from "@/components/CpdClaimDialog";

/**
 * Self-service CPD certificate portal for any logged-in user. Lists all
 * CPD attendance records matched to the user's account email and lets them
 * download each certificate as a PDF via the existing Express route
 * (/api/cpd/certificate/:attendeeId), which authorizes the user by matching email.
 */
export default function MyCpdCertificates() {
  const { user, loading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  const [claimDialogOpen, setClaimDialogOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<{
    attendeeId: number;
    eventId: number;
    eventName: string;
    cpdCode: string;
    approvingCouncil: string | null;
    cpdPoints: string | number | null;
  } | null>(null);

  // Redirect unauthenticated users to login (consistent with other authed pages).
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      setLocation("/login");
    }
  }, [loading, isAuthenticated, setLocation]);

  const certificatesQuery = trpc.cpd.myCertificates.useQuery(undefined, {
    enabled: Boolean(user),
    staleTime: 30_000,
  });
  const facilityLinksQuery = trpc.cpd.getMyFacilityLinkOptions.useQuery(undefined, {
    enabled: Boolean(user),
    staleTime: 30_000,
  });
  const utils = trpc.useUtils();
  const confirmFacilityMutation = trpc.cpd.confirmPermanentFacilityFromCpd.useMutation({
    onSuccess: async (result) => {
      if (result.status === "linked") {
        toast.success("Permanent facility confirmed and account linked");
      } else {
        toast.message("Administrator review is still required for this facility");
      }
      await Promise.all([
        facilityLinksQuery.refetch(),
        utils.institution.getMyMemberships.invalidate(),
      ]);
    },
    onError: (error) => toast.error(error.message || "Could not confirm this facility"),
  });

  const records = certificatesQuery.data?.records ?? [];
  const matchedEmail = certificatesQuery.data?.email ?? user?.email ?? null;
  const attendanceStats = certificatesQuery.data?.attendanceStats ?? { totalCnes: 0, totalCmes: 0, myCnes: 0, myCmes: 0 };

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
      {(facilityLinksQuery.data?.length ?? 0) > 0 && (
        <Card className="mb-6 border-blue-100 bg-blue-50/30 dark:border-blue-900/40 dark:bg-blue-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><Building2 className="h-5 w-5" />Facility relationships</CardTitle>
            <CardDescription>
              Confirm one hospital as your permanent facility, or leave other hospitals recorded as outreach/locum sites. A permanent confirmation creates only general institutional membership; IERS duties still require separate assignment and acceptance.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {facilityLinksQuery.data?.map((option) => {
              const isLinked = option.facilityLinkStatus === "linked" && option.membershipStatus === "active";
              const stateLabel = isLinked
                ? "Permanent facility linked"
                : option.latestAttendanceType === "locum_outreach"
                  ? "Outreach / locum recorded"
                  : option.membershipStatus === "suspended" || option.membershipStatus === "ended"
                    ? "Administrator review required"
                    : "Not linked yet";
              return (
                <div key={option.institutionId} className="flex flex-col gap-3 rounded-lg border bg-background p-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 font-medium"><Building2 className="h-4 w-4 shrink-0 text-blue-600" />{option.institutionName}</p>
                    <p className="mt-1 flex items-center gap-2 text-xs text-muted-foreground"><MapPin className="h-3.5 w-3.5 shrink-0" />{option.department || "Department recorded in CPD"}</p>
                    <Badge variant={isLinked ? "default" : option.latestAttendanceType === "locum_outreach" ? "outline" : "secondary"} className="mt-2">{stateLabel}</Badge>
                  </div>
                  {isLinked ? (
                    <span className="text-xs text-muted-foreground">General staff membership active</span>
                  ) : option.canConfirmPermanent ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="w-full sm:w-auto"
                      disabled={confirmFacilityMutation.isPending}
                      onClick={() => confirmFacilityMutation.mutate({ institutionId: option.institutionId })}
                    >
                      <Link2 className="mr-2 h-4 w-4" />Confirm permanent facility
                    </Button>
                  ) : (
                    <span className="text-xs text-amber-700 dark:text-amber-300">Contact this institution administrator</span>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {records.length > 0 && (() => {
        const totalPts = records.reduce((acc, r) => acc + (Number(r.cpdPoints) || 0), 0);
        const targetPts = 20;
        const progressPct = Math.min(100, Math.round((totalPts / targetPts) * 100));
        const cneRate = attendanceStats.totalCnes > 0 ? Math.round((attendanceStats.myCnes / attendanceStats.totalCnes) * 100) : 0;
        const cmeRate = attendanceStats.totalCmes > 0 ? Math.round((attendanceStats.myCmes / attendanceStats.totalCmes) * 100) : 0;

        return (
          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="border-blue-100 bg-gradient-to-br from-blue-50/40 to-white dark:border-blue-900/30 dark:from-blue-950/20">
              <CardHeader className="pb-1 text-xs text-muted-foreground uppercase font-semibold">Total Points Earned</CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{Math.round(totalPts * 10) / 10} Pts</div>
                <p className="text-xs text-muted-foreground mt-0.5">Minted on Paeds Resus</p>
              </CardContent>
            </Card>

            <Card className="border-emerald-100 bg-gradient-to-br from-emerald-50/40 to-white dark:border-emerald-900/30 dark:from-emerald-950/20">
              <CardHeader className="pb-1 text-xs text-muted-foreground uppercase font-semibold">Sessions Attended</CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{records.length}</div>
                <p className="text-xs text-muted-foreground mt-0.5">Across partner hospitals</p>
              </CardContent>
            </Card>

            <Card className="border-purple-100 bg-gradient-to-br from-purple-50/40 to-white dark:border-purple-900/30 dark:from-purple-950/20">
              <CardHeader className="pb-1 text-xs text-muted-foreground uppercase font-semibold">Annual Council Renewal</CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-xs font-semibold mb-1">
                  <span>{progressPct}% Target Met</span>
                  <span>{totalPts}/{targetPts} pts</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div className="h-full bg-purple-600 transition-all" style={{ width: `${progressPct}%` }} />
                </div>
              </CardContent>
            </Card>

            <Card className="border-cyan-100 bg-gradient-to-br from-cyan-50/40 to-white dark:border-cyan-900/30 dark:from-cyan-950/20">
              <CardHeader className="pb-1 text-xs text-muted-foreground uppercase font-semibold">Hospital CNE/CME Rates</CardHeader>
              <CardContent className="space-y-2 pt-1">
                <div>
                  <div className="flex items-center justify-between text-[11px] font-semibold mb-0.5">
                    <span>CNEs Attended</span>
                    <span>{attendanceStats.myCnes}/{attendanceStats.totalCnes} ({cneRate}%)</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div className="h-full bg-cyan-600 transition-all" style={{ width: `${cneRate}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between text-[11px] font-semibold mb-0.5">
                    <span>CMEs Attended</span>
                    <span>{attendanceStats.myCmes}/{attendanceStats.totalCmes} ({cmeRate}%)</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div className="h-full bg-cyan-600 transition-all" style={{ width: `${cmeRate}%` }} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );
      })()}

      <Card>
        <CardHeader>
          <CardTitle>Attendance records</CardTitle>
          <CardDescription>
            {matchedEmail
              ? `Showing certificates linked to ${matchedEmail}. Registered with a different email? Use that account to see those records.`
              : "Your account has no email on file, so we cannot match CPD registrations."}
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
              <p className="text-sm font-medium">No CPD certificates yet</p>
              <p className="max-w-md text-xs text-muted-foreground">
                When you register for a CPD session using this account&apos;s email
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
                  <TableHead>Approved Points</TableHead>
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
                    <TableCell className="text-sm">
                      {r.approvingCouncil && r.cpdPoints ? (
                        <Badge variant="outline" className="border-cyan-500/30 text-cyan-600 bg-cyan-50/20">
                          {r.approvingCouncil}: {r.cpdPoints} pts
                        </Badge>
                      ) : r.cpdPoints ? (
                        <Badge variant="outline" className="border-cyan-500/30 text-cyan-600 bg-cyan-50/20">
                          {r.cpdPoints} pts
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
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
                                approvingCouncil: r.approvingCouncil ?? null,
                                cpdPoints: r.cpdPoints ?? null,
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
                            window.open(`/api/cpd/certificate/${r.attendeeId}`, "_blank")
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
          approvingCouncil={selectedRecord.approvingCouncil}
          cpdPoints={selectedRecord.cpdPoints}
        />
      )}
    </div>
  );
}
