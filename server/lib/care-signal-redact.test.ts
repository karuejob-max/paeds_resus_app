import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { getDb } from "../db";
import { careSignalEvents } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { redactPendingNarratives } from "./care-signal-redact";

// Mock invokeLLM to prevent actual external API requests
const mockInvokeLLM = vi.fn().mockResolvedValue({
  choices: [
    {
      message: {
        role: "assistant",
        content: "[DEFAULT REDACTED NARRATIVE]",
      },
    },
  ],
});
vi.mock("../_core/llm", () => ({
  invokeLLM: (params: any) => mockInvokeLLM(params),
}));

const hasDatabase = Boolean(process.env.DATABASE_URL);

describe.skipIf(!hasDatabase)("Care Signal Narrative Redaction Job", () => {
  let db: any;
  const testEventType = "test_redact_job_event_type";

  beforeAll(async () => {
    db = await getDb();
    if (!db) {
      throw new Error("Database not available");
    }
    // Clean up any stray test records first
    await db.delete(careSignalEvents).where(eq(careSignalEvents.eventType, testEventType));
  });

  afterAll(async () => {
    // Cleanup test records
    if (db) {
      await db.delete(careSignalEvents).where(eq(careSignalEvents.eventType, testEventType));
    }
  });

  it("should process and redact pending narratives", async () => {
    // Insert a test event with raw narrative but no redacted narrative
    const testEvent = {
      eventDate: new Date(),
      childAge: 12,
      eventType: testEventType,
      presentation: "{}",
      chainOfSurvival: "{}",
      systemGaps: "[]",
      gapDetails: "{}",
      outcome: "survived",
      neurologicalStatus: "unknown",
      rawNarrative: "My patient John Doe was treated at Consolata Hospital.",
      redactedNarrative: null,
    };

    const [insertResult] = await db.insert(careSignalEvents).values(testEvent);
    const eventId = insertResult.insertId;

    // Set mock response for invokeLLM
    mockInvokeLLM.mockResolvedValueOnce({
      choices: [
        {
          message: {
            role: "assistant",
            content: "My patient [PATIENT] was treated at [FACILITY].",
          },
        },
      ],
    });

    // Mock the DB select to return ONLY our newly inserted event
    const mockSelect = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([
        {
          id: eventId,
          rawNarrative: testEvent.rawNarrative,
        }
      ]),
    };
    const selectSpy = vi.spyOn(db, "select").mockReturnValue(mockSelect as any);

    // Run the redaction job
    const result = await redactPendingNarratives(db);

    expect(result.processed).toBe(1);
    expect(result.succeeded).toBe(1);

    // Verify invokeLLM was called
    expect(mockInvokeLLM).toHaveBeenCalled();
    const lastCallArgs = mockInvokeLLM.mock.calls[0][0];
    expect(lastCallArgs.messages[1].content).toBe(testEvent.rawNarrative);

    // Restore select to check the actual database
    selectSpy.mockRestore();

    // Check database to ensure the redactedNarrative was updated correctly
    const [updatedRow] = await db
      .select({ redactedNarrative: careSignalEvents.redactedNarrative })
      .from(careSignalEvents)
      .where(eq(careSignalEvents.id, eventId));

    expect(updatedRow.redactedNarrative).toBe("My patient [PATIENT] was treated at [FACILITY].");
  });

  it("should gracefully handle rate limit errors by pausing processing", async () => {
    // Insert another test event
    const testEvent = {
      eventDate: new Date(),
      childAge: 12,
      eventType: testEventType,
      presentation: "{}",
      chainOfSurvival: "{}",
      systemGaps: "[]",
      gapDetails: "{}",
      outcome: "survived",
      neurologicalStatus: "unknown",
      rawNarrative: "Another raw narrative context.",
      redactedNarrative: null,
    };

    const [insertResult] = await db.insert(careSignalEvents).values(testEvent);
    const eventId = insertResult.insertId;

    // Setup invokeLLM mock to throw a rate limit error (HTTP 429)
    mockInvokeLLM.mockReset();
    mockInvokeLLM.mockRejectedValueOnce(new Error("LLM invoke failed: 429 Too Many Requests"));

    // Mock select query
    const mockSelect = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([
        {
          id: eventId,
          rawNarrative: testEvent.rawNarrative,
        }
      ]),
    };
    const selectSpy = vi.spyOn(db, "select").mockReturnValue(mockSelect as any);

    // Run redaction job
    const result = await redactPendingNarratives(db);

    expect(result.failed).toBe(1);

    // Clean up
    selectSpy.mockRestore();
  });
});
