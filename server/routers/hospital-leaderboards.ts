import { router, publicProcedure, protectedProcedure } from '../_core/trpc';
import { z } from 'zod';

export const hospitalLeaderboardsRouter = router({
  // Get hospital leaderboard
  getHospitalLeaderboard: publicProcedure
    .input(z.object({
      limit: z.number().default(50),
      timeframe: z.enum(['all_time', 'month', 'week']).default('all_time'),
    }))
    .query(async ({ input }) => {
      return [
        {
          rank: 1,
          hospitalId: 'hosp-1',
          hospitalName: 'Kenyatta National Hospital',
          location: 'Nairobi, Kenya',
          totalPoints: 125430,
          staffEnrolled: 245,
          staffCompleted: 189,
          completionRate: 77,
          averageScore: 87,
          topStaff: 'Dr. James Mwangi',
          logoUrl: 'https://example.com/hospitals/knh.jpg',
          trend: 'up',
          trendValue: 5,
        },
        {
          rank: 2,
          hospitalId: 'hosp-2',
          hospitalName: 'Aga Khan University Hospital',
          location: 'Dar es Salaam, Tanzania',
          totalPoints: 118920,
          staffEnrolled: 198,
          staffCompleted: 156,
          completionRate: 79,
          averageScore: 86,
          topStaff: 'Dr. Sarah Kipchoge',
          logoUrl: 'https://example.com/hospitals/akuh.jpg',
          trend: 'up',
          trendValue: 3,
        },
        {
          rank: 3,
          hospitalId: 'hosp-3',
          hospitalName: 'Nairobi Hospital',
          location: 'Nairobi, Kenya',
          totalPoints: 112450,
          staffEnrolled: 167,
          staffCompleted: 134,
          completionRate: 80,
          averageScore: 85,
          topStaff: 'Dr. Peter Ochieng',
          logoUrl: 'https://example.com/hospitals/nh.jpg',
          trend: 'stable',
          trendValue: 0,
        },
      ];
    }),

  // Get department leaderboard
  getDepartmentLeaderboard: protectedProcedure
    .input(z.object({
      hospitalId: z.string(),
      limit: z.number().default(20),
    }))
    .query(async ({ input }) => {
      return [
        {
          rank: 1,
          departmentId: 'dept-1',
          departmentName: 'Pediatric ICU',
          totalPoints: 45230,
          staffCount: 25,
          completionRate: 92,
          averageScore: 89,
          topStaff: 'Dr. James Mwangi',
          trend: 'up',
        },
        {
          rank: 2,
          departmentId: 'dept-2',
          departmentName: 'Emergency Department',
          totalPoints: 38920,
          staffCount: 32,
          completionRate: 84,
          averageScore: 86,
          topStaff: 'Dr. Sarah Kipchoge',
          trend: 'up',
        },
        {
          rank: 3,
          departmentId: 'dept-3',
          departmentName: 'General Pediatrics',
          totalPoints: 32450,
          staffCount: 28,
          completionRate: 78,
          averageScore: 84,
          topStaff: 'Dr. Peter Ochieng',
          trend: 'stable',
        },
      ];
    }),

  // Get hospital competition
  getHospitalCompetition: protectedProcedure
    .input(z.object({
      hospitalId: z.string(),
      competitionId: z.string(),
    }))
    .query(async ({ input }) => {
      return {
        competitionId: input.competitionId,
        title: 'BLS Mastery Challenge - Q1 2026',
        description: 'Complete BLS course and score 90%+ on final assessment',
        startDate: new Date(Date.now() - 2592000000),
        endDate: new Date(Date.now() + 2592000000),
        status: 'active',
        participants: [
          {
            rank: 1,
            hospitalName: 'Kenyatta National Hospital',
            score: 9500,
            completions: 189,
            averageScore: 87,
          },
          {
            rank: 2,
            hospitalName: 'Aga Khan University Hospital',
            score: 8920,
            completions: 156,
            averageScore: 86,
          },
          {
            rank: 3,
            hospitalName: 'Nairobi Hospital',
            score: 8450,
            completions: 134,
            averageScore: 85,
          },
        ],
        prizes: [
          { position: 1, prize: 'Trophy + $5000 grant', value: 5000 },
          { position: 2, prize: 'Certificate + $3000 grant', value: 3000 },
          { position: 3, prize: 'Certificate + $1000 grant', value: 1000 },
        ],
      };
    }),

  // Get active competitions
  getActiveCompetitions: publicProcedure.query(async () => {
    return [
      {
        competitionId: 'comp-1',
        title: 'BLS Mastery Challenge - Q1 2026',
        description: 'Complete BLS course and score 90%+ on final assessment',
        startDate: new Date(Date.now() - 2592000000),
        endDate: new Date(Date.now() + 2592000000),
        status: 'active',
        participants: 45,
        topHospital: 'Kenyatta National Hospital',
        topScore: 9500,
      },
      {
        competitionId: 'comp-2',
        title: 'PALS Excellence Challenge - Q1 2026',
        description: 'Complete PALS course with highest average score',
        startDate: new Date(Date.now() - 1296000000),
        endDate: new Date(Date.now() + 3888000000),
        status: 'active',
        participants: 38,
        topHospital: 'Aga Khan University Hospital',
        topScore: 8920,
      },
    ];
  }),

  // Join competition
  joinCompetition: protectedProcedure
    .input(z.object({
      competitionId: z.string(),
      hospitalId: z.string(),
    }))
    .mutation(async ({ input }) => {
      return {
        competitionId: input.competitionId,
        hospitalId: input.hospitalId,
        status: 'joined',
        joinedAt: new Date(),
      };
    }),

  // Get competition leaderboard
  getCompetitionLeaderboard: publicProcedure
    .input(z.object({
      competitionId: z.string(),
      limit: z.number().default(100),
    }))
    .query(async ({ input }) => {
      return [
        {
          rank: 1,
          hospitalName: 'Kenyatta National Hospital',
          score: 9500,
          completions: 189,
          averageScore: 87,
          lastUpdate: new Date(),
        },
        {
          rank: 2,
          hospitalName: 'Aga Khan University Hospital',
          score: 8920,
          completions: 156,
          averageScore: 86,
          lastUpdate: new Date(),
        },
        {
          rank: 3,
          hospitalName: 'Nairobi Hospital',
          score: 8450,
          completions: 134,
          averageScore: 85,
          lastUpdate: new Date(),
        },
      ];
    }),

  // Get regional leaderboard
  getRegionalLeaderboard: publicProcedure
    .input(z.object({
      region: z.string(),
      limit: z.number().default(50),
    }))
    .query(async ({ input }) => {
      return [
        {
          rank: 1,
          hospitalName: 'Kenyatta National Hospital',
          region: 'East Africa',
          totalPoints: 125430,
          staffCompleted: 189,
          completionRate: 77,
        },
        {
          rank: 2,
          hospitalName: 'Aga Khan University Hospital',
          region: 'East Africa',
          totalPoints: 118920,
          staffCompleted: 156,
          completionRate: 79,
        },
      ];
    }),

  // Get hospital statistics
  getHospitalStatistics: protectedProcedure
    .input(z.object({ hospitalId: z.string() }))
    .query(async ({ input }) => {
      return {
        hospitalId: input.hospitalId,
        hospitalName: 'Kenyatta National Hospital',
        totalStaff: 245,
        enrolledStaff: 189,
        completedStaff: 145,
        enrollmentRate: 77,
        completionRate: 59,
        averageScore: 87,
        totalPoints: 125430,
        topCourse: 'PALS',
        topDepartment: 'Pediatric ICU',
        averageTimeToComplete: 18,
        certificatesIssued: 145,
      };
    }),

  // Get staff rankings by hospital
  getStaffRankingsByHospital: protectedProcedure
    .input(z.object({
      hospitalId: z.string(),
      limit: z.number().default(50),
    }))
    .query(async ({ input }) => {
      return [
        {
          rank: 1,
          name: 'Dr. James Mwangi',
          department: 'Pediatric ICU',
          points: 2450,
          level: 8,
          coursesCompleted: 3,
          averageScore: 92,
        },
        {
          rank: 2,
          name: 'Dr. Sarah Kipchoge',
          department: 'Emergency Department',
          points: 2180,
          level: 7,
          coursesCompleted: 3,
          averageScore: 89,
        },
        {
          rank: 3,
          name: 'Dr. Peter Ochieng',
          department: 'General Pediatrics',
          points: 1950,
          level: 7,
          coursesCompleted: 2,
          averageScore: 87,
        },
      ];
    }),

  // Award hospital badge
  awardHospitalBadge: protectedProcedure
    .input(z.object({
      hospitalId: z.string(),
      badgeId: z.string(),
      reason: z.string(),
    }))
    .mutation(async ({ input }) => {
      return {
        hospitalId: input.hospitalId,
        badgeId: input.badgeId,
        awarded: true,
        awardedAt: new Date(),
      };
    }),

  // Get hospital badges
  getHospitalBadges: publicProcedure
    .input(z.object({ hospitalId: z.string() }))
    .query(async ({ input }) => {
      return [
        {
          badgeId: 'excellence',
          name: 'Excellence in Training',
          description: 'Achieved 90%+ completion rate',
          awardedAt: new Date(Date.now() - 2592000000),
          icon: 'trophy',
        },
        {
          badgeId: 'growth',
          name: 'Rapid Growth',
          description: 'Increased enrollment by 50% in one month',
          awardedAt: new Date(Date.now() - 1296000000),
          icon: 'arrow-up',
        },
      ];
    }),

  // Get competition prizes
  getCompetitionPrizes: publicProcedure
    .input(z.object({ competitionId: z.string() }))
    .query(async ({ input }) => {
      return [
        {
          position: 1,
          prize: 'Trophy + $5000 grant',
          value: 5000,
          description: 'First place winner receives trophy and funding',
        },
        {
          position: 2,
          prize: 'Certificate + $3000 grant',
          value: 3000,
          description: 'Second place winner receives certificate and funding',
        },
        {
          position: 3,
          prize: 'Certificate + $1000 grant',
          value: 1000,
          description: 'Third place winner receives certificate and funding',
        },
      ];
    }),
});
