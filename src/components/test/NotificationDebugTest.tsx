/**
 * Notification Debug Test Component
 * Debug component to test notification permissions and functionality
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useAppTheme } from '../../theme/nativewind-setup';
import { AnimatedButton } from '../ui';
import { notificationPermissionService } from '../../services/permissions/NotificationPermissionService';
import { appBlockingService } from '../../services/native';
import { notificationService } from '../../services/notifications/NotificationService';

export const NotificationDebugTest: React.FC = () => {
  const { colors } = useAppTheme();
  const [permissionStatus, setPermissionStatus] = useState<string>('Unknown');
  const [testResults, setTestResults] = useState<string[]>([]);

  const addResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  const testPermissionStatus = async () => {
    try {
      const status = await notificationPermissionService.checkNotificationPermission();
      setPermissionStatus(`Granted: ${status.granted}, Can Request: ${status.canRequest}`);
      addResult(`Permission Status: ${JSON.stringify(status)}`);
    } catch (error) {
      addResult(`Permission Check Error: ${error}`);
    }
  };

  const testRequestPermission = async () => {
    try {
      const granted = await notificationPermissionService.requestNotificationPermission();
      addResult(`Permission Request Result: ${granted}`);
    } catch (error) {
      addResult(`Permission Request Error: ${error}`);
    }
  };

  const testNativeNotification = async () => {
    try {
      await appBlockingService.showFocusSessionNotification(15, 900); // 15 min session, 15 min remaining
      addResult('Native notification called successfully');
    } catch (error) {
      addResult(`Native notification error: ${error}`);
    }
  };

  const testNotificationService = async () => {
    try {
      await notificationService.startFocusSessionNotification('test-session', 15, 2, 1);
      addResult('Notification service started successfully');
    } catch (error) {
      addResult(`Notification service error: ${error}`);
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>
        🔔 Notification Debug Test
      </Text>

      {/* Permission Status */}
      <View style={[styles.card, { backgroundColor: colors.surface }]}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>
          Permission Status
        </Text>
        <Text style={[styles.statusText, { color: colors.textSecondary }]}>
          {permissionStatus}
        </Text>
      </View>

      {/* Test Buttons */}
      <View style={styles.buttonGroup}>
        <AnimatedButton
          title="Check Permission"
          variant="primary"
          size="small"
          onPress={testPermissionStatus}
          style={styles.button}
        />
        
        <AnimatedButton
          title="Request Permission"
          variant="secondary"
          size="small"
          onPress={testRequestPermission}
          style={styles.button}
        />
        
        <AnimatedButton
          title="Test Native Notification"
          variant="accent"
          size="small"
          onPress={testNativeNotification}
          style={styles.button}
        />
        
        <AnimatedButton
          title="Test Notification Service"
          variant="primary"
          size="small"
          onPress={testNotificationService}
          style={styles.button}
        />
      </View>

      {/* Results */}
      <View style={[styles.resultsCard, { backgroundColor: colors.surface }]}>
        <View style={styles.resultsHeader}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            Test Results
          </Text>
          <AnimatedButton
            title="Clear"
            variant="ghost"
            size="small"
            onPress={clearResults}
          />
        </View>
        
        <View style={styles.resultsList}>
          {testResults.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No test results yet. Run tests above.
            </Text>
          ) : (
            testResults.map((result, index) => (
              <Text key={index} style={[styles.resultText, { color: colors.textSecondary }]}>
                {result}
              </Text>
            ))
          )}
        </View>
      </View>

      {/* Instructions */}
      <View style={[styles.card, { backgroundColor: colors.surface }]}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>
          🧪 Debug Steps
        </Text>
        <Text style={[styles.instructionText, { color: colors.textSecondary }]}>
          1. Check Permission - See current permission status{'\n'}
          2. Request Permission - Trigger permission dialog{'\n'}
          3. Test Native - Direct call to Java notification{'\n'}
          4. Test Service - Full notification service test{'\n'}
          5. Check notification panel after each test
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
  statusText: {
    fontSize: 14,
    textAlign: 'center',
  },
  buttonGroup: {
    marginBottom: 16,
  },
  button: {
    marginBottom: 8,
  },
  resultsCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    maxHeight: 200,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  resultsList: {
    flex: 1,
  },
  emptyText: {
    textAlign: 'center',
    fontStyle: 'italic',
  },
  resultText: {
    fontSize: 12,
    marginBottom: 4,
    fontFamily: 'monospace',
  },
  instructionText: {
    fontSize: 14,
    lineHeight: 20,
  },
});

export default NotificationDebugTest;