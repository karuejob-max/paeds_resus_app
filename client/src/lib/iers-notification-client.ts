import {
  initAudioContext,
  isAudioSupported,
  triggerAlert,
} from "./alertSystem";
import { registerServiceWorker } from "./registerSW";

const AUDIO_ENABLED_KEY = "paeds-resus:iers-audio-enabled";

export type IersPushSubscriptionPayload = {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  userAgent?: string;
};

export type IersNotificationPayload = {
  activationEventId: number;
  title: string;
  body: string;
  url: string;
  tag: string;
};

export function isIersAudioEnabled(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(AUDIO_ENABLED_KEY) === "true";
}

/** Must be called from a deliberate user gesture; browsers otherwise suspend audio. */
export async function enableIersAudio(): Promise<boolean> {
  if (typeof window === "undefined" || !isAudioSupported()) return false;
  try {
    initAudioContext();
    window.localStorage.setItem(AUDIO_ENABLED_KEY, "true");
    await triggerAlert("success");
    return true;
  } catch (error) {
    console.warn("[IERS] Foreground audio could not be enabled:", error);
    return false;
  }
}

export function disableIersAudio(): void {
  if (typeof window !== "undefined")
    window.localStorage.removeItem(AUDIO_ENABLED_KEY);
}

export function browserNotificationPermission():
  | NotificationPermission
  | "unsupported" {
  if (typeof window === "undefined" || !("Notification" in window))
    return "unsupported";
  return Notification.permission;
}

export async function requestIersBrowserPermission(): Promise<
  NotificationPermission | "unsupported"
> {
  if (typeof window === "undefined" || !("Notification" in window))
    return "unsupported";
  if (Notification.permission === "default")
    return Notification.requestPermission();
  return Notification.permission;
}

async function getNotificationServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator))
    return null;
  if (String(import.meta.env.VITE_ENABLE_SW ?? "").toLowerCase() !== "true")
    return null;
  const existing = await navigator.serviceWorker.getRegistration("/");
  if (existing) return existing;
  return registerServiceWorker();
}

function encodeSubscription(
  subscription: PushSubscription
): IersPushSubscriptionPayload | null {
  const json = subscription.toJSON();
  if (!json.endpoint || !json.keys?.p256dh || !json.keys.auth) return null;
  return {
    endpoint: json.endpoint,
    keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
    userAgent:
      typeof navigator === "undefined" ? undefined : navigator.userAgent,
  };
}

export async function subscribeIersPush(
  publicKey: string
): Promise<IersPushSubscriptionPayload | null> {
  if (
    typeof window === "undefined" ||
    !("serviceWorker" in navigator) ||
    !("PushManager" in window)
  )
    return null;
  const registration = await getNotificationServiceWorker();
  if (!registration) return null;
  const existing = await registration.pushManager.getSubscription();
  const subscription =
    existing ??
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(
        publicKey
      ) as unknown as ArrayBuffer,
    }));
  return encodeSubscription(subscription);
}

export async function unsubscribeIersPush(
  endpoint?: string
): Promise<string | null> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator))
    return endpoint ?? null;
  const registration = await navigator.serviceWorker.getRegistration("/");
  const subscription = await registration?.pushManager.getSubscription();
  if (!subscription) return endpoint ?? null;
  const current = encodeSubscription(subscription);
  await subscription.unsubscribe();
  return current?.endpoint ?? endpoint ?? null;
}

export async function showIersUrgentNotification(
  payload: IersNotificationPayload
): Promise<void> {
  if (browserNotificationPermission() !== "granted") return;
  try {
    const registration = await getNotificationServiceWorker();
    if (registration) {
      await registration.showNotification(payload.title, {
        body: payload.body,
        icon: "/favicon.png",
        badge: "/favicon.png",
        tag: payload.tag,
        requireInteraction: true,
        renotify: true,
        data: {
          type: "iers_activation",
          activationEventId: payload.activationEventId,
          url: payload.url,
        },
      } as NotificationOptions & { renotify: boolean });
      return;
    }
    const notification = new Notification(payload.title, {
      body: payload.body,
      icon: "/favicon.png",
      tag: payload.tag,
      requireInteraction: true,
    });
    notification.onclick = () => {
      window.focus();
      window.location.assign(payload.url);
      notification.close();
    };
  } catch (error) {
    console.warn("[IERS] Browser notification could not be shown:", error);
  }
}

export function fireIersForegroundAlert(): void {
  if (!isIersAudioEnabled()) return;
  void triggerAlert("critical_action").catch(error => {
    console.warn("[IERS] Foreground alert sound failed:", error);
  });
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let index = 0; index < rawData.length; index += 1) {
    outputArray[index] = rawData.charCodeAt(index);
  }
  return outputArray;
}
