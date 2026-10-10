import React, { useState } from 'react';

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Image,
} from "react-native";

import {
  COLORS,
  SPACING,
  RADIUS,
  SHADOW,
  FONTS,
  IMAGES,
} from '../utils/constants';

import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { authAPI } from '../services/api';   // pehle se hoga to dobara mat likho
import { useAuth } from '../context/AuthContext';   // pehle se hoga to dobara mat likho

import {
  normalizeName,
  normalizeEmail,
  normalizePhone,
  validateRegistration,
} from '../utils/validation';

GoogleSignin.configure({
  webClientId: '355962870886-kn9ln5f9vkc88mp9j6pgcsvncovm34fv.apps.googleusercontent.com',
});

export default function SignupScreen({ navigation }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  const { login } = useAuth();

const handleGoogleSignup = async () => {
  try {
    setLoading(true);
    await GoogleSignin.hasPlayServices();
    const res = await GoogleSignin.signIn();
    const idToken = res?.data?.idToken ?? res?.idToken;
    if (!idToken) {
      Alert.alert('Cancelled', 'Google sign-in was cancelled');
      return;
    }
    const response = await authAPI.google(idToken);
    await login(response.data.data.user, response.data.data.token);
  } catch (error) {
    console.log('Google signup error:', error.code, error.message);
    Alert.alert(
      'Google Sign-up Failed',
      error.response?.data?.message || error.message || 'Something went wrong'
    );
  } finally {
    setLoading(false);
  }
};
  // Update a field and clear its old error
  const updateField = (field, value, setter) => {
    setter(value);

    setErrors((previous) => {
      const updated = { ...previous };
      delete updated[field];

      // Password changes may invalidate confirmation
      if (
        field === 'password' ||
        field === 'confirmPassword'
      ) {
        delete updated.confirmPassword;
      }

      return updated;
    });
  };

  // =====================================================
  // SIGNUP
  // =====================================================

  const handleSignup = async () => {
    if (loading) return;

    const validationErrors = validateRegistration({
      name,
      email,
      phone,
      password,
      confirmPassword,
    });

    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    try {
      setLoading(true);

      const response = await authAPI.register({
        name: normalizeName(name),
        email: normalizeEmail(email),
        phone: normalizePhone(phone),
        password,
      });

      const result = response?.data?.data;

      if (!result?.user || !result?.token) {
        throw new Error(
          'Invalid response received from server'
        );
      }

      await login(result.user, result.token);

      Alert.alert(
        'Success',
        'Account created successfully!'
      );
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Could not create account. Please try again.';

      // Show duplicate-account errors beside the relevant field
      const lowerMessage = message.toLowerCase();

      if (lowerMessage.includes('email already exists')) {
        setErrors((previous) => ({
          ...previous,
          email: message,
        }));
      } else if (
        lowerMessage.includes('phone number already exists') ||
        lowerMessage.includes('phone number')
      ) {
        setErrors((previous) => ({
          ...previous,
          phone: message,
        }));
      } else {
        Alert.alert('Signup Failed', message);
      }
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // REUSABLE FIELD ERROR
  // =====================================================

  const renderError = (field) => {
    if (!errors[field]) return null;

    return (
      <Text
        style={styles.errorText}
        accessibilityRole="alert"
      >
        {errors[field]}
      </Text>
    );
  };

  // =====================================================
  // UI
  // =====================================================

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Image source={IMAGES.background} style={styles.bgImage} resizeMode="cover" />
      <View style={styles.bgWash} pointerEvents="none" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Image source={IMAGES.logo} style={styles.logo} resizeMode="contain" />
          <Text style={styles.tagline}>Join us today</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>
            Sign up to get started
          </Text>

          {/* Name */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Full Name *</Text>

            <TextInput
              style={[
                styles.input,
                focusedField === "name" && styles.inputFocused,
                errors.name && styles.inputError,
              ]}
              onFocus={() => setFocusedField("name")}
              onBlur={() => setFocusedField(null)}
              placeholder="Your full name"
              placeholderTextColor={COLORS.textSecondary}
              value={name}
              onChangeText={(value) =>
                updateField('name', value, setName)
              }
              autoCapitalize="words"
              autoCorrect={false}
              maxLength={80}
              editable={!loading}
              accessibilityLabel="Full name"
            />

            {renderError('name')}
          </View>

          {/* Email */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email *</Text>

            <TextInput
              style={[
                styles.input,
                focusedField === "email" && styles.inputFocused,
                errors.email && styles.inputError,
              ]}
              onFocus={() => setFocusedField("email")}
              onBlur={() => setFocusedField(null)}
              placeholder="your.email@example.com"
              placeholderTextColor={COLORS.textSecondary}
              value={email}
              onChangeText={(value) =>
                updateField('email', value, setEmail)
              }
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={254}
              editable={!loading}
              accessibilityLabel="Email address"
            />

            {renderError('email')}
          </View>

          {/* Phone */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Phone Number *</Text>

            <TextInput
              style={[
                styles.input,
                focusedField === "phone" && styles.inputFocused,
                errors.phone && styles.inputError,
              ]}
              onFocus={() => setFocusedField("phone")}
              onBlur={() => setFocusedField(null)}
              placeholder="+91 9876543210"
              placeholderTextColor={COLORS.textSecondary}
              value={phone}
              onChangeText={(value) =>
                updateField('phone', value, setPhone)
              }
              keyboardType="phone-pad"
              maxLength={20}
              editable={!loading}
              accessibilityLabel="Phone number"
            />

            {renderError('phone')}
          </View>

          {/* Password */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password *</Text>

            <TextInput
              style={[
                styles.input,
                focusedField === "password" && styles.inputFocused,
                errors.password && styles.inputError,
              ]}
              onFocus={() => setFocusedField("password")}
              onBlur={() => setFocusedField(null)}
              placeholder="Create a strong password"
              placeholderTextColor={COLORS.textSecondary}
              value={password}
              onChangeText={(value) =>
                updateField('password', value, setPassword)
              }
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={72}
              editable={!loading}
              accessibilityLabel="Password"
            />

            <Text style={styles.helperText}>
              At least 8 characters, including uppercase,
              lowercase, a number and a special character.
            </Text>

            {renderError('password')}
          </View>

          {/* Confirm Password */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>
              Confirm Password *
            </Text>

            <TextInput
              style={[
                styles.input,
                focusedField === "confirmPassword" && styles.inputFocused,
                errors.confirmPassword && styles.inputError,
              ]}
              onFocus={() => setFocusedField("confirmPassword")}
              onBlur={() => setFocusedField(null)}
              placeholder="Re-enter your password"
              placeholderTextColor={COLORS.textSecondary}
              value={confirmPassword}
              onChangeText={(value) =>
                updateField(
                  'confirmPassword',
                  value,
                  setConfirmPassword
                )
              }
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={72}
              editable={!loading}
              accessibilityLabel="Confirm password"
            />

            {renderError('confirmPassword')}
          </View>

          {/* Signup Button */}
          <TouchableOpacity
            style={[
              styles.signupButton,
              loading && styles.buttonDisabled,
            ]}
            onPress={handleSignup}
            disabled={loading}
            accessibilityRole="button"
            accessibilityLabel="Create account"
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.signupButtonText}>
                Create Account
              </Text>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Google Button */}
          <TouchableOpacity
            style={styles.googleButton}
            disabled={loading}
            onPress={handleGoogleSignup}
          >
            <Text style={styles.googleButtonText}>
              Continue with Google
            </Text>
          </TouchableOpacity>

          {/* Login Link */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Already have an account?{' '}
            </Text>

            <TouchableOpacity
              onPress={() => navigation.navigate('Login')}
              disabled={loading}
            >
              <Text style={styles.linkText}>Login</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// =====================================================
// STYLES
// =====================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: SPACING.lg,
  },

  header: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },

    logo: {
    width: 220,
    height: 100,
    marginBottom: SPACING.xs,
  },

  bgImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: "100%",
    height: "100%",
    opacity: 0.5,
  },

  bgWash: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255,248,252,0.6)",
  },

  inputFocused: {
    borderColor: COLORS.primary,
    backgroundColor: "#FFFFFF",
  },

  tagline: {
    fontSize: 16,
    fontFamily: FONTS.body,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },

    card: {
    backgroundColor: "rgba(255,255,255,0.94)",
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    ...SHADOW,
  },

  title: {
    fontSize: 28,
    fontFamily: FONTS.headingBold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },

  subtitle: {
    fontSize: 16,
    fontFamily: FONTS.body,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
  },

  inputContainer: {
    marginBottom: SPACING.md,
  },

  label: {
    fontSize: 14,
    fontFamily: FONTS.bodySemi,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },

    input: {
    backgroundColor: COLORS.background,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    minHeight: 52,
    paddingHorizontal: SPACING.md,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: FONTS.body,
    color: COLORS.textPrimary,
  },

  inputError: {
    borderColor: '#DC2626',
  },

  errorText: {
    color: '#DC2626',
    fontSize: 12,
    fontFamily: FONTS.body,
    marginTop: 5,
  },

  helperText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontFamily: FONTS.body,
    marginTop: 5,
    lineHeight: 17,
  },

    signupButton: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    minHeight: 52,
    justifyContent: "center",
    alignItems: "center",
    marginTop: SPACING.sm,
  },

  buttonDisabled: {
    opacity: 0.6,
  },

  signupButtonText: {
    color: '#fff',
    fontSize: 18,
    fontFamily: FONTS.headingBold,
  },

  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SPACING.lg,
  },

  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },

  dividerText: {
    marginHorizontal: SPACING.md,
    color: COLORS.textSecondary,
    fontSize: 14,
    fontFamily: FONTS.body,
  },

    googleButton: {
    backgroundColor: COLORS.cardBg,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    minHeight: 52,
    justifyContent: "center",
    alignItems: "center",
  },

  googleButtonText: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontFamily: FONTS.bodySemi,
  },

  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: SPACING.lg,
  },

  footerText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontFamily: FONTS.body,
  },

  linkText: {
    color: COLORS.secondary,
    fontSize: 14,
    fontFamily: FONTS.bodyBold,
  },
});