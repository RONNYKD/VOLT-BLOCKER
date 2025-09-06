/**
 * Recovery Coach Manager Tests
 * Tests for the enhanced recovery coach with stage tracking and personalization
 */
import { recoveryCoachManager } from '../../../../src/services/ai/recovery/RecoveryCoachManager';
import { recoveryStageTracker } from '../../../../src/services/ai/recovery/RecoveryStageTracker';
import { personalizationEngine } from '../../../../src/services/ai/recovery/PersonalizationEngine';
import { aiIntegrationService } from '../../../../src/services/ai/AIIntegrationService';
import { dataAnonymizationService } from '../../../../src/services/ai/DataAnonymizationService';
import { userRecoveryProfileRepository } from '../../../../src/services/ai/repositories/UserRecoveryProfileRepository';
import { dailyCheckInRepository } from '../../../../src/services/ai/repositories/DailyCheckInRepository';

// Mock dependencies
jest.mock('../../../../src/services/ai/recovery/RecoveryStageTracker');
jest.mock('../../../../src/services/ai/recovery/PersonalizationEngine');
jest.mock('../../../../src/services/ai/AIIntegrationService');
jest.mock('../../../../src/services/ai/DataAnonymizationService');
jest.mock('../../../../src/services/ai/repositories/UserRecoveryProfileRepository');
jest.mock('../../../../src/services/ai/repositories/DailyCheckInRepository');

const mockRecoveryStageTracker = recoveryStageTracker as jest.Mocked<typeof recoveryStageTracker>;
const mockPersonalizationEngine = personalizationEngine as jest.Mocked<typeof personalizationEngine>;
const mockAIIntegrationService = aiIntegrationService as jest.Mocked<typeof aiIntegrationService>;
const mockDataAnonymizationService = dataAnonymizationService as jest.Mocked<typeof dataAnonymizationService>;
const mockUserRecoveryProfileRepository = userRecoveryProfileRepository as jest.Mocked<typeof userRecoveryProfileRepository>;
const mockDailyCheckInRepository = dailyCheckInRepository as jest.Mocked<typeof dailyCheckInRepository>;

