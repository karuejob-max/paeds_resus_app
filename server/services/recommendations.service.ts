import { userInsights } from "../../drizzle/schema";
import { getDb } from "../db";
import { invokeLLM } from "../_core/llm";

export interface RecommendationInput {
  userId: number;
  systemGapsIdentified: string[];
  eventOutcome: string;
  userRole: string;
  workstation?: string;
}

export interface Recommendation {
  title: string;
  content: string;
  actionUrl?: string;
  priority: "low" | "medium" | "high";
  actionable: boolean;
}

/**
 * Generate personalized recommendations based on user role and system gaps
 */
export async function generateRoleBasedRecommendations(
  input: RecommendationInput
): Promise<Recommendation[]> {
  const { userId, systemGapsIdentified, eventOutcome, userRole, workstation } = input;

  const recommendations: Recommendation[] = [];

  // Clinician-specific recommendations
  if (userRole === "clinician") {
    recommendations.push(...generateClinicianRecommendations(systemGapsIdentified, eventOutcome));
  }

  // Nurse-specific recommendations
  if (userRole === "nurse") {
    recommendations.push(...generateNurseRecommendations(systemGapsIdentified, eventOutcome, workstation));
  }

  // Facility Manager recommendations
  if (userRole === "facility_manager") {
    recommendations.push(...generateFacilityManagerRecommendations(systemGapsIdentified));
  }

  // Parent/Caregiver recommendations
  if (userRole === "parent_caregiver") {
    recommendations.push(...generateParentCaregiverRecommendations(systemGapsIdentified));
  }

  // Government/Insurance recommendations
  if (userRole === "government" || userRole === "insurance") {
    recommendations.push(...generateGovernmentInsuranceRecommendations(systemGapsIdentified));
  }

  // Save recommendations to database
  const db = await getDb();
  if (db) {
    for (const rec of recommendations) {
      await db.insert(userInsights).values({
        userId,
        insightType: "gap_recommendation",
        title: rec.title,
        content: rec.content,
        actionUrl: rec.actionUrl,
        priority: rec.priority,
        actionable: rec.actionable,
      });
    }
  }

  return recommendations;
}

/**
 * Generate clinician-specific recommendations
 */
function generateClinicianRecommendations(gaps: string[], outcome: string): Recommendation[] {
  const recommendations: Recommendation[] = [];

  if (gaps.includes("Knowledge Gap")) {
    recommendations.push({
      title: "Enhance Your Clinical Knowledge",
      content:
        "Consider enrolling in our Advanced Pediatric Resuscitation course to deepen your knowledge of the latest evidence-based protocols and techniques.",
      actionUrl: "/elite-fellowship",
      priority: "high",
      actionable: true,
    });
  }

  if (gaps.includes("Protocol Gap")) {
    recommendations.push({
      title: "Review and Update Protocols",
      content:
        "Work with your facility leadership to review and update pediatric emergency protocols based on current guidelines. Access our protocol templates in Resources.",
      actionUrl: "/resources",
      priority: "high",
      actionable: true,
    });
  }

  if (gaps.includes("Communication Gap")) {
    recommendations.push({
      title: "Improve Team Communication",
      content:
        "Implement structured communication tools like SBAR (Situation, Background, Assessment, Recommendation) during resuscitation to improve coordination and outcomes.",
      priority: "medium",
      actionable: true,
    });
  }

  if (outcome === "mortality" || outcome === "ROSC_with_disability") {
    recommendations.push({
      title: "Peer Learning Opportunity",
      content:
        "Join our community forum to discuss this case with other clinicians and learn from similar experiences. Your insights help others improve.",
      actionUrl: "/community",
      priority: "medium",
      actionable: true,
    });
  }

  return recommendations;
}

/**
 * Generate nurse-specific recommendations
 */
function generateNurseRecommendations(
  gaps: string[],
  outcome: string,
  workstation?: string
): Recommendation[] {
  const recommendations: Recommendation[] = [];

  if (gaps.includes("Knowledge Gap")) {
    recommendations.push({
      title: "Advance Your Nursing Skills",
      content:
        "Enroll in our BLS or ACLS certification to strengthen your foundational resuscitation knowledge and stay current with best practices.",
      actionUrl: "/enroll",
      priority: "high",
      actionable: true,
    });
  }

  if (workstation === "icu" || workstation === "emergency_department") {
    if (gaps.includes("Equipment Gap")) {
      recommendations.push({
        title: "Equipment Readiness Check",
        content:
          "Conduct a comprehensive audit of resuscitation equipment in your unit. Ensure all pediatric-sized equipment is available, functional, and staff are trained on its use.",
        priority: "high",
        actionable: true,
      });
    }
  }

  if (gaps.includes("Training Gap")) {
    recommendations.push({
      title: "Organize Simulation Training",
      content:
        "Work with your facility to organize regular simulation-based training for pediatric emergencies. This improves team coordination and individual competence.",
      priority: "high",
      actionable: true,
    });
  }

  if (gaps.includes("Leadership Gap")) {
    recommendations.push({
      title: "Escalate to Leadership",
      content:
        "Document this gap and escalate to your nursing manager or facility leadership. Leadership support is critical for system-level improvements.",
      priority: "medium",
      actionable: true,
    });
  }

  return recommendations;
}

/**
 * Generate facility manager recommendations
 */
