/**
 * Micro-course schema types for Paediatric Septic Shock I and future courses
 * Aligned with PSOT §16 (Learning products: UX, certificates, tiered courses)
 */

export type ProgramType = 'bls' | 'acls' | 'pals' | 'fellowship' | 'instructor' | 'micro-course';
export type CourseLevel = 'foundational' | 'advanced';
export type QuestionType = 'multiple-choice' | 'true-false' | 'short-answer';

export interface MicroCourse {
  id: string;
  courseDisplayName: string; // e.g., "Paediatric Septic Shock I: Recognition and First-Hour Actions"
  programType: 'micro-course';
  level: CourseLevel; // 'foundational' or 'advanced'
  description: string;
  duration: number; // in minutes
  targetAudience: string; // e.g., "Nurses, doctors, clinical officers in low-resource settings"
  prerequisiteId?: string; // For Course II, points to Course I
  passingScore: number; // e.g., 80
  pricingSku: string; // e.g., "SEPTIC-SHOCK-I"
  price: number; // in cents (e.g., 500 = $5.00)
  resusGpsAlignment: string[]; // e.g., ["A", "B", "C", "D", "E"] for ABCDE alignment
  createdAt: Date;
  updatedAt: Date;
}

export interface CourseModule {
  id: string;
  courseId: string;
  moduleNumber: number; // 1, 2, 3, etc.
  title: string; // e.g., "Recognition of Septic Shock"
  description: string;
  content: string; // Markdown content
  duration: number; // in minutes
  learningObjectives: string[]; // e.g., ["Define septic shock", "Identify clinical signs"]
  order: number; // Display order
  createdAt: Date;
  updatedAt: Date;
}

export interface Quiz {
  id: string;
  courseId: string;
  moduleId?: string; // Optional: quiz per module or per course
  title: string; // e.g., "Paediatric Septic Shock I Quiz"
  description: string;
  passingScore: number; // e.g., 80
  timeLimit?: number; // in minutes, optional
  createdAt: Date;
  updatedAt: Date;
}

export interface QuizQuestion {
  id: string;
  quizId: string;
  questionNumber: number;
  questionType: QuestionType;
  questionText: string;
  options?: string[]; // For multiple-choice
  correctAnswer: string; // For all types
  explanation: string; // Why this answer is correct
  points: number; // e.g., 1 point per question
  createdAt: Date;
  updatedAt: Date;
}

export interface CourseEnrollment {
  id: string;
  userId: string;
  courseId: string;
  enrolledAt: Date;
  completedAt?: Date;
  status: 'enrolled' | 'in-progress' | 'completed' | 'failed';
  paymentStatus: 'pending' | 'completed' | 'failed';
  price: number; // Price paid (in cents)
  createdAt: Date;
  updatedAt: Date;
}

export interface ModuleProgress {
  id: string;
  enrollmentId: string;
  moduleId: string;
  startedAt: Date;
  completedAt?: Date;
  status: 'not-started' | 'in-progress' | 'completed';
  createdAt: Date;
  updatedAt: Date;
}

export interface QuizAttempt {
  id: string;
  enrollmentId: string;
  quizId: string;
  attemptNumber: number;
  startedAt: Date;
  completedAt?: Date;
  score: number; // Percentage (0-100)
  passed: boolean;
  answers: Record<string, string>; // { questionId: answer }
  createdAt: Date;
  updatedAt: Date;
}

export interface CourseCompletion {
  id: string;
  enrollmentId: string;
  courseId: string;
  completedAt: Date;
  score: number; // Final score (percentage)
  certificateId: string; // Reference to certificate
  createdAt: Date;
  updatedAt: Date;
}

export interface Certificate {
  id: string;
  enrollmentId: string;
  courseId: string;
  userId: string;
  programType: ProgramType;
  courseDisplayName: string;
  issueDate: Date;
  expiryDate?: Date; // Optional: some certifications expire
  verificationCode: string; // Unique code for verification
  pdfUrl?: string; // URL to downloaded PDF
  createdAt: Date;
  updatedAt: Date;
}

export interface LearningJourney {
  id: string;
  journeyName: string; // e.g., "Paediatric Septic Shock Journey"
  description: string;
  courses: string[]; // Array of courseIds in order
  resusGpsIntegration: boolean; // Whether journey includes ResusGPS
  createdAt: Date;
  updatedAt: Date;
}

