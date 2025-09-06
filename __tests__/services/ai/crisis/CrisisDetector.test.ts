/**
 * Crisis Detector Tests
 * Tests for crisis risk assessment and pattern detection
 */
import { crisisDetector } from '../../../../src/services/ai/crisis/CrisisDetector';
import { userRecoveryProfileRepository } from '../../../../src/services/ai/repositories/UserRecoveryProfileRepository';
import { dailyCheckInRepository } from '../../../../src/services/ai/repositories/DailyCheckInRepository';

// Mock dependencies
jest.mock('../../../../src/services/ai/repositories/UserRecoveryProfileRepository');
jest.mock('../../../../src/services/ai/repositories/DailyCheckInRepository');

const mockUserRecoveryProfileRepository = userRecoveryProfileRepository as jest.Mocked<typeof userRecoveryProfileRepository>;
const mockDailyCheckInRepository = dailyCheckInRepository as jest.Mocked<typeof dailyCheckInRepository>;

describe('CrisisDetector', () => {
  const mockUserId = 'test-user-123';
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('assessCrisisRisk', () => {
    it('should detect high crisis risk from multiple indicators', async () => {
      // Mock user profile
      mockUserRecoveryProfileRepository.findByUserId.mockResolvedValue({
        id: '1',
        user_id: mockUserId,
        current_stage: 'challenge',
        days_since_last_setback: 2,
        total_recovery_days: 10,
        recovery_start_date: '2024-01-01',
        personal_triggers: ['stress', 'anxiety'],
        coping_strategies: [],
        support_contacts: [],
        recovery_goals: [],
        privacy_settings: {
          share_progress_anonymously: false,
          allow_ai_analysis: true,
          data_retention_days: 365,
          emergency_contact_access: true,
        },
        ai_coaching_enabled: true,
        crisis_intervention_enabled: true,
        milestone_notifications_enabled: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      });

      // Mock high-risk check-ins
      mockDailyCheckInRepository.getRecentCheckIns.mockResolvedValue([
        {
          id: '1',
          user_id: mockUserId,
          date: '2024-01-15',
          mood_rating: 2, // Very low mood
          energy_level: 2,
          stress_level: 9, // Very high stress
          sleep_quality: 2,
          trigger_events: [
            {
              type: 'stress',
              intensity: 9,
              duration_minutes: 180,
              context: 'overwhelming work pressure',
              coping_response: 'none',
              outcome: 'overwhelmed',
              timestamp: '2024-01-15T14:00:00Z',
            },
            {
              type: 'anxiety',
              intensity: 8,
              duration_minutes: 120,
              context: 'panic about future',
              coping_response: 'attempted breathing',
              outcome: 'partial',
              timestamp: '2024-01-15T16:00:00Z',
            },
          ],
          coping_strategies_used: [],
          focus_sessions_completed: 0,
          productive_hours: 1,
          ai_coach_interactions: 0,
          reflection_completed: false,
          gratitude_entries: [],
          created_at: '2024-01-15T20:00:00Z',
          updated_at: '2024-01-15T20:00:00Z',
        },
      ]);

      mockDailyCheckInRepository.getAverageRatings.mockResolvedValue({
        mood: 2,
        stress: 9,
        energy: 2,
        sleep: 2,
      });

      const assessment = await crisisDetector.assessCrisisRisk(mockUserId);

      expect(assessment.overallRiskLevel).toBe('critical');
      expect(assessment.riskScore).toBeGreaterThan(80);
      expect(assessment.interventionRecommended).toBe(true);
      expect(assessment.escalationRequired).toBe(true);
      expect(assessment.timeToIntervention).toBe('immediate');
      expect(assessment.indicators.length).toBeGreaterThan(0);
      
      // Should detect emotional indicators
      const emotionalIndicators = assessment.indicators.filter(i => i.type === 'emotional');
      expect(emotionalIndicators.length).toBeGreaterThan(0);
      expect(emotionalIndicators.some(i => i.requiresImmediate)).toBe(true);
    });

    it('should detect medium risk with some concerning indicators', async () => {
      mockUserRecoveryProfileRepository.findByUserId.mockResolvedValue({
        id: '1',
        user_id: mockUserId,
        current_stage: 'early',
        days_since_last_setback: 15,
        total_recovery_days: 25,
        recovery_start_date: '2024-01-01',
        personal_triggers: ['stress'],
        coping_strategies: ['breathing'],
        support_contacts: [],
        recovery_goals: [],
        privacy_settings: {
          share_progress_anonymously: false,
          allow_ai_analysis: true,
          data_retention_days: 365,
          emergency_contact_access: true,
        },
        ai_coaching_enabled: true,
        crisis_intervention_enabled: true,
        milestone_notifications_enabled: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      });

      mockDailyCheckInRepository.getRecentCheckIns.mockResolvedValue([
        {
          id: '1',
          user_id: mockUserId,
          date: '2024-01-15',
          mood_rating: 5, // Moderate mood
          energy_level: 4,
          stress_level: 7, // Elevated stress
          sleep_quality: 4,
          trigger_events: [
            {
              type: 'stress',
              intensity: 6,
              duration_minutes: 60,
              context: 'work deadline',
              coping_response: 'breathing exercise',
              outcome: 'managed',
              timestamp: '2024-01-15T14:00:00Z',
            },
          ],
          coping_strategies_used: ['breathing'],
          focus_sessions_completed: 1,
          productive_hours: 4,
          ai_coach_interactions: 1,
          reflection_completed: true,
          gratitude_entries: ['grateful for support'],
          created_at: '2024-01-15T20:00:00Z',
          updated_at: '2024-01-15T20:00:00Z',
        },
      ]);

      mockDailyCheckInRepository.getAverageRatings.mockResolvedValue({
        mood: 5,
        stress: 7,
        energy: 4,
        sleep: 4,
      });

      const assessment = await crisisDetector.assessCrisisRisk(mockUserId);

      expect(assessment.overallRiskLevel).toBe('medium');
      expect(assessment.riskScore).toBeGreaterThan(45);
      expect(assessment.riskScore).toBeLessThan(65);
      expect(assessment.interventionRecommended).toBe(true);
      expect(assessment.escalationRequired).toBe(false);
      expect(assessment.timeToIntervention).toBe('within_day');
    });

    it('should detect low risk with good indicators', async () => {
      mockUserRecoveryProfileRepository.findByUserId.mockResolvedValue({
        id: '1',
        user_id: mockUserId,
        current_stage: 'maintenance',
        days_since_last_setback: 45,
        total_recovery_days: 90,
        recovery_start_date: '2024-01-01',
        personal_triggers: ['stress'],
        coping_strategies: ['meditation', 'exercise'],
        support_contacts: [],
        recovery_goals: [],
        privacy_settings: {
          share_progress_anonymously: false,
          allow_ai_analysis: true,
          data_retention_days: 365,
          emergency_contact_access: true,
        },
        ai_coaching_enabled: true,
        crisis_intervention_enabled: true,
        milestone_notifications_enabled: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      });

      mockDailyCheckInRepository.getRecentCheckIns.mockResolvedValue([
        {
          id: '1',
          user_id: mockUserId,
          date: '2024-01-15',
          mood_rating: 7, // Good mood
          energy_level: 7,
          stress_level: 4, // Low stress
          sleep_quality: 7,
          trigger_events: [],
          coping_strategies_used: ['meditation'],
          focus_sessions_completed: 3,
          productive_hours: 6,
          ai_coach_interactions: 1,
          reflection_completed: true,
          gratitude_entries: ['grateful for progress', 'grateful for health'],
          created_at: '2024-01-15T20:00:00Z',
          updated_at: '2024-01-15T20:00:00Z',
        },
      ]);

      mockDailyCheckInRepository.getAverageRatings.mockResolvedValue({
        mood: 7,
        stress: 4,
        energy: 7,
        sleep: 7,
      });

      const assessment = await crisisDetector.assessCrisisRisk(mockUserId);

      expect(assessment.overallRiskLevel).toBe('low');
      expect(assessment.riskScore).toBeLessThan(25);
      expect(assessment.interventionRecommended).toBe(false);
      expect(assessment.escalationRequired).toBe(false);
      expect(assessment.timeToIntervention).toBe('monitor');
    });

    it('should detect temporal risk indicators', async () => {
      // Mock late night time (high risk period)
      jest.spyOn(Date.prototype, 'getHours').mockReturnValue(23); // 11 PM
      jest.spyOn(Date.prototype, 'getDay').mockReturnValue(6); // Saturday

      mockUserRecoveryProfileRepository.findByUserId.mockResolvedValue({
        id: '1',
        user_id: mockUserId,
        current_stage: 'early',
        days_since_last_setback: 15,
        total_recovery_days: 25,
        recovery_start_date: '2024-01-01',
        personal_triggers: ['stress'],
        coping_strategies: ['breathing'],
        support_contacts: [],
        recovery_goals: [],
        privacy_settings: {
          share_progress_anonymously: false,
          allow_ai_analysis: true,
          data_retention_days: 365,
          emergency_contact_access: true,
        },
        ai_coaching_enabled: true,
        crisis_intervention_enabled: true,
        milestone_notifications_enabled: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      });

      mockDailyCheckInRepository.getRecentCheckIns.mockResolvedValue([]);
      mockDailyCheckInRepository.getAverageRatings.mockResolvedValue({
        mood: 6,
        stress: 5,
        energy: 6,
        sleep: 6,
      });

      const assessment = await crisisDetector.assessCrisisRisk(mockUserId);

      const temporalIndicators = assessment.indicators.filter(i => i.type === 'temporal');
      expect(temporalIndicators.length).toBeGreaterThan(0);
      expect(temporalIndicators.some(i => i.description.includes('high-risk period'))).toBe(true);
    });

    it('should handle missing user profile gracefully', async () => {
      mockUserRecoveryProfileRepository.findByUserId.mockResolvedValue(null);

      await expect(crisisDetector.assessCrisisRisk(mockUserId))
        .rejects.toThrow('User recovery profile not found');
    });

    it('should return safe default on error', async () => {
      mockUserRecoveryProfileRepository.findByUserId.mockRejectedValue(new Error('Database error'));

      const assessment = await crisisDetector.assessCrisisRisk(mockUserId);

      expect(assessment.overallRiskLevel).toBe('medium');
      expect(assessment.riskScore).toBe(50);
      expect(assessment.interventionRecommended).toBe(true);
      expect(assessment.contextualFactors).toContain('Assessment error - using safe defaults');
    });
  });

  describe('detectImmediateCrisis', () => {
    it('should detect immediate crisis from high risk score', async () => {
      // Mock high-risk assessment
      jest.spyOn(crisisDetector, 'assessCrisisRisk').mockResolvedValue({
        overallRiskLevel: 'critical',
        riskScore: 85,
        indicators: [
          {
            type: 'emotional',
            severity: 'critical',
            confidence: 0.9,
            description: 'Severe emotional distress',
            triggerFactors: ['depression', 'hopelessness'],
            detectedAt: new Date().toISOString(),
            requiresImmediate: true,
          },
        ],
        triggerTypes: ['depression'],
        interventionRecommended: true,
        escalationRequired: true,
        timeToIntervention: 'immediate',
        contextualFactors: ['severe_distress'],
      });

      const needsCrisis = await crisisDetector.detectImmediateCrisis(mockUserId);

      expect(needsCrisis).toBe(true);
    });

    it('should not detect crisis for low risk', async () => {
      jest.spyOn(crisisDetector, 'assessCrisisRisk').mockResolvedValue({
        overallRiskLevel: 'low',
        riskScore: 20,
        indicators: [],
        triggerTypes: [],
        interventionRecommended: false,
        escalationRequired: false,
        timeToIntervention: 'monitor',
        contextualFactors: [],
      });

      const needsCrisis = await crisisDetector.detectImmediateCrisis(mockUserId);

      expect(needsCrisis).toBe(false);
    });

    it('should err on side of caution on error', async () => {
      jest.spyOn(crisisDetector, 'assessCrisisRisk').mockRejectedValue(new Error('Assessment failed'));

      const needsCrisis = await crisisDetector.detectImmediateCrisis(mockUserId);

      expect(needsCrisis).toBe(true);
    });
  });

  describe('getRiskPatterns', () => {
    it('should identify temporal risk patterns', async () => {
      mockUserRecoveryProfileRepository.findByUserId.mockResolvedValue({
        id: '1',
        user_id: mockUserId,
        current_stage: 'early',
        days_since_last_setback: 15,
        total_recovery_days: 25,
        recovery_start_date: '2024-01-01',
        personal_triggers: ['stress'],
        coping_strategies: ['breathing'],
        support_contacts: [],
        recovery_goals: [],
        privacy_settings: {
          share_progress_anonymously: false,
          allow_ai_analysis: true,
          data_retention_days: 365,
          emergency_contact_access: true,
        },
        ai_coaching_enabled: true,
        crisis_intervention_enabled: true,
        milestone_notifications_enabled: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      });

      // Mock check-ins with pattern at specific hour
      const checkInsWithPattern = Array.from({ length: 5 }, (_, i) => ({
        id: `${i + 1}`,
        user_id: mockUserId,
        date: `2024-01-${10 + i}`,
        mood_rating: 6,
        energy_level: 6,
        stress_level: 5,
        sleep_quality: 6,
        trigger_events: [
          {
            type: 'stress',
            intensity: 8, // High intensity at same time
            duration_minutes: 60,
            context: 'evening stress',
            coping_response: 'breathing',
            outcome: 'managed',
            timestamp: `2024-01-${10 + i}T20:00:00Z`, // Same hour each day
          },
        ],
        coping_strategies_used: ['breathing'],
        focus_sessions_completed: 1,
        productive_hours: 4,
        ai_coach_interactions: 1,
        reflection_completed: true,
        gratitude_entries: [],
        created_at: `2024-01-${10 + i}T20:00:00Z`,
        updated_at: `2024-01-${10 + i}T20:00:00Z`,
      }));

      mockDailyCheckInRepository.getRecentCheckIns.mockResolvedValue(checkInsWithPattern);

      const patterns = await crisisDetector.getRiskPatterns(mockUserId);

      expect(patterns.length).toBeGreaterThan(0);
      const temporalPattern = patterns.find(p => p.patternType === 'temporal');
      expect(temporalPattern).toBeTruthy();
      expect(temporalPattern?.riskMultiplier).toBeGreaterThan(1.2);
    });

    it('should identify emotional risk patterns', async () => {
      mockUserRecoveryProfileRepository.findByUserId.mockResolvedValue({
        id: '1',
        user_id: mockUserId,
        current_stage: 'early',
        days_since_last_setback: 15,
        total_recovery_days: 25,
        recovery_start_date: '2024-01-01',
        personal_triggers: ['stress'],
        coping_strategies: ['breathing'],
        support_contacts: [],
        recovery_goals: [],
        privacy_settings: {
          share_progress_anonymously: false,
          allow_ai_analysis: true,
          data_retention_days: 365,
          emergency_contact_access: true,
        },
        ai_coaching_enabled: true,
        crisis_intervention_enabled: true,
        milestone_notifications_enabled: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      });

      // Mock check-ins with low mood pattern
      const lowMoodCheckIns = Array.from({ length: 4 }, (_, i) => ({
        id: `${i + 1}`,
        user_id: mockUserId,
        date: `2024-01-${10 + i}`,
        mood_rating: 3, // Consistently low mood
        energy_level: 4,
        stress_level: 7,
        sleep_quality: 5,
        trigger_events: [],
        coping_strategies_used: [],
        focus_sessions_completed: 0,
        productive_hours: 2,
        ai_coach_interactions: 0,
        reflection_completed: false,
        gratitude_entries: [],
        created_at: `2024-01-${10 + i}T10:00:00Z`,
        updated_at: `2024-01-${10 + i}T10:00:00Z`,
      }));

      mockDailyCheckInRepository.getRecentCheckIns.mockResolvedValue(lowMoodCheckIns);

      const patterns = await crisisDetector.getRiskPatterns(mockUserId);

      const emotionalPattern = patterns.find(p => 
        p.patternType === 'emotional' && p.pattern.includes('Low mood')
      );
      expect(emotionalPattern).toBeTruthy();
      expect(emotionalPattern?.riskMultiplier).toBeGreaterThan(1.2);
    });

    it('should return empty array on error', async () => {
      mockUserRecoveryProfileRepository.findByUserId.mockRejectedValue(new Error('Database error'));

      const patterns = await crisisDetector.getRiskPatterns(mockUserId);

      expect(patterns).toEqual([]);
    });
  });
});