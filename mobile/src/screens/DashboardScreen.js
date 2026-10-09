import React, { useState, useEffect, useRef } from "react";

import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TextInput,
  Platform,
  PermissionsAndroid,
  DeviceEventEmitter,
  AppState,
} from "react-native";

// import {
//   ExpoSpeechRecognitionModule,
//   useSpeechRecognitionEvent,
// } from "expo-speech-recognition";
import AsyncStorage from "@react-native-async-storage/async-storage";

import * as Location from "expo-location";

import { COLORS, SPACING, RADIUS, SHADOW } from "../utils/constants";

import { useAuth } from "../context/AuthContext";

import { emergencyAPI } from "../services/api";
import { startEmergencyLocationTracking } from "../services/locationService";
import { connectSocket, joinEmergency, sendLocation } from "../services/socket";

import { Accelerometer } from "expo-sensors";
import { createShakeDetector } from "../services/shakeDetection";
import { ACTIVE_SOS_STORAGE_KEY, startSOSAlarm, stopSOSAlarm } from "../services/sosAudioService";

export default function DashboardScreen({ navigation }) {
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [sosActive, setSosActive] = useState(false);
  const [sosFeedback, setSosFeedback] = useState("");

  const sosRunningRef = useRef(false);
  const sosActiveRef = useRef(false);

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

  // SOS starts immediately from the button; no blocking confirmation popup.
  const handleSOSPress = () => {
    void triggerSOS("SOS_BUTTON");
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

    if (cleanedKeyword.length < 3) {
      setSosFeedback("Use a trigger phrase with at least 3 characters.");
      return;
    }

    try {
      await AsyncStorage.setItem("safeher_voice_keyword", cleanedKeyword);
      voiceKeywordRef.current = cleanedKeyword;
      setVoiceKeyword(cleanedKeyword);
      setSosFeedback(`Voice trigger saved: “${cleanedKeyword}”.`);
    } catch (error) {
      console.log("Failed to save voice keyword:", error.message);
      setSosFeedback("Could not save the voice trigger phrase.");
    }
  };

  const triggerSOS = async (triggerType = "SOS_BUTTON") => {
    if (sosRunningRef.current || sosActiveRef.current) {
      setSosFeedback("An SOS is already active or being sent.");
      return;
    }

    sosRunningRef.current = true;
    sosActiveRef.current = true;
    setSosActive(true);
    setLoading(true);
    setSosFeedback(`${triggerType === "SHAKE" ? "Shake" : triggerType === "VOICE" ? "Voice phrase" : "SOS button"} detected. Sending alert…`);

    const sosEvent = {
      status: "PENDING",
      triggerType,
      timestamp: Date.now(),
    };

    try {
      await AsyncStorage.setItem(ACTIVE_SOS_STORAGE_KEY, JSON.stringify(sosEvent));
      void startSOSAlarm();

      const currentPermission = await Location.getForegroundPermissionsAsync();
      const permission = currentPermission.status === "granted"
        ? currentPermission
        : await Location.requestForegroundPermissionsAsync();

      if (permission.status !== "granted") {
        throw new Error("Location permission is required to send an SOS.");
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const response = await emergencyAPI.trigger({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        message: "Emergency! I need help.",
        triggerType,
      });

      const emergencyWrapper = response?.data?.emergency;
      const createdEmergency = emergencyWrapper?.emergency || emergencyWrapper;
      const emergencyId = createdEmergency?.id || response?.data?.id;
      const activeEvent = {
        ...sosEvent,
        status: "ACTIVE",
        emergencyId: emergencyId || null,
      };

      await AsyncStorage.setItem(ACTIVE_SOS_STORAGE_KEY, JSON.stringify(activeEvent));
      setSosActive(true);
      sosActiveRef.current = true;

      if (emergencyId) {
        try {
          await connectSocket();
          await joinEmergency(emergencyId);
          sendLocation({
            emergencyId,
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          });
          await startEmergencyLocationTracking(emergencyId);
        } catch (trackingError) {
          // SOS is already recorded; a socket/tracking problem must not undo SOS state.
          console.error("SOS sent, but live tracking setup failed:", trackingError?.message);
        }
      }

      const result = emergencyWrapper || {};
      const notified = Number(result.contactsNotified ?? 0);
      const failed = Number(result.contactsFailed ?? 0);
      const total = Number(result.notifications ?? 0);
      let message = "SOS is active.";
      if (total === 0) message = "SOS is active, but no emergency contacts are configured.";
      else if (notified === 0 && failed > 0) message = "SOS is active, but contact notifications failed. Check your network/provider settings.";
      else if (notified > 0 && failed > 0) message = `SOS is active. ${notified} contact(s) notified; ${failed} failed.`;
      else if (notified > 0) message = `SOS is active. ${notified} contact(s) notified.`;
      setSosFeedback(message);
      console.log("SOS successfully triggered:", triggerType, response?.data);
    } catch (error) {
      const status = error?.response?.status;
      if (status === 409) {
        const activeEvent = {
          ...sosEvent,
          status: "ACTIVE",
          emergencyId: error?.response?.data?.emergency?.id || null,
        };
        await AsyncStorage.setItem(ACTIVE_SOS_STORAGE_KEY, JSON.stringify(activeEvent)).catch(() => {});
        sosActiveRef.current = true;
        setSosActive(true);
        setSosFeedback("An SOS is already active. Keep yourself safe; your emergency is still active.");
        void startSOSAlarm();
      } else {
        console.error("SOS trigger failed:", error?.response?.data || error?.message);
        sosActiveRef.current = false;
        setSosActive(false);
        await AsyncStorage.removeItem(ACTIVE_SOS_STORAGE_KEY).catch(() => {});
        await stopSOSAlarm();
        setSosFeedback(error?.response?.data?.message || error?.message || "Could not send SOS. Check your network and try again.");
      }
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
      setSosFeedback("Voice SOS requires the SafeHer development/Android build with speech recognition; it is not available in Expo Go.");
      return;
    }

    try {
      const permission = await speechModule.requestPermissionsAsync();

      if (!permission?.granted) {
        setSosFeedback("Microphone permission is required for Voice SOS.");
        return;
      }

      if (!speechModule.isRecognitionAvailable()) {
        setSosFeedback("Speech recognition is unavailable on this phone. Enable an Android speech service and retry.");
        return;
      }

      voiceEnabledRef.current = true;
      setVoiceListening(true);
      startVoiceRecognition();
    } catch (error) {
      voiceEnabledRef.current = false;
      setVoiceListening(false);
      console.log("Voice SOS initialization error:", error?.message);
      setSosFeedback(error?.message || "Unable to start Voice SOS.");
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

  // Keep the button state in sync whether SOS came from the button, voice,
  // foreground shake, or the Android background service.
  useEffect(() => {
    let mounted = true;

    const syncActiveEmergency = async () => {
      if (sosRunningRef.current) return;
      try {
        const cachedRaw = await AsyncStorage.getItem(ACTIVE_SOS_STORAGE_KEY);
        if (cachedRaw) {
          const cached = JSON.parse(cachedRaw);
          const ageMs = Date.now() - Number(cached?.timestamp || 0);
          if (cached?.status === "PENDING" && ageMs >= 0 && ageMs < 45000) {
            sosActiveRef.current = true;
            setSosActive(true);
            setLoading(true);
            setSosFeedback("SOS trigger detected. Sending emergency alert…");
            return;
          }
        }
        const response = await emergencyAPI.getAll();
        if (!mounted || sosRunningRef.current) return;
        const rows = Array.isArray(response?.data?.data) ? response.data.data : [];
        const active = rows.find((item) => String(item?.status || "").toUpperCase() === "ACTIVE");

        if (active) {
          sosActiveRef.current = true;
          setSosActive(true);
          setSosFeedback("An emergency is active. Your SOS button is locked to prevent duplicate alerts.");
          await AsyncStorage.setItem(ACTIVE_SOS_STORAGE_KEY, JSON.stringify({
            status: "ACTIVE",
            triggerType: active.triggerType || "SOS_BUTTON",
            timestamp: active.startedAt ? new Date(active.startedAt).getTime() : Date.now(),
            emergencyId: active.id,
          }));
        } else {
          sosActiveRef.current = false;
          setSosActive(false);
          setSosFeedback((previous) => previous.startsWith("SOS is active") || previous.startsWith("SOS active") || previous.startsWith("An emergency is active") ? "" : previous);
          await AsyncStorage.removeItem(ACTIVE_SOS_STORAGE_KEY);
          await stopSOSAlarm();
        }
      } catch (error) {
        // Keep current UI state when the API is temporarily unreachable.
        console.log("Could not refresh active SOS state:", error?.message);
      }
    };

    const triggeredSubscription = DeviceEventEmitter.addListener("safeher:sos-triggered", async (event = {}) => {
      if (!mounted) return;
      sosActiveRef.current = true;
      setSosActive(true);
      // Show a pressed/grey button immediately, but keep the spinner until the API confirms.
      const eventStatus = String(event.status || "ACTIVE").toUpperCase();
      const pending = eventStatus === "PENDING";
      setLoading(pending);
      const triggerLabel = event.triggerType ? ` (${event.triggerType.toLowerCase()} trigger)` : "";
      setSosFeedback(pending
        ? `SOS trigger detected${triggerLabel}. Sending emergency alert…`
        : `SOS active${triggerLabel}.`);
      // Keep PENDING until the background API request confirms an active emergency.
      // This avoids a race where the initial status refresh sees no backend row yet.
      const record = {
        ...event,
        status: eventStatus,
        timestamp: event.timestamp || Date.now(),
      };
      await AsyncStorage.setItem(ACTIVE_SOS_STORAGE_KEY, JSON.stringify(record)).catch(() => {});
      void startSOSAlarm();
    });

    const failedSubscription = DeviceEventEmitter.addListener("safeher:sos-failed", (event = {}) => {
      if (!mounted) return;
      sosActiveRef.current = false;
      setSosActive(false);
      setLoading(false);
      setSosFeedback(event.message || "Background SOS could not be sent.");
      void stopSOSAlarm();
    });

    const resolvedSubscription = DeviceEventEmitter.addListener("safeher:sos-resolved", () => {
      if (!mounted) return;
      sosActiveRef.current = false;
      setSosActive(false);
      setLoading(false);
      setSosFeedback("Emergency marked as resolved.");
      void AsyncStorage.removeItem(ACTIVE_SOS_STORAGE_KEY);
      void stopSOSAlarm();
    });

    const appStateSubscription = AppState.addEventListener("change", (state) => {
      if (state === "active") void syncActiveEmergency();
    });
    const focusUnsubscribe = navigation?.addListener?.("focus", syncActiveEmergency);

    void syncActiveEmergency();

    return () => {
      mounted = false;
      triggeredSubscription.remove();
      failedSubscription.remove();
      resolvedSubscription.remove();
      appStateSubscription.remove();
      focusUnsubscribe?.();
    };
  }, [navigation]);

  const enableBackgroundSOS = async () => {
    if (Platform.OS !== "android") {
      setSosFeedback("Background Voice + Shake SOS is currently supported on Android only.");
      return;
    }

    try {
      const foreground = await Location.requestForegroundPermissionsAsync();

      if (foreground.status !== "granted") {
        setSosFeedback("Location permission is required for background SOS alerts.");
        return;
      }

      const background = await Location.requestBackgroundPermissionsAsync();

      if (background.status !== "granted") {
        setSosFeedback("Allow background location in Android settings so background SOS can include your position.");
        return;
      }

      const speechModule = getSpeechRecognitionModule();

      if (!speechModule) {
        setSosFeedback("Background SOS needs the SafeHer development/Android build with native speech recognition.");
        return;
      }

      const microphone = await speechModule.requestPermissionsAsync();

      if (!microphone?.granted) {
        setSosFeedback("Microphone permission is required for background Voice SOS.");
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

      setSosFeedback(`Background SOS enabled: shake or “${voiceKeywordRef.current}”. Keep the SafeHer notification visible.`);
    } catch (error) {
      backgroundSosEnabledRef.current = false;
      setBackgroundSosEnabled(false);
      console.error("❌ Background SOS setup failed:", error?.message);
      setSosFeedback(error?.message || "Unable to start background SOS.");
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
    setSosFeedback("Background SOS disabled.");
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
  ];

  // SHAKE / GESTURE SOS. When the background service is enabled, it owns
  // sensor listening so there are no duplicate foreground/background triggers.
  useEffect(() => {
    if (backgroundSosEnabled) return undefined;

    let subscription;
    let mounted = true;
    Accelerometer.isAvailableAsync()
      .then((available) => {
        if (!mounted || !available) return;
        Accelerometer.setUpdateInterval(100);
        subscription = Accelerometer.addListener(
          createShakeDetector({
            onShake: () => {
              if (!sosActiveRef.current && !sosRunningRef.current) {
                console.log("Shake gesture detected in foreground");
                void triggerSOS("SHAKE");
              }
            },
          }),
        );
      })
      .catch((error) => console.log("Accelerometer unavailable:", error?.message));

    return () => {
      mounted = false;
      subscription?.remove?.();
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
          style={[
            styles.sosButton,
            (loading || sosActive) && styles.sosButtonDisabled,
            sosActive && styles.sosButtonActive,
          ]}
          onPress={handleSOSPress}
          disabled={loading || sosActive}
          activeOpacity={0.72}
        >
          {loading ? (
            <>
              <ActivityIndicator size="large" color="#fff" />
              <Text style={styles.sosSubtext}>Sending SOS…</Text>
            </>
          ) : (
            <>
              <Text style={styles.sosText}>{"SOS"}</Text>
              <Text style={styles.sosSubtext}>{sosActive ? "SOS ACTIVE" : "Tap to Alert"}</Text>
            </>
          )}
        </TouchableOpacity>

        {sosFeedback ? (
          <Text style={[styles.sosFeedback, sosActive && styles.sosFeedbackActive]} accessibilityLiveRegion="polite">
            {sosFeedback}
          </Text>
        ) : null}

        <Text style={styles.sosInstruction}>
          {sosActive ? "Emergency is active. Open History to resolve it when safe." : "Tap to send an emergency alert to all contacts"}
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
    opacity: 1,
    backgroundColor: "#9CA3AF",
    shadowColor: "#6B7280",
    elevation: 4,
  },

  sosButtonActive: {
    backgroundColor: "#9CA3AF",
    borderColor: "#F3F4F6",
    shadowColor: "#6B7280",
  },

  sosFeedback: {
    marginTop: SPACING.md,
    paddingHorizontal: SPACING.md,
    color: COLORS.textSecondary,
    fontSize: 13,
    textAlign: "center",
    lineHeight: 18,
  },

  sosFeedbackActive: {
    color: "#374151",
    fontWeight: "700",
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
