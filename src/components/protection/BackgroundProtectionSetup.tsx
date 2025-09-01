import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { NativeModules } from 'react-native';
import { logger } from '../../utils/logger';

const { VoltUninstallProtectionModule } = NativeModules;

interface SetupStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  critical: boolean;
  action: () => Promise<void>;
}

interface BackgroundProtectionSetupProps {
  visible: boolean;
  onClose: () => void;
  onComplete: () => void;
}

const BackgroundProtectionSetup: React.FC<BackgroundProtectionSetupProps> = ({
  visible,
  onClose,
  onComplete,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [setupSteps, setSetupSteps] = useState<SetupStep[]>([
    {
      id: 'battery',
      title: 'Battery Optimization Exemption',
      description: 'Prevent Android from killing VOLT to save battery',
      completed: false,
      critical: true,
      action: handleBatteryOptimization,
    },
    {
      id: 'autostart',
      title: 'Auto-Start Permission',
      description: 'Allow VOLT to start automatically after device reboot',
      completed: false,
      critical: true,
      action: handleAutoStartPermission,
    },
    {
      id: 'deviceadmin',
      title: 'Device Administrator',
      description: 'Enable uninstall protection and system-level security',
      completed: false,
      critical: true,
      action: handleDeviceAdmin,
    },
    {
      id: 'accessibility',
      title: 'Accessibility Service',
      description: 'Enable app blocking and monitoring capabilities',
      completed: false,
      critical: true,
      action: handleAccessibilityService,
    },
  ]);

  useEffect(() => {
    if (visible) {
      checkAllStepsStatus();
    }
  }, [visible]);

  async function handleBatteryOptimization(): Promise<void> {
    try {
      setIsLoading(true);
      
      // First check current status
      const status = await VoltUninstallProtectionModule.checkBatteryOptimizationStatus();
      
      if (status.isExempt) {
        Alert.alert(
          '✅ Already Configured',
          'VOLT is already exempt from battery optimization.',
          [{ text: 'OK' }]
        );
        updateStepStatus('battery', true);
        return;
      }

      // Request exemption
      const result = await VoltUninstallProtectionModule.requestBatteryOptimizationExemption();
      
      Alert.alert(
        '🔋 Battery Optimization',
        'Please select "Don\'t optimize" or "Allow" for VOLT in the battery settings that just opened.\\n\\nThis is CRITICAL for background protection to work.',
        [
          {
            text: 'I\'ve Done This',
            onPress: () => {
              updateStepStatus('battery', true);
              checkAllStepsStatus();
            },
          },
          {
            text: 'Skip (Not Recommended)',
            style: 'destructive',
            onPress: () => {
              Alert.alert(
                '⚠️ Warning',
                'Skipping battery optimization may cause VOLT to stop working after a few hours. Are you sure?',
                [
                  { text: 'Go Back', style: 'cancel' },
                  { 
                    text: 'Skip Anyway', 
                    style: 'destructive',
                    onPress: () => updateStepStatus('battery', false)
                  },
                ]
              );
            },
          },
        ]
      );
    } catch (error) {
      logger.error('Error handling battery optimization:', error);
      Alert.alert('Error', 'Failed to open battery optimization settings');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleAutoStartPermission(): Promise<void> {
    try {
      setIsLoading(true);
      
      const result = await VoltUninstallProtectionModule.requestAutoStartPermission();
      
      Alert.alert(
        '🚀 Auto-Start Permission',
        `${result.message}\\n\\nPlease enable auto-start/auto-launch for VOLT. This ensures protection resumes after device restart.`,
        [
          {
            text: 'I\'ve Enabled It',
            onPress: () => {
              updateStepStatus('autostart', true);
              checkAllStepsStatus();
            },
          },
          {
            text: 'Skip (Not Recommended)',
            style: 'destructive',
            onPress: () => {
              Alert.alert(
                '⚠️ Warning',
                'Without auto-start permission, VOLT protection may not resume after device restart. Continue anyway?',
                [
                  { text: 'Go Back', style: 'cancel' },
                  { 
                    text: 'Skip Anyway', 
                    style: 'destructive',
                    onPress: () => updateStepStatus('autostart', false)
                  },
                ]
              );
            },
          },
        ]
      );
    } catch (error) {
      logger.error('Error handling auto-start permission:', error);
      Alert.alert('Error', 'Failed to open auto-start settings');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDeviceAdmin(): Promise<void> {
    try {
      setIsLoading(true);
      
      const result = await VoltUninstallProtectionModule.requestDeviceAdminPermission();
      
      Alert.alert(
        '🛡️ Device Administrator',
        'Please activate VOLT as a device administrator. This enables uninstall protection and prevents easy bypass of security measures.',
        [
          {
            text: 'I\'ve Activated It',
            onPress: async () => {
              // Verify activation
              try {
                const isEnabled = await VoltUninstallProtectionModule.isDeviceAdminEnabled();
                updateStepStatus('deviceadmin', isEnabled);
                if (!isEnabled) {
                  Alert.alert('Not Activated', 'Device admin was not activated. Please try again.');
                }
              } catch (error) {
                updateStepStatus('deviceadmin', true); // Assume success if we can't verify
              }
              checkAllStepsStatus();
            },
          },
          {
            text: 'Skip (Not Recommended)',
            style: 'destructive',
            onPress: () => {
              Alert.alert(
                '⚠️ Critical Warning',
                'Without device administrator privileges, users can easily uninstall VOLT and bypass all protection. This defeats the purpose of the app. Are you absolutely sure?',
                [
                  { text: 'Go Back', style: 'cancel' },
                  { 
                    text: 'Skip Anyway', 
                    style: 'destructive',
                    onPress: () => updateStepStatus('deviceadmin', false)
                  },
                ]
              );
            },
          },
        ]
      );
    } catch (error) {
      logger.error('Error handling device admin:', error);
      Alert.alert('Error', 'Failed to request device administrator privileges');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleAccessibilityService(): Promise<void> {
    try {
      setIsLoading(true);
      
      Alert.alert(
        '👁️ Accessibility Service',
        'VOLT needs accessibility service to monitor and block apps during focus sessions.\\n\\nPlease:\\n1. Find "VOLT" in the accessibility settings\\n2. Turn it ON\\n3. Confirm when prompted',
        [
          {
            text: 'Open Settings',
            onPress: async () => {
              try {
                await VoltUninstallProtectionModule.openAccessibilitySettings();
              } catch (error) {
                logger.error('Error opening accessibility settings:', error);
              }
            },
          },
          {
            text: 'I\'ve Enabled It',
            onPress: () => {
              updateStepStatus('accessibility', true);
              checkAllStepsStatus();
            },
          },
          {
            text: 'Skip (Not Recommended)',
            style: 'destructive',
            onPress: () => {
              Alert.alert(
                '⚠️ Critical Warning',
                'Without accessibility service, VOLT cannot block apps or websites. The core functionality will not work. Continue anyway?',
                [
                  { text: 'Go Back', style: 'cancel' },
                  { 
                    text: 'Skip Anyway', 
                    style: 'destructive',
                    onPress: () => updateStepStatus('accessibility', false)
                  },
                ]
              );
            },
          },
        ]
      );
    } catch (error) {
      logger.error('Error handling accessibility service:', error);
      Alert.alert('Error', 'Failed to open accessibility settings');
    } finally {
      setIsLoading(false);
    }
  }

  const updateStepStatus = (stepId: string, completed: boolean) => {
    setSetupSteps(prev => 
      prev.map(step => 
        step.id === stepId ? { ...step, completed } : step
      )
    );
  };

  const checkAllStepsStatus = async () => {
    try {
      // Check battery optimization
      const batteryStatus = await VoltUninstallProtectionModule.checkBatteryOptimizationStatus();
      updateStepStatus('battery', batteryStatus.isExempt);

      // Check device admin
      const deviceAdminStatus = await VoltUninstallProtectionModule.isDeviceAdminEnabled();
      updateStepStatus('deviceadmin', deviceAdminStatus);

      // Note: Auto-start and accessibility are harder to check programmatically
      // We rely on user confirmation for these
    } catch (error) {
      logger.error('Error checking steps status:', error);
    }
  };

  const handleStepPress = async (step: SetupStep) => {
    if (step.completed) {
      Alert.alert(
        '✅ Already Completed',
        `${step.title} is already configured. Do you want to reconfigure it?`,
        [
          { text: 'No', style: 'cancel' },
          { text: 'Yes', onPress: step.action },
        ]
      );
    } else {
      await step.action();
    }
  };

  const handleComplete = () => {
    const completedSteps = setupSteps.filter(step => step.completed).length;
    const criticalSteps = setupSteps.filter(step => step.critical && step.completed).length;
    const totalCriticalSteps = setupSteps.filter(step => step.critical).length;

    if (criticalSteps === totalCriticalSteps) {
      Alert.alert(
        '🎉 Setup Complete!',
        'All critical steps have been completed. VOLT is now configured for maximum background persistence.',
        [
          {
            text: 'Finish',
            onPress: () => {
              onComplete();
              onClose();
            },
          },
        ]
      );
    } else {
      Alert.alert(
        '⚠️ Incomplete Setup',
        `You have completed ${completedSteps}/${setupSteps.length} steps, but only ${criticalSteps}/${totalCriticalSteps} critical steps.\\n\\nVOLT may not work reliably in the background. Continue anyway?`,
        [
          { text: 'Continue Setup', style: 'cancel' },
          {
            text: 'Finish Anyway',
            style: 'destructive',
            onPress: () => {
              onComplete();
              onClose();
            },
          },
        ]
      );
    }
  };

  const renderStepCard = (step: SetupStep, index: number) => {
    const isCompleted = step.completed;
    const isCurrent = index === currentStep;

    return (
      <TouchableOpacity
        key={step.id}
        style={[
          styles.stepCard,
          isCompleted && styles.stepCardCompleted,
          isCurrent && styles.stepCardCurrent,
        ]}
        onPress={() => handleStepPress(step)}
        disabled={isLoading}
      >
        <View style={styles.stepHeader}>
          <View style={styles.stepIcon}>
            <Text style={styles.stepIconText}>
              {isCompleted ? '✅' : step.critical ? '🔴' : '⚪'}
            </Text>
          </View>
          <View style={styles.stepContent}>
            <Text style={[styles.stepTitle, isCompleted && styles.stepTitleCompleted]}>
              {step.title}
            </Text>
            <Text style={styles.stepDescription}>
              {step.description}
            </Text>
            {step.critical && !isCompleted && (
              <Text style={styles.criticalLabel}>CRITICAL</Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const completedSteps = setupSteps.filter(step => step.completed).length;
  const progressPercentage = (completedSteps / setupSteps.length) * 100;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>🛡️ Background Protection Setup</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>
            Progress: {completedSteps}/{setupSteps.length} steps completed
          </Text>
          <View style={styles.progressBar}>
            <View 
              style={[styles.progressFill, { width: `${progressPercentage}%` }]} 
            />
          </View>
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.introSection}>
            <Text style={styles.introTitle}>Why This Setup is Critical</Text>
            <Text style={styles.introText}>
              Android aggressively kills background apps to save battery. Without proper configuration, 
              VOLT will stop working after a few hours, making all protection useless.
            </Text>
            <Text style={styles.introWarning}>
              ⚠️ Skipping these steps will cause VOLT to fail when you need it most!
            </Text>
          </View>

          {setupSteps.map((step, index) => renderStepCard(step, index))}

          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.button, styles.completeButton]}
              onPress={handleComplete}
              disabled={isLoading}
            >
              <Text style={styles.buttonText}>
                {isLoading ? 'Processing...' : 'Complete Setup'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.skipButton]}
              onPress={() => {
                Alert.alert(
                  '⚠️ Skip Setup?',
                  'Skipping this setup may cause VOLT to stop working in the background. Are you sure?',
                  [
                    { text: 'Continue Setup', style: 'cancel' },
                    { 
                      text: 'Skip Anyway', 
                      style: 'destructive',
                      onPress: onClose
                    },
                  ]
                );
              }}
              disabled={isLoading}
            >
              <Text style={[styles.buttonText, styles.skipButtonText]}>
                Skip Setup (Not Recommended)
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#00d4aa" />
            <Text style={styles.loadingText}>Processing...</Text>
          </View>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  progressContainer: {
    padding: 20,
    backgroundColor: '#2a2a2a',
  },
  progressText: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 10,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#444',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#00d4aa',
    borderRadius: 4,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  introSection: {
    marginBottom: 30,
    padding: 20,
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
  },
  introTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  introText: {
    fontSize: 14,
    color: '#ccc',
    lineHeight: 20,
    marginBottom: 10,
  },
  introWarning: {
    fontSize: 14,
    color: '#ff6b6b',
    fontWeight: 'bold',
  },
  stepCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  stepCardCompleted: {
    borderColor: '#00d4aa',
    backgroundColor: '#1a3a2a',
  },
  stepCardCurrent: {
    borderColor: '#00d4aa',
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  stepIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#444',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stepIconText: {
    fontSize: 18,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  stepTitleCompleted: {
    color: '#00d4aa',
  },
  stepDescription: {
    fontSize: 14,
    color: '#ccc',
    lineHeight: 18,
  },
  criticalLabel: {
    fontSize: 12,
    color: '#ff6b6b',
    fontWeight: 'bold',
    marginTop: 4,
  },
  actionButtons: {
    marginTop: 30,
    gap: 12,
  },
  button: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  completeButton: {
    backgroundColor: '#00d4aa',
  },
  skipButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#666',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  skipButtonText: {
    color: '#999',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 12,
  },
});

export default BackgroundProtectionSetup;