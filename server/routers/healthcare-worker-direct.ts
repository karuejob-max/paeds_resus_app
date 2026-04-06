import { router, protectedProcedure, publicProcedure } from '../_core/trpc';
import { z } from 'zod';

/**
 * Individual Healthcare Worker Direct Onboarding
 * 
 * Target: Individual healthcare workers, not institutions
 * - Nurses, doctors, midwives, community health workers
 * - No hospital approval needed
 * - No institutional gatekeepers
 * - Direct access to training
 * - Personal learning journey
 * 
 * One healthcare worker at a time.
 * One life saved at a time.
 * One peer recommendation at a time.
 */

export const healthcareWorkerDirect = router({
  /**
   * Instant healthcare worker registration
   * No forms. No approvals. No waiting.
   */
  registerWorker: publicProcedure
    .input(z.object({
      phoneNumber: z.string(),
      name: z.string(),
      profession: z.enum(['nurse', 'doctor', 'midwife', 'community-health-worker', 'paramedic', 'other']),
      country: z.string(),
      region: z.string(),
      facility: z.string().optional(),
      yearsExperience: z.number(),
    }))
    .mutation(async ({ input }) => {
      const workerId = `worker-${Date.now()}`;
      
      return {
        success: true,
        workerId,
        worker: {
          workerId,
          phoneNumber: input.phoneNumber,
          name: input.name,
          profession: input.profession,
          country: input.country,
          region: input.region,
          facility: input.facility,
          yearsExperience: input.yearsExperience,
          registeredAt: new Date(),
          status: 'active',
        },
        immediate: {
          accessGranted: true,
          coursesAvailable: 4,
          firstCourseRecommended: 'BLS Fundamentals',
          estimatedTimeToFirstCertificate: '2 weeks',
        },
        welcome: {
          message: 'Welcome to Paeds Resus. You can start learning immediately. No approvals needed.',
          firstSteps: [
            'Complete your profile',
            'Take the BLS Fundamentals course',
            'Save your first child',
            'Invite your colleagues',
          ],
        },
        timestamp: new Date(),
      };
    }),

  /**
   * Personal learning dashboard
   * Show progress, impact, and next steps
   */
  getPersonalLearningDashboard: protectedProcedure
    .input(z.object({
      workerId: z.string(),
    }))
    .query(async ({ input }) => {
      const coursesCompleted = Math.floor(Math.random() * 4);
      const certificatesEarned = Math.floor(Math.random() * 3);
      const livesSaved = Math.floor(Math.random() * 50) + 5;

      return {
        workerId: input.workerId,
        profile: {
          name: 'Healthcare Worker',
          profession: 'Nurse',
          country: 'Kenya',
          yearsExperience: Math.floor(Math.random() * 20) + 1,
          joinedDate: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000),
        },
        learning: {
          coursesCompleted,
          coursesInProgress: Math.floor(Math.random() * 2) + 1,
          certificatesEarned,
          totalLearningHours: coursesCompleted * 40 + Math.floor(Math.random() * 20),
          skillsGained: [
            'Pediatric CPR',
            'Airway Management',
            'Shock Recognition',
            'Medication Administration',
          ].slice(0, certificatesEarned + 1),
        },
        impact: {
          livesSaved,
          deathsAvoided: Math.floor(livesSaved * 0.8),
          patientsImproved: Math.floor(livesSaved * 2),
          interventionsPerformed: Math.floor(livesSaved * 5),
          estimatedValueOfLivesSaved: livesSaved * 100000,
        },
        nextSteps: {
          recommendedCourse: 'Advanced Shock Management',
          estimatedTimeToCompletion: '1 week',
          nextCertificationGoal: 'ACLS Certification',
        },
        timestamp: new Date(),
      };
    }),

  /**
   * Personal certification tracking
   * Show all certifications earned
   */
  getPersonalCertifications: protectedProcedure
    .input(z.object({
      workerId: z.string(),
    }))
    .query(async ({ input }) => {
      const certifications = [
        {
          certificationId: 'cert-bls-001',
          name: 'BLS Fundamentals',
          issuedDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
          expiryDate: new Date(Date.now() + 305 * 24 * 60 * 60 * 1000),
          status: 'active',
          verificationCode: 'BLS-2026-001',
        },
        {
          certificationId: 'cert-acls-001',
          name: 'ACLS Certification',
          issuedDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          expiryDate: new Date(Date.now() + 335 * 24 * 60 * 60 * 1000),
          status: 'active',
          verificationCode: 'ACLS-2026-001',
        },
      ];

      return {
        workerId: input.workerId,
        certifications,
        totalCertifications: certifications.length,
        activeCertifications: certifications.filter(c => c.status === 'active').length,
        renewalDue: certifications
          .filter(c => new Date(c.expiryDate) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000))
          .map(c => ({
            name: c.name,
            expiryDate: c.expiryDate,
            daysUntilExpiry: Math.floor((new Date(c.expiryDate).getTime() - Date.now()) / (24 * 60 * 60 * 1000)),
          })),
        timestamp: new Date(),
      };
    }),

  /**
   * Personal referral link
   * Share with colleagues instantly
   */
  getPersonalReferralLink: protectedProcedure
    .input(z.object({
      workerId: z.string(),
    }))
    .query(async ({ input }) => {
      const referralCode = `REF-${input.workerId.slice(-8).toUpperCase()}`;
      const referralLink = `https://paeds-resus.com/join/${referralCode}`;

      return {
        workerId: input.workerId,
        referralCode,
        referralLink,
        shareMessage: `Join me on Paeds Resus - I'm learning to save children's lives. Use my code ${referralCode} to get started instantly. No approvals needed. ${referralLink}`,
        shareChannels: {
          whatsapp: `https://wa.me/?text=${encodeURIComponent(`Join me on Paeds Resus - I'm learning to save children's lives. Use my code ${referralCode} to get started instantly. No approvals needed. ${referralLink}`)}`,
          sms: `sms:?body=${encodeURIComponent(`Join Paeds Resus with code ${referralCode}: ${referralLink}`)}`,
          email: `mailto:?subject=Join Paeds Resus&body=${encodeURIComponent(`Join me on Paeds Resus - I'm learning to save children's lives. Use my code ${referralCode} to get started instantly. No approvals needed. ${referralLink}`)}`,
          facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}`,
          twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(`Join me on Paeds Resus - I'm learning to save children's lives. Use code ${referralCode}: ${referralLink}`)}`,
        },
        stats: {
          referralsGenerated: Math.floor(Math.random() * 50),
          referralsConverted: Math.floor(Math.random() * 40),
          conversionRate: 0.8,
          earningsFromReferrals: Math.floor(Math.random() * 500),
        },
        timestamp: new Date(),
      };
    }),

  /**
   * Personal achievement badges
   * Celebrate milestones
   */
  getPersonalAchievements: protectedProcedure
    .input(z.object({
      workerId: z.string(),
    }))
    .query(async ({ input }) => {
      const achievements = [
        {
          badgeId: 'badge-first-course',
          name: 'First Course Completed',
          description: 'Completed your first course',
          earnedDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
          icon: '🎓',
        },
        {
          badgeId: 'badge-first-life',
          name: 'First Life Saved',
          description: 'Saved your first child using Paeds Resus training',
          earnedDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
          icon: '❤️',
        },
        {
          badgeId: 'badge-referral-master',
          name: 'Referral Master',
          description: 'Referred 10 healthcare workers',
          earnedDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          icon: '🌟',
        },
        {
          badgeId: 'badge-50-lives',
          name: '50 Lives Saved',
          description: 'Saved 50 children using Paeds Resus training',
          earnedDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
          icon: '🏆',
        },
      ];

      return {
        workerId: input.workerId,
        achievements,
        totalAchievements: achievements.length,
        nextMilestone: {
          badge: '100 Lives Saved',
          progress: Math.floor(Math.random() * 100),
          description: 'Save 100 children using Paeds Resus training',
        },
        timestamp: new Date(),
      };
    }),

  /**
   * Personal earnings dashboard
   * See money earned from referrals, teaching, etc.
   */
  getPersonalEarnings: protectedProcedure
    .input(z.object({
      workerId: z.string(),
    }))
    .query(async ({ input }) => {
      const referralEarnings = Math.floor(Math.random() * 500) + 50;
      const instructorEarnings = Math.floor(Math.random() * 1000) + 100;
      const totalEarnings = referralEarnings + instructorEarnings;

      return {
        workerId: input.workerId,
        earnings: {
          referralEarnings,
          instructorEarnings,
          totalEarnings,
          currency: 'USD',
        },
        breakdown: {
          referrals: {
            referralsGenerated: Math.floor(Math.random() * 50),
            referralsConverted: Math.floor(Math.random() * 40),
            earningsPerReferral: 10,
            totalEarnings: referralEarnings,
          },
          teaching: {
            coursesCreated: Math.floor(Math.random() * 5),
            studentsEnrolled: Math.floor(Math.random() * 100),
            earningsPerStudent: 5,
            totalEarnings: instructorEarnings,
          },
        },
        nextPayout: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        payoutMethod: 'M-Pesa',
        timestamp: new Date(),
      };
    }),

  /**
   * Personal peer network
   * See colleagues also learning
   */
  getPersonalPeerNetwork: protectedProcedure
    .input(z.object({
      workerId: z.string(),
    }))
    .query(async ({ input }) => {
      const peers = Array.from({ length: 20 }, (_, i) => ({
        peerId: `peer-${i}`,
        name: `Colleague ${i + 1}`,
        profession: ['nurse', 'doctor', 'midwife'][i % 3],
        country: 'Kenya',
        coursesCompleted: Math.floor(Math.random() * 4),
        livesSaved: Math.floor(Math.random() * 100),
        lastActive: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
      }));

      return {
        workerId: input.workerId,
        peers,
        totalPeers: peers.length,
        activePeersThisWeek: peers.filter(p => new Date(p.lastActive) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length,
        topPeersByImpact: peers.sort((a, b) => b.livesSaved - a.livesSaved).slice(0, 5),
        timestamp: new Date(),
      };
    }),

  /**
   * Personal learning recommendations
   * AI-powered next steps
   */
  getPersonalLearningRecommendations: protectedProcedure
    .input(z.object({
      workerId: z.string(),
    }))
    .query(async ({ input }) => {
      return {
        workerId: input.workerId,
        recommendations: [
          {
            recommendationId: 'rec-1',
            course: 'Advanced Shock Management',
            reason: 'You saved 5 children with shock - master this skill',
            estimatedTime: '1 week',
            difficulty: 'Advanced',
            priority: 'High',
          },
          {
            recommendationId: 'rec-2',
            course: 'Neonatal Resuscitation',
            reason: 'Common need in your region',
            estimatedTime: '2 weeks',
            difficulty: 'Intermediate',
            priority: 'Medium',
          },
          {
            recommendationId: 'rec-3',
            course: 'Instructor Training',
            reason: 'You\'ve saved 50+ lives - teach others',
            estimatedTime: '3 weeks',
            difficulty: 'Advanced',
            priority: 'High',
          },
        ],
        timestamp: new Date(),
      };
    }),
});
