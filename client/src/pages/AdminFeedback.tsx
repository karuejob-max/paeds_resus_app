import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  FEEDBACK_AGENT_ASSIGNEES,
  FEEDBACK_AGENT_ASSIGNEE_LABELS,
  FEEDBACK_CATEGORIES,
  FEEDBACK_CATEGORY_LABELS,
  FEEDBACK_ISSUE_TYPES,
  FEEDBACK_ISSUE_TYPE_LABELS,
  FEEDBACK_SEVERITIES,
  FEEDBACK_SEVERITY_LABELS,
  FEEDBACK_STATUSES,
  FEEDBACK_STATUS_LABELS,
  type FeedbackCategory,
  type FeedbackIssueType,
  type FeedbackSeverity,
  type FeedbackStatusHistoryEntry,
  type FeedbackTicketStatus,
} from "@shared/platform-feedback";
import { ArrowLeft, Download, ExternalLink, Loader2, MessageSquare } from "lucide-react";
import { toast } from "sonner";

type StatusFilter = FeedbackTicketStatus | "all" | "actionable";

function severityVariant(severity: string): "default" | "secondary" | "destructive" | "outline" {
  if (severity === "critical") return "destructive";
  if (severity === "high") return "default";
  return "outline";
}

export default function AdminFeedback() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, setLocation] = useLocation();
  const adminOk = Boolean(isAuthenticated && user?.role === "admin");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("actionable");
  const [categoryFilter, setCategoryFilter] = useState<FeedbackCategory | "all">("all");
  const [issueTypeFilter, setIssueTypeFilter] = useState<FeedbackIssueType | "all">("all");
  const [severityFilter, setSeverityFilter] = useState<FeedbackSeverity | "all">("all");
  const [courseSlugFilter, setCourseSlugFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [responseText, setResponseText] = useState("");
  const [statusNote, setStatusNote] = useState("");
  const [agentTagsText, setAgentTagsText] = useState("");

  const listInput = useMemo(
    () => ({
      status: statusFilter === "all" ? undefined : statusFilter,
      category: categoryFilter === "all" ? undefined : categoryFilter,
      issueType: issueTypeFilter === "all" ? undefined : issueTypeFilter,
      severity: severityFilter === "all" ? undefined : severityFilter,
      courseSlug: courseSlugFilter.trim() || undefined,
      createdAfter: dateFrom ? new Date(`${dateFrom}T00:00:00`) : undefined,
      createdBefore: dateTo ? new Date(`${dateTo}T23:59:59`) : undefined,
      limit: 100,
    }),
    [statusFilter, categoryFilter, issueTypeFilter, severityFilter, courseSlugFilter, dateFrom, dateTo]
  );

  const { data: tickets, isLoading, refetch } = trpc.adminFeedback.list.useQuery(listInput, { enabled: adminOk });
  const utils = trpc.useUtils();
  const updateStatus = trpc.adminFeedback.updateStatus.useMutation({ onSuccess: () => void refetch() });
  const updateAssignment = trpc.adminFeedback.updateAssignment.useMutation({ onSuccess: () => void refetch() });
  const respond = trpc.adminFeedback.respond.useMutation({
    onSuccess: () => {
      toast.success("Saved");
      void refetch();
    },
  });

  useEffect(() => {
    if (!loading && !isAuthenticated) setLocation("/login");
    else if (!loading && user?.role !== "admin") setLocation("/");
  }, [loading, isAuthenticated, user?.role, setLocation]);

  const selected = tickets?.find((t) => t.id === selectedId);
  const ctx = selected?.contextJson as {
    courseSlug?: string;
    pageUrl?: string;
    surface?: string;
    userAgent?: string;
    screenshotUrl?: string;
    moduleId?: number;
  } | null;
  const history = (selected?.statusHistoryJson as FeedbackStatusHistoryEntry[] | null) ?? [];

  useEffect(() => {
    if (selected) {
      setResponseText(selected.adminResponse ?? "");
      setAgentTagsText(Array.isArray(selected.agentTags) ? (selected.agentTags as string[]).join(", ") : "");
    }
  }, [selected?.id, selected?.adminResponse, selected?.agentTags]);

  if (loading || !adminOk) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setLocation("/admin")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <MessageSquare /> Feedback inbox
          </h1>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={async () => {
            const data = await utils.adminFeedback.exportOpen.fetch({ format: "markdown" });
            const blob = new Blob([data.markdown ?? ""], { type: "text/markdown" });
            const a = document.createElement("a");
            a.href = URL.createObjectURL(blob);
            a.download = `feedback-open-${new Date().toISOString().slice(0, 10)}.md`;
            a.click();
          }}
        >
          <Download className="h-4 w-4 mr-1" /> Export open (agents)
        </Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="actionable">Pending + in progress</SelectItem>
            <SelectItem value="all">All statuses</SelectItem>
            {FEEDBACK_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>{FEEDBACK_STATUS_LABELS[s]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v as FeedbackCategory | "all")}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Source" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All sources</SelectItem>
            {FEEDBACK_CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>{FEEDBACK_CATEGORY_LABELS[c]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={issueTypeFilter} onValueChange={(v) => setIssueTypeFilter(v as FeedbackIssueType | "all")}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Issue type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {FEEDBACK_ISSUE_TYPES.map((t) => (
              <SelectItem key={t} value={t}>{FEEDBACK_ISSUE_TYPE_LABELS[t]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={severityFilter} onValueChange={(v) => setSeverityFilter(v as FeedbackSeverity | "all")}>
          <SelectTrigger className="w-32"><SelectValue placeholder="Severity" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All severity</SelectItem>
            {FEEDBACK_SEVERITIES.map((s) => (
              <SelectItem key={s} value={s}>{FEEDBACK_SEVERITY_LABELS[s]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input className="w-36" placeholder="Course slug" value={courseSlugFilter} onChange={(e) => setCourseSlugFilter(e.target.value)} />
        <Input className="w-36" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} title="From date" />
        <Input className="w-36" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} title="To date" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Tickets ({tickets?.length ?? 0})</CardTitle></CardHeader>
          <CardContent className="p-0 divide-y max-h-[32rem] overflow-y-auto">
            {isLoading ? (
              <p className="p-4">Loading…</p>
            ) : tickets?.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">No tickets match filters.</p>
            ) : (
              tickets?.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className={`w-full text-left p-4 hover:bg-muted/50 ${selectedId === t.id ? "bg-muted" : ""}`}
                  onClick={() => setSelectedId(t.id)}
                >
                  <div className="flex justify-between gap-2 items-start">
                    <span className="font-medium">#{t.id}</span>
                    <div className="flex gap-1 flex-wrap justify-end">
                      <Badge variant={severityVariant(t.severity ?? "medium")}>{FEEDBACK_SEVERITY_LABELS[(t.severity as FeedbackSeverity) ?? "medium"]}</Badge>
                      <Badge variant="outline">{FEEDBACK_STATUS_LABELS[t.status]}</Badge>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {FEEDBACK_CATEGORY_LABELS[t.category]}
                    {t.issueType ? ` · ${FEEDBACK_ISSUE_TYPE_LABELS[t.issueType as FeedbackIssueType]}` : ""}
                    {t.assignedAgent && t.assignedAgent !== "unassigned" ? ` · ${t.assignedAgent}` : ""}
                  </p>
                  <p className="text-sm line-clamp-2 mt-1">{t.message}</p>
                  <p className="text-[11px] text-muted-foreground mt-1">{new Date(t.createdAt).toLocaleString()}</p>
                </button>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>{selected ? `#${selected.id}` : "Detail"}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {selected ? (
              <>
                <div className="flex flex-wrap gap-2">
                  <Badge>{FEEDBACK_CATEGORY_LABELS[selected.category]}</Badge>
                  {selected.issueType && <Badge variant="secondary">{FEEDBACK_ISSUE_TYPE_LABELS[selected.issueType as FeedbackIssueType]}</Badge>}
                  <Badge variant={severityVariant(selected.severity ?? "medium")}>{FEEDBACK_SEVERITY_LABELS[(selected.severity as FeedbackSeverity) ?? "medium"]}</Badge>
                  {selected.priority === "safety" && <Badge variant="destructive">Safety priority</Badge>}
                </div>

                <p className="text-sm whitespace-pre-wrap border p-3 rounded bg-muted/30">{selected.message}</p>

                <div className="text-xs space-y-1 border rounded p-3 bg-muted/20">
                  <p><strong>Context</strong></p>
                  {ctx?.pageUrl && <p>URL: <code className="text-[11px]">{ctx.pageUrl}</code></p>}
                  {ctx?.surface && <p>Source tool: {ctx.surface}</p>}
                  {ctx?.courseSlug && <p>Course: {ctx.courseSlug}</p>}
                  {ctx?.moduleId != null && <p>Module ID: {ctx.moduleId}</p>}
                  {ctx?.userAgent && <p className="break-all">Browser: {ctx.userAgent}</p>}
                  {ctx?.screenshotUrl && (
                    <a href={ctx.screenshotUrl} target="_blank" rel="noreferrer" className="text-primary inline-flex items-center gap-1">
                      Screenshot <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                  {ctx?.courseSlug && (
                    <Link href={`/micro-course/${ctx.courseSlug}`}>
                      <Button variant="link" size="sm" className="h-auto p-0">Open course</Button>
                    </Link>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={selected.status}
                    onValueChange={(v) =>
                      updateStatus.mutate({
                        ticketId: selected.id,
                        status: v as FeedbackTicketStatus,
                        note: statusNote.trim() || undefined,
                      })
                    }
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {FEEDBACK_STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>{FEEDBACK_STATUS_LABELS[s]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input placeholder="Status transition note (optional)" value={statusNote} onChange={(e) => setStatusNote(e.target.value)} />
                </div>

                <div className="space-y-2">
                  <Label>Assigned agent</Label>
                  <Select
                    value={selected.assignedAgent ?? "unassigned"}
                    onValueChange={(v) =>
                      updateAssignment.mutate({ ticketId: selected.id, assignedAgent: v as (typeof FEEDBACK_AGENT_ASSIGNEES)[number] })
                    }
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {FEEDBACK_AGENT_ASSIGNEES.map((a) => (
                        <SelectItem key={a} value={a}>{FEEDBACK_AGENT_ASSIGNEE_LABELS[a]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="Tags (comma-separated, e.g. asthma-i, regression)"
                    value={agentTagsText}
                    onChange={(e) => setAgentTagsText(e.target.value)}
                    onBlur={() =>
                      updateAssignment.mutate({
                        ticketId: selected.id,
                        agentTags: agentTagsText.split(",").map((t) => t.trim()).filter(Boolean),
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Admin response</Label>
                  <Textarea rows={4} value={responseText} onChange={(e) => setResponseText(e.target.value)} />
                  <Button
                    disabled={!responseText.trim()}
                    onClick={() =>
                      respond.mutate({
                        ticketId: selected.id,
                        adminResponse: responseText.trim(),
                        status: "resolved",
                        note: statusNote.trim() || "Marked fixed with admin response",
                      })
                    }
                  >
                    Save & mark fixed
                  </Button>
                </div>

                {history.length > 0 && (
                  <div className="space-y-2">
                    <Label>Status history</Label>
                    <ul className="text-xs space-y-1 border rounded p-2 max-h-32 overflow-y-auto">
                      {history.map((h, i) => (
                        <li key={i}>
                          {h.from ? `${FEEDBACK_STATUS_LABELS[h.from]} → ` : ""}
                          {FEEDBACK_STATUS_LABELS[h.to]}
                          {h.note ? ` — ${h.note}` : ""}
                          <span className="text-muted-foreground"> ({new Date(h.at).toLocaleString()})</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            ) : (
              <p className="text-muted-foreground text-sm">Select a ticket.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
