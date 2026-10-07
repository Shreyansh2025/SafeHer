import React, { useState, useEffect, useRef } from "react";

import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
  TextInput,
} from "react-native";

// import {
//   ExpoSpeechRecognitionModule,
//   useSpeechRecognitionEvent,
// } from "expo-speech-recognition";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAudioPlayer } from "expo-audio";

import * as Location from "expo-location";

import { COLORS, SPACING, RADIUS, SHADOW } from "../utils/constants";

import { useAuth } from "../context/AuthContext";

import { emergencyAPI } from "../services/api";
import { startEmergencyLocationTracking } from "../services/locationService";
import { connectSocket, joinEmergency, sendLocation } from "../services/socket";

import { Accelerometer } from "expo-sensors";

export default function DashboardScreen({ navigation }) {
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);

  const sosRunningRef = useRef(false);
  const sirenPlayer = useAudioPlayer(require("../../assets/sos-siren.wav"));

  const [voiceListening, setVoiceListening] = useState(false);
  const [voiceKeyword, setVoiceKeyword] = useState("SafeHer SOS");

  const voiceEnabledRef = useRef(false);
  const voiceKeywordRef = useRef("SafeHer SOS");
  const voiceRestartTimerRef = useRef(null);
  // =========================================================
  // GREETING
  // =========================================================

  const getGreeting = () => {
    const hour = new Date().getHours();

    if (hour < 12) return "Good Morning";

    if (hour < 18) return "Good Afternoon";

    return "Good Evening";
  };

  // =========================================================
  // SOS CONFIRMATION
  // =========================================================

  const handleSOSPress = () => {
    Alert.alert(
      "🚨 Emergency Alert",

      "Are you sure you want to trigger an SOS alert? This will notify all your emergency contacts.",

      [
        {
          text: "Cancel",
          style: "cancel",
        },

        {
          text: "Send SOS",
          style: "destructive",
          onPress: triggerSOS,
        },
      ],
    );
  };

  useEffect(() => {
    voiceKeywordRef.current = voiceKeyword;
  }, [voiceKeyword]);

  useEffect(() => {
    const loadVoiceKeyword = async () => {
      try {
        const savedKeyword = await AsyncStorage.getItem(
          "safeher_voice_keyword",
        );

        if (savedKeyword && savedKeyword.trim()) {
          setVoiceKeyword(savedKeyword);
          voiceKeywordRef.current = savedKeyword;
        }
      } catch (error) {
        console.log("❌ Failed to load voice keyword:", error.message);
      }
    };

    loadVoiceKeyword();
  }, []);

  const saveVoiceKeyword = async () => {
    const cleanedKeyword = voiceKeyword.trim();

    if (!cleanedKeyword) {
      Alert.alert("Invalid Keyword", "Please enter a voice trigger phrase.");
      return;
    }

    if (cleanedKeyword.length < 3) {
      Alert.alert(
        "Invalid Keyword",
        "Please use a longer phrase to reduce accidental SOS triggers.",
      );
      return;
    }

    try {
      await AsyncStorage.setItem("safeher_voice_keyword", cleanedKeyword);

      voiceKeywordRef.current = cleanedKeyword;
      setVoiceKeyword(cleanedKeyword);

      Alert.alert("Voice SOS", `Trigger phrase saved as "${cleanedKeyword}".`);
    } catch (error) {
      console.log("❌ Failed to save voice keyword:", error.message);
    }
  };
  // =========================================================
  // TRIGGER SOS
  // =========================================================

  const triggerSOS = async () => {
    if (sosRunningRef.current) {
      console.log("⚠️ SOS already in progress");

      return;
    }

    sosRunningRef.current = true;

    try {
      setLoading(true);

      // -------------------------------------------------------
      // REQUEST LOCATION PERMISSION
      // -------------------------------------------------------

      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "Permission Denied",

          "Location permission is required to send SOS alerts.",
        );

        return;
      }

      // -------------------------------------------------------
      // GET CURRENT LOCATION
      // -------------------------------------------------------

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const emergencyData = {
        latitude: location.coords.latitude,

        longitude: location.coords.longitude,

        message: "Emergency! I need help.",
      };

      console.log(
        "📍 Sending SOS with location:",

        emergencyData,
      );

      // -------------------------------------------------------
      // CREATE SOS
      // -------------------------------------------------------

      const response = await emergencyAPI.trigger(emergencyData);

      console.log(
        "✅ SOS Response:",

        response.data,
      );
      try {
        sirenPlayer.loop = true;
        sirenPlayer.volume = 1.0;
        sirenPlayer.seekTo(0);
        sirenPlayer.play();

        console.log("🚨 SOS siren started");
      } catch (sirenError) {
        console.log("❌ Siren error:", sirenError.message);
      }

      // =======================================================
      // GET ACTUAL EMERGENCY ID
      // =======================================================

      const createdEmergency = response?.data?.emergency?.emergency;

      const emergencyId = createdEmergency?.id;

      if (!emergencyId) {
        throw new Error("Emergency ID was not returned by server");
      }

      console.log(
        "🚨 Active Emergency ID:",

        emergencyId,
      );

      // =======================================================
      // CONNECT AUTHENTICATED SOCKET
      // =======================================================

      await connectSocket();

      await joinEmergency(emergencyId);

      sendLocation({
        emergencyId,

        latitude: location.coords.latitude,

        longitude: location.coords.longitude,
      });

      console.log("📡 Initial SOS location sent");

      // Start independent GPS tracking
      await startEmergencyLocationTracking(emergencyId);

      console.log("📡 Initial SOS location sent");

      // =======================================================
      // READ BACKEND DELIVERY RESULT
      // =======================================================

      const result = response?.data?.emergency;

      const contactsNotified = result?.contactsNotified ?? 0;

      const contactsFailed = result?.contactsFailed ?? 0;

      const totalContacts = result?.notifications ?? 0;

      // =======================================================
      // BUILD USER MESSAGE
      // =======================================================

      let title = "⚠️ SOS Recorded";

      let message = "";

      // -------------------------------------------------------
      // NO CONTACTS
      // -------------------------------------------------------

      if (totalContacts === 0) {
        message =
          "Emergency was recorded successfully, but you have no emergency contacts configured.";
      }

      // -------------------------------------------------------
      // ALL CONTACTS FAILED
      // -------------------------------------------------------
      else if (contactsNotified === 0 && contactsFailed > 0) {
        title = "⚠️ SOS Recorded";

        message =
          "Emergency was recorded, but no emergency contact could be notified.";
      }

      // -------------------------------------------------------
      // SOME CONTACTS SUCCEEDED
      // -------------------------------------------------------
      else if (contactsNotified > 0 && contactsFailed > 0) {
        title = "⚠️ SOS Partially Sent";

        message =
          `Emergency was recorded.\n\n` +
          `${contactsNotified} contact(s) were notified successfully.\n` +
          `${contactsFailed} contact(s) could not be notified.`;
      }

      // -------------------------------------------------------
      // ALL CONTACTS SUCCEEDED
      // -------------------------------------------------------
      else if (contactsNotified > 0 && contactsFailed === 0) {
        title = "✅ SOS Alert Sent";

        message = `Emergency recorded and ${contactsNotified} contact(s) were notified successfully.`;
      }

      // =======================================================
      // ADD LOCATION INFORMATION
      // =======================================================

      message +=
        `\n\nLocation: ` +
        `${location.coords.latitude.toFixed(6)}, ` +
        `${location.coords.longitude.toFixed(6)}`;

      // =======================================================
      // SHOW RESULT
      // =======================================================

      Alert.alert(
        title,

        message,

        [
          {
            text: "OK",

            onPress: () => navigation.navigate("Contacts"),
          },
        ],
      );
    } catch (error) {
      console.error(
        "❌ SOS Error:",

        error.response?.data || error.message,
      );

      Alert.alert(
        "Error",

        error.response?.data?.message ||
          error.message ||
          "Failed to send SOS alert",
      );
    } finally {
      sosRunningRef.current = false;

      setLoading(false);
    }
  };

  // useSpeechRecognitionEvent("start", () => {
  //   console.log("🎙️ Voice SOS listening...");
  //   setVoiceListening(true);
  // });

  // useSpeechRecognitionEvent("end", () => {
  //   console.log("🎙️ Voice recognition ended");
  //   setVoiceListening(false);

  //   if (voiceEnabledRef.current) {
  //     voiceRestartTimerRef.current = setTimeout(() => {
  //       startVoiceRecognition();
  //     }, 500);
  //   }
  // });

  // useSpeechRecognitionEvent("error", (event) => {
  //   console.log("❌ Voice recognition error:", event.error, event.message);

  //   setVoiceListening(false);

  //   if (voiceEnabledRef.current && event.error !== "aborted") {
  //     voiceRestartTimerRef.current = setTimeout(() => {
  //       startVoiceRecognition();
  //     }, 1000);
  //   }
  // });
  // const startVoiceRecognition = () => {
  //   try {
  //     ExpoSpeechRecognitionModule.start({
  //       lang: "en-US",
  //       interimResults: true,
  //       maxAlternatives: 1,
  //       continuous: true,
  //     });

  //     console.log(`🎙️ Listening for: "${voiceKeywordRef.current}"`);
  //   } catch (error) {
  //     console.log("❌ Voice recognition start error:", error.message);
  //   }
  // };

  useEffect(() => {
    let mounted = true;

    const enableVoiceSOS = async () => {
      try {
        const permission =
          await ExpoSpeechRecognitionModule.requestPermissionsAsync();

        if (!permission.granted) {
          console.log("❌ Voice SOS microphone permission denied");
          return;
        }

        if (!mounted) return;

        voiceEnabledRef.current = true;
        startVoiceRecognition();
      } catch (error) {
        console.log("❌ Voice SOS initialization error:", error.message);
      }
    };

    enableVoiceSOS();

    return () => {
      mounted = false;
      voiceEnabledRef.current = false;

      if (voiceRestartTimerRef.current) {
        clearTimeout(voiceRestartTimerRef.current);
      }

      ExpoSpeechRecognitionModule.abort();
    };
  }, []);
  // =========================================================
  // QUICK ACTIONS
  // =========================================================

  const quickActions = [
    {
      id: 1,

      title: "Manage Contacts",

      icon: "👥",

      color: COLORS.primary,

      onPress: () => navigation.navigate("Contacts"),
    },

    {
      id: 2,

      title: "View History",

      icon: "📋",

      color: COLORS.secondary,

      onPress: () => navigation.navigate("History"),
    },

    {
      id: 3,

      title: "Safe Places",

      icon: "📍",

      color: "#10B981",

      onPress: () =>
        Alert.alert(
          "Coming Soon",

          "Safe places feature coming soon!",
        ),
    },

    {
      id: 4,

      title: "Settings",

      icon: "⚙️",

      color: "#F59E0B",

      onPress: () =>
        Alert.alert(
          "Coming Soon",

          "Settings coming soon!",
        ),
    },
  ];

  // =========================================================
  // SHAKE / GESTURE SOS
  // =========================================================

  const lastShakeRef = useRef(0);

  useEffect(() => {
    Accelerometer.setUpdateInterval(150);

    const subscription = Accelerometer.addListener(({ x, y, z }) => {
      const acceleration = Math.sqrt(x * x + y * y + z * z);

      const now = Date.now();

      // Strong shake detected
      if (acceleration > 2.4 && now - lastShakeRef.current > 5000) {
        lastShakeRef.current = now;

        console.log("🚨 Gesture SOS triggered");

        triggerSOS();
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  // =========================================================
  // ACTIVE SOS GPS TRACKING
  // =========================================================
  //
  // GPS tracking starts ONLY after:
  //
  // 1. SOS is created
  // 2. Emergency ID is received
  // 3. Socket is authenticated
  // 4. Emergency room is joined
  //
  // =========================================================

  // =========================================================
  // UI
  // =========================================================

  return (
    <ScrollView style={styles.container}>
      {/* Welcome Header */}

      <View style={styles.header}>
        <Text style={styles.greeting}>{getGreeting()},</Text>

        <Text style={styles.userName}>{user?.name || "User"}</Text>

        <Text style={styles.subtitle}>Stay safe, we're here for you</Text>
      </View>

      {/* SOS Button Container */}

      <View style={styles.sosContainer}>
        <Text style={styles.sosLabel}>Emergency Button</Text>

        <TouchableOpacity
          style={[styles.sosButton, loading && styles.sosButtonDisabled]}
          onPress={handleSOSPress}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator size="large" color="#fff" />
          ) : (
            <>
              <Text style={styles.sosText}>SOS</Text>

              <Text style={styles.sosSubtext}>Tap to Alert</Text>
            </>
          )}
        </TouchableOpacity>

        <Text style={styles.sosInstruction}>
          Tap to send emergency alert to all contacts
        </Text>
      </View>

      <View style={styles.voiceCard}>
        <View style={styles.voiceHeader}>
          <Text style={styles.voiceTitle}>🎙️ Voice SOS</Text>

          <Text
            style={[
              styles.voiceStatus,
              voiceListening && styles.voiceStatusActive,
            ]}
          >
            {voiceListening ? "● Listening" : "○ Not listening"}
          </Text>
        </View>

        <Text style={styles.voiceDescription}>
          Say your trigger phrase to activate SOS.
        </Text>

        <TextInput
          value={voiceKeyword}
          onChangeText={setVoiceKeyword}
          placeholder="Enter trigger phrase"
          placeholderTextColor={COLORS.textSecondary}
          style={styles.voiceInput}
        />

        <TouchableOpacity
          style={styles.voiceSaveButton}
          onPress={saveVoiceKeyword}
        >
          <Text style={styles.voiceSaveText}>Save Trigger Phrase</Text>
        </TouchableOpacity>

        <Text style={styles.voiceHint}>
          Say "{voiceKeyword}" to trigger SOS
        </Text>
      </View>

      {/* Quick Actions */}

      <View style={styles.actionsSection}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>

        <View style={styles.actionsGrid}>
          {quickActions.map((action) => (
            <TouchableOpacity
              key={action.id}
              style={styles.actionCard}
              onPress={action.onPress}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.actionIconContainer,

                  {
                    backgroundColor: action.color + "20",
                  },
                ]}
              >
                <Text style={styles.actionIcon}>{action.icon}</Text>
              </View>

              <Text style={styles.actionTitle}>{action.title}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Safety Tips Card */}

      <View style={styles.tipsCard}>
        <Text style={styles.tipsTitle}>💡 Safety Tip</Text>

        <Text style={styles.tipsText}>
          Always keep your emergency contacts updated and share your location
          with trusted friends when traveling alone.
        </Text>
      </View>
    </ScrollView>
  );
}

// =========================================================
// STYLES
// =========================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,

    backgroundColor: COLORS.background,
  },

  header: {
    padding: SPACING.lg,

    paddingTop: SPACING.xl,

    backgroundColor: COLORS.cardBg,

    borderBottomLeftRadius: RADIUS.xl,

    borderBottomRightRadius: RADIUS.xl,

    ...SHADOW,
  },

  greeting: {
    fontSize: 18,

    color: COLORS.textSecondary,
  },

  userName: {
    fontSize: 32,

    fontWeight: "bold",

    color: COLORS.primary,

    marginBottom: SPACING.xs,
  },

  subtitle: {
    fontSize: 14,

    color: COLORS.textSecondary,

    fontStyle: "italic",
  },

  voiceButton: {
    marginTop: SPACING.md,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.cardBg,
    borderWidth: 2,
    borderColor: COLORS.primary,
    alignItems: "center",
  },

  voiceButtonActive: {
    backgroundColor: "#FEE2E2",
    borderColor: COLORS.sos,
  },

  voiceButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.primary,
  },
  sosContainer: {
    alignItems: "center",

    paddingVertical: SPACING.xxl,

    paddingHorizontal: SPACING.lg,
  },

  sosLabel: {
    fontSize: 20,

    fontWeight: "bold",

    color: COLORS.textPrimary,

    marginBottom: SPACING.lg,
  },

  sosButton: {
    width: 280,

    height: 280,

    borderRadius: 140,

    backgroundColor: COLORS.sos,

    justifyContent: "center",

    alignItems: "center",

    shadowColor: COLORS.sos,

    shadowOffset: {
      width: 0,
      height: 0,
    },

    shadowOpacity: 0.5,

    shadowRadius: 20,

    elevation: 15,

    borderWidth: 8,

    borderColor: "#fff",
  },

  sosButtonDisabled: {
    opacity: 0.7,
  },

  sosText: {
    fontSize: 80,

    fontWeight: "bold",

    color: "#fff",

    letterSpacing: 10,
  },

  sosSubtext: {
    fontSize: 18,

    color: "#fff",

    marginTop: SPACING.sm,

    fontWeight: "600",
  },

  sosInstruction: {
    marginTop: SPACING.lg,

    fontSize: 14,

    color: COLORS.textSecondary,

    textAlign: "center",

    paddingHorizontal: SPACING.lg,
  },

  actionsSection: {
    padding: SPACING.lg,
  },

  sectionTitle: {
    fontSize: 22,

    fontWeight: "bold",

    color: COLORS.textPrimary,

    marginBottom: SPACING.md,
  },

  actionsGrid: {
    flexDirection: "row",

    flexWrap: "wrap",

    justifyContent: "space-between",
  },

  actionCard: {
    width: "48%",

    backgroundColor: COLORS.cardBg,

    borderRadius: RADIUS.lg,

    padding: SPACING.md,

    alignItems: "center",

    marginBottom: SPACING.md,

    ...SHADOW,
  },

  actionIconContainer: {
    width: 60,

    height: 60,

    borderRadius: RADIUS.full,

    justifyContent: "center",

    alignItems: "center",

    marginBottom: SPACING.sm,
  },

  actionIcon: {
    fontSize: 28,
  },

  actionTitle: {
    fontSize: 14,

    fontWeight: "600",

    color: COLORS.textPrimary,

    textAlign: "center",
  },

  tipsCard: {
    backgroundColor: COLORS.cardBg,

    borderRadius: RADIUS.lg,

    padding: SPACING.lg,

    margin: SPACING.lg,

    marginTop: 0,

    ...SHADOW,
  },

  tipsTitle: {
    fontSize: 18,

    fontWeight: "bold",

    color: COLORS.textPrimary,

    marginBottom: SPACING.sm,
  },

  tipsText: {
    fontSize: 14,

    color: COLORS.textSecondary,

    lineHeight: 20,
  },
  voiceCard: {
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
    padding: SPACING.lg,
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.lg,
    ...SHADOW,
  },

  voiceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.sm,
  },

  voiceTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },

  voiceStatus: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.textSecondary,
  },

  voiceStatusActive: {
    color: "#10B981",
  },

  voiceDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },

  voiceInput: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: 16,
    color: COLORS.textPrimary,
    backgroundColor: "#fff",
  },

  voiceSaveButton: {
    marginTop: SPACING.sm,
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    alignItems: "center",
  },

  voiceSaveText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },

  voiceHint: {
    marginTop: SPACING.sm,
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: "center",
  },
});
