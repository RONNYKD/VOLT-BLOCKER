/**
 * Timer Test Component
 * Test component to verify focus session timer is working correctly
 */
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAppTheme } from '../../theme/nativewind-setup';
import { AnimatedButton } from '../ui';
import { useFocusStore } from '../../store/focus-store';

export const TimerTest: React.FC = () => {
  const { colors } = useAppTheme();
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());
  
  const { 
    currentSession, 
    timer, 
    startSession, 
    stopSession, 
    pauseSession, 
    resumeSession,
    getFormattedTime 
  } = useFocusStore();

  // Update current time every second for reference
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleStartTest = () => {
    // Start a 2-minute test session
    startSession(2, ['com.test.app'], ['test.com']);
  };

  const formatSessionTime = () => {
    if (!currentSession) return 'No session';
    const startTime = new Date(currentSession.startTime);
    const elapsed = Math.floor((Date.now() - startTime.getTime()) / 1000);
    return `Started: ${startTime.toLocaleTimeString()}, Elapsed: ${elapsed}s`;
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>
        🕐 Timer Test Component
      </Text>

      {/* Current Time Reference */}
      <View style={[styles.card, { backgroundColor: colors.surface }]}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>
          Current Time
        </Text>
        <Text style={[styles.timeText, { color: colors.text }]}>
          {currentTime}
        </Text>
      </View>

      {/* Session Status */}
      <View style={[styles.card, { backgroundColor: colors.surface }]}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>
          Session Status
        </Text>
        <Text style={[styles.statusText, { color: currentSession ? '#10b981' : '#ef4444' }]}>
          {currentSession ? `Active (${currentSession.status})` : 'No Active Session'}
        </Text>
        {currentSession && (
          <Text style={[styles.detailText, { color: colors.textSecondary }]}>
            {formatSessionTime()}
          </Text>
        )}
      </View>

      {/* Timer State */}
      <View style={[styles.card, { backgroundColor: colors.surface }]}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>
          Timer State
        </Text>
        <Text style={[styles.timerText, { color: colors.text }]}>
          {getFormattedTime(timer.remainingTime)}
        </Text>
        <Text style={[styles.detailText, { color: colors.textSecondary }]}>
          Total: {getFormattedTime(timer.totalTime)} | 
          Running: {timer.isRunning ? '✅' : '❌'} | 
          Paused: {timer.isPaused ? '✅' : '❌'}
        </Text>
        <Text style={[styles.detailText, { color: colors.textSecondary }]}>
          Remaining Seconds: {timer.remainingTime}
        </Text>
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        {!currentSession ? (
          <AnimatedButton
            title="Start 2-Min Test"
            variant="primary"
            onPress={handleStartTest}
            style={styles.button}
          />
        ) : (
          <View style={styles.buttonRow}>
            {timer.isPaused ? (
              <AnimatedButton
                title="Resume"
                variant="secondary"
                size="small"
                onPress={resumeSession}
                style={styles.smallButton}
              />
            ) : (
              <AnimatedButton
                title="Pause"
                variant="accent"
                size="small"
                onPress={pauseSession}
                style={styles.smallButton}
              />
            )}
            <AnimatedButton
              title="Stop"
              variant="danger"
              size="small"
              onPress={stopSession}
              style={styles.smallButton}
            />
          </View>
        )}
      </View>

      {/* Instructions */}
      <View style={[styles.card, { backgroundColor: colors.surface }]}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>
          🧪 Test Instructions
        </Text>
        <Text style={[styles.instructionText, { color: colors.textSecondary }]}>
          1. Start a 2-minute test session{'\n'}
          2. Watch the timer countdown in real-time{'\n'}
          3. Check notification panel for updates{'\n'}
          4. Timer should update every second{'\n'}
          5. Notification should update every 30 seconds{'\n'}
          6. Test pause/resume functionality
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
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  timeText: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  timerText: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
  instructionText: {
    fontSize: 14,
    lineHeight: 20,
  },
  controls: {
    marginBottom: 16,
  },
  button: {
    marginBottom: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
  },
  smallButton: {
    flex: 1,
  },
});

export default TimerTest;