import { describe, expect, it, vi } from "vitest";
import { runResusGpsAuditForInstitution } from "./resusgps-auditor";
import { institutionRouter } from "../routers/institution";
import type { TrpcContext } from "../_core/context";

const mockInvokeLLM = vi.fn().mockResolvedValue({
  choices: [
    {
      message: {
        content: "Mocked Gemini Response",
      },
    },
  ],
});

vi.mock("../_core/llm", () => ({
  invokeLLM: (...args: any[]) => mockInvokeLLM(...args),
}));

vi.mock("../db", () => {
  const staffMock = [{ userId: 7001 }];
  const casesMock = [
    {
      id: 42,
      userId: 7001,
      diagnosis: "septic-shock",
      abcdeCompleted: true,
      interventions: JSON.stringify([{ actionName: "Fluid Bolus 20ml/kg", timestampSeconds: 90 }]),
      reassessments: JSON.stringify([{ finding: "Capillary refill 2s", timestampSeconds: 120 }]),
      depthScore: 92,
      createdAt: new Date(),
    }
  ];

  return {
    getDb: vi.fn().mockResolvedValue({
      select: vi.fn().mockImplementation(() => ({
        from: vi.fn().mockImplementation(() => ({
          where: vi.fn().mockImplementation(() => {
            const chain = {
              orderBy: vi.fn().mockImplementation(() => ({
                limit: vi.fn().mockResolvedValue(casesMock)
              })),
              then: (onfulfilled: any) => Promise.resolve(staffMock).then(onfulfilled)
            };
            return chain;
          })
        }))
      })),
      insert: vi.fn().mockImplementation(() => ({
        values: vi.fn().mockResolvedValue({ success: true }),
      })),
    }),
    insertAdminAuditLog: vi.fn().mockResolvedValue({ success: true })
  };
});

function createAuthContext(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "test-provider",
      email: "test@example.com",
      name: "Test Provider",
      loginMethod: "manus",
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {
      protocol: "https",
      headers: {},
    } as any,
    res: {} as any,
  };
}

describe("resusgps-auditor", () => {
  describe("runResusGpsAuditForInstitution", () => {
    it("aggregates cases and triggers Gemini quality audit scan", async () => {
      mockInvokeLLM.mockClear();
      const mockResponse = JSON.stringify({
        findings: [
          {
            severity: "critical",
            type: "delay",
            title: "Delayed Septic Shock Fluid Bolus",
            details: "Standard fluid boluses delayed beyond 15 minutes",
            suggestedAction: {
              gapIdentified: "Deficiencies in sepsis bundle deployment timing",
              systemChange: "Station pre-measured normal saline bags in pediatric resuscitation bay",
            },
          },
        ],
      });

      mockInvokeLLM.mockResolvedValueOnce({
        choices: [
          {
            message: {
              content: mockResponse,
            },
          },
        ],
      });

      const ctx = createAuthContext();
      const caller = institutionRouter.createCaller(ctx);

      const result = await caller.runResusGpsAudit({ institutionId: 10 });

      expect(result.success).toBe(true);
      expect(result.scannedCasesCount).toBe(1);
      expect(result.averageDepthScore).toBe(92);
      expect(result.findings.length).toBe(1);
      expect(result.findings[0].title).toBe("Delayed Septic Shock Fluid Bolus");

      const callArgs = mockInvokeLLM.mock.calls[0][0];
      expect(callArgs.messages[0].content).toContain("clinical quality auditor");
      expect(callArgs.messages[1].content).not.toContain("7001");
      expect(callArgs.messages[1].content).toContain("Fluid Bolus 20ml/kg");
    });
  });

  describe("importResusGpsAuditAction", () => {
    it("imports suggested action directly into institutionalActionLogs as open gap", async () => {
      const ctx = createAuthContext();
      const caller = institutionRouter.createCaller(ctx);

      const result = await caller.importResusGpsAuditAction({
        institutionId: 10,
        gapIdentified: "Deficiencies in sepsis bundle timing",
        systemChange: "Pre-measured saline bags in pediatric resus bay",
      });

      expect(result.success).toBe(true);
    });
  });
});
