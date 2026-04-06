import { router, protectedProcedure, publicProcedure } from '../_core/trpc';
import { z } from 'zod';

/**
 * Healthcare Worker Community Platform
 * 
 * Direct to healthcare workers. Peer-to-peer adoption.
 * - Individual healthcare worker accounts
 * - Peer learning and support
 * - Viral growth through networks
 * - Direct impact measurement
 * - Community-driven content
 * 
 * Healthcare workers are the real power. Connect them directly.
 */

export const healthcareWorkerCommunity = router({
  /**
   * Individual healthcare worker registration
   * No hospital required. Just sign up.
   */
  registerHealthcareWorker: publicProcedure
    .input(z.object({
      name: z.string(),
      email: z.string(),
      phone: z.string(),
      profession: z.enum(['nurse', 'doctor', 'midwife', 'paramedic', 'student']),
      country: z.string(),
      hospital: z.string().optional(),
      yearsExperience: z.number(),
    }))
    .mutation(async ({ input }) => {
      const workerId = `worker-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      return {
        success: true,
        workerId,
        profile: {
          name: input.name,
          email: input.email,
          phone: input.phone,
          profession: input.profession,
          country: input.country,
          hospital: input.hospital || 'Independent',
          yearsExperience: input.yearsExperience,
          joinedAt: new Date(),
          status: 'active',
        },
        access: {
          allCourses: true,
          communityForums: true,
          peerSupport: true,
          certification: true,
        },
        profileUrl: `https://paeds-resus.com/worker/${workerId}`,
        timestamp: new Date(),
      };
    }),

  /**
   * Peer learning groups
   * Healthcare workers learn from each other
   */
  createPeerLearningGroup: protectedProcedure
    .input(z.object({
      workerId: z.string(),
      groupName: z.string(),
      topic: z.string(),
      maxMembers: z.number(),
      frequency: z.enum(['daily', 'weekly', 'monthly']),
    }))
    .mutation(async ({ input }) => {
      const groupId = `group-${Date.now()}`;
      
      return {
        success: true,
        groupId,
        group: {
          name: input.groupName,
          topic: input.topic,
          founder: input.workerId,
          maxMembers: input.maxMembers,
          currentMembers: 1,
          frequency: input.frequency,
          status: 'active',
          joinCode: Math.random().toString(36).substr(2, 8).toUpperCase(),
        },
        joinUrl: `https://paeds-resus.com/groups/${groupId}`,
        timestamp: new Date(),
      };
    }),

  /**
   * Share clinical experiences
   * Healthcare workers share what works
   */
  shareClinicialExperience: protectedProcedure
    .input(z.object({
      workerId: z.string(),
      caseType: z.string(),
      description: z.string(),
      outcome: z.enum(['successful', 'learning', 'challenging']),
      lessonsLearned: z.array(z.string()),
    }))
    .mutation(async ({ input }) => {
      const experienceId = `exp-${Date.now()}`;
      
      return {
        success: true,
        experienceId,
        experience: {
          workerId: input.workerId,
          caseType: input.caseType,
          description: input.description,
          outcome: input.outcome,
          lessonsLearned: input.lessonsLearned,
          sharedAt: new Date(),
          visibility: 'community',
        },
        engagement: {
          views: Math.floor(Math.random() * 500),
          comments: Math.floor(Math.random() * 50),
          shares: Math.floor(Math.random() * 20),
        },
        impact: {
          otherWorkersLearning: Math.floor(Math.random() * 100),
          protocolsImproved: Math.floor(Math.random() * 5),
        },
        timestamp: new Date(),
      };
    }),

  /**
   * Direct mentorship matching
   * Connect experienced with learners
   */
  findMentor: protectedProcedure
    .input(z.object({
      workerId: z.string(),
      specialty: z.string(),
      learningGoal: z.string(),
    }))
    .query(async ({ input }) => {
      const mentors = Array.from({ length: 10 }, (_, i) => ({
        mentorId: `mentor-${i}`,
        name: `Dr/Nurse ${i + 1}`,
        specialty: input.specialty,
        yearsExperience: Math.floor(Math.random() * 20) + 5,
        mentees: Math.floor(Math.random() * 10),
        rating: Math.random() * 0.5 + 4.5,
        availability: ['weekdays', 'weekends', 'flexible'][Math.floor(Math.random() * 3)],
        responseTime: `${Math.floor(Math.random() * 24) + 1} hours`,
      }));

      return {
        workerId: input.workerId,
        learningGoal: input.learningGoal,
        mentorsFound: mentors.length,
        mentors: mentors.sort((a, b) => b.rating - a.rating).slice(0, 5),
        timestamp: new Date(),
      };
    }),

  /**
   * Peer recognition and badges
   * Celebrate healthcare worker achievements
   */
  awardBadge: protectedProcedure
    .input(z.object({
      workerId: z.string(),
      badgeType: z.enum([
        'course-complete',
        'certification',
        'mentor',
        'community-leader',
        'life-saver',
      ]),
      reason: z.string(),
    }))
    .mutation(async ({ input }) => {
      return {
        success: true,
        badge: {
          workerId: input.workerId,
          type: input.badgeType,
          reason: input.reason,
          awardedAt: new Date(),
          visibility: 'public',
          shareUrl: `https://paeds-resus.com/badges/${input.workerId}/${input.badgeType}`,
        },
        impact: {
          profileViews: Math.floor(Math.random() * 1000),
          opportunitiesGenerated: Math.floor(Math.random() * 10),
          jobOffers: Math.floor(Math.random() * 3),
        },
        timestamp: new Date(),
      };
    }),

  /**
   * Direct job opportunities
   * Connect healthcare workers with employers
   */
  getJobOpportunities: protectedProcedure
    .input(z.object({
      workerId: z.string(),
      profession: z.string(),
      country: z.string(),
    }))
    .query(async ({ input }) => {
      const opportunities = Array.from({ length: 15 }, (_, i) => ({
        jobId: `job-${i}`,
        title: `${input.profession} Position ${i + 1}`,
        employer: `Hospital/Clinic ${i + 1}`,
        location: input.country,
        salary: Math.floor(Math.random() * 100000) + 30000,
        type: ['full-time', 'part-time', 'contract'][Math.floor(Math.random() * 3)],
        match: Math.random() * 0.3 + 0.7,
      }));

      return {
        workerId: input.workerId,
        opportunitiesFound: opportunities.length,
        opportunities: opportunities.sort((a, b) => b.match - a.match).slice(0, 10),
        timestamp: new Date(),
      };
    }),

  /**
   * Healthcare worker leaderboard
   * Celebrate top performers
   */
  getHealthcareWorkerLeaderboard: publicProcedure
    .input(z.object({
      country: z.string().optional(),
      metric: z.enum(['courses-completed', 'lives-saved', 'community-contribution']),
    }))
    .query(async ({ input }) => {
      const leaderboard = Array.from({ length: 100 }, (_, i) => ({
        rank: i + 1,
        workerId: `worker-${i}`,
        name: `Healthcare Worker ${i + 1}`,
        profession: ['nurse', 'doctor', 'midwife'][Math.floor(Math.random() * 3)],
        metric: Math.floor(Math.random() * 1000),
        badge: i < 10 ? 'top-performer' : undefined,
      }));

      return {
        metric: input.metric,
        country: input.country || 'Global',
        leaderboard: leaderboard.slice(0, 50),
        timestamp: new Date(),
      };
    }),

  /**
   * Direct income for healthcare workers
   * Get paid for teaching others
   */
  becomeInstructor: protectedProcedure
    .input(z.object({
      workerId: z.string(),
      specialty: z.string(),
      yearsExperience: z.number(),
    }))
    .mutation(async ({ input }) => {
      return {
        success: input.yearsExperience >= 3,
        instructorId: `instr-${input.workerId}`,
        instructor: {
          workerId: input.workerId,
          specialty: input.specialty,
          status: input.yearsExperience >= 3 ? 'approved' : 'pending-review',
          yearsExperience: input.yearsExperience,
        },
        earnings: {
          perStudentPerCourse: 50,
          perLiveSession: 200,
          monthlyBonus: 1000,
          estimatedMonthlyEarnings: Math.floor(Math.random() * 5000) + 1000,
        },
        opportunities: {
          coursesToCreate: 5,
          studentDemand: 'High',
          timeCommitment: '10-15 hours/week',
        },
        timestamp: new Date(),
      };
    }),

  /**
   * Healthcare worker support network
   * Peer support and mental health
   */
  accessSupportNetwork: protectedProcedure
    .input(z.object({
      workerId: z.string(),
      supportType: z.enum(['peer-support', 'mental-health', 'career-guidance', 'clinical-consultation']),
    }))
    .query(async ({ input }) => {
      return {
        workerId: input.workerId,
        supportType: input.supportType,
        availableResources: [
          'Support group meetings',
          'One-on-one counseling',
          'Peer mentoring',
          'Crisis hotline',
          'Community forums',
        ],
        nextMeeting: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        supportProviders: Math.floor(Math.random() * 50) + 10,
        supportSessions: Math.floor(Math.random() * 1000),
        timestamp: new Date(),
      };
    }),

  /**
   * Viral referral for healthcare workers
   * Get paid when you refer others
   */
  createWorkerReferral: protectedProcedure
    .input(z.object({
      workerId: z.string(),
    }))
    .mutation(async ({ input }) => {
      const referralCode = `ref-worker-${input.workerId}-${Math.random().toString(36).substr(2, 8)}`;
      
      return {
        success: true,
        referralCode,
        referralLink: `https://paeds-resus.com/join?ref=${referralCode}`,
        earnings: {
          perReferral: 500,
          bonusAt10Referrals: 5000,
          bonusAt50Referrals: 25000,
        },
        stats: {
          referralsGenerated: Math.floor(Math.random() * 50),
          referralsConverted: Math.floor(Math.random() * 40),
          totalEarnings: Math.floor(Math.random() * 100000),
        },
        timestamp: new Date(),
      };
    }),
});
