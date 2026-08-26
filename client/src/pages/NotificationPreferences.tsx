import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { ArrowLeft, Bell, Mail, MessageSquare, Smartphone } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

type PreferenceKey =
  | "emailNotifications"
  | "smsNotifications"
  | "pushNotifications"
  | "enrollmentAlerts"
  | "paymentAlerts"
  | "certificateAlerts"
  | "courseUpdates"
  | "quizReminders"
  | "achievementNotifications";

const channels: Array<{
  key: PreferenceKey;
  label: string;
  description: string;
  icon: typeof Mail;
}> = [
  {
    key: "emailNotifications",
    label: "Email notifications",
    description: "Account, course, and important platform updates.",
    icon: Mail,
  },
  {
    key: "smsNotifications",
    label: "SMS notifications",
    description: "SMS reminders when a supported workflow needs them.",
    icon: MessageSquare,
  },
  {
    key: "pushNotifications",
    label: "Browser and device notifications",
    description:
      "In-app and configured push alerts. Urgent IERS alerts still follow the operational fallback policy.",
    icon: Smartphone,
  },
];

const categories: Array<{
  key: PreferenceKey;
  label: string;
  description: string;
}> = [
  {
    key: "enrollmentAlerts",
    label: "Enrollment alerts",
    description: "Updates about course enrollment and access.",
  },
  {
    key: "paymentAlerts",
    label: "Payment alerts",
    description: "Payment status and recovery reminders.",
  },
  {
    key: "certificateAlerts",
    label: "Certificate alerts",
    description: "Certificate issue and availability updates.",
  },
  {
    key: "courseUpdates",
    label: "Course updates",
    description: "Learning-path and course-content updates.",
  },
  {
    key: "quizReminders",
    label: "Quiz reminders",
    description: "Reminders related to learning assessments.",
  },
  {
    key: "achievementNotifications",
    label: "Achievement notifications",
    description: "Milestones and progress acknowledgements.",
  },
];

export default function NotificationPreferences() {
  const { user, loading } = useAuth({ redirectOnUnauthenticated: true });
  const utils = trpc.useUtils();
  const preferencesQuery = trpc.notifications.getPreferences.useQuery(
    undefined,
    {
      enabled: Boolean(user),
      staleTime: 30_000,
    }
  );
  const updateMutation = trpc.notifications.updatePreferences.useMutation({
    onSuccess: async () => {
      await utils.notifications.getPreferences.invalidate();
      toast.success("Notification preference saved.");
    },
    onError: error =>
      toast.error(error.message || "Could not save notification preference."),
  });

  if (loading || preferencesQuery.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Loading notification preferences…
      </div>
    );
  }

  if (!user) return null;

  const preferences = preferencesQuery.data?.preferences;
  const toggle = (key: PreferenceKey) => {
    if (!preferences || updateMutation.isPending) return;
    updateMutation.mutate({ [key]: !preferences[key] });
  };

  return (
    <div className="min-h-screen bg-muted/30 p-4 md:p-8">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex items-start gap-3">
          <Link href="/account">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Back to Account & security"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Notification preferences
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Choose how the platform communicates with you. These settings
              belong to your account, not to your professional cadre or
              workplace access.
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" /> Delivery channels
            </CardTitle>
            <CardDescription>
              Urgent clinical and IERS safety flows retain their documented
              in-app fallback and are never represented as guaranteed delivery.
            </CardDescription>
          </CardHeader>
          <CardContent className="divide-y">
            {channels.map(({ key, label, description, icon: Icon }) => (
              <label
                key={key}
                className="flex cursor-pointer items-start justify-between gap-4 py-4 first:pt-0 last:pb-0"
              >
                <span className="flex items-start gap-3">
                  <Icon className="mt-0.5 h-5 w-5 text-muted-foreground" />
                  <span>
                    <span className="block text-sm font-medium">{label}</span>
                    <span className="mt-1 block text-xs text-muted-foreground">
                      {description}
                    </span>
                  </span>
                </span>
                <input
                  type="checkbox"
                  checked={Boolean(preferences?.[key])}
                  onChange={() => toggle(key)}
                  aria-label={label}
                  className="mt-1 h-4 w-4 accent-primary"
                />
              </label>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notification topics</CardTitle>
            <CardDescription>
              Turn off non-urgent topics without losing mandatory safety,
              security, or access notices.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {categories.map(({ key, label, description }) => (
              <div
                key={key}
                className="flex items-start justify-between gap-4 rounded-lg border p-3"
              >
                <div>
                  <Label className="text-sm font-medium">{label}</Label>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {description}
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={Boolean(preferences?.[key])}
                  onChange={() => toggle(key)}
                  aria-label={label}
                  className="mt-1 h-4 w-4 accent-primary"
                />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
