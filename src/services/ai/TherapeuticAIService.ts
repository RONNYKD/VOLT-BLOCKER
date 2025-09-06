/**
 * Therapeutic AI Service - Direct Gemini API integration for therapy-style conversations
 * Provides conversational AI with therapeutic characteristics and user context awareness
 */
import { GoogleGenerativeAI } from '@google/generative-ai';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface TherapyContext {
  currentStreak: number;
  totalDays: number;
  recentMilestones: Array<{
    title: string;
    date: string;
    value: number;
  }>;
  strugglingAreas?: string[];
  recentMoods?: Array<{
    mood: string;
    date: string;
    triggers?: string[];
  }>;
  goals?: string[];
  previousTopics?: string[];
}

export interface TherapyRequest {
  message: string;
  context: TherapyContext;
  actionType?: 'general_support' | 'crisis_intervention' | 'motivational_boost' | 'coping_guidance' | 'progress_insight' | 'milestone_celebration';
}

export interface TherapyResponse {
  content: string;
  type: 'support' | 'intervention' | 'celebration' | 'guidance';
  suggestedActions?: string[];
  timestamp: Date;
}

class TherapeuticAIService {
  private genAI: GoogleGenerativeAI | null = null;
  private model: any = null;
  private isInitialized = false;
  private conversationHistory: Array<{ role: 'user' | 'therapist'; content: string; timestamp: Date }> = [];
  
  // Therapeutic prompts and system behavior
  private readonly THERAPIST_PERSONALITY = `
You are a warm, empathetic, and professional digital therapist specializing in addiction recovery and digital wellness. Your role is to provide supportive, non-judgmental therapeutic conversations.

THERAPEUTIC APPROACH:
- Use person-centered therapy principles
- Be validating and empathetic
- Ask thoughtful, open-ended questions
- Provide evidence-based coping strategies
- Celebrate progress and milestones
- Offer hope and encouragement
- Maintain professional boundaries while being warm

CONVERSATION STYLE:
- Use "I" statements to show empathy ("I understand how challenging that must be")
- Reflect feelings ("It sounds like you're feeling overwhelmed")
- Ask about specifics ("Can you tell me more about what triggers these feelings?")
- Normalize struggles ("What you're experiencing is very common in recovery")
- Offer practical tools and techniques
- End responses with supportive or forward-looking statements

CRISIS RESPONSE:
- Take immediate supportive stance
- Validate their courage for reaching out
- Offer grounding techniques
- Remind them of their past successes
- Encourage professional help if needed
- Never minimize their experience

RECOVERY FOCUS:
- Focus on progress, not perfection
- Highlight growth and learning
- Discuss healthy coping mechanisms
- Address underlying patterns and triggers
- Encourage self-compassion
- Build on existing strengths
`;

  constructor() {}

  /**
   * Initialize the therapeutic AI service with API key
   */
  async initialize(apiKey: string): Promise<boolean> {
    try {
      console.log('Therapeutic AI: Initializing with Gemini API');
      
      this.genAI = new GoogleGenerativeAI(apiKey);
      this.model = this.genAI.getGenerativeModel({ 
        model: 'gemini-1.5-flash',
        generationConfig: {
          temperature: 0.7, // Warm but consistent responses
          topP: 0.9,
          topK: 40,
          maxOutputTokens: 1000,
        },
      });

      // Test the connection
      await this.testConnection();
      
      this.isInitialized = true;
      console.log('✅ Therapeutic AI initialized successfully');
      
      // Load conversation history
      await this.loadConversationHistory();
      
      return true;
    } catch (error) {
      console.error('❌ Therapeutic AI initialization failed:', error);
      this.isInitialized = false;
      return false;
    }
  }

  /**
   * Test API connection
   */
  private async testConnection(): Promise<void> {
    if (!this.model) throw new Error('Model not initialized');
    
    const testPrompt = "Hello, I'm testing the connection.";
    await this.model.generateContent(testPrompt);
  }

