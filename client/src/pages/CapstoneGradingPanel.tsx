import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Loader2, CheckCircle2, AlertCircle, ClipboardList,
  GraduationCap, Clock, User, BookOpen, ChevronDown, ChevronUp
} from "lucide-react";
import { useLocation } from "wouter";

interface CapstoneSubmission {
  id: number;
  userId: number;
  enrollmentId: number;
  courseId: string;
  caseResponse: string;
  status: string;
  score: number | null;
  instructorFeedback: string | null;
  gradedAt: string | null;
  submittedAt: string;
}

function GradeForm({ submission, onGraded }: { submission: CapstoneSubmission; onGraded: () => void }) {
  const [score, setScore] = useState<number>(0);
  const [feedback, setFeedback] = useState("");
  const [expanded, setExpanded] = useState(false);

  const gradeMutation = trpc.courses.gradeCapstone.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.passed ? "✅ Capstone passed! Certificate will be issued." : "❌ Capstone failed. Learner may resubmit.");
        onGraded();
      } else {
        toast.error("Failed to grade capstone");
      }
    },
    onError: (err) => toast.error(err.message),
  });

  const handleGrade = () => {
    if (feedback.length < 20) {
      toast.error("Feedback must be at least 20 characters");
      return;
    }
    gradeMutation.mutate({ submissionId: submission.id, score, feedback });
  };

  const scoreColor = score >= 80 ? "text-green-600" : score >= 60 ? "text-yellow-600" : "text-red-600";

  return (
    <Card className="border-2 border-border">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              Submission #{submission.id}
            </CardTitle>
            <CardDescription className="flex items-center gap-2 mt-1">
              <BookOpen className="h-3 w-3" />
              {submission.courseId.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
              <span className="mx-1">·</span>
              <Clock className="h-3 w-3" />
              {new Date(submission.submittedAt).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}
            </CardDescription>
          </div>
          <Badge variant="outline" className="text-yellow-600 border-yellow-600">
            Pending Review
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Case Response */}
        <div>
          <button
            className="flex items-center gap-2 text-sm font-medium text-foreground w-full text-left"
            onClick={() => setExpanded(!expanded)}
          >
            <span>Learner's Case Response</span>
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          {expanded && (
            <div className="mt-2 p-3 bg-muted rounded-md text-sm text-muted-foreground whitespace-pre-wrap max-h-64 overflow-y-auto">
              {submission.caseResponse}
            </div>
          )}
        </div>

        {/* Grading Rubric Reference */}
        <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-md text-xs text-blue-700 dark:text-blue-300 space-y-1">
          <p className="font-semibold">Grading Rubric (0–100):</p>
          <p>90–100: Excellent — Correct diagnosis, optimal management, complete safety netting</p>
          <p>80–89: Good — Minor gaps in management or communication</p>
          <p>70–79: Satisfactory — Correct diagnosis, some management gaps</p>
          <p>Below 70: Needs Improvement — Significant clinical gaps; resubmit</p>
        </div>

        {/* Score Input */}
        <div className="space-y-1">
          <Label htmlFor={`score-${submission.id}`} className="text-sm font-medium">
            Score (0–100)
          </Label>
          <div className="flex items-center gap-3">
            <Input
              id={`score-${submission.id}`}
              type="number"
              min={0}
              max={100}
              value={score}
              onChange={(e) => setScore(Number(e.target.value))}
              className="w-24"
            />
            <span className={`text-lg font-bold ${scoreColor}`}>
              {score >= 80 ? "PASS" : "FAIL"}
            </span>
          </div>
        </div>

        {/* Feedback */}
        <div className="space-y-1">
          <Label htmlFor={`feedback-${submission.id}`} className="text-sm font-medium">
            Instructor Feedback <span className="text-muted-foreground">(min. 20 characters)</span>
          </Label>
          <Textarea
            id={`feedback-${submission.id}`}
            placeholder="Provide specific, actionable feedback on the learner's clinical reasoning, management decisions, and communication..."
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            rows={4}
            className="resize-none"
          />
          <p className="text-xs text-muted-foreground text-right">{feedback.length} characters</p>
        </div>

        {/* Submit Button */}
        <Button
          onClick={handleGrade}
          disabled={gradeMutation.isPending || feedback.length < 20}
          className={score >= 80 ? "bg-green-600 hover:bg-green-700 w-full" : "bg-red-600 hover:bg-red-700 w-full"}
        >
          {gradeMutation.isPending ? (
            <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Submitting Grade...</>
          ) : (
            <><CheckCircle2 className="h-4 w-4 mr-2" /> Submit Grade ({score >= 80 ? "Pass" : "Fail"})</>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

export default function CapstoneGradingPanel() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();

  const pendingQuery = trpc.courses.listPendingCapstones.useQuery(undefined, {
    enabled: isAuthenticated && (user as { role?: string })?.role === "admin",
    refetchInterval: 30000, // auto-refresh every 30s
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated || (user as { role?: string })?.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 font-semibold">Admin access required</p>
          <Button variant="outline" className="mt-4" onClick={() => setLocation("/")}>Go Home</Button>
        </div>
      </div>
    );
  }

  const submissions = pendingQuery.data ?? [];

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <GraduationCap className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">Capstone Grading</h1>
              <p className="text-muted-foreground text-sm">Review and grade learner capstone submissions</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => setLocation("/admin")}>
            ← Admin Hub
          </Button>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="text-center p-4">
            <p className="text-3xl font-bold text-yellow-600">{submissions.length}</p>
            <p className="text-xs text-muted-foreground mt-1">Pending Review</p>
          </Card>
          <Card className="text-center p-4">
            <p className="text-3xl font-bold text-green-600">48h</p>
            <p className="text-xs text-muted-foreground mt-1">Target Turnaround</p>
          </Card>
          <Card className="text-center p-4">
            <p className="text-3xl font-bold text-blue-600">80%</p>
            <p className="text-xs text-muted-foreground mt-1">Pass Threshold</p>
          </Card>
        </div>

        {/* Loading State */}
        {pendingQuery.isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-3 text-muted-foreground">Loading submissions...</span>
          </div>
        )}

        {/* Empty State */}
        {!pendingQuery.isLoading && submissions.length === 0 && (
          <Card className="text-center py-16">
            <CardContent>
              <ClipboardList className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Pending Submissions</h3>
              <p className="text-muted-foreground text-sm">
                All capstone submissions have been graded. Check back later.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Submissions List */}
        {submissions.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-muted-foreground" />
              <h2 className="font-semibold">{submissions.length} Submission{submissions.length !== 1 ? "s" : ""} Awaiting Review</h2>
            </div>
            {submissions.map((submission) => (
              <GradeForm
                key={submission.id}
                submission={submission as CapstoneSubmission}
                onGraded={() => utils.courses.listPendingCapstones.invalidate()}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
