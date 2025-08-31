/**
 * Native Service Test Component
 * Helps debug and test native service functionality
 */
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { appBlockingService } from '../services/native/AppBlockingService';
import { useAppTheme } from '../theme/nativewind-setup';

export const NativeServiceTest: React.FC = () => {
  const { colors } = useAppTheme();
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  const runTest = async (testName: string, testFn: () => Promise<void>) => {
    try {
      addResult(`🧪 Running ${testName}...`);
      await testFn();
      addResult(`✅ ${testName} completed`);
    } catch (error) {
      addResult(`❌ ${testName} failed: ${error}`);
    }
  };

  const testNativeModuleAvailability = async () => {
    const { NativeModules } = require('react-native');
    addResult(`Available native modules: ${Object.keys(NativeModules).join(', ')}`);
    
    if (NativeModules.VoltAppBlocking) {
      addResult('✅ VoltAppBlocking native module found');
    } else {
      addResult('❌ VoltAppBlocking native module NOT found');
    }
  };

  const testServiceInitialization = async () => {
    const result = await appBlockingService.initialize();
    addResult(`Service initialization result: ${result}`);
  };

  const testPermissions = async () => {
    const hasUsageStats = await appBlockingService.hasRequiredPermissions();
    addResult(`Has required permissions: ${hasUsageStats}`);
  };

  const testGetInstalledApps = async () => {
    const apps = await appBlockingService.getInstalledApps();
    addResult(`Found ${apps.length} installed apps`);
    if (apps.length > 0) {
      addResult(`First app: ${apps[0].appName} (${apps[0].packageName})`);
    }
  };

  const testBlocking = async () => {
    const testPackages = ['com.instagram.android', 'com.twitter.android'];
    
    // Test start blocking
    const startResult = await appBlockingService.startBlocking(testPackages);
    addResult(`Start blocking result: ${startResult}`);
    
    // Test is blocking
    const isBlocking = await appBlockingService.isBlocking();
    addResult(`Is blocking active: ${isBlocking}`);
    
    // Test stop blocking
    const stopResult = await appBlockingService.stopBlocking();
    addResult(`Stop blocking result: ${stopResult}`);
  };

  const runAllTests = async () => {
    if (isRunning) return;
    
    setIsRunning(true);
    clearResults();
    
    addResult('🚀 Starting native service tests...');
    
    await runTest('Native Module Availability', testNativeModuleAvailability);
    await runTest('Service Initialization', testServiceInitialization);
    await runTest('Permissions Check', testPermissions);
    await runTest('Get Installed Apps', testGetInstalledApps);
    await runTest('Blocking Functions', testBlocking);
    
    addResult('🏁 All tests completed');
    setIsRunning(false);
  };

  const requestPermissions = async () => {
    try {
      addResult('🔐 Requesting permissions...');
      const granted = await appBlockingService.showPermissionDialog();
      addResult(`Permissions granted: ${granted}`);
    } catch (error) {
      addResult(`❌ Permission request failed: ${error}`);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>Native Service Test</Text>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: '#00d4aa' }]}
          onPress={runAllTests}
          disabled={isRunning}
        >
          <Text style={styles.buttonText}>
            {isRunning ? 'Running Tests...' : 'Run All Tests'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.button, { backgroundColor: '#ff4757' }]}
          onPress={requestPermissions}
        >
          <Text style={styles.buttonText}>Request Permissions</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.button, { backgroundColor: '#666' }]}
          onPress={clearResults}
        >
          <Text style={styles.buttonText}>Clear Results</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.resultsContainer}>
        {testResults.map((result, index) => (
          <Text key={index} style={[styles.resultText, { color: colors.text }]}>
            {result}
          </Text>
        ))}
      </ScrollView>
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
    marginBottom: 20,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
    minWidth: 100,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    textAlign: 'center',
  },
  resultsContainer: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 12,
  },
  resultText: {
    fontSize: 12,
    fontFamily: 'monospace',
    marginBottom: 4,
  },
});