  /**
   * Generate therapeutic response based on user message and context
   */
  async generateTherapeuticResponse(request: TherapyRequest): Promise<TherapyResponse> {
    if (!this.isInitialized || !this.model) {
      return this.getFallbackResponse(request);
    }

    try {
      const therapeuticPrompt = this.buildTherapeuticPrompt(request);
      console.log('Therapeutic AI: Generating response for:', request.actionType || 'conversation');

      const result = await this.model.generateContent(therapeuticPrompt);
      const content = result.response.text();
      
      // Determine response type based on content and action
      const responseType = this.determineResponseType(content, request.actionType);
      
      // Add to conversation history
      this.conversationHistory.push(
        { role: 'user', content: request.message, timestamp: new Date() },
        { role: 'therapist', content: content, timestamp: new Date() }
      );
      
      // Save conversation history (keep last 20 exchanges)
      if (this.conversationHistory.length > 40) {
        this.conversationHistory = this.conversationHistory.slice(-40);
      }
      await this.saveConversationHistory();

      return {
        content,
        type: responseType,
        suggestedActions: this.extractSuggestedActions(content),
        timestamp: new Date(),
      };

    } catch (error) {
      console.error('Therapeutic AI: Error generating response:', error);
      return this.getFallbackResponse(request);
    }
  }

  /**
   * Build therapeutic prompt with context and conversation history
   */
  private buildTherapeuticPrompt(request: TherapyRequest): string {
    const { message, context, actionType } = request;
    
    let prompt = `${this.THERAPIST_PERSONALITY}\n\n`;
    
    // Add user context
    prompt += `USER RECOVERY CONTEXT:
- Current streak: ${context.currentStreak} days clean
- Total recovery time: ${context.totalDays} days
- Recent milestones: ${context.recentMilestones?.map(m => `${m.title} (${m.value} days)`).join(', ') || 'None yet'}
- Current goals: ${context.goals?.join(', ') || 'Building healthy habits'}
`;

    // Add conversation history for context
    if (this.conversationHistory.length > 0) {
      prompt += `\nRECENT CONVERSATION HISTORY:\n`;
      const recentHistory = this.conversationHistory.slice(-6); // Last 3 exchanges
      recentHistory.forEach(entry => {
        prompt += `${entry.role.toUpperCase()}: ${entry.content}\n`;
      });
      prompt += '\n';
    }

    // Add action-specific guidance
    if (actionType) {
      const actionGuidance = this.getActionSpecificGuidance(actionType);
      prompt += `THERAPEUTIC FOCUS: ${actionGuidance}\n\n`;
    }

    prompt += `USER'S CURRENT MESSAGE: "${message}"\n\n`;
    prompt += `Please respond as a warm, professional therapist. Provide a supportive, thoughtful response that acknowledges their recovery journey and offers appropriate therapeutic guidance. Keep your response conversational, empathetic, and around 2-3 sentences.`;

    return prompt;
  }

  /**
   * Get action-specific therapeutic guidance
   */
  private getActionSpecificGuidance(actionType: string): string {
    const guidance = {
      'general_support': 'Provide general emotional support and validation. Focus on their strength and resilience.',
      'crisis_intervention': 'This is a crisis moment. Be immediately supportive, offer grounding techniques, and remind them of their coping strategies.',
      'motivational_boost': 'Provide encouragement and motivation. Highlight their progress and remind them of their goals.',
      'coping_guidance': 'Offer practical coping strategies and techniques they can use right now.',
      'progress_insight': 'Help them reflect on their journey and recognize patterns or progress they might not see.',
      'milestone_celebration': 'Celebrate their achievement while encouraging continued progress.'
    };
    
    return guidance[actionType as keyof typeof guidance] || guidance.general_support;
  }

  /**
   * Determine response type from content and action
   */
  private determineResponseType(content: string, actionType?: string): 'support' | 'intervention' | 'celebration' | 'guidance' {
    if (actionType === 'crisis_intervention') return 'intervention';
    if (actionType === 'milestone_celebration') return 'celebration';
    if (actionType === 'coping_guidance') return 'guidance';
    
    // Analyze content for type
    const lowerContent = content.toLowerCase();
    if (lowerContent.includes('celebrate') || lowerContent.includes('congratulations')) return 'celebration';
    if (lowerContent.includes('crisis') || lowerContent.includes('immediate')) return 'intervention';
    if (lowerContent.includes('strategy') || lowerContent.includes('technique')) return 'guidance';
    
    return 'support';
  }

