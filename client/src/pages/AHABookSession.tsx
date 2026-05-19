/**
 * AHABookSession.tsx
 * Learner-facing page to browse and book upcoming AHA hands-on practical skills sessions.
 * Required for BLS/ACLS/PALS certificate issuance (Gate 2: practical sign-off).
 */
import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  Loader2,
  MapPin,
  User,
  Users,
} from "lucide-react";

const PROGRAM_LABEL: Record<string, string> = {
  bls: "BLS",
  acls: "ACLS",
  pals: "PALS",
};

function formatDate(d: Date | string | null | undefined): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-KE", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatTime(t: string | null | undefined): string {
  if (!t) return "";
  // t is stored as HH:MM or HH:MM:SS
  const [h, m] = t.split(":");
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const h12 = hour % 12 || 12;
  return `${h12}:${m} ${ampm}`;
}

function SpotsLeft({ enrolled, max }: { enrolled: number | null; max: number | null }) {
  const left = (max ?? 0) - (enrolled ?? 0);
  const pct = max ? ((enrolled ?? 0) / max) * 100 : 0;
  const color = pct >= 80 ? "text-red-600" : pct >= 50 ? "text-amber-600" : "text-emerald-600";
  return (
    <span className={`text-xs font-medium ${color}`}>
      {left} spot{left !== 1 ? "s" : ""} left
    </span>
  );
}

export default function AHABookSession() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [filter, setFilter] = useState<"all" | "bls" | "acls" | "pals">("all");
  const [bookingId, setBookingId] = useState<number | null>(null);

  const sessionsQuery = trpc.courses.listUpcomingHandsOnSessions.useQuery(
    { programType: filter === "all" ? undefined : filter },
    { enabled: !!user }
  );
  const myBookingsQuery = trpc.courses.getMyHandsOnBookings.useQuery(undefined, { enabled: !!user });

  const bookMutation = trpc.courses.bookHandsOnSession.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      sessionsQuery.refetch();
      myBookingsQuery.refetch();
      setBookingId(null);
    },
    onError: (err) => {
      toast.error(err.message);
      setBookingId(null);
    },
  });

  const bookedScheduleIds = new Set(
    (myBookingsQuery.data ?? []).map((b) => b.scheduleId)
  );

  const sessions = sessionsQuery.data ?? [];

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => setLocation("/aha-courses")} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            AHA courses
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <ClipboardCheck className="h-7 w-7" />
              Book a hands-on session
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Attend a practical skills session to complete Gate 2 of your AHA certificate.
            </p>
          </div>
        </div>

        {/* How it works */}
        <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-800">
          <CardContent className="pt-4 pb-4 text-sm text-foreground/80 space-y-1">
            <p className="font-medium text-blue-800 dark:text-blue-300">How practical sign-off works</p>
            <ol className="list-decimal list-inside space-y-0.5 ml-2 text-xs">
              <li>Register for a session below.</li>
              <li>Attend and complete the skills stations (CPR, AED, megacode, etc.).</li>
              <li>Your instructor marks you as passed in the system — your certificate is released automatically.</li>
            </ol>
          </CardContent>
        </Card>

        {/* My bookings */}
        {(myBookingsQuery.data ?? []).length > 0 && (
          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                My registered sessions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {(myBookingsQuery.data ?? []).map((b) => (
                <div
                  key={b.attendanceId}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-lg border border-border p-3"
                >
                  <div>
                    <p className="font-medium text-sm text-foreground">
                      {PROGRAM_LABEL[b.programType ?? ""] ?? b.programType?.toUpperCase()} — {b.courseTitle}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(b.scheduledDate)}
                      {b.startTime ? ` · ${formatTime(b.startTime)}` : ""}
                      {b.endTime ? `–${formatTime(b.endTime)}` : ""}
                      {b.location ? ` · ${b.location}` : ""}
                    </p>
                    {b.instructorName && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <User className="h-3 w-3" />
                        {b.instructorName}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <Badge
                      variant={b.attendanceStatus === "attended" ? "default" : "secondary"}
                      className="text-xs capitalize"
                    >
                      {b.attendanceStatus ?? "registered"}
                    </Badge>
                    {b.certificateIssued && (
                      <Badge variant="default" className="text-xs bg-emerald-600 gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Signed off
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Filter tabs */}
        <div className="flex flex-wrap gap-2">
          {(["all", "bls", "acls", "pals"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                filter === f
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border text-muted-foreground hover:border-primary/50"
              }`}
            >
              {f === "all" ? "All programs" : PROGRAM_LABEL[f]}
            </button>
          ))}
        </div>

        {/* Sessions list */}
        {sessionsQuery.isLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground py-8 justify-center">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading sessions…
          </div>
        ) : sessions.length === 0 ? (
          <Card className="text-center p-12">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground font-medium">No upcoming hands-on sessions available</p>
            <p className="text-sm text-muted-foreground mt-1">
              Check back soon, or contact Paeds Resus Limited to request a session in your area.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sessions.map((s) => {
              const isBooked = bookedScheduleIds.has(s.id);
              const isBooking = bookingId === s.id && bookMutation.isPending;
              return (
                <Card
                  key={s.id}
                  className={`flex flex-col transition-colors ${
                    isBooked ? "border-emerald-300 dark:border-emerald-700" : "hover:border-primary/50"
                  }`}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <Badge variant="outline" className="text-xs mb-1">
                          {PROGRAM_LABEL[s.programType ?? ""] ?? s.programType?.toUpperCase()}
                        </Badge>
                        <CardTitle className="text-base leading-snug">{s.courseTitle}</CardTitle>
                      </div>
                      {isBooked && <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />}
                    </div>
                    <CardDescription className="flex items-center gap-1 mt-1">
                      <Calendar className="h-3.5 w-3.5 shrink-0" />
                      {formatDate(s.scheduledDate)}
                      {s.startTime ? ` · ${formatTime(s.startTime)}` : ""}
                      {s.endTime ? `–${formatTime(s.endTime)}` : ""}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col justify-between space-y-3">
                    <div className="space-y-1.5 text-sm text-muted-foreground">
                      {s.location && (
                        <p className="flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 shrink-0" />
                          {s.location}
                        </p>
                      )}
                      {s.instructorName && (
                        <p className="flex items-center gap-1.5">
                          <User className="h-3.5 w-3.5 shrink-0" />
                          {s.instructorName}
                        </p>
                      )}
                      <p className="flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5 shrink-0" />
                        <SpotsLeft enrolled={s.enrolledCount} max={s.maxCapacity} />
                        <span className="text-xs">of {s.maxCapacity ?? "—"}</span>
                      </p>
                      <p className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 shrink-0" />
                        <span className="capitalize text-xs">{s.trainingType?.replace("_", " ")}</span>
                      </p>
                    </div>

                    {isBooked ? (
                      <div className="rounded-md bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 px-3 py-2 text-xs text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                        You are registered for this session
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        className="w-full"
                        disabled={isBooking}
                        onClick={() => {
                          setBookingId(s.id);
                          bookMutation.mutate({ scheduleId: s.id });
                        }}
                      >
                        {isBooking ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Registering…
                          </>
                        ) : (
                          "Register for this session"
                        )}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
