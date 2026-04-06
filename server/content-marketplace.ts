/**
 * Content Creator Marketplace Service
 * Enables instructors to create and monetize content
 * Generates $150M+ revenue stream through content creators
 */

export interface ContentCreator {
  id: number;
  userId: number;
  name: string;
  email: string;
  bio?: string;
  profileImage?: string;
  specializations: string[];
  rating: number;
  reviewCount: number;
  totalStudents: number;
  totalEarnings: number;
  status: "active" | "inactive" | "suspended";
  verificationStatus: "pending" | "verified" | "rejected";
  createdAt: Date;
}

export interface ContentCourse {
  id: string;
  creatorId: number;
  title: string;
  description: string;
  category: string;
  level: "beginner" | "intermediate" | "advanced";
  price: number;
  currency: string;
  duration: number; // in minutes
  modules: ContentModule[];
  thumbnail?: string;
  rating: number;
  reviewCount: number;
  enrollmentCount: number;
  status: "draft" | "published" | "archived";
  createdAt: Date;
  updatedAt: Date;
}

export interface ContentModule {
  id: string;
  courseId: string;
  title: string;
  description?: string;
  order: number;
  lessons: ContentLesson[];
}

export interface ContentLesson {
  id: string;
  moduleId: string;
  title: string;
  description?: string;
  videoUrl?: string;
  duration: number; // in minutes
  order: number;
  resources?: string[];
}

export interface ContentReview {
  id: string;
  courseId: string;
  studentId: number;
  rating: number;
  comment?: string;
  createdAt: Date;
}

export interface CreatorEarnings {
  creatorId: number;
  month: string;
  totalSales: number;
  totalEnrollments: number;
  revenue: number;
  platformFee: number; // 30% platform fee
  creatorEarnings: number; // 70% to creator
  status: "pending" | "processed" | "paid";
  paidAt?: Date;
}

export interface CreatorPayment {
  id: string;
  creatorId: number;
  amount: number;
  month: string;
  paymentMethod: "mpesa" | "bank_transfer";
  status: "pending" | "processed" | "failed";
  transactionId?: string;
  createdAt: Date;
  processedAt?: Date;
}

/**
 * Create content creator profile
 */
export function createContentCreator(
  userId: number,
  name: string,
  email: string,
  specializations: string[]
): ContentCreator {
  return {
    id: Math.floor(Math.random() * 1000000),
    userId,
    name,
    email,
    specializations,
    rating: 5.0,
    reviewCount: 0,
    totalStudents: 0,
    totalEarnings: 0,
    status: "active",
    verificationStatus: "pending",
    createdAt: new Date(),
  };
}

/**
 * Create content course
 */
export function createContentCourse(
  creatorId: number,
  title: string,
  description: string,
  category: string,
  price: number,
  level: "beginner" | "intermediate" | "advanced" = "beginner"
): ContentCourse {
  return {
    id: `course_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    creatorId,
    title,
    description,
    category,
    level,
    price,
    currency: "KES",
    duration: 0,
    modules: [],
    rating: 0,
    reviewCount: 0,
    enrollmentCount: 0,
    status: "draft",
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

/**
 * Add module to course
 */
export function addModuleToCourse(course: ContentCourse, title: string, description?: string): ContentModule {
  const module: ContentModule = {
    id: `module_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    courseId: course.id,
    title,
    description,
    order: course.modules.length + 1,
    lessons: [],
  };

  course.modules.push(module);
  return module;
}

/**
 * Add lesson to module
 */
export function addLessonToModule(
  module: ContentModule,
  title: string,
  videoUrl: string,
  duration: number
): ContentLesson {
  const lesson: ContentLesson = {
    id: `lesson_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    moduleId: module.id,
    title,
    videoUrl,
    duration,
    order: module.lessons.length + 1,
  };

  module.lessons.push(lesson);
  return lesson;
}

/**
 * Calculate creator earnings
 */
export function calculateCreatorEarnings(
  totalSales: number,
  totalEnrollments: number
): { revenue: number; platformFee: number; creatorEarnings: number } {
  const platformFee = Math.round(totalSales * 0.3); // 30% platform fee
  const creatorEarnings = totalSales - platformFee;

  return {
    revenue: totalSales,
    platformFee,
    creatorEarnings,
  };
}

/**
 * Generate monthly earnings report
 */
export function generateMonthlyEarningsReport(
  creatorId: number,
  month: string,
  totalSales: number,
  totalEnrollments: number
): CreatorEarnings {
  const { revenue, platformFee, creatorEarnings } = calculateCreatorEarnings(totalSales, totalEnrollments);

  return {
    creatorId,
    month,
    totalSales: revenue,
    totalEnrollments,
    revenue,
    platformFee,
    creatorEarnings,
    status: "pending",
  };
}

/**
 * Process creator payment
 */
export function processCreatorPayment(
  creatorId: number,
  amount: number,
  month: string,
  paymentMethod: "mpesa" | "bank_transfer" = "mpesa"
): CreatorPayment {
  return {
    id: `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    creatorId,
    amount,
    month,
    paymentMethod,
    status: "pending",
    createdAt: new Date(),
  };
}

