import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function Help() {
  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">Help centre</h1>
        <p className="text-muted-foreground">Paeds Resus: courses, institutions, parents.</p>
        <Card>
          <CardHeader>
            <CardTitle>Courses</CardTitle>
            <CardDescription>Enrol and certificates</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Link href="/enroll">
              <Button type="button">Enrol</Button>
            </Link>
            <Link href="/learner-dashboard">
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
            <CardDescription>Quote vs hospital portal</CardDescription>
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
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Parents</CardTitle>
          </CardHeader>
          <CardContent>
            <Link href="/parent-safe-truth">
              <Button type="button" variant="outline">
                Safe-Truth
              </Button>
            </Link>
          </CardContent>
        </Card>
        <p className="text-sm">
          <a href="mailto:support@paeds-resus.com" className="underline">
            support@paeds-resus.com
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
