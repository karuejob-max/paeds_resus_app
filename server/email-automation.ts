/**
 * Email Automation & Scheduling Service
 * Email templates, scheduling, workflows, A/B testing, and analytics
 */

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  htmlContent: string;
  textContent: string;
  variables: string[];
  category: "enrollment" | "payment" | "training" | "certificate" | "reminder" | "feedback" | "custom";
  createdAt: number;
  updatedAt: number;
  isActive: boolean;
}

export interface EmailCampaign {
  id: string;
  name: string;
  templateId: string;
  recipients: EmailRecipient[];
  scheduledTime?: number;
  status: "draft" | "scheduled" | "sending" | "sent" | "failed";
  variables: Record<string, unknown>;
  metadata: Record<string, unknown>;
  createdAt: number;
  sentAt?: number;
  openRate?: number;
  clickRate?: number;
}

export interface EmailRecipient {
  email: string;
  name: string;
  userId?: number;
  variables?: Record<string, unknown>;
  status: "pending" | "sent" | "failed" | "bounced";
  sentAt?: number;
  openedAt?: number;
  clickedAt?: number;
}

export interface EmailWorkflow {
  id: string;
  name: string;
  description: string;
  trigger: WorkflowTrigger;
  steps: WorkflowStep[];
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface WorkflowTrigger {
  type: "enrollment" | "payment" | "course-completion" | "quiz-failure" | "inactivity" | "manual";
  conditions?: Record<string, unknown>;
}

export interface WorkflowStep {
  id: string;
  type: "email" | "delay" | "condition";
  templateId?: string;
  delayDays?: number;
  condition?: Record<string, unknown>;
  order: number;
}

export interface ABTest {
  id: string;
  campaignId: string;
  variants: ABVariant[];
  status: "running" | "completed" | "paused";
  startedAt: number;
  endedAt?: number;
  winner?: string;
}

export interface ABVariant {
  id: string;
  name: string;
  templateId: string;
  percentage: number;
  openRate: number;
  clickRate: number;
  conversionRate: number;
}

export interface EmailAnalytics {
  campaignId: string;
  totalSent: number;
  totalDelivered: number;
  totalBounced: number;
  totalOpened: number;
  totalClicked: number;
  openRate: number;
  clickRate: number;
  bounceRate: number;
  conversionRate: number;
  unsubscribeRate: number;
}

class EmailAutomationService {
  private templates: Map<string, EmailTemplate> = new Map();
  private campaigns: Map<string, EmailCampaign> = new Map();
  private workflows: Map<string, EmailWorkflow> = new Map();
  private abTests: Map<string, ABTest> = new Map();
  private analytics: Map<string, EmailAnalytics> = new Map();
  private bounceList: Set<string> = new Set();
  private unsubscribeList: Set<string> = new Set();

  /**
   * Create email template
   */
  createTemplate(template: Omit<EmailTemplate, "id" | "createdAt" | "updatedAt">): EmailTemplate {
    const id = `template-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = Date.now();

    const newTemplate: EmailTemplate = {
      ...template,
      id,
      createdAt: now,
      updatedAt: now,
    };

    this.templates.set(id, newTemplate);
    return newTemplate;
  }

  /**
   * Get template
   */
  getTemplate(templateId: string): EmailTemplate | null {
    return this.templates.get(templateId) || null;
  }

  /**
   * Create campaign
   */
  createCampaign(campaign: Omit<EmailCampaign, "id" | "createdAt">): EmailCampaign {
    const id = `campaign-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const newCampaign: EmailCampaign = {
      ...campaign,
      id,
      createdAt: Date.now(),
    };

    this.campaigns.set(id, newCampaign);

    // Initialize analytics
    this.analytics.set(id, {
      campaignId: id,
      totalSent: 0,
      totalDelivered: 0,
      totalBounced: 0,
      totalOpened: 0,
      totalClicked: 0,
      openRate: 0,
      clickRate: 0,
      bounceRate: 0,
      conversionRate: 0,
      unsubscribeRate: 0,
    });

    return newCampaign;
  }

  /**
   * Schedule campaign
   */
  scheduleCampaign(campaignId: string, scheduledTime: number): boolean {
    const campaign = this.campaigns.get(campaignId);
    if (!campaign) return false;

    campaign.scheduledTime = scheduledTime;
    campaign.status = "scheduled";

    return true;
  }

