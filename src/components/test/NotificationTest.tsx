/**
 * Notification Test Component
 * Test component to verify focus session and countdown notifications work properly
 */
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useAppTheme } from '../../theme/nativewind-setup';
import { AnimatedButton } from '../ui';
import { notificationService } from '../../services/notifications/NotificationService';
import { useFocusStore } from '../../store/focus-store';

export const NotificationTest: React.FC = () => {
  const { colors } = useAppTheme();
  const [notificationStatus, setNotificationStatus] = useState(notificationService.getNotificationStatus());
  const { startSession, stopSession, currentSession, timer } = useFocusStore();

  // Update notification status every second
  useEffect(() => {
    const interval = setInterval(() => {
      setNotificationStatus(notificationService.getNotificationStatus());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleStartFocusSession = async () => {
    try {
      await startSession(5, ['com.instagram.android', 'com.twitter.android'], ['facebook.com', 'twitter.com']);
      Alert.alert('Success', 'Focus session started! Check your notification panel.');
    } catch (error) {
      Alert.alert('Error', 'Failed to start focus session');
      console.error('Focus session error:', error);
    }
  };

  const handleStopFocusSession = async () => {
    try {
      await stopSession();
      Alert.alert('Success', 'Focus session stopped! Notification should be removed.');
    } catch (error) {
      Alert.alert('Error', 'Failed to stop focus session');
      console.error('Stop session error:', error);
    }
  };

  const handleStartCountdown = async () => {
    try {
      const endTime = Date.now() + (5 * 60 * 1000); // 5 minutes for testing
      await notificationService.startCountdownNotification(endTime);
      Alert.alert('Success', 'Countdown notification started! Check your notification panel.\n\n(Using 5 minutes for testing instead of 2 hours)');
    } catch (error) {
      Alert.alert('Error', 'Failed to start countdown notification');
      console.error('Countdown error:', error);
    }
  };

  const handleStopCountdown = async () => {
    try {
      await notificationService.stopCountdownNotification();
      Alert.alert('Success', 'Countdown notification stopped! Notification should be removed.');
    } catch (error) {
      Alert.alert('Error', 'Failed to stop countdown notification');
      console.error('Stop countdown error:', error);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>
        📱 Notification System Test
      </Text>

      {/* Notification Status */}
      <View style={[styles.statusCard, { backgroundColor: colors.surface }]}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>
          Current Notification Status
        </Text>
        
        <View style={styles.statusRow}>
          <Text style={[styles.statusLabel, { color: colors.textSecondary }]}>
            Focus Session:
          </Text>
          <Text style={[styles.statusValue, { 
            color: notificationStatus.focusSession ? '#10b981' : '#ef4444' 
          }]}>
            {notificationStatus.focusSession ? '🟢 Active' : '🔴 Inactive'}
          </Text>
        </View>

        <View style={styles.statusRow}>
          <Text style={[styles.statusLabel, { color: colors.textSecondary }]}>
            Countdown:
          </Text>
          <Text style={[styles.statusValue, { 
            color: notificationStatus.countdown ? '#10b981' : '#ef4444' 
          }]}>
            {notificationStatus.countdown ? '🟢 Active' : '🔴 Inactive'}
          </Text>
        </View>

        {currentSession && (
          <View style={styles.statusRow}>
            <Text style={[styles.statusLabel, { color: colors.textSecondary }]}>
              Session Time:
            </Text>
            <Text style={[styles.statusValue, { color: colors.text }]}>
              {formatTime(timer.remainingTime)}
            </Text>
          </View>
        )}

        {notificationStatus.countdownData && (
          <View style={styles.statusRow}>
            <Text style={[styles.statusLabel, { color: colors.textSecondary }]}>
              Countdown:
            </Text>
            <Text style={[styles.statusValue, { color: colors.text }]}>
              {notificationService.formatRemainingTime(notificationStatus.countdownData.remainingMinutes)}
            </Text>
          </View>
        )}
      </View>

      {/* Focus Session Tests */}
      <View style={[styles.testSection, { backgroundColor: colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          🎯 Focus Session Notifications
        </Text>
        
        <Text style={[styles.description, { color: colors.textSecondary }]}>
          Test focus session notifications that update every minute with remaining time.
        </Text>

        <View style={styles.buttonRow}>
          <AnimatedButton
            title="Start Session"
            variant="primary"
            size="small"
            onPress={handleStartFocusSession}
            disabled={notificationStatus.focusSession}
            style={{ flex: 1, marginRight: 8 }}
          />
          
          <AnimatedButton
            title="Stop Session"
            variant="danger"
            size="small"
            onPress={handleStopFocusSession}
            disabled={!notificationStatus.focusSession}
            style={{ flex: 1, marginLeft: 8 }}
          />
        </View>
      </View>

      {/* Countdown Tests */}
      <View style={[styles.testSection, { backgroundColor: colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          ⏰ Countdown Notifications
        </Text>
        
        <Text style={[styles.description, { color: colors.textSecondary }]}>
          Test permanent blocking countdown notifications (using 5 minutes for testing).
        </Text>

        <View style={styles.buttonRow}>
          <AnimatedButton
            title="Start Countdown"
            variant="accent"
            size="small"
            onPress={handleStartCountdown}
            disabled={notificationStatus.countdown}
            style={{ flex: 1, marginRight: 8 }}
          />
          
          <AnimatedButton
            title="Stop Countdown"
            variant="danger"
            size="small"
            onPress={handleStopCountdown}
            disabled={!notificationStatus.countdown}
            style={{ flex: 1, marginLeft: 8 }}
          />
        </View>
      </View>

      {/* Instructions */}
      <View style={[styles.instructionsCard, { backgroundColor: colors.surface }]}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>
          📋 Testing Instructions
        </Text>
        
        <Text style={[styles.instructions, { color: colors.textSecondary }]}>
          1. <Text style={{ fontWeight: '600' }}>Start Focus Session:</Text> Check notification panel for "Focus Session Active"{'\n'}
          2. <Text style={{ fontWeight: '600' }}>Background App:</Text> Notification should persist and update{'\n'}
          3. <Text style={{ fontWeight: '600' }}>Start Countdown:</Text> Check for "VOLT Countdown" notification{'\n'}
          4. <Text style={{ fontWeight: '600' }}>Close App:</Text> Notifications should continue running{'\n'}
          5. <Text style={{ fontWeight: '600' }}>Stop Services:</Text> Notifications should disappear
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  statusCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  statusValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  testSection: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  buttonRow: {
    flexDirection: 'row',
  },
  instructionsCard: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  instructions: {
    fontSize: 14,
    lineHeight: 20,
  },
});

export default NotificationTest;