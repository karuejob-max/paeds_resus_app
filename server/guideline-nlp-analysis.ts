// NLP-Based Guideline Change Detection and Impact Analysis
// Uses LLM to analyze guideline changes and assess clinical impact

import { invokeLLM } from './_core/llm';
import { db } from './db';
import { guidelineChanges, protocolStatus } from '../drizzle/schema';
import { eq } from 'drizzle-orm';

/**
 * Analyze guideline change using NLP to determine:
 * 1. Type of change (major revision, minor update, clarification, new evidence, withdrawn recommendation)
 * 2. Severity (critical, high, moderate, low)
 * 3. Clinical impact description
 * 4. Affected protocols
 */
export async function analyzeGuidelineChange(params: {
  guidelineId: number;
  guidelineTitle: string;
  organization: string;
  previousVersion: string;
  newVersion: string;
  previousContent: string;
  newContent: string;
  category: string;
}): Promise<{
  changeType: 'major_revision' | 'minor_update' | 'clarification' | 'new_evidence' | 'withdrawn_recommendation';
  severity: 'critical' | 'high' | 'moderate' | 'low';
  changeDescription: string;
  clinicalImpact: string;
  affectedProtocols: string[];
  keyChanges: Array<{
    section: string;
    change: string;
    impact: string;
  }>;
}> {
  // Use LLM to analyze guideline changes
  const analysisPrompt = `You are a clinical guideline expert analyzing changes between two versions of a clinical guideline.

**Guideline Information:**
- Organization: ${params.organization}
- Title: ${params.guidelineTitle}
- Category: ${params.category}
- Previous Version: ${params.previousVersion}
- New Version: ${params.newVersion}

**Previous Content:**
${params.previousContent.substring(0, 10000)} // Limit to 10k chars

**New Content:**
${params.newContent.substring(0, 10000)} // Limit to 10k chars

**Task:** Analyze the changes and provide a structured assessment.

**Output Format (JSON):**
{
  "changeType": "major_revision" | "minor_update" | "clarification" | "new_evidence" | "withdrawn_recommendation",
  "severity": "critical" | "high" | "moderate" | "low",
  "changeDescription": "Brief summary of what changed",
  "clinicalImpact": "Detailed description of how this affects clinical practice",
  "affectedProtocols": ["protocol_id_1", "protocol_id_2"],
  "keyChanges": [
    {
      "section": "Section name",
      "change": "What changed",
      "impact": "Clinical significance"
    }
  ]
}

**Severity Criteria:**
- **Critical:** Changes that could result in patient harm if not implemented immediately (e.g., contraindication added, dosing changed, new life-threatening complication identified)
- **High:** Significant changes to treatment approach or diagnostic criteria that affect most patients
- **Moderate:** Updates to recommendations that affect some patients or specific scenarios
- **Low:** Clarifications, editorial changes, or updates that don't change clinical practice

**Change Type Criteria:**
- **Major Revision:** Complete overhaul of guidelines, new treatment algorithms, significant evidence updates
- **Minor Update:** Refinements to existing recommendations, additional evidence supporting current practice
- **Clarification:** Explanatory text added without changing recommendations
- **New Evidence:** New studies added that may inform future guideline changes
- **Withdrawn Recommendation:** Previously recommended intervention no longer advised

Analyze the changes and return ONLY the JSON object.`;

  try {
    const response = await invokeLLM({
      messages: [
        {
          role: 'system',
          content:
            'You are a clinical guideline expert. Analyze guideline changes and return structured JSON output.',
        },
        {
          role: 'user',
          content: analysisPrompt,
        },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'guideline_analysis',
          strict: true,
          schema: {
            type: 'object',
            properties: {
              changeType: {
                type: 'string',
                enum: ['major_revision', 'minor_update', 'clarification', 'new_evidence', 'withdrawn_recommendation'],
              },
              severity: {
                type: 'string',
                enum: ['critical', 'high', 'moderate', 'low'],
              },
              changeDescription: {
                type: 'string',
              },
              clinicalImpact: {
                type: 'string',
              },
              affectedProtocols: {
                type: 'array',
                items: {
                  type: 'string',
                },
              },
              keyChanges: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    section: {
                      type: 'string',
                    },
                    change: {
                      type: 'string',
                    },
                    impact: {
                      type: 'string',
                    },
                  },
                  required: ['section', 'change', 'impact'],
                  additionalProperties: false,
                },
              },
            },
            required: ['changeType', 'severity', 'changeDescription', 'clinicalImpact', 'affectedProtocols', 'keyChanges'],
            additionalProperties: false,
          },
        },
      },
    });

    const analysis = JSON.parse(response.choices[0].message.content);

    // Store analysis in database
    await db.insert(guidelineChanges).values({
      guidelineId: params.guidelineId,
      previousVersion: params.previousVersion,
      newVersion: params.newVersion,
      changeType: analysis.changeType,
      severity: analysis.severity,
      changeDescription: analysis.changeDescription,
      affectedProtocols: analysis.affectedProtocols,
      clinicalImpact: analysis.clinicalImpact,
      detectedAt: new Date(),
      reviewStatus: analysis.severity === 'critical' ? 'pending' : 'under_review',
    });

    // Update affected protocols
    for (const protocolId of analysis.affectedProtocols) {
      await updateProtocolStatus(protocolId, analysis.severity, analysis.changeDescription);
    }

    return analysis;
  } catch (error) {
    console.error('Error analyzing guideline change:', error);
    
    // Fallback: Return conservative analysis
    return {
      changeType: 'major_revision',
      severity: 'high',
      changeDescription: 'Guideline updated - manual review required',
      clinicalImpact: 'Unable to automatically assess impact. Manual review recommended.',
      affectedProtocols: [],
      keyChanges: [],
    };
  }
}

