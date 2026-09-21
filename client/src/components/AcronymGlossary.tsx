import { PRODUCT_GLOSSARY } from "@/const/productGlossary";

export default function AcronymGlossary() {
  return (
    <details className="mt-4 rounded-xl border border-border/80 bg-muted/30 px-4 py-3">
      <summary className="cursor-pointer text-sm font-semibold text-foreground">
        What do these programme names mean?
      </summary>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {PRODUCT_GLOSSARY.map(entry => (
          <div
            key={entry.acronym}
            className="rounded-lg border bg-background p-3"
          >
            <p className="font-semibold text-primary">{entry.acronym}</p>
            <p className="mt-1 text-sm font-medium text-foreground">
              {entry.name}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              For {entry.forWhom.toLowerCase()}.
            </p>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              {entry.job}
            </p>
          </div>
        ))}
      </div>
    </details>
  );
}
