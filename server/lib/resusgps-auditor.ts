import { eq, inArray, desc } from "drizzle-orm";
import { resusGPSCases, institutionalStaffMembers } from "../../drizzle/schema";
import { invokeLLM } from "../_core/llm";
import type { DbClient } from "../db";

export interface SuggestedAction {
  gapIdentified: string;
  systemChange: string;
}

export interface AuditFinding {
  severity: "critical" | "warning" | "info";
  type: "override" | "delay" | "success" | "resource";
  title: string;
  details: string;
  suggestedAction: SuggestedAction;
}

export interface AuditResult {
  success: boolean;
  scannedCasesCount: number;
  averageDepthScore: number;
  findings: AuditFinding[];
}

export async function runResusGpsAuditForInstitution(
  db: DbClient,
  institutionId: number
): Promise<AuditResult> {
  try {
    // 1. Fetch all user IDs in this institution
    const staff = await db
      .select({ userId: institutionalStaffMembers.userId })
      .from(institutionalStaffMembers)
      .where(eq(institutionalStaffMembers.institutionalAccountId, institutionId));

    const userIds = staff.map((s) => s.userId).filter((uid): uid is number => uid !== null);

    if (userIds.length === 0) {
      return {
        success: true,
        scannedCasesCount: 0,
        averageDepthScore: 0,
        findings: [],
      };
    }

    // 2. Fetch recent ResusGPS cases for these users
    const cases = await db
      .select({
        id: resusGPSCases.id,
        diagnosis: resusGPSCases.diagnosis,
        abcdeCompleted: resusGPSCases.abcdeCompleted,
        interventions: resusGPSCases.interventions,
        reassessments: resusGPSCases.reassessments,
        depthScore: resusGPSCases.depthScore,
        createdAt: resusGPSCases.createdAt,
      })
      .from(resusGPSCases)
      .where(inArray(resusGPSCases.userId, userIds))
      .orderBy(desc(resusGPSCases.id))
      .limit(50);

    if (cases.length === 0) {
      return {
        success: true,
        scannedCasesCount: 0,
        averageDepthScore: 0,
        findings: [],
      };
    }

    // 3. Calculate summary metrics
    const totalScore = cases.reduce((sum, c) => sum + (c.depthScore ?? 0), 0);
    const averageDepthScore = parseFloat((totalScore / cases.length).toFixed(1));

    // 4. Format and de-identify the case actions
    const formattedCases = cases
      .map((c, index) => {
        let interventionsText = "None";
        try {
          if (c.interventions) {
            const parsed = JSON.parse(c.interventions);
            if (Array.isArray(parsed)) {
              interventionsText = parsed
                .map((i: any) => {
                  const actionName = i.actionName || i.name || "Action";
                  const timeSecs = i.timestampSeconds ?? i.time ?? "?";
                  return `- ${actionName} at ${timeSecs}s`;
                })
                .join(", ");
            }
          }
        } catch (e) {
          interventionsText = "Error parsing interventions";
        }

        let reassessmentsText = "None";
        try {
          if (c.reassessments) {
            const parsed = JSON.parse(c.reassessments);
            if (Array.isArray(parsed)) {
              reassessmentsText = parsed
                .map((r: any) => {
                  const finding = r.finding || r.name || "Reassessment";
                  const timeSecs = r.timestampSeconds ?? r.time ?? "?";
                  return `- ${finding} at ${timeSecs}s`;
                })
                .join(", ");
            }
          }
        } catch (e) {
          reassessmentsText = "Error parsing reassessments";
        }

        return `[Case #${index + 1}]
Diagnosis: ${c.diagnosis}
ABCDE Completed: ${c.abcdeCompleted ? "Yes" : "No"}
Interventions: ${interventionsText}
Reassessments: ${reassessmentsText}
Depth Score: ${c.depthScore}`;
      })
      .join("\n\n");

    // 5. Query Gemini to audit cases
    const systemPrompt = `You are a clinical quality auditor specialized in pediatric resuscitation guidelines (PALS, NRP).
Your job is to audit anonymized clinician action logs (ResusGPS cases) from a hospital, identify systemic gaps/overrides/delays, and suggest specific actionable system changes.

Categories of Gaps/Bottlenecks to look for:
- override (protocol deviations or key drug overrides)
- delay (lags between admission/diagnosis and critical steps, e.g. fluid bolus/adrenaline)
- success (patterns of high compliance or early intervention)
- resource (indicators of supply/drug/bed shortage reflected in actions or workarounds)

Ensure all suggested actions suggest concrete systemic solutions (e.g. crash cart checklists, drug pre-loading, visual aids) rather than generic training.

Return ONLY a valid JSON object matching this schema:
{
  "findings": [
    {
      "severity": "critical" | "warning" | "info",
      "type": "override" | "delay" | "success" | "resource",
      "title": "Clear finding name (e.g., Delayed Pediatric Fluid Bolus)",
      "details": "Explanation of clinical audit findings and standard guidelines comparison",
      "suggestedAction": {
        "gapIdentified": "Clear description of the gap",
        "systemChange": "Concrete physical/logistical change to implement at the hospital"
      }
    }
  ]
}`;

    const response = await invokeLLM({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Here is the log of recent ResusGPS cases at this facility:\n\n${formattedCases}` },
      ],
      responseFormat: { type: "json_object" },
    });

    const rawContent = response.choices[0]?.message?.content || "{}";
    const contentStr = typeof rawContent === "string" ? rawContent : JSON.stringify(rawContent);
    const parsed = JSON.parse(contentStr.trim().replace(/^```json\s*/i, "").replace(/```$/i, ""));

    const findings = (parsed.findings || []).map((f: any) => ({
      severity: f.severity || "info",
      type: f.type || "delay",
      title: f.title || "Quality Finding",
      details: f.details || "",
      suggestedAction: {
        gapIdentified: f.suggestedAction?.gapIdentified || "Clinical gap detected in audits",
        systemChange: f.suggestedAction?.systemChange || "Review protocol checklists",
      },
    }));

    return {
      success: true,
      scannedCasesCount: cases.length,
      averageDepthScore,
      findings,
    };
  } catch (error) {
    console.error("[ResusGPS Quality Auditor] runResusGpsAuditForInstitution error:", error);
    return {
      success: false,
      scannedCasesCount: 0,
      averageDepthScore: 0,
      findings: [],
    };
  }
}
