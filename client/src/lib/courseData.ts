/**
 * Centralized course data configuration
 * Single source of truth for all course information across the platform
 */

export interface Course {
  id: string;
  name: string;
  shortName: string;
  category: "basic" | "advanced" | "fellowship";
  basePrice: number;
  duration: string;
  description: string;
  longDescription: string;
  topics: string[];
  targetAudience: string;
  prerequisites?: string;
  certification?: string;
}

export const COURSES: Record<string, Course> = {
  bls: {
    id: "bls",
    name: "BLS (Basic Life Support)",
    shortName: "BLS",
    category: "basic",
    basePrice: 10000,
    duration: "2 days",
    description: "Fundamental resuscitation techniques for all healthcare staff",
    longDescription:
      "Comprehensive Basic Life Support training covering CPR techniques, airway management, emergency response protocols, and team coordination for all healthcare professionals.",
    topics: [
      "CPR techniques",
      "Airway management",
      "Emergency response",
      "Team coordination",
      "Patient assessment",
      "Recovery position",
    ],
    targetAudience: "All healthcare staff",
    certification: "BLS Certificate (Valid for 2 years)",
  },

  acls: {
    id: "acls",
    name: "ACLS (Advanced Cardiac Life Support)",
    shortName: "ACLS",
    category: "advanced",
    basePrice: 20000,
    duration: "3 days",
    description: "Advanced cardiac emergency management for experienced providers",
    longDescription:
      "Advanced Cardiac Life Support training for healthcare providers managing cardiac emergencies, including arrhythmia recognition, medication protocols, advanced airway management, and post-resuscitation care.",
    topics: [
      "Arrhythmia recognition",
      "Medication protocols",
      "Advanced airway",
      "Post-resuscitation care",
      "Cardiac physiology",
      "Defibrillation",
    ],
    targetAudience: "Doctors, nurses, paramedics",
    prerequisites: "BLS certification",
    certification: "ACLS Certificate (Valid for 2 years)",
  },

  pals: {
    id: "pals",
    name: "PALS (Pediatric Advanced Life Support)",
    shortName: "PALS",
    category: "advanced",
    basePrice: 20000,
    duration: "3 days",
    description: "Pediatric-specific advanced life support for emergency providers",
    longDescription:
      "Pediatric Advanced Life Support training focusing on pediatric physiology, age-appropriate interventions, medication dosing, and management of pediatric emergencies.",
    topics: [
      "Pediatric physiology",
      "Age-appropriate interventions",
      "Medication dosing",
      "Pediatric emergencies",
      "Airway management",
      "Shock management",
    ],
    targetAudience: "Pediatric healthcare providers",
    prerequisites: "BLS certification",
    certification: "PALS Certificate (Valid for 2 years)",
  },

  bronze: {
    id: "bronze",
    name: "Bronze Elite Fellowship",
    shortName: "Bronze Fellowship",
    category: "fellowship",
    basePrice: 70000,
    duration: "3 months",
    description: "Foundational pediatric resuscitation certification program",
    longDescription:
      "Comprehensive 3-month Bronze Elite Fellowship covering pediatric physiology, trauma management, neonatal resuscitation, and foundational leadership skills for healthcare professionals.",
    topics: [
      "Pediatric physiology",
      "Trauma management",
      "Neonatal resuscitation",
      "Leadership basics",
      "Clinical protocols",
      "Quality improvement",
    ],
    targetAudience: "Healthcare professionals seeking certification",
    prerequisites: "BLS and PALS certification",
    certification: "Bronze Elite Fellowship Certificate",
  },

  silver: {
    id: "silver",
    name: "Silver Elite Fellowship",
    shortName: "Silver Fellowship",
    category: "fellowship",
    basePrice: 100000,
    duration: "6 months",
    description: "Advanced pediatric resuscitation with clinical mentorship",
    longDescription:
      "Comprehensive 6-month Silver Elite Fellowship including advanced pediatric resuscitation, clinical mentorship, research projects, and advanced leadership development for healthcare leaders.",
    topics: [
      "Advanced pediatric resuscitation",
      "Clinical mentorship",
      "Research methodology",
      "Advanced leadership",
      "Quality improvement projects",
      "Team management",
    ],
    targetAudience: "Senior healthcare professionals and leaders",
    prerequisites: "BLS, PALS, and Bronze Fellowship",
    certification: "Silver Elite Fellowship Certificate",
  },

  gold: {
    id: "gold",
    name: "Gold Elite Fellowship",
    shortName: "Gold Fellowship",
    category: "fellowship",
    basePrice: 150000,
    duration: "12 months",
    description: "Comprehensive mastery program with institutional leadership focus",
    longDescription:
      "Comprehensive 12-month Gold Elite Fellowship providing mastery-level training in pediatric resuscitation, institutional leadership, program development, and strategic implementation for healthcare executives.",
    topics: [
      "Mastery-level resuscitation",
      "Institutional leadership",
      "Program development",
      "Strategic planning",
      "Research & publication",
      "Change management",
    ],
    targetAudience: "Healthcare executives and institutional leaders",
    prerequisites: "BLS, PALS, Bronze, and Silver Fellowship",
    certification: "Gold Elite Fellowship Certificate & Leadership Credential",
  },
};

/**
 * Get all courses
 */
export function getAllCourses(): Course[] {
  return Object.values(COURSES);
}

/**
 * Get course by ID
 */
export function getCourseById(id: string): Course | undefined {
  return COURSES[id];
}

/**
 * Get courses by category
 */
export function getCoursesByCategory(category: Course["category"]): Course[] {
  return Object.values(COURSES).filter((course) => course.category === category);
}

/**
 * Calculate bulk discount
 */
export function calculateBulkDiscount(staffCount: number): number {
  if (staffCount <= 20) return 0; // No discount
  if (staffCount <= 50) return 0.1; // 10% discount
  if (staffCount <= 100) return 0.2; // 20% discount
  if (staffCount <= 200) return 0.3; // 30% discount
  return 0.4; // 40% discount for 200+
}

/**
 * Calculate course price with bulk discount
 */
export function calculateCoursePrice(
  courseId: string,
  staffCount: number
): number | null {
  const course = getCourseById(courseId);
  if (!course) return null;

  const discount = calculateBulkDiscount(staffCount);
  return Math.round(course.basePrice * (1 - discount));
}

/**
 * Calculate total cost for institution
 */
export function calculateTotalCost(courseId: string, staffCount: number): number | null {
  const pricePerPerson = calculateCoursePrice(courseId, staffCount);
  if (pricePerPerson === null) return null;
  return pricePerPerson * staffCount;
}

/**
 * Get discount percentage
 */
export function getDiscountPercentage(staffCount: number): number {
  return Math.round(calculateBulkDiscount(staffCount) * 100);
}