/**
 * Update protocol status based on guideline change
 */
async function updateProtocolStatus(
  protocolId: string,
  severity: 'critical' | 'high' | 'moderate' | 'low',
  changeDescription: string
): Promise<void> {
  // Check if protocol status exists
  const existing = await db
    .select()
    .from(protocolStatus)
    .where(eq(protocolStatus.protocolId, protocolId))
    .limit(1);

  const priority = severity === 'critical' ? 'urgent' : severity === 'high' ? 'high' : 'normal';

  if (existing.length === 0) {
    // Create new protocol status
    await db.insert(protocolStatus).values({
      protocolId,
      protocolName: protocolId.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
      currentStatus: 'flagged',
      lastUpdated: new Date(),
      lastReviewed: new Date(),
      nextReviewDue: new Date(Date.now() + (severity === 'critical' ? 7 : 30) * 24 * 60 * 60 * 1000),
      pendingChanges: 1,
      flagReason: changeDescription,
      priority,
    });
  } else {
    // Update existing protocol status
    const currentPriority = existing[0].priority;
    const newPriority =
      currentPriority === 'urgent' || priority === 'urgent'
        ? 'urgent'
        : currentPriority === 'high' || priority === 'high'
        ? 'high'
        : 'normal';

    await db
      .update(protocolStatus)
      .set({
        currentStatus: 'flagged',
        pendingChanges: (existing[0].pendingChanges || 0) + 1,
        flagReason: `${existing[0].flagReason || ''}\n\n${changeDescription}`,
        priority: newPriority,
        updatedAt: new Date(),
      })
      .where(eq(protocolStatus.id, existing[0].id));
  }
}

/**
 * Generate implementation recommendations for guideline change
 */
export async function generateImplementationRecommendations(params: {
  guidelineChangeId: number;
  protocolId: string;
  changeDescription: string;
  clinicalImpact: string;
  keyChanges: Array<{
    section: string;
    change: string;
    impact: string;
  }>;
}): Promise<{
  recommendations: string[];
  estimatedEffort: 'low' | 'medium' | 'high';
  requiredExpertise: string[];
  testingRequired: boolean;
}> {
  const prompt = `You are a clinical protocol implementation expert. Generate recommendations for implementing a guideline change into an existing clinical protocol.

**Guideline Change:**
${params.changeDescription}

**Clinical Impact:**
${params.clinicalImpact}

**Key Changes:**
${params.keyChanges.map((c) => `- ${c.section}: ${c.change} (Impact: ${c.impact})`).join('\n')}

**Task:** Generate implementation recommendations.

**Output Format (JSON):**
{
  "recommendations": ["Step 1", "Step 2", "Step 3"],
  "estimatedEffort": "low" | "medium" | "high",
  "requiredExpertise": ["expertise_area_1", "expertise_area_2"],
  "testingRequired": true | false
}

Return ONLY the JSON object.`;

  try {
    const response = await invokeLLM({
      messages: [
        {
          role: 'system',
          content: 'You are a clinical protocol implementation expert. Return structured JSON output.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'implementation_recommendations',
          strict: true,
          schema: {
            type: 'object',
            properties: {
              recommendations: {
                type: 'array',
                items: {
                  type: 'string',
                },
              },
              estimatedEffort: {
                type: 'string',
                enum: ['low', 'medium', 'high'],
              },
              requiredExpertise: {
                type: 'array',
                items: {
                  type: 'string',
                },
              },
              testingRequired: {
                type: 'boolean',
              },
            },
            required: ['recommendations', 'estimatedEffort', 'requiredExpertise', 'testingRequired'],
            additionalProperties: false,
          },
        },
      },
    });

    return JSON.parse(response.choices[0].message.content);
  } catch (error) {
    console.error('Error generating implementation recommendations:', error);
    
    return {
      recommendations: ['Review guideline change', 'Update protocol documentation', 'Test changes', 'Deploy updates'],
      estimatedEffort: 'medium',
      requiredExpertise: ['Clinical expert', 'Protocol developer'],
      testingRequired: true,
    };
  }
}
