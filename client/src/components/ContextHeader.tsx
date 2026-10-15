import { Building2, ChevronRight, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type ContextHeaderProps = {
  workspace: string;
  title: string;
  description?: string;
  institution?: string | null;
  department?: string | null;
  scope?: string | null;
  status?: string | null;
  className?: string;
};

/**
 * The minimum context contract for authenticated work:
 * where the user is, what they are looking at, and which scope applies.
 */
export function ContextHeader({
  workspace,
  title,
  description,
  institution,
  department,
  scope,
  status,
  className,
}: ContextHeaderProps) {
  const contextParts = [institution, department, scope].filter(Boolean);

  return (
    <header
      className={cn(
        "rounded-xl border border-slate-200 bg-white px-4 py-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:px-5",
        className
      )}
      data-context-header
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-teal-700 dark:text-teal-300">
            <span>{workspace}</span>
            <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="truncate normal-case tracking-normal text-muted-foreground">
              {title}
            </span>
          </div>
          {description ? (
            <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>
        {status ? (
          <Badge variant="outline" className="w-fit shrink-0">
            {status}
          </Badge>
        ) : null}
      </div>
      {contextParts.length ? (
        <div
          className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-slate-100 pt-3 text-xs text-slate-600 dark:border-slate-800 dark:text-slate-300"
          aria-label="Current operating scope"
        >
          <MapPin
            className="h-3.5 w-3.5 shrink-0 text-teal-700 dark:text-teal-300"
            aria-hidden="true"
          />
          {contextParts.map((part, index) => (
            <span
              key={`${part}-${index}`}
              className="inline-flex items-center gap-2"
            >
              {index > 0 ? <span aria-hidden="true">·</span> : null}
              {index === 0 ? (
                <Building2
                  className="h-3.5 w-3.5 shrink-0"
                  aria-hidden="true"
                />
              ) : null}
              <span
                className={
                  index === 0 ? "font-semibold text-foreground" : undefined
                }
              >
                {part}
              </span>
            </span>
          ))}
        </div>
      ) : null}
    </header>
  );
}
