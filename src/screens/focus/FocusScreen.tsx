/**
 * Focus Screen - Opal-inspired design with holographic crystal
 */
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { useAppTheme } from '../../theme/nativewind-setup';
import { Button } from '../../components/ui';
import { useFocusStore } from '../../store';
import type { MainTabScreenProps } from '../../navigation/types';

type Props = MainTabScreenProps<'Focus'>;

const { width } = Dimensions.get('window');

export const FocusScreen: React.FC<Props> = ({ navigation }) => {
  const { isDark, colors } = useAppTheme();
  const [showSessionModal, setShowSessionModal] = useState(false);
  
  const {
    currentSession,
    timer,
    stats,
    selectedDuration,
    setSelectedDuration,
    startSession,
    pauseSession,
    resumeSession,
    stopSession,
    updateTimer,
    getCurrentSessionProgress,
    getFormattedTime,
  } = useFocusStore();

  // Update timer every second when session is active
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timer.isRunning) {
      interval = setInterval(() => {
        updateTimer();
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer.isRunning, updateTimer]);

  const handleStartSession = () => {
    if (currentSession) {
      if (timer.isPaused) {
        resumeSession();
      } else {
        pauseSession();
      }
    } else {
      setShowSessionModal(true);
    }
  };

  const handleConfirmSession = () => {
    startSession(selectedDuration);
    setShowSessionModal(false);
  };

  const progress = getCurrentSessionProgress();
  const isSessionActive = !!currentSession;
  const displayTime = isSessionActive 
    ? getFormattedTime(timer.remainingTime)
    : `${Math.floor(stats.totalFocusTime / 60)}h ${stats.totalFocusTime % 60}m`;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.appName, { color: colors.text }]}>VOLT</Text>
        <View style={styles.headerRight}>
          <Text style={[styles.todayText, { color: colors.textSecondary }]}>
            {isSessionActive ? 'Focus Session' : 'Today ▼'}
          </Text>
          {!isSessionActive && (
            <TouchableOpacity
              style={styles.devToolsButton}
              onPress={() => navigation.navigate('Profile')}
            >
              <Text style={styles.devToolsText}>🛠️</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        {/* Timer Crystal */}
        <View style={styles.crystalContainer}>
          <View style={styles.crystalGlow}>
            <View style={styles.crystal}>
              <LinearGradient
                colors={isSessionActive 
                  ? ['#00d4aa', '#00ffff', '#00d4aa'] 
                  : ['#00ffff', '#ff00ff', '#ffff00', '#00ff00']
                }
                style={styles.crystalGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
              {/* Progress Ring */}
              {isSessionActive && (
                <View style={styles.progressRing}>
                  <Text style={styles.progressText}>{Math.round(progress)}%</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Time Display */}
        <View style={styles.timeDisplay}>
          <Text style={[styles.timeText, { color: colors.text }]}>{displayTime}</Text>
          <Text style={[styles.timeLabel, { color: colors.textSecondary }]}>
            {isSessionActive ? 'REMAINING TIME' : 'TOTAL FOCUS TIME'}
          </Text>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>SESSIONS</Text>
            <Text style={[styles.statValue, { color: colors.text }]}>{stats.completedSessions}</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>STREAK</Text>
            <Text style={[styles.statValue, { color: colors.text }]}>{stats.currentStreak}</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>AVERAGE</Text>
            <Text style={[styles.statValue, { color: colors.text }]}>{stats.averageSessionLength}m</Text>
          </View>
        </View>

        {/* Session Status */}
        {isSessionActive && (
          <View style={styles.sessionStatus}>
            <Text style={[styles.sessionText, { color: colors.text }]}>
              {timer.isPaused ? '⏸️ Session Paused' : '🎯 Focus Mode Active'}
            </Text>
            <Text style={[styles.sessionSubtext, { color: colors.textSecondary }]}>
              {currentSession?.blockedApps.length || 0} apps blocked
            </Text>
          </View>
        )}

        {/* Quick Duration Selection (when not in session) */}
        {!isSessionActive && (
          <View style={styles.durationSelector}>
            <Text style={[styles.selectorLabel, { color: colors.textSecondary }]}>Quick Start</Text>
            <View style={styles.durationButtons}>
              {[15, 25, 45, 60].map((duration) => (
                <TouchableOpacity
                  key={duration}
                  style={[
                    styles.durationButton,
                    { backgroundColor: selectedDuration === duration ? '#00d4aa' : colors.surface },
                  ]}
                  onPress={() => setSelectedDuration(duration)}
                >
                  <Text style={[
                    styles.durationText,
                    { color: selectedDuration === duration ? '#000' : colors.text }
                  ]}>
                    {duration}m
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        {isSessionActive ? (
          <View style={styles.sessionControls}>
            <TouchableOpacity
              style={[styles.controlButton, { backgroundColor: '#ff4757' }]}
              onPress={stopSession}
            >
              <Text style={styles.controlButtonText}>⏹️ Stop</Text>
            </TouchableOpacity>
            
            <TouchableOpacity onPress={handleStartSession}>
              <LinearGradient
                colors={timer.isPaused ? ['#00d4aa', '#00ffff'] : ['#ffa500', '#ff6b35']}
                style={styles.mainActionButton}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.blockButtonText}>
                  {timer.isPaused ? '▶️ Resume' : '⏸️ Pause'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity onPress={handleStartSession}>
            <LinearGradient
              colors={['#00d4aa', '#00ffff']}
              style={styles.blockButton}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.blockButtonText}>🎯 Start Focus Session</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>

      {/* Session Setup Modal */}
      <Modal
        visible={showSessionModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSessionModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Start Focus Session</Text>
            
            <View style={styles.modalDurationSelector}>
              <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>Duration</Text>
              <View style={styles.durationButtons}>
                {[15, 25, 45, 60].map((duration) => (
                  <TouchableOpacity
                    key={duration}
                    style={[
                      styles.durationButton,
                      { backgroundColor: selectedDuration === duration ? '#00d4aa' : colors.background },
                    ]}
                    onPress={() => setSelectedDuration(duration)}
                  >
                    <Text style={[
                      styles.durationText,
                      { color: selectedDuration === duration ? '#000' : colors.text }
                    ]}>
                      {duration}m
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.background }]}
                onPress={() => setShowSessionModal(false)}
              >
                <Text style={[styles.modalButtonText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity onPress={handleConfirmSession}>
                <LinearGradient
                  colors={['#00d4aa', '#00ffff']}
                  style={styles.modalButton}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={[styles.modalButtonText, { color: '#000' }]}>Start Session</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  todayText: {
    fontSize: 16,
    fontWeight: '500',
  },
  devToolsButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(155, 89, 182, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  devToolsText: {
    fontSize: 16,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  crystalContainer: {
    alignItems: 'center',
    marginVertical: 40,
  },
  crystalGlow: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(0, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#00ffff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 20,
  },
  crystal: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
  },
  crystalGradient: {
    flex: 1,
    opacity: 0.8,
  },
  timeDisplay: {
    alignItems: 'center',
    marginBottom: 30,
  },
  timeText: {
    fontSize: 48,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  timeLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  appIcons: {
    flexDirection: 'row',
    gap: 4,
  },
  appIcon: {
    width: 16,
    height: 16,
    borderRadius: 4,
  },
  chartContainer: {
    marginBottom: 30,
  },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 80,
    marginBottom: 8,
  },
  chartColumn: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 1,
  },
  chartBar: {
    width: '80%',
    borderRadius: 2,
  },
  chartLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  chartLabel: {
    fontSize: 12,
  },
  offlineSection: {
    marginBottom: 30,
  },
  offlineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  offlineIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  offlineTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  offlineTime: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  offlineSubtext: {
    fontSize: 14,
    marginLeft: 24,
  },
  buttonContainer: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  blockButton: {
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  blockButtonText: {
    color: '#000',
    fontSize: 18,
    fontWeight: '600',
  },
  progressRing: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  sessionStatus: {
    alignItems: 'center',
    marginBottom: 20,
  },
  sessionText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  sessionSubtext: {
    fontSize: 14,
  },
  durationSelector: {
    marginBottom: 20,
  },
  selectorLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: 12,
    textAlign: 'center',
  },
  durationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  durationButton: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  durationText: {
    fontSize: 16,
    fontWeight: '600',
  },
  sessionControls: {
    flexDirection: 'row',
    gap: 12,
  },
  controlButton: {
    flex: 1,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  mainActionButton: {
    flex: 2,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: width * 0.85,
    borderRadius: 20,
    padding: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 24,
  },
  modalDurationSelector: {
    marginBottom: 24,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});