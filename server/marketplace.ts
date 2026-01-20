/**
 * Marketplace & Extensions Service
 * Third-party integrations, plugins, and extensions marketplace
 */

export interface Extension {
  id: string;
  name: string;
  description: string;
  category: "integration" | "plugin" | "theme" | "widget" | "analytics" | "payment";
  author: string;
  version: string;
  rating: number;
  downloads: number;
  price: number;
  isActive: boolean;
  isVerified: boolean;
  permissions: string[];
  webhookUrl?: string;
  apiKey?: string;
  createdAt: number;
  updatedAt: number;
}

export interface ExtensionInstallation {
  id: string;
  extensionId: string;
  organizationId: string;
  userId: number;
  status: "installed" | "active" | "disabled" | "pending";
  configuration: Record<string, unknown>;
  installedAt: number;
  lastUpdatedAt: number;
}

export interface Webhook {
  id: string;
  extensionId: string;
  event: string;
  url: string;
  isActive: boolean;
  retryPolicy: {
    maxRetries: number;
    backoffMultiplier: number;
  };
  createdAt: number;
}

export interface ExtensionReview {
  id: string;
  extensionId: string;
  userId: number;
  rating: number;
  comment: string;
  createdAt: number;
}

export interface ExtensionLog {
  id: string;
  extensionId: string;
  organizationId: string;
  eventType: string;
  message: string;
  status: "success" | "error" | "warning";
  timestamp: number;
}

class MarketplaceService {
  private extensions: Map<string, Extension> = new Map();
  private installations: Map<string, ExtensionInstallation> = new Map();
  private webhooks: Map<string, Webhook> = new Map();
  private reviews: Map<string, ExtensionReview> = new Map();
  private logs: Map<string, ExtensionLog> = new Map();

  /**
   * Create extension
   */
  createExtension(extension: Omit<Extension, "id" | "createdAt" | "updatedAt">): Extension {
    const id = `ext-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = Date.now();

    const newExtension: Extension = {
      ...extension,
      id,
      createdAt: now,
      updatedAt: now,
    };

    this.extensions.set(id, newExtension);
    return newExtension;
  }

  /**
   * Get extension
   */
  getExtension(extensionId: string): Extension | null {
    return this.extensions.get(extensionId) || null;
  }

  /**
   * List extensions
   */
  listExtensions(filters?: { category?: string; verified?: boolean }): Extension[] {
    let exts = Array.from(this.extensions.values());

    if (filters?.category) {
      exts = exts.filter((e) => e.category === filters.category);
    }
    if (filters?.verified !== undefined) {
      exts = exts.filter((e) => e.isVerified === filters.verified);
    }

    return exts.sort((a, b) => b.downloads - a.downloads);
  }

  /**
   * Install extension
   */
  installExtension(extensionId: string, organizationId: string, userId: number, config?: Record<string, unknown>): ExtensionInstallation {
    const id = `install-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const installation: ExtensionInstallation = {
      id,
      extensionId,
      organizationId,
      userId,
      status: "pending",
      configuration: config || {},
      installedAt: Date.now(),
      lastUpdatedAt: Date.now(),
    };

    this.installations.set(id, installation);

    // Update extension download count
    const ext = this.extensions.get(extensionId);
    if (ext) {
      ext.downloads += 1;
    }

    return installation;
  }

  /**
   * Get installations for organization
   */
  getOrganizationInstallations(organizationId: string): ExtensionInstallation[] {
    return Array.from(this.installations.values()).filter((i) => i.organizationId === organizationId);
  }

  /**
   * Activate extension
   */
  activateExtension(installationId: string): boolean {
    const installation = this.installations.get(installationId);
    if (!installation) return false;

    installation.status = "active";
    installation.lastUpdatedAt = Date.now();
    return true;
  }

  /**
   * Disable extension
   */
  disableExtension(installationId: string): boolean {
    const installation = this.installations.get(installationId);
    if (!installation) return false;

    installation.status = "disabled";
    installation.lastUpdatedAt = Date.now();
    return true;
  }

  /**
   * Register webhook
   */
  registerWebhook(extensionId: string, event: string, url: string): Webhook {
    const id = `webhook-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const webhook: Webhook = {
      id,
      extensionId,
      event,
      url,
      isActive: true,
      retryPolicy: {
        maxRetries: 3,
        backoffMultiplier: 2,
      },
      createdAt: Date.now(),
    };

    this.webhooks.set(id, webhook);
    return webhook;
  }

  /**
   * Get webhooks for extension
   */
  getExtensionWebhooks(extensionId: string): Webhook[] {
    return Array.from(this.webhooks.values()).filter((w) => w.extensionId === extensionId);
  }

  /**
   * Create review
   */
  createReview(extensionId: string, userId: number, rating: number, comment: string): ExtensionReview {
    const id = `review-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const review: ExtensionReview = {
      id,
      extensionId,
      userId,
      rating,
      comment,
      createdAt: Date.now(),
    };

    this.reviews.set(id, review);

    // Update extension rating
    this.updateExtensionRating(extensionId);

    return review;
  }

  /**
   * Get reviews for extension
   */
  getExtensionReviews(extensionId: string): ExtensionReview[] {
    return Array.from(this.reviews.values()).filter((r) => r.extensionId === extensionId);
  }

  /**
   * Update extension rating
   */
  private updateExtensionRating(extensionId: string): void {
    const ext = this.extensions.get(extensionId);
    if (!ext) return;

    const reviews = this.getExtensionReviews(extensionId);
    if (reviews.length === 0) return;

    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    ext.rating = Math.round(avgRating * 10) / 10;
  }

  /**
   * Log extension event
   */
  logEvent(extensionId: string, organizationId: string, eventType: string, message: string, status: "success" | "error" | "warning"): ExtensionLog {
    const id = `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const log: ExtensionLog = {
      id,
      extensionId,
      organizationId,
      eventType,
      message,
      status,
      timestamp: Date.now(),
    };

    this.logs.set(id, log);
    return log;
  }

  /**
   * Get extension logs
   */
  getExtensionLogs(extensionId: string, organizationId?: string): ExtensionLog[] {
    let logs = Array.from(this.logs.values()).filter((l) => l.extensionId === extensionId);

    if (organizationId) {
      logs = logs.filter((l) => l.organizationId === organizationId);
    }

    return logs.sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Get marketplace statistics
   */
  getStatistics(): {
    totalExtensions: number;
    verifiedExtensions: number;
    totalInstallations: number;
    activeInstallations: number;
    totalReviews: number;
    averageRating: number;
  } {
    const extensions = Array.from(this.extensions.values());
    const verifiedExtensions = extensions.filter((e) => e.isVerified).length;
    const installations = Array.from(this.installations.values());
    const activeInstallations = installations.filter((i) => i.status === "active").length;
    const reviews = Array.from(this.reviews.values());
    const averageRating = reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;

    return {
      totalExtensions: extensions.length,
      verifiedExtensions,
      totalInstallations: installations.length,
      activeInstallations,
      totalReviews: reviews.length,
      averageRating: Math.round(averageRating * 10) / 10,
    };
  }
}

export const marketplaceService = new MarketplaceService();
