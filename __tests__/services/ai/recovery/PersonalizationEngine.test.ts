/**
 * Personalization Engine Tests
 * Tests for content personalization and learning algorithms
 */
import { personalizationEngine } from '../../../../src/services/ai/recovery/PersonalizationEngine';
import { userRecoveryProfileRepository } from '../../../../src/services/ai/repositories/UserRecoveryProfileRepository';
import { dailyCheckInRepository } from '../../../../src/services/ai/repositories/DailyCheckInRepository';

// Mock dependencies
jest.mock('../../../../src/services/ai/repositories/UserRecoveryProfileRepository');
jest.mock('../../../../src/services/ai/repositories/DailyCheckInRepository');

const mockUserRecoveryProfileRepository = userRecoveryProfileRepository as jest.Mocked<typeof userRecoveryProfileRepository>;
const mockDailyCheckInRepository = dailyCheckInRepository as jest.Mocked<typeof dailyCheckInRepository>;

describe('PersonalizationEngine', () => {
  const mockUserId = 'test-user-123';
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('personalizeContent', () => {
    it('should personalize content based on user profile', async () => {
      // Mock user profile
      mockUserRecoveryProfileRepository.findByUserId.mockResolvedValue({
        id: '1',
        user_id: mockUserId,
        current_stage: 'early',
        days_since_last_setback: 15,
        total_recovery_days: 25,
        recovery_start_date: '2024-01-01',
        personal_triggers: ['stress'],
        coping_strategies: ['deep breathing', 'meditation'],
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

      // Mock check-ins with good engagement
      mockDailyCheckInRepository.getRecentCheckIns.mockResolvedValue([
        {
          id: '1',
          user_id: mockUserId,
          date: '2024-01-15',
          mood_rating: 7,
          energy_level: 6,
          stress_level: 4,
          sleep_quality: 7,
          trigger_events: [],
          coping_strategies_used: ['deep breathing'],
          focus_sessions_completed: 2,
          productive_hours: 6,
          ai_coach_interactions: 1,
          reflection_completed: true,
          gratitude_entries: ['grateful for progress'],
          created_at: '2024-01-15T08:00:00Z',
          updated_at: '2024-01-15T08:00:00Z',
        },
      ]);

      mockDailyCheckInRepository.getAverageRatings.mockResolvedValue({
        mood: 7,
        stress: 4,
        energy: 6,
        sleep: 7,
      });

      const baseContent = 'You are making good progress in your recovery journey.';
      const context = { recoveryStage: 'early', recentMoodTrend: 'improving' };

      const result = await personalizationEngine.personalizeContent(
        mockUserId,
        baseContent,
        'daily_motivation',
        context
      );

      expect(result.content).toBeTruthy();
      expect(result.confidenceScore).toBeGreaterThan(0.5);
      expect(result.personalizationFactors.length).toBeGreaterThan(0);
      expect(result.adaptationReasons.length).toBeGreaterThan(0);
    });

    it('should adjust tone based on recovery stage', async () => {
      // Mock user in challenge stage
      mockUserRecoveryProfileRepository.findByUserId.mockResolvedValue({
        id: '1',
        user_id: mockUserId,
        current_stage: 'challenge',
        days_since_last_setback: 3,
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

      mockDailyCheckInRepository.getRecentCheckIns.mockResolvedValue([]);
      mockDailyCheckInRepository.getAverageRatings.mockResolvedValue({
        mood: 4,
        stress: 8,
        energy: 3,
        sleep: 4,
      });

      const baseContent = 'You need to try harder to overcome your challenges.';
      const context = { recoveryStage: 'challenge', recentMoodTrend: 'declining' };

      const result = await personalizationEngine.personalizeContent(
        mockUserId,
        baseContent,
        'daily_motivation',
        context
      );

      expect(result.tone).toBe('gentle');
      expect(result.personalizationFactors).toContain('gentle_tone');
      expect(result.content).not.toContain('need to');
      expect(result.content).toContain('might consider');
    });

    it('should incorporate personalized coping strategies', async () => {
      mockUserRecoveryProfileRepository.findByUserId.mockResolvedValue({
        id: '1',
        user_id: mockUserId,
        current_stage: 'maintenance',
        days_since_last_setback: 45,
        total_recovery_days: 90,
        recovery_start_date: '2024-01-01',
        personal_triggers: ['stress'],
        coping_strategies: ['progressive muscle relaxation', 'journaling'],
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

      const baseContent = 'Here are some coping strategies for stress.';
      const context = { triggerType: 'stress', urgency: 'high' };

      const result = await personalizationEngine.personalizeContent(
        mockUserId,
        baseContent,
        'crisis_intervention',
        context
      );

      expect(result.personalizationFactors).toContain('personalized_coping');
      expect(result.content).toMatch(/(progressive muscle relaxation|journaling)/);
    });

    it('should add time-contextual elements', async () => {
      // Mock morning check-in pattern
      const morningCheckIn = {
        id: '1',
        user_id: mockUserId,
        date: '2024-01-15',
        mood_rating: 6,
        energy_level: 6,
        stress_level: 5,
        sleep_quality: 6,
        trigger_events: [],
        coping_strategies_used: [],
        focus_sessions_completed: 1,
        productive_hours: 4,
        ai_coach_interactions: 1,
        reflection_completed: true,
        gratitude_entries: [],
        created_at: '2024-01-15T08:00:00Z', // Morning time
        updated_at: '2024-01-15T08:00:00Z',
      };

      mockUserRecoveryProfileRepository.findByUserId.mockResolvedValue({
        id: '1',
        user_id: mockUserId,
        current_stage: 'maintenance',
        days_since_last_setback: 45,
        total_recovery_days: 90,
        recovery_start_date: '2024-01-01',
        personal_triggers: [],
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

      mockDailyCheckInRepository.getRecentCheckIns.mockResolvedValue([morningCheckIn]);
      mockDailyCheckInRepository.getAverageRatings.mockResolvedValue({
        mood: 6,
        stress: 5,
        energy: 6,
        sleep: 6,
      });

      // Mock current time as morning
      jest.spyOn(Date.prototype, 'getHours').mockReturnValue(9);

      const baseContent = 'Have a great day!';
      const context = {};

      const result = await personalizationEngine.personalizeContent(
        mockUserId,
        baseContent,
        'daily_motivation',
        context
      );

      expect(result.personalizationFactors).toContain('time_context');
      expect(result.content).toContain('Good morning');
    });
  });

  describe('learnFromFeedback', () => {
    it('should process user feedback correctly', async () => {
      mockUserRecoveryProfileRepository.findByUserId.mockResolvedValue({
        id: '1',
        user_id: mockUserId,
        current_stage: 'early',
        days_since_last_setback: 15,
        total_recovery_days: 25,
        recovery_start_date: '2024-01-01',
        personal_triggers: [],
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

      mockDailyCheckInRepository.getRecentCheckIns.mockResolvedValue([]);
      mockDailyCheckInRepository.getAverageRatings.mockResolvedValue({
        mood: 6,
        stress: 5,
        energy: 6,
        sleep: 6,
      });

      const content = 'This is a very helpful and encouraging message!';
      const feedback = 'very_helpful';
      const context = { tone: 'encouraging' };

      // Should not throw
      await expect(personalizationEngine.learnFromFeedback(
        mockUserId,
        'daily_motivation',
        content,
        feedback,
        context
      )).resolves.not.toThrow();
    });
  });

  describe('getPersonalizationProfile', () => {
    it('should build personalization profile from user data', async () => {
      mockUserRecoveryProfileRepository.findByUserId.mockResolvedValue({
        id: '1',
        user_id: mockUserId,
        current_stage: 'growth',
        days_since_last_setback: 120,
        total_recovery_days: 200,
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

      // Mock high engagement check-ins
      const highEngagementCheckIns = Array.from({ length: 7 }, (_, i) => ({
        id: `${i + 1}`,
        user_id: mockUserId,
        date: `2024-01-${15 + i}`,
        mood_rating: 8,
        energy_level: 7,
        stress_level: 3,
        sleep_quality: 8,
        trigger_events: [],
        coping_strategies_used: ['meditation'],
        focus_sessions_completed: 3,
        productive_hours: 8,
        ai_coach_interactions: 2,
        reflection_completed: true,
        gratitude_entries: ['grateful for growth'],
        created_at: `2024-01-${15 + i}T10:00:00Z`,
        updated_at: `2024-01-${15 + i}T10:00:00Z`,
      }));

      mockDailyCheckInRepository.getRecentCheckIns.mockResolvedValue(highEngagementCheckIns);
      mockDailyCheckInRepository.getAverageRatings.mockResolvedValue({
        mood: 8,
        stress: 3,
        energy: 7,
        sleep: 8,
      });

      const profile = await personalizationEngine.getPersonalizationProfile(mockUserId);

      expect(profile.userId).toBe(mockUserId);
      expect(profile.preferredTone).toBe('celebratory'); // Growth stage with high mood
      expect(profile.preferredMessageLength).toBe('detailed'); // High engagement
      expect(profile.effectiveCopingStrategies).toContain('meditation');
      expect(profile.motivationalTriggers).toContain('progress_milestones');
      expect(profile.motivationalTriggers).toContain('personal_growth');
      expect(profile.engagementMetrics.responseRate).toBe(1.0); // All reflections completed
    });

    it('should return default profile on error', async () => {
      mockUserRecoveryProfileRepository.findByUserId.mockRejectedValue(new Error('Database error'));

      const profile = await personalizationEngine.getPersonalizationProfile(mockUserId);

      expect(profile.userId).toBe(mockUserId);
      expect(profile.preferredTone).toBe('supportive');
      expect(profile.preferredMessageLength).toBe('moderate');
      expect(profile.effectiveCopingStrategies).toEqual([]);
    });
  });

  describe('error handling', () => {
    it('should handle personalization errors gracefully', async () => {
      mockUserRecoveryProfileRepository.findByUserId.mockRejectedValue(new Error('Database error'));

      const result = await personalizationEngine.personalizeContent(
        mockUserId,
        'Test content',
        'daily_motivation',
        {}
      );

      expect(result.content).toBe('Test content');
      expect(result.confidenceScore).toBe(0.3);
      expect(result.adaptationReasons).toContain('Error in personalization - using base content');
    });

    it('should handle missing user profile in personalization', async () => {
      mockUserRecoveryProfileRepository.findByUserId.mockResolvedValue(null);

      const result = await personalizationEngine.personalizeContent(
        mockUserId,
        'Test content',
        'daily_motivation',
        {}
      );

      expect(result.content).toBe('Test content');
      expect(result.confidenceScore).toBe(0.3);
    });
  });
});