function generateFacilityManagerRecommendations(gaps: string[]): Recommendation[] {
  const recommendations: Recommendation[] = [];

  if (gaps.includes("Resource Gap")) {
    recommendations.push({
      title: "Resource Allocation Review",
      content:
        "Review your facility's budget allocation for pediatric emergency equipment and training. Consider investing in modern resuscitation equipment and staff training programs.",
      priority: "high",
      actionable: true,
    });
  }

  if (gaps.includes("Staffing Gap")) {
    recommendations.push({
      title: "Staffing and Competency Assessment",
      content:
        "Conduct a comprehensive staffing assessment. Ensure adequate numbers of trained staff in pediatric emergency care across all shifts. Consider hiring or training additional staff.",
      priority: "high",
      actionable: true,
    });
  }

  if (gaps.includes("Infrastructure Gap")) {
    recommendations.push({
      title: "Infrastructure Improvement Plan",
      content:
        "Develop a 6-12 month plan to improve infrastructure (resuscitation bays, monitoring equipment, communication systems). Prioritize based on impact and budget.",
      priority: "high",
      actionable: true,
    });
  }

  if (gaps.includes("Leadership Gap")) {
    recommendations.push({
      title: "Leadership Development",
      content:
        "Invest in leadership training for your clinical team. Strong clinical leadership drives quality improvement initiatives.",
      priority: "medium",
      actionable: true,
    });
  }

  if (gaps.includes("Communication Gap")) {
    recommendations.push({
      title: "Communication System Overhaul",
      content:
        "Implement structured communication protocols and consider communication technology upgrades to improve information flow during emergencies.",
      priority: "medium",
      actionable: true,
    });
  }

  recommendations.push({
    title: "Apply for Paeds Resus Accreditation",
    content:
      "Your facility can apply for Paeds Resus accreditation. This badge demonstrates your commitment to quality pediatric emergency care and can improve your reputation and patient trust.",
    actionUrl: "/accreditation",
    priority: "medium",
    actionable: true,
  });

  return recommendations;
}

/**
 * Generate parent/caregiver recommendations
 */
function generateParentCaregiverRecommendations(gaps: string[]): Recommendation[] {
  const recommendations: Recommendation[] = [];

  recommendations.push({
    title: "Learn Pediatric First Aid",
    content:
      "Enroll in a pediatric first aid or CPR course. Knowing how to respond in an emergency can save your child's life.",
    actionUrl: "/enroll",
    priority: "high",
    actionable: true,
  });

  recommendations.push({
    title: "Home Safety Assessment",
    content:
      "Review your home for common pediatric emergency risks (burns, drowning, choking). Make safety improvements to prevent emergencies before they happen.",
    priority: "high",
    actionable: true,
  });

  if (gaps.includes("Knowledge Gap")) {
    recommendations.push({
      title: "Understand Warning Signs",
      content:
        "Learn the warning signs of pediatric emergencies (severe difficulty breathing, unresponsiveness, severe bleeding). Early recognition can improve outcomes.",
      priority: "medium",
      actionable: true,
    });
  }

  recommendations.push({
    title: "Know Your Hospital",
    content:
      "Familiarize yourself with your nearest hospital's pediatric emergency department. Know how to access it quickly and what to expect.",
    priority: "medium",
    actionable: true,
  });

  return recommendations;
}

/**
 * Generate government/insurance recommendations
 */
function generateGovernmentInsuranceRecommendations(gaps: string[]): Recommendation[] {
  const recommendations: Recommendation[] = [];

  recommendations.push({
    title: "Quality Metrics Dashboard",
    content:
      "Access our aggregated facility quality metrics (pCOSCA rates, system gap remediation speed) to identify high-performing and underperforming facilities.",
    priority: "high",
    actionable: true,
  });

  if (gaps.includes("Resource Gap") || gaps.includes("Infrastructure Gap")) {
    recommendations.push({
      title: "Facility Development Support",
      content:
        "Consider providing grants or incentives to facilities to improve infrastructure and resources for pediatric emergency care.",
      priority: "medium",
      actionable: true,
    });
  }

  if (gaps.includes("Training Gap")) {
    recommendations.push({
      title: "Subsidize Training Programs",
      content:
        "Consider subsidizing pediatric resuscitation training for healthcare workers. This improves system-wide capability and outcomes.",
      priority: "medium",
      actionable: true,
    });
  }

  recommendations.push({
    title: "Reimbursement Policy Review",
    content:
      "Review reimbursement policies to incentivize quality outcomes (pCOSCA) rather than volume. Reward facilities that achieve better neurological outcomes.",
    priority: "high",
    actionable: true,
  });

  return recommendations;
}

/**
 * Generate AI-powered insights using LLM
 */
export async function generateAIInsights(
  systemGapsText: string,
  eventDescription: string,
  userRole: string
): Promise<string> {
  const prompt = `You are a pediatric emergency care quality improvement expert. Based on the following system gaps and event description, provide 2-3 specific, actionable recommendations for a ${userRole}.

System Gaps Identified:
${systemGapsText}

Event Description:
${eventDescription}

Provide recommendations that are:
1. Specific and actionable
2. Realistic to implement
3. Focused on improving neurologically intact survival (pCOSCA)
4. Role-appropriate for a ${userRole}

Format your response as a numbered list with brief explanations.`;

  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content:
          "You are a pediatric emergency care quality improvement expert providing actionable recommendations.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  const content = response.choices[0].message.content;
  return typeof content === "string" ? content : "";
}
