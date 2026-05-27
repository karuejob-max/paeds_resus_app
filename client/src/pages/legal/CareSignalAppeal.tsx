import { Link } from "wouter";
import { LEGAL_CONTACT } from "@shared/legal-versions";
import { usePageMeta } from "@/hooks/usePageMeta";

/** Appeals stub — system errors affecting Fellowship Pillar C streak only (Fellowship §11.3). */
export default function CareSignalAppeal() {
  usePageMeta({
    title: "Care Signal appeals — Paeds Resus",
    description: "Appeal Care Signal system errors affecting Fellowship streak eligibility.",
    path: "/care-signal/appeal",
  });

  return (
    <div className="min-h-screen bg-background py-10 px-4">
      <div className="max-w-2xl mx-auto prose prose-slate dark:prose-invert">
        <h1>Care Signal appeals</h1>
        <p>
          If a <strong>platform system error</strong> (not clinical disagreement) caused your Care Signal
          submission to be rejected or your Fellowship Pillar C streak to be incorrectly broken, you may
          appeal within 14 days of the affected month (EAT).
        </p>
        <h2>What we review</h2>
        <ul>
          <li>Duplicate submission blocks, rate-limit errors, or server failures with timestamps</li>
          <li>Incorrect fellowship eligibility flags applied by automation</li>
          <li>Facility registry merge errors affecting attribution</li>
        </ul>
        <h2>What we do not review</h2>
        <ul>
          <li>Clinical judgment, employer disciplinary matters, or preventability disputes</li>
          <li>Requests to backdate reports without evidence of system failure</li>
        </ul>
        <h2>How to submit</h2>
        <p>
          Email{" "}
          <a href={`mailto:${LEGAL_CONTACT.supportEmail}?subject=Care%20Signal%20Appeal`}>
            {LEGAL_CONTACT.supportEmail}
          </a>{" "}
          with your account email, approximate submission time (EAT), and any error message or screenshot.
          We aim to respond within 10 business days.
        </p>
        <p>
          <Link href="/care-signal" className="text-primary">
            Back to Care Signal
          </Link>
          {" · "}
          <Link href="/help" className="text-primary">
            Help
          </Link>
        </p>
      </div>
    </div>
  );
}
