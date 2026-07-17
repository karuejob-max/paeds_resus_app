import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { invokeLLM } from "../_core/llm";
import { AI_SYSTEM_PROMPT, COMMON_QUESTIONS, EMERGENCY_CONTACTS } from "../knowledge-base";
import {
  looksLikeBedsideClinicalRequest,
  PLATFORM_HELP_SYSTEM_PROMPT,
  QUIZ_TUTOR_SYSTEM_PROMPT,
  BEDSIDE_REDIRECT_REPLY,
} from "../lib/gemini-user-assist";

/**
 * Paeds Resus AI Assistant Router
 * Provides clinical decision support, troubleshooting, and organizational learning
 */

export const aiAssistantRouter = router({
  // Send message to AI assistant
  sendMessage: protectedProcedure
    .input(
      z.object({
        message: z.string().min(1).max(5000),
        context: z.enum(["onboarding", "clinical", "troubleshooting", "general"]).optional(),
        conversationId: z.string().optional(),
        messages: z.array(
          z.object({
            role: z.enum(["user", "assistant"]),
            content: z.string(),
          })
        ).default([]),
        pageContext: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        // Check if message is a bedside clinical request
        if (looksLikeBedsideClinicalRequest(input.message)) {
          return {
            success: true,
            response: BEDSIDE_REDIRECT_REPLY,
            conversationId: input.conversationId || `conv-${Date.now()}`,
            timestamp: new Date(),
          };
        }

        let systemPrompt = PLATFORM_HELP_SYSTEM_PROMPT;
        if (input.pageContext) {
          systemPrompt += `\n\n[Current Page Context: The user is currently viewing the page: ${input.pageContext}. Use this to help them with queries related to this module, course, or tool if appropriate.]`;
        }

        const llmMessages: { role: "system" | "user" | "assistant"; content: string }[] = [
          { role: "system", content: systemPrompt }
        ];

        if (input.messages && input.messages.length > 0) {
          llmMessages.push(...input.messages.map(m => ({
            role: m.role as "user" | "assistant",
            content: m.content
          })));
        }

        llmMessages.push({ role: "user" as const, content: input.message });

        // Call LLM with context
        const response = await invokeLLM({
          messages: llmMessages,
        });

        const rawContent = response.choices[0]?.message?.content || "I'm unable to process your request at this time.";
        const assistantMessage = typeof rawContent === "string"
          ? rawContent
          : Array.isArray(rawContent)
            ? rawContent.map(part => ("text" in part ? part.text : "")).join("")
            : "I'm unable to process your request at this time.";

        // Log interaction for learning
        console.log(`[AI Assistant] Provider ${ctx.user.id} - Context: ${input.context} - Message: ${input.message.substring(0, 100)}`);

        return {
          success: true,
          response: assistantMessage,
          conversationId: input.conversationId || `conv-${Date.now()}`,
          timestamp: new Date(),
        };
      } catch (error) {
        console.error("[AI Assistant] Error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to process your message",
        });
      }
    }),

  // Get quiz tutoring response explanation
  getQuizTutorResponse: protectedProcedure
    .input(
      z.object({
        question: z.string(),
        options: z.array(z.string()),
        correctOption: z.string(),
        userAnswer: z.string(),
        explanation: z.string(),
        messages: z.array(
          z.object({
            role: z.enum(["user", "assistant"]),
            content: z.string(),
          })
        ).default([]),
        userQuery: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        // Clinical safety check on the query if provided
        if (input.userQuery && looksLikeBedsideClinicalRequest(input.userQuery)) {
          return {
            success: true,
            response: BEDSIDE_REDIRECT_REPLY,
            timestamp: new Date(),
          };
        }

        // Build messages starting with question context
        const optionsText = Array.isArray(input.options) ? input.options.join(", ") : "";
        const contextMessage = `Quiz Question Context:
Question: ${input.question}
Options: ${optionsText}
Correct Option: ${input.correctOption}
User's Answer: ${input.userAnswer}
Official Explanation: ${input.explanation}`;

        const initialUserMsg = `Here is the quiz context:\n\n${contextMessage}\n\nPlease explain this question, why the correct option is correct, and clarify any potential misconceptions based on my answer.`;

        const llmMessages: { role: "system" | "user" | "assistant"; content: string }[] = [
          { role: "system", content: QUIZ_TUTOR_SYSTEM_PROMPT },
          { role: "user", content: initialUserMsg }
        ];

        if (input.messages && input.messages.length > 0) {
          llmMessages.push(...input.messages.map(m => ({
            role: m.role as "user" | "assistant",
            content: m.content
          })));
        }

        if (input.userQuery) {
          if (!input.messages || input.messages.length === 0) {
            llmMessages[1].content = `${initialUserMsg}\n\nAdditional follow-up question: ${input.userQuery}`;
          } else {
            llmMessages.push({ role: "user" as const, content: input.userQuery });
          }
        }

        const response = await invokeLLM({
          messages: llmMessages,
        });

        const rawReply = response.choices[0]?.message?.content || "I'm unable to explain this question at this time.";
        const reply = typeof rawReply === "string"
          ? rawReply
          : Array.isArray(rawReply)
            ? rawReply.map(part => ("text" in part ? part.text : "")).join("")
            : "I'm unable to explain this question at this time.";

        return {
          success: true,
          response: reply,
          timestamp: new Date(),
        };
      } catch (error) {
        console.error("[AI Assistant] Quiz Tutor Error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to generate tutoring explanation",
        });
      }
    }),

  // Get detailed physiological rationale analysis
  getQuizGuideAnalysis: protectedProcedure
    .input(
      z.object({
        question: z.string(),
        options: z.array(z.string()),
        correctOption: z.string(),
        userAnswer: z.string(),
        explanation: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const systemPrompt = `You are an expert pediatric emergency medicine tutor and clinical physiologist.
Analyze the following multiple-choice quiz question and the user's selected option.

Question: ${input.question}
Options: ${input.options.join(", ")}
Correct Option: ${input.correctOption}
User's Selected Answer: ${input.userAnswer}
Official Brief Rationale: ${input.explanation}

Provide a deep, high-fidelity physiological analysis structured for a clinician.
Assess why the correct option is physiologically superior, why the user's incorrect option fails or presents risks, and clear up any common misconceptions.

Respond ONLY with a JSON object matching this schema:
{
  "pathophysiology": "Detailed markdown explanation of the cellular/organ-level physiology behind the question and correct action.",
  "comparison": "A direct comparison showing why the user's choice (${input.userAnswer}) is clinically inferior or dangerous compared to the correct choice (${input.correctOption}). If the user answered correctly, explain why other distractors are dangerous.",
  "clinicalTakeaway": "A concise bulleted list of 2-3 clinical pearls or memory guides for this scenario."
}`;

        const response = await invokeLLM({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: "Please analyze this question and response." }
          ],
          responseFormat: { type: "json_object" },
        });

        const rawContent = response.choices[0]?.message?.content || "{}";
        const contentStr = typeof rawContent === "string" ? rawContent : JSON.stringify(rawContent);
        const parsed = JSON.parse(contentStr.trim().replace(/^```json\s*/i, "").replace(/```$/i, ""));

        return {
          success: true,
          pathophysiology: parsed.pathophysiology || "Pathophysiological analysis unavailable.",
          comparison: parsed.comparison || "Direct clinical comparison unavailable.",
          clinicalTakeaway: parsed.clinicalTakeaway || "Clinical takeaway unavailable.",
        };
      } catch (error) {
        console.error("[AI Assistant] Quiz Guide Analysis Error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to generate detailed quiz analysis",
        });
      }
    }),

  // Get clinical decision support
  getClinicalSupport: protectedProcedure
    .input(
      z.object({
        scenario: z.string().min(10),
        patientAge: z.number().optional(),
        symptoms: z.array(z.string()).optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        if (looksLikeBedsideClinicalRequest(input.scenario)) {
          return {
            support: BEDSIDE_REDIRECT_REPLY,
            timestamp: new Date(),
          };
        }

        const systemPrompt = `You are a pediatric emergency medicine expert for Paeds Resus Limited. Provide evidence-based clinical decision support for the following scenario.

Format your response with:
1. Initial Assessment
2. Differential Diagnosis
3. Recommended Actions
4. Key Monitoring Points
5. When to Escalate

Always reference relevant protocols and guidelines.`;

        const userMessage = `Patient Age: ${input.patientAge || "Not specified"}
Symptoms: ${input.symptoms?.join(", ") || "Not specified"}

Clinical Scenario: ${input.scenario}`;

        const response = await invokeLLM({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userMessage },
          ],
        });

        return {
          support: response.choices[0]?.message?.content || "Unable to generate support",
          timestamp: new Date(),
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to generate clinical support",
        });
      }
    }),

  // Troubleshooting assistance
  getTroubleshootingHelp: protectedProcedure
    .input(
      z.object({
        issue: z.string().min(10),
        context: z.string().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        if (looksLikeBedsideClinicalRequest(input.issue) || (input.context && looksLikeBedsideClinicalRequest(input.context))) {
          return {
            solution: BEDSIDE_REDIRECT_REPLY,
            timestamp: new Date(),
          };
        }

        const systemPrompt = `You are a technical support specialist for Paeds Resus platform. Help users troubleshoot their issues.

Provide:
1. Likely Cause
2. Step-by-Step Solution
3. If the issue persists, provide escalation steps
4. Contact support if needed

Be empathetic and clear in your explanations.`;

        const userMessage = `Issue: ${input.issue}
${input.context ? `Additional Context: ${input.context}` : ""}`;

        const response = await invokeLLM({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userMessage },
          ],
        });

        return {
          solution: response.choices[0]?.message?.content || "Unable to generate solution",
          timestamp: new Date(),
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to generate troubleshooting help",
        });
      }
    }),

  // Get protocol quick reference
  getProtocolReference: protectedProcedure
    .input(
      z.object({
        protocolName: z.string(),
        query: z.string().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        if (looksLikeBedsideClinicalRequest(input.protocolName) || (input.query && looksLikeBedsideClinicalRequest(input.query))) {
          return {
            reference: BEDSIDE_REDIRECT_REPLY,
            timestamp: new Date(),
          };
        }

        const systemPrompt = `You are a clinical protocol reference expert. Provide quick reference information for the requested protocol.

Format as:
- Key Steps
- Critical Checkpoints
- Common Pitfalls
- Evidence Base

Keep it concise and actionable for busy clinicians.`;

        const userMessage = `Protocol: ${input.protocolName}
${input.query ? `Specific Question: ${input.query}` : ""}`;

        const response = await invokeLLM({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userMessage },
          ],
        });

        return {
          reference: response.choices[0]?.message?.content || "Protocol reference not available",
          timestamp: new Date(),
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to retrieve protocol reference",
        });
      }
    }),

  // Log feedback for learning
  submitFeedback: protectedProcedure
    .input(
      z.object({
        conversationId: z.string(),
        helpful: z.boolean(),
        feedback: z.string().optional(),
        category: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        console.log(`[AI Learning] Provider ${ctx.user.id} - Conversation ${input.conversationId} - Helpful: ${input.helpful}`);
        console.log(`[AI Learning] Feedback: ${input.feedback}`);

        return {
          success: true,
          message: "Thank you for your feedback. This helps us improve.",
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to submit feedback",
        });
      }
    }),

  // Get frequently asked questions
  getFAQ: publicProcedure
    .input(
      z.object({
        category: z.enum(["onboarding", "clinical", "technical", "general"]).optional(),
      })
    )
    .query(async ({ input }) => {
      try {
        // Use knowledge base FAQs
        const faqs = {
          onboarding: COMMON_QUESTIONS.filter(q => q.category === "Onboarding").map(q => ({
            question: q.question,
            answer: q.answer,
          })),
          clinical: COMMON_QUESTIONS.filter(q => q.category === "Clinical").map(q => ({
            question: q.question,
            answer: q.answer,
          })),
          technical: COMMON_QUESTIONS.filter(q => q.category === "Technical").map(q => ({
            question: q.question,
            answer: q.answer,
          })),
          general: COMMON_QUESTIONS.filter(q => q.category === "General").map(q => ({
            question: q.question,
            answer: q.answer,
          })),
        };

        return {
          faqs: input.category ? faqs[input.category] : Object.values(faqs).flat(),
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch FAQs",
        });
      }
    }),

  // Get AI assistant status and capabilities
  getAssistantStatus: publicProcedure.query(async () => {
    try {
      return {
        status: "online",
        capabilities: [
          "Clinical decision support",
          "Protocol reference",
          "Troubleshooting assistance",
          "FAQ lookup",
          "Real-time guidance",
          "Organizational learning",
        ],
        responseTime: "< 2 seconds",
        availableHours: "24/7",
      };
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to get assistant status",
      });
    }
  }),

  // Get conversation history
  getConversationHistory: protectedProcedure
    .input(
      z.object({
        conversationId: z.string(),
        limit: z.number().default(50),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        // TODO: Fetch from database
        return {
          conversationId: input.conversationId,
          messages: [],
          total: 0,
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch conversation history",
        });
      }
    }),

  // Save conversation
  saveConversation: protectedProcedure
    .input(
      z.object({
        conversationId: z.string(),
        title: z.string().optional(),
        messages: z.array(
          z.object({
            role: z.enum(["user", "assistant"]),
            content: z.string(),
          })
        ),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        console.log(`[AI Assistant] Saved conversation ${input.conversationId} for provider ${ctx.user.id}`);

        return {
          success: true,
          conversationId: input.conversationId,
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to save conversation",
        });
      }
    }),

  // Generate simulation SBAR and clinical debriefing feedback
  generateSimulationDebrief: protectedProcedure
    .input(
      z.object({
        sessionId: z.string(),
        emergencyType: z.string(),
        patient: z.object({
          name: z.string(),
          age: z.number(),
          weightKg: z.number(),
          gender: z.enum(["M", "F", "Unknown"]),
          medicalRecordNumber: z.string().optional(),
        }),
        startTime: z.number(),
        endTime: z.number(),
        events: z.array(
          z.object({
            timestamp: z.number(),
            eventType: z.string(),
            description: z.string(),
            value: z.union([z.string(), z.number()]).optional(),
            unit: z.string().optional(),
          })
        ),
        overrides: z.array(
          z.object({
            timestamp: z.number(),
            overrideType: z.string(),
            justification: z.string(),
            provider: z.string(),
          })
        ),
        finalOutcome: z.enum(["ROSC", "Transferred", "Ongoing", "Terminated"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const DEBRIEF_SYSTEM_PROMPT = `You are a pediatric emergency medicine simulation debriefing auditor.
Analyze the resuscitation simulation timeline and construct a professional SBAR handover report and clinical debriefing feedback.
De-identify the patient: refer to them as "the patient" or "the child", NEVER use their literal name.

Return ONLY a valid JSON object matching this schema:
{
  "sbar": {
    "situation": "Situation section summarizing chief complaint, demographics (except name), duration",
    "background": "Background section summarizing timeline, key interventions, and documented protocol deviations/overrides",
    "assessment": "Assessment section detailing clinical status, vitals, and response to treatments",
    "recommendation": "Recommendation section listing next steps, transfers, and immediate plans"
  },
  "feedback": {
    "strengths": ["Strengths demonstrated (at least 2 items)"],
    "delays": ["Critical delays or missed timing of actions compared to resuscitation guidelines (e.g. CPR start, adrenaline intervals)"],
    "correctiveActions": ["Specific clinical corrective actions recommended (at least 2 items)"],
    "spacedRepetitionTopic": "The specific micro-course topic ID recommended for review (e.g. bls, acls, pals, septic-shock)"
  }
}`;

        // Prepare context data (de-identifying patient name to protect privacy)
        const durationMinutes = Math.round((input.endTime - input.startTime) / 60000);
        const ageText = input.patient.age < 1 ? `${Math.round(input.patient.age * 12)} months` : `${input.patient.age} years`;
        const patientContext = `Patient Demographics: Age: ${ageText}, Weight: ${input.patient.weightKg}kg, Gender: ${input.patient.gender}`;
        
        const eventsText = input.events
          .map((e) => {
            const timeOffset = Math.round((e.timestamp - input.startTime) / 1000);
            return `[Time: ${timeOffset}s] ${e.eventType}: ${e.description}${e.value ? ` (value: ${e.value} ${e.unit || ''})` : ''}`;
          })
          .join('\n');

        const overridesText = input.overrides
          .map((o) => `[Override] Type: ${o.overrideType}, Justification: ${o.justification}`)
          .join('\n');

        const userPayload = `Emergency Case Details:
Emergency Type: ${input.emergencyType}
Duration: ${durationMinutes} minutes
Final Outcome: ${input.finalOutcome}
${patientContext}

Session Events Timeline:
${eventsText}

Documented Deviations:
${overridesText || "None"}`;

        const response = await invokeLLM({
          messages: [
            { role: "system", content: DEBRIEF_SYSTEM_PROMPT },
            { role: "user", content: userPayload },
          ],
          responseFormat: { type: "json_object" },
        });

        const rawContent = response.choices[0]?.message?.content || "{}";
        const contentStr = typeof rawContent === "string" ? rawContent : JSON.stringify(rawContent);
        
        const parsed = JSON.parse(contentStr.trim().replace(/^```json\s*/i, "").replace(/```$/i, ""));

        return {
          success: true,
          sbar: parsed.sbar || { situation: "", background: "", assessment: "", recommendation: "" },
          feedback: parsed.feedback || { strengths: [], delays: [], correctiveActions: [], spacedRepetitionTopic: "general" },
        };
      } catch (error) {
        console.error("[AI Assistant] generateSimulationDebrief error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to generate simulation debriefing summary",
        });
      }
    }),
});
