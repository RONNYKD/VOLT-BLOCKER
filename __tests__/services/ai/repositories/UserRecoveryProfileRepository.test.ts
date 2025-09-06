/**
 * Unit tests for UserRecoveryProfileRepository
 */
import { userRecoveryProfileRepository } from '../../../../src/services/ai/repositories/UserRecoveryProfileRepository';
import { RecoveryStage, TriggerType } from '../../../../src/services/ai/types';

// Mock Supabase client
jest.mock('../../../../src/services/supabase', () => ({
  supabase: {
    getClient: jest.fn(() => ({
      from: jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn(),
      })),
    })),
  },
}));

describe('UserRecoveryProfileRepository', () => {
  const mockUserId = 'user-123';
  const mockProfile = {
    id: 'profile-123',
    user_id: mockUserId,
    recovery_start_date: '2024-01-01',
    current_stage: 'early' as RecoveryStage,
    days_since_last_setback: 30,
    total_recovery_days: 30,
    personal_triggers: ['stress', 'loneliness'] as TriggerType[],
    coping_strategies: ['breathing', 'exercise'],
    support_contacts: ['555-0123'],
    recovery_goals: ['30 days clean', 'better sleep'],
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
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create recovery profile with valid data', async () => {
      const mockClient = require('../../../../src/services/supabase').supabase.getClient();
      mockClient.from().insert().select().single.mockResolvedValue({
        data: mockProfile,
        error: null,
      });

      const profileData = {
        user_id: mockUserId,
        recovery_start_date: '2024-01-01',
      };

      const result = await userRecoveryProfileRepository.create(profileData);

      expect(result).toEqual(mockProfile);
      expect(mockClient.from).toHaveBeenCalledWith('user_recovery_profiles');
    });

    it('should validate required fields', async () => {
      const invalidData = {
        recovery_start_date: '2024-01-01',
        // Missing user_id
      };

      await expect(userRecoveryProfileRepository.create(invalidData as any))
        .rejects.toMatchObject({
          code: 'VALIDATION_ERROR',
          message: expect.stringContaining('Missing required fields'),
        });
    });

    it('should set default values', async () => {
      const mockClient = require('../../../../src/services/supabase').supabase.getClient();
      mockClient.from().insert().select().single.mockResolvedValue({
        data: mockProfile,
        error: null,
      });

      const profileData = {
        user_id: mockUserId,
        recovery_start_date: '2024-01-01',
      };

      await userRecoveryProfileRepository.create(profileData);

      expect(mockClient.from().insert).toHaveBeenCalledWith(
        expect.objectContaining({
          current_stage: 'early',
          days_since_last_setback: 0,
          total_recovery_days: 0,
          ai_coaching_enabled: true,
          crisis_intervention_enabled: true,
          milestone_notifications_enabled: true,
        })
      );
    });
  });

  describe('findByUserId', () => {
    it('should find profile by user ID', async () => {
      const mockClient = require('../../../../src/services/supabase').supabase.getClient();
      mockClient.from().select().eq().single.mockResolvedValue({
        data: mockProfile,
        error: null,
      });

      const result = await userRecoveryProfileRepository.findByUserId(mockUserId);

      expect(result).toEqual(mockProfile);
      expect(mockClient.from().eq).toHaveBeenCalledWith('user_id', mockUserId);
    });

    it('should return null when profile not found', async () => {
      const mockClient = require('../../../../src/services/supabase').supabase.getClient();
      mockClient.from().select().eq().single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' }, // No rows found
      });

      const result = await userRecoveryProfileRepository.findByUserId(mockUserId);

      expect(result).toBeNull();
    });
  });

  describe('updateProgress', () => {
    it('should update recovery progress', async () => {
      const mockClient = require('../../../../src/services/supabase').supabase.getClient();
      
      // Mock findByUserId
      mockClient.from().select().eq().single
        .mockResolvedValueOnce({
          data: mockProfile,
          error: null,
        })
        // Mock update
        .mockResolvedValueOnce({
          data: { ...mockProfile, days_since_last_setback: 45, total_recovery_days: 45 },
          error: null,
        });

      mockClient.from().update().eq().select().single.mockResolvedValue({
        data: { ...mockProfile, days_since_last_setback: 45, total_recovery_days: 45 },
        error: null,
      });

      const result = await userRecoveryProfileRepository.updateProgress(
        mockUserId,
        45,
        45,
        'maintenance'
      );

      expect(result).toBeDefined();
      expect(result?.days_since_last_setback).toBe(45);
      expect(result?.total_recovery_days).toBe(45);
    });

    it('should throw error when profile not found', async () => {
      const mockClient = require('../../../../src/services/supabase').supabase.getClient();
      mockClient.from().select().eq().single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' },
      });

      await expect(userRecoveryProfileRepository.updateProgress(mockUserId, 45, 45))
        .rejects.toThrow('Recovery profile not found');
    });
  });

  describe('addPersonalTrigger', () => {
    it('should add new trigger to personal triggers', async () => {
      const mockClient = require('../../../../src/services/supabase').supabase.getClient();
      
      // Mock findByUserId
      mockClient.from().select().eq().single
        .mockResolvedValueOnce({
          data: mockProfile,
          error: null,
        })
        // Mock update
        .mockResolvedValueOnce({
          data: { 
            ...mockProfile, 
            personal_triggers: [...mockProfile.personal_triggers, 'anxiety'] 
          },
          error: null,
        });

      mockClient.from().update().eq().select().single.mockResolvedValue({
        data: { 
          ...mockProfile, 
          personal_triggers: [...mockProfile.personal_triggers, 'anxiety'] 
        },
        error: null,
      });

      const result = await userRecoveryProfileRepository.addPersonalTrigger(
        mockUserId,
        'anxiety'
      );

      expect(result?.personal_triggers).toContain('anxiety');
    });

    it('should not add duplicate trigger', async () => {
      const mockClient = require('../../../../src/services/supabase').supabase.getClient();
      mockClient.from().select().eq().single.mockResolvedValue({
        data: mockProfile,
        error: null,
      });

      const result = await userRecoveryProfileRepository.addPersonalTrigger(
        mockUserId,
        'stress' // Already exists in mockProfile
      );

      expect(result).toEqual(mockProfile);
      expect(mockClient.from().update).not.toHaveBeenCalled();
    });
  });

  describe('removePersonalTrigger', () => {
    it('should remove trigger from personal triggers', async () => {
      const mockClient = require('../../../../src/services/supabase').supabase.getClient();
      
      // Mock findByUserId
      mockClient.from().select().eq().single
        .mockResolvedValueOnce({
          data: mockProfile,
          error: null,
        })
        // Mock update
        .mockResolvedValueOnce({
          data: { 
            ...mockProfile, 
            personal_triggers: ['loneliness'] // 'stress' removed
          },
          error: null,
        });

      mockClient.from().update().eq().select().single.mockResolvedValue({
        data: { 
          ...mockProfile, 
          personal_triggers: ['loneliness']
        },
        error: null,
      });

      const result = await userRecoveryProfileRepository.removePersonalTrigger(
        mockUserId,
        'stress'
      );

      expect(result?.personal_triggers).not.toContain('stress');
      expect(result?.personal_triggers).toContain('loneliness');
    });
  });

  describe('hasProfile', () => {
    it('should return true when profile exists', async () => {
      const mockClient = require('../../../../src/services/supabase').supabase.getClient();
      mockClient.from().select().eq.mockResolvedValue({
        count: 1,
        error: null,
      });

      const result = await userRecoveryProfileRepository.hasProfile(mockUserId);

      expect(result).toBe(true);
    });

    it('should return false when profile does not exist', async () => {
      const mockClient = require('../../../../src/services/supabase').supabase.getClient();
      mockClient.from().select().eq.mockResolvedValue({
        count: 0,
        error: null,
      });

      const result = await userRecoveryProfileRepository.hasProfile(mockUserId);

      expect(result).toBe(false);
    });
  });

  describe('toggleAIFeature', () => {
    it('should toggle AI coaching feature', async () => {
      const mockClient = require('../../../../src/services/supabase').supabase.getClient();
      
      // Mock findByUserId
      mockClient.from().select().eq().single
        .mockResolvedValueOnce({
          data: mockProfile,
          error: null,
        })
        // Mock update
        .mockResolvedValueOnce({
          data: { ...mockProfile, ai_coaching_enabled: false },
          error: null,
        });

      mockClient.from().update().eq().select().single.mockResolvedValue({
        data: { ...mockProfile, ai_coaching_enabled: false },
        error: null,
      });

      const result = await userRecoveryProfileRepository.toggleAIFeature(
        mockUserId,
        'ai_coaching_enabled',
        false
      );

      expect(result?.ai_coaching_enabled).toBe(false);
    });
  });
});