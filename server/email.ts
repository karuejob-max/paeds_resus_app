import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import { ENV } from "./_core/env";

// Initialize AWS SES client
const sesClient = new SESClient({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

interface EmailParams {
  to: string;
  subject: string;
  htmlBody: string;
  textBody?: string;
}

/**
 * Send email via AWS SES
 */
export async function sendEmail({ to, subject, htmlBody, textBody }: EmailParams): Promise<boolean> {
  try {
    const command = new SendEmailCommand({
      Source: process.env.SES_FROM_EMAIL || "noreply@paedsresus.com",
      Destination: {
        ToAddresses: [to],
      },
      Message: {
        Subject: {
          Data: subject,
          Charset: "UTF-8",
        },
        Body: {
          Html: {
            Data: htmlBody,
            Charset: "UTF-8",
          },
          Text: textBody
            ? {
                Data: textBody,
                Charset: "UTF-8",
              }
            : undefined,
        },
      },
    });

    await sesClient.send(command);
    console.log(`[Email] Successfully sent to ${to}: ${subject}`);
    return true;
  } catch (error) {
    console.error(`[Email] Failed to send to ${to}:`, error);
    return false;
  }
}

/**
 * Send enrollment confirmation email
 */
export async function sendEnrollmentConfirmation(
  email: string,
  userName: string,
  programName: string,
  enrollmentId: number
): Promise<boolean> {
  const htmlBody = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #1e3a8a; color: white; padding: 20px; text-align: center; border-radius: 5px; }
          .content { padding: 20px; background-color: #f9fafb; margin: 20px 0; border-radius: 5px; }
          .cta { display: inline-block; background-color: #1e3a8a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to Paeds Resus!</h1>
          </div>
          <div class="content">
            <p>Hi ${userName},</p>
            <p>Thank you for enrolling in our <strong>${programName}</strong> program!</p>
            <p>Your enrollment has been confirmed. Here's what happens next:</p>
            <ol>
              <li>You'll receive payment instructions via SMS</li>
              <li>Complete your payment via M-Pesa or bank transfer</li>
              <li>Confirm payment and receive training details</li>
              <li>Join your cohort and start learning!</li>
            </ol>
            <p>Your enrollment ID is: <strong>${enrollmentId}</strong></p>
            <a href="https://paedsresus-ddancniz.manus.space/dashboard" class="cta">View Your Dashboard</a>
          </div>
          <div class="footer">
            <p>Questions? Contact us at support@paedsresus.com or call +254 712 345 678</p>
            <p>&copy; 2026 Paeds Resus. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: `Enrollment Confirmed: ${programName}`,
    htmlBody,
    textBody: `Welcome to Paeds Resus! Your enrollment in ${programName} has been confirmed. Your enrollment ID is ${enrollmentId}. Check your email for next steps.`,
  });
}

/**
 * Send payment reminder email
 */
export async function sendPaymentReminder(
  email: string,
  userName: string,
  amount: number,
  enrollmentId: number
): Promise<boolean> {
  const htmlBody = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #dc2626; color: white; padding: 20px; text-align: center; border-radius: 5px; }
          .content { padding: 20px; background-color: #fef2f2; margin: 20px 0; border-radius: 5px; }
          .payment-details { background-color: white; padding: 15px; border-left: 4px solid #dc2626; margin: 15px 0; }
          .cta { display: inline-block; background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Payment Reminder</h1>
          </div>
          <div class="content">
            <p>Hi ${userName},</p>
            <p>This is a friendly reminder that your payment is pending.</p>
            <div class="payment-details">
              <p><strong>Amount Due:</strong> ${amount.toLocaleString()} KES</p>
              <p><strong>Enrollment ID:</strong> ${enrollmentId}</p>
              <p><strong>Payment Methods:</strong> M-Pesa or Bank Transfer</p>
            </div>
            <p>Complete your payment within the next 48 hours to secure your spot in the program.</p>
            <a href="https://paedsresus-ddancniz.manus.space/dashboard" class="cta">Complete Payment</a>
          </div>
          <div class="footer">
            <p>Need help? Contact us at support@paedsresus.com</p>
            <p>&copy; 2026 Paeds Resus. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: `Payment Reminder: ${amount.toLocaleString()} KES Due`,
    htmlBody,
    textBody: `Payment reminder: ${amount.toLocaleString()} KES is due for enrollment ${enrollmentId}. Complete your payment to secure your spot.`,
  });
}

/**
 * Send training confirmation email
 */
export async function sendTrainingConfirmation(
  email: string,
  userName: string,
  programName: string,
  trainingDate: Date,
  location: string,
  instructorName: string
): Promise<boolean> {
  const htmlBody = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #16a34a; color: white; padding: 20px; text-align: center; border-radius: 5px; }
          .content { padding: 20px; background-color: #f0fdf4; margin: 20px 0; border-radius: 5px; }
          .training-details { background-color: white; padding: 15px; border-left: 4px solid #16a34a; margin: 15px 0; }
          .cta { display: inline-block; background-color: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Training Confirmed!</h1>
          </div>
          <div class="content">
            <p>Hi ${userName},</p>
            <p>Your payment has been confirmed and your training is scheduled!</p>
            <div class="training-details">
              <p><strong>Program:</strong> ${programName}</p>
              <p><strong>Date:</strong> ${trainingDate.toLocaleDateString()}</p>
              <p><strong>Location:</strong> ${location}</p>
              <p><strong>Instructor:</strong> ${instructorName}</p>
            </div>
            <p><strong>What to bring:</strong></p>
            <ul>
              <li>Valid ID</li>
              <li>Comfortable clothing</li>
              <li>Notebook for notes</li>
              <li>Positive attitude!</li>
            </ul>
            <a href="https://paedsresus-ddancniz.manus.space/dashboard" class="cta">View Training Details</a>
          </div>
          <div class="footer">
            <p>See you soon! Contact us at support@paedsresus.com if you have any questions.</p>
            <p>&copy; 2026 Paeds Resus. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: `Training Confirmed: ${programName} on ${trainingDate.toLocaleDateString()}`,
    htmlBody,
    textBody: `Your training is confirmed! ${programName} on ${trainingDate.toLocaleDateString()} at ${location}. Instructor: ${instructorName}`,
  });
}

/**
 * Send institutional inquiry response
 */
export async function sendInstitutionalResponse(
  email: string,
  institutionName: string,
  contactName: string
): Promise<boolean> {
  const htmlBody = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #059669; color: white; padding: 20px; text-align: center; border-radius: 5px; }
          .content { padding: 20px; background-color: #f0fdf4; margin: 20px 0; border-radius: 5px; }
          .cta { display: inline-block; background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Thank You for Your Interest</h1>
          </div>
          <div class="content">
            <p>Hi ${contactName},</p>
            <p>Thank you for reaching out to Paeds Resus on behalf of ${institutionName}!</p>
            <p>We're excited about the possibility of partnering with your institution. Our team will review your inquiry and contact you within 24 hours with customized training proposals and pricing.</p>
            <p><strong>What to expect:</strong></p>
            <ul>
              <li>Personalized consultation call</li>
              <li>Customized training proposal</li>
              <li>Bulk pricing options</li>
              <li>Implementation timeline</li>
            </ul>
            <a href="https://paedsresus-ddancniz.manus.space/institutional" class="cta">View Institutional Programs</a>
          </div>
          <div class="footer">
            <p>Questions? Contact our institutional partnerships team at institutional@paedsresus.com</p>
            <p>&copy; 2026 Paeds Resus. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: `Thank You for Your Interest - ${institutionName}`,
    htmlBody,
    textBody: `Thank you for your interest in Paeds Resus. Our team will contact you within 24 hours with customized proposals for ${institutionName}.`,
  });
}
