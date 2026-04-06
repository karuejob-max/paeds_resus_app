import { createSupportTicket, getSupportTicketsByUserId, getOpenSupportTickets, getSupportTicketByNumber, addSupportTicketMessage, getSupportTicketMessages } from "../db";
import { invokeLLM } from "../_core/llm";

/**
 * Customer Support Ticket System with AI Routing
 * Manages support tickets, routing, and automated responses
 */

export interface CreateTicketInput {
  userId: number;
  subject: string;
  description: string;
  category?: "technical" | "billing" | "enrollment" | "certificate" | "payment" | "other";
  priority?: "low" | "medium" | "high" | "urgent";
}

export interface TicketMessageInput {
  ticketId: number;
  userId: number;
  message: string;
  isInternal?: boolean;
  attachmentUrl?: string;
}

export interface TicketRoutingResult {
  ticketNumber: string;
  category: string;
  priority: string;
  assignedTo?: number;
  suggestedResponse?: string;
}

/**
 * Create a support ticket
 */
export async function createTicket(input: CreateTicketInput): Promise<TicketRoutingResult> {
  try {
    // Generate ticket number
    const ticketNumber = `TKT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Auto-categorize if not provided
    let category: "technical" | "billing" | "enrollment" | "certificate" | "payment" | "other" = input.category || "other";
    if (!input.category) {
      const autoCategory = await autoCategorizTicket(input.subject, input.description);
      category = autoCategory as "technical" | "billing" | "enrollment" | "certificate" | "payment" | "other";
    }

    // Determine priority
    let priority = input.priority || "medium";
    if (input.description.toLowerCase().includes("urgent") || input.description.toLowerCase().includes("critical")) {
      priority = "urgent";
    } else if (input.description.toLowerCase().includes("payment") || input.description.toLowerCase().includes("certificate")) {
      priority = "high";
    }

    // Create ticket
    await createSupportTicket({
      userId: input.userId,
      ticketNumber,
      subject: input.subject,
      description: input.description,
      category,
      priority,
      status: "open",
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Generate suggested response
    const suggestedResponse = await generateSuggestedResponse(category, input.subject, input.description);

    return {
      ticketNumber,
      category,
      priority,
      suggestedResponse
    };
  } catch (error) {
    console.error("[Support Service] Error creating ticket:", error);
    throw error;
  }
}

/**
 * Auto-categorize ticket using LLM
 */
async function autoCategorizTicket(subject: string, description: string): Promise<string> {
  try {
    const categorization = await invokeLLM({
      messages: [
        {
          role: "system",
          content: "Categorize the support ticket into one of these categories: technical, billing, enrollment, certificate, payment, other. Respond with only the category name."
        },
        {
          role: "user",
          content: `Subject: ${subject}\n\nDescription: ${description}`
        }
      ]
    });

    const content = categorization.choices[0]?.message?.content;
    const categoryText = typeof content === 'string' ? content.toLowerCase() : 'other';

    const validCategories = ['technical', 'billing', 'enrollment', 'certificate', 'payment', 'other'];
    const category = validCategories.find(cat => categoryText.includes(cat)) || 'other';

    return category;
  } catch (error) {
    console.error("[Support Service] Error auto-categorizing ticket:", error);
    return 'other';
  }
}

/**
 * Generate suggested response using LLM
 */
async function generateSuggestedResponse(category: string, subject: string, description: string): Promise<string> {
  try {
    const prompt = `You are a helpful support agent for a pediatric resuscitation training platform. 
    
Category: ${category}
Subject: ${subject}
Description: ${description}

Provide a brief, helpful initial response to this support ticket. Keep it under 150 words.`;

    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: "You are a helpful support agent for a pediatric resuscitation training platform. Provide professional, empathetic support responses."
        },
        {
          role: "user",
          content: prompt
        }
      ]
    });

    const content = response.choices[0]?.message?.content;
    return typeof content === 'string' ? content : '';
  } catch (error) {
    console.error("[Support Service] Error generating suggested response:", error);
    return '';
  }
}

/**
 * Add message to ticket
 */
export async function addTicketMessage(input: TicketMessageInput): Promise<void> {
  try {
    await addSupportTicketMessage({
      ticketId: input.ticketId,
      userId: input.userId,
      message: input.message,
      isInternal: input.isInternal || false,
      attachmentUrl: input.attachmentUrl || null,
      createdAt: new Date()
    });
  } catch (error) {
    console.error("[Support Service] Error adding ticket message:", error);
    throw error;
  }
}

/**
 * Get user's tickets
 */
export async function getUserTickets(userId: number): Promise<any[]> {
  try {
    return await getSupportTicketsByUserId(userId);
  } catch (error) {
    console.error("[Support Service] Error getting user tickets:", error);
    return [];
  }
}

/**
 * Get open tickets for admin
 */
export async function getOpenTicketsForAdmin(limit = 50): Promise<any[]> {
  try {
    return await getOpenSupportTickets(limit);
  } catch (error) {
    console.error("[Support Service] Error getting open tickets:", error);
    return [];
  }
}

/**
 * Get ticket details
 */
export async function getTicketDetails(ticketNumber: string): Promise<any> {
  try {
    const ticket = await getSupportTicketByNumber(ticketNumber);
    if (!ticket) return null;

    const messages = await getSupportTicketMessages(ticket.id);

    return {
      ...ticket,
      messages
    };
  } catch (error) {
    console.error("[Support Service] Error getting ticket details:", error);
    return null;
  }
}

/**
 * Get ticket messages
 */
export async function getTicketMessages(ticketId: number): Promise<any[]> {
  try {
    return await getSupportTicketMessages(ticketId);
  } catch (error) {
    console.error("[Support Service] Error getting ticket messages:", error);
    return [];
  }
}

/**
 * Generate support analytics
 */
export async function generateSupportAnalytics(): Promise<any> {
  try {
    const openTickets = await getOpenSupportTickets(1000);

    // Calculate metrics
    const totalTickets = openTickets.length;
    const urgentTickets = openTickets.filter((t: any) => t.priority === "urgent").length;
    const highPriorityTickets = openTickets.filter((t: any) => t.priority === "high").length;

    // Category breakdown
    const categoryBreakdown: Record<string, number> = {};
    openTickets.forEach((t: any) => {
      categoryBreakdown[t.category] = (categoryBreakdown[t.category] || 0) + 1;
    });

    // Average resolution time (mock - in production would track actual resolution times)
    const avgResolutionTime = 24; // hours

    // Calculate SLA compliance
    const slaCompliance = Math.round((openTickets.filter((t: any) => {
      const createdTime = new Date(t.createdAt).getTime();
      const hoursOld = (Date.now() - createdTime) / (1000 * 60 * 60);
      
      // SLA: Urgent = 4 hours, High = 24 hours, Medium = 48 hours, Low = 72 hours
      const slaHours = t.priority === "urgent" ? 4 : t.priority === "high" ? 24 : t.priority === "medium" ? 48 : 72;
      return hoursOld < slaHours;
    }).length / totalTickets) * 100);

    return {
      timestamp: new Date().toISOString(),
      totalOpenTickets: totalTickets,
      urgentTickets,
      highPriorityTickets,
      categoryBreakdown,
      avgResolutionTime,
      slaCompliance,
      recommendations: generateSupportRecommendations(totalTickets, urgentTickets, slaCompliance)
    };
  } catch (error) {
    console.error("[Support Service] Error generating analytics:", error);
    throw error;
  }
}

/**
 * Generate support recommendations
 */
function generateSupportRecommendations(totalTickets: number, urgentTickets: number, slaCompliance: number): string[] {
  const recommendations: string[] = [];

  if (urgentTickets > 5) {
    recommendations.push(`URGENT: ${urgentTickets} urgent tickets pending. Prioritize immediate resolution.`);
  }

  if (totalTickets > 50) {
    recommendations.push(`High ticket volume (${totalTickets} open). Consider hiring additional support staff.`);
  }

  if (slaCompliance < 80) {
    recommendations.push(`SLA compliance is ${slaCompliance}%. Improve response times to meet service level agreements.`);
  } else if (slaCompliance >= 95) {
    recommendations.push(`Excellent SLA compliance at ${slaCompliance}%. Maintain current support quality.`);
  }

  return recommendations;
}

/**
 * Generate FAQ from common support issues
 */
export async function generateFAQFromTickets(tickets: any[]): Promise<Array<{ question: string; answer: string }>> {
  try {
    if (tickets.length === 0) return [];

    // Group tickets by category and extract common issues
    const commonIssues = tickets
      .slice(0, 20)
      .map((t: any) => `Q: ${t.subject}\nA: ${t.description}`)
      .join("\n\n");

    const faqGeneration = await invokeLLM({
      messages: [
        {
          role: "system",
          content: "Extract the top 5 frequently asked questions and provide clear answers based on the support tickets provided. Return as a JSON array with 'question' and 'answer' fields."
        },
        {
          role: "user",
          content: commonIssues
        }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "faq",
          strict: true,
          schema: {
            type: "object",
            properties: {
              faqs: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    question: { type: "string" },
                    answer: { type: "string" }
                  },
                  required: ["question", "answer"],
                  additionalProperties: false
                }
              }
            },
            required: ["faqs"],
            additionalProperties: false
          }
        }
      }
    });

    try {
      const content = faqGeneration.choices[0]?.message?.content;
      const contentStr = typeof content === 'string' ? content : '{}';
      const parsed = JSON.parse(contentStr);
      return parsed.faqs || [];
    } catch (parseError) {
      console.warn("[Support Service] Failed to parse FAQ generation:", parseError);
      return [];
    }
  } catch (error) {
    console.error("[Support Service] Error generating FAQ:", error);
    return [];
  }
}
