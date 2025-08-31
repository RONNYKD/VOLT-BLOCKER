import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  TextInput,
  ScrollView,
} from 'react-native';
import { NativeModules } from 'react-native';
import { useAppTheme } from '../../theme/nativewind-setup';

const { VoltUninstallProtection } = NativeModules;

export const ProtectionDebugger: React.FC = () => {
  const { colors } = useAppTheme();
  const [testPassword, setTestPassword] = useState('test123');
  const [debugResults, setDebugResults] = useState<string[]>([]);

  const addResult = (result: string) => {
    setDebugResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  const clearResults = () => {
    setDebugResults([]);
  };

  const testPasswordSaving = async () => {
    try {
      addResult('🧪 Testing password saving...');
      
      // Test setting password
      await VoltUninstallProtection.setProtectionPassword(testPassword);
      addResult('✅ Password set successfully');
      
      // Test checking if password exists
      const hasPassword = await VoltUninstallProtection.hasProtectionPassword();
      addResult(`✅ Has password check: ${hasPassword}`);
      
      // Test password verification
      const isValid = await VoltUninstallProtection.verifyProtectionPassword(testPassword);
      addResult(`✅ Password verification (correct): ${isValid}`);
      
      const isInvalid = await VoltUninstallProtection.verifyProtectionPassword('wrong');
      addResult(`✅ Password verification (wrong): ${isInvalid}`);
      
    } catch (error) {
      addResult(`❌ Password test failed: ${error}`);
    }
  };

  const testOverlayPermission = async () => {
    try {
      addResult('🧪 Testing overlay permission...');
      
      const hasPermission = await VoltUninstallProtection.checkSystemAlertWindowPermission();
      addResult(`Overlay permission granted: ${hasPermission ? '✅' : '❌'}`);
      
      if (!hasPermission) {
        addResult('🔧 Requesting overlay permission...');
        await VoltUninstallProtection.requestSystemAlertWindowPermission();
        addResult('✅ Permission request initiated');
      }
      
    } catch (error) {
      addResult(`❌ Overlay permission test failed: ${error}`);
    }
  };

  const testDeviceAdmin = async () => {
    try {
      addResult('🧪 Testing device admin...');
      
      const isEnabled = await VoltUninstallProtection.isDeviceAdminEnabled();
      addResult(`Device admin enabled: ${isEnabled ? '✅' : '❌'}`);
      
      if (!isEnabled) {
        addResult('🔧 Requesting device admin...');
        await VoltUninstallProtection.requestDeviceAdminPermission();
        addResult('✅ Device admin request initiated');
      }
      
    } catch (error) {
      addResult(`❌ Device admin test failed: ${error}`);
    }
  };

  const testProtectionStatus = async () => {
    try {
      addResult('🧪 Testing protection status...');
      
      const status = await VoltUninstallProtection.getProtectionStatus();
      addResult(`Protection active: ${status.isActive ? '✅' : '❌'}`);
      
      if (status.layers) {
        Object.entries(status.layers).forEach(([layer, info]: [string, any]) => {
          addResult(`${layer}: ${info.enabled ? '✅' : '❌'} (healthy: ${info.healthy ? '✅' : '❌'})`);
        });
      }
      
    } catch (error) {
      addResult(`❌ Protection status test failed: ${error}`);
    }
  };

  const runAllTests = async () => {
    clearResults();
    addResult('🚀 Starting comprehensive protection tests...');
    
    await testPasswordSaving();
    await testOverlayPermission();
    await testDeviceAdmin();
    await testProtectionStatus();
    
    addResult('🎉 All tests completed!');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>
        🔧 Protection Debugger
      </Text>
      
      <View style={styles.inputContainer}>
        <Text style={[styles.inputLabel, { color: colors.text }]}>
          Test Password:
        </Text>
        <TextInput
          style={[styles.input, { 
            backgroundColor: colors.surface,
            borderColor: colors.border,
            color: colors.text 
          }]}
          value={testPassword}
          onChangeText={setTestPassword}
          placeholder="Enter test password"
          placeholderTextColor={colors.textSecondary}
        />
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.primary }]}
          onPress={runAllTests}
        >
          <Text style={styles.buttonText}>🚀 Run All Tests</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.secondary }]}
          onPress={testPasswordSaving}
        >
          <Text style={styles.buttonText}>🔐 Test Password</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.warning }]}
          onPress={testOverlayPermission}
        >
          <Text style={styles.buttonText}>🖼️ Test Overlay</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.error }]}
          onPress={clearResults}
        >
          <Text style={styles.buttonText}>🗑️ Clear Results</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={[styles.resultsContainer, { backgroundColor: colors.surface }]}>
        <Text style={[styles.resultsTitle, { color: colors.text }]}>
          Debug Results:
        </Text>
        {debugResults.map((result, index) => (
          <Text key={index} style={[styles.resultItem, { color: colors.textSecondary }]}>
            {result}
          </Text>
        ))}
        {debugResults.length === 0 && (
          <Text style={[styles.noResults, { color: colors.textSecondary }]}>
            No results yet. Run tests to see output.
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
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    marginBottom: 20,
    gap: 8,
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    minWidth: 120,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 12,
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
    fontSize: 11,
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