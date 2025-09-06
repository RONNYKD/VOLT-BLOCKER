/**
 * Profile Screen - Opal-inspired settings and profile
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Moon, Sun, Bell, Settings as SettingsIcon, Shield } from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useAppTheme } from '../../theme/nativewind-setup';
import { useAuthStore, useSettingsStore, useFocusStore } from '../../store';
import type { ProfileStackScreenProps } from '../../navigation/types';

type Props = ProfileStackScreenProps<'ProfileMain'>;

export const ProfileScreen: React.FC<Props> = ({ navigation }) => {
  const { isDark, colors } = useAppTheme();
  const { user, isAuthenticated, signOut } = useAuthStore();
  const { theme, setTheme, notifications, setNotifications } = useSettingsStore();
  const { stats } = useFocusStore();

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light';
    setTheme(newTheme);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const getThemeIcon = () => {
    switch (theme) {
      case 'light':
        return <Sun size={20} color={colors.text} />;
      case 'dark':
        return <Moon size={20} color={colors.text} />;
      default:
        return <SettingsIcon size={20} color={colors.text} />;
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.appName, { color: colors.text }]}>VOLT</Text>
        <TouchableOpacity>
          <Text style={[styles.skipText, { color: colors.textSecondary }]}>Skip</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Section */}
        <View style={styles.welcomeSection}>
          <View style={styles.logoContainer}>
            <View style={[styles.logo, { backgroundColor: '#00d4aa' }]}>
              <Text style={[styles.logoText, { color: '#fff' }]}>
                {user?.username?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}
              </Text>
            </View>
          </View>
          <Text style={[styles.welcomeTitle, { color: colors.text }]}>
            {isAuthenticated ? `Hello, ${user?.username || user?.email?.split('@')[0]}!` : 'Welcome to VOLT'}
          </Text>
          <Text style={[styles.welcomeSubtitle, { color: colors.textSecondary }]}>
            {isAuthenticated ? 'Your digital wellness dashboard' : 'Let\'s get you set up for digital wellness'}
          </Text>
        </View>

        {/* Settings Section */}
        <View style={styles.settingsSection}>
          {/* Theme Setting */}
          <TouchableOpacity style={styles.settingItem} onPress={toggleTheme}>
            <View style={styles.settingLeft}>
              {getThemeIcon()}
              <Text style={[styles.settingLabel, { color: colors.text }]}>
                Theme: {theme.charAt(0).toUpperCase() + theme.slice(1)}
              </Text>
            </View>
            <Text style={[styles.settingValue, { color: colors.textSecondary }]}>›</Text>
          </TouchableOpacity>

          {/* Notifications Setting */}
          <TouchableOpacity 
            style={styles.settingItem} 
            onPress={() => setNotifications(!notifications)}
          >
            <View style={styles.settingLeft}>
              <Bell size={20} color={colors.text} />
              <Text style={[styles.settingLabel, { color: colors.text }]}>
                Notifications
              </Text>
            </View>
            <Text style={[styles.settingValue, { 
              color: notifications ? '#00d4aa' : colors.textSecondary 
            }]}>
              {notifications ? 'On' : 'Off'}
            </Text>
          </TouchableOpacity>

          {/* Uninstall Protection */}
          <TouchableOpacity 
            style={styles.settingItem} 
            onPress={() => navigation.navigate('UninstallProtection')}
          >
            <View style={styles.settingLeft}>
              <Shield size={20} color="#ff6b6b" />
              <Text style={[styles.settingLabel, { color: colors.text }]}>
                Uninstall Protection
              </Text>
            </View>
            <View style={styles.protectionBadge}>
              <Text style={[styles.settingValue, { color: '#ff6b6b' }]}>🛡️ ›</Text>
            </View>
          </TouchableOpacity>


          {/* Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: '#00d4aa' }]}>
                {stats.completedSessions}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Focus Sessions</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: '#00d4aa' }]}>
                {Math.floor(stats.totalFocusTime / 60)}h {stats.totalFocusTime % 60}m
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total Focus Time</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: '#00d4aa' }]}>
                {stats.currentStreak}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Day Streak</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonSection}>
          {isAuthenticated ? (
            <>
              <TouchableOpacity onPress={() => navigation.navigate('Focus' as any)}>
                <LinearGradient
                  colors={['#00d4aa', '#00ffff']}
                  style={styles.primaryButton}
                >
                  <Text style={[styles.primaryButtonText, { color: '#000' }]}>Start Focus Session</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.secondaryButton, { borderColor: colors.border }]}
                onPress={() => navigation.navigate('Blocks' as any)}
              >
                <Text style={[styles.secondaryButtonText, { color: colors.text }]}>
                  🛡️ Manage Blocks
                </Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.secondaryButton, { borderColor: '#ff4757' }]}
                onPress={handleSignOut}
              >
                <Text style={[styles.secondaryButtonText, { color: '#ff4757' }]}>
                  🚪 Sign Out
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity>
                <LinearGradient
                  colors={['#00d4aa', '#00ffff']}
                  style={styles.primaryButton}
                >
                  <Text style={[styles.primaryButtonText, { color: '#000' }]}>Get Started</Text>
                </LinearGradient>
              </TouchableOpacity>

              <View style={styles.divider}>
                <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
                <Text style={[styles.dividerText, { color: colors.textMuted }]}>or</Text>
                <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
              </View>

              <TouchableOpacity style={[styles.secondaryButton, { borderColor: colors.border }]}>
                <Text style={[styles.secondaryButtonText, { color: colors.text }]}>
                  🍎 Continue with Apple
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.secondaryButton, { borderColor: colors.border }]}>
                <Text style={[styles.secondaryButtonText, { color: colors.text }]}>
                  📱 Continue with Phone
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.linkButton}>
                <Text style={[styles.linkButtonText, { color: colors.textSecondary }]}>
                  Don't have an account?
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>

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
  skipText: {
    fontSize: 16,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  welcomeSection: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  logoContainer: {
    marginBottom: 30,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  welcomeSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  settingsSection: {
    marginBottom: 40,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  settingValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  buttonSection: {
    paddingBottom: 40,
  },
  primaryButton: {
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  primaryButtonText: {
    color: '#000',
    fontSize: 18,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    paddingHorizontal: 16,
    fontSize: 14,
  },
  secondaryButton: {
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  linkButton: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  linkButtonText: {
    fontSize: 16,
  },
  protectionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
});