describe('RecoveryCoachManager', () => {
  const mockUserId = 'test-user-123';
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateDailyMotivation', () => {
    it('should generate personalized daily motivation', async () => {
      // Mock stage evaluation (no transition)
      mockRecoveryStageTracker.evaluateStageProgression.mockResolvedValue(null);

      // Mock user profile
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

      // Mock check-ins
      mockDailyCheckInRepository.getRecentCheckIns.mockResolvedValue([]);
      mockDailyCheckInRepository.getAverageRatings.mockResolvedValue({
        mood: 6,
        stress: 5,
        energy: 6,
        sleep: 6,
      });
      mockDailyCheckInRepository.getCheckInStreak.mockResolvedValue(5);

      // Mock data anonymization
      mockDataAnonymizationService.createSafePrompt.mockResolvedValue({
        prompt: 'Safe anonymized prompt',
        contextMarkers: ['recovery_stage'],
        privacyLevel: 'medium',
      });

      // Mock AI response
      mockAIIntegrationService.generateResponse.mockResolvedValue({
        content: 'You are making great progress in your recovery journey. Keep building those healthy habits!',
        source: 'ai',
        confidence: 0.9,
        cached: false,
        processingTimeMs: 1200,
      });

      // Mock personalization
      mockPersonalizationEngine.personalizeContent.mockResolvedValue({
        content: 'You are making amazing progress in your recovery journey. Keep building those healthy habits! Your consistency is building real, lasting change.',
        tone: 'encouraging',
        personalizationFactors: ['encouraging_tone', 'consistency'],
        confidenceScore: 0.85,
        adaptationReasons: ['User responds well to encouraging messages', 'Incorporated consistency motivational theme'],
      });

      // Mock logging
      mockDailyCheckInRepository.incrementAIInteractions.mockResolvedValue();

      const result = await recoveryCoachManager.generateDailyMotivation(mockUserId);

      expect(result).toBeTruthy();
      expect(result.content).toContain('amazing progress');
      expect(result.content).toContain('lasting change');
      expect(result.tone).toBe('encouraging');
      expect(result.source).toBe('ai');
      expect(result.personalizedElements).toContain('encouraging_tone');
      expect(result.personalizedElements).toContain('consistency');

      // Verify stage evaluation was called
      expect(mockRecoveryStageTracker.evaluateStageProgression).toHaveBeenCalledWith(mockUserId);
      
      // Verify personalization was applied
      expect(mockPersonalizationEngine.personalizeContent).toHaveBeenCalledWith(
        mockUserId,
        expect.any(String),
        'daily_motivation',
        expect.any(Object)
      );
    });

    it('should handle stage transition during motivation generation', async () => {
      // Mock stage transition
      mockRecoveryStageTracker.evaluateStageProgression.mockResolvedValue({
        fromStage: 'early',
        toStage: 'maintenance',
        transitionDate: '2024-01-15T10:00:00Z',
        triggerEvent: 'progress',
        daysSinceLastTransition: 23,
        confidence: 0.8,
        supportingFactors: ['30 days since setback', 'Improved mood ratings'],
      });

      // Mock updated profile after transition
      mockUserRecoveryProfileRepository.findByUserId.mockResolvedValue({
        id: '1',
        user_id: mockUserId,
        current_stage: 'maintenance', // Updated stage
        days_since_last_setback: 35,
        total_recovery_days: 65,
        recovery_start_date: '2024-01-01',
        personal_triggers: ['stress'],
        coping_strategies: ['breathing', 'meditation'],
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
        updated_at: '2024-01-15T10:00:00Z',
      });

      mockDailyCheckInRepository.getRecentCheckIns.mockResolvedValue([]);
      mockDailyCheckInRepository.getAverageRatings.mockResolvedValue({
        mood: 7,
        stress: 4,
        energy: 7,
        sleep: 7,
      });
      mockDailyCheckInRepository.getCheckInStreak.mockResolvedValue(10);

      mockDataAnonymizationService.createSafePrompt.mockResolvedValue({
        prompt: 'Safe prompt for maintenance stage',
        contextMarkers: ['recovery_stage'],
        privacyLevel: 'medium',
      });

      mockAIIntegrationService.generateResponse.mockResolvedValue({
        content: 'Congratulations on reaching the maintenance stage! Your consistency is paying off.',
        source: 'ai',
        confidence: 0.9,
        cached: false,
        processingTimeMs: 1100,
      });

      mockPersonalizationEngine.personalizeContent.mockResolvedValue({
        content: 'Congratulations on reaching the maintenance stage! Your incredible consistency is paying off beautifully.',
        tone: 'celebratory',
        personalizationFactors: ['celebratory_tone', 'stage_maintenance'],
        confidenceScore: 0.9,
        adaptationReasons: ['Celebrating stage transition', 'Maintenance stage context'],
      });

      mockDailyCheckInRepository.incrementAIInteractions.mockResolvedValue();

      const result = await recoveryCoachManager.generateDailyMotivation(mockUserId);

      expect(result.content).toContain('Congratulations');
      expect(result.content).toContain('maintenance stage');
      expect(result.tone).toBe('celebratory');
      expect(result.personalizedElements).toContain('celebratory_tone');
      expect(result.personalizedElements).toContain('stage_maintenance');
    });

    it('should return fallback motivation on error', async () => {
      mockRecoveryStageTracker.evaluateStageProgression.mockRejectedValue(new Error('Stage evaluation failed'));

      const result = await recoveryCoachManager.generateDailyMotivation(mockUserId);

      expect(result).toBeTruthy();
      expect(result.source).toBe('fallback');
      expect(result.content).toBeTruthy();
      expect(result.tone).toBe('supportive');
    });
  });

  describe('provideCopingStrategies', () => {
    it('should provide personalized coping strategies', async () => {
      // Mock user context
      mockUserRecoveryProfileRepository.findByUserId.mockResolvedValue({
        id: '1',
        user_id: mockUserId,
        current_stage: 'maintenance',
        days_since_last_setback: 45,
        total_recovery_days: 90,
        recovery_start_date: '2024-01-01',
        personal_triggers: ['stress'],
        coping_strategies: ['deep breathing', 'progressive muscle relaxation'],
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
        stress: 7, // Elevated stress
        energy: 5,
        sleep: 6,
      });
      mockDailyCheckInRepository.getCheckInStreak.mockResolvedValue(8);

      mockDataAnonymizationService.createSafePrompt.mockResolvedValue({
        prompt: 'Safe prompt for coping strategies',
        contextMarkers: ['trigger_type'],
        privacyLevel: 'medium',
      });

      mockAIIntegrationService.generateResponse.mockResolvedValue({
        content: `1. Deep Breathing Exercise: Take slow, controlled breaths to activate your parasympathetic nervous system.
2. Progressive Muscle Relaxation: Systematically tense and release muscle groups to reduce physical tension.
3. Mindful Grounding: Use the 5-4-3-2-1 technique to anchor yourself in the present moment.`,
        source: 'ai',
        confidence: 0.85,
        cached: false,
        processingTimeMs: 1300,
      });

      // Mock personalization for each strategy
      mockPersonalizationEngine.personalizeContent
        .mockResolvedValueOnce({
          content: 'Deep Breathing Exercise: Take slow, controlled breaths to activate your parasympathetic nervous system. Remember how well deep breathing has worked for you before.',
          tone: 'supportive',
          personalizationFactors: ['personalized_coping'],
          confidenceScore: 0.8,
          adaptationReasons: ['Referenced user\'s previously effective coping strategies'],
        })
        .mockResolvedValueOnce({
          content: 'Progressive Muscle Relaxation: Systematically tense and release muscle groups to reduce physical tension. This technique has been particularly effective for you in the past.',
          tone: 'supportive',
          personalizationFactors: ['personalized_coping'],
          confidenceScore: 0.8,
          adaptationReasons: ['Referenced user\'s previously effective coping strategies'],
        })
        .mockResolvedValueOnce({
          content: 'Mindful Grounding: Use the 5-4-3-2-1 technique to anchor yourself in the present moment.',
          tone: 'supportive',
          personalizationFactors: [],
          confidenceScore: 0.7,
          adaptationReasons: [],
        });

      mockDailyCheckInRepository.incrementAIInteractions.mockResolvedValue();

      const result = await recoveryCoachManager.provideCopingStrategies(mockUserId, 'stress', 'medium');

      expect(result).toBeTruthy();
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].name).toBe('Deep Breathing Exercise');
      expect(result[0].description).toContain('worked for you before');
      expect(result[1].description).toContain('effective for you in the past');
      expect(result[0].triggerTypes).toContain('stress');
    });

    it('should return fallback strategies on error', async () => {
      mockUserRecoveryProfileRepository.findByUserId.mockRejectedValue(new Error('Database error'));

      const result = await recoveryCoachManager.provideCopingStrategies(mockUserId, 'anxiety', 'high');

      expect(result).toBeTruthy();
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].triggerTypes).toContain('anxiety');
    });
  });

  describe('getDailyRecommendations', () => {
    it('should provide comprehensive daily recommendations', async () => {
      // Mock motivation generation
      const mockMotivation = {
        content: 'You are making excellent progress in your recovery journey!',
        tone: 'encouraging' as const,
        actionable: true,
        actionItems: ['Practice mindfulness for 10 minutes'],
        source: 'ai' as const,
        confidence: 0.9,
        personalizedElements: ['encouraging_tone'],
      };

      // Mock stage metrics
      const mockStageMetrics = {
        stage: 'maintenance' as const,
        daysInStage: 15,
        stageProgress: 0.6,
        nextStageRequirements: ['Reach 90 days since last setback'],
        riskFactors: [],
        strengthFactors: ['Strong mood ratings', 'Good stress management'],
        recommendedActions: ['Continue building long-term coping skills'],
      };

      // Mock the individual method calls
      jest.spyOn(recoveryCoachManager, 'generateDailyMotivation').mockResolvedValue(mockMotivation);
      jest.spyOn(recoveryCoachManager, 'getRecoveryStageMetrics').mockResolvedValue(mockStageMetrics);

      // Mock user context for recommendations
      mockUserRecoveryProfileRepository.findByUserId.mockResolvedValue({
        id: '1',
        user_id: mockUserId,
        current_stage: 'maintenance',
        days_since_last_setback: 45,
        total_recovery_days: 90,
        recovery_start_date: '2024-01-01',
        personal_triggers: ['stress'],
        coping_strategies: ['meditation'],
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
        mood: 7,
        stress: 4,
        energy: 7,
        sleep: 7,
      });
      mockDailyCheckInRepository.getCheckInStreak.mockResolvedValue(10);

      const result = await recoveryCoachManager.getDailyRecommendations(mockUserId);

      expect(result).toBeTruthy();
      expect(result.motivation).toEqual(mockMotivation);
      expect(result.stageMetrics).toEqual(mockStageMetrics);
      expect(result.recommendations).toBeTruthy();
      expect(result.recommendations.length).toBeGreaterThan(0);
      expect(result.recommendations).toContain('Continue building long-term coping skills');
    });
  });

  describe('learnFromUserFeedback', () => {
    it('should process user feedback correctly', async () => {
      mockPersonalizationEngine.learnFromFeedback.mockResolvedValue();

      const content = 'This motivation message was very helpful!';
      const feedback = 'very_helpful';
      const context = { tone: 'encouraging' };

      await expect(recoveryCoachManager.learnFromUserFeedback(
        mockUserId,
        'daily_motivation',
        content,
        feedback,
        context
      )).resolves.not.toThrow();

      expect(mockPersonalizationEngine.learnFromFeedback).toHaveBeenCalledWith(
        mockUserId,
        'daily_motivation',
        content,
        feedback,
        context
      );
    });

    it('should handle feedback errors gracefully', async () => {
      mockPersonalizationEngine.learnFromFeedback.mockRejectedValue(new Error('Feedback processing failed'));

      // Should not throw
      await expect(recoveryCoachManager.learnFromUserFeedback(
        mockUserId,
        'daily_motivation',
        'Test content',
        'helpful',
        {}
      )).resolves.not.toThrow();
    });
  });

  describe('updateRecoveryStage', () => {
    it('should use RecoveryStageTracker for stage updates', async () => {
      const mockTransition = {
        fromStage: 'early' as const,
        toStage: 'maintenance' as const,
        transitionDate: '2024-01-15T10:00:00Z',
        triggerEvent: 'progress' as const,
        daysSinceLastTransition: 23,
        confidence: 0.8,
        supportingFactors: ['30 days since setback'],
      };

      mockRecoveryStageTracker.evaluateStageProgression.mockResolvedValue(mockTransition);

      const result = await recoveryCoachManager.updateRecoveryStage(mockUserId, {});

      expect(result).toBe('maintenance');
      expect(mockRecoveryStageTracker.evaluateStageProgression).toHaveBeenCalledWith(mockUserId);
    });

    it('should return current stage if no transition occurs', async () => {
      mockRecoveryStageTracker.evaluateStageProgression.mockResolvedValue(null);
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

      const result = await recoveryCoachManager.updateRecoveryStage(mockUserId, {});

      expect(result).toBe('early');
    });
  });
});