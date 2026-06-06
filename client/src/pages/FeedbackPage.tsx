import { useSearch } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FeedbackDialog } from "@/components/FeedbackDialog";
import type { FeedbackCategory } from "@shared/platform-feedback";

const VALID: FeedbackCategory[] = ["course_content", "resus_gps", "care_signal", "payment_technical", "safety_concern", "other"];

export default function FeedbackPage() {
  const { isAuthenticated, loading } = useAuth();
  const params = new URLSearchParams(useSearch());
  const raw = params.get("category");
  const defaultCategory = raw && VALID.includes(raw as FeedbackCategory) ? (raw as FeedbackCategory) : "other";

  if (loading) return <p className="p-8 text-center text-muted-foreground">Loading…</p>;
  if (!isAuthenticated) {
    return (
      <Card className="max-w-lg mx-auto m-8">
        <CardHeader><CardTitle>Sign in to send feedback</CardTitle></CardHeader>
      </Card>
    );
  }

  return (
    <div className="max-w-lg mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">Send feedback</h1>
      <Card><CardContent className="pt-6">
        <FeedbackDialog open hideTrigger defaultCategory={defaultCategory} contextJson={{ pageUrl: "/feedback", courseSlug: params.get("course") ?? undefined }} />
      </CardContent></Card>
    </div>
  );
}
