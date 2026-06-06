import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  FEEDBACK_CATEGORIES,
  FEEDBACK_CATEGORY_LABELS,
  FEEDBACK_STATUSES,
  FEEDBACK_STATUS_LABELS,
  type FeedbackCategory,
  type FeedbackTicketStatus,
} from "@shared/platform-feedback";
import { ArrowLeft, Download, Loader2, MessageSquare } from "lucide-react";
import { toast } from "sonner";

export default function AdminFeedback() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, setLocation] = useLocation();
  const adminOk = Boolean(isAuthenticated && user?.role === "admin");
  const [statusFilter, setStatusFilter] = useState<FeedbackTicketStatus | "all">("open");
  const [categoryFilter, setCategoryFilter] = useState<FeedbackCategory | "all">("all");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [responseText, setResponseText] = useState("");

  const listInput = useMemo(
    () => ({
      status: statusFilter === "all" ? undefined : statusFilter,
      category: categoryFilter === "all" ? undefined : categoryFilter,
      limit: 100,
    }),
    [statusFilter, categoryFilter]
  );

  const { data: tickets, isLoading, refetch } = trpc.adminFeedback.list.useQuery(listInput, { enabled: adminOk });
  const utils = trpc.useUtils();
  const updateStatus = trpc.adminFeedback.updateStatus.useMutation({ onSuccess: () => void refetch() });
  const respond = trpc.adminFeedback.respond.useMutation({ onSuccess: () => { toast.success("Saved"); void refetch(); } });

  useEffect(() => {
    if (!loading && !isAuthenticated) setLocation("/login");
    else if (!loading && user?.role !== "admin") setLocation("/");
  }, [loading, isAuthenticated, user?.role, setLocation]);

  const selected = tickets?.find((t) => t.id === selectedId);
  const ctx = selected?.contextJson as { courseSlug?: string; pageUrl?: string } | null;

  if (loading || !adminOk) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;
  }

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setLocation("/admin")}><ArrowLeft className="h-4 w-4" /></Button>
          <h1 className="text-2xl font-bold flex items-center gap-2"><MessageSquare /> Feedback inbox</h1>
        </div>
        <Button variant="outline" size="sm" onClick={async () => {
          const data = await utils.adminFeedback.exportOpen.fetch({ format: "markdown" });
          const blob = new Blob([data.markdown ?? ""], { type: "text/markdown" });
          const a = document.createElement("a");
          a.href = URL.createObjectURL(blob);
          a.download = `feedback-open-${new Date().toISOString().slice(0, 10)}.md`;
          a.click();
        }}><Download className="h-4 w-4 mr-1" /> Export open</Button>
      </div>
      <div className="flex gap-3">
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as FeedbackTicketStatus | "all")}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            {FEEDBACK_STATUSES.map((s) => <SelectItem key={s} value={s}>{FEEDBACK_STATUS_LABELS[s]}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v as FeedbackCategory | "all")}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            {FEEDBACK_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{FEEDBACK_CATEGORY_LABELS[c]}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Tickets ({tickets?.length ?? 0})</CardTitle></CardHeader>
          <CardContent className="p-0 divide-y max-h-96 overflow-y-auto">
            {isLoading ? <p className="p-4">Loading…</p> : tickets?.map((t) => (
              <button key={t.id} type="button" className={`w-full text-left p-4 hover:bg-muted/50 ${selectedId === t.id ? "bg-muted" : ""}`} onClick={() => setSelectedId(t.id)}>
                <div className="flex justify-between"><span>#{t.id}</span><Badge variant="outline">{FEEDBACK_STATUS_LABELS[t.status]}</Badge></div>
                <p className="text-xs text-muted-foreground">{FEEDBACK_CATEGORY_LABELS[t.category]}</p>
                <p className="text-sm line-clamp-2">{t.message}</p>
              </button>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>{selected ? `#${selected.id}` : "Detail"}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {selected ? (
              <>
                <p className="text-sm whitespace-pre-wrap border p-3 rounded">{selected.message}</p>
                {ctx?.courseSlug && <Link href={`/course/${ctx.courseSlug}`}><Button variant="link" size="sm">Open course</Button></Link>}
                <Select value={selected.status} onValueChange={(v) => updateStatus.mutate({ ticketId: selected.id, status: v as FeedbackTicketStatus })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{FEEDBACK_STATUSES.map((s) => <SelectItem key={s} value={s}>{FEEDBACK_STATUS_LABELS[s]}</SelectItem>)}</SelectContent>
                </Select>
                <Label>Response</Label>
                <Textarea rows={4} value={responseText} onChange={(e) => setResponseText(e.target.value)} />
                <Button onClick={() => respond.mutate({ ticketId: selected.id, adminResponse: responseText.trim(), status: "resolved" })}>Save</Button>
              </>
            ) : <p className="text-muted-foreground text-sm">Select a ticket.</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
