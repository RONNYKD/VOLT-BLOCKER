import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { NativeModules } from 'react-native';
import { useAppTheme } from '../../theme/nativewind-setup';
import { ProtectionSetupWizard } from '../../components/protection/ProtectionSetupWizard';
import { PasswordSetupModal } from '../../components/protection/PasswordSetupModal';

const { VoltUninstallProtection } = NativeModules;

export const UninstallProtectionScreen: React.FC = () => {
  const { colors } = useAppTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [protectionActive, setProtectionActive] = useState(false);
  const [showSetupWizard, setShowSetupWizard] = useState(false);
  const [showPasswordSetup, setShowPasswordSetup] = useState(false);
  const [protectionStatus, setProtectionStatus] = useState<any>(null);
  const [permissions, setPermissions] = useState<any>(null);

  useEffect(() => {
    loadProtectionStatus();
  }, []);

  const loadProtectionStatus = async () => {
    try {
      setIsLoading(true);

      // Check if native module is available
      if (!VoltUninstallProtection) {
        console.warn('VoltUninstallProtection native module not available');
        // Set default/mock values
        setProtectionStatus({
          isActive: false,
          layers: {
            deviceAdmin: { enabled: false, healthy: false, lastCheck: Date.now().toString() },
            packageMonitor: { enabled: false, healthy: false, lastCheck: Date.now().toString() },
            passwordAuth: { enabled: false, healthy: false, lastCheck: Date.now().toString() },
            accessibilityService: { enabled: false, healthy: false, lastCheck: Date.now().toString() }
          },
          lastHealthCheck: Date.now().toString(),
          emergencyOverrideActive: false,
          focusSessionEnforced: false
        });
        setPermissions([]);
        setProtectionActive(false);
        return;
      }

      // Load protection status and permissions in parallel
      const [statusResult, permissionsResult, isActiveResult] = await Promise.all([
        VoltUninstallProtection.getProtectionStatus(),
        VoltUninstallProtection.checkPermissions(),
        VoltUninstallProtection.isProtectionActive(),
      ]);

      setProtectionStatus(statusResult);
      setPermissions(permissionsResult);
      setProtectionActive(isActiveResult);

    } catch (error) {
      console.error('Failed to load protection status:', error);
      Alert.alert('Error', 'Failed to load protection status: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleProtection = async (enabled: boolean) => {
    if (!VoltUninstallProtection) {
      Alert.alert('Error', 'Uninstall protection is not available. The native module is not installed.');
      return;
    }

    if (enabled) {
      // Check if setup is complete
      if (!permissions?.deviceAdmin?.granted) {
        setShowSetupWizard(true);
        return;
      }

      // Enable protection
      try {
        setIsLoading(true);
        const result = await VoltUninstallProtection.enableProtection();

        if (result.success) {
          setProtectionActive(true);
          Alert.alert('Success', 'Uninstall protection enabled successfully!');
          await loadProtectionStatus();
        } else {
          Alert.alert('Error', result.message || 'Failed to enable protection');
        }
      } catch (error) {
        console.error('Failed to enable protection:', error);
        Alert.alert('Error', 'Failed to enable protection');
      } finally {
        setIsLoading(false);
      }
    } else {
      // Disable protection with confirmation
      Alert.alert(
        'Disable Protection',
        'Are you sure you want to disable uninstall protection? This will make VOLT vulnerable to impulsive uninstallation.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Disable',
            style: 'destructive',
            onPress: async () => {
              try {
                setIsLoading(true);
                const result = await VoltUninstallProtection.disableProtection();

                if (result.success) {
                  setProtectionActive(false);
                  Alert.alert('Success', 'Uninstall protection disabled');
                  await loadProtectionStatus();
                } else {
                  Alert.alert('Error', result.message || 'Failed to disable protection');
                }
              } catch (error) {
                console.error('Failed to disable protection:', error);
                Alert.alert('Error', 'Failed to disable protection');
              } finally {
                setIsLoading(false);
              }
            }
          }
        ]
      );
    }
  };

  const handleRunHealthCheck = async () => {
    if (!VoltUninstallProtection) {
      Alert.alert('Error', 'Uninstall protection is not available. The native module is not installed.');
      return;
    }

    try {
      setIsLoading(true);
      const result = await VoltUninstallProtection.runHealthCheck();

      const healthEmoji = {
        healthy: '✅',
        degraded: '⚠️',
        critical: '❌'
      };

      Alert.alert(
        `${healthEmoji[result.overallHealth]} Health Check Results`,
        `Overall Status: ${result.overallHealth.toUpperCase()}\n\n` +
        Object.entries(result.layerResults).map(([layer, status]: [string, any]) =>
          `${layer}: ${status.status} - ${status.message}`
        ).join('\n'),
        [{ text: 'OK' }]
      );

      await loadProtectionStatus();
    } catch (error) {
      console.error('Failed to run health check:', error);
      Alert.alert('Error', 'Failed to run health check');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestEmergencyOverride = async () => {
    if (!VoltUninstallProtection) {
      Alert.alert('Error', 'Uninstall protection is not available. The native module is not installed.');
      return;
    }

    Alert.alert(
      '🚨 Emergency Override',
      'This will start a 24-hour cooling-off period before you can disable protection.\n\nUse this only in genuine emergencies where you need to uninstall VOLT immediately.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Request Override',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoading(true);
              const result = await VoltUninstallProtection.requestEmergencyOverride();

              if (result.success) {
                Alert.alert(
                  'Emergency Override Requested',
                  result.message + '\n\nYou will be able to disable protection after the cooling-off period ends.',
                  [{ text: 'OK' }]
                );
              } else {
                Alert.alert('Error', result.message || 'Failed to request emergency override');
              }
            } catch (error) {
              console.error('Failed to request emergency override:', error);
              Alert.alert('Error', 'Failed to request emergency override');
            } finally {
              setIsLoading(false);
            }
          }
        }
      ]
    );
  };

  const renderProtectionLayer = (layerKey: string, layer: any) => {
    const statusColor = layer.healthy ? colors.success : colors.error;
    const statusIcon = layer.healthy ? '✅' : '❌';

    return (
      <View key={layerKey} style={[styles.layerItem, { backgroundColor: colors.surface }]}>
        <View style={styles.layerHeader}>
          <Text style={[styles.layerName, { color: colors.text }]}>
            {statusIcon} {layerKey.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
          </Text>
          <Text style={[styles.layerStatus, { color: statusColor }]}>
            {layer.enabled ? 'Enabled' : 'Disabled'}
          </Text>
        </View>
        <Text style={[styles.layerDescription, { color: colors.textSecondary }]}>
          Last checked: {new Date(parseInt(layer.lastCheck)).toLocaleTimeString()}
        </Text>
      </View>
    );
  };

  if (showSetupWizard) {
    return (
      <ProtectionSetupWizard
        onComplete={() => {
          setShowSetupWizard(false);
          loadProtectionStatus();
        }}
        onCancel={() => setShowSetupWizard(false)}
      />
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>
          🛡️ Uninstall Protection
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Protect VOLT from impulsive uninstallation during focus sessions
        </Text>
      </View>

      {/* Development Mode Info */}
      {!VoltUninstallProtection && (
        <View style={[styles.section, { backgroundColor: colors.info + '20' || '#17a2b8' + '20', borderColor: colors.info || '#17a2b8', borderWidth: 1 }]}>
          <Text style={[styles.warningTitle, { color: colors.info || '#17a2b8' }]}>
            🔧 Development Mode
          </Text>
          <Text style={[styles.warningText, { color: colors.text }]}>
            Running in mock mode for development. All protection features are simulated with realistic behavior.
          </Text>
          <Text style={[styles.warningText, { color: colors.textSecondary, fontSize: 12, marginTop: 8 }]}>
            • Mock device admin requests
            • Simulated password authentication  
            • Realistic status updates
            • Emergency override simulation
          </Text>
        </View>
      )}

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading protection status...
          </Text>
        </View>
      ) : (
        <>
          {/* Main Toggle */}
          <View style={[styles.section, { backgroundColor: colors.surface }]}>
            <View style={styles.toggleContainer}>
              <View style={styles.toggleInfo}>
                <Text style={[styles.toggleTitle, { color: colors.text }]}>
                  Enable Uninstall Protection
                </Text>
                <Text style={[styles.toggleDescription, { color: colors.textSecondary }]}>
                  Prevents impulsive app removal during focus sessions
                </Text>
              </View>
              <Switch
                value={protectionActive}
                onValueChange={handleToggleProtection}
                trackColor={{ false: colors.border, true: colors.primary + '40' }}
                thumbColor={protectionActive ? colors.primary : colors.textSecondary}
                disabled={isLoading}
              />
            </View>
          </View>

          {/* Status Overview */}
          {protectionStatus && (
            <View style={[styles.section, { backgroundColor: colors.surface }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Protection Status
              </Text>

              <View style={styles.statusOverview}>
                <View style={styles.statusItem}>
                  <Text style={[styles.statusLabel, { color: colors.textSecondary }]}>
                    Overall Status
                  </Text>
                  <Text style={[
                    styles.statusValue,
                    { color: protectionActive ? colors.success : colors.textSecondary }
                  ]}>
                    {protectionActive ? '🟢 Active' : '🔴 Inactive'}
                  </Text>
                </View>

                <View style={styles.statusItem}>
                  <Text style={[styles.statusLabel, { color: colors.textSecondary }]}>
                    Last Health Check
                  </Text>
                  <Text style={[styles.statusValue, { color: colors.text }]}>
                    {new Date(parseInt(protectionStatus.lastHealthCheck)).toLocaleString()}
                  </Text>
                </View>

                {protectionStatus.emergencyOverrideActive && (
                  <View style={styles.statusItem}>
                    <Text style={[styles.statusLabel, { color: colors.warning }]}>
                      Emergency Override
                    </Text>
                    <Text style={[styles.statusValue, { color: colors.warning }]}>
                      🚨 Active
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Protection Layers */}
          {protectionStatus?.layers && (
            <View style={[styles.section, { backgroundColor: colors.surface }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Protection Layers
              </Text>

              {Object.entries(protectionStatus.layers).map(([key, layer]) =>
                renderProtectionLayer(key, layer)
              )}
            </View>
          )}

          {/* Permissions Status */}
          {permissions && (
            <View style={[styles.section, { backgroundColor: colors.surface }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Required Permissions
              </Text>

              {Object.entries(permissions).map(([key, permission]: [string, any]) => (
                <View key={key} style={styles.permissionItem}>
                  <View style={styles.permissionHeader}>
                    <Text style={[styles.permissionName, { color: colors.text }]}>
                      {permission.granted ? '✅' : '❌'} {permission.name}
                    </Text>
                    <Text style={[
                      styles.permissionStatus,
                      { color: permission.granted ? colors.success : colors.error }
                    ]}>
                      {permission.granted ? 'Granted' : 'Not Granted'}
                    </Text>
                  </View>
                  <Text style={[styles.permissionDescription, { color: colors.textSecondary }]}>
                    {permission.description}
                  </Text>
                  {permission.required && !permission.granted && (
                    <Text style={[styles.permissionRequired, { color: colors.error }]}>
                      Required for protection to work
                    </Text>
                  )}
                </View>
              ))}
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.primary }]}
              onPress={handleRunHealthCheck}
              disabled={isLoading}
            >
              <Text style={styles.actionButtonText}>
                🔍 Run Health Check
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: '#28a745' }]}
              onPress={async () => {
                if (!VoltUninstallProtection) {
                  Alert.alert('Error', 'Native module not available');
                  return;
                }
                try {
                  const result = await VoltUninstallProtection.test();
                  Alert.alert('Native Module Test', result);
                } catch (error) {
                  Alert.alert('Test Failed', `Error: ${error}`);
                }
              }}
              disabled={isLoading}
            >
              <Text style={styles.actionButtonText}>
                🧪 Test Native Module
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }]}
              onPress={() => setShowSetupWizard(true)}
              disabled={isLoading}
            >
              <Text style={[styles.actionButtonText, { color: colors.text }]}>
                ⚙️ Setup Wizard
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.secondary }]}
              onPress={() => setShowPasswordSetup(true)}
              disabled={isLoading}
            >
              <Text style={styles.actionButtonText}>
                🔐 Set Password
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.warning }]}
              onPress={async () => {
                if (!VoltUninstallProtection) {
                  Alert.alert('Error', 'Uninstall protection is not available. The native module is not installed.');
                  return;
                }
                try {
                  const result = await VoltUninstallProtection.testUninstallProtection();
                  Alert.alert(
                    'Protection Test Results',
                    `Device Admin: ${result.deviceAdminActive ? '✅' : '❌'}\n` +
                    `Protection Enabled: ${result.protectionEnabled ? '✅' : '❌'}\n` +
                    `Service Running: ${result.serviceRunning ? '✅' : '❌'}\n` +
                    `Password Set: ${result.passwordSet ? '✅' : '❌'}\n` +
                    `Overall Ready: ${result.ready ? '✅' : '❌'}\n\n` +
                    `${result.message}`,
                    [{ text: 'OK' }]
                  );
                } catch (error) {
                  Alert.alert('Test Failed', 'Could not run protection test');
                }
              }}
              disabled={isLoading}
            >
              <Text style={styles.actionButtonText}>
                🧪 Test Protection
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.secondary }]}
              onPress={async () => {
                if (!VoltUninstallProtection) {
                  Alert.alert('Error', 'Uninstall protection is not available. The native module is not installed.');
                  return;
                }
                try {
                  const success = await VoltUninstallProtection.showPasswordOverlay('manual_test');
                  if (!success) {
                    Alert.alert('Error', 'Failed to show password overlay');
                  }
                } catch (error) {
                  Alert.alert('Error', 'Failed to show password overlay');
                }
              }}
              disabled={isLoading}
            >
              <Text style={styles.actionButtonText}>
                🔐 Test Password Overlay
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.info || '#17a2b8' }]}
              onPress={async () => {
                if (!VoltUninstallProtection) {
                  Alert.alert('Error', 'Uninstall protection is not available. The native module is not installed.');
                  return;
                }
                try {
                  const debugInfo = await VoltUninstallProtection.debugPasswordStorage();
                  Alert.alert(
                    'Password Debug Info',
                    `Has Stored Hash: ${debugInfo.hasStoredHash ? '✅' : '❌'}\n` +
                    `Hash Preview: ${debugInfo.hashPreview || 'N/A'}\n` +
                    `Hash Length: ${debugInfo.hashLength || 0}\n` +
                    `Test Hash Preview: ${debugInfo.testHashPreview || 'N/A'}\n` +
                    `Hashes Match (test123): ${debugInfo.hashesMatch ? '✅' : '❌'}\n` +
                    `Error: ${debugInfo.hashError || 'None'}`,
                    [{ text: 'OK' }]
                  );
                } catch (error) {
                  Alert.alert('Debug Failed', `Error: ${error}`);
                }
              }}
              disabled={isLoading}
            >
              <Text style={styles.actionButtonText}>
                🔍 Debug Password
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: '#6c757d' }]}
              onPress={async () => {
                if (!VoltUninstallProtection) {
                  Alert.alert('Error', 'Uninstall protection is not available. The native module is not installed.');
                  return;
                }
                try {
                  const result = await VoltUninstallProtection.requestDeviceAdminPermission();
                  Alert.alert(
                    'Device Admin Request Result',
                    `Success: ${result.success ? '✅' : '❌'}\n` +
                    `Settings Opened: ${result.settingsOpened ? '✅' : '❌'}\n` +
                    `Message: ${result.message}`,
                    [{ text: 'OK' }]
                  );
                } catch (error) {
                  Alert.alert('Request Failed', `Error: ${error}`);
                }
              }}
              disabled={isLoading}
            >
              <Text style={styles.actionButtonText}>
                ⚙️ Test Settings Open
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.error }]}
              onPress={handleRequestEmergencyOverride}
              disabled={isLoading || !protectionActive}
            >
              <Text style={styles.actionButtonText}>
                🚨 Emergency Override
              </Text>
            </TouchableOpacity>
          </View>

          {/* Help Section */}
          <View style={[styles.section, { backgroundColor: colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              How It Works
            </Text>

            <View style={styles.helpContent}>
              <Text style={[styles.helpItem, { color: colors.textSecondary }]}>
                • Device administrator privileges prevent unauthorized uninstallation
              </Text>
              <Text style={[styles.helpItem, { color: colors.textSecondary }]}>
                • Package monitoring detects uninstall attempts in real-time
              </Text>
              <Text style={[styles.helpItem, { color: colors.textSecondary }]}>
                • Password authentication required to disable protection
              </Text>
              <Text style={[styles.helpItem, { color: colors.textSecondary }]}>
                • Emergency override available with 24-hour cooling-off period
              </Text>
            </View>
          </View>
        </>
      )}

      {/* Password Setup Modal */}
      <PasswordSetupModal
        visible={showPasswordSetup}
        onClose={() => setShowPasswordSetup(false)}
        onSuccess={() => {
          setShowPasswordSetup(false);
          loadProtectionStatus();
        }}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  section: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleInfo: {
    flex: 1,
    marginRight: 16,
  },
  toggleTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  toggleDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  statusOverview: {
    gap: 12,
  },
  statusItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  statusValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  layerItem: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  layerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  layerName: {
    fontSize: 14,
    fontWeight: '600',
  },
  layerStatus: {
    fontSize: 12,
    fontWeight: '500',
  },
  layerDescription: {
    fontSize: 12,
  },
  permissionItem: {
    marginBottom: 12,
  },
  permissionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  permissionName: {
    fontSize: 14,
    fontWeight: '600',
  },
  permissionStatus: {
    fontSize: 12,
    fontWeight: '500',
  },
  permissionDescription: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 2,
  },
  permissionRequired: {
    fontSize: 11,
    fontWeight: '500',
  },
  actionButtons: {
    gap: 12,
    marginBottom: 16,
  },
  actionButton: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  helpContent: {
    gap: 8,
  },
  helpItem: {
    fontSize: 14,
    lineHeight: 20,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  warningText: {
    fontSize: 14,
    lineHeight: 20,
  },
});