  /**
   * Extract suggested actions from AI response
   */
  private extractSuggestedActions(content: string): string[] {
    const actions: string[] = [];
    
    // Look for action-oriented phrases
    const actionPatterns = [
      /try (.+?)(?:\.|$)/gi,
      /consider (.+?)(?:\.|$)/gi,
      /practice (.+?)(?:\.|$)/gi,
      /focus on (.+?)(?:\.|$)/gi,
    ];

    actionPatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const action = match.replace(pattern, '$1').trim();
          if (action.length > 5 && action.length < 50) {
            actions.push(action);
          }
        });
      }
    });

    return actions.slice(0, 3); // Return max 3 actions
  }

  /**
   * Get fallback response when AI is unavailable
   */
  private getFallbackResponse(request: TherapyRequest): TherapyResponse {
    const { actionType, context } = request;
    
    const fallbackResponses = {
      'general_support': [
        `I'm here to support you through your recovery journey. You've come ${context.currentStreak} days, which shows incredible strength and determination.`,
        `Your commitment to recovery is admirable. Every day like today is a step forward in building the life you want.`,
        `I want you to know that what you're feeling right now is valid, and you have the tools within you to navigate this moment.`
      ],
      'crisis_intervention': [
        `This difficult moment will pass. Take three deep breaths with me. You've gotten through ${context.currentStreak} days of recovery - you have the strength to get through this too.`,
        `I hear that you're struggling right now. Let's focus on this moment. What is one small thing you can do right now to take care of yourself?`,
        `You reached out, and that shows courage. Your ${context.currentStreak}-day streak shows you have coping skills that work. What has helped you before?`
      ],
      'motivational_boost': [
        `Look at what you've accomplished - ${context.currentStreak} days of choosing recovery! That's not luck, that's your strength and commitment showing up every day.`,
        `Recovery isn't about perfection, it's about progress. And you're making progress every single day, including today.`,
        `You've proven to yourself that you can do hard things. ${context.currentStreak} days is evidence of your resilience and determination.`
      ],
      'coping_guidance': [
        `When you feel overwhelmed, try the 5-4-3-2-1 grounding technique: 5 things you see, 4 you hear, 3 you touch, 2 you smell, 1 you taste.`,
        `Remember that urges are temporary - they peak and then they pass. You can ride this wave by focusing on your breathing or doing a quick physical activity.`,
        `Your ${context.currentStreak} days show you already have effective coping strategies. What techniques have worked best for you in the past?`
      ],
      'progress_insight': [
        `In ${context.currentStreak} days, you've been building new neural pathways and healthy habits. That's significant progress, even if it doesn't always feel that way.`,
        `Recovery is often two steps forward, one step back. But looking at your ${context.currentStreak}-day journey, you're clearly moving in the right direction.`,
        `Each day of recovery teaches you something new about yourself. What insights have you gained during these ${context.currentStreak} days?`
      ],
      'milestone_celebration': [
        `Congratulations on this milestone! ${context.currentStreak} days represents your dedication, courage, and commitment to your wellbeing. You should feel proud.`,
        `This achievement is worth celebrating! Every milestone in recovery is evidence of your strength and your choice to prioritize your health and happiness.`,
        `What an incredible accomplishment! ${context.currentStreak} days shows that recovery is possible and that you have what it takes to keep going.`
      ]
    };

    const responses = fallbackResponses[actionType as keyof typeof fallbackResponses] || fallbackResponses.general_support;
    const randomResponse = responses[Math.floor(Math.random() * responses.length)];
    
    return {
      content: randomResponse,
      type: actionType === 'crisis_intervention' ? 'intervention' : 
            actionType === 'milestone_celebration' ? 'celebration' : 'support',
      timestamp: new Date(),
    };
  }

  /**
   * Load conversation history from storage
   */
  private async loadConversationHistory(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem('therapeutic_conversation_history');
      if (stored) {
        const parsed = JSON.parse(stored);
        this.conversationHistory = parsed.map((entry: any) => ({
          ...entry,
          timestamp: new Date(entry.timestamp),
        }));
      }
    } catch (error) {
      console.error('Failed to load conversation history:', error);
    }
  }

  /**
   * Save conversation history to storage
   */
  private async saveConversationHistory(): Promise<void> {
    try {
      await AsyncStorage.setItem(
        'therapeutic_conversation_history',
        JSON.stringify(this.conversationHistory)
      );
    } catch (error) {
      console.error('Failed to save conversation history:', error);
    }
  }

  /**
   * Clear conversation history
   */
  async clearConversationHistory(): Promise<void> {
    this.conversationHistory = [];
    await AsyncStorage.removeItem('therapeutic_conversation_history');
  }

  /**
   * Check if service is available
   */
  isAvailable(): boolean {
    return this.isInitialized;
  }

  /**
   * Get service status
   */
  getStatus() {
    return {
      initialized: this.isInitialized,
      conversationLength: this.conversationHistory.length,
      hasModel: !!this.model,
    };
  }
}

// Export singleton instance
export const therapeuticAIService = new TherapeuticAIService();
