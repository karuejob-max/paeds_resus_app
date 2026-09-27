import { useMemo, useState } from "react";
import {
  Activity,
  Award,
  Bell,
  BookOpen,
  CheckCheck,
  ExternalLink,
  ShieldAlert,
  Users,
} from "lucide-react";
import { formatDistanceToNow, differenceInDays } from "date-fns";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { useAfterFirstPaint } from "@/hooks/useAfterFirstPaint";
import { buildCourseProgressAlerts, type CourseProgressEnrollmentInput } from "@shared/course-progress-notifications";

type Filter = "all" | "action_required" | "clinical" | "role" | "learning" | "finance";
type Item = {
  id: string;
  title: string;
  body: string;
  actionUrl?: string | null;
  createdAt: Date;
  read: boolean;
  remoteId?: number;
  domain: string;
  severity: string;
  requiresAction: boolean;
  computed?: boolean;
};

function daysUntilExpiry(expiryDate: string | Date | null | undefined) {
  if (!expiryDate) return null;
  return differenceInDays(new Date(expiryDate), new Date());
}

function filterMatches(item: Item, filter: Filter) {
  if (filter === "all") return true;
  if (filter === "action_required") return item.requiresAction || item.severity === "urgent";
  return item.domain === filter;
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");
  const [, navigate] = useLocation();
  const afterPaint = useAfterFirstPaint();
  const queryReady = afterPaint || open;

  const summaryQuery = trpc.notifications.getSummary.useQuery(undefined, {
    enabled: queryReady,
    refetchInterval: queryReady ? 60_000 : false,
    staleTime: 30_000,
    retry: false,
  });
  const inboxQuery = trpc.notifications.getNotifications.useQuery(
    {
      limit: 50,
      domain: filter === "all" || filter === "action_required" ? undefined : filter,
      actionRequiredOnly: filter === "action_required",
      unreadOnly: false,
    },
    { enabled: open, staleTime: 10_000 },
  );

  const learningQuery = trpc.courses.getUserEnrollments.useQuery(undefined, {
    enabled: queryReady,
    refetchInterval: queryReady ? 120_000 : false,
  });
  const ahaQuery = trpc.courses.getMyAhaEnrollments.useQuery(undefined, {
    enabled: queryReady,
    refetchInterval: queryReady ? 120_000 : false,
  });
  const certificateQuery = trpc.certificates.getMyCertificates.useQuery(undefined, {
    enabled: queryReady,
    refetchInterval: queryReady ? 120_000 : false,
  });

  const markRead = trpc.notifications.markAsRead.useMutation({
    onSuccess: () => {
      void summaryQuery.refetch();
      void inboxQuery.refetch();
    },
  });
  const markAllRead = trpc.notifications.markAllAsRead.useMutation({
    onSuccess: () => {
      void summaryQuery.refetch();
      void inboxQuery.refetch();
    },
  });

  const computedItems = useMemo<Item[]>(() => {
    const progressInputs: CourseProgressEnrollmentInput[] = [
      ...(learningQuery.data ?? []).map((e) => ({
        id: e.id,
        source: "micro" as const,
        title: e.course?.title ?? "Course",
        courseSlug: e.course?.courseId ?? "",
        progressPercentage: Number(e.progressPercentage ?? 0),
        enrollmentStatus: e.enrollmentStatus,
      })),
      ...(ahaQuery.data ?? []).map((e) => ({
        id: e.id,
        source: "aha" as const,
        title: e.courseTitle ?? e.programType.toUpperCase(),
        courseSlug: e.programType,
        courseDbId: e.courseId,
        progressPercentage: Number(e.progressPercentage ?? 0),
        cognitiveModulesComplete: e.cognitiveModulesComplete,
      })),
    ].filter((row) => row.courseSlug.length > 0);

    const items: Item[] = buildCourseProgressAlerts(progressInputs, { overflowDestination: "/learner-dashboard" }).map((alert) => ({
      id: `computed-${alert.id}`,
      title: alert.title,
      body: alert.body,
      actionUrl: alert.actionUrl,
      createdAt: new Date(),
      read: true,
      domain: "learning",
      severity: "info",
      requiresAction: false,
      computed: true,
    }));

    const expiring = (certificateQuery.data?.certificates ?? []).filter((certificate: any) => {
      const days = daysUntilExpiry(certificate.expiryDate);
      return days !== null && days <= 90 && days >= 0;
    });
    if (expiring.length > 0) {
      const soonest = expiring.reduce((a: any, b: any) =>
        (daysUntilExpiry(a.expiryDate) ?? 999) < (daysUntilExpiry(b.expiryDate) ?? 999) ? a : b,
      );
      const days = daysUntilExpiry(soonest.expiryDate) ?? 0;
      items.push({
        id: "computed-certificate-expiry",
        title: `${expiring.length} certificate${expiring.length > 1 ? "s" : ""} expiring soon`,
        body: `${soonest.courseTitle ?? "Certificate"} expires in ${days} day${days === 1 ? "" : "s"}`,
        actionUrl: "/certificates",
        createdAt: new Date(),
        read: true,
        domain: "learning",
        severity: "info",
        requiresAction: false,
        computed: true,
      });
    }
    return items;
  }, [ahaQuery.data, certificateQuery.data, learningQuery.data]);

  const durableItems = useMemo<Item[]>(() =>
    (inboxQuery.data?.notifications ?? []).map((notification) => ({
      id: `inapp-${notification.id}`,
      remoteId: notification.id,
      title: notification.title,
      body: notification.body,
      actionUrl: notification.actionUrl,
      createdAt: new Date(notification.createdAt),
      read: notification.read,
      domain: notification.domain ?? "system",
      severity: notification.severity ?? "info",
      requiresAction: notification.requiresAction,
    })),
  [inboxQuery.data?.notifications]);

  const items = useMemo(() => {
    const all = [...durableItems, ...computedItems]
      .filter((item) => filterMatches(item, filter))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return all;
  }, [computedItems, durableItems, filter]);

  const handleOpen = () => setOpen(true);
  const handleItemClick = async (item: Item) => {
    if (item.remoteId && !item.read) await markRead.mutateAsync({ notificationId: `inapp-${item.remoteId}` });
    if (item.actionUrl) {
      navigate(item.actionUrl);
      setOpen(false);
    }
  };

  const iconFor = (item: Item) => {
    if (item.severity === "urgent") return <ShieldAlert className="h-4 w-4 text-red-600" />;
    if (item.domain === "role") return <Users className="h-4 w-4 text-indigo-600" />;
    if (item.domain === "clinical") return <Activity className="h-4 w-4 text-blue-600" />;
    if (item.domain === "learning") return item.title.toLowerCase().includes("certificate") ? <Award className="h-4 w-4 text-amber-600" /> : <BookOpen className="h-4 w-4 text-violet-600" />;
    if (item.domain === "finance") return <Bell className="h-4 w-4 text-emerald-600" />;
    return <Bell className="h-4 w-4 text-slate-500" />;
  };

  const unreadCount = summaryQuery.data?.unreadCount ?? 0;

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="relative h-9 w-9 p-0"
        onClick={handleOpen}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">{unreadCount > 9 ? "9+" : unreadCount}</span>}
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-full max-w-sm p-0">
          <SheetHeader className="border-b px-4 pb-3 pt-4">
            <div className="flex items-center justify-between gap-2">
              <SheetTitle className="text-base font-semibold">Notifications</SheetTitle>
              {unreadCount > 0 && (
                <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs" onClick={() => markAllRead.mutate()} disabled={markAllRead.isPending}>
                  <CheckCheck className="h-3.5 w-3.5" /> Mark all read
                </Button>
              )}
            </div>
            <Tabs value={filter} onValueChange={(value) => setFilter(value as Filter)} className="mt-2">
              <TabsList className="grid h-auto w-full grid-cols-3 gap-1 bg-transparent p-0">
                <TabsTrigger value="all" className="h-8 px-2 text-xs">All</TabsTrigger>
                <TabsTrigger value="action_required" className="h-8 px-2 text-xs">Action</TabsTrigger>
                <TabsTrigger value="clinical" className="h-8 px-2 text-xs">Clinical</TabsTrigger>
              </TabsList>
              <TabsList className="mt-1 grid h-auto w-full grid-cols-3 gap-1 bg-transparent p-0">
                <TabsTrigger value="role" className="h-8 px-2 text-xs">Roles</TabsTrigger>
                <TabsTrigger value="learning" className="h-8 px-2 text-xs">Learning</TabsTrigger>
                <TabsTrigger value="finance" className="h-8 px-2 text-xs">Finance</TabsTrigger>
              </TabsList>
            </Tabs>
          </SheetHeader>

          <ScrollArea className="h-[calc(100vh-150px)]">
            {inboxQuery.isLoading && open ? <div className="p-6 text-center text-sm text-muted-foreground">Loading notifications…</div> : items.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                <Bell className="mb-3 h-10 w-10 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">You’re all caught up.</p>
                <p className="mt-1 text-xs text-muted-foreground">Actionable updates will appear here.</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {items.map((item) => (
                  <button key={item.id} className={`w-full px-4 py-3 text-left transition-colors hover:bg-muted/50 ${!item.read ? "bg-blue-50/60" : ""}`} onClick={() => void handleItemClick(item)}>
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 shrink-0">{iconFor(item)}</div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium leading-snug text-foreground">{item.title}</p>
                        <p className="mt-0.5 line-clamp-3 text-xs text-muted-foreground">{item.body}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          <span className="text-[10px] text-muted-foreground">{formatDistanceToNow(item.createdAt, { addSuffix: true })}</span>
                          {item.requiresAction && <span className="text-[10px] font-medium text-indigo-600">Action required</span>}
                          {item.actionUrl && <span className="flex items-center gap-0.5 text-[10px] text-blue-600"><ExternalLink className="h-2.5 w-2.5" /> Open</span>}
                        </div>
                      </div>
                      {!item.read && <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-500" />}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </>
  );
}
