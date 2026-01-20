/**
 * Mobile App Features & Native Integration Service
 * Offline access, push notifications, native features, and mobile optimization
 */

export interface OfflineCourse {
  id: string;
  courseId: string;
  userId: number;
  lessons: OfflineLesson[];
  downloadedAt: number;
  lastSyncedAt: number;
  storageSize: number;
  isDownloaded: boolean;
}

export interface OfflineLesson {
  id: string;
  lessonId: string;
  title: string;
  content: string;
  videoUrl?: string;
  videoSize?: number;
  isDownloaded: boolean;
}

export interface PushNotification {
  id: string;
  userId: number;
  title: string;
  body: string;
  type: "enrollment" | "payment" | "training" | "achievement" | "reminder" | "announcement";
  data: Record<string, unknown>;
  sentAt: number;
  readAt?: number;
  actionUrl?: string;
  isRead: boolean;
}

export interface DeviceRegistration {
  id: string;
  userId: number;
  deviceId: string;
  deviceType: "ios" | "android" | "web";
  deviceName: string;
  osVersion: string;
  appVersion: string;
  pushToken: string;
  isActive: boolean;
  lastActiveAt: number;
  registeredAt: number;
}

export interface NativeFeature {
  id: string;
  name: string;
  type: "camera" | "microphone" | "location" | "contacts" | "calendar" | "files";
  isEnabled: boolean;
  permissions: string[];
  lastUsedAt?: number;
}

export interface MobileAnalytics {
  userId: number;
  deviceId: string;
  sessionId: string;
  appVersion: string;
  osVersion: string;
  deviceType: "ios" | "android" | "web";
  sessionStart: number;
  sessionEnd?: number;
  screenViews: ScreenView[];
  crashes: CrashLog[];
  performance: PerformanceMetrics;
}

export interface ScreenView {
  screen: string;
  timestamp: number;
  duration: number;
  interactions: number;
}

export interface CrashLog {
  id: string;
  timestamp: number;
  errorMessage: string;
  stackTrace: string;
  breadcrumbs: string[];
  userId: number;
  deviceId: string;
}

export interface PerformanceMetrics {
  appStartTime: number;
  memoryUsage: number;
  cpuUsage: number;
  networkLatency: number;
  frameRate: number;
  batteryUsage: number;
}

class MobileAppService {
  private offlineCourses: Map<string, OfflineCourse> = new Map();
  private pushNotifications: Map<string, PushNotification> = new Map();
  private deviceRegistrations: Map<string, DeviceRegistration> = new Map();
  private nativeFeatures: Map<string, NativeFeature> = new Map();
  private mobileAnalytics: Map<string, MobileAnalytics> = new Map();

  /**
   * Register device for push notifications
   */
  registerDevice(userId: number, deviceId: string, deviceType: "ios" | "android" | "web", pushToken: string, deviceInfo: Record<string, unknown>): DeviceRegistration {
    const id = `device-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const registration: DeviceRegistration = {
      id,
      userId,
      deviceId,
      deviceType,
      deviceName: (deviceInfo.deviceName as string) || "Unknown Device",
      osVersion: (deviceInfo.osVersion as string) || "Unknown",
      appVersion: (deviceInfo.appVersion as string) || "1.0.0",
      pushToken,
      isActive: true,
      lastActiveAt: Date.now(),
      registeredAt: Date.now(),
    };

    this.deviceRegistrations.set(id, registration);
    return registration;
  }

  /**
   * Send push notification
   */
  sendPushNotification(userId: number, notification: Omit<PushNotification, "id" | "sentAt" | "isRead">): PushNotification {
    const id = `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const pushNotif: PushNotification = {
      ...notification,
      id,
      sentAt: Date.now(),
      isRead: false,
    };

    this.pushNotifications.set(id, pushNotif);
    return pushNotif;
  }

  /**
   * Get push notifications for user
   */
  getUserNotifications(userId: number): PushNotification[] {
    return Array.from(this.pushNotifications.values()).filter((n) => n.userId === userId);
  }

  /**
   * Mark notification as read
   */
  markNotificationAsRead(notificationId: string): boolean {
    const notif = this.pushNotifications.get(notificationId);
    if (!notif) return false;

    notif.isRead = true;
    notif.readAt = Date.now();
    return true;
  }

