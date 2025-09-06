/**
 * Crisis Intervention System Tests
 * Tests for crisis intervention delivery and emergency response
 */
import { crisisInterventionSystem } from '../../../../src/services/ai/crisis/CrisisInterventionSystem';
import { crisisDetector } from '../../../../src/services/ai/crisis/CrisisDetector';
import { recoveryCoachManager } from '../../../../src/services/ai/recovery/RecoveryCoachManager';
import { personalizationEngine } from '../../../../src/services/ai/recovery/PersonalizationEngine';
import { aiIntegrationService } from '../../../../src/services/ai/AIIntegrationService';
import { dataAnonymizationService } from '../../../../src/services/ai/DataAnonymizationService';
import { userRecoveryProfileRepository } from '../../../../src/services/ai/repositories/UserRecoveryProfileRepository';

// Mock dependencies
jest.mock('../../../../src/services/ai/crisis/CrisisDetector');
jest.mock('../../../../src/services/ai/recovery/RecoveryCoachManager');
jest.mock('../../../../src/services/ai/recovery/PersonalizationEngine');
jest.mock('../../../../src/services/ai/AIIntegrationService');
jest.mock('../../../../src/services/ai/DataAnonymizationService');
jest.mock('../../../../src/services/ai/repositories/UserRecoveryProfileRepository');

const mockCrisisDetector = crisisDetector as jest.Mocked<typeof crisisDetector>;
const mockRecoveryCoachManager = recoveryCoachManager as jest.Mocked<typeof recoveryCoachManager>;
const mockPersonalizationEngine = personalizationEngine as jest.Mocked<typeof personalizationEngine>;
const mockAIIntegrationService = aiIntegrationService as jest.Mocked<typeof aiIntegrationService>;
const mockDataAnonymizationService = dataAnonymizationService as jest.Mocked<typeof dataAnonymizationService>;
const mockUserRecoveryProfileRepository = userRecoveryProfileRepository as jest.Mocked<typeof userRecoveryProfileRepository>;

