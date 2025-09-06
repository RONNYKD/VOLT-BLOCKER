/**
 * Recovery Stage Tracker Tests
 * Tests for recovery stage progression and metrics calculation
 */
import { recoveryStageTracker } from '../../../../src/services/ai/recovery/RecoveryStageTracker';
import { userRecoveryProfileRepository } from '../../../../src/services/ai/repositories/UserRecoveryProfileRepository';
import { dailyCheckInRepository } from '../../../../src/services/ai/repositories/DailyCheckInRepository';
import { milestoneRepository } from '../../../../src/services/ai/repositories/MilestoneRepository';

// Mock dependencies
jest.mock('../../../../src/services/ai/repositories/UserRecoveryProfileRepository');
jest.mock('../../../../src/services/ai/repositories/DailyCheckInRepository');
jest.mock('../../../../src/services/ai/repositories/MilestoneRepository');

const mockUserRecoveryProfileRepository = userRecoveryProfileRepository as jest.Mocked<typeof userRecoveryProfileRepository>;
const mockDailyCheckInRepository = dailyCheckInRepository as jest.Mocked<typeof dailyCheckInRepository>;
const mockMilestoneRepository = milestoneRepository as jest.Mocked<typeof milestoneRepository>;

describe('RecoveryStageTracker', () => {
  const mockUserId = 'test-user-123';
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('evaluateStageProgression', () => {
    it('should transition from challenge to early stage after 7 days', async () => {
      // Mock user profile in challenge stage with 8 days progress
      mockUserRecoveryProfileRepository.findByUserId.mockResolvedValue({
        id: '1',
        user_id: mockUserId,
        current_stage: 'challenge',
        days_since_last_setback: 8,
        total_recovery_days: 15,
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

      // Mock good progress indicators
      mockDailyCheckInRepository.getRecentCheckIns.mockResolvedValue([]);
      mockDailyCheckInRepository.getAverageRatings.mockResolvedValue({
        mood: 6,
        stress: 5,
        energy: 6,
        sleep: 6,
      });
      mockMilestoneRepository.getRecentMilestones.mockResolvedValue([]);
      mockUserRecoveryProfileRepository.updateStage.mockResolvedValue();

      const transition = await recoveryStageTracker.evaluateStageProgression(mockUserId);

      expect(transition).toBeTruthy();
      expect(transition?.fromStage).toBe('challenge');
      expect(transition?.toStage).toBe('early');
      expect(transition?.triggerEvent).toBe('progress');
      expect(mockUserRecoveryProfileRepository.updateStage).toHaveBeenCalledWith(mockUserId, 'early');
    });

    it('should not transition if conditions are not met', async () => {
      // Mock user profile in early stage with poor metrics
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

      // Mock poor progress indicators
      mockDailyCheckInRepository.getRecentCheckIns.mockResolvedValue([]);
      mockDailyCheckInRepository.getAverageRatings.mockResolvedValue({
        mood: 4,
        stress: 8,
        energy: 3,
        sleep: 4,
      });
      mockMilestoneRepository.getRecentMilestones.mockResolvedValue([]);

      const transition = await recoveryStageTracker.evaluateStageProgression(mockUserId);

      expect(transition).toBeNull();
      expect(mockUserRecoveryProfileRepository.updateStage).not.toHaveBeenCalled();
    });

    it('should transition back to challenge stage on setback', async () => {
      // Mock user profile in maintenance stage with recent setback
      mockUserRecoveryProfileRepository.findByUserId.mockResolvedValue({
        id: '1',
        user_id: mockUserId,
        current_stage: 'maintenance',
        days_since_last_setback: 3, // Recent setback
        total_recovery_days: 90,
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
          mood_rating: 3,
          energy_level: 2,
          stress_level: 9,
          sleep_quality: 3,
          trigger_events: [
            {
              type: 'stress',
              intensity: 9,
              duration_minutes: 120,
              context: 'work pressure',
              coping_response: 'none',
              outcome: 'overwhelmed',
              timestamp: '2024-01-15T10:00:00Z',
            },
          ],
          coping_strategies_used: [],
          focus_sessions_completed: 0,
          productive_hours: 2,
          ai_coach_interactions: 0,
          reflection_completed: false,
          gratitude_entries: [],
          created_at: '2024-01-15T20:00:00Z',
          updated_at: '2024-01-15T20:00:00Z',
        },
      ]);

      mockDailyCheckInRepository.getAverageRatings.mockResolvedValue({
        mood: 3,
        stress: 9,
        energy: 2,
        sleep: 3,
      });
      mockMilestoneRepository.getRecentMilestones.mockResolvedValue([]);
      mockUserRecoveryProfileRepository.updateStage.mockResolvedValue();

      const transition = await recoveryStageTracker.evaluateStageProgression(mockUserId);

      expect(transition).toBeTruthy();
      expect(transition?.fromStage).toBe('maintenance');
      expect(transition?.toStage).toBe('challenge');
      expect(transition?.triggerEvent).toBe('setback');
    });
  });

  describe('getStageMetrics', () => {
    it('should calculate stage metrics correctly', async () => {
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

      const metrics = await recoveryStageTracker.getStageMetrics(mockUserId);

      expect(metrics.stage).toBe('early');
      expect(metrics.daysInStage).toBe(8); // 15 - 7 (days to reach early stage)
      expect(metrics.stageProgress).toBeGreaterThan(0);
      expect(metrics.nextStageRequirements).toContain('Reach 30 days since last setback');
      expect(metrics.recommendedActions.length).toBeGreaterThan(0);
    });

    it('should identify risk factors correctly', async () => {
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
        mood: 3, // Low mood
        stress: 8, // High stress
        energy: 3,
        sleep: 4, // Poor sleep
      });

      const metrics = await recoveryStageTracker.getStageMetrics(mockUserId);

      expect(metrics.riskFactors).toContain('Low mood ratings');
      expect(metrics.riskFactors).toContain('High stress levels');
      expect(metrics.riskFactors).toContain('Poor sleep quality');
    });
  });

  describe('getRecoveryProgression', () => {
    it('should calculate recovery progression correctly', async () => {
      mockUserRecoveryProfileRepository.findByUserId.mockResolvedValue({
        id: '1',
        user_id: mockUserId,
        current_stage: 'maintenance',
        days_since_last_setback: 45,
        total_recovery_days: 120,
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

      mockDailyCheckInRepository.getAverageRatings.mockResolvedValue({
        mood: 7,
        stress: 4,
        energy: 7,
        sleep: 7,
      });

      const progression = await recoveryStageTracker.getRecoveryProgression(mockUserId);

      expect(progression.currentStage).toBe('maintenance');
      expect(progression.overallTrend).toBe('improving');
      expect(progression.projectedNextStage).toBe('growth');
      expect(progression.confidenceInProgression).toBeGreaterThan(0.5);
    });
  });

  describe('error handling', () => {
    it('should handle missing user profile gracefully', async () => {
      mockUserRecoveryProfileRepository.findByUserId.mockResolvedValue(null);

      await expect(recoveryStageTracker.evaluateStageProgression(mockUserId))
        .rejects.toThrow('User recovery profile not found');
    });

    it('should handle repository errors gracefully', async () => {
      mockUserRecoveryProfileRepository.findByUserId.mockRejectedValue(new Error('Database error'));

      await expect(recoveryStageTracker.evaluateStageProgression(mockUserId))
        .rejects.toThrow('Database error');
    });
  });
});