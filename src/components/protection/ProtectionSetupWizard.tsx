import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { NativeModules } from 'react-native';
import { useAppTheme } from '../../theme/nativewind-setup';

const { VoltUninstallProtection } = NativeModules;

interface ProtectionSetupWizardProps {
  onComplete: () => void;
  onCancel: () => void;
}

export const ProtectionSetupWizard: React.FC<ProtectionSetupWizardProps> = ({
  onComplete,
  onCancel,
}) => {
  const { colors } = useAppTheme();
  const [currentStep, setCurrentStep] = useState(0);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [deviceAdminEnabled, setDeviceAdminEnabled] = useState(false);

  const steps = [
    'Introduction',
    'Set Password',
    'Enable Device Admin',
    'Complete Setup',
  ];

  useEffect(() => {
    checkDeviceAdminStatus();
  }, []);

  const checkDeviceAdminStatus = async () => {
    try {
      const isEnabled = await VoltUninstallProtection.isDeviceAdminEnabled();
      setDeviceAdminEnabled(isEnabled);
    } catch (error) {
      console.error('Error checking device admin status:', error);
    }
  };

  const handleNext = async () => {
    if (currentStep === 0) {
      setCurrentStep(1);
    } else if (currentStep === 1) {
      if (validatePassword()) {
        await savePassword();
        setCurrentStep(2);
      }
    } else if (currentStep === 2) {
      if (deviceAdminEnabled) {
        // If already enabled, go to next step
        setCurrentStep(3);
      } else {
        // If not enabled, open settings
        await openDeviceAdminSettings();
      }
    } else if (currentStep === 3) {
      await completeSetup();
    }
  };

  const openDeviceAdminSettings = async () => {
    try {
      setIsLoading(true);
      const opened = await VoltUninstallProtection.openDeviceAdminSettings();
      if (!opened) {
        Alert.alert(
          'Manual Setup Required',
          'Please go to:\nAndroid Settings → Security → Device Administrators\n\nFind VOLT and enable it.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      Alert.alert(
        'Manual Setup Required',
        'Please go to:\nAndroid Settings → Security → Device Administrators\n\nFind VOLT and enable it.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const validatePassword = () => {
    if (password.length < 4) {
      Alert.alert('Error', 'Password must be at least 4 characters long');
      return false;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return false;
    }
    return true;
  };

  const savePassword = async () => {
    try {
      setIsLoading(true);
      const result = await VoltUninstallProtection.setupProtectionPassword(password);
      console.log('Password setup result:', result);
      
      // Handle both object and boolean responses
      const success = typeof result === 'object' ? result.success : result;
      
      if (!success) {
        const message = typeof result === 'object' ? result.message : 'Failed to save password';
        Alert.alert('Error', message);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to save password');
      console.error('Error saving password:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const enableDeviceAdmin = async () => {
    try {
      setIsLoading(true);
      const result = await VoltUninstallProtection.requestDeviceAdmin();
      
      if (result) {
        // Check if already enabled
        const isEnabled = await VoltUninstallProtection.isDeviceAdminEnabled();
        if (isEnabled) {
          setDeviceAdminEnabled(true);
          setCurrentStep(3);
          Alert.alert('Success!', 'Device administrator is already enabled!');
        } else {
          Alert.alert(
            'Enable Device Administrator',
            'Please enable VOLT as a device administrator in the settings that just opened.\n\nAfter enabling, tap "Check Status" to continue.',
            [{ text: 'OK' }]
          );
        }
      } else {
        Alert.alert('Error', 'Failed to open device admin settings');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to request device admin permission');
      console.error('Error enabling device admin:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkDeviceAdminStatusManually = async () => {
    try {
      setIsLoading(true);
      const isEnabled = await VoltUninstallProtection.isDeviceAdminEnabled();
      setDeviceAdminEnabled(isEnabled);
      
      if (isEnabled) {
        Alert.alert(
          'Success!',
          'Device administrator has been enabled. You can now proceed to the next step.',
          [{ text: 'Continue', onPress: () => setCurrentStep(3) }]
        );
      } else {
        Alert.alert(
          'Not Enabled Yet',
          'Device administrator is not yet enabled. Please go to Android Settings > Security > Device Administrators and enable VOLT.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to check device admin status');
      console.error('Error checking device admin:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const completeSetup = async () => {
    try {
      setIsLoading(true);
      const result = await VoltUninstallProtection.enableProtection();
      
      if (result && result.success) {
        Alert.alert(
          'Setup Complete',
          'Uninstall protection has been enabled successfully!',
          [{ text: 'OK', onPress: onComplete }]
        );
      } else {
        const message = result?.message || 'Failed to enable protection';
        Alert.alert('Error', message);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to complete setup');
      console.error('Error completing setup:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <View style={styles.stepContent}>
            <Text style={[styles.title, { color: colors.text }]}>
              🛡️ Uninstall Protection
            </Text>
            <Text style={[styles.description, { color: colors.textSecondary }]}>
              Protect VOLT from being uninstalled without your permission.
            </Text>
            <View style={styles.featureList}>
              <Text style={[styles.feature, { color: colors.text }]}>
                • Prevents unauthorized app removal
              </Text>
              <Text style={[styles.feature, { color: colors.text }]}>
                • Requires password to disable protection
              </Text>
              <Text style={[styles.feature, { color: colors.text }]}>
                • Monitors uninstall attempts
              </Text>
              <Text style={[styles.feature, { color: colors.text }]}>
                • Secure device admin integration
              </Text>
            </View>
            <Text style={[styles.warning, { color: colors.warning }]}>
              ⚠️ This feature requires device administrator permissions
            </Text>
          </View>
        );

      case 1:
        return (
          <View style={styles.stepContent}>
            <Text style={[styles.title, { color: colors.text }]}>
              🔐 Set Protection Password
            </Text>
            <Text style={[styles.description, { color: colors.textSecondary }]}>
              Create a password that will be required to disable uninstall protection.
            </Text>
            
            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>
                Password (minimum 4 characters)
              </Text>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  color: colors.text 
                }]}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                placeholder="Enter password"
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>
                Confirm Password
              </Text>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  color: colors.text 
                }]}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                placeholder="Confirm password"
                placeholderTextColor={colors.textSecondary}
              />
            </View>
          </View>
        );

      case 2:
        return (
          <View style={styles.stepContent}>
            <Text style={[styles.title, { color: colors.text }]}>
              🔧 Enable Device Admin
            </Text>
            <Text style={[styles.description, { color: colors.textSecondary }]}>
              VOLT needs device administrator permissions to prevent unauthorized uninstalls.
            </Text>
            
            <View style={styles.adminStatus}>
              <Text style={[styles.statusLabel, { color: colors.text }]}>
                Device Admin Status:
              </Text>
              <Text style={[
                styles.statusValue,
                { color: deviceAdminEnabled ? colors.success : colors.error }
              ]}>
                {deviceAdminEnabled ? '✅ Enabled' : '❌ Disabled'}
              </Text>
            </View>

            <Text style={[styles.instruction, { color: colors.textSecondary }]}>
              1. Tap "Open Settings" below to open Android settings{'\n'}
              2. Find VOLT in the Device Administrators list and enable it{'\n'}
              3. Return to this app and tap "Check Status"{'\n'}
              4. Once enabled, you can continue to the next step
            </Text>

            {!deviceAdminEnabled && (
              <View style={styles.buttonGroup}>
                <TouchableOpacity
                  style={[styles.checkButton, { backgroundColor: colors.secondary }]}
                  onPress={checkDeviceAdminStatusManually}
                  disabled={isLoading}
                >
                  <Text style={[styles.checkButtonText, { color: colors.text }]}>
                    🔄 Check Status
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        );

      case 3:
        return (
          <View style={styles.stepContent}>
            <Text style={[styles.title, { color: colors.text }]}>
              ✅ Setup Complete
            </Text>
            <Text style={[styles.description, { color: colors.textSecondary }]}>
              Uninstall protection is ready to be activated.
            </Text>
            
            <View style={styles.summaryContainer}>
              <Text style={[styles.summaryTitle, { color: colors.text }]}>
                Protection Features:
              </Text>
              <Text style={[styles.summaryItem, { color: colors.success }]}>
                ✅ Password protection set
              </Text>
              <Text style={[styles.summaryItem, { color: colors.success }]}>
                ✅ Device admin enabled
              </Text>
              <Text style={[styles.summaryItem, { color: colors.success }]}>
                ✅ Uninstall monitoring ready
              </Text>
            </View>

            <Text style={[styles.finalNote, { color: colors.textSecondary }]}>
              Once activated, you'll need to enter your password to disable 
              uninstall protection or remove VOLT from your device.
            </Text>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Progress indicator */}
      <View style={styles.progressContainer}>
        <Text style={[styles.progressText, { color: colors.textSecondary }]}>
          Step {currentStep + 1} of {steps.length}
        </Text>
        <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
          <View
            style={[
              styles.progressFill,
              { 
                backgroundColor: colors.primary,
                width: `${((currentStep + 1) / steps.length) * 100}%`
              }
            ]}
          />
        </View>
        <Text style={[styles.stepTitle, { color: colors.text }]}>
          {steps[currentStep]}
        </Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderStepContent()}
      </ScrollView>

      {/* Action buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.cancelButton, { borderColor: colors.border }]}
          onPress={onCancel}
          disabled={isLoading}
        >
          <Text style={[styles.buttonText, { color: colors.textSecondary }]}>
            Cancel
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.button,
            styles.nextButton,
            { backgroundColor: colors.primary },
            isLoading && styles.buttonDisabled
          ]}
          onPress={handleNext}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <Text style={styles.nextButtonText}>
              {currentStep === 3 ? 'Complete Setup' : 
               currentStep === 2 ? (deviceAdminEnabled ? 'Next' : 'Open Settings') : 'Next'}
            </Text>
          )}
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
  progressContainer: {
    marginBottom: 30,
  },
  progressText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 8,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    marginBottom: 12,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  stepContent: {
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  featureList: {
    alignSelf: 'stretch',
    marginBottom: 24,
  },
  feature: {
    fontSize: 16,
    marginBottom: 8,
    paddingLeft: 8,
  },
  warning: {
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
  },
  inputContainer: {
    alignSelf: 'stretch',
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
  adminStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  statusLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginRight: 8,
  },
  statusValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  instruction: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  summaryContainer: {
    alignSelf: 'stretch',
    marginBottom: 24,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  summaryItem: {
    fontSize: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  finalNote: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    fontStyle: 'italic',
  },
  buttonGroup: {
    marginTop: 20,
    gap: 12,
  },
  checkButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  checkButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  cancelButton: {
    borderWidth: 1,
    marginRight: 10,
  },
  nextButton: {
    marginLeft: 10,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});