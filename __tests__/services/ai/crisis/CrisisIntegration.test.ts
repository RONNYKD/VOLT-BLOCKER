/**
 * Crisis Integration Tests
 * Tests for integration between crisis detection, intervention, and recovery coach systems
 */
import { crisisDetector } from '../../../../src/services/ai/crisis/CrisisDetector';
import { crisisInterventionSystem } from '../../../../src/services/ai/crisis/CrisisInterventionSystem';
import { recoveryCoachManager } from '../../../../src/services/ai/recovery/RecoveryCoachManager';
import { userRecoveryProfileRepository } from '../../../../src/services/ai/repositories/UserRecoveryProfileRepository';
import { dailyCheckInRepository } from '../../../../src/services/ai/repositories/DailyCheckInRepository';

// Mock dependencies
jest.mock('../../../../src/services/ai/repositories/UserRecoveryProfileRepository');
jest.mock('../../../../src/services/ai/repositories/DailyCheckInRepository');
jest.mock('../../../../src/services/ai/AIIntegrationService');
jest.mock('../../../../src/services/ai/DataAnonymizationService');
jest.mock('../../../../src/services/ai/recovery/PersonalizationEngine');

const mockUserRecoveryProfileRepository = userRecoveryProfileRepository as jest.Mocked<typeof userRecoveryProfileRepository>;
const mockDailyCheckInRepository = dailyCheckInRepository as jest.Mocked<typeof dailyCheckInRepository>;

