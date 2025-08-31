/**
 * Login Screen - Simple and user-friendly authentication
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
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { useAppTheme } from '../../theme/nativewind-setup';
import { useAuthStore } from '../../store';
import type { AuthStackScreenProps } from '../../navigation/types';

type Props = AuthStackScreenProps<'Login'>;

export const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const { colors } = useAppTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { signIn, isLoading } = useAuthStore();

  const handleSignIn = async () => {
    if (!email.trim()) {
      Alert.alert('Email Required', 'Please enter your email address');
      return;
    }

    if (!password.trim()) {
      Alert.alert('Password Required', 'Please enter your password');
      return;
    }

    try {
      await signIn(email.trim(), password);
    } catch (error) {
      const errorMessage = (error as Error).message;
      if (errorMessage.includes('Invalid login credentials')) {
        Alert.alert('Login Failed', 'Invalid email or password. Please try again.');
      } else if (errorMessage.includes('Network request failed')) {
        Alert.alert('Connection Error', 'Please check your internet connection and try again.');
      } else {
        Alert.alert('Login Failed', 'Something went wrong. Please try again.');
      }
    }
  };

  const handleQuickDemo = () => {
    // Pre-fill demo credentials to reduce typing
    setEmail('demo@volt.app');
    setPassword('demo123');
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
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
            <Text style={styles.tagline}>Welcome back!</Text>
          </View>

          {/* Simple Form */}
          <View style={styles.formSection}>
            {/* Email Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email</Text>
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
                placeholder="Your password"
                placeholderTextColor="#666"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
                returnKeyType="go"
                onSubmitEditing={handleSignIn}
              />
            </View>

            {/* Quick Demo Button */}
            <TouchableOpacity
              style={styles.demoButton}
              onPress={handleQuickDemo}
              disabled={isLoading}
            >
              <Text style={styles.demoButtonText}>📱 Try Demo Account</Text>
            </TouchableOpacity>

            {/* Sign In Button */}
            <TouchableOpacity
              style={[styles.signInButton, isLoading && styles.signInButtonDisabled]}
              onPress={handleSignIn}
              disabled={isLoading}
            >
              <LinearGradient
                colors={isLoading ? ['#666', '#888'] : ['#00d4aa', '#00ffff']}
                style={styles.signInGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {isLoading ? (
                  <ActivityIndicator color="#000" size="small" />
                ) : (
                  <Text style={styles.signInButtonText}>Sign In</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Forgot Password */}
            <TouchableOpacity
              style={styles.forgotPassword}
              onPress={() => navigation.navigate('ForgotPassword')}
              disabled={isLoading}
            >
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>
          </View>

          {/* Simple Footer */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.createAccountButton}
              onPress={() => navigation.navigate('Register')}
              disabled={isLoading}
            >
              <Text style={styles.createAccountText}>
                New to VOLT? <Text style={styles.createAccountLink}>Create Account</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </View>
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
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  logoSection: {
    alignItems: 'center',
    marginTop: 40,
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
    justifyContent: 'center',
    maxWidth: 400,
    alignSelf: 'center',
    width: '100%',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
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
  demoButton: {
    backgroundColor: 'rgba(0, 212, 170, 0.2)',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 24,
    alignItems: 'center',
  },
  demoButtonText: {
    color: '#00d4aa',
    fontSize: 14,
    fontWeight: '500',
  },
  signInButton: {
    marginBottom: 16,
  },
  signInButtonDisabled: {
    opacity: 0.6,
  },
  signInGradient: {
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  signInButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  forgotPassword: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: '#00d4aa',
    fontWeight: '500',
  },
  footer: {
    alignItems: 'center',
    paddingBottom: 20,
  },
  createAccountButton: {
    paddingVertical: 16,
  },
  createAccountText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
  createAccountLink: {
    color: '#00d4aa',
    fontWeight: '600',
  },
});