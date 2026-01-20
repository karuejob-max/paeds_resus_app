import axios from "axios";

/**
 * SMS Service - Supports multiple providers (Africastalking, Twilio)
 * Configure via environment variables
 */

type SMSProvider = "africastalking" | "twilio";

interface SMSMessage {
  phoneNumber: string;
  message: string;
  messageType:
    | "enrollment_confirmation"
    | "payment_reminder"
    | "training_reminder"
    | "post_training_feedback";
}

interface SendSMSResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

const SMS_PROVIDER = (process.env.SMS_PROVIDER || "africastalking") as SMSProvider;

/**
 * Send SMS via Africastalking
 */
async function sendViaAfricasTalking(
  phoneNumber: string,
  message: string
): Promise<SendSMSResult> {
  try {
    const apiKey = process.env.AFRICASTALKING_API_KEY;
    const username = process.env.AFRICASTALKING_USERNAME || "sandbox";

    if (!apiKey) {
      console.warn("[SMS] Africastalking API key not configured");
      return {
        success: false,
        error: "SMS provider not configured",
      };
    }

    // Ensure phone number is in international format
    const formattedPhone = phoneNumber.startsWith("+")
      ? phoneNumber
      : `+254${phoneNumber.slice(-9)}`;

    const response = await axios.post(
      "https://api.sandbox.africastalking.com/version1/messaging",
      {
        username,
        to: formattedPhone,
        message,
      },
      {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/x-www-form-urlencoded",
          apiKey,
        },
      }
    );

    if (response.data?.SMSMessageData?.Recipients?.[0]?.statusCode === 101) {
      console.log(`[SMS] Successfully sent to ${formattedPhone}`);
      return {
        success: true,
        messageId: response.data.SMSMessageData.Recipients[0].messageId,
      };
    }

    return {
      success: false,
      error: response.data?.SMSMessageData?.Recipients?.[0]?.status || "Unknown error",
    };
  } catch (error) {
    console.error("[SMS] Africastalking error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Send SMS via Twilio
 */
async function sendViaTwilio(
  phoneNumber: string,
  message: string
): Promise<SendSMSResult> {
  try {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_PHONE_NUMBER;

    if (!accountSid || !authToken || !fromNumber) {
      console.warn("[SMS] Twilio credentials not configured");
      return {
        success: false,
        error: "SMS provider not configured",
      };
    }

    // Ensure phone number is in international format
    const formattedPhone = phoneNumber.startsWith("+")
      ? phoneNumber
      : `+254${phoneNumber.slice(-9)}`;

    const auth = Buffer.from(`${accountSid}:${authToken}`).toString("base64");

    const response = await axios.post(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      new URLSearchParams({
        To: formattedPhone,
        From: fromNumber,
        Body: message,
      }),
      {
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    if (response.data?.sid) {
      console.log(`[SMS] Successfully sent to ${formattedPhone}`);
      return {
        success: true,
        messageId: response.data.sid,
      };
    }

    return {
      success: false,
      error: response.data?.message || "Unknown error",
    };
  } catch (error) {
    console.error("[SMS] Twilio error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Send SMS message
 */
export async function sendSMS(smsData: SMSMessage): Promise<SendSMSResult> {
  console.log(`[SMS] Sending ${smsData.messageType} to ${smsData.phoneNumber}`);

  if (SMS_PROVIDER === "twilio") {
    return sendViaTwilio(smsData.phoneNumber, smsData.message);
  } else {
    return sendViaAfricasTalking(smsData.phoneNumber, smsData.message);
  }
}

/**
 * Generate enrollment confirmation SMS
 */
export function generateEnrollmentSMS(enrollmentId: number): string {
  return `Welcome to Paeds Resus! Your enrollment is confirmed. Enrollment ID: ${enrollmentId}. Check your email for payment instructions.`;
}

/**
 * Generate payment reminder SMS
 */
export function generatePaymentReminderSMS(amount: number, enrollmentId: number): string {
  return `Reminder: KES ${amount.toLocaleString()} payment is pending for enrollment ${enrollmentId}. Complete payment to secure your spot. Reply HELP for assistance.`;
}

/**
 * Generate training reminder SMS
 */
export function generateTrainingReminderSMS(trainingDate: Date): string {
  const daysUntil = Math.ceil(
    (trainingDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );
  return `Your Paeds Resus training starts in ${daysUntil} days! Please arrive 15 minutes early. See you soon!`;
}

/**
 * Generate post-training feedback SMS
 */
export function generatePostTrainingFeedbackSMS(): string {
  return `Thank you for attending Paeds Resus training! Please rate your experience: https://survey.paedsresus.com`;
}

/**
 * Send enrollment confirmation SMS
 */
export async function sendEnrollmentConfirmationSMS(
  phoneNumber: string,
  enrollmentId: number
): Promise<SendSMSResult> {
  const message = generateEnrollmentSMS(enrollmentId);
  return sendSMS({
    phoneNumber,
    message,
    messageType: "enrollment_confirmation",
  });
}

/**
 * Send payment reminder SMS
 */
export async function sendPaymentReminderSMS(
  phoneNumber: string,
  amount: number,
  enrollmentId: number
): Promise<SendSMSResult> {
  const message = generatePaymentReminderSMS(amount, enrollmentId);
  return sendSMS({
    phoneNumber,
    message,
    messageType: "payment_reminder",
  });
}

/**
 * Send training reminder SMS
 */
export async function sendTrainingReminderSMS(
  phoneNumber: string,
  trainingDate: Date
): Promise<SendSMSResult> {
  const message = generateTrainingReminderSMS(trainingDate);
  return sendSMS({
    phoneNumber,
    message,
    messageType: "training_reminder",
  });
}

/**
 * Send post-training feedback SMS
 */
export async function sendPostTrainingFeedbackSMS(
  phoneNumber: string
): Promise<SendSMSResult> {
  const message = generatePostTrainingFeedbackSMS();
  return sendSMS({
    phoneNumber,
    message,
    messageType: "post_training_feedback",
  });
}
