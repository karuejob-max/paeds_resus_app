/**
 * Email Service Integration
 * Supports SendGrid and Mailgun with template management
 */

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  html: string;
  text: string;
  variables: string[];
}

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  templateId?: string;
  variables?: Record<string, string>;
  cc?: string[];
  bcc?: string[];
  replyTo?: string;
}

// Email templates for different scenarios
export const emailTemplates: Record<string, EmailTemplate> = {
  providerActivation: {
    id: "provider-activation",
    name: "Provider Account Activation",
    subject: "Welcome to Paeds Resus - Activate Your Account",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #1a4d4d 0%, #0d3333 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0;">Welcome to Paeds Resus</h1>
          <p style="margin: 10px 0 0 0; font-size: 14px;">Elite Fellowship and Safe-Truth Platform</p>
        </div>
        <div style="padding: 30px; background: #f9f9f9; border-radius: 0 0 8px 8px;">
          <p>Hello {{providerName}},</p>
          <p>Your provider account has been created successfully! Click the button below to activate your account and get started.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="{{activationLink}}" style="background: #ff6633; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">
              Activate Account
            </a>
          </div>
          <p style="font-size: 12px; color: #666;">This link expires in 24 hours. If you didn't request this, please contact support.</p>
          <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
          <p style="font-size: 12px; color: #666;">
            Paeds Resus Limited<br>
            Transforming pediatric emergency care across Kenya<br>
            Email: paedsresus254@gmail.com
          </p>
        </div>
      </div>
    `,
    text: `
      Welcome to Paeds Resus
      
      Hello {{providerName}},
      
      Your provider account has been created successfully! Click the link below to activate your account:
      
      {{activationLink}}
      
      This link expires in 24 hours.
      
      Paeds Resus Limited
      paedsresus254@gmail.com
    `,
    variables: ["providerName", "activationLink"],
  },

  courseCompletion: {
    id: "course-completion",
    name: "Course Completion Certificate",
    subject: "Congratulations! You've Completed {{courseName}}",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #ff6633 0%, #e55a22 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0;">🎉 Course Completed!</h1>
          <p style="margin: 10px 0 0 0; font-size: 14px;">{{courseName}}</p>
        </div>
        <div style="padding: 30px; background: #f9f9f9; border-radius: 0 0 8px 8px;">
          <p>Congratulations {{userName}},</p>
          <p>You have successfully completed {{courseName}}! Your certificate is now available for download.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="{{certificateLink}}" style="background: #1a4d4d; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">
              Download Certificate
            </a>
          </div>
          <p style="margin: 20px 0; padding: 15px; background: white; border-left: 4px solid #ff6633; border-radius: 4px;">
            <strong>Next Steps:</strong><br>
            • Share your achievement on social media<br>
            • Enroll in the next course<br>
            • Join our community forum
          </p>
          <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
          <p style="font-size: 12px; color: #666;">
            Paeds Resus Limited<br>
            Email: paedsresus254@gmail.com
          </p>
        </div>
      </div>
    `,
    text: `
      Congratulations! You've Completed {{courseName}}
      
      Hello {{userName}},
      
      You have successfully completed {{courseName}}! Your certificate is now available:
      
      {{certificateLink}}
      
      Paeds Resus Limited
      paedsresus254@gmail.com
    `,
    variables: ["userName", "courseName", "certificateLink"],
  },

  churnAlert: {
    id: "churn-alert",
    name: "Churn Alert - We Miss You",
    subject: "We Miss You! Come Back to Paeds Resus",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #1a4d4d 0%, #0d3333 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0;">We Miss You!</h1>
          <p style="margin: 10px 0 0 0; font-size: 14px;">Continue your learning journey with us</p>
        </div>
        <div style="padding: 30px; background: #f9f9f9; border-radius: 0 0 8px 8px;">
          <p>Hello {{userName}},</p>
          <p>We noticed you haven't been active on Paeds Resus lately. We'd love to see you back!</p>
          <p style="margin: 20px 0; padding: 15px; background: white; border-left: 4px solid #ff6633; border-radius: 4px;">
            <strong>What's New:</strong><br>
            • {{newCourseCount}} new courses available<br>
            • {{eventCount}} upcoming training sessions<br>
            • {{communityUpdate}} community discussions
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="{{dashboardLink}}" style="background: #ff6633; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">
              Return to Dashboard
            </a>
          </div>
          <p style="font-size: 12px; color: #666;">
            Special offer: {{specialOffer}}<br>
            Use code: {{promoCode}}
          </p>
          <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
          <p style="font-size: 12px; color: #666;">
            Paeds Resus Limited<br>
            Email: paedsresus254@gmail.com
          </p>
        </div>
      </div>
    `,
    text: `
      We Miss You! Come Back to Paeds Resus
      
      Hello {{userName}},
      
      We noticed you haven't been active lately. We'd love to see you back!
      
      What's New:
      • {{newCourseCount}} new courses available
      • {{eventCount}} upcoming training sessions
      • {{communityUpdate}} community discussions
      
      Return to Dashboard: {{dashboardLink}}
      
      Special offer: {{specialOffer}}
      Use code: {{promoCode}}
      
      Paeds Resus Limited
      paedsresus254@gmail.com
    `,
    variables: [
      "userName",
      "newCourseCount",
      "eventCount",
      "communityUpdate",
      "dashboardLink",
      "specialOffer",
      "promoCode",
    ],
  },

  enrollmentConfirmation: {
    id: "enrollment-confirmation",
    name: "Enrollment Confirmation",
    subject: "Enrollment Confirmed - {{courseName}}",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #1a4d4d 0%, #0d3333 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0;">✓ Enrollment Confirmed</h1>
          <p style="margin: 10px 0 0 0; font-size: 14px;">{{courseName}}</p>
        </div>
        <div style="padding: 30px; background: #f9f9f9; border-radius: 0 0 8px 8px;">
          <p>Hello {{userName}},</p>
          <p>Thank you for enrolling in {{courseName}}! Your enrollment has been confirmed.</p>
          <div style="margin: 20px 0; padding: 15px; background: white; border-radius: 4px; border: 1px solid #ddd;">
            <p style="margin: 0 0 10px 0;"><strong>Course Details:</strong></p>
            <p style="margin: 5px 0;">Duration: {{courseDuration}}</p>
            <p style="margin: 5px 0;">Start Date: {{startDate}}</p>
            <p style="margin: 5px 0;">Instructor: {{instructorName}}</p>
            <p style="margin: 5px 0;">Amount Paid: {{amountPaid}}</p>
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="{{courseLink}}" style="background: #ff6633; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">
              Start Learning
            </a>
          </div>
          <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
          <p style="font-size: 12px; color: #666;">
            Paeds Resus Limited<br>
            Email: paedsresus254@gmail.com
          </p>
        </div>
      </div>
    `,
    text: `
      Enrollment Confirmed - {{courseName}}
      
      Hello {{userName}},
      
      Thank you for enrolling in {{courseName}}!
      
      Course Details:
      Duration: {{courseDuration}}
      Start Date: {{startDate}}
      Instructor: {{instructorName}}
      Amount Paid: {{amountPaid}}
      
      Start Learning: {{courseLink}}
      
      Paeds Resus Limited
      paedsresus254@gmail.com
    `,
    variables: ["userName", "courseName", "courseDuration", "startDate", "instructorName", "amountPaid", "courseLink"],
  },
};

