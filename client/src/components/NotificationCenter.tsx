import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Bell,
  X,
  CheckCircle,
  AlertCircle,
  Award,
  BookOpen,
  CreditCard,
  Settings,
  Trash2,
  Check,
} from "lucide-react";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
  actionUrl?: string;
  actionLabel?: string;
}

export default function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const { data: notificationsData, refetch } = trpc.notifications.getNotifications.useQuery({
    limit: 20,
  });

  const { data: unreadData } = trpc.notifications.getUnreadCount.useQuery();

  const markAsReadMutation = trpc.notifications.markAsRead.useMutation();
  const markAllAsReadMutation = trpc.notifications.markAllAsRead.useMutation();
  const deleteNotificationMutation = trpc.notifications.deleteNotification.useMutation();
  const clearAllMutation = trpc.notifications.clearAll.useMutation();
  const { data: preferencesData } = trpc.notifications.getPreferences.useQuery();
  const updatePreferencesMutation = trpc.notifications.updatePreferences.useMutation();

  useEffect(() => {
    if (notificationsData) {
      setNotifications(notificationsData.notifications);
    }
  }, [notificationsData]);

  useEffect(() => {
    if (unreadData) {
      setUnreadCount(unreadData.unreadCount);
    }
  }, [unreadData]);

  const handleMarkAsRead = async (notificationId: string) => {
    await markAsReadMutation.mutateAsync({ notificationId });
    refetch();
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsReadMutation.mutateAsync();
    refetch();
  };

  const handleDelete = async (notificationId: string) => {
    await deleteNotificationMutation.mutateAsync({ notificationId });
    refetch();
  };

  const handleClearAll = async () => {
    if (confirm("Are you sure you want to clear all notifications?")) {
      await clearAllMutation.mutateAsync();
      refetch();
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "enrollment":
        return <BookOpen className="w-4 h-4 text-blue-500" />;
      case "payment":
        return <CreditCard className="w-4 h-4 text-green-500" />;
      case "certificate":
        return <Award className="w-4 h-4 text-purple-500" />;
      case "achievement":
        return <Award className="w-4 h-4 text-yellow-500" />;
      case "system":
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Bell className="w-4 h-4 text-gray-500" />;
    }
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return new Date(date).toLocaleDateString();
  };

  return (
    <>
      {/* Notification Bell */}
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="relative p-2 text-gray-600 hover:text-gray-900 transition"
        >
          <Bell className="w-6 h-6" />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>

        {/* Notification Dropdown */}
        {isOpen && (
          <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl z-50 max-h-96 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">Notifications</h3>
              <div className="flex gap-2">
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleMarkAllAsRead}
                    className="flex items-center gap-1"
                  >
                    <Check className="w-4 h-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSettings(!showSettings)}
                >
                  <Settings className="w-4 h-4" />
                </Button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Settings Panel */}
            {showSettings && preferencesData && (
              <div className="p-4 border-b border-gray-200 bg-gray-50 max-h-48 overflow-y-auto">
                <h4 className="font-semibold text-sm text-gray-900 mb-3">Preferences</h4>
                <div className="space-y-2">
                  {[
                    { key: "enrollmentAlerts", label: "Enrollment Alerts" },
                    { key: "paymentAlerts", label: "Payment Alerts" },
                    { key: "certificateAlerts", label: "Certificate Alerts" },
                    { key: "courseUpdates", label: "Course Updates" },
                    { key: "quizReminders", label: "Quiz Reminders" },
                    { key: "achievementNotifications", label: "Achievements" },
                  ].map((pref) => (
                    <label key={pref.key} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={
                          Boolean(
                            preferencesData.preferences[
                              pref.key as keyof typeof preferencesData.preferences
                            ]
                          ) || false
                        }
                        onChange={(e) => {
                          updatePreferencesMutation.mutate({
                            [pref.key]: e.target.checked,
                          });
                        }}
                        className="w-4 h-4"
                      />
                      <span className="text-sm text-gray-700">{pref.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Notifications List */}
            <div className="flex-1 overflow-y-auto">
              {notifications.length > 0 ? (
                <div className="divide-y divide-gray-100">
                  {notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={`p-4 hover:bg-gray-50 transition cursor-pointer ${
                        !notif.read ? "bg-blue-50" : ""
                      }`}
                      onClick={() => !notif.read && handleMarkAsRead(notif.id)}
                    >
                      <div className="flex gap-3">
                        <div className="flex-shrink-0">
                          {getNotificationIcon(notif.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <p className="text-sm font-semibold text-gray-900">
                              {notif.title}
                            </p>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(notif.id);
                              }}
                              className="text-gray-400 hover:text-gray-600"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                            {notif.message}
                          </p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-gray-500">
                              {formatDate(notif.createdAt)}
                            </span>
                            {notif.actionUrl && (
                              <a
                                href={notif.actionUrl}
                                className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {notif.actionLabel || "View"}
                              </a>
                            )}
                          </div>
                        </div>
                        {!notif.read && (
                          <div className="flex-shrink-0 w-2 h-2 bg-blue-600 rounded-full mt-2" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-gray-500">
                  <Bell className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No notifications yet</p>
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="p-3 border-t border-gray-200 bg-gray-50 flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={handleClearAll}
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Clear All
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
