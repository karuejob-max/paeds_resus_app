/**
 * NotificationBell.tsx
 *
 * Unified notification bell for the Header.
 * Shows an unread count badge and opens a dropdown sheet with:
 *   1. Course progress alerts (in-progress courses, not-started enrolled courses)
 *   2. Certificate expiry warnings (expiring within 90 days)
 *   3. Care Signal review responses
 */

import { useState, useMemo } from 'react';
import { Bell, CheckCheck, ExternalLink, BookOpen, Award, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { trpc } from '@/lib/trpc';
import { useLocation } from 'wouter';
import { formatDistanceToNow, differenceInDays } from 'date-fns';

// ── Types ──────────────────────────────────────────────────────────────────────

type LocalNotification = {
  id: string;
  type: 'course_resume' | 'course_start' | 'cert_expiry' | 'care_signal' | 'achievement' | 'alert' | 'system';
  title: string;
  body: string;
  actionUrl?: string;
  createdAt?: Date;
  read?: boolean;
  // For remote notifications
  remoteId?: number;
};

// ── Helpers ────────────────────────────────────────────────────────────────────

function daysUntilExpiry(expiryDate: string | Date | null | undefined): number | null {
  if (!expiryDate) return null;
  return differenceInDays(new Date(expiryDate), new Date());
}

// ── Component ──────────────────────────────────────────────────────────────────

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [, navigate] = useLocation();

  // Remote: Care Signal notifications
  const { data: countData, refetch: refetchCount } = trpc.careSignalReview.getUnreadCount.useQuery(
    undefined,
    { refetchInterval: 60_000 }
  );
  const { data: remoteNotifications, refetch: refetchList } = trpc.careSignalReview.getMyNotifications.useQuery(
    { limit: 20, unreadOnly: false },
    { enabled: open }
  );

  // Local: Course enrollments
  const { data: enrollmentsData } = trpc.courses.getUserEnrollments.useQuery(undefined, {
    refetchInterval: 120_000,
  });

  // Local: Certificates
  const { data: certResponse } = trpc.certificates.getMyCertificates.useQuery(undefined, {
    refetchInterval: 120_000,
  });
  const certData = certResponse?.certificates ?? [];

  const markReadMutation = trpc.careSignalReview.markRead.useMutation({
    onSuccess: () => { refetchCount(); refetchList(); },
  });
  const markAllReadMutation = trpc.careSignalReview.markAllRead.useMutation({
    onSuccess: () => { refetchCount(); refetchList(); },
  });

  // ── Build local notifications from enrollments + certs ─────────────────────
  const localNotifications = useMemo<LocalNotification[]>(() => {
    const items: LocalNotification[] = [];
    const enrollments = enrollmentsData ?? [];

    // In-progress courses (up to 3)
    const inProgress = enrollments.filter(
      (e: any) => e.status === 'in_progress' && (e.progressPercentage ?? 0) > 0
    );
    inProgress.slice(0, 3).forEach((e: any) => {
      items.push({
        id: `resume-${e.id}`,
        type: 'course_resume',
        title: `Continue: ${e.course?.title ?? 'Course'}`,
        body: `${e.progressPercentage ?? 0}% complete — pick up where you left off`,
        actionUrl: `/micro-course/${e.course?.courseId}`,
        createdAt: new Date(),
        read: false,
      });
    });

    // Not-started enrolled courses
    const notStarted = enrollments.filter(
      (e: any) => e.status === 'enrolled' && (e.progressPercentage ?? 0) === 0
    );
    if (notStarted.length > 0) {
      items.push({
        id: 'not-started',
        type: 'course_start',
        title: `${notStarted.length} enrolled course${notStarted.length > 1 ? 's' : ''} not yet started`,
        body: 'Start learning to earn your certificate',
        actionUrl: '/fellowship',
        createdAt: new Date(),
        read: false,
      });
    }

    // Certificates expiring within 90 days
    const certs = certData ?? [];
    const expiring = certs.filter((c: any) => {
      const days = daysUntilExpiry(c.expiryDate);
      return days !== null && days <= 90 && days >= 0;
    });
    if (expiring.length > 0) {
      const soonest = expiring.reduce((a: any, b: any) => {
        const da = daysUntilExpiry(a.expiryDate) ?? 999;
        const db = daysUntilExpiry(b.expiryDate) ?? 999;
        return da < db ? a : b;
      });
      const days = daysUntilExpiry(soonest.expiryDate);
      items.push({
        id: 'cert-expiry',
        type: 'cert_expiry',
        title: `${expiring.length} certificate${expiring.length > 1 ? 's' : ''} expiring soon`,
        body: `${soonest.courseTitle ?? 'Certificate'} expires in ${days} day${days === 1 ? '' : 's'}`,
        actionUrl: '/certificates',
        createdAt: new Date(),
        read: false,
      });
    }

    return items;
  }, [enrollmentsData, certData]); // certData is already the array from certResponse?.certificates ?? []

  // ── Merge remote + local notifications ─────────────────────────────────────
  const allNotifications = useMemo<LocalNotification[]>(() => {
    const remote: LocalNotification[] = (remoteNotifications ?? []).map((n: any) => ({
      id: `remote-${n.id}`,
      type: n.type as LocalNotification['type'],
      title: n.title,
      body: n.body,
      actionUrl: n.actionUrl ?? undefined,
      createdAt: new Date(n.createdAt),
      read: n.read,
      remoteId: n.id,
    }));
    // Local notifications first (most actionable), then remote
    return [...localNotifications, ...remote];
  }, [localNotifications, remoteNotifications]);

  // Total unread = local (always unread) + remote unread
  const remoteUnread = countData?.count ?? 0;
  const totalUnread = localNotifications.length + remoteUnread;

  const handleOpen = () => {
    setOpen(true);
    refetchList();
  };

  const handleNotificationClick = async (n: LocalNotification) => {
    if (n.remoteId && !n.read) {
      await markReadMutation.mutateAsync({ notificationId: n.remoteId });
    }
    if (n.actionUrl) {
      navigate(n.actionUrl);
      setOpen(false);
    }
  };

  // ── Icon per type ───────────────────────────────────────────────────────────
  const typeIcon: Record<LocalNotification['type'], React.ReactNode> = {
    course_resume: <BookOpen className="h-4 w-4 text-violet-500 flex-shrink-0 mt-0.5" />,
    course_start:  <BookOpen className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />,
    cert_expiry:   <Award className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />,
    care_signal:   <Activity className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />,
    achievement:   <Award className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />,
    alert:         <Bell className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />,
    system:        <Bell className="h-4 w-4 text-slate-400 flex-shrink-0 mt-0.5" />,
  };

  const typeBg: Record<LocalNotification['type'], string> = {
    course_resume: 'bg-violet-50/60',
    course_start:  'bg-blue-50/40',
    cert_expiry:   'bg-amber-50/60',
    care_signal:   'bg-blue-50/60',
    achievement:   'bg-green-50/40',
    alert:         'bg-red-50/40',
    system:        '',
  };

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="relative h-9 w-9 p-0"
        onClick={handleOpen}
        aria-label={`Notifications${totalUnread > 0 ? ` (${totalUnread} unread)` : ''}`}
      >
        <Bell className="h-5 w-5" />
        {totalUnread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {totalUnread > 9 ? '9+' : totalUnread}
          </span>
        )}
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-full max-w-sm p-0">
          <SheetHeader className="flex flex-row items-center justify-between px-4 pt-4 pb-2 border-b">
            <SheetTitle className="text-base font-semibold">Notifications</SheetTitle>
            {remoteUnread > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs gap-1 text-muted-foreground"
                onClick={() => markAllReadMutation.mutate()}
                disabled={markAllReadMutation.isPending}
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Mark all read
              </Button>
            )}
          </SheetHeader>

          <ScrollArea className="h-[calc(100vh-80px)]">
            {allNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                <Bell className="h-10 w-10 text-muted-foreground/40 mb-3" />
                <p className="text-sm text-muted-foreground">You're all caught up.</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Course updates and alerts will appear here.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {allNotifications.map(n => (
                  <button
                    key={n.id}
                    className={`w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors ${
                      typeBg[n.type]
                    } ${!n.read && n.remoteId ? 'bg-blue-50/60' : ''}`}
                    onClick={() => handleNotificationClick(n)}
                  >
                    <div className="flex items-start gap-3">
                      {/* Type icon */}
                      <div className="mt-0.5">
                        {typeIcon[n.type]}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground leading-snug">
                          {n.title}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                          {n.body}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          {n.createdAt && (
                            <span className="text-[10px] text-muted-foreground">
                              {formatDistanceToNow(n.createdAt, { addSuffix: true })}
                            </span>
                          )}
                          {n.actionUrl && (
                            <span className="text-[10px] text-blue-500 flex items-center gap-0.5">
                              <ExternalLink className="h-2.5 w-2.5" />
                              View
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Unread dot for remote notifications */}
                      {!n.read && n.remoteId && (
                        <div className="mt-1.5 flex-shrink-0 h-2 w-2 rounded-full bg-blue-500" />
                      )}
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
