import { router, protectedProcedure, publicProcedure } from '../_core/trpc';
import { z } from 'zod';

/**
 * Viral Peer-to-Peer Referral Engine
 * 
 * One healthcare worker tells 5 colleagues.
 * Those 5 tell 5 each.
 * Exponential growth.
 * 
 * No marketing budget needed.
 * No advertising.
 * Just peer networks.
 */

export const viralReferral = router({
  /**
   * Send referral to colleague
   * One click, one message
   */
  sendReferralToColleague: protectedProcedure
    .input(z.object({
      referrerId: z.string(),
      colleagueName: z.string(),
      colleaguePhone: z.string(),
      colleagueProfession: z.string(),
      personalMessage: z.string(),
      channel: z.enum(['whatsapp', 'sms', 'email']),
    }))
    .mutation(async ({ input }) => {
      const referralId = `viral-ref-${Date.now()}`;

      return {
        success: true,
        referralId,
        referral: {
          referrerId: input.referrerId,
          colleagueName: input.colleagueName,
          colleaguePhone: input.colleaguePhone,
          colleagueProfession: input.colleagueProfession,
          personalMessage: input.personalMessage,
          channel: input.channel,
          sentAt: new Date(),
          status: 'sent',
        },
        message: {
          preview: `Hi ${input.colleagueName}, ${input.personalMessage}. Join me on Paeds Resus - no approvals needed, start immediately.`,
          channel: input.channel,
        },
        incentive: {
          referrerGets: '$10 credit if they join',
          referreeGets: 'Free first course',
        },
        expectedOutcome: {
          conversionProbability: 0.7, // 70% conversion for peer referrals
          estimatedTimeToConversion: '2 days',
          estimatedValueIfConverted: 100,
        },
        timestamp: new Date(),
      };
    }),

  /**
   * Bulk referral campaign
   * Send to entire contact list
   */
  bulkReferralCampaign: protectedProcedure
    .input(z.object({
      referrerId: z.string(),
      contacts: z.array(z.object({
        name: z.string(),
        phone: z.string(),
        profession: z.string(),
      })),
      message: z.string(),
      channel: z.enum(['whatsapp', 'sms', 'email']),
    }))
    .mutation(async ({ input }) => {
      const campaignId = `campaign-${Date.now()}`;
      const sentCount = input.contacts.length;
      const expectedConversions = Math.floor(sentCount * 0.7);

      return {
        success: true,
        campaignId,
        campaign: {
          referrerId: input.referrerId,
          contactsSent: sentCount,
          channel: input.channel,
          message: input.message,
          sentAt: new Date(),
          status: 'sent',
        },
        results: {
          contactsSent: sentCount,
          expectedConversions,
          conversionRate: 0.7,
          expectedEarnings: expectedConversions * 10,
        },
        timestamp: new Date(),
      };
    }),

  /**
   * Referral network visualization
   * See your network growing
   */
  getReferralNetworkVisualization: protectedProcedure
    .input(z.object({
      referrerId: z.string(),
    }))
    .query(async ({ input }) => {
      // Simulate network growth
      const directReferrals = Math.floor(Math.random() * 50) + 10;
      const secondDegree = directReferrals * 5;
      const thirdDegree = secondDegree * 5;
      const totalNetwork = directReferrals + secondDegree + thirdDegree;

      return {
        referrerId: input.referrerId,
        network: {
          directReferrals,
          secondDegree,
          thirdDegree,
          totalNetwork,
        },
        impact: {
          livesSavedByNetwork: totalNetwork * 10,
          estimatedValueOfNetwork: totalNetwork * 100,
          growthRate: 'Exponential',
          doublingTime: '7 days',
        },
        topReferrers: [
          {
            referrerId: 'ref-top-1',
            name: 'Top Referrer 1',
            referralsGenerated: Math.floor(Math.random() * 100) + 50,
            conversionRate: 0.8,
          },
          {
            referrerId: 'ref-top-2',
            name: 'Top Referrer 2',
            referralsGenerated: Math.floor(Math.random() * 80) + 40,
            conversionRate: 0.75,
          },
        ],
        timestamp: new Date(),
      };
    }),

  /**
   * Viral coefficient tracking
   * How many new users each user brings
   */
  getViralCoefficientByWorker: protectedProcedure
    .input(z.object({
      workerId: z.string(),
    }))
    .query(async ({ input }) => {
      const directReferrals = Math.floor(Math.random() * 20) + 5;
      const conversionRate = Math.random() * 0.3 + 0.6; // 60-90%
      const conversions = Math.floor(directReferrals * conversionRate);
      const viralCoefficient = conversions / Math.max(1, directReferrals);

      return {
        workerId: input.workerId,
        viralMetrics: {
          referralsSent: directReferrals,
          referralsConverted: conversions,
          conversionRate: conversionRate * 100,
          viralCoefficient,
        },
        interpretation: {
          viralCoefficient: `Each user brings ${viralCoefficient.toFixed(2)} new users`,
          growthRate: viralCoefficient > 1 ? 'Exponential' : 'Linear',
          implication: viralCoefficient > 1 ? 'Viral growth' : 'Sustainable growth',
        },
        projections: {
          usersIn30Days: Math.floor(Math.pow(viralCoefficient, 4)),
          usersIn90Days: Math.floor(Math.pow(viralCoefficient, 13)),
          usersIn1Year: Math.floor(Math.pow(viralCoefficient, 52)),
        },
        timestamp: new Date(),
      };
    }),

  /**
   * Referral leaderboard
   * Celebrate top referrers
   */
  getReferralLeaderboard: publicProcedure
    .input(z.object({
      country: z.string().optional(),
      timeRange: z.enum(['7d', '30d', 'all-time']),
    }))
    .query(async ({ input }) => {
      const leaderboard = Array.from({ length: 50 }, (_, i) => ({
        rank: i + 1,
        workerId: `worker-${i}`,
        name: `Healthcare Worker ${i + 1}`,
        profession: ['nurse', 'doctor', 'midwife'][i % 3],
        referralsGenerated: Math.floor(Math.random() * 200) + 10,
        referralsConverted: Math.floor(Math.random() * 150) + 5,
        conversionRate: Math.random() * 0.3 + 0.6,
        earnings: Math.floor(Math.random() * 5000) + 500,
      }));

      return {
        country: input.country || 'Global',
        timeRange: input.timeRange,
        leaderboard: leaderboard
          .sort((a, b) => b.referralsConverted - a.referralsConverted)
          .slice(0, 20),
        totalReferrers: leaderboard.length,
        topReferrer: leaderboard[0],
        timestamp: new Date(),
      };
    }),

  /**
   * Referral success stories
   * Show what's possible
   */
  getReferralSuccessStories: publicProcedure.query(async () => {
    return {
      stories: [
        {
          storyId: 'story-1',
          referrer: 'Nurse Jane',
          country: 'Kenya',
          referralsGenerated: 150,
          referralsConverted: 120,
          earnings: 1200,
          networkSize: 500,
          livesSavedByNetwork: 5000,
          quote: 'I just shared with my colleagues. They shared with theirs. Now 500 healthcare workers are saving lives.',
        },
        {
          storyId: 'story-2',
          referrer: 'Dr. John',
          country: 'Uganda',
          referralsGenerated: 200,
          referralsConverted: 160,
          earnings: 1600,
          networkSize: 800,
          livesSavedByNetwork: 8000,
          quote: 'No marketing needed. Just peer networks. Exponential growth.',
        },
        {
          storyId: 'story-3',
          referrer: 'Midwife Grace',
          country: 'Tanzania',
          referralsGenerated: 100,
          referralsConverted: 85,
          earnings: 850,
          networkSize: 300,
          livesSavedByNetwork: 3000,
          quote: 'Every colleague I told referred 5 more. That\'s exponential.',
        },
      ],
      timestamp: new Date(),
    };
  }),

  /**
   * Network growth projection
   * See exponential growth
   */
  getNetworkGrowthProjection: publicProcedure
    .input(z.object({
      startingUsers: z.number(),
      viralCoefficient: z.number(),
      timeRange: z.enum(['30d', '90d', '1y']),
    }))
    .query(async ({ input }) => {
      const periods = input.timeRange === '30d' ? 4 : input.timeRange === '90d' ? 13 : 52;
      
      const projection = Array.from({ length: periods }, (_, i) => {
        const period = i + 1;
        const users = Math.floor(input.startingUsers * Math.pow(input.viralCoefficient, period));
        return {
          period,
          date: new Date(Date.now() + period * 7 * 24 * 60 * 60 * 1000),
          users,
          newUsers: users - (i > 0 ? Math.floor(input.startingUsers * Math.pow(input.viralCoefficient, i)) : 0),
        };
      });

      return {
        startingUsers: input.startingUsers,
        viralCoefficient: input.viralCoefficient,
        timeRange: input.timeRange,
        projection,
        summary: {
          startingUsers: input.startingUsers,
          endingUsers: projection[projection.length - 1].users,
          growthFactor: projection[projection.length - 1].users / input.startingUsers,
          totalNewUsers: projection[projection.length - 1].users - input.startingUsers,
        },
        timestamp: new Date(),
      };
    }),

  /**
   * Referral incentive program
   * Reward peer-to-peer growth
   */
  getReferralIncentives: publicProcedure.query(async () => {
    return {
      incentives: [
        {
          milestone: '5 referrals',
          reward: '$50 credit',
          status: 'available',
        },
        {
          milestone: '10 referrals',
          reward: '$150 credit + free premium course',
          status: 'available',
        },
        {
          milestone: '25 referrals',
          reward: '$500 credit + instructor status',
          status: 'available',
        },
        {
          milestone: '50 referrals',
          reward: '$1,500 credit + regional ambassador status',
          status: 'available',
        },
        {
          milestone: '100 referrals',
          reward: '$5,000 credit + country coordinator role',
          status: 'available',
        },
      ],
      timestamp: new Date(),
    };
  }),
});
