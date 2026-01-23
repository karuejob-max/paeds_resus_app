import { describe, it, expect } from 'vitest';
import { coreExponential } from './core-exponential';

describe('Core Exponential Platform', () => {
  describe('register', () => {
    it('should register healthcare worker and return access token', async () => {
      const caller = coreExponential.createCaller({} as any);
      
      const result = await caller.register({
        phone: '+254712345678',
        name: 'Jane Doe',
        profession: 'nurse',
        country: 'Kenya',
      });

      expect(result.success).toBe(true);
      expect(result.workerId).toBeDefined();
      expect(result.accessToken).toBeDefined();
      expect(result.referralLink).toContain('https://paeds-resus.com/join/');
      expect(result.coursesAvailable).toBe(4);
      expect(result.nextSteps).toHaveLength(4);
    });
  });

  describe('getCourses', () => {
    it('should return all 4 courses', async () => {
      const mockCtx = { user: { id: 'user-123', name: 'Test User', email: 'test@example.com', role: 'user' } };
      const caller = coreExponential.createCaller(mockCtx as any);
      
      const result = await caller.getCourses({
        workerId: 'worker-123',
      });

      expect(result.courses).toHaveLength(4);
      expect(result.totalCourses).toBe(4);
      expect(result.totalHours).toBe(380);
      expect(result.courses.length).toBeGreaterThanOrEqual(4);
      expect(result.courses[0].name).toContain('BLS');
      expect(result.courses[3].name).toContain('Fellowship');
    });
  });

  describe('getReferralLink', () => {
    it('should generate referral link and share channels', async () => {
      const mockCtx = { user: { id: 'user-123', name: 'Test User', email: 'test@example.com', role: 'user' } };
      const caller = coreExponential.createCaller(mockCtx as any);
      
      const result = await caller.getReferralLink({
        workerId: 'worker-abc123def456',
      });

      expect(result.referralCode).toBeDefined();
      expect(result.referralLink).toContain('https://paeds-resus.com/join/');
      expect(result.shareMessage).toContain('Paeds Resus');
      expect(result.shareChannels.whatsapp).toBeDefined();
      expect(result.shareChannels.sms).toBeDefined();
      expect(result.shareChannels.email).toBeDefined();
      expect(result.incentive).toContain('$10');
    });
  });

  describe('getEarnings', () => {
    it('should return earnings breakdown', async () => {
      const mockCtx = { user: { id: 'user-123', name: 'Test User', email: 'test@example.com', role: 'user' } };
      const caller = coreExponential.createCaller(mockCtx as any);
      
      const result = await caller.getEarnings({
        workerId: 'worker-123',
      });

      expect(result.earnings.referrals).toBeGreaterThanOrEqual(50);
      expect(result.earnings.teaching).toBeGreaterThanOrEqual(100);
      expect(result.earnings.total).toBeGreaterThan(0);
      expect(result.earnings.currency).toBe('USD');
      expect(result.breakdown.earningsPerReferral).toBe(10);
      expect(result.breakdown.earningsPerStudent).toBe(5);
      expect(result.nextPayout).toBeDefined();
      expect(result.payoutMethod).toBe('M-Pesa');
    });
  });

  describe('getPersonalImpact', () => {
    it('should return personal impact metrics', async () => {
      const mockCtx = { user: { id: 'user-123', name: 'Test User', email: 'test@example.com', role: 'user' } };
      const caller = coreExponential.createCaller(mockCtx as any);
      
      const result = await caller.getPersonalImpact({
        workerId: 'worker-123',
      });

      expect(result.impact.livesSaved).toBeGreaterThan(0);
      expect(result.impact.deathsAvoided).toBeGreaterThan(0);
      expect(result.impact.patientsImproved).toBeGreaterThan(0);
      expect(result.impact.estimatedValueOfLivesSaved).toBeGreaterThan(0);
      expect(result.message).toContain('saved');
      expect(result.nextMilestone).toBeDefined();
    });
  });

  describe('getGlobalImpact', () => {
    it('should return global network impact', async () => {
      const caller = coreExponential.createCaller({} as any);
      
      const result = await caller.getGlobalImpact();

      expect(result.totalHealthcareWorkers).toBeGreaterThan(0);
      expect(result.totalLivesSaved).toBeGreaterThan(0);
      expect(result.totalDeathsAvoided).toBeGreaterThan(0);
      expect(result.countriesCovered).toBeGreaterThan(0);
      expect(result.viralCoefficient).toBeGreaterThan(1);
      expect(result.doublingTime).toBeDefined();
    });
  });

  describe('getLeaderboard', () => {
    it('should return top performers', async () => {
      const caller = coreExponential.createCaller({} as any);
      
      const result = await caller.getLeaderboard({
        country: 'Kenya',
        timeRange: '30d',
      });

      expect(result.leaderboard.length).toBeGreaterThan(0);
      expect(result.leaderboard[0].rank).toBeGreaterThanOrEqual(1);
      expect(result.topPerformer).toBeDefined();
      expect(result.topPerformer.referralsConverted).toBeGreaterThan(0);
    });
  });

  describe('getCertification', () => {
    it('should generate certification with verification code', async () => {
      const mockCtx = { user: { id: 'user-123', name: 'Test User', email: 'test@example.com', role: 'user' } };
      const caller = coreExponential.createCaller(mockCtx as any);
      
      const result = await caller.getCertification({
        workerId: 'worker-123',
        courseId: 'bls-fundamentals',
      });

      expect(result.certificationId).toBeDefined();
      expect(result.verificationCode).toBeDefined();
      expect(result.verificationLink).toContain('https://paeds-resus.com/verify/');
      expect(result.expiryDate).toBeDefined();
      expect(result.downloadPDF).toBeDefined();
      expect(result.shareOnLinkedIn).toBeDefined();
    });
  });

  describe('getNetworkGrowth', () => {
    it('should show exponential network growth', async () => {
      const mockCtx = { user: { id: 'user-123', name: 'Test User', email: 'test@example.com', role: 'user' } };
      const caller = coreExponential.createCaller(mockCtx as any);
      
      const result = await caller.getNetworkGrowth({
        workerId: 'worker-123',
      });

      expect(result.directReferrals).toBeGreaterThan(0);
      expect(result.secondDegree).toBeGreaterThan(result.directReferrals);
      expect(result.thirdDegree).toBeGreaterThan(result.secondDegree);
      expect(result.totalNetwork).toBeGreaterThan(0);
      expect(result.networkImpact.growthRate).toBe('Exponential');
      expect(result.networkImpact.doublingTime).toBe('7 days');
    });
  });

  describe('getNextCourse', () => {
    it('should recommend next course based on impact', async () => {
      const mockCtx = { user: { id: 'user-123', name: 'Test User', email: 'test@example.com', role: 'user' } };
      const caller = coreExponential.createCaller(mockCtx as any);
      
      const result = await caller.getNextCourse({
        workerId: 'worker-123',
      });

      expect(result.nextCourse).toBeDefined();
      expect(result.nextCourse.courseId).toBeDefined();
      expect(result.nextCourse.reason).toBeDefined();
      expect(result.alternativeCourses.length).toBeGreaterThan(0);
      expect(result.nextCourse.startNow).toContain('https://paeds-resus.com/learn/');
    });
  });
});
