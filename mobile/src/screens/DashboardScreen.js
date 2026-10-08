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
  Platform,
  PermissionsAndroid,
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
          onPress: () => triggerSOS("SOS_BUTTON"),
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

  const triggerSOS = async (triggerType = "SOS_BUTTON") => {
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
        triggerType,
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

  // =========================================================
  // VOICE SOS
  // =========================================================

  const getSpeechRecognitionModule = () => {
    try {
      return require("expo-speech-recognition").ExpoSpeechRecognitionModule;
    } catch (error) {
      console.log(
        "⚠️ Speech recognition native module unavailable:",
        error?.message,
      );
      return null;
    }
  };

  const startVoiceRecognition = () => {
    const speechModule = getSpeechRecognitionModule();

    if (!speechModule || !voiceEnabledRef.current) return;

    try {
      const continuous = Platform.OS === "android" && Platform.Version >= 33;

      speechModule.start({
        lang: "en-US",
        interimResults: true,
        maxAlternatives: 1,
        continuous,
      });

      console.log(`🎙️ Listening for: "${voiceKeywordRef.current}"`);
    } catch (error) {
      console.log("❌ Voice recognition start error:", error?.message);
    }
  };

  const stopVoiceRecognition = () => {
    voiceEnabledRef.current = false;
    setVoiceListening(false);

    if (voiceRestartTimerRef.current) {
      clearTimeout(voiceRestartTimerRef.current);
      voiceRestartTimerRef.current = null;
    }

    const speechModule = getSpeechRecognitionModule();

    try {
      speechModule?.abort();
    } catch (error) {
      console.log("⚠️ Voice stop error:", error?.message);
    }
  };

  const toggleVoiceSOS = async () => {
    if (voiceEnabledRef.current) {
      stopVoiceRecognition();
      return;
    }

    const speechModule = getSpeechRecognitionModule();

    if (!speechModule) {
      Alert.alert(
        "Voice SOS unavailable",
        "Voice SOS needs a SafeHer development/Android build with the speech-recognition module. Expo Go cannot load this native feature.",
      );
      return;
    }

    try {
      const permission = await speechModule.requestPermissionsAsync();

      if (!permission?.granted) {
        Alert.alert(
          "Microphone Permission",
          "Microphone permission is required for Voice SOS.",
        );
        return;
      }

      if (!speechModule.isRecognitionAvailable()) {
        Alert.alert(
          "Speech Recognition Unavailable",
          "Please enable a speech recognition service on this Android phone.",
        );
        return;
      }

      voiceEnabledRef.current = true;
      setVoiceListening(true);
      startVoiceRecognition();
    } catch (error) {
      voiceEnabledRef.current = false;
      setVoiceListening(false);
      console.log("❌ Voice SOS initialization error:", error?.message);
      Alert.alert("Voice SOS", error?.message || "Unable to start Voice SOS.");
    }
  };

  const normalizeVoiceText = (value) =>
    String(value || "")
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();

  const voiceMatchesKeyword = (transcript) => {
    const spoken = normalizeVoiceText(transcript);
    const target = normalizeVoiceText(voiceKeywordRef.current);

    return Boolean(spoken && target && spoken.includes(target));
  };

  useEffect(() => {
    const speechModule = getSpeechRecognitionModule();

    if (!speechModule) return undefined;

    const startSub = speechModule.addListener("start", () => {
      setVoiceListening(true);
    });

    const endSub = speechModule.addListener("end", () => {
      setVoiceListening(false);

      if (voiceEnabledRef.current && !backgroundSosEnabledRef.current) {
        voiceRestartTimerRef.current = setTimeout(() => {
          startVoiceRecognition();
        }, 600);
      }
    });

    const errorSub = speechModule.addListener("error", (event) => {
      console.log("⚠️ Voice recognition error:", event?.error, event?.message);

      setVoiceListening(false);

      if (
        voiceEnabledRef.current &&
        !backgroundSosEnabledRef.current &&
        event?.error !== "aborted"
      ) {
        voiceRestartTimerRef.current = setTimeout(() => {
          startVoiceRecognition();
        }, 1000);
      }
    });

    const resultSub = speechModule.addListener("result", (event) => {
      const transcript = (event?.results || [])
        .map((result) => result?.transcript || "")
        .join(" ");

      if (!voiceEnabledRef.current) return;

      if (voiceMatchesKeyword(transcript)) {
        console.log(`🚨 Voice SOS keyword detected: ${transcript}`);

        stopVoiceRecognition();
        triggerSOS("VOICE");
      }
    });

    return () => {
      startSub.remove();
      endSub.remove();
      errorSub.remove();
      resultSub.remove();
    };
  }, []);

  const backgroundSosEnabledRef = useRef(false);
  const [backgroundSosEnabled, setBackgroundSosEnabled] = useState(false);

  useEffect(() => {
    backgroundSosEnabledRef.current = backgroundSosEnabled;
  }, [backgroundSosEnabled]);

  useEffect(() => {
    try {
      const {
        isBackgroundSOSRunning,
      } = require("../services/backgroundSosService");
      const running = isBackgroundSOSRunning();
      backgroundSosEnabledRef.current = running;
      setBackgroundSosEnabled(running);
    } catch (error) {
      // Native background module is unavailable in Expo Go.
    }
  }, []);

  const enableBackgroundSOS = async () => {
    if (Platform.OS !== "android") {
      Alert.alert(
        "Android only",
        "Background Voice + Shake SOS is currently implemented for Android.",
      );
      return;
    }

    try {
      const foreground = await Location.requestForegroundPermissionsAsync();

      if (foreground.status !== "granted") {
        Alert.alert(
          "Location Permission",
          "Location permission is required for background SOS alerts.",
        );
        return;
      }

      const background = await Location.requestBackgroundPermissionsAsync();

      if (background.status !== "granted") {
        Alert.alert(
          "Background Location",
          "Please allow SafeHer to use location in the background so a triggered SOS can include your current location.",
        );
        return;
      }

      const speechModule = getSpeechRecognitionModule();

      if (!speechModule) {
        Alert.alert(
          "Background SOS unavailable",
          "Background SOS needs a SafeHer development/Android build with native speech recognition.",
        );
        return;
      }

      const microphone = await speechModule.requestPermissionsAsync();

      if (!microphone?.granted) {
        Alert.alert(
          "Microphone Permission",
          "Microphone permission is required for background Voice SOS.",
        );
        return;
      }

      if (Platform.Version >= 33) {
        const notificationResult = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
        );

        if (notificationResult !== PermissionsAndroid.RESULTS.GRANTED) {
          console.log("⚠️ Notification permission not granted");
        }
      }

      if (voiceEnabledRef.current) {
        stopVoiceRecognition();
      }

      const {
        startBackgroundSOS,
      } = require("../services/backgroundSosService");
      await startBackgroundSOS(voiceKeywordRef.current);

      backgroundSosEnabledRef.current = true;
      setBackgroundSosEnabled(true);

      Alert.alert(
        "🛡️ Background SOS Enabled",
        `SafeHer will listen for a strong shake or "${voiceKeywordRef.current}" while the app is in the background. A persistent Android notification will stay visible.`,
      );
    } catch (error) {
      backgroundSosEnabledRef.current = false;
      setBackgroundSosEnabled(false);
      console.error("❌ Background SOS setup failed:", error?.message);
      Alert.alert(
        "Background SOS",
        error?.message || "Unable to start background SOS.",
      );
    }
  };

  const disableBackgroundSOS = async () => {
    try {
      const { stopBackgroundSOS } = require("../services/backgroundSosService");
      await stopBackgroundSOS();
    } catch (error) {
      console.log("⚠️ Background SOS stop error:", error?.message);
    }

    backgroundSosEnabledRef.current = false;
    setBackgroundSosEnabled(false);
  };

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
    // When the Android background service is enabled, it owns the shake
    // listener so that there is only one shake trigger active.
    if (backgroundSosEnabled) {
      return undefined;
    }

    Accelerometer.setUpdateInterval(150);

    const subscription = Accelerometer.addListener(({ x, y, z }) => {
      const acceleration = Math.sqrt(x * x + y * y + z * z);
      const now = Date.now();

      if (acceleration > 2.4 && now - lastShakeRef.current > 5000) {
        lastShakeRef.current = now;
        console.log("🚨 Foreground shake SOS triggered");
        triggerSOS("SHAKE");
      }
    });

    return () => {
      subscription.remove();
    };
  }, [backgroundSosEnabled]);

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

        <TouchableOpacity
          style={[
            styles.voiceButton,
            voiceEnabledRef.current && styles.voiceButtonActive,
          ]}
          onPress={toggleVoiceSOS}
        >
          <Text style={styles.voiceButtonText}>
            {voiceEnabledRef.current ? "Disable Voice SOS" : "Enable Voice SOS"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.backgroundSosButton,
            backgroundSosEnabled && styles.backgroundSosButtonActive,
          ]}
          onPress={
            backgroundSosEnabled ? disableBackgroundSOS : enableBackgroundSOS
          }
        >
          <Text style={styles.backgroundSosButtonText}>
            {backgroundSosEnabled
              ? "Disable Background SOS"
              : "Enable Background SOS"}
          </Text>
        </TouchableOpacity>

        <Text style={styles.backgroundSosStatus}>
          {backgroundSosEnabled
            ? "🟢 Background: Shake + Voice active"
            : "⚪ Background: disabled"}
        </Text>

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

  backgroundSosButton: {
    marginTop: SPACING.sm,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.sos,
    backgroundColor: "#FFF7F7",
  },

  backgroundSosButtonActive: {
    backgroundColor: "#FEE2E2",
  },

  backgroundSosButtonText: {
    color: COLORS.sos,
    fontWeight: "700",
    fontSize: 14,
  },

  backgroundSosStatus: {
    marginTop: SPACING.sm,
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: "center",
  },

  voiceHint: {
    marginTop: SPACING.sm,
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: "center",
  },
});
