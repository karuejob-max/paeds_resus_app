export type PublicFaqItem = {
  question: string;
  answer: string;
};

export const PROVIDER_FAQ: PublicFaqItem[] = [
  {
    question: "What individual emergency-care products does Paeds Resus offer?",
    answer:
      "Paeds Resus offers AHA BLS, AHA ACLS, NERP for nurses, IERP for medical interns, and the Paeds Resus Fellowship for deeper paediatric emergency learning.",
  },
  {
    question: "Who is NERP for?",
    answer:
      "NERP is the Nurses Emergency Readiness Program for nurses and nurse leaders who want structured learning, practice, simulations, and evidence of emergency-readiness progression.",
  },
  {
    question: "Who is IERP for?",
    answer:
      "IERP is the Interns Emergency Readiness Program for medical interns. It uses named roles, simulations, and evidence gates to build a practical emergency-readiness pathway.",
  },
  {
    question: "Where does Paeds Resus currently operate?",
    answer:
      "Paeds Resus is currently based in Kenya, with a present focus on Central Kenya. Wider Kenya growth and planned East African Community expansion are future directions, not current service claims.",
  },
];

export const INSTITUTION_FAQ: PublicFaqItem[] = [
  {
    question: "What institutional products does Paeds Resus offer?",
    answer:
      "Paeds Resus offers ILSP for institution-paid life-support cohorts, IERS for hospital-wide emergency readiness, and ICPD for institutional continuous professional development.",
  },
  {
    question: "Are ILSP, IERS, and ICPD dependent on one another?",
    answer:
      "No. ILSP, IERS, and ICPD are independent offerings. An institution can choose one, combine them, or phase them according to its operational need.",
  },
  {
    question: "What is included within IERS?",
    answer:
      "IERS includes the institutional emergency-readiness layer, including response roles, activation, readiness evidence, drills, corrective actions, ResusGPS bedside guidance, and Care Signal improvement workflows.",
  },
  {
    question: "What does ICPD help an institution manage?",
    answer:
      "ICPD records professional-development activity, verified attendance, targets, certificates, and leadership reporting. It supports learning accountability and does not replace local clinical governance.",
  },
];
