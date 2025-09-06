/**
 * AI Recovery Coach Screen - Modern interface for AI-powered recovery support
 * Provides access to recovery coaching, milestone tracking, and crisis intervention
 * Redesigned with beautiful, modern UI matching VOLT theme
 */
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Animated,
  StyleSheet,
  Dimensions,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { 
  MessageCircle, 
  Award, 
  TrendingUp, 
  Shield, 
  Send, 
  Sparkles,
  Heart,
  Target,
  Calendar,
  AlertTriangle,
  Brain,
  Zap
} from 'lucide-react-native';
import { useAppTheme } from '../../theme/nativewind-setup';
import { therapeuticAIService, TherapyContext, TherapyRequest } from '../../services/ai/TherapeuticAIService';
import { milestoneCelebrationService } from '../../services/ai/recovery/MilestoneCelebrationService';
import { predictiveInterventionEngine } from '../../services/ai/recovery/PredictiveInterventionEngine';

const { width } = Dimensions.get('window');

interface ChatMessage {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  type?: 'celebration' | 'intervention' | 'support' | 'milestone';
}

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  color: string;
  type: 'general_support' | 'crisis_intervention' | 'motivational_boost' | 'coping_guidance' | 'progress_insight' | 'milestone_celebration';
}

export const AICoachScreen: React.FC = () => {
  const { isDark } = useAppTheme();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [upcomingMilestones, setUpcomingMilestones] = useState<any[]>([]);
  const flatListRef = useRef<FlatList>(null);
  const celebrationAnimation = useRef(new Animated.Value(0)).current;

  const quickActions: QuickAction[] = [
    {
      id: '1',
      title: 'Need Support',
      description: 'Get encouragement and guidance',
      icon: Heart,
      color: '#00d4aa',
      type: 'general_support',
    },
    {
      id: '2',
      title: 'Crisis Help',
      description: 'Immediate support when triggered',
      icon: AlertTriangle,
      color: '#ff4757',
      type: 'crisis_intervention',
    },
    {
      id: '3',
      title: 'Motivation',
      description: 'Boost your recovery energy',
      icon: Sparkles,
      color: '#00ffff',
      type: 'motivational_boost',
    },
    {
      id: '4',
      title: 'Coping Tools',
      description: 'Learn effective techniques',
      icon: Shield,
      color: '#00d4aa',
      type: 'coping_guidance',
    },
    {
      id: '5',
      title: 'My Progress',
      description: 'View recovery insights',
      icon: TrendingUp,
      color: '#00ffff',
      type: 'progress_insight',
    },
    {
      id: '6',
      title: 'Milestones',
      description: 'Celebrate achievements',
      icon: Award,
      color: '#ff6b35',
      type: 'milestone_celebration',
    },
  ];

  useEffect(() => {
    initializeTherapeuticAI();
    initializeAICoach();
    loadUpcomingMilestones();
    // Remove risk assessment as it's handled by therapeutic conversation
  }, []);

  const initializeTherapeuticAI = async () => {
    try {
      const apiKey = 'AIzaSyDzjJC1wa5OHAQQMiVjF0US4DzTu0L3k3Q'; // Your provided API key
      const success = await therapeuticAIService.initialize(apiKey);
      if (success) {
        console.log('✅ Therapeutic AI initialized successfully');
      } else {
        console.warn('⚠️ Therapeutic AI failed to initialize, using fallback responses');
      }
    } catch (error) {
      console.error('❌ Error initializing Therapeutic AI:', error);
    }
  };

  const initializeAICoach = () => {
    // Set a demo streak for initial display
    setCurrentStreak(7); // Example: 7 days streak
    
    const welcomeMessage: ChatMessage = {
      id: '1',
      content: "Hello! I'm your personal recovery therapist. I've been following your progress, and I'm really proud of how you've been showing up for yourself. Having reached 7 days is a meaningful step in your journey. I'm here to listen, support, and guide you through whatever you're experiencing today. How are you feeling right now?",
      isUser: false,
      timestamp: new Date(),
      type: 'support',
    };
    setMessages([welcomeMessage]);
  };

  const loadUpcomingMilestones = async () => {
    try {
      const milestones = await milestoneCelebrationService.getUpcomingMilestones('current_user');
      setUpcomingMilestones(milestones);
      
      if (milestones.length > 0) {
        const nextMilestone = milestones[0];
        setCurrentStreak(nextMilestone.progress);
      }
    } catch (error) {
      console.error('Failed to load milestones:', error);
    }
  };

  // Simplified milestone checking without complex dependencies
  const checkForMilestones = async () => {
    // For now, we'll simulate milestone checking
    // In the future, this can be integrated with actual milestone tracking
    console.log('Checking for milestones...');
  };

  const showMilestoneCelebration = (milestone: any) => {
    // Trigger celebration animation
    Animated.sequence([
      Animated.timing(celebrationAnimation, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(celebrationAnimation, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();

    const celebrationMessage: ChatMessage = {
      id: Date.now().toString(),
      content: `🎉 ${milestone.title}! ${milestone.description} You've achieved ${milestone.value} ${milestone.unit} - that's incredible progress!`,
      isUser: false,
      timestamp: new Date(),
      type: 'celebration',
    };

    setMessages(prev => [...prev, celebrationMessage]);
    
    // Show system alert
    Alert.alert(
      '🎉 Milestone Achieved!',
      `${milestone.title}\n\n${milestone.description}`,
      [{ text: 'Awesome!', style: 'default' }]
    );
  };

  const handleQuickAction = async (action: QuickAction) => {
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: `I selected: ${action.title}`,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Build therapy context with current user data
      const therapyContext: TherapyContext = {
        currentStreak: currentStreak,
        totalDays: currentStreak, // For now, assume total equals current streak
        recentMilestones: upcomingMilestones.map(m => ({
          title: m.title || 'Recovery Milestone',
          date: new Date().toISOString().split('T')[0],
          value: m.progress || currentStreak
        })),
        goals: ['Stay clean', 'Build healthy habits', 'Improve mental health'],
        strugglingAreas: action.type === 'crisis_intervention' ? ['Triggers', 'Cravings'] : undefined
      };

      const therapyRequest: TherapyRequest = {
        message: `I need ${action.title.toLowerCase()}. ${action.description}`,
        context: therapyContext,
        actionType: action.type
      };

      const response = await therapeuticAIService.generateTherapeuticResponse(therapyRequest);

      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: response.content,
        isUser: false,
        timestamp: new Date(),
        type: response.type,
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Therapeutic AI request failed:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: `I understand you're looking for ${action.title.toLowerCase()}. While I'm having some technical difficulties right now, I want you to know that reaching out shows real strength. You've made it ${currentStreak} days, and that's something to be proud of. Let's focus on what's working for you today.`,
        isUser: false,
        timestamp: new Date(),
        type: 'support',
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: inputText.trim(),
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    const messageText = inputText.trim();
    setInputText('');
    setIsLoading(true);

    try {
      // Determine interaction type based on message content
      let actionType: 'general_support' | 'crisis_intervention' | 'motivational_boost' | 'coping_guidance' | 'progress_insight' | 'milestone_celebration' = 'general_support';
      const lowerText = messageText.toLowerCase();
      
      if (lowerText.includes('crisis') || lowerText.includes('harm') || lowerText.includes('suicidal') || lowerText.includes('urge') || lowerText.includes('relapse')) {
        actionType = 'crisis_intervention';
      } else if (lowerText.includes('motivat') || lowerText.includes('inspire') || lowerText.includes('encourage')) {
        actionType = 'motivational_boost';
      } else if (lowerText.includes('cop') || lowerText.includes('strateg') || lowerText.includes('technique') || lowerText.includes('help')) {
        actionType = 'coping_guidance';
      } else if (lowerText.includes('progress') || lowerText.includes('insight') || lowerText.includes('journey')) {
        actionType = 'progress_insight';
      } else if (lowerText.includes('milestone') || lowerText.includes('achievement') || lowerText.includes('celebrate')) {
        actionType = 'milestone_celebration';
      }

      // Build therapy context
      const therapyContext: TherapyContext = {
        currentStreak: currentStreak,
        totalDays: currentStreak,
        recentMilestones: upcomingMilestones.map(m => ({
          title: m.title || 'Recovery Milestone',
          date: new Date().toISOString().split('T')[0],
          value: m.progress || currentStreak
        })),
        goals: ['Stay clean', 'Build healthy habits', 'Improve mental health'],
        recentMoods: [{
          mood: actionType === 'crisis_intervention' ? 'struggling' : 'hopeful',
          date: new Date().toISOString().split('T')[0]
        }]
      };

      const therapyRequest: TherapyRequest = {
        message: messageText,
        context: therapyContext,
        actionType: actionType
      };

      const response = await therapeuticAIService.generateTherapeuticResponse(therapyRequest);

      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: response.content,
        isUser: false,
        timestamp: new Date(),
        type: response.type,
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Therapeutic AI request failed:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: `Thank you for sharing with me. I'm having some connection issues right now, but I want you to know that your ${currentStreak}-day journey shows real commitment and strength. Whatever you're feeling today is valid, and you have the tools to handle it. What has been most helpful for you in the past when you've felt this way?`,
        isUser: false,
        timestamp: new Date(),
        type: 'support',
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const renderMessage = ({ item: message }: { item: ChatMessage }) => {
    const messageStyle = {
      maxWidth: '80%',
      borderRadius: 20,
      padding: 16,
      marginVertical: 6,
      marginHorizontal: 16,
      shadowColor: isDark ? '#000000' : '#6B7280',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 3,
    };

    let backgroundColor;
    let textColor;
    let alignment: 'flex-start' | 'flex-end';

    if (message.isUser) {
      backgroundColor = '#1e40af'; // VOLT primary blue
      textColor = '#ffffff';
      alignment = 'flex-end';
    } else {
      alignment = 'flex-start';
      switch (message.type) {
        case 'celebration':
          backgroundColor = isDark ? '#064e3b' : '#ecfdf5';
          textColor = isDark ? '#10b981' : '#065f46';
          break;
        case 'intervention':
          backgroundColor = isDark ? '#7c2d12' : '#fef3c7';
          textColor = isDark ? '#f59e0b' : '#92400e';
          break;
        default:
          backgroundColor = isDark ? '#374151' : '#f8fafc';
          textColor = isDark ? '#f9fafb' : '#1f2937';
      }
    }

    return (
      <View style={{ ...messageStyle, backgroundColor, alignSelf: alignment }}>
        <Text style={{ color: textColor, fontSize: 16, lineHeight: 24 }}>
          {message.content}
        </Text>
        <Text 
          style={{ 
            color: textColor, 
            opacity: 0.7, 
            fontSize: 12, 
            marginTop: 8,
            alignSelf: 'flex-end'
          }}
        >
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#111827' : '#f8fafc' }]}>
      <StatusBar backgroundColor={isDark ? '#111827' : '#f8fafc'} barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      {/* Celebration Animation Overlay */}
      <Animated.View
        style={[
          StyleSheet.absoluteFillObject,
          {
            backgroundColor: '#00d4aa22',
            opacity: celebrationAnimation,
            zIndex: 1000,
          }
        ]}
        pointerEvents="none"
      />

      {/* Elegant Header */}
      <LinearGradient
        colors={isDark ? ['#1f2937', '#111827'] : ['#ffffff', '#f8fafc']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerTitleSection}>
            <Brain size={28} color={isDark ? '#00d4aa' : '#1e40af'} />
            <View style={styles.headerText}>
              <Text style={[styles.headerTitle, { color: isDark ? '#ffffff' : '#1f2937' }]}>
                AI Recovery Coach
              </Text>
              <Text style={[styles.headerSubtitle, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                Your personalized recovery companion
              </Text>
            </View>
          </View>
          
          {/* Stats Panel */}
          <View style={styles.statsPanel}>
            <View style={[styles.statItem, { borderRightWidth: 1, borderColor: isDark ? '#374151' : '#e5e7eb' }]}>
              <Text style={[styles.statValue, { color: '#00d4aa' }]}>{currentStreak}</Text>
              <Text style={[styles.statLabel, { color: isDark ? '#9ca3af' : '#6b7280' }]}>Day Streak</Text>
            </View>
            {upcomingMilestones.length > 0 && (
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: '#00ffff' }]}>
                  {upcomingMilestones[0].target - upcomingMilestones[0].progress}
                </Text>
                <Text style={[styles.statLabel, { color: isDark ? '#9ca3af' : '#6b7280' }]}>To Milestone</Text>
              </View>
            )}
          </View>
        </View>
      </LinearGradient>

      {/* Enhanced Quick Actions */}
      <View style={styles.quickActionsContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={quickActions}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.quickActionsList}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => handleQuickAction(item)}
              disabled={isLoading}
              style={[styles.quickActionCard, { opacity: isLoading ? 0.6 : 1 }]}
            >
              <LinearGradient
                colors={[item.color, `${item.color}CC`]}
                style={styles.quickActionGradient}
              >
                <item.icon size={24} color="#ffffff" />
                <Text style={styles.quickActionTitle}>{item.title}</Text>
                <Text style={styles.quickActionDescription}>{item.description}</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Chat Messages with FlatList */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        style={styles.messagesList}
        contentContainerStyle={styles.messagesContent}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        ListFooterComponent={
          isLoading ? (
            <View style={[styles.typingIndicator, { backgroundColor: isDark ? '#374151' : '#f3f4f6' }]}>
              <View style={styles.typingDots}>
                <View style={[styles.dot, { backgroundColor: isDark ? '#9ca3af' : '#6b7280' }]} />
                <View style={[styles.dot, { backgroundColor: isDark ? '#9ca3af' : '#6b7280' }]} />
                <View style={[styles.dot, { backgroundColor: isDark ? '#9ca3af' : '#6b7280' }]} />
              </View>
              <Text style={[styles.typingText, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                AI Coach is thinking...
              </Text>
            </View>
          ) : null
        }
      />

      {/* Modern Input Section */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={[styles.inputContainer, { backgroundColor: isDark ? '#1f2937' : '#ffffff' }]}
      >
        <View style={styles.inputRow}>
          <View style={[styles.textInputContainer, { backgroundColor: isDark ? '#374151' : '#f1f5f9' }]}>
            <TextInput
              value={inputText}
              onChangeText={setInputText}
              placeholder="Share what's on your mind..."
              placeholderTextColor={isDark ? '#9ca3af' : '#64748b'}
              style={[styles.textInput, { color: isDark ? '#ffffff' : '#1e293b' }]}
              multiline
              maxLength={500}
              editable={!isLoading}
            />
          </View>
          <TouchableOpacity
            onPress={handleSendMessage}
            disabled={!inputText.trim() || isLoading}
            style={[
              styles.sendButton,
              {
                backgroundColor: (!inputText.trim() || isLoading) 
                  ? (isDark ? '#374151' : '#d1d5db') 
                  : '#1e40af'
              }
            ]}
          >
            <Send
              size={20}
              color={(!inputText.trim() || isLoading) ? '#9ca3af' : '#ffffff'}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(107, 114, 128, 0.2)',
  },
  headerContent: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  headerTitleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerText: {
    marginLeft: 12,
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 2,
    opacity: 0.8,
  },
  statsPanel: {
    flexDirection: 'row',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 16,
    padding: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
    opacity: 0.8,
  },
  quickActionsContainer: {
    marginVertical: 16,
  },
  quickActionsList: {
    paddingHorizontal: 16,
  },
  quickActionCard: {
    marginRight: 12,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  quickActionGradient: {
    width: 140,
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionTitle: {
    marginTop: 10,
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
  },
  quickActionDescription: {
    marginTop: 4,
    fontSize: 11,
    color: '#ffffff',
    opacity: 0.9,
    textAlign: 'center',
    lineHeight: 14,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    paddingBottom: 20,
  },
  typingIndicator: {
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 20,
    maxWidth: '80%',
    alignSelf: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  typingDots: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  typingText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  inputContainer: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(107, 114, 128, 0.2)',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  textInputContainer: {
    flex: 1,
    borderRadius: 24,
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  textInput: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontSize: 16,
    lineHeight: 22,
    maxHeight: 120,
    minHeight: 50,
  },
  sendButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
});
