/**
 * Google Workspace Integration Service
 * Handles Gmail, Google Calendar, and Google Drive operations
 */

export interface GoogleCalendarEvent {
  id: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  attendees?: string[];
  location?: string;
  isAllDay?: boolean;
}

export interface GoogleDriveFile {
  id: string;
  name: string;
  mimeType: string;
  webViewLink: string;
  createdTime: Date;
  modifiedTime: Date;
  size?: number;
  owner?: string;
}

export interface EmailTemplate {
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  body: string;
  htmlBody?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer;
    mimeType: string;
  }>;
}

class GoogleWorkspaceService {
  private organizationEmail = "paedsresus254@gmail.com";
  private eventQueue: GoogleCalendarEvent[] = [];
  private sentEmails: Array<{ to: string[]; subject: string; timestamp: Date }> = [];

  /**
   * Send email via Gmail
   */
  async sendEmail(template: EmailTemplate): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      // In production, this would use Google Gmail API
      // For now, we'll simulate the email sending
      console.log(`[Gmail] Sending email to ${template.to.join(", ")}`);
      console.log(`Subject: ${template.subject}`);

      const messageId = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      this.sentEmails.push({
        to: template.to,
        subject: template.subject,
        timestamp: new Date(),
      });

      return {
        success: true,
        messageId,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Send enrollment confirmation email
   */
  async sendEnrollmentConfirmation(
    recipientEmail: string,
    recipientName: string,
    courseTitle: string,
    enrollmentId: string
  ): Promise<{ success: boolean; messageId?: string }> {
    const template: EmailTemplate = {
      to: [recipientEmail],
      subject: `Welcome to ${courseTitle} - Paeds Resus`,
      body: `
Dear ${recipientName},

Congratulations on enrolling in ${courseTitle}!

Your enrollment ID: ${enrollmentId}

We're excited to have you on this journey to save children's lives through evidence-based resuscitation training.

Next Steps:
1. Complete your profile
2. Review the course materials
3. Schedule your training session

If you have any questions, please contact us at ${this.organizationEmail}

Best regards,
Paeds Resus Team
      `,
      htmlBody: `
<html>
  <body>
    <h2>Welcome to ${courseTitle}</h2>
    <p>Dear ${recipientName},</p>
    <p>Congratulations on enrolling in <strong>${courseTitle}</strong>!</p>
    <p><strong>Your enrollment ID:</strong> ${enrollmentId}</p>
    <p>We're excited to have you on this journey to save children's lives through evidence-based resuscitation training.</p>
    <h3>Next Steps:</h3>
    <ol>
      <li>Complete your profile</li>
      <li>Review the course materials</li>
      <li>Schedule your training session</li>
    </ol>
    <p>If you have any questions, please contact us at <a href="mailto:${this.organizationEmail}">${this.organizationEmail}</a></p>
    <p>Best regards,<br/>Paeds Resus Team</p>
  </body>
</html>
      `,
    };

    return this.sendEmail(template);
  }

  /**
   * Send payment confirmation email
   */
  async sendPaymentConfirmation(
    recipientEmail: string,
    recipientName: string,
    amount: number,
    currency: string,
    paymentMethod: string,
    transactionId: string
  ): Promise<{ success: boolean; messageId?: string }> {
    const template: EmailTemplate = {
      to: [recipientEmail],
      subject: "Payment Confirmation - Paeds Resus",
      body: `
Dear ${recipientName},

Thank you for your payment!

Payment Details:
- Amount: ${amount} ${currency}
- Method: ${paymentMethod}
- Transaction ID: ${transactionId}
- Date: ${new Date().toLocaleDateString()}

Your course access will be activated shortly. You'll receive a separate email with login credentials.

If you have any questions, please contact us at ${this.organizationEmail}

Best regards,
Paeds Resus Team
      `,
    };

    return this.sendEmail(template);
  }

  /**
   * Send training reminder email
   */
  async sendTrainingReminder(
    recipientEmail: string,
    recipientName: string,
    trainingDate: Date,
    trainingTime: string,
    location: string
  ): Promise<{ success: boolean; messageId?: string }> {
    const template: EmailTemplate = {
      to: [recipientEmail],
      subject: "Training Reminder - Paeds Resus",
      body: `
Dear ${recipientName},

This is a reminder about your upcoming training session.

Training Details:
- Date: ${trainingDate.toLocaleDateString()}
- Time: ${trainingTime}
- Location: ${location}

Please arrive 15 minutes early. If you need to reschedule, contact us as soon as possible.

Best regards,
Paeds Resus Team
      `,
    };

    return this.sendEmail(template);
  }

  /**
   * Send certificate email
   */
  async sendCertificateEmail(
    recipientEmail: string,
    recipientName: string,
    courseTitle: string,
    certificateNumber: string,
    completionDate: Date
  ): Promise<{ success: boolean; messageId?: string }> {
    const template: EmailTemplate = {
      to: [recipientEmail],
      subject: `Your ${courseTitle} Certificate - Paeds Resus`,
      body: `
Dear ${recipientName},

Congratulations on completing ${courseTitle}!

Your certificate has been issued:
- Certificate Number: ${certificateNumber}
- Course: ${courseTitle}
- Completion Date: ${completionDate.toLocaleDateString()}

You can download your certificate from your dashboard or verify it using the certificate verification tool on our website.

Thank you for your commitment to saving children's lives!

Best regards,
Paeds Resus Team
      `,
    };

    return this.sendEmail(template);
  }

  /**
   * Create calendar event
   */
  async createCalendarEvent(event: GoogleCalendarEvent): Promise<{ success: boolean; eventId?: string; error?: string }> {
    try {
      // In production, this would use Google Calendar API
      console.log(`[Calendar] Creating event: ${event.title}`);
      console.log(`Start: ${event.startTime}, End: ${event.endTime}`);

      const eventId = `evt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      this.eventQueue.push(event);

      return {
        success: true,
        eventId,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Schedule training session
   */
  async scheduleTrainingSession(
    title: string,
    instructorEmail: string,
    attendeeEmails: string[],
    startTime: Date,
    endTime: Date,
    location: string,
    description: string
  ): Promise<{ success: boolean; eventId?: string }> {
    const event: GoogleCalendarEvent = {
      id: "",
      title,
      description,
      startTime,
      endTime,
      attendees: [instructorEmail, ...attendeeEmails],
      location,
    };

    return this.createCalendarEvent(event);
  }

  /**
   * Create shared folder in Google Drive
   */
  async createSharedFolder(folderName: string, ownerEmail: string, sharedWith: string[]): Promise<{ success: boolean; folderId?: string; error?: string }> {
    try {
      // In production, this would use Google Drive API
      console.log(`[Drive] Creating folder: ${folderName}`);
      console.log(`Owner: ${ownerEmail}`);
      console.log(`Shared with: ${sharedWith.join(", ")}`);

      const folderId = `folder-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      return {
        success: true,
        folderId,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Upload file to Google Drive
   */
  async uploadFileToDrive(
    fileName: string,
    fileContent: Buffer,
    mimeType: string,
    parentFolderId?: string
  ): Promise<{ success: boolean; fileId?: string; webViewLink?: string; error?: string }> {
    try {
      // In production, this would use Google Drive API
      console.log(`[Drive] Uploading file: ${fileName}`);

      const fileId = `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const webViewLink = `https://drive.google.com/file/d/${fileId}/view`;

      return {
        success: true,
        fileId,
        webViewLink,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Create institutional folder structure
   */
  async createInstitutionalFolders(institutionName: string, adminEmail: string): Promise<{ success: boolean; folders?: Record<string, string>; error?: string }> {
    try {
      const folders: Record<string, string> = {};
      const mainFolderId = await this.createSharedFolder(institutionName, adminEmail, [adminEmail]);

      if (mainFolderId.success && mainFolderId.folderId) {
        folders.main = mainFolderId.folderId;

        // Create subfolders
        const subfolders = ["Training Materials", "Certificates", "Reports", "Schedules", "Resources"];

        for (const subfolder of subfolders) {
          const result = await this.createSharedFolder(
            `${institutionName}/${subfolder}`,
            adminEmail,
            [adminEmail]
          );
          if (result.success && result.folderId) {
            folders[subfolder.toLowerCase().replace(" ", "_")] = result.folderId;
          }
        }

        return {
          success: true,
          folders,
        };
      }

      return {
        success: false,
        error: "Failed to create main folder",
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Get sent emails history
   */
  getSentEmailsHistory(limit: number = 50): Array<{ to: string[]; subject: string; timestamp: Date }> {
    return this.sentEmails.slice(-limit);
  }

  /**
   * Get calendar events
   */
  getCalendarEvents(limit: number = 50): GoogleCalendarEvent[] {
    return this.eventQueue.slice(-limit);
  }

  /**
   * Get email statistics
   */
  getEmailStatistics(): {
    totalSent: number;
    uniqueRecipients: number;
    lastSentTime?: Date;
  } {
    const uniqueRecipients = new Set<string>();

    this.sentEmails.forEach((email) => {
      email.to.forEach((recipient) => {
        uniqueRecipients.add(recipient);
      });
    });

    return {
      totalSent: this.sentEmails.length,
      uniqueRecipients: uniqueRecipients.size,
      lastSentTime: this.sentEmails.length > 0 ? this.sentEmails[this.sentEmails.length - 1].timestamp : undefined,
    };
  }

  /**
   * Get calendar statistics
   */
  getCalendarStatistics(): {
    totalEvents: number;
    upcomingEvents: number;
    pastEvents: number;
  } {
    const now = new Date();
    const upcomingEvents = this.eventQueue.filter((event) => event.startTime > now).length;
    const pastEvents = this.eventQueue.filter((event) => event.startTime <= now).length;

    return {
      totalEvents: this.eventQueue.length,
      upcomingEvents,
      pastEvents,
    };
  }
}

// Export singleton instance
export const googleWorkspaceService = new GoogleWorkspaceService();
