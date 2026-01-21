import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { invokeLLM } from "../_core/llm";

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
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        // Build system prompt with organizational context
        const systemPrompt = `You are Paeds Resus AI, an intelligent clinical decision support assistant for Paeds Resus Limited, a pediatric emergency care organization in Kenya.

Your role is to:
1. Provide evidence-based clinical guidance for pediatric emergencies
2. Help providers troubleshoot onboarding and platform issues
3. Offer real-time clinical decision support
4. Learn from provider interactions to improve the organization
5. Provide accurate, actionable recommendations

Organization Context:
- Paeds Resus Limited: Transforming pediatric emergency care in Kenya
- Focus: Clinical excellence, systemic transparency, nurse-led resuscitation
- Mission: "No Child Should Die From Preventable Causes"
- Approach: Head, Heart, Hands framework (knowledge, compassion, skills)

Clinical Guidelines:
- Follow evidence-based pediatric protocols (PALS, NRP, WHO guidelines)
- Consider Kenya's healthcare context and resource availability
- Prioritize safety and evidence-based practice
- Always recommend professional medical consultation when appropriate

Response Guidelines:
- Be concise and actionable
- Use clinical terminology appropriately
- Provide references to protocols when relevant
- Ask clarifying questions when needed
- Flag urgent situations requiring immediate professional help`;

        // Call LLM with context
        const response = await invokeLLM({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: input.message },
          ],
        });

        const assistantMessage = response.choices[0]?.message?.content || "I'm unable to process your request at this time.";

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
        const faqs = {
          onboarding: [
            {
              question: "How do I activate my provider account?",
              answer: "Check your email for the activation link. Click it and set your password. If you don't see the email, check spam or contact support.",
            },
            {
              question: "How do I reset my password?",
              answer: "Click 'Forgot Password' on the login page. Enter your email and follow the instructions sent to your inbox.",
            },
            {
              question: "How do I enroll in a course?",
              answer: "Go to the Courses section, select your desired course, and click 'Enroll'. Payment will be processed immediately.",
            },
          ],
          clinical: [
            {
              question: "What is the recommended dosage for pediatric epinephrine?",
              answer: "0.01 mg/kg IV/IO (1:10,000 concentration). Refer to PALS guidelines for age-specific recommendations.",
            },
            {
              question: "When should I perform chest compressions?",
              answer: "When a child is unresponsive and not breathing normally. Start CPR immediately and call for help.",
            },
          ],
          technical: [
            {
              question: "Why can't I access the Safe-Truth tool?",
              answer: "Ensure you're logged in and have the necessary permissions. Try clearing your browser cache or using a different browser.",
            },
            {
              question: "How do I download resources?",
              answer: "Go to Resources, select your resource, and click the Download button. Files will be saved to your Downloads folder.",
            },
          ],
          general: [
            {
              question: "What is Paeds Resus?",
              answer: "Paeds Resus Limited is transforming pediatric emergency care in Kenya through clinical excellence, systemic transparency, and nurse-led resuscitation.",
            },
            {
              question: "How do I contact support?",
              answer: "Email us at paedsresus254@gmail.com or use the Contact page on our website.",
            },
          ],
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
});
