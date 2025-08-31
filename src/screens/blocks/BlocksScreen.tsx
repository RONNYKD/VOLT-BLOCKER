/**
 * Blocks Screen - Opal-inspired app list with usage times
 */
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput, Switch, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { useAppTheme } from '../../theme/nativewind-setup';
import { useBlockingStore } from '../../store';
import { appBlockingService, websiteBlockingService, type InstalledApp, type DisableStatus } from '../../services/native';
import { PermanentBlockingControl } from '../../components/PermanentBlockingControl';
import { AnimatedButton, AnimatedCard, AnimatedToggle } from '../../components/ui';
import type { MainTabScreenProps } from '../../navigation/types';

type Props = MainTabScreenProps<'Blocks'>;

// Mock app data inspired by Opal
const mockApps = [
  { name: 'Opal', time: '2h 28m', category: 'Neutral', color: '#00d4aa', icon: 'O' },
  { name: 'X', time: '1h 22m', category: 'Distracting', color: '#ff4757', icon: 'X' },
  { name: 'Instagram', time: '57m 52s', category: 'Distracting', color: '#ff4757', icon: '📷' },
  { name: 'Etsy', time: '56m 34s', category: 'Distracting', color: '#ff6b35', icon: 'E' },
  { name: 'Settings', time: '25m 8s', category: 'Neutral', color: '#666', icon: 'S' },
  { name: 'CREME', time: '16m 46s', category: 'Neutral', color: '#666', icon: 'C' },
];

