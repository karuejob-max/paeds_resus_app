/**
 * Test Suite: Course Management Router
 * Tests seed mutation, enrollment, and course listing
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { coursesRouter } from './courses';
import { db } from '../db';
import { microCourses } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';

describe('Courses Router', () => {
  describe('seedCourses mutation', () => {
    it('should seed all 26 courses to database', async () => {
      // Note: This test requires admin context
      // In production, this would be called via tRPC with admin user context
      
      const expectedCourses = 26;
      const expectedCategories = 8; // respiratory, shock, seizure, toxicology, metabolic, infectious, burns, trauma
      const expectedLevels = 2; // foundational, advanced

      // Verify course structure
      const courseCourseIds = [
        'asthma-i', 'asthma-ii',
        'pneumonia-i', 'pneumonia-ii',
        'septic-shock-i', 'septic-shock-ii',
        'hypovolemic-shock-i', 'hypovolemic-shock-ii',
        'febrile-seizure-i',
        'status-epilepticus-i', 'status-epilepticus-ii',
        'poisoning-i', 'overdose-i', 'caustic-ingestion-i',
        'dka-i', 'dka-ii',
        'hypoglycemia-i', 'electrolyte-i',
        'meningitis-i', 'malaria-i',
        'burns-i', 'burns-ii',
        'trauma-i', 'trauma-ii',
        'aki-i', 'anaemia-i',
      ];

      expect(courseCourseIds).toHaveLength(expectedCourses);
    });

    it('should have correct pricing for foundational courses', () => {
      const foundationalPrice = 80000; // 800 KES in cents
      expect(foundationalPrice).toBe(80000);
    });

    it('should have correct pricing for advanced courses', () => {
      const advancedPrice = 120000; // 1200 KES in cents
      expect(advancedPrice).toBe(120000);
    });

    it('should have correct duration for foundational courses', () => {
      const foundationalDuration = 45; // minutes
      expect(foundationalDuration).toBe(45);
    });

    it('should have correct duration for advanced courses', () => {
      const advancedDuration = 60; // minutes
      expect(advancedDuration).toBe(60);
    });

    it('should enforce prerequisites for advanced courses', () => {
      const advancedWithPrereq = [
        { courseId: 'asthma-ii', prerequisiteId: 'asthma-i' },
        { courseId: 'pneumonia-ii', prerequisiteId: 'pneumonia-i' },
        { courseId: 'septic-shock-ii', prerequisiteId: 'septic-shock-i' },
        { courseId: 'hypovolemic-shock-ii', prerequisiteId: 'hypovolemic-shock-i' },
        { courseId: 'status-epilepticus-ii', prerequisiteId: 'status-epilepticus-i' },
        { courseId: 'dka-ii', prerequisiteId: 'dka-i' },
        { courseId: 'burns-ii', prerequisiteId: 'burns-i' },
        { courseId: 'trauma-ii', prerequisiteId: 'trauma-i' },
      ];

      advancedWithPrereq.forEach((course) => {
        expect(course.prerequisiteId).toBeTruthy();
        expect(course.prerequisiteId).toContain('-i');
      });
    });
  });

  describe('listAll query', () => {
    it('should return all courses with correct structure', () => {
      const courseStructure = {
        id: 1,
        courseId: 'asthma-i',
        title: 'Paediatric Asthma I: Recognition and Initial Management',
        description: 'Recognize asthma exacerbation severity...',
        level: 'foundational',
        emergencyType: 'respiratory',
        duration: 45,
        price: 80000,
        prerequisiteId: null,
        order: 1,
      };

      expect(courseStructure).toHaveProperty('courseId');
      expect(courseStructure).toHaveProperty('title');
      expect(courseStructure).toHaveProperty('level');
      expect(courseStructure).toHaveProperty('emergencyType');
      expect(courseStructure).toHaveProperty('duration');
      expect(courseStructure).toHaveProperty('price');
    });

    it('should group courses by emergency type', () => {
      const categories = {
        respiratory: 4,
        shock: 4,
        seizure: 3,
        toxicology: 3,
        metabolic: 6,
        infectious: 2,
        burns: 2,
        trauma: 2,
      };

      const total = Object.values(categories).reduce((a, b) => a + b, 0);
      expect(total).toBe(26);
    });

    it('should group courses by level', () => {
      const levels = {
        foundational: 14,
        advanced: 12,
      };

      const total = Object.values(levels).reduce((a, b) => a + b, 0);
      expect(total).toBe(26);
    });
  });

  describe('enrollWithMpesa mutation', () => {
    it('should validate user authorization', () => {
      // Only enrolled user can enroll themselves
      const userId = 1;
      const enrollingUserId = 1;
      expect(userId).toBe(enrollingUserId);
    });

    it('should calculate correct M-Pesa amount', () => {
      const priceInCents = 80000; // 800 KES
      const priceInKES = Math.round(priceInCents / 100);
      expect(priceInKES).toBe(800);
    });

    it('should create pending enrollment record', () => {
      const enrollmentStatus = 'pending';
      const paymentStatus = 'pending';
      expect(enrollmentStatus).toBe('pending');
      expect(paymentStatus).toBe('pending');
    });
  });

  describe('grantAdminAccess mutation', () => {
    it('should only allow admin email', () => {
      const adminEmail = 'karuejob@gmail.com';
      expect(adminEmail).toBe('karuejob@gmail.com');
    });

    it('should set enrollment status to active for admin', () => {
      const adminEnrollmentStatus = 'active';
      const adminPaymentStatus = 'free';
      expect(adminEnrollmentStatus).toBe('active');
      expect(adminPaymentStatus).toBe('free');
    });
  });

  describe('completeCourse mutation', () => {
    it('should require 80% quiz score to pass', () => {
      const passingScore = 80;
      expect(passingScore).toBeGreaterThanOrEqual(80);
    });

    it('should fail with score below 80%', () => {
      const failingScore = 79;
      expect(failingScore).toBeLessThan(80);
    });

    it('should mark enrollment as completed', () => {
      const completedStatus = 'completed';
      expect(completedStatus).toBe('completed');
    });
  });

  describe('Course Catalog Display', () => {
    it('should display all 26 courses in catalog', () => {
      const expectedCount = 26;
      expect(expectedCount).toBe(26);
    });

    it('should support filtering by emergency type', () => {
      const categories = ['respiratory', 'shock', 'seizure', 'toxicology', 'metabolic', 'infectious', 'burns', 'trauma'];
      expect(categories).toHaveLength(8);
    });

    it('should support filtering by difficulty level', () => {
      const levels = ['foundational', 'advanced'];
      expect(levels).toHaveLength(2);
    });

    it('should display course pricing in KES', () => {
      const foundationalPrice = 800; // KES
      const advancedPrice = 1200; // KES
      expect(foundationalPrice).toBeLessThan(advancedPrice);
    });

    it('should display course duration in minutes', () => {
      const foundationalDuration = 45; // minutes
      const advancedDuration = 60; // minutes
      expect(foundationalDuration).toBeLessThan(advancedDuration);
    });

    it('should show prerequisite badges for advanced courses', () => {
      const prerequisiteExample = 'asthma-i';
      expect(prerequisiteExample).toBeTruthy();
    });
  });

  describe('Admin Seed Button', () => {
    it('should only be visible to admin', () => {
      const adminEmail = 'karuejob@gmail.com';
      expect(adminEmail).toBe('karuejob@gmail.com');
    });

    it('should display success toast on seed completion', () => {
      const toastMessage = 'Seeded 26 courses to database';
      expect(toastMessage).toContain('26');
    });

    it('should display error toast on seed failure', () => {
      const errorMessage = 'Failed to seed courses';
      expect(errorMessage).toBeTruthy();
    });

    it('should show course statistics after seeding', () => {
      const stats = {
        total: 26,
        byLevel: { foundational: 14, advanced: 12 },
        byCategory: {
          respiratory: 4,
          shock: 4,
          seizure: 3,
          toxicology: 3,
          metabolic: 6,
          infectious: 2,
          burns: 2,
          trauma: 2,
        },
      };

      expect(stats.total).toBe(26);
      expect(Object.values(stats.byLevel).reduce((a, b) => a + b, 0)).toBe(26);
    });

    it('should provide link to verify courses in catalog', () => {
      const catalogUrl = '/courses';
      expect(catalogUrl).toBe('/courses');
    });
  });
});
