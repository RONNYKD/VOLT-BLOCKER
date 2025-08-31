import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  Modal,
  ScrollView,
} from 'react-native';
import { persistentProtectionService } from '../../services/protection/PersistentProtectionService';
import { logger } from '../../utils/logger';

interface EnhancedProtectionSetupProps {
  visible: boolean;
  onClose: () => void;
  onProtectionEnabled?: () => void;
}

const EnhancedProtectionSetup: React.FC<EnhancedProtectionSetupProps> = ({
  visible,
  onClose,
  onProtectionEnabled,
}) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [protectionStatus, setProtectionStatus] = useState<any>(null);
  const [showDisableOptions, setShowDisableOptions] = useState(false);
  const [remainingTime, setRemainingTime] = useState<number>(0);

  useEffect(() => {
    if (visible) {
      checkProtectionStatus();
    }
  }, [visible]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (remainingTime > 0) {
      interval = setInterval(() => {
        setRemainingTime(prev => {
          const newTime = Math.max(0, prev - 1000);
          if (newTime === 0) {
            checkProtectionStatus();
          }
          return newTime;
        });
      }, 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [remainingTime]);

  const checkProtectionStatus = async () => {
    try {
      const status = await persistentProtectionService.getProtectionStatus();
      setProtectionStatus(status);
      setRemainingTime(status.timeRemaining || 0);
    } catch (error) {
      logger.error('Error checking protection status:', error);
    }
  };

  const handleEnableProtection = async () => {
    if (!password || password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      const result = await persistentProtectionService.enableProtection(password);
      
      if (result.success) {
        Alert.alert(
          'Protection Enabled',
          'Uninstall protection is now active. The app cannot be uninstalled for 5 hours without your password.',
          [
            {
              text: 'OK',
              onPress: () => {
                onProtectionEnabled?.();
                onClose();
              },
            },
          ]
        );
      } else {
        Alert.alert('Error', result.message || 'Failed to enable protection');
      }
    } catch (error) {
      logger.error('Error enabling protection:', error);
      Alert.alert('Error', 'Failed to enable protection. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisableProtection = async () => {
    if (!currentPassword) {
      Alert.alert('Error', 'Please enter your protection password');
      return;
    }

    setIsLoading(true);

    try {
      const result = await persistentProtectionService.disableProtection(currentPassword);
      
      if (result.success) {
        Alert.alert(
          'Protection Disabled',
          'Uninstall protection has been disabled successfully.',
          [
            {
              text: 'OK',
              onPress: () => {
                onClose();
                checkProtectionStatus();
              },
            },
          ]
        );
      } else if (result.canOverride) {
        // Show override options
        const hours = Math.floor((result.remainingTimeMs || 0) / (60 * 60 * 1000));
        const minutes = Math.floor(((result.remainingTimeMs || 0) % (60 * 60 * 1000)) / (60 * 1000));
        
        Alert.alert(
          'Protection Active',
          `Protection cannot be disabled yet. Time remaining: ${hours}h ${minutes}m\n\nYou can:\n1. Wait for the time to expire\n2. Use emergency override (logged)\n3. Cancel and keep protection active`,
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Wait', onPress: () => setShowDisableOptions(false) },
            {
              text: 'Emergency Override',
              style: 'destructive',
              onPress: () => handleOverrideDisable(),
            },
          ]
        );
      } else {
        Alert.alert('Error', result.message || 'Failed to disable protection');
      }
    } catch (error) {
      logger.error('Error disabling protection:', error);
      Alert.alert('Error', 'Failed to disable protection. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOverrideDisable = async () => {
    Alert.alert(
      'Emergency Override',
      'This will immediately disable protection but will be logged for security purposes. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Override',
          style: 'destructive',
          onPress: async () => {
            setIsLoading(true);
            try {
              const result = await persistentProtectionService.requestOverrideDisable(currentPassword);
              
              if (result.success) {
                Alert.alert(
                  'Protection Disabled',
                  'Protection has been disabled via emergency override. This action has been logged.',
                  [
                    {
                      text: 'OK',
                      onPress: () => {
                        onClose();
                        checkProtectionStatus();
                      },
                    },
                  ]
                );
              } else {
                Alert.alert('Error', result.message || 'Failed to override protection');
              }
            } catch (error) {
              logger.error('Error overriding protection:', error);
              Alert.alert('Error', 'Failed to override protection.');
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  const formatTime = (ms: number): string => {
    const hours = Math.floor(ms / (60 * 60 * 1000));
    const minutes = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000));
    const seconds = Math.floor((ms % (60 * 1000)) / 1000);
    return `${hours}h ${minutes}m ${seconds}s`;
  };

  const renderProtectionStatus = () => {
    if (!protectionStatus) return null;

    if (protectionStatus.isActive) {
      return (
        <View style={styles.statusContainer}>
          <Text style={styles.statusTitle}>🛡️ Protection Active</Text>
          <Text style={styles.statusText}>
            Uninstall protection is currently enabled.
          </Text>
          
          {remainingTime > 0 && (
            <View style={styles.timeContainer}>
              <Text style={styles.timeLabel}>Time until disable allowed:</Text>
              <Text style={styles.timeValue}>{formatTime(remainingTime)}</Text>
            </View>
          )}
          
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Enter Protection Password:</Text>
            <TextInput
              style={styles.input}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder="Protection password"
              secureTextEntry
              autoCapitalize="none"
            />
          </View>
          
          <TouchableOpacity
            style={[styles.button, styles.disableButton]}
            onPress={handleDisableProtection}
            disabled={isLoading || !currentPassword}
          >
            <Text style={styles.buttonText}>
              {isLoading ? 'Processing...' : 'Disable Protection'}
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.setupContainer}>
        <Text style={styles.title}>🔒 Setup Uninstall Protection</Text>
        <Text style={styles.description}>
          Prevent the app from being uninstalled during focus sessions.
          Once enabled, protection cannot be disabled for 5 hours without your password.
        </Text>
        
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Create Protection Password:</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="Enter password (min 6 characters)"
            secureTextEntry
            autoCapitalize="none"
          />
        </View>
        
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Confirm Password:</Text>
          <TextInput
            style={styles.input}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Confirm password"
            secureTextEntry
            autoCapitalize="none"
          />
        </View>
        
        <TouchableOpacity
          style={[styles.button, styles.enableButton]}
          onPress={handleEnableProtection}
          disabled={isLoading || !password || !confirmPassword}
        >
          <Text style={styles.buttonText}>
            {isLoading ? 'Enabling...' : 'Enable Protection'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Uninstall Protection</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.content}>
          {renderProtectionStatus()}
          
          <View style={styles.infoContainer}>
            <Text style={styles.infoTitle}>ℹ️ How it works:</Text>
            <Text style={styles.infoText}>
              • Prevents app uninstall during focus sessions{"\n"}
              • Requires password to disable{"\n"}
              • 5-hour minimum protection period{"\n"}
              • Emergency override available (logged){"\n"}
              • Runs persistent background service
            </Text>
          </View>
        </ScrollView>
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
  content: {
    flex: 1,
    padding: 20,
  },
  setupContainer: {
    marginBottom: 30,
  },
  statusContainer: {
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  statusTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#00d4aa',
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    color: '#ccc',
    marginBottom: 20,
    lineHeight: 24,
  },
  statusText: {
    fontSize: 16,
    color: '#ccc',
    marginBottom: 20,
  },
  timeContainer: {
    backgroundColor: '#2a2a2a',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  timeLabel: {
    fontSize: 14,
    color: '#ccc',
    marginBottom: 5,
  },
  timeValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ff6b6b',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#2a2a2a',
    borderWidth: 1,
    borderColor: '#444',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    color: '#fff',
  },
  button: {
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  enableButton: {
    backgroundColor: '#00d4aa',
  },
  disableButton: {
    backgroundColor: '#ff6b6b',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  infoContainer: {
    backgroundColor: '#2a2a2a',
    padding: 20,
    borderRadius: 8,
    marginTop: 20,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 14,
    color: '#ccc',
    lineHeight: 20,
  },
});

export default EnhancedProtectionSetup;