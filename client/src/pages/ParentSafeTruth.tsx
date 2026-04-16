import { useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Heart, Shield, MessageCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import ParentSafeTruthForm from "@/components/ParentSafeTruthForm";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

export default function ParentSafeTruth() {
  const formRef = useRef<HTMLDivElement>(null);
  const { isAuthenticated } = useAuth();
  const { data: stats } = trpc.parentSafeTruth.getSafeTruthStats.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const { data: mySubmissions } = trpc.parentSafeTruth.getMySubmissions.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-brand-surface">
      <div className="relative overflow-hidden border-b border-border bg-gradient-to-br from-primary via-[#1a4545] to-[#0f2525] text-primary-foreground">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, white 0, transparent 45%), radial-gradient(circle at 80% 60%, var(--brand-orange) 0, transparent 40%)",
          }}
        />
        <div className="relative max-w-6xl mx-auto px-4 py-12 md:py-16">
          <div className="max-w-2xl space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm font-medium backdrop-blur-sm border border-white/15">
              <Heart className="h-4 w-4 text-[#ffb38a]" aria-hidden />
              Safe-Truth — for parents and guardians
            </div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-balance">
              Your voice can make care safer for children in Kenya
            </h1>
            <p className="text-base md:text-lg text-white/90 leading-relaxed">
              Whether you were at a national referral hospital, a county facility, or a clinic—if your child had a
              frightening emergency, we want to hear how it felt for your family. There is no blame here. Honest stories
              help hospitals and teams understand what to fix first.
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <Badge variant="secondary" className="bg-white/15 text-primary-foreground border-white/25 font-normal">
                <Shield className="w-3 h-3 mr-1" aria-hidden /> Private — we use this to improve systems, not to point
                fingers
              </Badge>
              <Badge variant="secondary" className="bg-white/15 text-primary-foreground border-white/25 font-normal">
                <MessageCircle className="w-3 h-3 mr-1" aria-hidden /> Plain language — no medical exam required
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto py-10 px-4 pb-16">
        {isAuthenticated && stats && stats.reviewedSubmissionsCount > 0 && (
          <Alert className="mb-8 border-emerald-600/40 bg-emerald-50/90 text-emerald-950 dark:bg-emerald-950/20 dark:text-emerald-50 dark:border-emerald-500/40">
            <CheckCircle2 className="text-emerald-700 dark:text-emerald-400" />
            <AlertTitle>We have replied</AlertTitle>
            <AlertDescription>
              You have {stats.reviewedSubmissionsCount} message
              {stats.reviewedSubmissionsCount !== 1 ? "s" : ""} ready. Look under &quot;Your stories&quot; below—we also
              email you (check spam if nothing arrived).
            </AlertDescription>
          </Alert>
        )}

        {isAuthenticated && stats !== undefined && (
          <Card className="mb-8 border-border shadow-sm">
            <CardContent className="pt-6">
              <p className="text-foreground leading-relaxed">
                You have shared a story{" "}
                <span className="font-semibold text-primary">{stats.submissionsThisMonth}</span> time
                {stats.submissionsThisMonth !== 1 ? "s" : ""} this calendar month.
                {stats.lastSubmission && (
                  <span className="block text-sm text-muted-foreground mt-2">
                    Last sent: {new Date(stats.lastSubmission).toLocaleDateString()}
                  </span>
                )}
              </p>
            </CardContent>
          </Card>
        )}

        {isAuthenticated && mySubmissions && mySubmissions.length > 0 && (
          <Card className="mb-10 border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Your stories</CardTitle>
              <CardDescription>When we have read your story, we show the status here and email you.</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {mySubmissions.slice(0, 10).map((s) => (
                  <li
                    key={s.id}
                    className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between text-sm border-b border-border/60 pb-3 last:border-0 last:pb-0"
                  >
                    <span className="text-foreground">
                      {new Date(s.createdAt).toLocaleDateString()} — {s.childOutcome}
                    </span>
                    {s.status === "reviewed" ? (
                      <Badge className="bg-emerald-600 hover:bg-emerald-600 w-fit">Reply ready</Badge>
                    ) : (
                      <span className="text-muted-foreground capitalize">{s.status}</span>
                    )}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 md:grid-cols-2 mb-12">
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <Heart className="w-5 h-5 text-[var(--brand-orange)] shrink-0" aria-hidden />
                Why we ask
              </CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground text-sm leading-relaxed">
              Caregivers notice things charts miss—how long you waited, whether anyone explained, how scared you felt.
              That feedback helps teams train better and plan for the next child.
            </CardContent>
          </Card>
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <Shield className="w-5 h-5 text-primary shrink-0" aria-hidden />
                Your privacy
              </CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground text-sm leading-relaxed">
              You can send your story without your name. We use what you share to improve services and teaching—not to
              punish individuals. If something worries us about a specific child&apos;s safety, we follow sensible
              safeguarding steps.
            </CardContent>
          </Card>
        </div>

        <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-sm mb-12">
          <h2 className="text-xl font-semibold text-foreground mb-2">Ready when you are</h2>
          <p className="text-muted-foreground text-sm max-w-lg mx-auto mb-6 leading-relaxed">
            Take your time. You can stop and come back. If typing is hard, keep it short—every line still helps.
          </p>
          <Button size="lg" variant="cta" onClick={scrollToForm}>
            Share your story
          </Button>
        </div>

        <Card className="border-border shadow-sm mb-12">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">After you submit</CardTitle>
            <CardDescription>What to expect from the follow-up process.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>We review each story and group patterns that help improve communication and emergency support.</p>
            <p>If you are signed in, your story status appears under <span className="font-medium text-foreground">Your stories</span>.</p>
            <p>When a response is ready, we may also send an email update. Please check your spam folder if needed.</p>
          </CardContent>
        </Card>

        <div ref={formRef} className="scroll-mt-24">
          <ParentSafeTruthForm />
        </div>
      </div>
    </div>
  );
}
