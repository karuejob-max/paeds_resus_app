import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function About() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-teal via-background to-card text-foreground py-16 px-4">
      <div className="max-w-2xl mx-auto space-y-8">
        <h1 className="text-4xl font-bold text-foreground">About Paeds Resus</h1>
        <p className="text-lg text-muted-foreground">
          We build training, point-of-care guidance, and feedback loops to strengthen paediatric emergency and
          resuscitation care—especially where children are most vulnerable.
        </p>
        <ul className="list-disc list-inside text-muted-foreground space-y-2">
          <li>ResusGPS and protocols for time-critical decisions</li>
          <li>Certified courses (BLS, ACLS, PALS, fellowship pathways)</li>
          <li>Care Signal for clinicians and Safe-Truth for families — quality improvement</li>
          <li>Institutional programmes, analytics, and scale</li>
        </ul>
        <div className="flex flex-wrap gap-3 pt-4">
          <Link href="/institutional">
            <Button variant="cta">For institutions</Button>
          </Link>
          <Link href="/enroll">
            <Button variant="outline">Enrol</Button>
          </Link>
          <Link href="/help">
            <Button variant="ghost">Help</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
