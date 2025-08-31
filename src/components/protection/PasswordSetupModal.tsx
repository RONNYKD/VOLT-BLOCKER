import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useAppTheme } from '../../theme/nativewind-setup';
import { uninstallProtectionService } from '../../services/protection';

interface PasswordSetupModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const PasswordSetupModal: React.FC<PasswordSetupModalProps> = ({
  visible,
  onClose,
  onSuccess,
}) => {
  const { colors } = useAppTheme();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSetupPassword = async () => {
    if (!password || password.length < 4) {
      Alert.alert('Error', 'Password must be at least 4 characters long');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    try {
      setIsLoading(true);
      const result = await uninstallProtectionService.setupProtectionPassword(password);
      
      if (result) {
        Alert.alert('Success', 'Protection password set successfully!', [
          { text: 'OK', onPress: () => {
            setPassword('');
            setConfirmPassword('');
            onSuccess();
          }}
        ]);
      } else {
        Alert.alert('Error', 'Failed to set protection password');
      }
    } catch (error) {
      console.error('Password setup error:', error);
      Alert.alert('Error', 'Failed to set protection password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setPassword('');
    setConfirmPassword('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.modal, { backgroundColor: colors.surface }]}>
          <Text style={[styles.title, { color: colors.text }]}>
            🔐 Set Protection Password
          </Text>
          
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            This password will be required to disable uninstall protection.
          </Text>

          <TextInput
            style={[styles.input, { 
              backgroundColor: colors.background, 
              color: colors.text,
              borderColor: colors.border 
            }]}
            placeholder="Enter password"
            placeholderTextColor={colors.textSecondary}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoFocus
          />

          <TextInput
            style={[styles.input, { 
              backgroundColor: colors.background, 
              color: colors.text,
              borderColor: colors.border 
            }]}
            placeholder="Confirm password"
            placeholderTextColor={colors.textSecondary}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />

          <View style={styles.buttons}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton, { borderColor: colors.border }]}
              onPress={handleClose}
              disabled={isLoading}
            >
              <Text style={[styles.buttonText, { color: colors.text }]}>
                Cancel
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.confirmButton, { backgroundColor: colors.primary }]}
              onPress={handleSetupPassword}
              disabled={isLoading || !password || !confirmPassword}
            >
              <Text style={[styles.buttonText, { color: 'white' }]}>
                {isLoading ? 'Setting up...' : 'Set Password'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 12,
    padding: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    borderWidth: 1,
  },
  confirmButton: {
    // backgroundColor set dynamically
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});