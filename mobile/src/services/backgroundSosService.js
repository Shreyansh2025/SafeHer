import { Platform } from "react-native";
import BackgroundService from "react-native-background-actions";
import { Accelerometer } from "expo-sensors";
import * as Location from "expo-location";
import {
  ExpoSpeechRecognitionModule,
} from "expo-speech-recognition";
import { emergencyAPI } from "./api";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

let cleanupBackgroundListeners = null;
let lastBackgroundTriggerAt = 0;

const TRIGGER_COOLDOWN_MS = 10000;
const SHAKE_THRESHOLD = 2.4;
const SHAKE_UPDATE_INTERVAL = 150;

const normalizeText = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const matchesKeyword = (transcript, keyword) => {
  const spoken = normalizeText(transcript);
  const target = normalizeText(keyword);

  if (!spoken || !target) return false;

  return spoken.includes(target);
};

const getCurrentLocation = async () => {
  const location = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.High,
    mayShowUserSettingsDialog: true,
  });

  return location;
};

const sendBackgroundSOS = async (triggerType) => {
  const now = Date.now();

  if (now - lastBackgroundTriggerAt < TRIGGER_COOLDOWN_MS) {
    console.log("⚠️ Background SOS cooldown active");
    return null;
  }

  lastBackgroundTriggerAt = now;

  try {
    const location = await getCurrentLocation();

    const response = await emergencyAPI.trigger({
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      message: "Emergency! I need help.",
      triggerType,
    });

    console.log(`🚨 Background ${triggerType} SOS sent`, response?.data);
    return response?.data;
  } catch (error) {
    const data = error?.response?.data;

    if (error?.response?.status === 409) {
      console.log("⚠️ SOS already active; background trigger ignored.");
      return data;
    }

    console.error(
      `❌ Background ${triggerType} SOS failed:`,
      data || error?.message,
    );

    throw error;
  }
};

const createBackgroundTask = ({ voiceKeyword }) => async () => {
  let shakeSubscription = null;
  let voiceResultSubscription = null;
  let voiceEndSubscription = null;
  let voiceErrorSubscription = null;
  let voiceRestartTimer = null;
  let stopped = false;

  const startSpeech = () => {
    if (stopped || !BackgroundService.isRunning()) return;

    try {
      const continuous = Platform.OS === "android" && Platform.Version >= 33;

      ExpoSpeechRecognitionModule.start({
        lang: "en-US",
        interimResults: true,
        maxAlternatives: 1,
        continuous,
      });

      console.log(`🎙️ Background voice listening for: "${voiceKeyword}"`);
    } catch (error) {
      console.error("❌ Background voice start failed:", error?.message);
    }
  };

  const scheduleSpeechRestart = (delay = 800) => {
    if (stopped || !BackgroundService.isRunning()) return;

    if (voiceRestartTimer) {
      clearTimeout(voiceRestartTimer);
    }

    voiceRestartTimer = setTimeout(() => {
      startSpeech();
    }, delay);
  };

  try {
    Accelerometer.setUpdateInterval(SHAKE_UPDATE_INTERVAL);

    let lastShakeAt = 0;

    shakeSubscription = Accelerometer.addListener(({ x, y, z }) => {
      const acceleration = Math.sqrt(x * x + y * y + z * z);
      const now = Date.now();

      if (
        acceleration > SHAKE_THRESHOLD &&
        now - lastShakeAt > TRIGGER_COOLDOWN_MS
      ) {
        lastShakeAt = now;
        console.log("🚨 Background shake detected");

        sendBackgroundSOS("SHAKE").catch(() => {});
      }
    });

    voiceResultSubscription = ExpoSpeechRecognitionModule.addListener(
      "result",
      (event) => {
        const transcript = (event?.results || [])
          .map((result) => result?.transcript || "")
          .join(" ");

        if (matchesKeyword(transcript, voiceKeyword)) {
          console.log(`🚨 Background voice keyword detected: ${transcript}`);

          try {
            ExpoSpeechRecognitionModule.abort();
          } catch (error) {
            console.log("⚠️ Background voice abort error:", error?.message);
          }

          sendBackgroundSOS("VOICE").catch(() => {});
        }
      },
    );

    voiceEndSubscription = ExpoSpeechRecognitionModule.addListener(
      "end",
      () => {
        scheduleSpeechRestart(600);
      },
    );

    voiceErrorSubscription = ExpoSpeechRecognitionModule.addListener(
      "error",
      (event) => {
        console.log(
          "⚠️ Background voice recognition error:",
          event?.error,
          event?.message,
        );

        if (event?.error !== "aborted") {
          scheduleSpeechRestart(1000);
        }
      },
    );

    startSpeech();

    while (BackgroundService.isRunning() && !stopped) {
      await sleep(1000);
    }
  } finally {
    stopped = true;

    if (voiceRestartTimer) {
      clearTimeout(voiceRestartTimer);
      voiceRestartTimer = null;
    }

    try {
      ExpoSpeechRecognitionModule.abort();
    } catch (_) {}

    shakeSubscription?.remove?.();
    voiceResultSubscription?.remove?.();
    voiceEndSubscription?.remove?.();
    voiceErrorSubscription?.remove?.();

    cleanupBackgroundListeners = null;
  }
};

export const isBackgroundSOSRunning = () =>
  Platform.OS === "android" && BackgroundService.isRunning();

export const startBackgroundSOS = async (voiceKeyword) => {
  if (Platform.OS !== "android") {
    throw new Error("Background SOS is currently supported on Android only.");
  }

  if (BackgroundService.isRunning()) {
    return;
  }

  const keyword = String(voiceKeyword || "SafeHer SOS").trim();
  const task = createBackgroundTask({ voiceKeyword: keyword });

  await BackgroundService.start(task, {
    taskName: "SafeHerSOS",
    taskTitle: "SafeHer Background SOS",
    taskDesc: `Listening for shake or "${keyword}"`,
    taskIcon: {
      name: "ic_launcher",
      type: "mipmap",
    },
    color: "#DC2626",
    parameters: {},
    foregroundServiceType: ["microphone", "specialUse"],
  });

  cleanupBackgroundListeners = () => {
    try {
      ExpoSpeechRecognitionModule.abort();
    } catch (_) {}
  };
};

export const stopBackgroundSOS = async () => {
  if (cleanupBackgroundListeners) {
    cleanupBackgroundListeners();
    cleanupBackgroundListeners = null;
  }

  if (BackgroundService.isRunning()) {
    await BackgroundService.stop();
  }
};