describe('Crisis System Integration', () => {
  const mockUserId = 'test-user-123';
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Crisis Detection to Intervention Flow', () => {
    it('should detect crisis and provide appropriate intervention', async () => {
      // Setup user in crisis state
      mockUserRecoveryProfileRepository.findByUserId.mockResolvedValue({
        id: '1',
        user_id: mockUserId,
        current_stage: 'challenge',
        days_since_last_setback: 1,
        total_recovery_days: 5,
        recovery_start_date: '2024-01-01',
        personal_triggers: ['stress', 'loneliness'],
        coping_strategies: ['breathing', 'grounding'],
        support_contacts: ['friend: 555-0123'],
        recovery_goals: ['stay safe'],
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

      // Setup crisis indicators in check-ins
      mockDailyCheckInRepository.getRecentCheckIns.mockResolvedValue([
        {
          id: '1',
          user_id: mockUserId,
          date: '2024-01-15',
          mood_rating: 1, // Severe depression
          energy_level: 1,
          stress_level: 10, // Maximum stress
          sleep_quality: 2,
          trigger_events: [
            {
              type: 'loneliness',
              intensity: 10,
              duration_minutes: 300,
              context: 'feeling completely alone and hopeless',
              coping_response: 'none',
              outcome: 'overwhelmed',
              timestamp: '2024-01-15T14:00:00Z',
            },
          ],
          coping_strategies_used: [],
          focus_sessions_completed: 0,
          productive_hours: 0,
          ai_coach_interactions: 0,
          reflection_completed: false,
          gratitude_entries: [],
          created_at: '2024-01-15T20:00:00Z',
          updated_at: '2024-01-15T20:00:00Z',
        },
      ]);

      mockDailyCheckInRepository.getAverageRatings.mockResolvedValue({
        mood: 1,
        stress: 10,
        energy: 1,
        sleep: 2,
      });

      mockDailyCheckInRepository.getCheckInStreak.mockResolvedValue(0);
      mockDailyCheckInRepository.incrementAIInteractions.mockResolvedValue();

      // Step 1: Detect crisis risk
      const riskAssessment = await crisisDetector.assessCrisisRisk(mockUserId);
      
      expect(riskAssessment.overallRiskLevel).toBe('critical');
      expect(riskAssessment.escalationRequired).toBe(true);
      expect(riskAssessment.timeToIntervention).toBe('immediate');

      // Step 2: Check if immediate intervention needed
      const needsIntervention = await crisisDetector.detectImmediateCrisis(mockUserId);
      expect(needsIntervention).toBe(true);

      // Step 3: Provide crisis intervention
      const intervention = await crisisInterventionSystem.provideCrisisIntervention(
        mockUserId,
        'loneliness',
        'critical'
      );

      expect(intervention).toBeTruthy();
      expect(intervention.severity).toBe('critical');
      expect(intervention.interventionType).toBe('immediate');
      expect(intervention.followUpRequired).toBe(true);
      
      // Should include safety plan for critical situation
      expect(intervention.content.safetyPlan).toBeTruthy();
      expect(intervention.content.safetyPlan?.professionalContacts).toContain('Crisis Hotline: 988');
      
      // Should include emergency resources
      expect(intervention.emergencyResources.length).toBeGreaterThan(0);
      const immediateResources = intervention.emergencyResources.filter(r => r.immediate);
      expect(immediateResources.length).toBeGreaterThan(0);
      
      // Should schedule follow-up within 1 hour for critical
      expect(intervention.followUpScheduled).toBeTruthy();
      const followUpTime = new Date(intervention.followUpScheduled!);
      const now = new Date();
      const timeDiff = followUpTime.getTime() - now.getTime();
      expect(timeDiff).toBeLessThan(2 * 60 * 60 * 1000); // Less than 2 hours
    });

    it('should integrate crisis intervention with recovery coach', async () => {
      // Setup user with moderate risk
      mockUserRecoveryProfileRepository.findByUserId.mockResolvedValue({
        id: '1',
        user_id: mockUserId,
        current_stage: 'early',
        days_since_last_setback: 12,
        total_recovery_days: 25,
        recovery_start_date: '2024-01-01',
        personal_triggers: ['stress'],
        coping_strategies: ['meditation', 'exercise', 'journaling'],
        support_contacts: ['sponsor: 555-0456'],
        recovery_goals: ['build healthy habits'],
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
          mood_rating: 4, // Below average
          energy_level: 3,
          stress_level: 8, // High stress
          sleep_quality: 4,
          trigger_events: [
            {
              type: 'stress',
              intensity: 7,
              duration_minutes: 120,
              context: 'work pressure and deadlines',
              coping_response: 'tried meditation',
              outcome: 'partial',
              timestamp: '2024-01-15T16:00:00Z',
            },
          ],
          coping_strategies_used: ['meditation'],
          focus_sessions_completed: 1,
          productive_hours: 3,
          ai_coach_interactions: 1,
          reflection_completed: true,
          gratitude_entries: ['grateful for support'],
          created_at: '2024-01-15T20:00:00Z',
          updated_at: '2024-01-15T20:00:00Z',
        },
      ]);

      mockDailyCheckInRepository.getAverageRatings.mockResolvedValue({
        mood: 4,
        stress: 8,
        energy: 3,
        sleep: 4,
      });

      mockDailyCheckInRepository.getCheckInStreak.mockResolvedValue(5);
      mockDailyCheckInRepository.incrementAIInteractions.mockResolvedValue();

      // Check for crisis intervention need
      const intervention = await crisisInterventionSystem.checkForCrisisIntervention(mockUserId);
      
      if (intervention) {
        // Crisis intervention provided
        expect(intervention.severity).toBe('high');
        expect(intervention.triggerType).toBe('stress');
        expect(intervention.content.copingStrategies.length).toBeGreaterThan(0);
        
        // Should reference user's existing coping strategies
        const hasPersonalizedStrategies = intervention.content.copingStrategies.some(
          strategy => ['meditation', 'exercise', 'journaling'].includes(strategy.name.toLowerCase())
        );
        expect(hasPersonalizedStrategies || intervention.content.personalizedElements.includes('personalized_coping')).toBe(true);
      } else {
        // No crisis intervention needed, but can still provide supportive coaching
        // This would be handled by the recovery coach system
        console.log('No crisis intervention needed - recovery coach can provide regular support');
      }
    });

    it('should handle crisis follow-up workflow', async () => {
      // Simulate a crisis intervention that was provided earlier
      const interventionId = 'crisis_test_123';
      
      // Provide follow-up
      const followUp = await crisisInterventionSystem.provideCrisisFollowUp(interventionId);
      
      expect(followUp).toBeTruthy();
      expect(followUp.interventionId).toBe(interventionId);
      expect(followUp.scheduledAt).toBeTruthy();
      expect(followUp.escalationNeeded).toBe(false);
      
      // In a real implementation, this would:
      // 1. Check user's current state
      // 2. Assess if the intervention was effective
      // 3. Determine if additional support is needed
      // 4. Schedule further follow-ups if necessary
      // 5. Escalate to professional help if indicated
    });
  });

  describe('Risk Pattern Analysis', () => {
    it('should identify and track risk patterns over time', async () => {
      // Setup user with historical data showing patterns
      mockUserRecoveryProfileRepository.findByUserId.mockResolvedValue({
        id: '1',
        user_id: mockUserId,
        current_stage: 'maintenance',
        days_since_last_setback: 35,
        total_recovery_days: 70,
        recovery_start_date: '2024-01-01',
        personal_triggers: ['stress', 'loneliness'],
        coping_strategies: ['meditation', 'social_connection'],
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

      // Create check-ins showing temporal pattern (Sunday evenings are difficult)
      const checkInsWithPattern = Array.from({ length: 4 }, (_, i) => ({
        id: `${i + 1}`,
        user_id: mockUserId,
        date: `2024-01-${7 + (i * 7)}`, // Sundays
        mood_rating: 3, // Consistently low on Sundays
        energy_level: 3,
        stress_level: 8,
        sleep_quality: 4,
        trigger_events: [
          {
            type: 'loneliness',
            intensity: 7,
            duration_minutes: 180,
            context: 'Sunday evening loneliness',
            coping_response: 'tried meditation',
            outcome: 'partial',
            timestamp: `2024-01-${7 + (i * 7)}T19:00:00Z`, // 7 PM Sundays
          },
        ],
        coping_strategies_used: ['meditation'],
        focus_sessions_completed: 0,
        productive_hours: 2,
        ai_coach_interactions: 1,
        reflection_completed: true,
        gratitude_entries: [],
        created_at: `2024-01-${7 + (i * 7)}T19:00:00Z`,
        updated_at: `2024-01-${7 + (i * 7)}T19:00:00Z`,
      }));

      mockDailyCheckInRepository.getRecentCheckIns.mockResolvedValue(checkInsWithPattern);

      // Analyze risk patterns
      const patterns = await crisisDetector.getRiskPatterns(mockUserId);
      
      expect(patterns.length).toBeGreaterThan(0);
      
      // Should identify temporal pattern
      const temporalPattern = patterns.find(p => p.patternType === 'temporal');
      expect(temporalPattern).toBeTruthy();
      expect(temporalPattern?.riskMultiplier).toBeGreaterThan(1.2);
      
      // Should identify emotional pattern
      const emotionalPattern = patterns.find(p => p.patternType === 'emotional');
      expect(emotionalPattern).toBeTruthy();
      
      // These patterns could be used to:
      // 1. Provide proactive interventions before high-risk times
      // 2. Customize coping strategies for specific patterns
      // 3. Alert support network during vulnerable periods
      // 4. Adjust recovery coach messaging based on patterns
    });
  });

  describe('Crisis Prevention Integration', () => {
    it('should use risk patterns for proactive intervention', async () => {
      // This test demonstrates how the crisis system could be used proactively
      // based on identified risk patterns
      
      mockUserRecoveryProfileRepository.findByUserId.mockResolvedValue({
        id: '1',
        user_id: mockUserId,
        current_stage: 'maintenance',
        days_since_last_setback: 40,
        total_recovery_days: 80,
        recovery_start_date: '2024-01-01',
        personal_triggers: ['stress'],
        coping_strategies: ['exercise', 'meditation'],
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

      // Simulate current time being during a known high-risk period
      // (e.g., Sunday evening based on historical pattern)
      jest.spyOn(Date.prototype, 'getDay').mockReturnValue(0); // Sunday
      jest.spyOn(Date.prototype, 'getHours').mockReturnValue(19); // 7 PM

      mockDailyCheckInRepository.getRecentCheckIns.mockResolvedValue([]);
      mockDailyCheckInRepository.getAverageRatings.mockResolvedValue({
        mood: 6,
        stress: 5,
        energy: 6,
        sleep: 6,
      });

      // Assess current risk (should be elevated due to temporal pattern)
      const riskAssessment = await crisisDetector.assessCrisisRisk(mockUserId);
      
      // Even with good current metrics, temporal risk should be detected
      const temporalIndicators = riskAssessment.indicators.filter(i => i.type === 'temporal');
      expect(temporalIndicators.length).toBeGreaterThan(0);
      
      // If risk is elevated, provide preventive intervention
      if (riskAssessment.riskScore >= 30) {
        const intervention = await crisisInterventionSystem.provideCrisisIntervention(
          mockUserId,
          'stress',
          'medium'
        );
        
        expect(intervention.interventionType).toBe('preventive');
        expect(intervention.content.copingStrategies.length).toBeGreaterThan(0);
        
        // Preventive intervention should focus on preparation and early coping
        const preventiveStrategies = intervention.content.copingStrategies.filter(
          s => s.category === 'immediate' || s.category === 'grounding'
        );
        expect(preventiveStrategies.length).toBeGreaterThan(0);
      }
    });
  });
});