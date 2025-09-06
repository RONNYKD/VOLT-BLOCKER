/**
 * Unit tests for DataAnonymizationService
 */
import { dataAnonymizationService } from '../../../src/services/ai/DataAnonymizationService';

describe('DataAnonymizationService', () => {
  describe('anonymizeUserData', () => {
    it('should remove PII from user data', async () => {
      const rawData = {
        email: 'user@example.com',
        name: 'John Doe',
        phone: '555-123-4567',
        recoveryNotes: 'I struggle with pornography addiction',
      };

      const result = await dataAnonymizationService.anonymizeUserData(rawData);

      expect(result.processedContent.email).toBe('[EMAIL_REMOVED]');
      expect(result.processedContent.name).toBe('[NAME_REMOVED]');
      expect(result.processedContent.phone).toBe('[PHONE_REMOVED]');
      expect(result.contextMarkers).toContain('removed_email');
      expect(result.contextMarkers).toContain('removed_name');
      expect(result.contextMarkers).toContain('removed_phone');
    });

    it('should encode sensitive recovery terms', async () => {
      const rawData = {
        notes: 'I had a relapse with pornography yesterday due to stress',
        triggers: ['pornography', 'stress', 'loneliness'],
      };

      const result = await dataAnonymizationService.anonymizeUserData(rawData);

      expect(result.processedContent.notes).toContain('digital_content_category_a');
      expect(result.processedContent.notes).toContain('setback_event');
      expect(result.contextMarkers).toContain('encoded_pornography');
      expect(result.contextMarkers).toContain('encoded_relapse');
    });

    it('should determine appropriate sensitivity level', async () => {
      const highSensitivityData = {
        email: 'user@example.com',
        notes: 'pornography addiction relapse',
        phone: '555-123-4567',
      };

      const result = await dataAnonymizationService.anonymizeUserData(highSensitivityData);

      expect(result.sensitivityLevel).toBe('high');
      expect(result.contextMarkers.length).toBeGreaterThan(3);
    });

    it('should handle nested objects and arrays', async () => {
      const complexData = {
        user: {
          email: 'test@example.com',
          profile: {
            triggers: ['pornography', 'stress'],
          },
        },
        sessions: [
          { notes: 'Had urges but used coping strategies' },
          { notes: 'Successful day without relapse' },
        ],
      };

      const result = await dataAnonymizationService.anonymizeUserData(complexData);

      expect(result.processedContent.user.email).toBe('[EMAIL_REMOVED]');
      expect(result.processedContent.sessions[0].notes).toContain('impulse_event');
      expect(result.processedContent.sessions[1].notes).toContain('setback_event');
    });
  });

  describe('encodeRecoveryContext', () => {
    it('should encode recovery stage correctly', async () => {
      const recoveryData = {
        userId: 'user123',
        recoveryStage: 'early',
        daysSinceLastSetback: 5,
        moodRating: 7,
        triggerEvents: ['stress', 'loneliness'],
      };

      const result = await dataAnonymizationService.encodeRecoveryContext(recoveryData);

      expect(result.stage).toBe('stage_alpha');
      expect(result.progress).toBe('progress_early');
      expect(result.mood).toBe('mood_positive');
      expect(result.risk_factors).toContain('stress_response_elevated');
    });

    it('should handle different recovery stages', async () => {
      const stages = ['early', 'maintenance', 'challenge', 'growth'];
      const expectedCodes = ['stage_alpha', 'stage_beta', 'stage_gamma', 'stage_delta'];

      for (let i = 0; i < stages.length; i++) {
        const recoveryData = {
          userId: 'user123',
          recoveryStage: stages[i],
          daysSinceLastSetback: 30,
        };

        const result = await dataAnonymizationService.encodeRecoveryContext(recoveryData);
        expect(result.stage).toBe(expectedCodes[i]);
      }
    });
  });

  describe('createSafePrompt', () => {
    it('should create safe prompt without PII', async () => {
      const userInput = 'My email is john@example.com and I need help with pornography addiction';
      const context = { recoveryStage: 'early' };

      const result = await dataAnonymizationService.createSafePrompt(userInput, context);

      expect(result.prompt).not.toContain('john@example.com');
      expect(result.prompt).toContain('[EMAIL_REMOVED]');
      expect(result.prompt).toContain('digital_content_category_a');
      expect(result.contextMarkers).toContain('removed_email');
      expect(result.contextMarkers).toContain('encoded_pornography');
    });

    it('should handle prompts without context', async () => {
      const userInput = 'I need motivation for my recovery';

      const result = await dataAnonymizationService.createSafePrompt(userInput, null);

      expect(result.prompt).toBe(userInput);
      expect(result.contextMarkers).toHaveLength(0);
      expect(result.sensitivityLevel).toBe('low');
    });
  });

  describe('validatePrivacyCompliance', () => {
    it('should detect PII violations', async () => {
      const dataWithPII = {
        email: 'user@example.com',
        phone: '555-123-4567',
        notes: 'My name is John Smith',
      };

      const result = await dataAnonymizationService.validatePrivacyCompliance(dataWithPII);

      expect(result.isValid).toBe(false);
      expect(result.violations).toContain('Contains email information');
      expect(result.violations).toContain('Contains phone information');
      expect(result.riskLevel).toBe('high');
      expect(result.recommendations).toContain('Remove or anonymize email data');
    });

    it('should detect sensitive recovery terms', async () => {
      const dataWithSensitiveTerms = {
        notes: 'I struggle with pornography and had a relapse',
      };

      const result = await dataAnonymizationService.validatePrivacyCompliance(dataWithSensitiveTerms);

      expect(result.isValid).toBe(false);
      expect(result.violations.some(v => v.includes('pornography'))).toBe(true);
      expect(result.violations.some(v => v.includes('relapse'))).toBe(true);
      expect(result.riskLevel).toBe('medium');
    });

    it('should pass validation for clean data', async () => {
      const cleanData = {
        stage: 'stage_alpha',
        progress: 'progress_early',
        mood: 'mood_positive',
      };

      const result = await dataAnonymizationService.validatePrivacyCompliance(cleanData);

      expect(result.isValid).toBe(true);
      expect(result.violations).toHaveLength(0);
      expect(result.riskLevel).toBe('low');
    });
  });

  describe('containsSensitiveInfo', () => {
    it('should detect PII in text', () => {
      const textWithPII = 'Contact me at john@example.com or 555-123-4567';
      
      const result = dataAnonymizationService.containsSensitiveInfo(textWithPII);
      
      expect(result).toBe(true);
    });

    it('should detect sensitive recovery terms', () => {
      const textWithSensitiveTerms = 'I struggle with pornography addiction';
      
      const result = dataAnonymizationService.containsSensitiveInfo(textWithSensitiveTerms);
      
      expect(result).toBe(true);
    });

    it('should return false for clean text', () => {
      const cleanText = 'I am working on my recovery and feeling positive';
      
      const result = dataAnonymizationService.containsSensitiveInfo(cleanText);
      
      expect(result).toBe(false);
    });
  });

  describe('generateAnonymousId', () => {
    it('should generate consistent anonymous ID for same user', () => {
      const userId = 'user123';
      
      const id1 = dataAnonymizationService.generateAnonymousId(userId);
      const id2 = dataAnonymizationService.generateAnonymousId(userId);
      
      expect(id1).toBe(id2);
      expect(id1).toHaveLength(16);
    });

    it('should generate different IDs for different users', () => {
      const userId1 = 'user123';
      const userId2 = 'user456';
      
      const id1 = dataAnonymizationService.generateAnonymousId(userId1);
      const id2 = dataAnonymizationService.generateAnonymousId(userId2);
      
      expect(id1).not.toBe(id2);
    });
  });
});