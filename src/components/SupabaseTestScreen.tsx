/**
 * Supabase Test Screen
 * A debug screen for testing Supabase connection and recovery data sync
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useAppTheme } from '../theme';
import { SupabaseConnectionTester, TestResult } from '../utils/test-supabase-connection';
import { RecoveryDataSyncService } from '../services/RecoveryDataSyncService';
import { AppInitializationService } from '../services/AppInitializationService';
import { useAuthStore } from '../store';

export const SupabaseTestScreen: React.FC = () => {
  const { colors } = useAppTheme();
  const { user } = useAuthStore();
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const runAllTests = async () => {
    setIsRunning(true);
    try {
      const results = await SupabaseConnectionTester.runAllTests();
      setTestResults(results);
    } catch (error) {
      Alert.alert('Test Error', `Failed to run tests: ${error}`);
    } finally {
      setIsRunning(false);
    }
  };

  const runQuickTest = async () => {
    setIsRunning(true);
    try {
      const success = await SupabaseConnectionTester.quickTest();
      Alert.alert(
        'Quick Test Result',
        success ? 'Supabase connection is working!' : 'Supabase connection failed. Check your internet connection and try again.'
      );
    } catch (error) {
      Alert.alert('Test Error', `Quick test failed: ${error}`);
    } finally {
      setIsRunning(false);
    }
  };

  const forceSyncData = async () => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to sync data');
      return;
    }

    setIsRunning(true);
    try {
      const result = await RecoveryDataSyncService.forceSyncUserData(user.id);
      
      Alert.alert(
        'Sync Result',
        result.success 
          ? `Success! ${result.achievementCount} achievements restored.`
          : `Sync failed: ${result.error}`
      );
    } catch (error) {
      Alert.alert('Sync Error', `Failed to sync data: ${error}`);
    } finally {
      setIsRunning(false);
    }
  };

  const reinitializeApp = async () => {
    setIsRunning(true);
    try {
      const result = await AppInitializationService.forceReinitialize();
      
      Alert.alert(
        'Reinitialization Result',
        result.success 
          ? 'App reinitialized successfully!'
          : `Reinitialization failed: ${result.error}`
      );
    } catch (error) {
      Alert.alert('Error', `Failed to reinitialize: ${error}`);
    } finally {
      setIsRunning(false);
    }
  };

  const renderTestResult = (result: TestResult, index: number) => (
    <View key={index} style={[styles.testResult, { borderColor: colors.border }]}>
      <View style={styles.testHeader}>
        <Text style={[styles.testName, { color: colors.text }]}>
          {result.success ? '✅' : '❌'} {result.testName}
        </Text>
      </View>
      <Text style={[styles.testMessage, { color: colors.textSecondary }]}>
        {result.message}
      </Text>
      {result.data && (
        <Text style={[styles.testData, { color: colors.textSecondary }]}>
          Data: {JSON.stringify(result.data, null, 2)}
        </Text>
      )}
    </View>
  );

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>
          Supabase Connection Test
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Use this screen to test and troubleshoot your Supabase connection
        </Text>
      </View>

      <View style={styles.userInfo}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          User Status
        </Text>
        <Text style={[styles.userText, { color: colors.textSecondary }]}>
          {user ? `Logged in as: ${user.email}` : 'Not logged in'}
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.primary }]}
          onPress={runQuickTest}
          disabled={isRunning}
        >
          <Text style={[styles.buttonText, { color: colors.background }]}>
            Quick Test
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.primary }]}
          onPress={runAllTests}
          disabled={isRunning}
        >
          <Text style={[styles.buttonText, { color: colors.background }]}>
            Run All Tests
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.accent }]}
          onPress={forceSyncData}
          disabled={isRunning || !user}
        >
          <Text style={[styles.buttonText, { color: colors.background }]}>
            Force Sync Data
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.warning }]}
          onPress={reinitializeApp}
          disabled={isRunning}
        >
          <Text style={[styles.buttonText, { color: colors.background }]}>
            Reinitialize App
          </Text>
        </TouchableOpacity>
      </View>

      {isRunning && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>
            Running tests...
          </Text>
        </View>
      )}

      {testResults.length > 0 && (
        <View style={styles.resultsContainer}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Test Results
          </Text>
          {testResults.map(renderTestResult)}
        </View>
      )}

      <View style={styles.instructions}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Instructions
        </Text>
        <Text style={[styles.instructionText, { color: colors.textSecondary }]}>
          • Quick Test: Checks basic Supabase connection{'\n'}
          • Run All Tests: Comprehensive test of all features{'\n'}
          • Force Sync Data: Re-downloads your achievements from Supabase{'\n'}
          • Reinitialize App: Restarts the app initialization process{'\n\n'}
          If tests fail, check your internet connection and try again.
        </Text>
      </View>
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
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 22,
  },
  userInfo: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  userText: {
    fontSize: 16,
  },
  buttonContainer: {
    marginBottom: 24,
  },
  button: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  resultsContainer: {
    marginBottom: 24,
  },
  testResult: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  testHeader: {
    marginBottom: 8,
  },
  testName: {
    fontSize: 16,
    fontWeight: '600',
  },
  testMessage: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  testData: {
    fontSize: 12,
    fontFamily: 'monospace',
    backgroundColor: 'rgba(0,0,0,0.1)',
    padding: 8,
    borderRadius: 4,
  },
  instructions: {
    marginBottom: 24,
  },
  instructionText: {
    fontSize: 14,
    lineHeight: 20,
  },
});