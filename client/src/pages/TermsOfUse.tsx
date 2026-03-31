import { Link } from "wouter";

export default function TermsOfUse() {
  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <article className="max-w-3xl mx-auto prose prose-slate dark:prose-invert">
        <h1>Terms of use</h1>
        <p className="lead text-muted-foreground">
          By using Paeds Resus you agree to these terms. If you disagree, do not use the services.
        </p>

        <h2>Not medical advice</h2>
        <p>
          Content is for professional education. It does not replace clinical judgment, local protocols, or
          supervision.
        </p>

        <h2>Accounts</h2>
        <p>You are responsible for safeguarding credentials.</p>

        <h2>Payments</h2>
        <p>Fees follow the terms shown at purchase and any institutional contract.</p>

        <h2>Acceptable use</h2>
        <p>Do not misuse the platform or breach security. We may suspend access for violations.</p>

        <h2>Contact</h2>
        <p>
          <a href="mailto:support@paeds-resus.com" className="text-primary underline">
            support@paeds-resus.com
          </a>{" "}
          · <Link href="/privacy">Privacy</Link> · <Link href="/help">Help</Link>
        </p>
      </article>
    </div>
  );
}
