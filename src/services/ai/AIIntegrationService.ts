/**
 * AI Integration Service - Multi-provider AI integration service
 * Supports Google Gemini and OpenAI with intelligent fallback and load balancing
 * Handles secure API communication, caching, and comprehensive error handling
 */
import { GoogleGenerativeAI } from '@google/generative-ai';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CryptoJS from 'crypto-js';

export type AIProvider = 'gemini' | 'openai' | 'local';

export interface AIServiceConfig {
  primaryProvider: AIProvider;
  fallbackProviders: AIProvider[];
  gemini?: {
    apiKey: string;
    model: string;
    endpoint?: string;
  };
  openai?: {
    apiKey: string;
    model: string;
    endpoint?: string;
  };
  maxRetries: number;
  retryDelay: number;
  cacheEnabled: boolean;
  cacheTTL: number; // Time to live in milliseconds
  loadBalancing: boolean;
  healthCheckInterval: number;
}

export interface ProviderHealth {
  provider: AIProvider;
  isHealthy: boolean;
  lastChecked: number;
  latency: number;
  errorRate: number;
  rateLimitStatus: 'ok' | 'approaching' | 'exceeded';
}

export interface AIRequest {
  prompt: string;
  context?: any;
  category: 'motivation' | 'crisis' | 'milestone' | 'insight' | 'education';
  userId?: string;
}

export interface AIResponse {
  content: string;
  source: 'ai' | 'cache' | 'fallback';
  confidence: number;
  timestamp: Date;
  cached: boolean;
  responseTime: number;
}

export interface CachedResponse {
  content: string;
  timestamp: number;
  expiresAt: number;
  useCount: number;
  category: string;
}

class AIIntegrationService {
  private providers: Map<AIProvider, any> = new Map();
  private providerHealth: Map<AIProvider, ProviderHealth> = new Map();
  private config: AIServiceConfig;
  private isInitialized = false;
  private rateLimitCounts: Map<AIProvider, number> = new Map();
  private rateLimitResetTimes: Map<AIProvider, number> = new Map();
  private lastHealthCheck = 0;

  constructor() {
    this.config = {
      primaryProvider: 'gemini',
      fallbackProviders: ['local'],
      maxRetries: 3,
      retryDelay: 1000,
      cacheEnabled: true,
      cacheTTL: 24 * 60 * 60 * 1000, // 24 hours
      loadBalancing: false,
      healthCheckInterval: 5 * 60 * 1000, // 5 minutes
    };
  }

  /**
   * Initialize AI service with multiple providers
   */
  async initialize(primaryApiKey: string, options: {
    openaiKey?: string;
    primaryProvider?: AIProvider;
    fallbackProviders?: AIProvider[];
  } = {}): Promise<boolean> {
    try {
      console.log('AI Service: Initializing multi-provider service');

      // Update config
      this.config.primaryProvider = options.primaryProvider || 'gemini';
      this.config.fallbackProviders = options.fallbackProviders || ['local'];

      // Initialize Gemini
      if (primaryApiKey && (this.config.primaryProvider === 'gemini' || this.config.fallbackProviders.includes('gemini'))) {
        this.config.gemini = {
          apiKey: primaryApiKey,
          model: 'gemini-1.5-flash',
        };
        
        try {
          const genAI = new GoogleGenerativeAI(primaryApiKey);
          const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
          this.providers.set('gemini', { genAI, model });
          
          await this.initializeProviderHealth('gemini');
          console.log('✅ Gemini provider initialized');
        } catch (error) {
          console.error('❌ Gemini provider initialization failed:', error);
        }
      }

      // Initialize OpenAI (if key provided)
      if (options.openaiKey && (this.config.primaryProvider === 'openai' || this.config.fallbackProviders.includes('openai'))) {
        this.config.openai = {
          apiKey: options.openaiKey,
          model: 'gpt-3.5-turbo',
        };
        
        try {
          // OpenAI implementation would go here
          // For now, marking as available for future implementation
          this.providers.set('openai', { available: false, reason: 'Not implemented yet' });
          console.log('⚠️ OpenAI provider configured but not implemented yet');
        } catch (error) {
          console.error('❌ OpenAI provider initialization failed:', error);
        }
      }

      // Always have local fallback available
      this.providers.set('local', { available: true });
      await this.initializeProviderHealth('local');

      // Check if at least one provider is available
      const availableProviders = Array.from(this.providers.keys())
        .filter(provider => this.isProviderHealthy(provider));

      if (availableProviders.length === 0) {
        console.warn('AI Service: No providers available, using local fallback only');
        this.isInitialized = false;
        return false;
      }

      this.isInitialized = true;
      console.log(`AI Service: Initialized with providers: ${availableProviders.join(', ')}`);
      return true;
    } catch (error) {
      console.error('AI Service: Multi-provider initialization failed:', error);
      return false;
    }
  }

