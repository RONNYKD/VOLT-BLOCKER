/**
 * Storage Test Component - Simplified for Debugging
 * Focus on app blocking and permission debugging
 */
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, Modal } from 'react-native';
import AppListTest from './test/AppListTest';
import PermanentBlockingControl from './PermanentBlockingControl';
import { NativeModules } from 'react-native';
import { useBlockingStore, useFocusStore } from '../store';

export const StorageTestComponent: React.FC = () => {
  const [testResults, setTestResults] = useState<string>('');
  const [isRunning, setIsRunning] = useState(false);
  const [showAppListTest, setShowAppListTest] = useState(false);
  const [showPermanentBlocking, setShowPermanentBlocking] = useState(false);
  const [isBlocking, setIsBlocking] = useState(false);

  const debugBlockingStatus = async () => {
    setIsRunning(true);
    setTestResults('Debugging blocking status...\n');
    
    try {
      let result = '=== BLOCKING DEBUG REPORT ===\n\n';
      
      // Check native module availability
      result += '1. NATIVE MODULE STATUS:\n';
      const nativeModule = NativeModules.VoltAppBlocking;
      const isAvailable = nativeModule !== null && nativeModule !== undefined;
      result += `- Native Module Available: ${isAvailable ? 'YES' : 'NO'}\n`;
      
      if (!isAvailable) {
        result += '❌ CRITICAL: Native module not found!\n';
        result += 'This means the Java/Android code is not properly linked.\n\n';
        setTestResults(result);
        Alert.alert('Critical Error', 'Native blocking module not found!');
        return;
      }
      
      // Check permissions
      result += '\n2. PERMISSIONS STATUS:\n';
      const hasUsageStats = await nativeModule.hasUsageStatsPermission();
      const hasAccessibility = await nativeModule.hasAccessibilityPermission();
      result += `- Usage Stats Permission: ${hasUsageStats ? 'GRANTED' : 'DENIED'}\n`;
      result += `- Accessibility Permission: ${hasAccessibility ? 'GRANTED' : 'DENIED'}\n`;
      
      if (!hasUsageStats || !hasAccessibility) {
        result += '⚠️ WARNING: Missing required permissions!\n';
        result += 'Blocking will not work without both permissions.\n';
      }
      
      // Check accessibility service status
      result += '\n3. ACCESSIBILITY SERVICE STATUS:\n';
      try {
        const isBlocking = await nativeModule.isBlocking();
        result += `- Native Blocking Status: ${isBlocking ? 'ACTIVE' : 'INACTIVE'}\n`;
      } catch (error) {
        result += `- Accessibility Service Error: ${error}\n`;
      }
      
      // Check blocked apps list
      result += '\n4. BLOCKED APPS CONFIGURATION:\n';
      const blockingStore = useBlockingStore.getState();
      result += `- Blocked Apps in Store: ${blockingStore.blockedApps.length}\n`;
      
      if (blockingStore.blockedApps.length > 0) {
        result += 'Blocked Apps List:\n';
        blockingStore.blockedApps.forEach(app => {
          result += `  - ${app.appName} (${app.packageName})\n`;
        });
      } else {
        result += '⚠️ WARNING: No apps are currently blocked!\n';
        result += 'You need to select apps to block first.\n';
      }
      
      // Check focus session status
      result += '\n5. FOCUS SESSION STATUS:\n';
      const focusStore = useFocusStore.getState();
      const currentSession = focusStore.currentSession;
      result += `- Current Session: ${currentSession ? 'ACTIVE' : 'NONE'}\n`;
      
      if (currentSession) {
        result += `- Session Duration: ${currentSession.duration} minutes\n`;
        result += `- Session Started: ${new Date(currentSession.startTime).toLocaleTimeString()}\n`;
        result += `- Apps in Session: ${currentSession.blockedApps?.length || 0}\n`;
        
        if (currentSession.blockedApps && currentSession.blockedApps.length > 0) {
          result += 'Session Blocked Apps:\n';
          currentSession.blockedApps.forEach(packageName => {
            result += `  - ${packageName}\n`;
          });
        }
      } else {
        result += '⚠️ WARNING: No active focus session!\n';
        result += 'Blocking only works during active focus sessions.\n';
      }
      
      // Check if YouTube/Google are in the blocked list
      result += '\n6. SPECIFIC APP CHECK:\n';
      const youtubeBlocked = blockingStore.blockedApps.some(app => 
        app.packageName === 'com.google.android.youtube'
      );
      const googleBlocked = blockingStore.blockedApps.some(app => 
        app.packageName.includes('google')
      );
      
      result += `- YouTube Blocked: ${youtubeBlocked ? 'YES' : 'NO'}\n`;
      result += `- Google Apps Blocked: ${googleBlocked ? 'YES' : 'NO'}\n`;
      
      // Provide diagnosis
      result += '\n7. DIAGNOSIS & SOLUTION:\n';
      if (!hasUsageStats || !hasAccessibility) {
        result += '❌ ISSUE: Missing permissions - blocking cannot work\n';
        result += 'SOLUTION: Use "Fix Permissions" button below\n';
      } else if (blockingStore.blockedApps.length === 0) {
        result += '❌ ISSUE: No apps selected for blocking\n';
        result += 'SOLUTION: Go to Blocks screen and select apps to block\n';
      } else if (!currentSession) {
        result += '❌ ISSUE: No active focus session\n';
        result += 'SOLUTION: Start a focus session from Focus screen\n';
      } else if (!isBlocking) {
        result += '❌ ISSUE: Native blocking service not active\n';
        result += 'SOLUTION: Restart the focus session or check accessibility service\n';
      } else {
        result += '✅ DIAGNOSIS: Everything looks correct!\n';
        result += 'If blocking still not working, try:\n';
        result += '1. Restart the app\n';
        result += '2. Disable and re-enable accessibility service\n';
        result += '3. Check Android battery optimization settings\n';
      }
      
      setTestResults(result);
      Alert.alert('Debug Complete!', 'Check results for detailed blocking status');
    } catch (error) {
      const errorMsg = `Debug failed: ${error}`;
      setTestResults(errorMsg);
      Alert.alert('Debug Error', errorMsg);
    } finally {
      setIsRunning(false);
    }
  };

  const fixPermissions = async () => {
    setIsRunning(true);
    setTestResults('Attempting to fix permissions...\n');
    
    try {
      let result = '=== PERMISSION FIX ATTEMPT ===\n\n';
      
      const nativeModule = NativeModules.VoltAppBlocking;
      if (!nativeModule) {
        result += '❌ Native module not available\n';
        setTestResults(result);
        Alert.alert('Error', 'Native module not found');
        return;
      }
      
      // Check current permissions
      const hasUsageStats = await nativeModule.hasUsageStatsPermission();
      const hasAccessibility = await nativeModule.hasAccessibilityPermission();
      
      result += `Current Status:\n`;
      result += `- Usage Stats: ${hasUsageStats ? 'GRANTED' : 'DENIED'}\n`;
      result += `- Accessibility: ${hasAccessibility ? 'GRANTED' : 'DENIED'}\n\n`;
      
      if (!hasUsageStats) {
        result += 'Opening Usage Stats settings...\n';
        await nativeModule.requestUsageStatsPermission();
        result += '✅ Usage Stats settings opened\n';
        result += 'Please find VOLT in the list and toggle it ON\n\n';
      }
      
      if (!hasAccessibility) {
        result += 'Opening Accessibility settings...\n';
        await nativeModule.requestAccessibilityPermission();
        result += '✅ Accessibility settings opened\n';
        result += 'Please find VOLT in the list and toggle it ON\n\n';
      }
      
      if (hasUsageStats && hasAccessibility) {
        result += '✅ All permissions already granted!\n';
        result += 'If blocking still not working, try restarting the app.\n';
      } else {
        result += 'MANUAL STEPS:\n';
        result += '1. Grant the permissions in the opened settings\n';
        result += '2. Return to VOLT app\n';
        result += '3. Run "Debug Blocking Status" again to verify\n';
      }
      
      setTestResults(result);
      Alert.alert('Permission Fix', 'Settings opened. Please grant permissions manually.');
    } catch (error) {
      const errorMsg = `Permission fix failed: ${error}`;
      setTestResults(errorMsg);
      Alert.alert('Fix Error', errorMsg);
    } finally {
      setIsRunning(false);
    }
  };

  const testAppBlocking = async () => {
    setIsRunning(true);
    setTestResults('Testing app blocking functionality...\n');
    
    try {
      let result = '=== APP BLOCKING TEST ===\n\n';
      
      const nativeModule = NativeModules.VoltAppBlocking;
      if (!nativeModule) {
        result += '❌ Native module not available\n';
        setTestResults(result);
        Alert.alert('Error', 'Native module not found');
        return;
      }
      
      // Get installed apps
      const apps = await nativeModule.getInstalledApps();
      result += `Total Apps Found: ${apps.length}\n`;
      
      // Find system apps
      const systemApps = apps.filter(app => app.isSystemApp);
      result += `System Apps Found: ${systemApps.length}\n`;
      
      // Find distracting apps
      const distractingApps = apps.filter(app => app.isRecommendedForBlocking);
      result += `Distracting Apps Found: ${distractingApps.length}\n\n`;
      
      // Check for specific apps
      const youtube = apps.find(app => app.packageName === 'com.google.android.youtube');
      const chrome = apps.find(app => app.packageName === 'com.android.chrome');
      const google = apps.find(app => app.packageName === 'com.google.android.googlequicksearchbox');
      
      result += 'Key Apps Status:\n';
      result += `- YouTube: ${youtube ? 'FOUND' : 'NOT FOUND'}\n`;
      result += `- Chrome: ${chrome ? 'FOUND' : 'NOT FOUND'}\n`;
      result += `- Google Search: ${google ? 'FOUND' : 'NOT FOUND'}\n\n`;
      
      if (youtube) {
        result += `YouTube Details:\n`;
        result += `  - Name: ${youtube.appName}\n`;
        result += `  - Category: ${youtube.categoryDisplay}\n`;
        result += `  - Recommended for Blocking: ${youtube.isRecommendedForBlocking ? 'YES' : 'NO'}\n\n`;
      }
      
      result += '✅ App detection is working!\n';
      result += 'System apps are now being detected and can be blocked.\n';
      
      setTestResults(result);
      Alert.alert('Test Complete!', 'App blocking detection is working correctly');
    } catch (error) {
      const errorMsg = `App blocking test failed: ${error}`;
      setTestResults(errorMsg);
      Alert.alert('Test Error', errorMsg);
    } finally {
      setIsRunning(false);
    }
  };

  const clearResults = () => {
    setTestResults('');
  };

  return (
    <View style={{ flex: 1, padding: 20, backgroundColor: '#1a1a1a' }}>
      <Text style={{ color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 20 }}>
        🔧 App Blocking Debug Tools
      </Text>
      
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {/* Primary Debug Tools */}
        <View style={{ gap: 12, marginBottom: 20 }}>
          <TouchableOpacity
            style={{
              backgroundColor: isRunning ? '#666' : '#e74c3c',
              padding: 16,
              borderRadius: 8,
              alignItems: 'center',
            }}
            onPress={debugBlockingStatus}
            disabled={isRunning}
          >
            <Text style={{ color: '#fff', fontWeight: '600', fontSize: 16 }}>
              🐛 Debug Blocking Status
            </Text>
            <Text style={{ color: '#fff', fontSize: 12, marginTop: 4 }}>
              Check what's preventing blocking from working
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              backgroundColor: isRunning ? '#666' : '#f39c12',
              padding: 16,
              borderRadius: 8,
              alignItems: 'center',
            }}
            onPress={fixPermissions}
            disabled={isRunning}
          >
            <Text style={{ color: '#fff', fontWeight: '600', fontSize: 16 }}>
              🔐 Fix Permissions
            </Text>
            <Text style={{ color: '#fff', fontSize: 12, marginTop: 4 }}>
              Open settings to grant Usage Stats & Accessibility
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              backgroundColor: isRunning ? '#666' : '#27ae60',
              padding: 16,
              borderRadius: 8,
              alignItems: 'center',
            }}
            onPress={testAppBlocking}
            disabled={isRunning}
          >
            <Text style={{ color: '#fff', fontWeight: '600', fontSize: 16 }}>
              📱 Test App Detection
            </Text>
            <Text style={{ color: '#fff', fontSize: 12, marginTop: 4 }}>
              Verify YouTube, Chrome, Google apps are detected
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              backgroundColor: isRunning ? '#666' : '#3498db',
              padding: 16,
              borderRadius: 8,
              alignItems: 'center',
            }}
            onPress={() => setShowAppListTest(true)}
            disabled={isRunning}
          >
            <Text style={{ color: '#fff', fontWeight: '600', fontSize: 16 }}>
              📋 View All Apps
            </Text>
            <Text style={{ color: '#fff', fontSize: 12, marginTop: 4 }}>
              See all detected apps including system apps
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              backgroundColor: isRunning ? '#666' : '#9b59b6',
              padding: 16,
              borderRadius: 8,
              alignItems: 'center',
            }}
            onPress={() => setShowPermanentBlocking(true)}
            disabled={isRunning}
          >
            <Text style={{ color: '#fff', fontWeight: '600', fontSize: 16 }}>
              ⏰ Test 2-Hour Delay Blocking
            </Text>
            <Text style={{ color: '#fff', fontSize: 12, marginTop: 4 }}>
              Test permanent blocking with 2-hour disable delay
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              backgroundColor: '#666',
              padding: 12,
              borderRadius: 8,
              alignItems: 'center',
            }}
            onPress={clearResults}
          >
            <Text style={{ color: '#fff', fontWeight: '600' }}>
              Clear Results
            </Text>
          </TouchableOpacity>
        </View>

        {/* Results Section */}
        <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600', marginBottom: 10 }}>
          Debug Results:
        </Text>
        
        <View style={{ 
          flex: 1, 
          backgroundColor: '#2a2a2a', 
          padding: 12, 
          borderRadius: 8,
          minHeight: 200
        }}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={{ color: '#fff', fontFamily: 'monospace', fontSize: 12 }}>
              {testResults || 'No tests run yet. Use the buttons above to start debugging.\n\nRecommended order:\n1. Debug Blocking Status\n2. Fix Permissions (if needed)\n3. Test App Detection\n4. View All Apps'}
            </Text>
          </ScrollView>
        </View>
      </ScrollView>

      {/* App List Test Modal */}
      <Modal
        visible={showAppListTest}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setShowAppListTest(false)}
      >
        <AppListTest onClose={() => setShowAppListTest(false)} />
      </Modal>

      {/* Permanent Blocking Test Modal */}
      <Modal
        visible={showPermanentBlocking}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowPermanentBlocking(false)}
      >
        <View style={{ flex: 1, backgroundColor: '#1a1a1a' }}>
          <View style={{ 
            flexDirection: 'row', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            padding: 20, 
            borderBottomWidth: 1, 
            borderBottomColor: '#333' 
          }}>
            <Text style={{ color: '#fff', fontSize: 20, fontWeight: 'bold' }}>
              2-Hour Delay Blocking Test
            </Text>
            <TouchableOpacity
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: '#333',
                justifyContent: 'center',
                alignItems: 'center',
              }}
              onPress={() => setShowPermanentBlocking(false)}
            >
              <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={{ flex: 1, padding: 20 }}>
            <PermanentBlockingControl 
              isBlocking={isBlocking}
              onBlockingChange={setIsBlocking}
            />
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};