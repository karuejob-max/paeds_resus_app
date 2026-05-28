import { ahaDurationIsoHours, formatAhaDuration } from "@/const/aha-course-metadata";
import { getIndividualCoursePrice } from "@/const/pricing";

export type TrainingFaq = { question: string; answer: string };

/** Counsel-aligned AHA certification FAQ — starts with "Yes." per PSOT. */
export function ahaCertificationFaqAnswer(courseCode: string): string {
  return `Yes. Paeds Resus Limited is an American Heart Association (AHA)-aligned training provider. After you complete cognitive modules and instructor-led practical skills, your ${courseCode} certificate is issued by the American Heart Association. Confirm certificate wording and local recognition with your employer or licensing body.`;
}

export type TrainingLandingConfig = {
  slug: "bls" | "acls" | "pals" | "nrp";
  path: string;
  title: string;
  metaDescription: string;
  h1: string;
  subtitle: string;
  courseCode: string;
  duration: string;
  priceCourseId?: string;
  keywords: string[];
  sections: { heading: string; paragraphs: string[] }[];
  faqs: TrainingFaq[];
};

function priceFor(courseId: string): number | null {
  return getIndividualCoursePrice(courseId);
}

export const TRAINING_LANDING_CONFIGS: Record<TrainingLandingConfig["slug"], TrainingLandingConfig> = {
  pals: {
    slug: "pals",
    path: "/training/pals",
    title: "PALS Training Kenya — Pediatric Advanced Life Support | Paeds Resus",
    metaDescription:
      "AHA-aligned PALS (Pediatric Advanced Life Support) training in Kenya and East Africa. Enroll with Paeds Resus Limited for blended cognitive modules and hands-on skills sessions.",
    h1: "PALS Training in Kenya — Pediatric Advanced Life Support",
    subtitle:
      "Build confidence assessing and stabilising critically ill children with AHA-aligned PALS delivered by Paeds Resus Limited.",
    courseCode: "PALS",
    duration: ahaDurationIsoHours("pals"),
    priceCourseId: "pals",
    keywords: ["PALS training Kenya", "pediatric advanced life support", "PALS course Nairobi", "paediatric resuscitation training"],
    sections: [
      {
        heading: "Why PALS matters for paediatric teams in Kenya",
        paragraphs: [
          "Pediatric Advanced Life Support (PALS) equips nurses, doctors, and emergency teams to recognise early deterioration, initiate high-quality CPR, and coordinate team-based resuscitation for infants and children. In busy paediatric wards, emergency departments, and PICUs across Kenya and the wider East African Community, delays in structured assessment cost lives — especially when preventable.",
          "Paeds Resus Limited delivers AHA-aligned PALS as part of the integrated Paeds Resus platform. Learners complete cognitive modules on the platform, receive a gatepass certificate when cognitive work is complete, and attend a hands-on practical session with an approved instructor for skills sign-off. Full certificates follow local scheduling and instructor availability.",
          "PALS on Paeds Resus is designed for healthcare providers who already manage sick children and want a rigorous, repeatable certification path — not a one-off workshop disconnected from bedside practice. ResusGPS, our bedside clinical guidance product, complements training but is separate from the certification track.",
        ],
      },
      {
        heading: "What you will learn",
        paragraphs: [
          "PALS covers systematic paediatric assessment, respiratory and shock algorithms, arrhythmia recognition, post–cardiac arrest care, and effective team communication during paediatric emergencies. Content follows American Heart Association science while emphasising adaptation to resource-limited settings: clear roles, early escalation, and alignment with your facility protocol.",
          `Typical PALS certification involves approximately ${formatAhaDuration("pals")} of structured learning, split between self-paced cognitive modules and instructor-led practical skills. Paeds Resus tracks your progress so you always know whether you need to continue online learning or book a practical session.`,
        ],
      },
      {
        heading: "Who should enroll",
        paragraphs: [
          "PALS is appropriate for paediatric nurses, emergency physicians, anaesthetists, PICU staff, and other clinicians who may lead or participate in paediatric resuscitation. Institutions may enroll cohorts through the institutional portal for volume pricing and readiness reporting.",
          "PALS is not required for the Paeds Resus Fellowship pathway — fellowship progress is tracked separately through micro-courses, ResusGPS attributable cases, and Care Signal monthly reporting. Many providers choose both PALS certification and fellowship progression over time.",
        ],
      },
    ],
    faqs: [
      {
        question: "Where can I do PALS training in Kenya?",
        answer:
          "Enroll through Paeds Resus at www.paedsresus.com/training/pals. Complete cognitive modules online, then book a hands-on session with Paeds Resus Limited for practical sign-off.",
      },
      {
        question: "Is PALS AHA-certified through Paeds Resus?",
        answer: ahaCertificationFaqAnswer("PALS"),
      },
      {
        question: "How long does PALS take?",
        answer:
          `Plan for approximately ${formatAhaDuration("pals")} total: self-paced cognitive modules plus a scheduled practical skills session.`,
      },
      {
        question: "Can my hospital enroll a team?",
        answer:
          "Yes. Visit the institutional page to request cohort enrollment, readiness systems, and staff training coordination.",
      },
    ],
  },
  acls: {
    slug: "acls",
    path: "/training/acls",
    title: "ACLS Course Kenya — Advanced Cardiovascular Life Support | Paeds Resus",
    metaDescription:
      "AHA-aligned ACLS (Advanced Cardiovascular Life Support) course in Kenya. Enroll with Paeds Resus Limited for blended training with online modules and hands-on certification.",
    h1: "ACLS Course in Kenya — Advanced Cardiovascular Life Support",
    subtitle:
      "Master cardiac arrest algorithms, arrhythmia management, and team dynamics with AHA-aligned ACLS from Paeds Resus Limited.",
    courseCode: "ACLS",
    duration: ahaDurationIsoHours("acls"),
    priceCourseId: "acls",
    keywords: ["ACLS course Kenya", "advanced cardiovascular life support", "ACLS training Nairobi", "cardiac arrest training"],
    sections: [
      {
        heading: "ACLS for clinicians who respond to cardiac emergencies",
        paragraphs: [
          "Advanced Cardiovascular Life Support (ACLS) prepares healthcare providers to manage adult cardiac arrest, peri-arrest arrhythmias, acute coronary syndromes, and stroke within organised team responses. In Kenyan hospitals — from casualty units to HDUs — structured ACLS training reduces hesitation when seconds matter.",
          "Paeds Resus Limited offers AHA-aligned ACLS through the Paeds Resus platform. The blended model lets you complete cognitive modules at your own pace, earn a gatepass certificate, and complete instructor-led practical skills before your full certificate is issued.",
          "Although ACLS focuses on adult cardiovascular emergencies, many paediatric teams also maintain ACLS certification when they rotate through mixed-age emergency settings. Paeds Resus keeps ACLS on a separate track from the Paeds Resus Fellowship and from paediatric-specific PALS training.",
        ],
      },
      {
        heading: "Course structure and certification path",
        paragraphs: [
          `ACLS typically requires approximately ${formatAhaDuration("acls")} of learning. Cognitive content covers BLS integration, airway management, pharmacology, ACLS algorithms, and post–cardiac arrest care. Practical sessions validate megacode performance, defibrillation, and team leadership.`,
          "Your enrollment, progress, and certificates live in your Paeds Resus provider account. Verify any certificate publicly at www.paedsresus.com/verify.",
        ],
      },
      {
        heading: "Institutional and team enrollment",
        paragraphs: [
          "Hospitals and training organisations can enroll staff cohorts with institutional pricing and track completion through the Paeds Resus institutional portal. This supports emergency readiness systems — not just seat sales — so leadership can see who is certified and who needs renewal.",
          "Always follow your facility's resuscitation policy and local Ministry of Health guidance alongside any course content.",
          "Many Kenyan hospitals pair ACLS renewal with mock code drills and Care Signal debriefs so classroom learning translates into ward behaviour — ask about institutional readiness packages when requesting a quote.",
          "Individual learners can start enrollment today and complete cognitive modules before scheduling the practical megacode session.",
        ],
      },
    ],
    faqs: [
      {
        question: "How much does ACLS cost in Kenya through Paeds Resus?",
        answer:
          "Individual ACLS pricing is listed on this page when available. Institutional cohorts may receive volume discounts — contact us through the institutional page for a quote.",
      },
      {
        question: "Is ACLS AHA-certified through Paeds Resus?",
        answer: ahaCertificationFaqAnswer("ACLS"),
      },
      {
        question: "Do I need BLS before ACLS?",
        answer:
          "BLS competence is assumed. If you need BLS certification, enroll in our BLS track first or concurrently as your schedule allows.",
      },
      {
        question: "Can I book a practical session online?",
        answer:
          "After completing cognitive modules, sign in and use the AHA courses hub to book or register for an upcoming hands-on session.",
      },
    ],
  },
  bls: {
    slug: "bls",
    path: "/training/bls",
    title: "BLS Certification Kenya — Basic Life Support Training | Paeds Resus",
    metaDescription:
      "BLS (Basic Life Support) certification in Kenya with Paeds Resus Limited. AHA-aligned blended training for healthcare providers — enroll online and complete hands-on skills.",
    h1: "BLS Certification in Kenya — Basic Life Support",
    subtitle:
      "Foundational CPR and team response skills for every healthcare provider, delivered AHA-aligned by Paeds Resus Limited.",
    courseCode: "BLS",
    duration: ahaDurationIsoHours("bls"),
    priceCourseId: "bls",
    keywords: ["BLS certification Kenya", "basic life support", "BLS course Nairobi", "healthcare CPR training"],
    sections: [
      {
        heading: "BLS: the foundation of every resuscitation team",
        paragraphs: [
          "Basic Life Support (BLS) is the entry point for high-quality CPR, AED use, and team-based response for healthcare providers. Whether you work in a district hospital, private clinic, or national referral centre in Kenya, BLS competence is non-negotiable for safe emergency care.",
          `Paeds Resus Limited delivers AHA-aligned BLS through the Paeds Resus platform. Learners complete approximately ${formatAhaDuration("bls")} of structured cognitive content, receive a gatepass certificate when online modules are complete, and attend a practical session for full certification.`,
          "BLS is separate from the Paeds Resus Fellowship. It is an optional, standalone AHA-aligned offering — many institutions require BLS renewal every two years regardless of fellowship progress.",
        ],
      },
      {
        heading: "Blended learning that fits clinical schedules",
        paragraphs: [
          "Shift work and on-call rotas make multi-day classroom-only courses hard to attend. Paeds Resus lets you progress through cognitive modules when you have protected learning time, then consolidate skills in a focused hands-on session.",
          "Providers who later pursue ACLS, PALS, or Heartsaver courses can manage all AHA-aligned enrollments from one account after signing in.",
        ],
      },
      {
        heading: "For institutions building baseline readiness",
        paragraphs: [
          "Hospital administrators can enroll entire departments, track completion, and connect training to broader paediatric emergency readiness systems through the institutional portal. Paeds Resus sponsors and subsidises BLS for selected cohorts — ask about current programmes when requesting an institutional quote.",
          "Clinical teams should always defer to local protocols and senior clinical leadership during real emergencies.",
          "BLS competency is the minimum expectation before nurses and doctors rotate into acute care areas. Pair enrollment with ResusGPS orientation so teams know where to find bedside checklists after the classroom session.",
        ],
      },
      {
        heading: "Certification and renewal",
        paragraphs: [
          "After cognitive modules and practical sign-off, your certificate is verifiable at www.paedsresus.com/verify. Plan renewal before the two-year validity window closes — institutions receive reminders through the admin dashboard when cohort data is linked.",
        ],
      },
    ],
    faqs: [
      {
        question: "Where do I get BLS certified in Kenya?",
        answer:
          "Start at www.paedsresus.com/training/bls — create a provider account, enroll, complete cognitive modules, and attend your practical session with Paeds Resus Limited.",
      },
      {
        question: "Is BLS AHA-certified through Paeds Resus?",
        answer: ahaCertificationFaqAnswer("BLS"),
      },
      {
        question: "How long is BLS certification valid?",
        answer:
          "Full AHA-aligned certificates issued after practical sign-off are typically valid for two years from issuance. Confirm renewal requirements with your employer.",
      },
      {
        question: "Is Heartsaver different from BLS?",
        answer:
          "Yes. BLS is for healthcare providers. Heartsaver CPR AED targets lay rescuers and non-clinical staff. See our training hub for both options.",
      },
      {
        question: "Can parents take BLS?",
        answer:
          "Parents and caregivers should explore Parent Safe-Truth and family-oriented resources. BLS enrollment is designed for healthcare providers.",
      },
    ],
  },
  nrp: {
    slug: "nrp",
    path: "/training/nrp",
    title: "NRP Neonatal Resuscitation Kenya — Training Overview | Paeds Resus",
    metaDescription:
      "Neonatal resuscitation (NRP) training information for Kenya and East Africa. Learn how Paeds Resus supports newborn emergency readiness alongside AHA-aligned provider courses.",
    h1: "Neonatal Resuscitation (NRP) Training in Kenya",
    subtitle:
      "Newborn resuscitation readiness for delivery suites, NICUs, and maternity teams — aligned with best practice and local protocol.",
    courseCode: "NRP",
    duration: ahaDurationIsoHours("nrp"),
    priceCourseId: "nrp",
    keywords: ["NRP neonatal resuscitation Kenya", "neonatal resuscitation training", "newborn resuscitation course", "NRP Kenya"],
    sections: [
      {
        heading: "Why neonatal resuscitation training matters",
        paragraphs: [
          "Birth asphyxia and failure to transition remain leading causes of preventable neonatal harm in low-resource settings. Neonatal Resuscitation Program (NRP) style training gives midwives, nurses, and doctors a shared language for drying, stimulating, ventilation, chest compressions, and medication in the first minutes of life.",
          "Paeds Resus focuses on paediatric and neonatal emergency readiness across the platform — from ResusGPS neonatal protocols to institutional training coordination. NRP-specific scheduling is coordinated through Paeds Resus Limited; express interest via enrollment or institutional contact so we can place you in the next available cohort.",
          "NRP content complements but does not replace PALS, BLS, or fellowship micro-courses. Each track serves a distinct clinical context.",
        ],
      },
      {
        heading: "Who should attend",
        paragraphs: [
          "Maternity nurses, midwives, paediatric residents, NICU staff, and clinicians who attend deliveries benefit from structured neonatal resuscitation refreshers. Institutions should ensure at least one skilled responder is present at every birth and that equipment checks are routine.",
          "Paeds Resus institutional programmes can bundle neonatal readiness assessments, staff training, and Care Signal reporting for quality improvement — contact us for a readiness conversation rather than a seat-only purchase.",
        ],
      },
      {
        heading: "How to register interest",
        paragraphs: [
          "Public NRP cohort dates vary by region and instructor availability across Kenya and the East African Community. Register a provider account and note NRP interest during enrollment, or reach out through the institutional quote form for hospital-wide programmes.",
          "Always follow national newborn care guidelines and your facility's neonatal resuscitation policy during live births.",
          "Paeds Resus can coordinate train-the-trainer pathways for maternity leads who will cascade skills to ward teams — reducing dependency on external faculty for every renewal cycle.",
        ],
      },
      {
        heading: "Equipment and readiness checklist",
        paragraphs: [
          "Effective neonatal resuscitation depends on predictable equipment: warmers, suction, appropriately sized masks, and self-inflating bags. Institutions should audit stock monthly and link gaps to Care Signal near-miss reports where appropriate.",
          "Combining NRP-style training with ResusGPS neonatal protocols gives teams both classroom competence and bedside checklists — but neither replaces hands-on simulation and local governance.",
        ],
      },
    ],
    faqs: [
      {
        question: "How much does NRP cost in Kenya through Paeds Resus?",
        answer:
          "Individual NRP pricing is listed on this page when available. Institutional maternity and NICU cohorts may receive volume discounts — contact us through the institutional page for a quote.",
      },
      {
        question: "Does Paeds Resus offer NRP certification in Kenya?",
        answer:
          "Yes. Paeds Resus Limited is an AHA-aligned training provider and coordinates neonatal resuscitation training aligned with international best practice. When your cohort includes AHA-recognized certification, your certificate is issued by the American Heart Association after cognitive and practical requirements are met. Contact us or enroll to join the next scheduled NRP cohort in your region.",
      },
      {
        question: "Is NRP AHA-certified through Paeds Resus?",
        answer: ahaCertificationFaqAnswer("NRP"),
      },
      {
        question: "Is NRP the same as PALS?",
        answer:
          "No. NRP focuses on newborn transition at birth. PALS addresses broader paediatric emergencies in infants and children beyond the delivery room.",
      },
      {
        question: "Can hospitals request on-site NRP training?",
        answer:
          "Yes. Use the institutional page to request a readiness assessment and on-site or hub-based training for your maternity and NICU teams.",
      },
      {
        question: "What topics does NRP-style training cover?",
        answer:
          "Typical modules include preparation for birth, initial steps, positive-pressure ventilation, chest compressions, medications, and special circumstances such as prematurity or meconium. Exact curriculum follows international neonatal resuscitation science adapted to local protocol.",
      },
      {
        question: "Does ResusGPS cover neonatal emergencies?",
        answer:
          "ResusGPS includes neonatal emergency guidance for signed-in providers. Training and bedside tools work together but serve different purposes.",
      },
    ],
  },
};

export function getTrainingPrice(slug: TrainingLandingConfig["slug"]): number | null {
  const config = TRAINING_LANDING_CONFIGS[slug];
  if (!config.priceCourseId) return null;
  return priceFor(config.priceCourseId);
}
