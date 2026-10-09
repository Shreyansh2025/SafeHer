import React, { useState } from "react";

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";

import {
  COLORS,
  SPACING,
  RADIUS,
  SHADOW,
} from "../utils/constants";

import { authAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function VerifyLoginOtpScreen({
  navigation,
  route,
}) {
  const { challengeId, emailHint } = route.params || {};

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { login } = useAuth();

  const handleVerifyOtp = async () => {
    if (loading) return;

    if (!challengeId) {
      setError("Login session is missing. Please log in again.");
      return;
    }

    if (!/^\d{6}$/.test(otp)) {
      setError("Enter the six-digit OTP sent to your email.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await authAPI.verifyLoginOtp({
        challengeId,
        otp,
      });

      const result = response?.data?.data;

      if (!result?.user || !result?.token) {
        throw new Error("Invalid verification response.");
      }

      // Save the JWT and user after OTP verification succeeds
      await login(result.user, result.token, "user");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "OTP verification failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.card}>
        <Text style={styles.logo}>SafeHer</Text>

        <Text style={styles.title}>
          Verify your email
        </Text>

        <Text style={styles.subtitle}>
          Enter the six-digit login code sent to
        </Text>

        {emailHint ? (
          <Text style={styles.email}>{emailHint}</Text>
        ) : null}

        <TextInput
          style={[
            styles.otpInput,
            error && styles.inputError,
          ]}
          value={otp}
          onChangeText={(value) => {
            setOtp(value.replace(/\D/g, "").slice(0, 6));
            setError("");
          }}
          placeholder="000000"
          keyboardType="number-pad"
          maxLength={6}
          textAlign="center"
          editable={!loading}
          accessibilityLabel="Six-digit email OTP"
        />

        {error ? (
          <Text style={styles.errorText} accessibilityRole="alert">
            {error}
          </Text>
        ) : null}

        <TouchableOpacity
          style={[
            styles.button,
            loading && styles.disabledButton,
          ]}
          onPress={handleVerifyOtp}
          disabled={loading}
          accessibilityRole="button"
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>
              Verify OTP
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.navigate("Login")}
          disabled={loading}
        >
          <Text style={styles.backText}>
            Back to Login
          </Text>
        </TouchableOpacity>

        <Text style={styles.footer}>
          Your safety matters. Your voice matters.
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: "center",
    padding: SPACING.lg,
  },

  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    ...SHADOW,
  },

  logo: {
    fontSize: 34,
    fontWeight: "bold",
    color: COLORS.primary,
    textAlign: "center",
    marginBottom: SPACING.lg,
  },

  title: {
    fontSize: 25,
    fontWeight: "bold",
    color: COLORS.textPrimary,
    textAlign: "center",
  },

  subtitle: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginTop: SPACING.sm,
  },

  email: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.primary,
    textAlign: "center",
    marginTop: SPACING.xs,
  },

  otpInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    fontSize: 27,
    letterSpacing: 8,
    color: COLORS.textPrimary,
    marginTop: SPACING.lg,
  },

  inputError: {
    borderColor: COLORS.danger,
  },

  errorText: {
    color: COLORS.danger,
    fontSize: 13,
    marginTop: SPACING.sm,
    textAlign: "center",
  },

  button: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    alignItems: "center",
    marginTop: SPACING.lg,
  },

  disabledButton: {
    opacity: 0.6,
  },

  buttonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 17,
  },

  backButton: {
    alignItems: "center",
    marginTop: SPACING.md,
    padding: SPACING.sm,
  },

  backText: {
    color: COLORS.secondary,
    fontWeight: "600",
  },

  footer: {
    color: COLORS.textSecondary,
    fontSize: 12,
    textAlign: "center",
    marginTop: SPACING.lg,
  },
});