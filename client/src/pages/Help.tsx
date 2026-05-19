import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { LifeBuoy, ShieldCheck } from "lucide-react";

export default function Help() {
  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">Help centre</h1>
        <p className="text-muted-foreground">Paeds Resus support for providers, institutions, and families.</p>
        <Alert>
          <LifeBuoy className="h-4 w-4" />
          <AlertTitle>Need urgent product help?</AlertTitle>
          <AlertDescription>
            Contact <a href="mailto:support@paedsresus.com" className="underline">support@paedsresus.com</a>. For
            institutional onboarding or quotes, also use <a href="mailto:institutional@paedsresus.com" className="underline">institutional@paedsresus.com</a>.
          </AlertDescription>
        </Alert>
        <Card>
          <CardHeader>
            <CardTitle>Courses</CardTitle>
            <CardDescription>Enrolment, payment, and certificates</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Link href="/enroll">
              <Button type="button">Enrol</Button>
            </Link>
            <Link href="/">
              <Button type="button" variant="outline">
                Dashboard
              </Button>
            </Link>
            <Link href="/payment">
              <Button type="button" variant="outline">
                Payment
              </Button>
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Institutions</CardTitle>
            <CardDescription>Buyer path and partner portal</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Link href="/institutional">
              <Button type="button">For institutions</Button>
            </Link>
            <Link href="/institutional#quote">
              <Button type="button" variant="outline">
                Quote
              </Button>
            </Link>
            <Link href="/login">
              <Button type="button" variant="outline">
                Sign in
              </Button>
            </Link>
            <Link href="/institutional-onboarding">
              <Button type="button" variant="outline">
                New onboarding
              </Button>
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Parents</CardTitle>
            <CardDescription>Safe-Truth stories and follow-up status</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Link href="/parent-safe-truth">
              <Button type="button" variant="outline">
                Safe-Truth
              </Button>
            </Link>
            <Link href="/about">
              <Button type="button" variant="outline">
                About Paeds Resus
              </Button>
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="inline-flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" />
              Trust and scope
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Paeds Resus tools support training and structured emergency response. They do not replace local policies,
            senior clinical decision making, or emergency referral pathways.
          </CardContent>
        </Card>
        <p className="text-sm">
          <a href="mailto:support@paedsresus.com" className="underline">
            support@paedsresus.com
          </a>
        </p>
        <p className="text-xs text-muted-foreground">
          <Link href="/privacy" className="underline">
            Privacy
          </Link>
          {" · "}
          <Link href="/terms" className="underline">
            Terms
          </Link>
        </p>
      </div>
    </div>
  );
}
