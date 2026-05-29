import type { ReactNode } from "react";
import { Link } from "wouter";
import type { LegalDocumentMeta } from "@/legal/types";

type Props = {
  document: LegalDocumentMeta;
  children?: ReactNode;
};

export function LegalDocumentLayout({ document, children }: Props) {
  return (
    <div className="min-h-screen bg-background py-10 px-4">
      <div className="max-w-3xl mx-auto">
        <header className="mb-8 border-b border-border pb-6">
          <h1 className="text-3xl font-bold text-foreground">{document.title}</h1>
          {document.intro && (
            <p className="mt-3 text-muted-foreground leading-relaxed">{document.intro}</p>
          )}
          <p className="mt-4 text-sm text-muted-foreground">
            Version {document.version} · Last updated: {document.lastUpdated}
          </p>
        </header>

        <nav
          className="mb-10 rounded-lg border border-border bg-muted/30 p-4"
          aria-label="Table of contents"
        >
          <h2 className="text-sm font-semibold text-foreground mb-2">Contents</h2>
          <ul className="space-y-1 text-sm">
            {document.sections.map((s) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="text-primary hover:underline">
                  {s.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <article className="prose prose-slate dark:prose-invert max-w-none">
          {document.sections.map((section) => (
            <section key={section.id} id={section.id} className="scroll-mt-24 mb-10">
              <h2>{section.title}</h2>
              {section.paragraphs?.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
              {section.bullets && (
                <ul>
                  {section.bullets.map((b, i) => (
                    <li key={i}>{b}</li>
                  ))}
                </ul>
              )}
              {section.subsections?.map((sub, i) => (
                <div key={i}>
                  <h3>{sub.title}</h3>
                  {sub.paragraphs?.map((p, j) => (
                    <p key={j}>{p}</p>
                  ))}
                  {sub.bullets && (
                    <ul>
                      {sub.bullets.map((b, j) => (
                        <li key={j}>{b}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </section>
          ))}
          {children}
        </article>

        <footer className="mt-12 pt-6 border-t border-border text-sm text-muted-foreground space-y-2">
          <p>
            Version {document.version} · Last updated: {document.lastUpdated}
          </p>
          <p>
            <Link href="/terms" className="text-primary underline">
              Terms of Use
            </Link>
            {" · "}
            <Link href="/privacy" className="text-primary underline">
              Privacy Policy
            </Link>
            {" · "}
            <Link href="/legal/clinical-use" className="text-primary underline">
              ResusGPS Intended Use
            </Link>
            {" · "}
            <Link href="/legal/cookies" className="text-primary underline">
              Cookies
            </Link>
            {" · "}
            <Link href="/legal/data-request" className="text-primary underline">
              Data requests
            </Link>
          </p>
        </footer>
      </div>
    </div>
  );
}
