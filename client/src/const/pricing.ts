/**
 * Centralized Pricing Configuration
 * All course pricing in KES (Kenyan Shillings)
 */

export interface CoursePrice {
  id: string;
  name: string;
  description: string;
  price: number;
  category: "individual" | "institutional" | "parent";
  duration?: string;
  level?: string;
}

export interface PricingTier {
  name: string;
  price: number;
  description: string;
  features: string[];
  color: string;
}

// Individual Provider Courses
export const individualCourses: CoursePrice[] = [
  {
    id: "bls",
    name: "BLS (Basic Life Support)",
    description: "Essential life support techniques for healthcare providers",
    price: 10000,
    category: "individual",
    duration: "2 days",
    level: "Beginner",
  },
  {
    id: "acls",
    name: "ACLS (Advanced Cardiovascular Life Support)",
    description: "Advanced cardiac care and emergency protocols",
    price: 20000,
    category: "individual",
    duration: "3 days",
    level: "Intermediate",
  },
  {
    id: "pals",
    name: "PALS (Pediatric Advanced Life Support)",
    description: "Specialized pediatric emergency care and resuscitation",
    price: 20000,
    category: "individual",
    duration: "3 days",
    level: "Advanced",
  },
];

// Elite Fellowship Tiers
export const fellowshipTiers: PricingTier[] = [
  {
    name: "Bronze Paeds Resus Fellowship",
    price: 70000,
    description: "Foundation level fellowship with core competencies",
    features: [
      "12-month fellowship program",
      "Core pediatric resuscitation training",
      "Monthly live training sessions",
      "Access to learning materials",
      "Peer community access",
      "Certificate upon completion",
      "Email support",
    ],
    color: "from-amber-600 to-amber-700",
  },
  {
    name: "Silver Paeds Resus Fellowship",
    price: 100000,
    description: "Intermediate level with advanced clinical skills",
    features: [
      "All Bronze features",
      "Advanced clinical training",
      "Weekly live sessions",
      "One-on-one mentoring (2 sessions)",
      "Simulation training access",
      "Priority support",
      "Continuing education credits",
      "Advanced certificate",
    ],
    color: "from-gray-400 to-gray-500",
  },
  {
    name: "Gold Paeds Resus Fellowship",
    price: 150000,
    description: "Premium level with elite training and mentorship",
    features: [
      "All Silver features",
      "Elite trainer access",
      "Bi-weekly one-on-one mentoring",
      "Advanced simulation lab access",
      "Research project opportunity",
      "Leadership training",
      "International networking",
      "Lifetime community access",
      "Premium certificate",
      "Job placement assistance",
    ],
    color: "from-yellow-400 to-yellow-600",
  },
];

// Institutional Pricing (per seat/learner)
export const institutionalPricing = {
  bls: {
    name: "BLS - Institutional",
    basePricePerSeat: 8000, // 20% discount from individual
    minimumSeats: 10,
    bulkDiscounts: [
      { seats: 10, discount: 20 },
      { seats: 25, discount: 30 },
      { seats: 50, discount: 40 },
      { seats: 100, discount: 50 },
    ],
  },
  acls: {
    name: "ACLS - Institutional",
    basePricePerSeat: 16000, // 20% discount from individual
    minimumSeats: 10,
    bulkDiscounts: [
      { seats: 10, discount: 20 },
      { seats: 25, discount: 30 },
      { seats: 50, discount: 40 },
      { seats: 100, discount: 50 },
    ],
  },
  pals: {
    name: "PALS - Institutional",
    basePricePerSeat: 16000, // 20% discount from individual
    minimumSeats: 10,
    bulkDiscounts: [
      { seats: 10, discount: 20 },
      { seats: 25, discount: 30 },
      { seats: 50, discount: 40 },
      { seats: 100, discount: 50 },
    ],
  },
  fellowship: {
    name: "Fellowship Programs - Institutional",
    basePricePerSeat: 60000, // Bronze base
    minimumSeats: 5,
    bulkDiscounts: [
      { seats: 5, discount: 15 },
      { seats: 10, discount: 25 },
      { seats: 20, discount: 35 },
      { seats: 50, discount: 45 },
    ],
  },
};

// Parent/Caregiver Courses
export const parentCourses: CoursePrice[] = [
  {
    id: "first-aid-basics",
    name: "First Aid Basics for Parents",
    description: "Essential first aid skills every parent should know",
    price: 5000,
    category: "parent",
    duration: "1 day",
    level: "Beginner",
  },
  {
    id: "cpr-kids",
    name: "CPR for Kids",
    description: "Learn CPR techniques specifically for children",
    price: 6000,
    category: "parent",
    duration: "1 day",
    level: "Beginner",
  },
  {
    id: "emergency-response",
    name: "Emergency Response for Caregivers",
    description: "How to respond effectively in pediatric emergencies",
    price: 7000,
    category: "parent",
    duration: "2 days",
    level: "Intermediate",
  },
  {
    id: "child-safety",
    name: "Child Safety & Injury Prevention",
    description: "Comprehensive guide to preventing common childhood injuries",
    price: 4000,
    category: "parent",
    duration: "1 day",
    level: "Beginner",
  },
];

// Utility functions
export function getIndividualCoursePrice(courseId: string): number | null {
  const course = individualCourses.find((c) => c.id === courseId);
  return course?.price ?? null;
}

export function getInstitutionalPrice(
  courseId: string,
  numberOfSeats: number
): { pricePerSeat: number; totalPrice: number; discountPercentage: number } | null {
  const course = institutionalPricing[courseId as keyof typeof institutionalPricing];
  if (!course) return null;

  let discountPercentage = 0;
  for (const tier of course.bulkDiscounts) {
    if (numberOfSeats >= tier.seats) {
      discountPercentage = tier.discount;
    }
  }

  const pricePerSeat = course.basePricePerSeat * (1 - discountPercentage / 100);
  const totalPrice = pricePerSeat * numberOfSeats;

  return {
    pricePerSeat: Math.round(pricePerSeat),
    totalPrice: Math.round(totalPrice),
    discountPercentage,
  };
}

export function getParentCoursePrice(courseId: string): number | null {
  const course = parentCourses.find((c) => c.id === courseId);
  return course?.price ?? null;
}

// Format currency
export function formatPrice(price: number): string {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    minimumFractionDigits: 0,
  }).format(price);
}

// Get all courses by category
export function getCoursesByCategory(category: "individual" | "institutional" | "parent"): CoursePrice[] {
  if (category === "individual") return individualCourses;
  if (category === "parent") return parentCourses;
  return [];
}
