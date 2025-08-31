import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { NativeModules } from 'react-native';
import { useAppTheme } from '../../theme/nativewind-setup';

const { VoltUninstallProtection } = NativeModules;

export const ModuleConnectionTest: React.FC = () => {
  const { colors } = useAppTheme();
  const [connectionStatus, setConnectionStatus] = useState<string>('Not tested');
  const [moduleInfo, setModuleInfo] = useState<any>(null);

  useEffect(() => {
    checkModuleAvailability();
  }, []);

  const checkModuleAvailability = () => {
    if (VoltUninstallProtection) {
      setConnectionStatus('✅ Module found');
      setModuleInfo({
        available: true,
        constants: VoltUninstallProtection.getConstants ? VoltUninstallProtection.getConstants() : 'No constants',
      });
    } else {
      setConnectionStatus('❌ Module not found');
      setModuleInfo({ available: false });
    }
  };

  const testConnection = async () => {
    try {
      if (!VoltUninstallProtection) {
        Alert.alert('Error', 'VoltUninstallProtection module not found');
        return;
      }

      const result = await VoltUninstallProtection.testConnection();
      Alert.alert(
        'Connection Test Result',
        `Status: ${result.status}\nMessage: ${result.message}\nTimestamp: ${new Date(result.timestamp).toLocaleString()}`,
        [{ text: 'OK' }]
      );
      setConnectionStatus('✅ Connection test passed');
    } catch (error) {
      console.error('Connection test failed:', error);
      Alert.alert('Connection Test Failed', `Error: ${error}`);
      setConnectionStatus('❌ Connection test failed');
    }
  };

  const testBasicMethods = async () => {
    try {
      if (!VoltUninstallProtection) {
        Alert.alert('Error', 'Module not available');
        return;
      }

      // Test multiple methods
      const results = [];
      
      try {
        const deviceAdminStatus = await VoltUninstallProtection.isDeviceAdminEnabled();
        results.push(`Device Admin Check: ✅ (${deviceAdminStatus})`);
      } catch (e) {
        results.push(`Device Admin Check: ❌ (${e})`);
      }

      try {
        const protectionActive = await VoltUninstallProtection.isProtectionActive();
        results.push(`Protection Active: ✅ (${protectionActive})`);
      } catch (e) {
        results.push(`Protection Active: ❌ (${e})`);
      }

      try {
        const hasPassword = await VoltUninstallProtection.hasProtectionPassword();
        results.push(`Has Password: ✅ (${hasPassword})`);
      } catch (e) {
        results.push(`Has Password: ❌ (${e})`);
      }

      Alert.alert(
        'Basic Methods Test',
        results.join('\n'),
        [{ text: 'OK' }]
      );

    } catch (error) {
      console.error('Basic methods test failed:', error);
      Alert.alert('Test Failed', `Error: ${error}`);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>
        🔧 Module Connection Test
      </Text>
      
      <View style={[styles.statusContainer, { backgroundColor: colors.surface }]}>
        <Text style={[styles.statusLabel, { color: colors.text }]}>
          Connection Status:
        </Text>
        <Text style={[styles.statusValue, { color: colors.textSecondary }]}>
          {connectionStatus}
        </Text>
      </View>

      {moduleInfo && (
        <View style={[styles.infoContainer, { backgroundColor: colors.surface }]}>
          <Text style={[styles.infoTitle, { color: colors.text }]}>
            Module Info:
          </Text>
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            Available: {moduleInfo.available ? 'Yes' : 'No'}
          </Text>
          {moduleInfo.constants && (
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              Constants: {JSON.stringify(moduleInfo.constants, null, 2)}
            </Text>
          )}
        </View>
      )}

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.primary }]}
          onPress={testConnection}
        >
          <Text style={styles.buttonText}>Test Connection</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.secondary }]}
          onPress={testBasicMethods}
        >
          <Text style={styles.buttonText}>Test Basic Methods</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.warning }]}
          onPress={checkModuleAvailability}
        >
          <Text style={styles.buttonText}>Refresh Status</Text>
        </TouchableOpacity>
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
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 20,
  },
  statusContainer: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  statusLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  statusValue: {
    fontSize: 14,
  },
  infoContainer: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 12,
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  buttonContainer: {
    gap: 12,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});