describe('CrisisInterventionSystem', () => {
  const mockUserId = 'test-user-123';
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('provideCrisisIntervention', () => {
    it('should provide immediate intervention for critical crisis', async () => {
      // Mock critical risk assessment
      mockCrisisDetector.assessCrisisRisk.mockResolvedValue({
        overallRiskLevel: 'critical',
        riskScore: 90,
        indicators: [
          {
            type: 'emotional',
            severity: 'critical',
            confidence: 0.95,
            description: 'Severe emotional distress with suicidal ideation',
            triggerFactors: ['depression', 'hopelessness', 'isolation'],
            detectedAt: new Date().toISOString(),
            requiresImmediate: true,
          },
        ],
        triggerTypes: ['depression'],
        interventionRecommended: true,
        escalationRequired: true,
        timeToIntervention: 'immediate',
        contextualFactors: ['severe_distress', 'isolation', 'hopelessness'],
      });

      // Mock user profile
      mockUserRecoveryProfileRepository.findByUserId.mockResolvedValue({
        id: '1',
        user_id: mockUserId,
        current_stage: 'challenge',
        days_since_last_setback: 1,
        total_recovery_days: 5,
        recovery_start_date: '2024-01-01',
        personal_triggers: ['depression', 'loneliness'],
        coping_strategies: ['breathing', 'grounding'],
        support_contacts: ['friend: 555-0123'],
        recovery_goals: ['stay safe', 'reach out for help'],
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

      // Mock AI services
      mockDataAnonymizationService.createSafePrompt.mockResolvedValue({
        prompt: 'Safe crisis intervention prompt',
        contextMarkers: ['crisis', 'depression'],
        privacyLevel: 'high',
      });

      mockAIIntegrationService.generateResponse.mockResolvedValue({
        content: 'You are not alone in this moment. This intense pain you\'re feeling is temporary, even though it doesn\'t feel that way right now. Please reach out for support.',
        source: 'ai',
        confidence: 0.9,
        cached: false,
        processingTimeMs: 800,
      });

      mockPersonalizationEngine.personalizeContent.mockResolvedValue({
        content: 'You are not alone in this moment. This intense pain you\'re feeling is temporary, even though it doesn\'t feel that way right now. Please reach out for support - there are people who care about you.',
        tone: 'gentle',
        personalizationFactors: ['gentle_tone', 'crisis_specific', 'user_history'],
        confidenceScore: 0.9,
        adaptationReasons: ['Crisis-specific gentle tone', 'Referenced user support network'],
      });

      // Mock coping strategies
      mockRecoveryCoachManager.provideCopingStrategies.mockResolvedValue([
        {
          name: 'Crisis Breathing',
          description: 'Immediate breathing technique for crisis moments',
          category: 'immediate',
          difficulty: 'easy',
          timeRequired: '2-3 minutes',
          effectiveness: 0.9,
          triggerTypes: ['depression'],
          instructions: ['Breathe in for 4', 'Hold for 4', 'Breathe out for 6', 'Repeat'],
        },
      ]);

      const intervention = await crisisInterventionSystem.provideCrisisIntervention(
        mockUserId,
        'depression',
        'critical'
      );

      expect(intervention).toBeTruthy();
      expect(intervention.severity).toBe('critical');
      expect(intervention.interventionType).toBe('immediate');
      expect(intervention.triggerType).toBe('depression');
      expect(intervention.followUpRequired).toBe(true);
      expect(intervention.followUpScheduled).toBeTruthy();
      
      // Should include safety plan for critical situations
      expect(intervention.content.safetyPlan).toBeTruthy();
      expect(intervention.content.safetyPlan?.professionalContacts).toContain('Crisis Hotline: 988');
      
      // Should include emergency resources
      expect(intervention.emergencyResources.length).toBeGreaterThan(0);
      expect(intervention.emergencyResources.some(r => r.immediate)).toBe(true);
      
      // Should include personalized content
      expect(intervention.content.personalizedElements).toContain('crisis_specific');
    });

    it('should provide supportive intervention for high risk', async () => {
      mockCrisisDetector.assessCrisisRisk.mockResolvedValue({
        overallRiskLevel: 'high',
        riskScore: 70,
        indicators: [
          {
            type: 'emotional',
            severity: 'high',
            confidence: 0.8,
            description: 'High stress and anxiety levels',
            triggerFactors: ['stress', 'anxiety', 'overwhelm'],
            detectedAt: new Date().toISOString(),
            requiresImmediate: false,
          },
        ],
        triggerTypes: ['stress'],
        interventionRecommended: true,
        escalationRequired: false,
        timeToIntervention: 'within_hour',
        contextualFactors: ['high_stress', 'overwhelm'],
      });

      mockUserRecoveryProfileRepository.findByUserId.mockResolvedValue({
        id: '1',
        user_id: mockUserId,
        current_stage: 'early',
        days_since_last_setback: 10,
        total_recovery_days: 20,
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

      mockDataAnonymizationService.createSafePrompt.mockResolvedValue({
        prompt: 'Safe supportive intervention prompt',
        contextMarkers: ['stress', 'high_risk'],
        privacyLevel: 'medium',
      });

      mockAIIntegrationService.generateResponse.mockResolvedValue({
        content: 'I can see you\'re dealing with a lot of stress right now. Let\'s work together to find some relief and get you back to feeling more balanced.',
        source: 'ai',
        confidence: 0.85,
        cached: false,
        processingTimeMs: 1000,
      });

      mockPersonalizationEngine.personalizeContent.mockResolvedValue({
        content: 'I can see you\'re dealing with a lot of stress right now. Let\'s work together to find some relief and get you back to feeling more balanced. You\'ve handled stress well before.',
        tone: 'supportive',
        personalizationFactors: ['supportive_tone', 'user_history'],
        confidenceScore: 0.85,
        adaptationReasons: ['Supportive tone for high stress', 'Referenced past success'],
      });

      mockRecoveryCoachManager.provideCopingStrategies.mockResolvedValue([
        {
          name: 'Progressive Muscle Relaxation',
          description: 'Systematic tension and release to reduce stress',
          category: 'short_term',
          difficulty: 'medium',
          timeRequired: '10-15 minutes',
          effectiveness: 0.8,
          triggerTypes: ['stress'],
          instructions: ['Start with shoulders', 'Tense for 5 seconds', 'Release and breathe'],
        },
      ]);

      const intervention = await crisisInterventionSystem.provideCrisisIntervention(
        mockUserId,
        'stress',
        'high'
      );

      expect(intervention.severity).toBe('high');
      expect(intervention.interventionType).toBe('supportive');
      expect(intervention.followUpRequired).toBe(true);
      expect(intervention.content.safetyPlan).toBeUndefined(); // No safety plan for non-critical
      expect(intervention.emergencyResources.length).toBeGreaterThan(0);
    });

    it('should provide preventive intervention for medium risk', async () => {
      mockCrisisDetector.assessCrisisRisk.mockResolvedValue({
        overallRiskLevel: 'medium',
        riskScore: 50,
        indicators: [
          {
            type: 'behavioral',
            severity: 'medium',
            confidence: 0.7,
            description: 'Decreased engagement and coping strategy use',
            triggerFactors: ['disengagement', 'avoidance'],
            detectedAt: new Date().toISOString(),
            requiresImmediate: false,
          },
        ],
        triggerTypes: ['boredom'],
        interventionRecommended: true,
        escalationRequired: false,
        timeToIntervention: 'within_day',
        contextualFactors: ['disengagement'],
      });

      mockUserRecoveryProfileRepository.findByUserId.mockResolvedValue({
        id: '1',
        user_id: mockUserId,
        current_stage: 'maintenance',
        days_since_last_setback: 35,
        total_recovery_days: 70,
        recovery_start_date: '2024-01-01',
        personal_triggers: ['boredom'],
        coping_strategies: ['creative_activities', 'social_connection'],
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

      mockDataAnonymizationService.createSafePrompt.mockResolvedValue({
        prompt: 'Safe preventive intervention prompt',
        contextMarkers: ['boredom', 'prevention'],
        privacyLevel: 'low',
      });

      mockAIIntegrationService.generateResponse.mockResolvedValue({
        content: 'I notice you might be feeling a bit disconnected lately. Let\'s explore some engaging activities that can help you feel more energized and connected.',
        source: 'ai',
        confidence: 0.8,
        cached: false,
        processingTimeMs: 900,
      });

      mockPersonalizationEngine.personalizeContent.mockResolvedValue({
        content: 'I notice you might be feeling a bit disconnected lately. Let\'s explore some engaging activities that can help you feel more energized and connected. Creative activities have worked well for you before.',
        tone: 'encouraging',
        personalizationFactors: ['encouraging_tone', 'personalized_coping'],
        confidenceScore: 0.8,
        adaptationReasons: ['Encouraging tone for prevention', 'Referenced effective strategies'],
      });

      mockRecoveryCoachManager.provideCopingStrategies.mockResolvedValue([
        {
          name: 'Creative Engagement',
          description: 'Engage in creative activities to combat boredom',
          category: 'short_term',
          difficulty: 'easy',
          timeRequired: '15-30 minutes',
          effectiveness: 0.7,
          triggerTypes: ['boredom'],
          instructions: ['Choose a creative activity', 'Set a small goal', 'Focus on process'],
        },
      ]);

      const intervention = await crisisInterventionSystem.provideCrisisIntervention(
        mockUserId,
        'boredom',
        'medium'
      );

      expect(intervention.severity).toBe('medium');
      expect(intervention.interventionType).toBe('preventive');
      expect(intervention.followUpRequired).toBe(false);
      expect(intervention.content.safetyPlan).toBeUndefined();
    });

    it('should return emergency fallback on error', async () => {
      mockCrisisDetector.assessCrisisRisk.mockRejectedValue(new Error('Assessment failed'));

      const intervention = await crisisInterventionSystem.provideCrisisIntervention(
        mockUserId,
        'stress'
      );

      expect(intervention).toBeTruthy();
      expect(intervention.severity).toBe('high');
      expect(intervention.interventionType).toBe('immediate');
      expect(intervention.content.personalizedElements).toContain('emergency_fallback');
      expect(intervention.emergencyResources.length).toBeGreaterThan(0);
      expect(intervention.followUpRequired).toBe(true);
    });
  });

  describe('checkForCrisisIntervention', () => {
    it('should provide intervention when crisis detected', async () => {
      mockCrisisDetector.detectImmediateCrisis.mockResolvedValue(true);
      
      // Mock the provideCrisisIntervention method
      const mockIntervention = {
        interventionId: 'crisis_123',
        userId: mockUserId,
        triggerType: 'stress' as const,
        severity: 'high' as const,
        interventionType: 'immediate' as const,
        content: {
          primaryMessage: 'Crisis intervention message',
          copingStrategies: [],
          affirmations: [],
          personalizedElements: [],
        },
        emergencyResources: [],
        followUpRequired: true,
        createdAt: new Date().toISOString(),
      };

      jest.spyOn(crisisInterventionSystem, 'provideCrisisIntervention').mockResolvedValue(mockIntervention);

      const result = await crisisInterventionSystem.checkForCrisisIntervention(mockUserId);

      expect(result).toEqual(mockIntervention);
      expect(mockCrisisDetector.detectImmediateCrisis).toHaveBeenCalledWith(mockUserId);
    });

    it('should return null when no crisis detected', async () => {
      mockCrisisDetector.detectImmediateCrisis.mockResolvedValue(false);

      const result = await crisisInterventionSystem.checkForCrisisIntervention(mockUserId);

      expect(result).toBeNull();
    });

    it('should provide intervention on error (err on side of caution)', async () => {
      mockCrisisDetector.detectImmediateCrisis.mockRejectedValue(new Error('Detection failed'));
      
      const mockIntervention = {
        interventionId: 'crisis_123',
        userId: mockUserId,
        triggerType: 'stress' as const,
        severity: 'high' as const,
        interventionType: 'immediate' as const,
        content: {
          primaryMessage: 'Crisis intervention message',
          copingStrategies: [],
          affirmations: [],
          personalizedElements: [],
        },
        emergencyResources: [],
        followUpRequired: true,
        createdAt: new Date().toISOString(),
      };

      jest.spyOn(crisisInterventionSystem, 'provideCrisisIntervention').mockResolvedValue(mockIntervention);

      const result = await crisisInterventionSystem.checkForCrisisIntervention(mockUserId);

      expect(result).toEqual(mockIntervention);
    });
  });

  describe('provideCrisisFollowUp', () => {
    it('should create follow-up record', async () => {
      const interventionId = 'crisis_123';

      const followUp = await crisisInterventionSystem.provideCrisisFollowUp(interventionId);

      expect(followUp).toBeTruthy();
      expect(followUp.interventionId).toBe(interventionId);
      expect(followUp.scheduledAt).toBeTruthy();
      expect(followUp.escalationNeeded).toBe(false);
    });

    it('should handle follow-up errors', async () => {
      const interventionId = 'invalid_id';

      await expect(crisisInterventionSystem.provideCrisisFollowUp(interventionId))
        .rejects.toThrow();
    });
  });

  describe('emergency resources', () => {
    it('should include appropriate emergency resources for critical situations', async () => {
      mockCrisisDetector.assessCrisisRisk.mockResolvedValue({
        overallRiskLevel: 'critical',
        riskScore: 95,
        indicators: [],
        triggerTypes: ['depression'],
        interventionRecommended: true,
        escalationRequired: true,
        timeToIntervention: 'immediate',
        contextualFactors: [],
      });

      mockUserRecoveryProfileRepository.findByUserId.mockResolvedValue({
        id: '1',
        user_id: mockUserId,
        current_stage: 'challenge',
        days_since_last_setback: 1,
        total_recovery_days: 5,
        recovery_start_date: '2024-01-01',
        personal_triggers: ['depression'],
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

      // Mock other services to avoid errors
      mockDataAnonymizationService.createSafePrompt.mockResolvedValue({
        prompt: 'Safe prompt',
        contextMarkers: [],
        privacyLevel: 'high',
      });

      mockAIIntegrationService.generateResponse.mockResolvedValue({
        content: 'Crisis message',
        source: 'ai',
        confidence: 0.9,
        cached: false,
        processingTimeMs: 800,
      });

      mockPersonalizationEngine.personalizeContent.mockResolvedValue({
        content: 'Personalized crisis message',
        tone: 'gentle',
        personalizationFactors: [],
        confidenceScore: 0.9,
        adaptationReasons: [],
      });

      mockRecoveryCoachManager.provideCopingStrategies.mockResolvedValue([]);

      const intervention = await crisisInterventionSystem.provideCrisisIntervention(
        mockUserId,
        'depression',
        'critical'
      );

      expect(intervention.emergencyResources.length).toBeGreaterThan(0);
      
      // Should include suicide prevention resources
      const suicidePreventionResource = intervention.emergencyResources.find(r =>
        r.specialization?.includes('suicide_prevention')
      );
      expect(suicidePreventionResource).toBeTruthy();
      expect(suicidePreventionResource?.contact).toBe('988');
      
      // Should include immediate resources
      const immediateResources = intervention.emergencyResources.filter(r => r.immediate);
      expect(immediateResources.length).toBeGreaterThan(0);
    });
  });

  describe('breathing exercises and grounding techniques', () => {
    it('should select appropriate breathing exercise for anxiety', async () => {
      mockCrisisDetector.assessCrisisRisk.mockResolvedValue({
        overallRiskLevel: 'high',
        riskScore: 70,
        indicators: [],
        triggerTypes: ['anxiety'],
        interventionRecommended: true,
        escalationRequired: false,
        timeToIntervention: 'within_hour',
        contextualFactors: [],
      });

      mockUserRecoveryProfileRepository.findByUserId.mockResolvedValue({
        id: '1',
        user_id: mockUserId,
        current_stage: 'early',
        days_since_last_setback: 10,
        total_recovery_days: 20,
        recovery_start_date: '2024-01-01',
        personal_triggers: ['anxiety'],
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

      // Mock services
      mockDataAnonymizationService.createSafePrompt.mockResolvedValue({
        prompt: 'Safe prompt',
        contextMarkers: [],
        privacyLevel: 'medium',
      });

      mockAIIntegrationService.generateResponse.mockResolvedValue({
        content: 'Anxiety support message',
        source: 'ai',
        confidence: 0.85,
        cached: false,
        processingTimeMs: 900,
      });

      mockPersonalizationEngine.personalizeContent.mockResolvedValue({
        content: 'Personalized anxiety support',
        tone: 'gentle',
        personalizationFactors: [],
        confidenceScore: 0.85,
        adaptationReasons: [],
      });

      mockRecoveryCoachManager.provideCopingStrategies.mockResolvedValue([]);

      const intervention = await crisisInterventionSystem.provideCrisisIntervention(
        mockUserId,
        'anxiety',
        'high'
      );

      expect(intervention.content.breathingExercise).toBeTruthy();
      expect(intervention.content.breathingExercise?.name).toContain('4-7-8');
      
      expect(intervention.content.groundingTechnique).toBeTruthy();
      expect(intervention.content.groundingTechnique?.name).toContain('5-4-3-2-1');
    });
  });
});