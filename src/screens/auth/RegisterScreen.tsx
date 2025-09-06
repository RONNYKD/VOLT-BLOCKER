/**
 * Register Screen - Professional and elegant registration
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
  ScrollView,
  Dimensions,
  StatusBar
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


  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Professional Background */}
        <View style={styles.backgroundOverlay}>
          <View style={styles.gradientAccent} />
          <View style={styles.gradientAccent2} />
        </View>
        
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Enhanced Logo Section */}
          <View style={styles.logoSection}>
            <View style={styles.logoContainer}>
              <LinearGradient
                colors={['#00d4aa', '#00ffff']}
                style={styles.logo}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.logoText}>V</Text>
              </LinearGradient>
              <View style={styles.logoGlow} />
            </View>
            <Text style={styles.appName}>VOLT</Text>
            <Text style={styles.tagline}>Join the focus revolution and unlock your potential</Text>
          </View>

          {/* Professional Form */}
          <View style={styles.formSection}>
            <View style={styles.formCard}>
              <Text style={styles.formTitle}>Create Your Account</Text>
              <Text style={styles.formSubtitle}>Start your journey to better focus and productivity</Text>
              
              {/* Email Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email Address</Text>
                <View style={styles.inputContainer}>
                  <View style={styles.inputIcon}>
                    <Text style={styles.iconText}>✉</Text>
                  </View>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Enter your email"
                    placeholderTextColor="rgba(255, 255, 255, 0.5)"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!isLoading}
                    returnKeyType="next"
                  />
                </View>
              </View>

              {/* Password Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Password</Text>
                <View style={styles.inputContainer}>
                  <View style={styles.inputIcon}>
                    <Text style={styles.iconText}>🔒</Text>
                  </View>
                  <TextInput
                    style={styles.textInput}
                    placeholder="At least 6 characters"
                    placeholderTextColor="rgba(255, 255, 255, 0.5)"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!isLoading}
                    returnKeyType="next"
                  />
                </View>
                {password.length > 0 && (
                  <View style={styles.passwordStrength}>
                    <View style={[styles.strengthBar, { width: password.length >= 6 ? '100%' : '40%', backgroundColor: password.length >= 6 ? '#00d4aa' : '#ff6b35' }]} />
                    <Text style={styles.strengthText}>
                      {password.length >= 6 ? 'Strong password' : 'Password too short'}
                    </Text>
                  </View>
                )}
              </View>

              {/* Confirm Password Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Confirm Password</Text>
                <View style={styles.inputContainer}>
                  <View style={styles.inputIcon}>
                    <Text style={styles.iconText}>🔐</Text>
                  </View>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Confirm your password"
                    placeholderTextColor="rgba(255, 255, 255, 0.5)"
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
                {confirmPassword.length > 0 && (
                  <Text style={[styles.matchIndicator, { color: password === confirmPassword ? '#00d4aa' : '#ff6b35' }]}>
                    {password === confirmPassword ? '✓ Passwords match' : '✗ Passwords don\'t match'}
                  </Text>
                )}
              </View>


              {/* Professional Sign Up Button */}
              <TouchableOpacity
                style={[styles.signUpButton, isLoading && styles.signUpButtonDisabled]}
                onPress={handleSignUp}
                disabled={isLoading}
                activeOpacity={0.9}
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
                    <>
                      <Text style={styles.signUpButtonText}>Create Account</Text>
                      <Text style={styles.buttonIcon}>✓</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              {/* Enhanced Terms Text */}
              <View style={styles.termsContainer}>
                <Text style={styles.termsText}>
                  By creating an account, you agree to our commitment to help you focus better and reduce digital distractions.
                </Text>
                <View style={styles.benefitsContainer}>
                  <Text style={styles.benefitItem}>✓ AI-powered focus tracking</Text>
                  <Text style={styles.benefitItem}>✓ Personalized productivity insights</Text>
                  <Text style={styles.benefitItem}>✓ Smart distraction blocking</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Professional Footer */}
          <View style={styles.footer}>
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>Already have an account?</Text>
              <View style={styles.dividerLine} />
            </View>
            
            <TouchableOpacity
              style={styles.signInButton}
              onPress={() => navigation.navigate('Login')}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              <Text style={styles.signInText}>Sign In to Your Account</Text>
              <Text style={styles.signInArrow}>←</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  keyboardView: {
    flex: 1,
  },
  backgroundOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  gradientAccent: {
    position: 'absolute',
    top: -50,
    right: -100,
    width: width * 0.6,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(0, 212, 170, 0.04)',
    transform: [{ rotate: '-30deg' }],
  },
  gradientAccent2: {
    position: 'absolute',
    bottom: -80,
    left: -50,
    width: width * 0.5,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(0, 255, 255, 0.03)',
    transform: [{ rotate: '20deg' }],
  },
  scrollView: {
    flex: 1,
    zIndex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 40,
    minHeight: height - 100,
  },
  logoSection: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  logoContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  logo: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#00d4aa',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 12,
  },
  logoGlow: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(0, 212, 170, 0.08)',
    zIndex: -1,
  },
  logoText: {
    fontSize: 32,
    fontWeight: '900',
    color: '#000',
    letterSpacing: -1,
  },
  appName: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 8,
    letterSpacing: 1.5,
  },
  tagline: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
  },
  formSection: {
    flex: 1,
    maxWidth: 400,
    alignSelf: 'center',
    width: '100%',
    marginTop: 20,
  },
  formCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    padding: 28,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  formTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  formSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    marginBottom: 28,
    lineHeight: 18,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 4,
    height: 52,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  inputIcon: {
    width: 44,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: 'rgba(255, 255, 255, 0.1)',
  },
  iconText: {
    fontSize: 16,
    opacity: 0.7,
  },
  textInput: {
    flex: 1,
    paddingHorizontal: 14,
    fontSize: 15,
    color: '#fff',
    fontWeight: '400',
  },
  passwordStrength: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  strengthBar: {
    height: 3,
    borderRadius: 2,
    marginRight: 8,
    flex: 1,
    maxWidth: 60,
  },
  strengthText: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '500',
  },
  matchIndicator: {
    fontSize: 12,
    marginTop: 6,
    fontWeight: '500',
  },
  signUpButton: {
    marginTop: 12,
    marginBottom: 20,
    shadowColor: '#00d4aa',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  signUpButtonDisabled: {
    opacity: 0.6,
    shadowOpacity: 0,
  },
  signUpGradient: {
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  signUpButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#000',
    marginRight: 6,
    letterSpacing: 0.3,
  },
  buttonIcon: {
    fontSize: 18,
    color: '#000',
    fontWeight: 'bold',
  },
  termsContainer: {
    marginTop: 16,
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  termsText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 12,
  },
  benefitsContainer: {
    alignItems: 'center',
  },
  benefitItem: {
    fontSize: 11,
    color: 'rgba(0, 212, 170, 0.8)',
    fontWeight: '500',
    marginBottom: 4,
  },
  footer: {
    alignItems: 'center',
    paddingBottom: 30,
    paddingTop: 20,
    marginTop: 20,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    width: '100%',
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  dividerText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.5)',
    marginHorizontal: 14,
    fontWeight: '500',
  },
  signInButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  signInText: {
    fontSize: 15,
    color: '#fff',
    fontWeight: '600',
    marginRight: 6,
  },
  signInArrow: {
    fontSize: 14,
    color: '#00d4aa',
    fontWeight: 'bold',
  },
});