/**
 * Send email using SendGrid
 * Requires SENDGRID_API_KEY environment variable
 */
export async function sendEmailViaSendGrid(options: EmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const apiKey = process.env.SENDGRID_API_KEY;
    if (!apiKey) {
      throw new Error("SENDGRID_API_KEY not configured");
    }

    const sgMail = require("@sendgrid/mail");
    sgMail.setApiKey(apiKey);

    const msg = {
      to: options.to,
      from: process.env.SENDGRID_FROM_EMAIL || "noreply@paedsresus.com",
      subject: options.subject,
      html: options.html,
      text: options.text,
      cc: options.cc,
      bcc: options.bcc,
      replyTo: options.replyTo,
    };

    const response = await sgMail.send(msg);
    return {
      success: true,
      messageId: response[0]?.headers?.["x-message-id"],
    };
  } catch (error) {
    console.error("[Email Service] SendGrid Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Send email using Mailgun
 * Requires MAILGUN_API_KEY and MAILGUN_DOMAIN environment variables
 */
export async function sendEmailViaMailgun(options: EmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const apiKey = process.env.MAILGUN_API_KEY;
    const domain = process.env.MAILGUN_DOMAIN;

    if (!apiKey || !domain) {
      throw new Error("MAILGUN_API_KEY or MAILGUN_DOMAIN not configured");
    }

    const FormData = require("form-data");
    const Mailgun = require("mailgun.js");
    const mailgun = new Mailgun(FormData);
    const client = mailgun.client({ username: "api", key: apiKey });
    const messageData = {
      from: process.env.MAILGUN_FROM_EMAIL || `noreply@${domain}`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
      cc: options.cc,
      bcc: options.bcc,
      "h:Reply-To": options.replyTo,
    };

    const response = await client.messages.create(domain, messageData);
    return {
      success: true,
      messageId: response.id,
    };
  } catch (error) {
    console.error("[Email Service] Mailgun Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Render email template with variables
 */
export function renderTemplate(template: EmailTemplate, variables: Record<string, string>): { subject: string; html: string; text: string } {
  let subject = template.subject;
  let html = template.html;
  let text = template.text;

  // Replace all variables
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`{{${key}}}`, "g");
    subject = subject.replace(regex, value);
    html = html.replace(regex, value);
    text = text.replace(regex, value);
  });

  return { subject, html, text };
}

/**
 * Send email with template
 */
export async function sendEmail(
  to: string | string[],
  templateId: string,
  variables: Record<string, string>,
  provider: "sendgrid" | "mailgun" = "sendgrid"
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const template = emailTemplates[templateId];
  if (!template) {
    return {
      success: false,
      error: `Template '${templateId}' not found`,
    };
  }

  const { subject, html, text } = renderTemplate(template, variables);

  const options: EmailOptions = {
    to,
    subject,
    html,
    text,
  };

  if (provider === "mailgun") {
    return sendEmailViaMailgun(options);
  } else {
    return sendEmailViaSendGrid(options);
  }
}
