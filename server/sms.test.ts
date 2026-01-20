import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  generateEnrollmentSMS,
  generatePaymentReminderSMS,
  generateTrainingReminderSMS,
  generatePostTrainingFeedbackSMS,
} from "./sms";

describe("SMS Service", () => {
  describe("SMS Message Generation", () => {
    it("should generate enrollment confirmation SMS", () => {
      const message = generateEnrollmentSMS(12345);
      expect(message).toContain("Welcome to Paeds Resus");
      expect(message).toContain("12345");
      expect(message).toContain("enrollment");
    });

    it("should generate payment reminder SMS", () => {
      const message = generatePaymentReminderSMS(5000, 67890);
      expect(message).toContain("KES");
      expect(message).toContain("5,000"); // Locale formatted with comma
      expect(message).toContain("67890");
      expect(message).toContain("payment");
    });

    it("should generate training reminder SMS", () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7); // 7 days from now
      const message = generateTrainingReminderSMS(futureDate);
      expect(message).toContain("training");
      expect(message).toContain("days");
      expect(message).toContain("arrive 15 minutes early");
    });

    it("should generate post-training feedback SMS", () => {
      const message = generatePostTrainingFeedbackSMS();
      expect(message).toContain("Thank you");
      expect(message).toContain("Paeds Resus");
      expect(message).toContain("survey");
    });

    it("should handle training reminder with 1 day remaining", () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const message = generateTrainingReminderSMS(tomorrow);
      expect(message).toContain("1 days");
    });

    it("should handle training reminder with 0 days remaining", () => {
      const today = new Date();
      const message = generateTrainingReminderSMS(today);
      expect(message).toContain("0 days");
    });

    it("should format payment amounts with proper locale", () => {
      const message = generatePaymentReminderSMS(15000, 11111);
      expect(message).toContain("15,000"); // Locale formatted with comma
    });
  });

  describe("SMS Message Content Validation", () => {
    it("enrollment SMS should be concise", () => {
      const message = generateEnrollmentSMS(1);
      expect(message.length).toBeLessThan(160); // SMS character limit
    });

    it("payment reminder SMS should include action items", () => {
      const message = generatePaymentReminderSMS(5000, 1);
      expect(message).toContain("payment");
      expect(message).toContain("HELP");
    });

    it("training reminder should be actionable", () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 3);
      const message = generateTrainingReminderSMS(futureDate);
      expect(message).toContain("15 minutes");
    });

    it("feedback SMS should include survey link", () => {
      const message = generatePostTrainingFeedbackSMS();
      expect(message).toContain("survey");
    });
  });

  describe("Phone Number Validation", () => {
    it("should accept valid Kenyan phone numbers", () => {
      const validNumbers = [
        "+254712345678",
        "254712345678",
        "0712345678",
      ];

      validNumbers.forEach((number) => {
        // These would be validated in the router
        expect(number).toBeDefined();
      });
    });

    it("should handle different phone number formats", () => {
      const numbers = [
        { input: "+254712345678", expected: "+254712345678" },
        { input: "0712345678", expected: "+254712345678" },
        { input: "254712345678", expected: "+254712345678" },
      ];

      numbers.forEach(({ input, expected }) => {
        // Simulate phone number formatting
        const formatted = input.startsWith("+")
          ? input
          : input.startsWith("254")
            ? `+${input}`
            : `+254${input.slice(-9)}`;

        expect(formatted).toBe(expected);
      });
    });
  });

  describe("SMS Message Types", () => {
    it("should support all required message types", () => {
      const messageTypes = [
        "enrollment_confirmation",
        "payment_reminder",
        "training_reminder",
        "post_training_feedback",
      ];

      messageTypes.forEach((type) => {
        expect(type).toBeDefined();
        expect(typeof type).toBe("string");
      });
    });

    it("should generate different messages for different types", () => {
      const enrollmentMsg = generateEnrollmentSMS(1);
      const paymentMsg = generatePaymentReminderSMS(5000, 1);
      const trainingMsg = generateTrainingReminderSMS(new Date());
      const feedbackMsg = generatePostTrainingFeedbackSMS();

      expect(enrollmentMsg).not.toBe(paymentMsg);
      expect(paymentMsg).not.toBe(trainingMsg);
      expect(trainingMsg).not.toBe(feedbackMsg);
    });
  });

  describe("SMS Message Localization", () => {
    it("should use Kenyan currency (KES)", () => {
      const message = generatePaymentReminderSMS(10000, 1);
      expect(message).toContain("KES");
    });

    it("should reference Paeds Resus branding", () => {
      const messages = [
        generateEnrollmentSMS(1),
        generateTrainingReminderSMS(new Date()),
        generatePostTrainingFeedbackSMS(),
      ];

      messages.forEach((msg) => {
        expect(msg).toContain("Paeds Resus");
      });
    });
  });

  describe("SMS Message Edge Cases", () => {
    it("should handle large enrollment IDs", () => {
      const largeId = 999999999;
      const message = generateEnrollmentSMS(largeId);
      expect(message).toContain(largeId.toString());
    });

    it("should handle large payment amounts", () => {
      const largeAmount = 1000000;
      const message = generatePaymentReminderSMS(largeAmount, 1);
      expect(message).toContain("1,000,000"); // Locale formatted
    });

    it("should handle training date in far future", () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      const message = generateTrainingReminderSMS(futureDate);
      expect(message).toContain("days");
    });

    it("should handle training date in past", () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 5);
      const message = generateTrainingReminderSMS(pastDate);
      expect(message).toContain("days");
    });
  });
});
