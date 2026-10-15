import { ArrowRight, CheckCircle2, Clock3, ListChecks } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type TaskPriority = "required" | "waiting" | "available";

export type TaskQueueItem = {
  id: string;
  title: string;
  detail: string;
  actionLabel: string;
  priority: TaskPriority;
  onAction: () => void;
};

const priorityCopy: Record<TaskPriority, { label: string; className: string }> =
  {
    required: {
      label: "Do now",
      className:
        "border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100",
    },
    waiting: {
      label: "Waiting",
      className:
        "border-blue-200 bg-blue-50 text-blue-950 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-100",
    },
    available: {
      label: "Available",
      className:
        "border-slate-200 bg-slate-50 text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100",
    },
  };

function QueueRow({ item }: { item: TaskQueueItem }) {
  const priority = priorityCopy[item.priority];
  return (
    <li
      className={cn(
        "flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between",
        priority.className
      )}
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-semibold">{item.title}</p>
          <Badge
            variant="outline"
            className="text-[10px] uppercase tracking-wide"
          >
            {priority.label}
          </Badge>
        </div>
        <p className="mt-1 text-sm opacity-80">{item.detail}</p>
      </div>
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="shrink-0 bg-white/70 dark:bg-slate-950/40"
        onClick={item.onAction}
      >
        {item.actionLabel}
        <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
      </Button>
    </li>
  );
}

export function TaskQueue({
  items,
  title = "Your next actions",
  description = "Work is grouped by urgency so the most important decision stays visible.",
  emptyTitle = "No action is waiting",
  emptyDetail = "You are up to date for this workspace.",
  className,
}: {
  items: TaskQueueItem[];
  title?: string;
  description?: string;
  emptyTitle?: string;
  emptyDetail?: string;
  className?: string;
}) {
  const requiredCount = items.filter(
    item => item.priority === "required"
  ).length;
  const waitingCount = items.filter(item => item.priority === "waiting").length;

  return (
    <Card
      className={cn(
        "border-2 border-teal-200 bg-white shadow-sm dark:border-teal-900 dark:bg-slate-900",
        className
      )}
      data-task-queue
    >
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-teal-100 p-2 text-teal-800 dark:bg-teal-950 dark:text-teal-200">
            <ListChecks className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-teal-700 dark:text-teal-300">
              Action queue
            </p>
            <CardTitle className="mt-1 text-lg">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <div
            className="ml-auto hidden shrink-0 gap-2 text-xs text-muted-foreground sm:flex"
            aria-label="Action queue summary"
          >
            {requiredCount ? (
              <span className="inline-flex items-center gap-1">
                <Clock3
                  className="h-3.5 w-3.5 text-amber-700"
                  aria-hidden="true"
                />
                {requiredCount} now
              </span>
            ) : null}
            {waitingCount ? <span>{waitingCount} waiting</span> : null}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {items.length ? (
          <ol className="space-y-3">
            {items.map(item => (
              <QueueRow key={item.id} item={item} />
            ))}
          </ol>
        ) : (
          <div className="flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50/70 p-4 text-sm dark:border-emerald-900 dark:bg-emerald-950/20">
            <CheckCircle2
              className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700 dark:text-emerald-300"
              aria-hidden="true"
            />
            <div>
              <p className="font-semibold text-emerald-950 dark:text-emerald-100">
                {emptyTitle}
              </p>
              <p className="mt-1 text-emerald-900/80 dark:text-emerald-100/80">
                {emptyDetail}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
