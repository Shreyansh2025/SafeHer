import React, { useState } from "react";
import { GoogleSignin } from '@react-native-google-signin/google-signin';

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
} from "react-native";

import {
  COLORS,
  SPACING,
  RADIUS,
  SHADOW,
} from "../utils/constants";

import { authAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";

import {
  normalizeEmail,
  validateLogin,
} from "../utils/validation";

GoogleSignin.configure({
  webClientId: process.env.GOOGLE_WEB_CLIENT_ID,
});

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const { login } = useAuth();

  // Update field and clear its previous error
  const updateField = (field, value, setter) => {
    setter(value);

    setErrors((previous) => ({
      ...previous,
      [field]: undefined,
      form: undefined,
    }));
  };

  // =====================================================
  // LOGIN
  // =====================================================

  const handleLogin = async () => {
    if (loading) return;

    const validationErrors = validateLogin({
      email,
      password,
    });

    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    try {
      setLoading(true);

      const response = await authAPI.login({
        email: normalizeEmail(email),
        password,
      });

      const result = response?.data?.data;

      if (!result?.user || !result?.token) {
        throw new Error(
          "Invalid response received from server"
        );
      }

      await login(result.user, result.token, "user");

      Alert.alert(
        "Success",
        "Welcome back to SafeHer!"
      );
    } catch (error) {
      const status = error.response?.status;
      const serverMessage = error.response?.data?.message;

      if (status === 401) {
        setErrors({
          form: "Invalid email or password.",
        });
      } else if (status === 403) {
        setErrors({
          form:
            serverMessage ||
            "Please use the appropriate login page.",
        });
      } else if (status === 400) {
        setErrors({
          form:
            serverMessage ||
            "Please check your email and password.",
        });
      } else if (!error.response) {
        setErrors({
          form:
            "Cannot connect to the server. Check your internet connection and try again.",
        });
      } else {
        setErrors({
          form:
            serverMessage ||
            "Login failed. Please try again later.",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
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
    console.log('Google login error:', error.code, error.message);
    Alert.alert(
      'Google Login Failed',
      error.response?.data?.message || error.message || 'Something went wrong'
    );
  } finally {
    setLoading(false);
  }
};
  // =====================================================
  // FIELD ERROR
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
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.appName}>SafeHer</Text>
          <Text style={styles.tagline}>
            Your Safety, Our Priority
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>
            Login to your account
          </Text>

          {/* Login Mode */}
          <Text style={styles.modeLabel}>Login as</Text>

          <View style={styles.modeRow}>
            <View
              style={[
                styles.modeOption,
                styles.modeOptionActive,
              ]}
            >
              <View style={styles.radioOuter}>
                <View style={styles.radioInner} />
              </View>
              <Text style={styles.modeTextActive}>
                User
              </Text>
            </View>

            <TouchableOpacity
              style={styles.modeOption}
              onPress={() =>
                navigation.navigate("AdminLogin")
              }
              disabled={loading}
            >
              <View style={styles.radioOuter} />
              <Text style={styles.modeText}>Admin</Text>
            </TouchableOpacity>
          </View>

          {/* Email */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email *</Text>

            <TextInput
              style={[
                styles.input,
                errors.email && styles.inputError,
              ]}
              placeholder="your.email@example.com"
              placeholderTextColor={COLORS.textSecondary}
              value={email}
              onChangeText={(value) =>
                updateField("email", value, setEmail)
              }
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={254}
              editable={!loading}
              accessibilityLabel="Email address"
              returnKeyType="next"
            />

            {renderError("email")}
          </View>

          {/* Password */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password *</Text>

            <TextInput
              style={[
                styles.input,
                errors.password && styles.inputError,
              ]}
              placeholder="Enter your password"
              placeholderTextColor={COLORS.textSecondary}
              value={password}
              onChangeText={(value) =>
                updateField("password", value, setPassword)
              }
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={72}
              editable={!loading}
              accessibilityLabel="Password"
              returnKeyType="go"
              onSubmitEditing={handleLogin}
            />

            {renderError("password")}
          </View>

          {/* General Error */}
          {renderError("form")}

          {/* Login Button */}
          <TouchableOpacity
            style={[
              styles.loginButton,
              loading && styles.buttonDisabled,
            ]}
            onPress={handleLogin}
            disabled={loading}
            accessibilityRole="button"
            accessibilityLabel="Login as user"
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.loginButtonText}>
                Login as User
              </Text>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Google Button - existing placeholder */}
          <TouchableOpacity
            style={styles.googleButton}
            disabled={loading}
            onPress={handleGoogleLogin}
          >
            <Text style={styles.googleButtonText}>
              Continue with Google
            </Text>
          </TouchableOpacity>

          {/* Signup Link */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Don't have an account?{" "}
            </Text>

            <TouchableOpacity
              onPress={() =>
                navigation.navigate("Signup")
              }
              disabled={loading}
            >
              <Text style={styles.linkText}>
                Sign Up
              </Text>
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
    justifyContent: "center",
    padding: SPACING.lg,
  },

  header: {
    alignItems: "center",
    marginBottom: SPACING.xl,
  },

  appName: {
    fontSize: 48,
    fontWeight: "bold",
    color: COLORS.primary,
    marginBottom: SPACING.xs,
  },

  tagline: {
    fontSize: 16,
    color: COLORS.textSecondary,
    fontStyle: "italic",
  },

  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    ...SHADOW,
  },

  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },

  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
  },

  modeLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },

  modeRow: {
    flexDirection: "row",
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },

  modeOption: {
    flex: 1,
    minHeight: 50,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    flexDirection: "row",
    alignItems: "center",
  },

  modeOptionActive: {
    borderColor: COLORS.primary,
    backgroundColor: "#F5F3FF",
  },

  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: RADIUS.full,
    borderWidth: 2,
    borderColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: SPACING.sm,
  },

  radioInner: {
    width: 10,
    height: 10,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primary,
  },

  modeText: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: "600",
  },

  modeTextActive: {
    color: COLORS.primary,
    fontSize: 15,
    fontWeight: "700",
  },

  inputContainer: {
    marginBottom: SPACING.md,
  },

  label: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },

  input: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    fontSize: 16,
    color: COLORS.textPrimary,
  },

  inputError: {
    borderColor: "#DC2626",
  },

  errorText: {
    color: "#DC2626",
    fontSize: 12,
    marginTop: 5,
    marginBottom: SPACING.xs,
  },

  loginButton: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    alignItems: "center",
    marginTop: SPACING.sm,
  },

  buttonDisabled: {
    opacity: 0.6,
  },

  loginButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },

  divider: {
    flexDirection: "row",
    alignItems: "center",
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
  },

  googleButton: {
    backgroundColor: COLORS.cardBg,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    alignItems: "center",
  },

  googleButtonText: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: "600",
  },

  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: SPACING.lg,
  },

  footerText: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },

  linkText: {
    color: COLORS.secondary,
    fontSize: 14,
    fontWeight: "bold",
  },
});