export const BlocksScreen: React.FC<Props> = ({ navigation }) => {
  const { isDark, colors } = useAppTheme();
  const [showAddAppModal, setShowAddAppModal] = useState(false);
  const [showWebsiteModal, setShowWebsiteModal] = useState(false);
  const [newWebsiteUrl, setNewWebsiteUrl] = useState('');
  const [activeTab, setActiveTab] = useState<'apps' | 'websites'>('apps');
  const [installedApps, setInstalledApps] = useState<InstalledApp[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isPermanentBlocking, setIsPermanentBlocking] = useState(false);
  const [showPermanentModal, setShowPermanentModal] = useState(false);

  // Countdown state
  const [disableStatus, setDisableStatus] = useState<DisableStatus>({
    isPending: false,
    canDisableNow: false,
    remainingMinutes: 0,
    status: 'no_request'
  });
  const countdownInterval = useRef<NodeJS.Timeout | null>(null);

  const {
    blockedApps,
    blockedWebsites,
    isBlockingActive,
    setBlockingActive,
    addBlockedApp,
    addBlockedWebsite,
    toggleAppBlocking,
    toggleWebsiteBlocking,
    removeBlockedApp,
    removeBlockedWebsite,
    getActiveBlockedApps,
    getActiveBlockedWebsites,
    initializeNativeService,
    requestPermissions,
    syncWithNativeService,
    initializeWebsiteBlocking,
    syncWebsitesWithNative,
  } = useBlockingStore();

  // Initialize native service and load installed apps when component mounts
  useEffect(() => {
    initializeServices();
    checkPermanentBlockingStatus();
    checkDisableStatus();
  }, []);

  // Start countdown checking when permanent blocking is active
  useEffect(() => {
    if (isPermanentBlocking) {
      startCountdownChecking();
    } else {
      stopCountdownChecking();
    }

    return () => {
      stopCountdownChecking();
    };
  }, [isPermanentBlocking]);

  // Check permanent blocking status
  const checkPermanentBlockingStatus = async () => {
    try {
      const isActive = await appBlockingService.isPermanentBlockingActive();
      setIsPermanentBlocking(isActive);
    } catch (error) {
      console.error('Failed to check permanent blocking status:', error);
    }
  };

  // Check disable status (countdown)
  const checkDisableStatus = async () => {
    try {
      const status = await appBlockingService.getDisableStatus();
      setDisableStatus(status);
    } catch (error) {
      console.error('Failed to check disable status:', error);
    }
  };

  // Start countdown checking interval
  const startCountdownChecking = () => {
    // Clear any existing interval
    stopCountdownChecking();

    // Check immediately
    checkDisableStatus();

    // Set up interval to check every 10 seconds for real-time updates
    countdownInterval.current = setInterval(() => {
      checkDisableStatus();
    }, 10000);
  };

  // Stop countdown checking interval
  const stopCountdownChecking = () => {
    if (countdownInterval.current) {
      clearInterval(countdownInterval.current);
      countdownInterval.current = null;
    }
  };

  // Format remaining time for display
  const formatRemainingTime = (remainingMinutes: number): string => {
    if (remainingMinutes <= 0) return '0m';

    const hours = Math.floor(remainingMinutes / 60);
    const minutes = Math.floor(remainingMinutes % 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  // Helper function to completely disable all blocking
  const completelyDisableBlocking = async () => {
    try {
      // Stop native blocking service
      await appBlockingService.stopBlocking();

      // Stop countdown service if running
      await appBlockingService.stopCountdownService();

      // Update all UI states
      setIsPermanentBlocking(false);
      setBlockingActive(false);

      // Reset disable status
      setDisableStatus({
        isPending: false,
        canDisableNow: false,
        remainingMinutes: 0,
        status: 'no_request'
      });

      // Sync with store
      await syncWithNativeService();
      await syncWebsitesWithNative();

      console.log('✅ All blocking completely disabled');
    } catch (error) {
      console.error('Failed to completely disable blocking:', error);
      throw error;
    }
  };



  // Handle canceling the disable request
  const handleCancelDisableRequest = async () => {
    try {
      Alert.alert(
        'Cancel Disable Request?',
        'This will cancel the countdown and keep blocking active.',
        [
          { text: 'Keep Countdown', style: 'cancel' },
          {
            text: 'Cancel Request',
            style: 'destructive',
            onPress: async () => {
              setLoading(true);
              try {
                const result = await appBlockingService.cancelDisableRequest();
                if (result.success) {
                  // Refresh status
                  await checkDisableStatus();

                  Alert.alert(
                    '✅ Request Canceled',
                    'The disable request has been canceled. Blocking remains active.',
                    [{ text: 'OK' }]
                  );
                } else {
                  Alert.alert('Error', result.message || 'Failed to cancel request');
                }
              } catch (error) {
                console.error('Failed to cancel disable request:', error);
                Alert.alert('Error', 'Failed to cancel request');
              } finally {
                setLoading(false);
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error showing cancel dialog:', error);
    }
  };

  // Handle confirming disable after countdown completes
  const handleConfirmDisable = async () => {
    try {
      Alert.alert(
        '🔓 Disable Blocking?',
        'The 2-hour delay has completed. You can now disable permanent blocking.\n\nThis will turn off all app and website blocking.',
        [
          { text: 'Keep Blocking', style: 'cancel' },
          {
            text: 'Disable Blocking',
            style: 'destructive',
            onPress: async () => {
              setLoading(true);
              try {
                const result = await appBlockingService.confirmDisableBlocking();
                if (result.success) {
                  // Completely disable all blocking
                  await completelyDisableBlocking();

                  Alert.alert(
                    '✅ Blocking Disabled',
                    'Permanent blocking has been disabled. You can now use all apps and websites freely.',
                    [{ text: 'OK' }]
                  );
                } else {
                  Alert.alert('Error', result.message || 'Failed to disable blocking');
                }
              } catch (error) {
                console.error('Failed to confirm disable blocking:', error);
                Alert.alert('Error', 'Failed to disable blocking');
              } finally {
                setLoading(false);
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error showing confirm disable dialog:', error);
    }
  };

  // Handle enabling permanent blocking
  const handleEnablePermanentBlocking = async () => {
    try {
      // Show confirmation dialog
      Alert.alert(
        '🔒 Enable Permanent Blocking',
        'Permanent blocking provides maximum protection with a 2-hour delay to disable.\n\n' +
        '• Apps and websites cannot be disabled instantly\n' +
        '• Requires 2-hour countdown to disable\n' +
        '• Helps prevent impulsive decisions\n\n' +
        'Are you sure you want to enable permanent blocking?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Enable',
            style: 'default',
            onPress: async () => {
              setLoading(true);
              try {
                const result = await appBlockingService.enablePermanentBlocking();
                if (result.success) {
                  setIsPermanentBlocking(true);
                  Alert.alert(
                    '✅ Permanent Blocking Enabled',
                    'Maximum protection is now active! Apps and websites can only be disabled after a 2-hour delay.',
                    [{ text: 'OK' }]
                  );
                } else {
                  Alert.alert('Error', result.message || 'Failed to enable permanent blocking');
                }
              } catch (error) {
                console.error('Failed to enable permanent blocking:', error);
                Alert.alert('Error', 'Failed to enable permanent blocking');
              } finally {
                setLoading(false);
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error showing permanent blocking dialog:', error);
    }
  };

  // Handle requesting disable with 2-hour countdown
  const handleRequestDisable = async () => {
    try {
      // Show warning dialog first
      Alert.alert(
        '⏰ Request Disable Blocking',
        'This will start a 2-hour countdown before blocking can be disabled.\n\n' +
        '• Countdown notification will appear in your notification panel\n' +
        '• You can cancel the request anytime during the 2 hours\n' +
        '• This delay helps prevent impulsive decisions\n\n' +
        'Do you want to start the 2-hour countdown?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Start Countdown',
            style: 'destructive',
            onPress: async () => {
              setLoading(true);
              try {
                const result = await appBlockingService.requestDisableBlocking();
                if (result.success) {
                  // Refresh permanent blocking status and disable status after request
                  await checkPermanentBlockingStatus();
                  await checkDisableStatus();

                  // Start countdown checking
                  startCountdownChecking();

                  Alert.alert(
                    '⏰ Countdown Started',
                    'Blocking will be disabled in 2 hours.\n\n📱 Check your notification panel to see the countdown timer.\n\nYou can cancel this request anytime before the countdown completes.',
                    [{ text: 'OK' }]
                  );
                } else {
                  Alert.alert('Error', result.message || 'Failed to start countdown');
                }
              } catch (error) {
                console.error('Failed to request disable:', error);
                Alert.alert('Error', 'Failed to start countdown');
              } finally {
                setLoading(false);
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error showing disable request dialog:', error);
    }
  };

  // Sync with native service when blocking state changes
  useEffect(() => {
    console.log('🔄 Blocking state changed, syncing...', {
      isBlockingActive,
      blockedAppsCount: blockedApps.length,
      blockedWebsitesCount: blockedWebsites.length,
      activeApps: getActiveBlockedApps().length,
      activeWebsites: getActiveBlockedWebsites().length
    });

    syncWithNativeService();
    syncWebsitesWithNative();
  }, [isBlockingActive, blockedApps, blockedWebsites]);

  // Additional sync when permanent blocking is disabled
  useEffect(() => {
    if (!isPermanentBlocking && !isBlockingActive) {
      // Ensure native service is fully stopped when both permanent blocking and regular blocking are off
      const ensureNativeServiceStopped = async () => {
        try {
          await appBlockingService.stopBlocking();
          console.log('✅ Ensured native blocking service is stopped');
        } catch (error) {
          console.error('Failed to ensure native service is stopped:', error);
        }
      };
      ensureNativeServiceStopped();
    }
  }, [isPermanentBlocking, isBlockingActive]);

  const initializeServices = async () => {
    try {
      console.log('🔧 Initializing native services...');

      // Initialize the native services
      const appInitialized = await initializeNativeService();
      const websiteInitialized = await initializeWebsiteBlocking();
      console.log('App blocking service initialized:', appInitialized);
      console.log('Website blocking service initialized:', websiteInitialized);

      const initialized = appInitialized;

      if (initialized) {
        // Check if we have permissions
        const hasUsageStats = await appBlockingService.hasUsageStatsPermission();
        const hasAccessibility = await appBlockingService.hasAccessibilityPermission();
        const hasPermissions = hasUsageStats && hasAccessibility;
        console.log('Has permissions:', { hasUsageStats, hasAccessibility, hasPermissions });

        if (!hasPermissions) {
          // Show permission dialog
          Alert.alert(
            'Permissions Required',
            'VOLT needs special permissions to block apps. These permissions help you stay focused during your sessions.',
            [
              {
                text: 'Later',
                style: 'cancel',
                onPress: () => loadInstalledApps(),
              },
              {
                text: 'Grant Permissions',
                onPress: async () => {
                  // Request both permissions
                  const usageStatsGranted = await appBlockingService.requestUsageStatsPermission();
                  const accessibilityGranted = await appBlockingService.requestAccessibilityPermission();
                  const granted = usageStatsGranted && accessibilityGranted;

                  if (granted) {
                    console.log('✅ Permissions granted, loading apps...');
                    await loadInstalledApps();
                  } else {
                    console.log('❌ Some permissions denied, using fallback...');
                    await loadInstalledApps();
                  }
                },
              },
            ]
          );
        } else {
          // We have permissions, load apps
          await loadInstalledApps();
        }
      } else {
        console.log('⚠️ Native service not available, using fallback...');
        await loadInstalledApps();
      }
    } catch (error) {
      console.error('Failed to initialize services:', error);
      await loadInstalledApps();
    }
  };

  const loadInstalledApps = async () => {
    try {
      setLoading(true);
      const apps = await appBlockingService.getInstalledApps();
      setInstalledApps(apps);

      // If no blocked apps exist, add some from installed apps as examples
      if (blockedApps.length === 0 && apps.length > 0) {
        // Add a few popular social media apps if they're installed
        const socialApps = apps.filter(app =>
          app.packageName.includes('instagram') ||
          app.packageName.includes('facebook') ||
          app.packageName.includes('twitter') ||
          app.packageName.includes('tiktok') ||
          app.packageName.includes('snapchat')
        );

        socialApps.slice(0, 3).forEach(app => {
          addBlockedApp({
            packageName: app.packageName,
            appName: app.appName,
            isBlocked: true,
            category: 'Social Media',
          });
        });
      }
    } catch (error) {
      console.error('Failed to load installed apps:', error);

      // Fallback to mock data if native service fails
      if (blockedApps.length === 0) {
        mockApps.forEach(app => {
          addBlockedApp({
            packageName: app.name.toLowerCase().replace(/\s+/g, '.'),
            appName: app.name,
            isBlocked: app.category === 'Distracting',
            category: app.category,
          });
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddApp = (app: InstalledApp) => {
    // Check if app is already in blocked list
    const isAlreadyBlocked = blockedApps.some(blockedApp => blockedApp.packageName === app.packageName);

    if (isAlreadyBlocked) {
      Alert.alert('App Already Added', `${app.appName} is already in your blocking list.`);
      return;
    }

    addBlockedApp({
      packageName: app.packageName,
      appName: app.appName,
      isBlocked: true,
      category: 'Distracting',
    });

    setShowAddAppModal(false);
    Alert.alert('App Added', `${app.appName} has been added to your blocking list.`);
  };

  const handleAddWebsite = async () => {
    if (!newWebsiteUrl.trim()) return;

    // Validate URL using website blocking service
    const validation = websiteBlockingService.validateUrl(newWebsiteUrl);
    if (!validation.isValid) {
      Alert.alert('Invalid URL', validation.error || 'Please enter a valid website URL');
      return;
    }

    try {
      const url = newWebsiteUrl.startsWith('http') ? newWebsiteUrl : `https://${newWebsiteUrl}`;
      const domain = new URL(url).hostname.toLowerCase();

      // Remove www. prefix for consistency
      const cleanDomain = domain.startsWith('www.') ? domain.substring(4) : domain;

      // Check if website is already blocked
      const isAlreadyBlocked = blockedWebsites.some(website => website.domain === cleanDomain);
      if (isAlreadyBlocked) {
        Alert.alert('Website Already Added', `${cleanDomain} is already in your blocking list.`);
        return;
      }

      addBlockedWebsite({
        url: newWebsiteUrl,
        domain: cleanDomain,
        title: cleanDomain,
        isBlocked: true,
        category: 'Distracting',
      });

      setNewWebsiteUrl('');
      setShowWebsiteModal(false);
      Alert.alert('Website Added', `${cleanDomain} has been added to your blocking list.`);
    } catch (error) {
      Alert.alert('Invalid URL', 'Please enter a valid website URL');
    }
  };

  // Filter installed apps based on search query and exclude already blocked apps
  const filteredInstalledApps = installedApps.filter(app => {
    const matchesSearch = app.appName.toLowerCase().includes(searchQuery.toLowerCase());
    const notAlreadyBlocked = !blockedApps.some(blockedApp => blockedApp.packageName === app.packageName);
    return matchesSearch && notAlreadyBlocked;
  });

  const handleToggleBlocking = async () => {
    if (isBlockingActive) {
      // Check if permanent blocking is active
      if (isPermanentBlocking) {
        // Show permanent blocking modal instead of regular toggle
        setShowPermanentModal(true);
        return;
      }

      // Regular blocking - show confirmation
      Alert.alert(
        'Stop Blocking',
        'Are you sure you want to stop blocking apps and websites?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Stop', style: 'destructive', onPress: async () => {
              try {
                // Use native service to stop blocking (respects permanent blocking protection)
                await appBlockingService.stopBlocking();
                setBlockingActive(false);
              } catch (error: any) {
                // Handle permanent blocking protection errors
                if (error.message?.includes('PERMANENT_BLOCKING_ACTIVE')) {
                  Alert.alert(
                    'Permanent Blocking Active',
                    'You must request to disable blocking and wait 2 hours before it can be stopped.',
                    [{ text: 'OK' }]
                  );
                } else if (error.message?.includes('DISABLE_REQUEST_PENDING')) {
                  Alert.alert(
                    'Disable Request Pending',
                    error.message,
                    [{ text: 'OK' }]
                  );
                } else {
                  Alert.alert('Error', 'Failed to stop blocking');
                }
              }
            }
          },
        ]
      );
    } else {
      // Enable blocking
      try {
        console.log('🔄 Before setBlockingActive(true), current state:', isBlockingActive);
        setBlockingActive(true);
        console.log('🔄 After setBlockingActive(true), current state:', isBlockingActive);

        // Force immediate sync with native service
        console.log('🔄 Enabling blocking - syncing with native service...');
        await syncWithNativeService();
        await syncWebsitesWithNative();

        const activeApps = getActiveBlockedApps();
        const activeWebsites = getActiveBlockedWebsites();

        // Check the state after a brief delay to see if it updated
        setTimeout(() => {
          console.log('🔄 State check after 100ms:', {
            isBlockingActive,
            storeState: useBlockingStore.getState().isBlockingActive
          });
        }, 100);

        console.log('✅ Blocking enabled:', {
          activeApps: activeApps.length,
          activeWebsites: activeWebsites.length,
          appPackages: activeApps.map(app => app.packageName),
          currentIsBlockingActive: isBlockingActive
        });

        if (activeApps.length === 0 && activeWebsites.length === 0) {
          Alert.alert(
            'No Items to Block',
            'Add some apps or websites to your blocking list first.',
            [{ text: 'OK' }]
          );
        }
      } catch (error) {
        console.error('Failed to enable blocking:', error);
        Alert.alert('Error', 'Failed to enable blocking');
        setBlockingActive(false);
      }
    }
  };

  const handleAppToggle = async (appId: string) => {
    const app = blockedApps.find(a => a.id === appId);
    if (!app) return;

    // If trying to disable an app while permanent blocking is active
    if (app.isBlocked && isPermanentBlocking) {
      Alert.alert(
        'Permanent Blocking Active',
        `Cannot disable "${app.appName}" while permanent blocking is active.\n\nUse the permanent blocking controls to request a disable with 2-hour delay.`,
        [{ text: 'OK' }]
      );
      return;
    }

    // Regular toggle
    toggleAppBlocking(appId);

    // Force sync with native service after toggle
    try {
      console.log(`🔄 App toggle: ${app.appName} -> ${!app.isBlocked ? 'BLOCKED' : 'ALLOWED'}`);
      await syncWithNativeService();
      console.log('✅ Native service synced after app toggle');
    } catch (error) {
      console.error('❌ Failed to sync after app toggle:', error);
    }
  };

  const handleWebsiteToggle = async (websiteId: string) => {
    const website = blockedWebsites.find(w => w.id === websiteId);
    if (!website) return;

    // If trying to disable a website while permanent blocking is active
    if (website.isBlocked && isPermanentBlocking) {
      Alert.alert(
        'Permanent Blocking Active',
        `Cannot disable "${website.domain}" while permanent blocking is active.\n\nUse the permanent blocking controls to request a disable with 2-hour delay.`,
        [{ text: 'OK' }]
      );
      return;
    }

    // Regular toggle
    toggleWebsiteBlocking(websiteId);

    // Force sync with native service after toggle
    try {
      console.log(`🔄 Website toggle: ${website.domain} -> ${!website.isBlocked ? 'BLOCKED' : 'ALLOWED'}`);
      await syncWebsitesWithNative();
      console.log('✅ Native service synced after website toggle');
    } catch (error) {
      console.error('❌ Failed to sync after website toggle:', error);
    }
  };

  const activeApps = getActiveBlockedApps();
  const activeWebsites = getActiveBlockedWebsites();
  const totalBlocked = activeApps.length + activeWebsites.length;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft} />
          <View style={styles.headerCenter}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Blocks</Text>
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
              Manage your restrictions
            </Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity
              style={styles.addAppButton}
              onPress={() => setShowAddAppModal(true)}
            >
              <Text style={[styles.addAppButtonText, { color: '#00d4aa' }]}>+ App</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.addWebsiteButton}
              onPress={() => setShowWebsiteModal(true)}
            >
              <Text style={[styles.addWebsiteButtonText, { color: '#00d4aa' }]}>+ Website</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Permanent Lock Section */}
      <View style={[styles.permanentLockSection, { backgroundColor: colors.surface }]}>
        <View style={styles.permanentLockHeader}>
          <View style={styles.permanentLockIcon}>
            <Text style={styles.permanentLockIconText}>🛡️</Text>
          </View>
          <Text style={[styles.permanentLockTitle, { color: '#00d4aa' }]}>
            Permanent Lock
          </Text>
        </View>
        <Text style={[styles.permanentLockDescription, { color: colors.textSecondary }]}>
          Can only be disabled after 2 hours.
        </Text>
        {/* Show countdown if disable request is pending */}
        {disableStatus.isPending ? (
          disableStatus.canDisableNow ? (
            // Countdown completed - ready to disable
            <View style={[styles.countdownContainer, { backgroundColor: '#10b981', borderColor: '#10b981' }]}>
              <View style={styles.countdownContent}>
                <Text style={styles.countdownIcon}>✅</Text>
                <View style={styles.countdownInfo}>
                  <Text style={styles.countdownTitle}>
                    Ready to Disable
                  </Text>
                  <Text style={styles.countdownTime}>
                    2-hour delay completed
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.confirmDisableButton}
                  onPress={handleConfirmDisable}
                >
                  <Text style={styles.confirmDisableButtonText}>Disable Now</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            // Countdown still active
            <View style={[styles.countdownContainer, { backgroundColor: '#ff4757', borderColor: '#ff4757' }]}>
              <View style={styles.countdownContent}>
                <Text style={styles.countdownIcon}>⏰</Text>
                <View style={styles.countdownInfo}>
                  <Text style={styles.countdownTitle}>
                    Countdown Active
                  </Text>
                  <Text style={styles.countdownTime}>
                    {formatRemainingTime(disableStatus.remainingMinutes)} remaining
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={handleCancelDisableRequest}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          )
        ) : (
          <TouchableOpacity
            style={[styles.enableLockButton, {
              backgroundColor: isPermanentBlocking ? '#00d4aa' : 'transparent',
              borderColor: '#00d4aa'
            }]}
            onPress={isPermanentBlocking ? handleRequestDisable : handleEnablePermanentBlocking}
          >
            <Text style={[styles.enableLockButtonText, {
              color: isPermanentBlocking ? '#000' : '#00d4aa'
            }]}>
              {isPermanentBlocking ? 'Request Disable' : 'Enable Lock'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Main Blocking Status Section */}
      <View style={[styles.blockingStatusSection, { backgroundColor: colors.surface }]}>
        <View style={styles.blockingStatusHeader}>
          <View style={styles.blockingStatusLeft}>
            <Text style={[styles.blockingStatusIcon, { color: isBlockingActive ? '#00d4aa' : '#666' }]}>
              {isBlockingActive ? '🛡️' : '⏸️'}
            </Text>
            <View>
              <Text style={[styles.blockingStatusTitle, { color: colors.text }]}>
                {isBlockingActive ? 'Blocking Active' : 'Blocking Paused'}
              </Text>
              <Text style={[styles.blockingStatusSubtext, { color: colors.textSecondary }]}>
                {totalBlocked} items • {isBlockingActive ? 'Apps and websites are blocked' : 'Tap to start blocking'}
              </Text>
            </View>
          </View>
          <AnimatedToggle
            value={isBlockingActive}
            onValueChange={handleToggleBlocking}
            variant={isBlockingActive ? 'success' : 'default'}
            size="medium"
            enableHaptics={true}
          />
        </View>
      </View>

      {/* Tab Selector */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'apps' && styles.activeTab]}
          onPress={() => setActiveTab('apps')}
        >
          <Text style={[
            styles.tabText,
            { color: activeTab === 'apps' ? '#00d4aa' : colors.textSecondary }
          ]}>
            Apps ({blockedApps.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'websites' && styles.activeTab]}
          onPress={() => setActiveTab('websites')}
        >
          <Text style={[
            styles.tabText,
            { color: activeTab === 'websites' ? '#00d4aa' : colors.textSecondary }
          ]}>
            Websites ({blockedWebsites.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content List */}
      <ScrollView style={styles.contentList} showsVerticalScrollIndicator={false}>
        {activeTab === 'apps' ? (
          blockedApps.map((app) => (
            <View key={app.id} style={styles.listItem}>
              <View style={styles.itemLeft}>
                <View style={[styles.itemIconContainer, {
                  backgroundColor: app.isBlocked ? '#ff4757' : '#666'
                }]}>
                  <Text style={styles.itemIcon}>
                    {app.appName.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.itemInfo}>
                  <Text style={[styles.itemName, { color: colors.text }]}>{app.appName}</Text>
                  <View style={styles.itemMeta}>
                    <View style={[
                      styles.statusDot,
                      { backgroundColor: app.isBlocked ? '#ff4757' : '#00d4aa' }
                    ]} />
                    <Text style={[styles.itemStatus, {
                      color: app.isBlocked ? '#ff4757' : colors.textSecondary
                    }]}>
                      {app.isBlocked ? 'Blocked' : 'Allowed'}
                    </Text>
                  </View>
                </View>
              </View>
              <View style={styles.itemActions}>
                <AnimatedToggle
                  value={app.isBlocked}
                  onValueChange={() => handleAppToggle(app.id)}
                  variant={app.isBlocked ? 'danger' : 'default'}
                  size="medium"
                  enableHaptics={true}
                />
              </View>
            </View>
          ))
        ) : (
          blockedWebsites.map((website) => (
            <View key={website.id} style={styles.listItem}>
              <View style={styles.itemLeft}>
                <View style={[styles.itemIconContainer, {
                  backgroundColor: website.isBlocked ? '#ff4757' : '#666'
                }]}>
                  <Text style={styles.itemIcon}>🌐</Text>
                </View>
                <View style={styles.itemInfo}>
                  <Text style={[styles.itemName, { color: colors.text }]}>{website.domain}</Text>
                  <View style={styles.itemMeta}>
                    <View style={[
                      styles.statusDot,
                      { backgroundColor: website.isBlocked ? '#ff4757' : '#00d4aa' }
                    ]} />
                    <Text style={[styles.itemStatus, {
                      color: website.isBlocked ? '#ff4757' : colors.textSecondary
                    }]}>
                      {website.isBlocked ? 'Blocked' : 'Allowed'}
                    </Text>
                  </View>
                </View>
              </View>
              <View style={styles.itemActions}>
                <AnimatedToggle
                  value={website.isBlocked}
                  onValueChange={() => handleWebsiteToggle(website.id)}
                  variant={website.isBlocked ? 'danger' : 'default'}
                  size="medium"
                  enableHaptics={true}
                />
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Add App Modal */}
      <Modal
        visible={showAddAppModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddAppModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.appModalContent, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Add App to Block</Text>

            <TextInput
              style={[styles.textInput, {
                backgroundColor: colors.background,
                color: colors.text,
                borderColor: colors.border
              }]}
              placeholder="Search installed apps..."
              placeholderTextColor={colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
            />

            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#00d4aa" />
                <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                  Loading installed apps...
                </Text>
              </View>
            ) : (
              <ScrollView style={styles.appsList} showsVerticalScrollIndicator={false}>
                {filteredInstalledApps.length === 0 ? (
                  <View style={styles.emptyContainer}>
                    <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                      {searchQuery ? 'No apps found matching your search' : 'No apps available to add'}
                    </Text>
                  </View>
                ) : (
                  filteredInstalledApps.map((app) => (
                    <TouchableOpacity
                      key={app.packageName}
                      style={styles.appSelectItem}
                      onPress={() => handleAddApp(app)}
                    >
                      <View style={styles.appSelectLeft}>
                        <View style={[styles.appSelectIcon, { backgroundColor: '#00d4aa' }]}>
                          <Text style={styles.appSelectIconText}>
                            {app.appName.charAt(0).toUpperCase()}
                          </Text>
                        </View>
                        <View style={styles.appSelectInfo}>
                          <Text style={[styles.appSelectName, { color: colors.text }]}>
                            {app.appName}
                          </Text>
                          <Text style={[styles.appSelectPackage, { color: colors.textSecondary }]}>
                            {app.packageName}
                          </Text>
                        </View>
                      </View>
                      <Text style={[styles.addAppButton, { color: '#00d4aa' }]}>Add</Text>
                    </TouchableOpacity>
                  ))
                )}
              </ScrollView>
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.background }]}
                onPress={() => {
                  setShowAddAppModal(false);
                  setSearchQuery('');
                }}
              >
                <Text style={[styles.modalButtonText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Website Modal */}
      <Modal
        visible={showWebsiteModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowWebsiteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Add Website to Block</Text>

            <TextInput
              style={[styles.textInput, {
                backgroundColor: colors.background,
                color: colors.text,
                borderColor: colors.border
              }]}
              placeholder="Enter website URL (e.g., facebook.com)"
              placeholderTextColor={colors.textSecondary}
              value={newWebsiteUrl}
              onChangeText={setNewWebsiteUrl}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.background }]}
                onPress={() => setShowWebsiteModal(false)}
              >
                <Text style={[styles.modalButtonText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={handleAddWebsite}>
                <LinearGradient
                  colors={['#ff4757', '#ff6b35']}
                  style={styles.modalButton}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={[styles.modalButtonText, { color: '#fff' }]}>Add Website</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>



      {/* Enhanced Blocking Details Modal */}
      <Modal
        visible={showPermanentModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPermanentModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.permanentModalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.permanentHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {isPermanentBlocking ? '🔒 Permanent Blocking Details' : '🛡️ Blocking Control'}
              </Text>
              <TouchableOpacity
                onPress={() => setShowPermanentModal(false)}
                style={styles.closeButton}
              >
                <Text style={[styles.closeButtonText, { color: colors.text }]}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.permanentContent}
              showsVerticalScrollIndicator={true}
              indicatorStyle="default"
              scrollIndicatorInsets={{ right: 2 }}
            >
              {/* Blocking Status Summary */}
              <View style={[styles.blockingSummaryCard, { backgroundColor: colors.background }]}>
                <View style={styles.summaryHeader}>
                  <Text style={[styles.summaryTitle, { color: colors.text }]}>
                    Current Status
                  </Text>
                  <View style={[
                    styles.statusBadge,
                    { backgroundColor: isBlockingActive ? '#10b981' : '#ef4444' }
                  ]}>
                    <Text style={styles.statusBadgeText}>
                      {isBlockingActive ? 'ACTIVE' : 'PAUSED'}
                    </Text>
                  </View>
                </View>

                <View style={styles.summaryStats}>
                  <View style={styles.statItem}>
                    <Text style={[styles.statNumber, { color: colors.text }]}>{activeApps.length}</Text>
                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Apps Blocked</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statItem}>
                    <Text style={[styles.statNumber, { color: colors.text }]}>{activeWebsites.length}</Text>
                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Websites Blocked</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statItem}>
                    <Text style={[styles.statNumber, { color: isPermanentBlocking ? '#ff4757' : '#3b82f6' }]}>
                      {isPermanentBlocking ? '2h' : '0s'}
                    </Text>
                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Disable Delay</Text>
                  </View>
                </View>
              </View>

              {/* Currently Blocked Apps */}
              {activeApps.length > 0 && (
                <View style={[styles.blockedItemsSection, { backgroundColor: colors.background }]}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    🚫 Blocked Apps ({activeApps.length})
                  </Text>
                  {activeApps.map((app) => (
                    <View key={app.id} style={styles.blockedItem}>
                      <View style={[styles.blockedItemIcon, { backgroundColor: '#ff4757' }]}>
                        <Text style={styles.blockedItemIconText}>
                          {app.appName.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <View style={styles.blockedItemInfo}>
                        <Text style={[styles.blockedItemName, { color: colors.text }]}>
                          {app.appName}
                        </Text>
                        <Text style={[styles.blockedItemStatus, { color: colors.textSecondary }]}>
                          {isPermanentBlocking ? 'Protected by permanent blocking' : 'Can be disabled instantly'}
                        </Text>
                      </View>
                      <View style={[styles.protectionBadge, {
                        backgroundColor: isPermanentBlocking ? '#ff4757' : '#f59e0b'
                      }]}>
                        <Text style={styles.protectionBadgeText}>
                          {isPermanentBlocking ? '🔒' : '⚡'}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}

              {/* Currently Blocked Websites */}
              {activeWebsites.length > 0 && (
                <View style={[styles.blockedItemsSection, { backgroundColor: colors.background }]}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    🌐 Blocked Websites ({activeWebsites.length})
                  </Text>
                  {activeWebsites.map((website) => (
                    <View key={website.id} style={styles.blockedItem}>
                      <View style={[styles.blockedItemIcon, { backgroundColor: '#ff4757' }]}>
                        <Text style={styles.blockedItemIconText}>🌐</Text>
                      </View>
                      <View style={styles.blockedItemInfo}>
                        <Text style={[styles.blockedItemName, { color: colors.text }]}>
                          {website.domain}
                        </Text>
                        <Text style={[styles.blockedItemStatus, { color: colors.textSecondary }]}>
                          {isPermanentBlocking ? 'Protected by permanent blocking' : 'Can be disabled instantly'}
                        </Text>
                      </View>
                      <View style={[styles.protectionBadge, {
                        backgroundColor: isPermanentBlocking ? '#ff4757' : '#f59e0b'
                      }]}>
                        <Text style={styles.protectionBadgeText}>
                          {isPermanentBlocking ? '🔒' : '⚡'}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}

              {/* Permanent Blocking Control */}
              <View style={styles.permanentControlSection}>
                <PermanentBlockingControl
                  isBlocking={isBlockingActive}
                  onBlockingChange={(newState) => {
                    setBlockingActive(newState);
                    if (!newState) {
                      setIsPermanentBlocking(false);
                      setShowPermanentModal(false);
                    }
                  }}
                />
              </View>

              {/* Help Section */}
              <View style={[styles.helpSection, { backgroundColor: colors.background }]}>
                <Text style={[styles.helpTitle, { color: colors.text }]}>
                  💡 How Permanent Blocking Works
                </Text>
                <Text style={[styles.helpText, { color: colors.textSecondary }]}>
                  • <Text style={{ fontWeight: '600' }}>Regular Mode:</Text> Blocking can be disabled instantly{'\n'}
                  • <Text style={{ fontWeight: '600' }}>Permanent Mode:</Text> 2-hour delay required to disable{'\n'}
                  • <Text style={{ fontWeight: '600' }}>Protection:</Text> Prevents impulsive decisions during urges{'\n'}
                  • <Text style={{ fontWeight: '600' }}>Flexibility:</Text> You can cancel disable requests anytime
                </Text>
              </View>
            </ScrollView>
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
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  todayText: {
    fontSize: 16,
    fontWeight: '500',
  },
  offlineSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
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
  appList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  appItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  appLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  appIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  appIcon: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  appInfo: {
    flex: 1,
  },

  categoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '500',
  },
  appTime: {
    fontSize: 16,
    fontWeight: 'bold',
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
  headerRight: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 8,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2a2a2a',
    borderWidth: 2,
    borderColor: '#00d4aa',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusSection: {
    paddingHorizontal: 20,
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
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#00d4aa',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
  },
  contentList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  itemIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  itemIcon: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  itemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  itemStatus: {
    fontSize: 12,
    fontWeight: '500',
  },
  itemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    borderRadius: 20,
    padding: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 24,
  },
  textInput: {
    height: 48,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 24,
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
  addButtonContainer: {
    marginLeft: 16,
  },
  appModalContent: {
    width: '90%',
    maxHeight: '80%',
    borderRadius: 20,
    padding: 24,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  appsList: {
    maxHeight: 400,
    marginBottom: 24,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
  appSelectItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  appSelectLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  appSelectIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  appSelectIconText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  appSelectInfo: {
    flex: 1,
  },
  appSelectName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  appSelectPackage: {
    fontSize: 12,
  },
  addAppButton: {
    fontSize: 16,
    fontWeight: '600',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  debugModalContent: {
    width: '95%',
    height: '90%',
    borderRadius: 20,
    padding: 0,
    overflow: 'hidden',
  },
  debugHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  permanentModalContent: {
    width: '98%',
    maxHeight: '92%',
    borderRadius: 16,
    padding: 0,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  permanentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  permanentContent: {
    flex: 1,
    padding: 16,
    paddingBottom: 24,
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
  permanentBlockingActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  permanentButtonGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
  },

  // Blocking Details Modal Styles
  blockingSummaryCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  summaryStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#e5e7eb',
    marginHorizontal: 16,
  },

  // Blocked Items Section
  blockedItemsSection: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  blockedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  blockedItemIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  blockedItemIconText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  blockedItemInfo: {
    flex: 1,
  },
  blockedItemName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  blockedItemStatus: {
    fontSize: 12,
  },
  protectionBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  protectionBadgeText: {
    fontSize: 12,
  },

  // Permanent Control Section
  permanentControlSection: {
    marginBottom: 16,
  },

  // Help Section
  helpSection: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  helpTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  helpText: {
    fontSize: 14,
    lineHeight: 20,
  },

  // New UI Styles
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    width: 50,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    fontWeight: '400',
  },
  addButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#00d4aa',
  },
  addAppButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#00d4aa',
    backgroundColor: 'transparent',
  },
  addAppButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  addWebsiteButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#00d4aa',
    backgroundColor: 'transparent',
  },
  addWebsiteButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },

  // Permanent Lock Section
  permanentLockSection: {
    marginHorizontal: 20,
    marginBottom: 24,
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: '#00d4aa',
  },
  permanentLockHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  permanentLockIcon: {
    marginRight: 12,
  },
  permanentLockIconText: {
    fontSize: 20,
  },
  permanentLockTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  permanentLockDescription: {
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
  },
  enableLockButton: {
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderWidth: 2,
    alignItems: 'center',
  },
  enableLockButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },

  // Countdown Display Styles
  countdownContainer: {
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderWidth: 2,
  },
  countdownContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  countdownIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  countdownInfo: {
    flex: 1,
  },
  countdownTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 2,
  },
  countdownTime: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  confirmDisableButton: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,1)',
  },
  confirmDisableButtonText: {
    color: '#10b981',
    fontSize: 14,
    fontWeight: 'bold',
  },

  // Main Blocking Status Section
  blockingStatusSection: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  blockingStatusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  blockingStatusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  blockingStatusIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  blockingStatusTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  blockingStatusSubtext: {
    fontSize: 14,
    lineHeight: 18,
  },

  // Tab System
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#00d4aa',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
  },
  contentList: {
    flex: 1,
    paddingHorizontal: 20,
  },
});