  /**
   * Download course for offline access
   */
  downloadCourseForOffline(userId: number, courseId: string, lessons: OfflineLesson[]): OfflineCourse {
    const id = `offline-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const totalSize = lessons.reduce((sum, l) => sum + (l.videoSize || 0), 0);

    const offlineCourse: OfflineCourse = {
      id,
      courseId,
      userId,
      lessons,
      downloadedAt: Date.now(),
      lastSyncedAt: Date.now(),
      storageSize: totalSize,
      isDownloaded: true,
    };

    this.offlineCourses.set(id, offlineCourse);
    return offlineCourse;
  }

  /**
   * Get offline courses for user
   */
  getUserOfflineCourses(userId: number): OfflineCourse[] {
    return Array.from(this.offlineCourses.values()).filter((c) => c.userId === userId);
  }

  /**
   * Sync offline course
   */
  syncOfflineCourse(offlineCourseId: string): boolean {
    const course = this.offlineCourses.get(offlineCourseId);
    if (!course) return false;

    course.lastSyncedAt = Date.now();
    return true;
  }

  /**
   * Request native feature permission
   */
  requestNativeFeature(featureName: string, featureType: "camera" | "microphone" | "location" | "contacts" | "calendar" | "files"): NativeFeature {
    const id = `feature-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const feature: NativeFeature = {
      id,
      name: featureName,
      type: featureType,
      isEnabled: false,
      permissions: this.getPermissionsForFeature(featureType),
    };

    this.nativeFeatures.set(id, feature);
    return feature;
  }

  /**
   * Grant native feature permission
   */
  grantNativeFeaturePermission(featureId: string): boolean {
    const feature = this.nativeFeatures.get(featureId);
    if (!feature) return false;

    feature.isEnabled = true;
    feature.lastUsedAt = Date.now();
    return true;
  }

  /**
   * Get permissions for feature type
   */
  private getPermissionsForFeature(featureType: string): string[] {
    const permissionMap: Record<string, string[]> = {
      camera: ["android.permission.CAMERA", "NSCameraUsageDescription"],
      microphone: ["android.permission.RECORD_AUDIO", "NSMicrophoneUsageDescription"],
      location: ["android.permission.ACCESS_FINE_LOCATION", "NSLocationWhenInUseUsageDescription"],
      contacts: ["android.permission.READ_CONTACTS", "NSContactsUsageDescription"],
      calendar: ["android.permission.READ_CALENDAR", "NSCalendarsUsageDescription"],
      files: ["android.permission.READ_EXTERNAL_STORAGE", "NSDocumentBrowserUsageDescription"],
    };

    return permissionMap[featureType] || [];
  }

  /**
   * Log mobile analytics
   */
  logMobileAnalytics(userId: number, deviceId: string, analytics: Omit<MobileAnalytics, "userId" | "deviceId">): MobileAnalytics {
    const id = `analytics-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const mobileAnalytics: MobileAnalytics = {
      ...analytics,
      userId,
      deviceId,
    };

    this.mobileAnalytics.set(id, mobileAnalytics);
    return mobileAnalytics;
  }

  /**
   * Get mobile analytics
   */
  getMobileAnalytics(userId: number): MobileAnalytics[] {
    return Array.from(this.mobileAnalytics.values()).filter((a) => a.userId === userId);
  }

  /**
   * Report crash
   */
  reportCrash(userId: number, deviceId: string, error: Error, breadcrumbs: string[]): CrashLog {
    const id = `crash-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const crash: CrashLog = {
      id,
      timestamp: Date.now(),
      errorMessage: error.message,
      stackTrace: error.stack || "",
      breadcrumbs,
      userId,
      deviceId,
    };

    return crash;
  }

  /**
   * Get device registrations for user
   */
  getUserDevices(userId: number): DeviceRegistration[] {
    return Array.from(this.deviceRegistrations.values()).filter((d) => d.userId === userId);
  }

  /**
   * Deregister device
   */
  deregisterDevice(deviceId: string): boolean {
    const device = Array.from(this.deviceRegistrations.values()).find((d) => d.deviceId === deviceId);
    if (!device) return false;

    device.isActive = false;
    return true;
  }

  /**
   * Get mobile statistics
   */
  getMobileStatistics(): {
    totalDevices: number;
    activeDevices: number;
    totalNotifications: number;
    readNotifications: number;
    offlineCoursesDownloaded: number;
    totalCrashes: number;
  } {
    const devices = Array.from(this.deviceRegistrations.values());
    const activeDevices = devices.filter((d) => d.isActive).length;
    const notifications = Array.from(this.pushNotifications.values());
    const readNotifications = notifications.filter((n) => n.isRead).length;
    const offlineCourses = Array.from(this.offlineCourses.values());

    return {
      totalDevices: devices.length,
      activeDevices,
      totalNotifications: notifications.length,
      readNotifications,
      offlineCoursesDownloaded: offlineCourses.length,
      totalCrashes: 0,
    };
  }
}

export const mobileAppService = new MobileAppService();
