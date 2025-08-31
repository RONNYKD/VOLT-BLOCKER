/**
 * Test component to verify BlocksScreen enhancements
 */
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useAppTheme } from '../../theme/nativewind-setup';
import { AnimatedButton } from '../ui';

export const BlocksScreenTest: React.FC = () => {
  const { colors } = useAppTheme();
  const [isPermanentBlocking, setIsPermanentBlocking] = React.useState(false);
  const [isBlockingActive, setIsBlockingActive] = React.useState(true);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>
        🎨 Enhanced BlocksScreen UI Test
      </Text>

      {/* Enhanced Permanent Blocking Card */}
      <View style={[styles.permanentBlockingContainer, { marginHorizontal: 20, marginBottom: 20 }]}>
        <LinearGradient
          colors={isPermanentBlocking ? ['#ff4757', '#ff6b35'] : ['#1e40af', '#3b82f6']}
          style={styles.permanentBlockingGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <View style={styles.permanentBlockingHeader}>
            <View style={styles.permanentBlockingLeft}>
              <Text style={[styles.permanentBlockingIcon, { color: '#fff' }]}>
                {isPermanentBlocking ? '🔒' : '🔓'}
              </Text>
              <View>
                <Text style={[styles.permanentBlockingTitle, { color: '#fff' }]}>
                  {isPermanentBlocking ? 'Permanent Blocking Active' : 'Regular Blocking Mode'}
                </Text>
                <Text style={[styles.permanentBlockingSubtext, { color: 'rgba(255,255,255,0.9)' }]}>
                  {isPermanentBlocking 
                    ? '🛡️ Maximum protection - 2-hour delay to disable' 
                    : '⚡ Quick mode - can be disabled instantly'
                  }
                </Text>
              </View>
            </View>
            <AnimatedButton
              title={isPermanentBlocking ? 'Manage' : 'Upgrade'}
              variant="ghost"
              size="small"
              onPress={() => setIsPermanentBlocking(!isPermanentBlocking)}
              enableHaptics={true}
              style={{ 
                backgroundColor: 'rgba(255,255,255,0.2)', 
                borderColor: 'rgba(255,255,255,0.3)' 
              }}
              textStyle={{ color: '#fff', fontWeight: '600' }}
            />
          </View>
        </LinearGradient>
      </View>

      {/* Interactive Blocking Status */}
      <TouchableOpacity 
        style={[styles.statusSection, { backgroundColor: colors.surface }]}
        onPress={() => setIsBlockingActive(!isBlockingActive)}
        activeOpacity={0.7}
      >
        <View style={styles.statusHeader}>
          <View style={styles.statusLeft}>
            <Text style={[styles.statusIcon, { color: isBlockingActive ? '#00d4aa' : '#666' }]}>
              {isBlockingActive ? '🛡️' : '⏸️'}
            </Text>
            <View>
              <Text style={[styles.statusTitle, { color: colors.text }]}>
                {isBlockingActive ? 'Blocking Active' : 'Blocking Paused'}
              </Text>
              <Text style={[styles.statusSubtext, { color: colors.textSecondary }]}>
                5 items blocked
                {isPermanentBlocking && ' • Permanent Mode'}
                {isBlockingActive && ' • Tap for details'}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>

      <Text style={[styles.testInfo, { color: colors.textSecondary }]}>
        ✅ Enhanced permanent blocking card with gradient{'\n'}
        ✅ Interactive blocking status with tap feedback{'\n'}
        ✅ Clear visual hierarchy and professional styling{'\n'}
        ✅ Consistent with "Calm Authority" theme
      </Text>
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
    marginBottom: 30,
  },
  testInfo: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 20,
    textAlign: 'center',
  },
  
  // Enhanced Permanent Blocking Styles
  permanentBlockingContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  permanentBlockingGradient: {
    padding: 20,
    borderRadius: 16,
  },
  permanentBlockingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  permanentBlockingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  permanentBlockingIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  permanentBlockingTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  permanentBlockingSubtext: {
    fontSize: 14,
    fontWeight: '500',
  },
  
  // Status Section
  statusSection: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statusIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 2,
  },
  statusSubtext: {
    fontSize: 14,
  },
});

export default BlocksScreenTest;