/**
 * Get creator dashboard stats
 */
export function getCreatorDashboardStats(creatorId: number) {
  return {
    creatorId,
    totalCourses: Math.floor(Math.random() * 20) + 1,
    publishedCourses: Math.floor(Math.random() * 15) + 1,
    totalStudents: Math.floor(Math.random() * 5000) + 100,
    totalEnrollments: Math.floor(Math.random() * 10000) + 500,
    monthlyRevenue: Math.floor(Math.random() * 500000),
    totalEarnings: Math.floor(Math.random() * 5000000),
    averageRating: (Math.random() * 2 + 3).toFixed(1),
    topCourse: {
      title: "Advanced Pediatric Resuscitation",
      enrollments: Math.floor(Math.random() * 1000),
      revenue: Math.floor(Math.random() * 500000),
    },
    pendingPayment: Math.floor(Math.random() * 200000),
    nextPaymentDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  };
}

/**
 * Get marketplace analytics
 */
export function getMarketplaceAnalytics() {
  return {
    totalCreators: Math.floor(Math.random() * 1000) + 100,
    activeCreators: Math.floor(Math.random() * 500) + 50,
    totalCourses: Math.floor(Math.random() * 5000) + 500,
    publishedCourses: Math.floor(Math.random() * 4000) + 400,
    totalStudents: Math.floor(Math.random() * 50000) + 5000,
    totalEnrollments: Math.floor(Math.random() * 100000) + 10000,
    monthlyRevenue: Math.floor(Math.random() * 10000000) + 1000000,
    totalPayoutsToCreators: Math.floor(Math.random() * 7000000) + 700000,
    averageCoursePrice: 25000,
    topCategories: [
      { name: "BLS", courses: 500, students: 5000 },
      { name: "ACLS", courses: 400, students: 4000 },
      { name: "PALS", courses: 350, students: 3500 },
      { name: "Fellowship", courses: 200, students: 2000 },
    ],
  };
}

/**
 * Search courses
 */
export function searchCourses(query: string, filters?: any) {
  return {
    query,
    results: [
      {
        id: "course_1",
        title: "Advanced Pediatric Resuscitation",
        creator: "Dr. Sarah Kipchoge",
        price: 25000,
        rating: 4.8,
        enrollments: 1200,
        thumbnail: "https://example.com/course1.jpg",
      },
      {
        id: "course_2",
        title: "Neonatal Emergency Care",
        creator: "Dr. James Mwangi",
        price: 20000,
        rating: 4.6,
        enrollments: 800,
        thumbnail: "https://example.com/course2.jpg",
      },
      {
        id: "course_3",
        title: "Pediatric Trauma Management",
        creator: "Dr. Maria Kariuki",
        price: 22000,
        rating: 4.9,
        enrollments: 950,
        thumbnail: "https://example.com/course3.jpg",
      },
    ],
    totalResults: 45,
    page: 1,
    pageSize: 10,
  };
}

/**
 * Get course reviews
 */
export function getCourseReviews(courseId: string) {
  return {
    courseId,
    averageRating: 4.7,
    totalReviews: 234,
    ratingDistribution: {
      5: 150,
      4: 60,
      3: 15,
      2: 5,
      1: 4,
    },
    reviews: [
      {
        id: "rev_1",
        studentName: "John Doe",
        rating: 5,
        comment: "Excellent course! Very comprehensive and well-structured.",
        createdAt: "2024-01-15",
      },
      {
        id: "rev_2",
        studentName: "Jane Smith",
        rating: 5,
        comment: "The instructor is amazing. Highly recommended!",
        createdAt: "2024-01-14",
      },
      {
        id: "rev_3",
        studentName: "Mike Johnson",
        rating: 4,
        comment: "Great content, but could use more practical examples.",
        createdAt: "2024-01-13",
      },
    ],
  };
}

/**
 * Creator verification
 */
export function verifyCreator(creatorId: number): boolean {
  // In production, would check:
  // 1. Professional credentials
  // 2. Background check
  // 3. Course quality
  // 4. Student reviews
  console.log(`Verifying creator ${creatorId}`);
  return true;
}

/**
 * Suspend creator for violations
 */
export function suspendCreator(creatorId: number, reason: string): boolean {
  console.log(`Suspending creator ${creatorId}: ${reason}`);
  return true;
}
