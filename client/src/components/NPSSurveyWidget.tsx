import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

export function NPSSurveyWidget() {
  const [open, setOpen] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [feedback, setFeedback] = useState("");
  const [followUpEmail, setFollowUpEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitNPS = trpc.feedback.submitNpsSurvey.useMutation({
    onSuccess: () => {
      setOpen(false);
      setScore(null);
      setFeedback("");
      setFollowUpEmail("");
    },
  });

  const handleSubmit = async () => {
    if (score === null) {
      alert("Please select a score");
      return;
    }

    setIsSubmitting(true);
    try {
      await submitNPS.mutateAsync({
        score,
        feedback: feedback || undefined,
        followUpEmail: followUpEmail || undefined,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCategory = (s: number) => {
    if (s >= 9) return "Promoter";
    if (s >= 7) return "Passive";
    return "Detractor";
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="fixed bottom-16 right-4"
      >
        📊 NPS
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>How likely are you to recommend us?</DialogTitle>
            <DialogDescription>
              Your feedback helps us improve
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* NPS Scale */}
            <div>
              <div className="grid grid-cols-5 gap-2 mb-2">
                {[0, 1, 2, 3, 4].map((i) => (
                  <button
                    key={i}
                    onClick={() => setScore(i)}
                    className={`py-2 px-3 rounded-md font-medium transition-colors ${
                      score === i
                        ? "bg-blue-500 text-white"
                        : "bg-gray-100 hover:bg-gray-200"
                    }`}
                  >
                    {i}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-5 gap-2 mb-4">
                {[5, 6, 7, 8, 9, 10].map((i) => (
                  <button
                    key={i}
                    onClick={() => setScore(i)}
                    className={`py-2 px-3 rounded-md font-medium transition-colors ${
                      score === i
                        ? "bg-blue-500 text-white"
                        : "bg-gray-100 hover:bg-gray-200"
                    }`}
                  >
                    {i}
                  </button>
                ))}
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>Not likely</span>
                <span>Very likely</span>
              </div>
            </div>

            {/* Category Display */}
            {score !== null && (
              <div className="p-3 bg-blue-50 rounded-md text-center">
                <p className="text-sm font-medium">
                  You are a <span className="font-bold">{getCategory(score)}</span>
                </p>
              </div>
            )}

            {/* Feedback */}
            <div>
              <label className="text-sm font-medium">Additional Feedback (Optional)</label>
              <Textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Tell us why..."
                className="mt-1"
              />
            </div>

            {/* Follow-up Email */}
            <div>
              <label className="text-sm font-medium">Email for Follow-up (Optional)</label>
              <input
                type="email"
                value={followUpEmail}
                onChange={(e) => setFollowUpEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full mt-1 px-3 py-2 border rounded-md"
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || score === null}
              >
                {isSubmitting ? "Submitting..." : "Submit"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
