import React, { useState } from "react";

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
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

import { adminAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";

import {
  normalizeEmail,
  validateLogin,
} from "../utils/validation";

export default function AdminLoginScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const { login } = useAuth();

  const updateField = (field, value, setter) => {
    setter(value);

    setErrors((previous) => ({
      ...previous,
      [field]: undefined,
      form: undefined,
    }));
  };

  // =====================================================
  // ADMIN LOGIN
  // =====================================================

  const handleAdminLogin = async () => {
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

      const response = await adminAPI.login({
        email: normalizeEmail(email),
        password,
      });

      const result = response?.data?.data;

      if (!result?.admin || !result?.token) {
        throw new Error(
          "Invalid response received from server"
        );
      }

      await login(result.admin, result.token, "admin");
    } catch (error) {
      const status = error.response?.status;
      const serverMessage = error.response?.data?.message;

      if (status === 401) {
        setErrors({
          form: "Invalid admin email or password.",
        });
      } else if (status === 403) {
        setErrors({
          form: serverMessage || "Admin access denied.",
        });
      } else if (status === 400) {
        setErrors({
          form: serverMessage || "Please check your input.",
        });
      } else if (!error.response) {
        setErrors({
          form:
            "Cannot connect to the server. Check your connection and try again.",
        });
      } else {
        setErrors({
          form:
            serverMessage ||
            "Admin login failed. Please try again later.",
        });
      }
    } finally {
      setLoading(false);
    }
  };

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
          <Text style={styles.badge}>ADMIN</Text>
          <Text style={styles.appName}>SafeHer</Text>
          <Text style={styles.tagline}>
            Secure Admin Access
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>Admin Login</Text>

          <Text style={styles.subtitle}>
            Sign in to monitor emergencies and manage SafeHer users.
          </Text>

          {/* Admin Email */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Admin Email *</Text>

            <TextInput
              style={[
                styles.input,
                errors.email && styles.inputError,
              ]}
              placeholder="admin@example.com"
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
              accessibilityLabel="Admin email"
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
              placeholder="Enter admin password"
              placeholderTextColor={COLORS.textSecondary}
              value={password}
              onChangeText={(value) =>
                updateField("password", value, setPassword)
              }
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
              accessibilityLabel="Admin password"
              returnKeyType="go"
              onSubmitEditing={handleAdminLogin}
            />

            {renderError("password")}
          </View>

          {/* General Error */}
          {renderError("form")}

          {/* Login */}
          <TouchableOpacity
            style={[
              styles.loginButton,
              loading && styles.buttonDisabled,
            ]}
            onPress={handleAdminLogin}
            disabled={loading}
            accessibilityRole="button"
            accessibilityLabel="Login as admin"
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.loginButtonText}>
                Login as Admin
              </Text>
            )}
          </TouchableOpacity>

          {/* Back */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.navigate("Login")}
            disabled={loading}
          >
            <Text style={styles.backButtonText}>
              {"← Back to User Login"}
            </Text>
          </TouchableOpacity>
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

  badge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
    backgroundColor: "#F5F3FF",
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1,
    marginBottom: SPACING.sm,
  },

  appName: {
    fontSize: 44,
    fontWeight: "bold",
    color: COLORS.primary,
  },

  tagline: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
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
    fontSize: 15,
    lineHeight: 22,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
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

  backButton: {
    alignItems: "center",
    marginTop: SPACING.lg,
    paddingVertical: SPACING.sm,
  },

  backButtonText: {
    color: COLORS.secondary,
    fontSize: 15,
    fontWeight: "700",
  },
});