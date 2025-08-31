/**
 * Register Screen - Simple and user-friendly registration
 */
import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  Alert, 
  KeyboardAvoidingView, 
  Platform,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { useAppTheme } from '../../theme/nativewind-setup';
import { useAuthStore } from '../../store';
import type { AuthStackScreenProps } from '../../navigation/types';

type Props = AuthStackScreenProps<'Register'>;

export const RegisterScreen: React.FC<Props> = ({ navigation }) => {
  const { colors } = useAppTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const { signUp, isLoading } = useAuthStore();

  const handleSignUp = async () => {
    // Simple validation
    if (!email.trim()) {
      Alert.alert('Email Required', 'Please enter your email address');
      return;
    }

    if (!email.includes('@')) {
      Alert.alert('Invalid Email', 'Please enter a valid email address');
      return;
    }

    if (!password.trim()) {
      Alert.alert('Password Required', 'Please enter a password');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Password Too Short', 'Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Passwords Don\'t Match', 'Please make sure both passwords are the same');
      return;
    }

    try {
      await signUp(email.trim(), password);
      Alert.alert(
        'Account Created!', 
        'Welcome to VOLT! You can now start using the app.',
        [{ text: 'Get Started', style: 'default' }]
      );
    } catch (error) {
      const errorMessage = (error as Error).message;
      if (errorMessage.includes('already registered')) {
        Alert.alert('Account Exists', 'This email is already registered. Try signing in instead.');
      } else if (errorMessage.includes('Network request failed')) {
        Alert.alert('Connection Error', 'Please check your internet connection and try again.');
      } else {
        Alert.alert('Registration Failed', 'Something went wrong. Please try again.');
      }
    }
  };

  const generateRandomEmail = () => {
    // Help users with a quick random email for testing
    const randomNum = Math.floor(Math.random() * 1000);
    setEmail(`user${randomNum}@example.com`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Simple Logo Section */}
          <View style={styles.logoSection}>
            <LinearGradient
              colors={['#00d4aa', '#00ffff']}
              style={styles.logo}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.logoText}>V</Text>
            </LinearGradient>
            <Text style={styles.appName}>VOLT</Text>
            <Text style={styles.tagline}>Join the focus revolution!</Text>
          </View>

          {/* Simple Form */}
          <View style={styles.formSection}>
            {/* Email Input */}
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.inputLabel}>Email</Text>
                <TouchableOpacity onPress={generateRandomEmail} disabled={isLoading}>
                  <Text style={styles.helperText}>🎲 Random</Text>
                </TouchableOpacity>
              </View>
              <TextInput
                style={styles.textInput}
                placeholder="your@email.com"
                placeholderTextColor="#666"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
                returnKeyType="next"
              />
            </View>

            {/* Password Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Password</Text>
              <TextInput
                style={styles.textInput}
                placeholder="At least 6 characters"
                placeholderTextColor="#666"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
                returnKeyType="next"
              />
            </View>

            {/* Confirm Password Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Confirm Password</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Same as above"
                placeholderTextColor="#666"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
                returnKeyType="go"
                onSubmitEditing={handleSignUp}
              />
            </View>

            {/* Quick Fill Button */}
            <TouchableOpacity
              style={styles.quickFillButton}
              onPress={() => {
                if (!email) generateRandomEmail();
                setPassword('demo123');
                setConfirmPassword('demo123');
              }}
              disabled={isLoading}
            >
              <Text style={styles.quickFillText}>⚡ Quick Fill for Testing</Text>
            </TouchableOpacity>

            {/* Sign Up Button */}
            <TouchableOpacity
              style={[styles.signUpButton, isLoading && styles.signUpButtonDisabled]}
              onPress={handleSignUp}
              disabled={isLoading}
            >
              <LinearGradient
                colors={isLoading ? ['#666', '#888'] : ['#00d4aa', '#00ffff']}
                style={styles.signUpGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {isLoading ? (
                  <ActivityIndicator color="#000" size="small" />
                ) : (
                  <Text style={styles.signUpButtonText}>Create Account</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Terms Text */}
            <Text style={styles.termsText}>
              By creating an account, you agree to focus better and reduce digital distractions.
            </Text>
          </View>

          {/* Simple Footer */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.signInButton}
              onPress={() => navigation.navigate('Login')}
              disabled={isLoading}
            >
              <Text style={styles.signInText}>
                Already have an account? <Text style={styles.signInLink}>Sign In</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  logoSection: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  logo: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    color: '#00d4aa',
    fontWeight: '500',
  },
  formSection: {
    flex: 1,
    maxWidth: 400,
    alignSelf: 'center',
    width: '100%',
  },
  inputGroup: {
    marginBottom: 20,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  helperText: {
    fontSize: 12,
    color: '#00d4aa',
    fontWeight: '500',
  },
  textInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    height: 50,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#fff',
  },
  quickFillButton: {
    backgroundColor: 'rgba(0, 212, 170, 0.2)',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 24,
    alignItems: 'center',
  },
  quickFillText: {
    color: '#00d4aa',
    fontSize: 14,
    fontWeight: '500',
  },
  signUpButton: {
    marginBottom: 16,
  },
  signUpButtonDisabled: {
    opacity: 0.6,
  },
  signUpGradient: {
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  signUpButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  termsText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  footer: {
    alignItems: 'center',
    paddingBottom: 20,
  },
  signInButton: {
    paddingVertical: 16,
  },
  signInText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
  signInLink: {
    color: '#00d4aa',
    fontWeight: '600',
  },
});