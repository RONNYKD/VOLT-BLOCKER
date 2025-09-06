/**
 * Unit tests for AIErrorHandler
 */
import { aiErrorHandler } from '../../../src/services/ai/AIErrorHandler';
import type { AIServiceError, RequestContext, CrisisContext } from '../../../src/services/ai/AIErrorHandler';

describe('AIErrorHandler', () => {
  describe('handleAIServiceError', () => {
    it('should handle rate limit exceeded error', async () => {
      const error: AIServiceError = {
        type: 'RATE_LIMIT_EXCEEDED',
        message: 'Rate limit exceeded',
        retryable: true,
        timestamp: new Date(),
      };

      const context: RequestContext = {
        category: 'motivation',
        userStage: 'early',
        urgency: 'medium',
        retryCount: 0,
      };

      const result = await aiErrorHandler.handleAIServiceError(error, context);

      expect(result.source).toBe('template');
      expect(result.shouldRetryLater).toBe(true);
      expect(result.retryAfter).toBeGreaterThan(0);
      expect(result.content.length).toBeGreaterThan(10); // Should have meaningful content
    });

    it('should handle service unavailable error', async () => {
      const error: AIServiceError = {
        type: 'SERVICE_UNAVAILABLE',
        message: 'Service temporarily unavailable',
        retryable: true,
        timestamp: new Date(),
      };

      const context: RequestContext = {
        category: 'crisis',
        userStage: 'maintenance',
        urgency: 'high',
        retryCount: 1,
      };

      const result = await aiErrorHandler.handleAIServiceError(error, context);

      expect(result.source).toBe('template');
      expect(result.shouldRetryLater).toBe(true);
      expect(result.retryAfter).toBe(300); // 5 minutes
      expect(result.content).toBeDefined();
    });

    it('should handle authentication failed error', async () => {
      const error: AIServiceError = {
        type: 'AUTHENTICATION_FAILED',
        message: 'Invalid API key',
        retryable: false,
        timestamp: new Date(),
      };

      const context: RequestContext = {
        category: 'milestone',
        userStage: 'growth',
        urgency: 'low',
        retryCount: 0,
      };

      const result = await aiErrorHandler.handleAIServiceError(error, context);

      expect(result.source).toBe('template');
      expect(result.shouldRetryLater).toBe(false);
      expect(result.content).toBeDefined();
    });

    it('should provide appropriate content for different categories', async () => {
      const error: AIServiceError = {
        type: 'SERVICE_UNAVAILABLE',
        message: 'Service unavailable',
        retryable: true,
        timestamp: new Date(),
      };

      const categories = ['motivation', 'crisis', 'milestone', 'insight', 'education'];

      for (const category of categories) {
        const context: RequestContext = {
          category: category as any,
          userStage: 'early',
          urgency: 'medium',
          retryCount: 0,
        };

        const result = await aiErrorHandler.handleAIServiceError(error, context);

        expect(result.content).toBeDefined();
        expect(result.content.length).toBeGreaterThan(10);
      }
    });
  });

  describe('handleCrisisError', () => {
    it('should provide immediate crisis support', async () => {
      const error = new Error('AI service failed');
      const crisisContext: CrisisContext = {
        triggerType: 'stress',
        severityLevel: 'high',
        userProfile: {
          recoveryStage: 'early',
          copingStrategies: ['breathing', 'exercise'],
          emergencyContacts: ['555-0123'],
        },
        timestamp: new Date(),
      };

      const result = await aiErrorHandler.handleCrisisError(error, crisisContext);

      expect(result.immediateActions).toBeDefined();
      expect(result.immediateActions.length).toBeGreaterThan(0);
      expect(result.supportResources).toBeDefined();
      expect(result.followUpPlan).toBeDefined();
      expect(result.escalationRequired).toBe(false);
    });

    it('should escalate for critical severity', async () => {
      const error = new Error('AI service failed');
      const crisisContext: CrisisContext = {
        triggerType: 'severe_depression',
        severityLevel: 'critical',
        userProfile: {
          recoveryStage: 'challenge',
          copingStrategies: ['therapy'],
        },
        timestamp: new Date(),
      };

      const result = await aiErrorHandler.handleCrisisError(error, crisisContext);

      expect(result.escalationRequired).toBe(true);
      expect(result.supportResources).toContain('Call 911 if you\'re in immediate danger');
    });

    it('should provide trigger-specific coping strategies', async () => {
      const error = new Error('AI service failed');
      const triggerTypes = ['stress', 'loneliness', 'boredom'];

      for (const triggerType of triggerTypes) {
        const crisisContext: CrisisContext = {
          triggerType,
          severityLevel: 'medium',
          userProfile: {
            recoveryStage: 'maintenance',
            copingStrategies: [],
          },
          timestamp: new Date(),
        };

        const result = await aiErrorHandler.handleCrisisError(error, crisisContext);

        expect(result.immediateActions).toBeDefined();
        expect(result.immediateActions.length).toBeGreaterThan(0);
        
        // Check that strategies are relevant to trigger type
        const actionsText = result.immediateActions.join(' ').toLowerCase();
        if (triggerType === 'stress') {
          expect(actionsText).toMatch(/breath|relax|tension/);
        } else if (triggerType === 'loneliness') {
          expect(actionsText).toMatch(/call|friend|public/);
        } else if (triggerType === 'boredom') {
          expect(actionsText).toMatch(/creative|exercise|learn/);
        }
      }
    });
  });

  describe('createAIServiceError', () => {
    it('should create rate limit error from 429 status', () => {
      const genericError = { message: 'Too many requests', code: 429 };

      const result = aiErrorHandler.createAIServiceError(genericError);

      expect(result.type).toBe('RATE_LIMIT_EXCEEDED');
      expect(result.retryable).toBe(true);
      expect(result.message).toBe('Too many requests');
    });

    it('should create auth error from 401 status', () => {
      const genericError = { message: 'Unauthorized', code: 401 };

      const result = aiErrorHandler.createAIServiceError(genericError);

      expect(result.type).toBe('AUTHENTICATION_FAILED');
      expect(result.retryable).toBe(false);
    });

    it('should create service unavailable error from 503 status', () => {
      const genericError = { message: 'Service unavailable', code: 503 };

      const result = aiErrorHandler.createAIServiceError(genericError);

      expect(result.type).toBe('SERVICE_UNAVAILABLE');
      expect(result.retryable).toBe(true);
    });

    it('should create unknown error for unrecognized errors', () => {
      const genericError = { message: 'Something went wrong', code: 999 };

      const result = aiErrorHandler.createAIServiceError(genericError);

      expect(result.type).toBe('UNKNOWN_ERROR');
      expect(result.retryable).toBe(true);
    });
  });

  describe('isRetryable', () => {
    it('should return true for retryable errors within retry limit', () => {
      const error: AIServiceError = {
        type: 'RATE_LIMIT_EXCEEDED',
        message: 'Rate limit exceeded',
        retryable: true,
        timestamp: new Date(),
      };

      const result = aiErrorHandler.isRetryable(error, 1);

      expect(result).toBe(true);
    });

    it('should return false for non-retryable errors', () => {
      const error: AIServiceError = {
        type: 'AUTHENTICATION_FAILED',
        message: 'Invalid API key',
        retryable: false,
        timestamp: new Date(),
      };

      const result = aiErrorHandler.isRetryable(error, 0);

      expect(result).toBe(false);
    });

    it('should return false when retry limit exceeded', () => {
      const error: AIServiceError = {
        type: 'RATE_LIMIT_EXCEEDED',
        message: 'Rate limit exceeded',
        retryable: true,
        timestamp: new Date(),
      };

      const result = aiErrorHandler.isRetryable(error, 5);

      expect(result).toBe(false);
    });
  });

  describe('getRetryDelay', () => {
    it('should return appropriate delay for rate limit errors', () => {
      const error: AIServiceError = {
        type: 'RATE_LIMIT_EXCEEDED',
        message: 'Rate limit exceeded',
        retryable: true,
        timestamp: new Date(),
      };

      const delay = aiErrorHandler.getRetryDelay(error, 0);

      expect(delay).toBeGreaterThan(1000); // Should be longer than normal retry
      expect(delay).toBeLessThanOrEqual(300000); // Should not exceed 5 minutes
    });

    it('should return normal delay for other errors', () => {
      const error: AIServiceError = {
        type: 'NETWORK_ERROR',
        message: 'Network error',
        retryable: true,
        timestamp: new Date(),
      };

      const delay = aiErrorHandler.getRetryDelay(error, 0);

      expect(delay).toBe(1000); // First retry delay
    });

    it('should increase delay with retry count', () => {
      const error: AIServiceError = {
        type: 'NETWORK_ERROR',
        message: 'Network error',
        retryable: true,
        timestamp: new Date(),
      };

      const delay1 = aiErrorHandler.getRetryDelay(error, 0);
      const delay2 = aiErrorHandler.getRetryDelay(error, 1);
      const delay3 = aiErrorHandler.getRetryDelay(error, 2);

      expect(delay2).toBeGreaterThan(delay1);
      expect(delay3).toBeGreaterThan(delay2);
    });
  });
});