import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { NativeModules } from 'react-native';
import { useAppTheme } from '../../theme/nativewind-setup';

const { VoltUninstallProtection } = NativeModules;

export const UninstallProtectionTest: React.FC = () => {
  const { colors } = useAppTheme();
  const [testResults, setTestResults] = useState<string[]>([]);

  const addResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  const runTest = async (testName: string, testFn: () => Promise<void>) => {
    try {
      addResult(`🧪 Starting ${testName}...`);
      await testFn();
      addResult(`✅ ${testName} completed successfully`);
    } catch (error) {
      addResult(`❌ ${testName} failed: ${error}`);
      console.error(`Test ${testName} failed:`, error);
    }
  };

  const testDeviceAdminCheck = async () => {
    const isEnabled = await VoltUninstallProtection.isDeviceAdminEnabled();
    addResult(`Device admin enabled: ${isEnabled}`);
  };

  const testPermissionsCheck = async () => {
    const permissions = await VoltUninstallProtection.checkPermissions();
    addResult(`Permissions: ${JSON.stringify(permissions, null, 2)}`);
  };

  const testPasswordOperations = async () => {
    // Test setting password
    await VoltUninstallProtection.setProtectionPassword('test123');
    addResult('Password set successfully');
    
    // Test password verification
    const isValid = await VoltUninstallProtection.verifyProtectionPassword('test123');
    addResult(`Password verification (correct): ${isValid}`);
    
    const isInvalid = await VoltUninstallProtection.verifyProtectionPassword('wrong');
    addResult(`Password verification (incorrect): ${isInvalid}`);
    
    // Test has password
    const hasPassword = await VoltUninstallProtection.hasProtectionPassword();
    addResult(`Has password: ${hasPassword}`);
  };

  const testProtectionStatus = async () => {
    const status = await VoltUninstallProtection.getProtectionStatus();
    addResult(`Protection status: ${JSON.stringify(status, null, 2)}`);
  };

  const testHealthCheck = async () => {
    const health = await VoltUninstallProtection.runHealthCheck();
    addResult(`Health check: ${JSON.stringify(health, null, 2)}`);
  };

  const testProtectionToggle = async () => {
    // Test enabling protection
    const enableResult = await VoltUninstallProtection.enableProtection();
    addResult(`Enable protection: ${JSON.stringify(enableResult)}`);
    
    // Check if active
    const isActive = await VoltUninstallProtection.isProtectionActive();
    addResult(`Protection active: ${isActive}`);
    
    // Test disabling protection
    const disableResult = await VoltUninstallProtection.disableProtection();
    addResult(`Disable protection: ${JSON.stringify(disableResult)}`);
  };

  const runAllTests = async () => {
    setTestResults([]);
    addResult('🚀 Starting comprehensive uninstall protection tests...');
    
    await runTest('Device Admin Check', testDeviceAdminCheck);
    await runTest('Permissions Check', testPermissionsCheck);
    await runTest('Password Operations', testPasswordOperations);
    await runTest('Protection Status', testProtectionStatus);
    await runTest('Health Check', testHealthCheck);
    await runTest('Protection Toggle', testProtectionToggle);
    
    addResult('🎉 All tests completed!');
  };

  const clearResults = () => {
    setTestResults([]);
  };

  const requestDeviceAdmin = async () => {
    try {
      const result = await VoltUninstallProtection.requestDeviceAdminPermission();
      addResult(`Device admin request result: ${result}`);
    } catch (error) {
      addResult(`Device admin request failed: ${error}`);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>
        🧪 Uninstall Protection Test Suite
      </Text>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.primary }]}
          onPress={runAllTests}
        >
          <Text style={styles.buttonText}>Run All Tests</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.secondary }]}
          onPress={requestDeviceAdmin}
        >
          <Text style={styles.buttonText}>Request Device Admin</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.error }]}
          onPress={clearResults}
        >
          <Text style={styles.buttonText}>Clear Results</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={[styles.resultsContainer, { backgroundColor: colors.surface }]}>
        <Text style={[styles.resultsTitle, { color: colors.text }]}>
          Test Results:
        </Text>
        {testResults.map((result, index) => (
          <Text key={index} style={[styles.resultItem, { color: colors.textSecondary }]}>
            {result}
          </Text>
        ))}
        {testResults.length === 0 && (
          <Text style={[styles.noResults, { color: colors.textSecondary }]}>
            No test results yet. Run tests to see output.
          </Text>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 24,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
    flexWrap: 'wrap',
    gap: 8,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    minWidth: 100,
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    textAlign: 'center',
    fontSize: 14,
  },
  resultsContainer: {
    flex: 1,
    borderRadius: 8,
    padding: 16,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  resultItem: {
    fontSize: 12,
    fontFamily: 'monospace',
    marginBottom: 4,
    lineHeight: 16,
  },
  noResults: {
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 20,
  },
});