  /**
   * Generate AI response with multi-provider fallback and caching
   */
  async generateResponse(request: AIRequest): Promise<AIResponse> {
    const startTime = Date.now();

    try {
      // Check cache first
      if (this.config.cacheEnabled) {
        const cachedResponse = await this.getCachedResponse(request);
        if (cachedResponse) {
          return {
            content: cachedResponse.content,
            source: 'cache',
            confidence: 0.9,
            timestamp: new Date(),
            cached: true,
            responseTime: Date.now() - startTime,
          };
        }
      }

      // Run health checks if needed
      await this.performHealthChecks();

      // Select best available provider
      const selectedProvider = await this.selectBestProvider(request);
      if (!selectedProvider) {
        throw new Error('No healthy providers available');
      }

      // Generate AI response with provider fallback
      const result = await this.generateWithProviderFallback(request, selectedProvider);

      // Cache the response
      if (this.config.cacheEnabled && result.source === 'ai') {
        await this.cacheResponse(request, result.content);
      }

      return {
        ...result,
        timestamp: new Date(),
        responseTime: Date.now() - startTime,
      };

    } catch (error) {
      console.error('AI Service: Error generating response:', error);
      
      // Return local fallback response
      const fallbackContent = await this.getLocalFallbackResponse(request);
      return {
        content: fallbackContent,
        source: 'fallback',
        confidence: 0.7,
        timestamp: new Date(),
        cached: false,
        responseTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Generate response with provider fallback logic
   */
  private async generateWithProviderFallback(request: AIRequest, primaryProvider: AIProvider): Promise<{
    content: string;
    source: 'ai' | 'fallback';
    confidence: number;
    cached: boolean;
  }> {
    const providersToTry = [primaryProvider, ...this.config.fallbackProviders.filter(p => p !== primaryProvider)];

    for (const provider of providersToTry) {
      try {
        if (!this.isProviderHealthy(provider)) {
          console.log(`Skipping unhealthy provider: ${provider}`);
          continue;
        }

        if (this.isProviderRateLimited(provider)) {
          console.log(`Provider ${provider} is rate limited`);
          continue;
        }

        const startTime = Date.now();
        const result = await this.callProviderWithRetry(provider, request);
        const latency = Date.now() - startTime;

        // Update provider health based on successful response
        await this.updateProviderHealth(provider, true, latency);
        this.updateProviderRateLimit(provider);

        return {
          content: result.content,
          source: 'ai',
          confidence: result.confidence || 0.95,
          cached: false,
        };
      } catch (error) {
        console.error(`Provider ${provider} failed:`, error);
        
        // Update provider health based on failure
        await this.updateProviderHealth(provider, false, 0);
        
        // Continue to next provider
        continue;
      }
    }

    // All providers failed, use local fallback
    throw new Error('All AI providers failed');
  }

  /**
   * Call AI service with retry logic
   */
  private async callAIWithRetry(request: AIRequest, attempt = 1): Promise<any> {
    try {
      const result = await this.model.generateContent(request.prompt);
      return result;
    } catch (error) {
      if (attempt < this.config.maxRetries) {
        await this.delay(this.config.retryDelay * attempt);
        return this.callAIWithRetry(request, attempt + 1);
      }
      throw error;
    }
  }

  /**
   * Get cached response if available and not expired
   */
  private async getCachedResponse(request: AIRequest): Promise<CachedResponse | null> {
    try {
      const cacheKey = this.generateCacheKey(request);
      const cachedData = await AsyncStorage.getItem(cacheKey);
      
      if (!cachedData) {
        return null;
      }

      const cached: CachedResponse = JSON.parse(cachedData);
      
      // Check if expired
      if (Date.now() > cached.expiresAt) {
        await AsyncStorage.removeItem(cacheKey);
        return null;
      }

      // Update use count
      cached.useCount++;
      await AsyncStorage.setItem(cacheKey, JSON.stringify(cached));

      return cached;
    } catch (error) {
      console.error('AI Service: Error getting cached response:', error);
      return null;
    }
  }

  /**
   * Cache AI response
   */
  private async cacheResponse(request: AIRequest, content: string): Promise<void> {
    try {
      const cacheKey = this.generateCacheKey(request);
      const cached: CachedResponse = {
        content,
        timestamp: Date.now(),
        expiresAt: Date.now() + this.config.cacheTTL,
        useCount: 1,
        category: request.category,
      };

      await AsyncStorage.setItem(cacheKey, JSON.stringify(cached));
    } catch (error) {
      console.error('AI Service: Error caching response:', error);
    }
  }

  /**
   * Generate cache key from request
   */
  private generateCacheKey(request: AIRequest): string {
    const promptHash = CryptoJS.SHA256(request.prompt).toString();
    return `ai_cache_${request.category}_${promptHash.substring(0, 16)}`;
  }

  /**
   * Get fallback response when AI is unavailable
   */
  private async getFallbackResponse(request: AIRequest): Promise<string> {
    const fallbackResponses = {
      motivation: [
        "Every step forward in your recovery journey is a victory worth celebrating. You have the strength to overcome today's challenges.",
        "Your commitment to growth and healing shows incredible courage. Take it one moment at a time.",
        "Recovery is not about perfection, it's about progress. You're doing better than you think.",
      ],
      crisis: [
        "This difficult moment will pass. Take three deep breaths and remember your coping strategies.",
        "You've overcome challenges before, and you can get through this one too. Reach out for support if you need it.",
        "Focus on the present moment. What is one small, positive action you can take right now?",
      ],
      milestone: [
        "Congratulations on reaching this important milestone! Your dedication and perseverance are truly inspiring.",
        "This achievement represents your commitment to positive change. You should be proud of how far you've come.",
        "Every milestone is a testament to your strength and determination. Keep moving forward!",
      ],
      insight: [
        "Your recovery journey is unique to you. Trust the process and be patient with yourself.",
        "Growth happens gradually. The small changes you're making today will compound over time.",
        "Self-awareness is the first step to lasting change. You're building important insights about yourself.",
      ],
      education: [
        "Recovery is a process that involves rewiring neural pathways. Your brain is capable of remarkable healing and adaptation.",
        "Understanding your triggers and patterns is key to building effective coping strategies.",
        "Mindfulness and self-compassion are powerful tools in your recovery toolkit.",
      ],
    };

    const responses = fallbackResponses[request.category] || fallbackResponses.motivation;
    const randomIndex = Math.floor(Math.random() * responses.length);
    return responses[randomIndex];
  }

  /**
   * Call specific provider with retry logic
   */
  private async callProviderWithRetry(provider: AIProvider, request: AIRequest, attempt = 1): Promise<{
    content: string;
    confidence: number;
  }> {
    try {
      if (provider === 'local') {
        return {
          content: await this.getLocalFallbackResponse(request),
          confidence: 0.7,
        };
      }

      if (provider === 'gemini') {
        const geminiProvider = this.providers.get('gemini');
        if (!geminiProvider?.model) {
          throw new Error('Gemini provider not available');
        }

        const result = await geminiProvider.model.generateContent(request.prompt);
        const content = result.response.text();
        
        return {
          content,
          confidence: 0.95,
        };
      }

      if (provider === 'openai') {
        // OpenAI implementation placeholder
        throw new Error('OpenAI provider not yet implemented');
      }

      throw new Error(`Unknown provider: ${provider}`);
    } catch (error) {
      if (attempt < this.config.maxRetries && provider !== 'local') {
        await this.delay(this.config.retryDelay * attempt);
        return this.callProviderWithRetry(provider, request, attempt + 1);
      }
      throw error;
    }
  }

  /**
   * Select best available provider
   */
  private async selectBestProvider(request: AIRequest): Promise<AIProvider | null> {
    // If load balancing is disabled, use primary provider
    if (!this.config.loadBalancing) {
      if (this.isProviderHealthy(this.config.primaryProvider) && !this.isProviderRateLimited(this.config.primaryProvider)) {
        return this.config.primaryProvider;
      }
      
      // Fall back to first available fallback provider
      for (const provider of this.config.fallbackProviders) {
        if (this.isProviderHealthy(provider) && !this.isProviderRateLimited(provider)) {
          return provider;
        }
      }
      
      return null;
    }

    // Load balancing: select provider with best health and lowest latency
    const availableProviders = [this.config.primaryProvider, ...this.config.fallbackProviders]
      .filter(p => this.isProviderHealthy(p) && !this.isProviderRateLimited(p));

    if (availableProviders.length === 0) {
      return null;
    }

    // For critical requests, always use the most reliable provider
    if (request.category === 'crisis') {
      return this.config.primaryProvider;
    }

    // Select provider with lowest latency
    const providerHealths = availableProviders.map(p => ({
      provider: p,
      health: this.providerHealth.get(p)!,
    }));

    providerHealths.sort((a, b) => a.health.latency - b.health.latency);
    return providerHealths[0].provider;
  }

  /**
   * Check if specific provider is rate limited
   */
  private isProviderRateLimited(provider: AIProvider): boolean {
    if (provider === 'local') return false; // Local never rate limited

    const now = Date.now();
    const resetTime = this.rateLimitResetTimes.get(provider) || 0;
    
    // Reset rate limit counter every hour
    if (now > resetTime) {
      this.rateLimitCounts.set(provider, 0);
      this.rateLimitResetTimes.set(provider, now + (60 * 60 * 1000)); // 1 hour
    }

    const count = this.rateLimitCounts.get(provider) || 0;
    
    // Provider-specific limits
    const limits = {
      'gemini': 100,
      'openai': 150,
      'local': Number.MAX_SAFE_INTEGER,
    };
    
    return count >= (limits[provider] || 100);
  }

  /**
   * Update provider rate limit tracking
   */
  private updateProviderRateLimit(provider: AIProvider): void {
    if (provider === 'local') return;
    
    const current = this.rateLimitCounts.get(provider) || 0;
    this.rateLimitCounts.set(provider, current + 1);
  }

  /**
   * Check if provider is healthy
   */
  private isProviderHealthy(provider: AIProvider): boolean {
    const health = this.providerHealth.get(provider);
    return health?.isHealthy || false;
  }

  /**
   * Initialize provider health monitoring
   */
  private async initializeProviderHealth(provider: AIProvider): Promise<void> {
    this.providerHealth.set(provider, {
      provider,
      isHealthy: true,
      lastChecked: Date.now(),
      latency: 0,
      errorRate: 0,
      rateLimitStatus: 'ok',
    });
  }

  /**
   * Update provider health based on response
   */
  private async updateProviderHealth(provider: AIProvider, success: boolean, latency: number): Promise<void> {
    const health = this.providerHealth.get(provider);
    if (!health) return;

    const now = Date.now();
    
    // Update latency (moving average)
    if (success && latency > 0) {
      health.latency = health.latency === 0 ? latency : (health.latency * 0.7 + latency * 0.3);
    }

    // Update error rate (moving average)
    const errorValue = success ? 0 : 1;
    health.errorRate = health.errorRate === 0 ? errorValue : (health.errorRate * 0.9 + errorValue * 0.1);

    // Update health status
    health.isHealthy = health.errorRate < 0.3; // Healthy if less than 30% error rate
    health.lastChecked = now;

    // Update rate limit status
    const rateLimitCount = this.rateLimitCounts.get(provider) || 0;
    const rateLimitMax = provider === 'gemini' ? 100 : provider === 'openai' ? 150 : 1000;
    
    if (rateLimitCount >= rateLimitMax) {
      health.rateLimitStatus = 'exceeded';
    } else if (rateLimitCount >= rateLimitMax * 0.8) {
      health.rateLimitStatus = 'approaching';
    } else {
      health.rateLimitStatus = 'ok';
    }

    this.providerHealth.set(provider, health);
  }

  /**
   * Perform health checks on all providers
   */
  private async performHealthChecks(): Promise<void> {
    const now = Date.now();
    
    // Only run health checks every 5 minutes
    if (now - this.lastHealthCheck < this.config.healthCheckInterval) {
      return;
    }

    this.lastHealthCheck = now;
    
    for (const provider of this.providers.keys()) {
      if (provider === 'local') continue; // Local doesn't need health checks
      
      try {
        // Perform lightweight health check
        const testRequest: AIRequest = {
          prompt: 'Health check',
          category: 'education',
        };
        
        const startTime = Date.now();
        await this.callProviderWithRetry(provider, testRequest);
        const latency = Date.now() - startTime;
        
        await this.updateProviderHealth(provider, true, latency);
      } catch (error) {
        await this.updateProviderHealth(provider, false, 0);
      }
    }
  }

  /**
   * Get local fallback response (renamed from getFallbackResponse)
   */
  private async getLocalFallbackResponse(request: AIRequest): Promise<string> {
    return this.getFallbackResponse(request);
  }

  /**
   * Check if any provider is rate limited (for backward compatibility)
   */
  private isRateLimited(): boolean {
    return this.isProviderRateLimited(this.config.primaryProvider);
  }

  /**
   * Update rate limit tracking (for backward compatibility)
   */
  private updateRateLimit(): void {
    this.updateProviderRateLimit(this.config.primaryProvider);
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Clear all cached responses
   */
  async clearCache(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith('ai_cache_'));
      await AsyncStorage.multiRemove(cacheKeys);
      console.log('AI Service: Cache cleared');
    } catch (error) {
      console.error('AI Service: Error clearing cache:', error);
    }
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<{ totalCached: number; categories: Record<string, number> }> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith('ai_cache_'));
      
      const categories: Record<string, number> = {};
      
      for (const key of cacheKeys) {
        const data = await AsyncStorage.getItem(key);
        if (data) {
          const cached: CachedResponse = JSON.parse(data);
          categories[cached.category] = (categories[cached.category] || 0) + 1;
        }
      }

      return {
        totalCached: cacheKeys.length,
        categories,
      };
    } catch (error) {
      console.error('AI Service: Error getting cache stats:', error);
      return { totalCached: 0, categories: {} };
    }
  }

  /**
   * Check if service is available
   */
  isAvailable(): boolean {
    return this.isInitialized && !this.isRateLimited();
  }

  /**
   * Get service status
   */
  getStatus(): {
    initialized: boolean;
    rateLimited: boolean;
    cacheEnabled: boolean;
    model: string;
  } {
    return {
      initialized: this.isInitialized,
      rateLimited: this.isRateLimited(),
      cacheEnabled: this.config.cacheEnabled,
      model: this.config.model,
    };
  }
}

// Export singleton instance
export const aiIntegrationService = new AIIntegrationService();