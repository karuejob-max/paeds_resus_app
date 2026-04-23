/**
 * NotificationBell.tsx
 *
 * Phase 7.4 — In-app notification bell for Care Signal review responses.
 * Shows an unread count badge on the bell icon in the Header.
 * Opens a popover/sheet with the provider's notification inbox.
 */

import { useState } from 'react';
import { Bell, CheckCheck, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { trpc } from '@/lib/trpc';
import { useLocation } from 'wouter';
import { formatDistanceToNow } from 'date-fns';

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [, navigate] = useLocation();

  const { data: countData, refetch: refetchCount } = trpc.careSignalReview.getUnreadCount.useQuery(
    undefined,
    { refetchInterval: 60_000 } // poll every 60s
  );

  const { data: notifications, refetch: refetchList } = trpc.careSignalReview.getMyNotifications.useQuery(
    { limit: 30, unreadOnly: false },
    { enabled: open }
  );

  const markReadMutation = trpc.careSignalReview.markRead.useMutation({
    onSuccess: () => { refetchCount(); refetchList(); },
  });

  const markAllReadMutation = trpc.careSignalReview.markAllRead.useMutation({
    onSuccess: () => { refetchCount(); refetchList(); },
  });

  const unreadCount = countData?.count ?? 0;

  const handleOpen = () => {
    setOpen(true);
    refetchList();
  };

  const handleNotificationClick = async (notification: {
    id: number;
    read: boolean;
    actionUrl: string | null;
  }) => {
    if (!notification.read) {
      await markReadMutation.mutateAsync({ notificationId: notification.id });
    }
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
      setOpen(false);
    }
  };

  const typeColors: Record<string, string> = {
    care_signal_review: 'bg-blue-100 text-blue-800',
    achievement: 'bg-green-100 text-green-800',
    alert: 'bg-red-100 text-red-800',
    system: 'bg-gray-100 text-gray-800',
  };

  const typeLabels: Record<string, string> = {
    care_signal_review: 'Care Signal',
    achievement: 'Achievement',
    alert: 'Alert',
    system: 'System',
  };

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="relative h-9 w-9 p-0"
        onClick={handleOpen}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-full max-w-sm p-0">
          <SheetHeader className="flex flex-row items-center justify-between px-4 pt-4 pb-2 border-b">
            <SheetTitle className="text-base font-semibold">Notifications</SheetTitle>
            {unreadCount > 0 && (
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
            {!notifications || notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                <Bell className="h-10 w-10 text-muted-foreground/40 mb-3" />
                <p className="text-sm text-muted-foreground">No notifications yet.</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Care Signal review responses will appear here.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {notifications.map(notification => (
                  <button
                    key={notification.id}
                    className={`w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors ${
                      !notification.read ? 'bg-blue-50/60' : ''
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start gap-3">
                      {/* Unread dot */}
                      <div className="mt-1.5 flex-shrink-0">
                        {!notification.read ? (
                          <div className="h-2 w-2 rounded-full bg-blue-500" />
                        ) : (
                          <div className="h-2 w-2 rounded-full bg-transparent" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        {/* Type badge */}
                        <span
                          className={`inline-block text-[10px] font-medium px-1.5 py-0.5 rounded mb-1 ${
                            typeColors[notification.type] ?? 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {typeLabels[notification.type] ?? notification.type}
                        </span>

                        <p className="text-sm font-medium text-foreground leading-snug truncate">
                          {notification.title}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                          {notification.body}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] text-muted-foreground">
                            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                          </span>
                          {notification.actionUrl && (
                            <span className="text-[10px] text-blue-500 flex items-center gap-0.5">
                              <ExternalLink className="h-2.5 w-2.5" />
                              View
                            </span>
                          )}
                        </div>
                      </div>
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
