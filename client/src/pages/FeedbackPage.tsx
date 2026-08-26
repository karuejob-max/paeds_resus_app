import { useSearch } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { FeedbackDialog } from "@/components/FeedbackDialog";
import type { FeedbackCategory } from "@shared/platform-feedback";

const VALID: FeedbackCategory[] = [
  "course_content",
  "resus_gps",
  "care_signal",
  "payment_technical",
  "safety_concern",
  "other",
];

export default function FeedbackPage() {
  const { isAuthenticated, loading } = useAuth();
  const feedbackHistory = trpc.feedback.listMine.useQuery(
    { limit: 10 },
    { enabled: isAuthenticated, staleTime: 30_000 }
  );
  const params = new URLSearchParams(useSearch());
  const raw = params.get("category");
  const defaultCategory =
    raw && VALID.includes(raw as FeedbackCategory)
      ? (raw as FeedbackCategory)
      : "other";

  if (loading)
    return <p className="p-8 text-center text-muted-foreground">Loading…</p>;
  if (!isAuthenticated) {
    return (
      <Card className="max-w-lg mx-auto m-8">
        <CardHeader>
          <CardTitle>Sign in to send feedback</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="max-w-lg mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">Send feedback</h1>
      <Card>
        <CardContent className="pt-6">
          <FeedbackDialog
            open
            hideTrigger
            defaultCategory={defaultCategory}
            contextJson={{
              pageUrl: "/feedback",
              courseSlug: params.get("course") ?? undefined,
            }}
          />
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">My feedback</CardTitle>
          <CardDescription>
            Track references for feedback you have already submitted. This does
            not replace urgent clinical escalation.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {feedbackHistory.isLoading ? (
            <p className="text-sm text-muted-foreground">
              Loading your feedback history…
            </p>
          ) : null}
          {!feedbackHistory.isLoading &&
          (feedbackHistory.data ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No feedback submitted yet.
            </p>
          ) : null}
          {(feedbackHistory.data ?? []).map(ticket => (
            <div
              key={ticket.id}
              className="flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-start sm:justify-between"
            >
              <div>
                <p className="text-sm font-medium">
                  #{ticket.id} · {ticket.subject ?? ticket.category}
                </p>
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                  {ticket.message}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {new Date(ticket.createdAt).toLocaleDateString()}
                </p>
              </div>
              <Badge variant="outline" className="w-fit capitalize">
                {ticket.status.replaceAll("_", " ")}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
