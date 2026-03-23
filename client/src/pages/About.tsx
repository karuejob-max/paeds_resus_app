import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function About() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-slate-900 to-slate-950 text-white py-16 px-4">
      <div className="max-w-2xl mx-auto space-y-8">
        <h1 className="text-4xl font-bold">About Paeds Resus</h1>
        <p className="text-lg text-blue-100/90">
          We build training, point-of-care guidance, and feedback loops to strengthen paediatric emergency and
          resuscitation care—especially where children are most vulnerable.
        </p>
        <ul className="list-disc list-inside text-blue-100/80 space-y-2">
          <li>ResusGPS and protocols for time-critical decisions</li>
          <li>Certified courses (BLS, ACLS, PALS, fellowship pathways)</li>
          <li>Safe-Truth for families and quality improvement</li>
          <li>Institutional programmes, analytics, and scale</li>
        </ul>
        <div className="flex flex-wrap gap-3 pt-4">
          <Link href="/institutional">
            <Button className="bg-orange-500 hover:bg-orange-600">For institutions</Button>
          </Link>
          <Link href="/enroll">
            <Button variant="outline" className="border-white/40 text-white hover:bg-white/10">
              Enrol
            </Button>
          </Link>
          <Link href="/help">
            <Button variant="ghost" className="text-white hover:bg-white/10">
              Help
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