  /**
   * Send campaign
   */
  sendCampaign(campaignId: string): boolean {
    const campaign = this.campaigns.get(campaignId);
    if (!campaign) return false;

    campaign.status = "sending";
    let successCount = 0;
    let failureCount = 0;

    for (const recipient of campaign.recipients) {
      // Check bounce and unsubscribe lists
      if (this.bounceList.has(recipient.email) || this.unsubscribeList.has(recipient.email)) {
        recipient.status = "bounced";
        failureCount += 1;
        continue;
      }

      // Simulate sending
      recipient.status = "sent";
      recipient.sentAt = Date.now();
      successCount += 1;
    }

    campaign.status = "sent";
    campaign.sentAt = Date.now();

    // Update analytics
    const analytics = this.analytics.get(campaignId);
    if (analytics) {
      analytics.totalSent = campaign.recipients.length;
      analytics.totalDelivered = successCount;
      analytics.totalBounced = failureCount;
    }

    return true;
  }

  /**
   * Record email open
   */
  recordEmailOpen(campaignId: string, email: string): boolean {
    const campaign = this.campaigns.get(campaignId);
    if (!campaign) return false;

    const recipient = campaign.recipients.find((r) => r.email === email);
    if (!recipient) return false;

    recipient.openedAt = Date.now();

    // Update analytics
    const analytics = this.analytics.get(campaignId);
    if (analytics) {
      analytics.totalOpened += 1;
      analytics.openRate = (analytics.totalOpened / analytics.totalDelivered) * 100;
    }

    return true;
  }

  /**
   * Record email click
   */
  recordEmailClick(campaignId: string, email: string): boolean {
    const campaign = this.campaigns.get(campaignId);
    if (!campaign) return false;

    const recipient = campaign.recipients.find((r) => r.email === email);
    if (!recipient) return false;

    recipient.clickedAt = Date.now();

    // Update analytics
    const analytics = this.analytics.get(campaignId);
    if (analytics) {
      analytics.totalClicked += 1;
      analytics.clickRate = (analytics.totalClicked / analytics.totalDelivered) * 100;
    }

    return true;
  }

  /**
   * Add to bounce list
   */
  addToBounceList(email: string): void {
    this.bounceList.add(email);
  }

  /**
   * Add to unsubscribe list
   */
  addToUnsubscribeList(email: string): void {
    this.unsubscribeList.add(email);
  }

  /**
   * Create workflow
   */
  createWorkflow(workflow: Omit<EmailWorkflow, "id" | "createdAt" | "updatedAt">): EmailWorkflow {
    const id = `workflow-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = Date.now();

    const newWorkflow: EmailWorkflow = {
      ...workflow,
      id,
      createdAt: now,
      updatedAt: now,
    };

    this.workflows.set(id, newWorkflow);
    return newWorkflow;
  }

  /**
   * Get workflow
   */
  getWorkflow(workflowId: string): EmailWorkflow | null {
    return this.workflows.get(workflowId) || null;
  }

  /**
   * Create A/B test
   */
  createABTest(abTest: Omit<ABTest, "id" | "startedAt">): ABTest {
    const id = `abtest-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const newABTest: ABTest = {
      ...abTest,
      id,
      startedAt: Date.now(),
    };

    this.abTests.set(id, newABTest);
    return newABTest;
  }

  /**
   * Get A/B test
   */
  getABTest(abTestId: string): ABTest | null {
    return this.abTests.get(abTestId) || null;
  }

  /**
   * Complete A/B test
   */
  completeABTest(abTestId: string, winnerId: string): boolean {
    const abTest = this.abTests.get(abTestId);
    if (!abTest) return false;

    abTest.status = "completed";
    abTest.endedAt = Date.now();
    abTest.winner = winnerId;

    return true;
  }

  /**
   * Get campaign analytics
   */
  getCampaignAnalytics(campaignId: string): EmailAnalytics | null {
    return this.analytics.get(campaignId) || null;
  }

  /**
   * Get templates
   */
  getTemplates(): EmailTemplate[] {
    return Array.from(this.templates.values());
  }

  /**
   * Get campaigns
   */
  getCampaigns(): EmailCampaign[] {
    return Array.from(this.campaigns.values());
  }

  /**
   * Get workflows
   */
  getWorkflows(): EmailWorkflow[] {
    return Array.from(this.workflows.values());
  }

  /**
   * Get email statistics
   */
  getEmailStatistics(): {
    totalTemplates: number;
    totalCampaigns: number;
    sentCampaigns: number;
    totalWorkflows: number;
    activeWorkflows: number;
    bounceListSize: number;
    unsubscribeListSize: number;
  } {
    const templates = Array.from(this.templates.values());
    const campaigns = Array.from(this.campaigns.values());
    const sentCampaigns = campaigns.filter((c) => c.status === "sent").length;
    const workflows = Array.from(this.workflows.values());
    const activeWorkflows = workflows.filter((w) => w.isActive).length;

    return {
      totalTemplates: templates.length,
      totalCampaigns: campaigns.length,
      sentCampaigns,
      totalWorkflows: workflows.length,
      activeWorkflows,
      bounceListSize: this.bounceList.size,
      unsubscribeListSize: this.unsubscribeList.size,
    };
  }
}

export const emailAutomationService = new EmailAutomationService();