export interface JourneyProgress {
  id: string;
  userId: string;
  journeyId: string;
  startedAt: Date;
  completedAt?: Date;
  currentCourseIndex: number; // Which course in the journey
  status: 'not-started' | 'in-progress' | 'completed';
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Septic Shock I Specific Data
 */

export const SEPTIC_SHOCK_I_COURSE: MicroCourse = {
  id: 'septic-shock-i',
  courseDisplayName: 'Paediatric Septic Shock I: Recognition and First-Hour Safe Actions',
  programType: 'micro-course',
  level: 'foundational',
  description: 'Learn to recognize septic shock and implement first-hour safe actions in low-resource settings.',
  duration: 45,
  targetAudience: 'Nurses, doctors, clinical officers in low-resource settings',
  passingScore: 80,
  pricingSku: 'SEPTIC-SHOCK-I',
  price: 500, // $5.00
  resusGpsAlignment: ['A', 'B', 'C', 'D', 'E'],
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const SEPTIC_SHOCK_I_MODULES = [
  {
    moduleNumber: 1,
    title: 'Recognition of Septic Shock',
    duration: 15,
    learningObjectives: [
      'Define septic shock in observable, bedside terms',
      'Identify clinical signs of shock (perfusion, pulse, CRT, breathing, responsiveness)',
      'Distinguish septic shock from other shock types',
      'Recognize when a child is "sick enough to worry"',
    ],
  },
  {
    moduleNumber: 2,
    title: 'First-Hour Safe Actions',
    duration: 15,
    learningObjectives: [
      'Establish IV/IO access safely',
      'Give fluids correctly (bolus volume, reassessment)',
      'Start antibiotics if available',
      'Recognize when to escalate (call for help)',
    ],
  },
  {
    moduleNumber: 3,
    title: 'When to Refer',
    duration: 10,
    learningObjectives: [
      'Identify when a child needs hospital-level care',
      'Communicate clearly with referral center',
      'Arrange safe transport',
    ],
  },
];

export const SEPTIC_SHOCK_I_QUIZ_QUESTIONS = [
  {
    questionNumber: 1,
    questionType: 'multiple-choice' as QuestionType,
    questionText: 'A 5-year-old with fever has cold extremities, weak pulse, and is very sleepy. What is the first thing you do?',
    options: [
      'A) Give antibiotics only',
      'B) Establish IV access and give 20 mL/kg fluid bolus',
      'C) Refer to hospital immediately',
      'D) Give antipyretics (paracetamol)',
    ],
    correctAnswer: 'B',
    explanation: 'Establishing IV access and giving fluids is the first critical step in septic shock management. Fluids restore perfusion and buy time for antibiotics to work.',
    points: 1,
  },
  {
    questionNumber: 2,
    questionType: 'multiple-choice' as QuestionType,
    questionText: 'After giving one 20 mL/kg bolus, the child still has cold extremities and weak pulse. What do you do?',
    options: [
      'A) Give another 20 mL/kg bolus',
      'B) Stop fluids and escalate',
      'C) Give antibiotics only',
      'D) Wait 1 hour and reassess',
    ],
    correctAnswer: 'A',
    explanation: 'If shock persists after the first bolus, give a second bolus. Only after 2 boluses (40 mL/kg) with no improvement should you escalate or refer.',
    points: 1,
  },
  {
    questionNumber: 3,
    questionType: 'multiple-choice' as QuestionType,
    questionText: 'What is the maximum dose of ceftriaxone for a 10 kg child?',
    options: [
      'A) 500 mg',
      'B) 1 g',
      'C) 2 g',
      'D) 4 g',
    ],
    correctAnswer: 'C',
    explanation: 'Ceftriaxone maximum dose is 2g per dose, regardless of weight. This is the standard maximum for pediatric dosing.',
    points: 1,
  },
  {
    questionNumber: 4,
    questionType: 'multiple-choice' as QuestionType,
    questionText: 'A child has septic shock but you cannot place an IV. What is your next step?',
    options: [
      'A) Give antibiotics IM only',
      'B) Establish IO access',
      'C) Refer immediately',
      'D) Wait for senior staff',
    ],
    correctAnswer: 'B',
    explanation: 'Intraosseous (IO) access is the next step if IV fails. It is fast, reliable, and works for fluids and drugs.',
    points: 1,
  },
  {
    questionNumber: 5,
    questionType: 'multiple-choice' as QuestionType,
    questionText: 'After 2 boluses (40 mL/kg) and antibiotics, a child still has signs of shock. What do you do?',
    options: [
      'A) Give a third bolus',
      'B) Escalate to senior/refer to hospital',
      'C) Give vasoactive drugs',
      'D) Continue fluids for 2 more hours',
    ],
    correctAnswer: 'B',
    explanation: 'Refractory shock (shock after 2 boluses) requires hospital-level care with vasoactive drugs. Escalate or refer immediately.',
    points: 1,
  },
];
