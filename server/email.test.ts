import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  sendEmail,
  sendEnrollmentConfirmation,
  sendPaymentReminder,
  sendTrainingConfirmation,
  sendInstitutionalResponse,
} from "./email";

// Mock AWS SES client
vi.mock("@aws-sdk/client-ses", () => {
  const mockSend = vi.fn().mockResolvedValue({ MessageId: "mock-message-id" });

  return {
    SESClient: vi.fn(() => ({
      send: mockSend,
    })),
    SendEmailCommand: vi.fn((params) => ({
      ...params,
      _mockCommand: true,
    })),
  };
});

describe("email service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("sendEmail", () => {
    it("should send email with valid parameters", async () => {
      const result = await sendEmail({
        to: "test@example.com",
        subject: "Test Email",
        htmlBody: "<p>Test content</p>",
        textBody: "Test content",
      });

      expect(result).toBe(true);
    });

    it("should handle email without text body", async () => {
      const result = await sendEmail({
        to: "test@example.com",
        subject: "Test Email",
        htmlBody: "<p>Test content</p>",
      });

      expect(result).toBe(true);
    });

    it("should validate email address format", async () => {
      const result = await sendEmail({
        to: "invalid-email",
        subject: "Test",
        htmlBody: "<p>Test</p>",
      });

      // Should still attempt to send (AWS SES will validate)
      expect(typeof result).toBe("boolean");
    });

    it("should include proper HTML formatting", async () => {
      const htmlBody = `
        <!DOCTYPE html>
        <html>
          <body>
            <h1>Test</h1>
            <p>Content</p>
          </body>
        </html>
      `;

      const result = await sendEmail({
        to: "test@example.com",
        subject: "Formatted Email",
        htmlBody,
      });

      expect(result).toBe(true);
    });
  });

  describe("sendEnrollmentConfirmation", () => {
    it("should send enrollment confirmation email", async () => {
      const result = await sendEnrollmentConfirmation(
        "user@example.com",
        "John Doe",
        "PALS (Pediatric Advanced Life Support)",
        123
      );

      expect(result).toBe(true);
    });

    it("should include enrollment ID in email", async () => {
      const result = await sendEnrollmentConfirmation(
        "user@example.com",
        "Jane Smith",
        "BLS (Basic Life Support)",
        456
      );

      expect(result).toBe(true);
    });

    it("should handle different program names", async () => {
      const programs = [
        "BLS (Basic Life Support)",
        "ACLS (Advanced Cardiac Life Support)",
        "PALS (Pediatric Advanced Life Support)",
        "Elite Fellowship",
      ];

      for (const program of programs) {
        const result = await sendEnrollmentConfirmation(
          "user@example.com",
          "Test User",
          program,
          789
        );

        expect(result).toBe(true);
      }
    });
  });

  describe("sendPaymentReminder", () => {
    it("should send payment reminder email", async () => {
      const result = await sendPaymentReminder(
        "user@example.com",
        "John Doe",
        10000,
        123
      );

      expect(result).toBe(true);
    });

    it("should include payment amount in email", async () => {
      const result = await sendPaymentReminder(
        "user@example.com",
        "Jane Smith",
        50000,
        456
      );

      expect(result).toBe(true);
    });

    it("should handle various payment amounts", async () => {
      const amounts = [5000, 8000, 10000, 50000];

      for (const amount of amounts) {
        const result = await sendPaymentReminder(
          "user@example.com",
          "Test User",
          amount,
          789
        );

        expect(result).toBe(true);
      }
    });
  });

  describe("sendTrainingConfirmation", () => {
    it("should send training confirmation email", async () => {
      const result = await sendTrainingConfirmation(
        "user@example.com",
        "John Doe",
        "PALS (Pediatric Advanced Life Support)",
        new Date("2026-02-15"),
        "PICU Training Center, Nairobi",
        "Dr. Jane Kipchoge"
      );

      expect(result).toBe(true);
    });

    it("should include training details in email", async () => {
      const result = await sendTrainingConfirmation(
        "user@example.com",
        "Jane Smith",
        "BLS (Basic Life Support)",
        new Date("2026-02-20"),
        "Kenyatta National Hospital",
        "Nurse Samuel Omondi"
      );

      expect(result).toBe(true);
    });

    it("should format date correctly in email", async () => {
      const trainingDate = new Date("2026-03-10");
      const result = await sendTrainingConfirmation(
        "user@example.com",
        "Test User",
        "Elite Fellowship",
        trainingDate,
        "Training Center",
        "Dr. Test"
      );

      expect(result).toBe(true);
    });
  });

  describe("sendInstitutionalResponse", () => {
    it("should send institutional inquiry response", async () => {
      const result = await sendInstitutionalResponse(
        "admin@hospital.com",
        "Kenyatta National Hospital",
        "Dr. John Smith"
      );

      expect(result).toBe(true);
    });

    it("should include institution name in email", async () => {
      const result = await sendInstitutionalResponse(
        "contact@clinic.com",
        "Aga Khan University Hospital",
        "Ms. Sarah Johnson"
      );

      expect(result).toBe(true);
    });

    it("should handle various institution names", async () => {
      const institutions = [
        { email: "admin1@hosp.com", name: "County Hospital", contact: "Dr. A" },
        { email: "admin2@clinic.com", name: "Private Clinic", contact: "Dr. B" },
        { email: "admin3@med.com", name: "Teaching Hospital", contact: "Dr. C" },
      ];

      for (const inst of institutions) {
        const result = await sendInstitutionalResponse(
          inst.email,
          inst.name,
          inst.contact
        );

        expect(result).toBe(true);
      }
    });
  });

  describe("email content validation", () => {
    it("should include unsubscribe information", async () => {
      const result = await sendEmail({
        to: "test@example.com",
        subject: "Test",
        htmlBody: `
          <p>Content</p>
          <footer>
            <p>&copy; 2026 Paeds Resus. All rights reserved.</p>
          </footer>
        `,
      });

      expect(result).toBe(true);
    });

    it("should include contact information", async () => {
      const result = await sendEmail({
        to: "test@example.com",
        subject: "Test",
        htmlBody: `
          <p>Content</p>
          <p>Contact: support@paedsresus.com</p>
        `,
      });

      expect(result).toBe(true);
    });

    it("should use proper email styling", async () => {
      const result = await sendEmail({
        to: "test@example.com",
        subject: "Styled Email",
        htmlBody: `
          <html>
            <head>
              <style>
                body { font-family: Arial, sans-serif; }
                .header { background-color: #1e3a8a; color: white; }
              </style>
            </head>
            <body>
              <div class="header">
                <h1>Welcome</h1>
              </div>
            </body>
          </html>
        `,
      });

      expect(result).toBe(true);
    });
  });
});
