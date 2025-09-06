/**
 * Login Screen - Professional and elegant authentication
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
  Dimensions,
  StatusBar,
  ScrollView
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
        </View>
        
        <View style={styles.scrollContainer}>
          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
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
              <Text style={styles.tagline}>Welcome back to your focus journey</Text>
            </View>

            {/* Professional Form */}
            <View style={styles.formSection}>
              <View style={styles.formCard}>
                <Text style={styles.formTitle}>Sign In</Text>
                
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
                      placeholder="Enter your password"
                      placeholderTextColor="rgba(255, 255, 255, 0.5)"
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
                </View>

                {/* Professional Sign In Button */}
                <TouchableOpacity
                  style={[styles.signInButton, isLoading && styles.signInButtonDisabled]}
                  onPress={handleSignIn}
                  disabled={isLoading}
                  activeOpacity={0.9}
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
                      <>
                        <Text style={styles.signInButtonText}>Sign In</Text>
                        <Text style={styles.buttonIcon}>→</Text>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                {/* Forgot Password */}
                <TouchableOpacity
                  style={styles.forgotPassword}
                  onPress={() => navigation.navigate('ForgotPassword')}
                  disabled={isLoading}
                >
                  <Text style={styles.forgotPasswordText}>Forgot your password?</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Professional Footer */}
            <View style={styles.footer}>
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>New to VOLT?</Text>
                <View style={styles.dividerLine} />
              </View>
              
              <TouchableOpacity
                style={styles.createAccountButton}
                onPress={() => navigation.navigate('Register')}
                disabled={isLoading}
                activeOpacity={0.8}
              >
                <Text style={styles.createAccountText}>Create Your Account</Text>
                <Text style={styles.createAccountArrow}>↗</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
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
    top: -100,
    left: -50,
    width: width * 0.8,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(0, 212, 170, 0.05)',
    transform: [{ rotate: '45deg' }],
  },
  scrollContainer: {
    flex: 1,
    zIndex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 40,
    minHeight: height - 100,
  },
  logoSection: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  logoContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#00d4aa',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
  },
  logoGlow: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(0, 212, 170, 0.1)',
    zIndex: -1,
  },
  logoText: {
    fontSize: 36,
    fontWeight: '900',
    color: '#000',
    letterSpacing: -1,
  },
  appName: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 12,
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
    maxWidth: 400,
    alignSelf: 'center',
    width: '100%',
    marginTop: 20,
    marginBottom: 40,
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
    marginBottom: 28,
    letterSpacing: 0.5,
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
  signInButton: {
    marginTop: 12,
    marginBottom: 16,
    shadowColor: '#00d4aa',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  signInButtonDisabled: {
    opacity: 0.6,
    shadowOpacity: 0,
  },
  signInGradient: {
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  signInButtonText: {
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
  forgotPassword: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: 'rgba(0, 212, 170, 0.8)',
    fontWeight: '500',
  },
  footer: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 20,
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
  createAccountButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  createAccountText: {
    fontSize: 15,
    color: '#fff',
    fontWeight: '600',
    marginRight: 6,
  },
  createAccountArrow: {
    fontSize: 14,
    color: '#00d4aa',
    fontWeight: 'bold',
  },
});
