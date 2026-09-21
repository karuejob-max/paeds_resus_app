import type { PublicFaqItem } from "@/const/publicFaq";

type PublicFaqSectionProps = {
  id?: string;
  items: PublicFaqItem[];
  title?: string;
};

export default function PublicFaqSection({
  id = "faq",
  items,
  title = "Common questions",
}: PublicFaqSectionProps) {
  return (
    <section id={id} aria-labelledby={`${id}-heading`} className="space-y-5">
      <div className="max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">
          Clear answers
        </p>
        <h2
          id={`${id}-heading`}
          className="mt-2 text-2xl font-bold md:text-3xl"
        >
          {title}
        </h2>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {items.map(item => (
          <details
            key={item.question}
            className="rounded-2xl border bg-card p-5"
          >
            <summary className="cursor-pointer font-semibold leading-relaxed">
              {item.question}
            </summary>
            <p className="mt-3 leading-relaxed text-muted-foreground">
              {item.answer}
            </p>
          </details>
        ))}
      </div>
    </section>
  );
}
