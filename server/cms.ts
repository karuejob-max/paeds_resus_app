/**
 * Content Management System (CMS)
 * Course creation, lesson management, video uploads, quizzes, and content versioning
 */

export interface Course {
  id: string;
  title: string;
  description: string;
  instructorId: number;
  category: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  duration: number; // in minutes
  lessons: Lesson[];
  status: "draft" | "published" | "archived";
  thumbnail?: string;
  createdAt: number;
  updatedAt: number;
  publishedAt?: number;
  version: number;
  metadata: Record<string, unknown>;
}

export interface Lesson {
  id: string;
  courseId: string;
  title: string;
  description: string;
  order: number;
  duration: number; // in minutes
  content: LessonContent[];
  status: "draft" | "published";
  createdAt: number;
  updatedAt: number;
}

export interface LessonContent {
  id: string;
  type: "video" | "text" | "quiz" | "assignment" | "resource";
  title: string;
  data: Record<string, unknown>;
  order: number;
}

export interface Quiz {
  id: string;
  lessonId: string;
  title: string;
  description: string;
  questions: QuizQuestion[];
  passingScore: number;
  timeLimit?: number; // in minutes
  createdAt: number;
  updatedAt: number;
}

export interface QuizQuestion {
  id: string;
  type: "multiple-choice" | "true-false" | "short-answer" | "essay";
  question: string;
  options?: string[];
  correctAnswer?: string | string[];
  points: number;
  explanation?: string;
}

export interface ContentVersion {
  id: string;
  contentId: string;
  contentType: "course" | "lesson";
  version: number;
  changes: Record<string, unknown>;
  createdBy: number;
  createdAt: number;
  status: "draft" | "published" | "archived";
}

export interface ContentApproval {
  id: string;
  contentId: string;
  contentType: "course" | "lesson";
  status: "pending" | "approved" | "rejected";
  requestedBy: number;
  reviewedBy?: number;
  comments?: string;
  createdAt: number;
  reviewedAt?: number;
}

class CMSService {
  private courses: Map<string, Course> = new Map();
  private lessons: Map<string, Lesson> = new Map();
  private quizzes: Map<string, Quiz> = new Map();
  private versions: Map<string, ContentVersion[]> = new Map();
  private approvals: Map<string, ContentApproval> = new Map();

  /**
   * Create a new course
   */
  createCourse(course: Omit<Course, "id" | "lessons" | "createdAt" | "updatedAt" | "version">): Course {
    const id = `course-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = Date.now();

    const newCourse: Course = {
      ...course,
      id,
      lessons: [],
      createdAt: now,
      updatedAt: now,
      version: 1,
    };

    this.courses.set(id, newCourse);

    // Initialize version history
    this.versions.set(id, [
      {
        id: `v-${Date.now()}`,
        contentId: id,
        contentType: "course",
        version: 1,
        changes: newCourse as unknown as Record<string, unknown>,
        createdBy: course.instructorId,
        createdAt: now,
        status: "draft",
      },
    ]);

    return newCourse;
  }

  /**
   * Get course by ID
   */
  getCourse(courseId: string): Course | null {
    return this.courses.get(courseId) || null;
  }

  /**
   * Update course
   */
  updateCourse(courseId: string, updates: Partial<Course>): boolean {
    const course = this.courses.get(courseId);
    if (!course) return false;

    const oldVersion = course.version;
    course.version += 1;
    course.updatedAt = Date.now();

    Object.assign(course, updates);

    // Add to version history
    const versions = this.versions.get(courseId) || [];
    versions.push({
      id: `v-${Date.now()}`,
      contentId: courseId,
      contentType: "course",
      version: course.version,
      changes: updates,
      createdBy: (updates.instructorId as number) || 0,
      createdAt: Date.now(),
      status: course.status,
    });
    this.versions.set(courseId, versions);

    return true;
  }

  /**
   * Publish course
   */
  publishCourse(courseId: string): boolean {
    const course = this.courses.get(courseId);
    if (!course) return false;

    course.status = "published" as const;
    course.publishedAt = Date.now();
    course.updatedAt = Date.now();

    return true;
  }

  /**
   * Create lesson
   */
  createLesson(lesson: Omit<Lesson, "id" | "createdAt" | "updatedAt">): Lesson {
    const id = `lesson-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = Date.now();

    const newLesson: Lesson = {
      ...lesson,
      id,
      createdAt: now,
      updatedAt: now,
    };

    this.lessons.set(id, newLesson);

    // Add to course
    const course = this.courses.get(lesson.courseId);
    if (course) {
      course.lessons.push(newLesson);
    }

    return newLesson;
  }

