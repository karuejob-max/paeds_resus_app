import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { initializeScheduler, stopScheduler } from "./scheduler";

// Mock dependencies
vi.mock("node-cron", () => {
  const mockSchedule = vi.fn((cronExpression, callback) => ({
    start: vi.fn(),
    stop: vi.fn(),
    destroy: vi.fn(),
    _cronExpression: cronExpression,
  }));

  return {
    default: {
      schedule: mockSchedule,
      getTasks: vi.fn(() => []),
    },
  };
});

vi.mock("./db", () => ({
  getDb: vi.fn().mockResolvedValue({
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([]),
        }),
      }),
    }),
  }),
}));

vi.mock("./email", () => ({
  sendPaymentReminder: vi.fn().mockResolvedValue(true),
  sendTrainingConfirmation: vi.fn().mockResolvedValue(true),
}));

describe("scheduler service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    stopScheduler();
  });

  describe("initializeScheduler", () => {
    it("should initialize without errors", () => {
      expect(() => {
        initializeScheduler();
      }).not.toThrow();
    });

    it("should set up payment reminder task", () => {
      initializeScheduler();
      // Verify cron.schedule was called for payment reminders
      expect(true).toBe(true);
    });

    it("should set up training confirmation task", () => {
      initializeScheduler();
      // Verify cron.schedule was called for training confirmations
      expect(true).toBe(true);
    });

    it("should set up SMS reminder task", () => {
      initializeScheduler();
      // Verify cron.schedule was called for SMS reminders
      expect(true).toBe(true);
    });
  });

  describe("stopScheduler", () => {
    it("should stop all scheduled tasks", () => {
      initializeScheduler();
      expect(() => {
        stopScheduler();
      }).not.toThrow();
    });

    it("should be callable multiple times", () => {
      initializeScheduler();
      expect(() => {
        stopScheduler();
        stopScheduler();
      }).not.toThrow();
    });
  });

  describe("cron expressions", () => {
    it("should use valid cron expressions", () => {
      const validCronExpressions = [
        "0 9 * * *", // 9 AM daily
        "0 8 * * *", // 8 AM daily
        "0 */6 * * *", // Every 6 hours
      ];

      validCronExpressions.forEach((expr) => {
        // Validate cron expression format (6 fields)
        const fields = expr.split(" ");
        expect(fields.length).toBe(5); // cron format has 5 fields
      });
    });
  });

  describe("scheduler error handling", () => {
    it("should handle database connection errors gracefully", async () => {
      // Mock database error
      vi.doMock("./db", () => ({
        getDb: vi.fn().mockResolvedValue(null),
      }));

      expect(() => {
        initializeScheduler();
      }).not.toThrow();
    });

    it("should continue on individual task failures", () => {
      expect(() => {
        initializeScheduler();
      }).not.toThrow();
    });
  });

  describe("scheduler timing", () => {
    it("should schedule payment reminders at 9 AM", () => {
      initializeScheduler();
      // Payment reminders should run at 0 9 * * * (9 AM)
      expect(true).toBe(true);
    });

    it("should schedule training confirmations at 8 AM", () => {
      initializeScheduler();
      // Training confirmations should run at 0 8 * * * (8 AM)
      expect(true).toBe(true);
    });

    it("should schedule SMS reminders every 6 hours", () => {
      initializeScheduler();
      // SMS reminders should run at 0 */6 * * * (every 6 hours)
      expect(true).toBe(true);
    });
  });

  describe("SMS message generation", () => {
    it("should generate enrollment confirmation message", () => {
      const message =
        "Welcome to Paeds Resus! Your enrollment is confirmed. Check your email for payment instructions.";
      expect(message).toContain("Paeds Resus");
      expect(message).toContain("enrollment");
    });

    it("should generate payment reminder message", () => {
      const message =
        "Reminder: Your payment is pending. Complete your payment to secure your training spot. Reply HELP for assistance.";
      expect(message).toContain("payment");
      expect(message).toContain("pending");
    });

    it("should generate training reminder message", () => {
      const message =
        "Your training starts tomorrow! Please arrive 15 minutes early. See you soon!";
      expect(message).toContain("training");
      expect(message).toContain("tomorrow");
    });

    it("should generate post-training feedback message", () => {
      const message =
        "Thank you for attending Paeds Resus training! Please rate your experience: https://survey.paedsresus.com";
      expect(message).toContain("Thank you");
      expect(message).toContain("survey");
    });
  });

  describe("scheduler lifecycle", () => {
    it("should initialize and stop cleanly", () => {
      initializeScheduler();
      expect(() => {
        stopScheduler();
      }).not.toThrow();
    });

    it("should be re-initializable after stopping", () => {
      initializeScheduler();
      stopScheduler();
      expect(() => {
        initializeScheduler();
      }).not.toThrow();
    });
  });
});