  /**
   * Get lesson by ID
   */
  getLesson(lessonId: string): Lesson | null {
    return this.lessons.get(lessonId) || null;
  }

  /**
   * Update lesson
   */
  updateLesson(lessonId: string, updates: Partial<Lesson>): boolean {
    const lesson = this.lessons.get(lessonId);
    if (!lesson) return false;

    lesson.updatedAt = Date.now();
    Object.assign(lesson, updates);

    return true;
  }

  /**
   * Create quiz
   */
  createQuiz(quiz: Omit<Quiz, "id" | "createdAt" | "updatedAt">): Quiz {
    const id = `quiz-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = Date.now();

    const newQuiz: Quiz = {
      ...quiz,
      id,
      createdAt: now,
      updatedAt: now,
    };

    this.quizzes.set(id, newQuiz);

    return newQuiz;
  }

  /**
   * Get quiz by ID
   */
  getQuiz(quizId: string): Quiz | null {
    return this.quizzes.get(quizId) || null;
  }

  /**
   * Get course lessons
   */
  getCourseLessons(courseId: string): Lesson[] {
    return Array.from(this.lessons.values()).filter((l) => l.courseId === courseId);
  }

  /**
   * Get course versions
   */
  getCourseVersions(courseId: string): ContentVersion[] {
    return this.versions.get(courseId) || [];
  }

  /**
   * Rollback to version
   */
  rollbackToVersion(courseId: string, versionNumber: number): boolean {
    const versions = this.versions.get(courseId) || [];
    const targetVersion = versions.find((v) => v.version === versionNumber);

    if (!targetVersion) return false;

    const course = this.courses.get(courseId);
    if (!course) return false;

    // Restore from version
    Object.assign(course, targetVersion.changes);
    course.version = versionNumber;
    course.updatedAt = Date.now();

    return true;
  }

  /**
   * Request approval
   */
  requestApproval(contentId: string, contentType: "course" | "lesson", requestedBy: number): ContentApproval {
    const id = `approval-${Date.now()}`;

    const approval: ContentApproval = {
      id,
      contentId,
      contentType,
      status: "pending",
      requestedBy,
      createdAt: Date.now(),
    };

    this.approvals.set(id, approval);

    return approval;
  }

  /**
   * Approve content
   */
  approveContent(approvalId: string, reviewedBy: number, comments?: string): boolean {
    const approval = this.approvals.get(approvalId);
    if (!approval) return false;

    approval.status = "approved";
    approval.reviewedBy = reviewedBy;
    approval.comments = comments;
    approval.reviewedAt = Date.now();

    // Publish content if it's a course
    if (approval.contentType === "course") {
      this.publishCourse(approval.contentId);
    }

    return true;
  }

  /**
   * Reject content
   */
  rejectContent(approvalId: string, reviewedBy: number, comments: string): boolean {
    const approval = this.approvals.get(approvalId);
    if (!approval) return false;

    approval.status = "rejected";
    approval.reviewedBy = reviewedBy;
    approval.comments = comments;
    approval.reviewedAt = Date.now();

    return true;
  }

  /**
   * Get pending approvals
   */
  getPendingApprovals(): ContentApproval[] {
    return Array.from(this.approvals.values()).filter((a) => a.status === "pending");
  }

  /**
   * Get courses by instructor
   */
  getCoursesByInstructor(instructorId: number): Course[] {
    return Array.from(this.courses.values()).filter((c) => c.instructorId === instructorId);
  }

  /**
   * Search courses
   */
  searchCourses(query: string): Course[] {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.courses.values()).filter(
      (c) =>
        c.title.toLowerCase().includes(lowerQuery) ||
        c.description.toLowerCase().includes(lowerQuery) ||
        c.category.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Get CMS statistics
   */
  getStatistics(): {
    totalCourses: number;
    publishedCourses: number;
    draftCourses: number;
    totalLessons: number;
    totalQuizzes: number;
    pendingApprovals: number;
  } {
    const courses = Array.from(this.courses.values());
    const publishedCourses = courses.filter((c) => c.status === "published").length;
    const draftCourses = courses.filter((c) => c.status === "draft").length;
    const lessons = Array.from(this.lessons.values());
    const quizzes = Array.from(this.quizzes.values());
    const pendingApprovals = Array.from(this.approvals.values()).filter((a) => a.status === "pending").length;

    return {
      totalCourses: courses.length,
      publishedCourses,
      draftCourses,
      totalLessons: lessons.length,
      totalQuizzes: quizzes.length,
      pendingApprovals,
    };
  }
}

export const cmsService = new CMSService();
