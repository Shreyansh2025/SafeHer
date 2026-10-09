import { createAudioPlayer, setAudioModeAsync } from "expo-audio";

export const ACTIVE_SOS_STORAGE_KEY = "safeher_active_sos_event";

const sirenPlayer = createAudioPlayer(require("../../assets/sos-siren.wav"));
let audioModeConfigured = false;
let playing = false;

export const startSOSAlarm = async () => {
  try {
    if (!audioModeConfigured) {
      await setAudioModeAsync({
        playsInSilentMode: true,
        shouldPlayInBackground: true,
        interruptionMode: "doNotMix",
      });
      audioModeConfigured = true;
    }
    if (playing) return;

    sirenPlayer.loop = true;
    sirenPlayer.volume = 1;
    if (typeof sirenPlayer.setActiveForLockScreen === "function") {
      sirenPlayer.setActiveForLockScreen(true, {
        title: "SafeHer Emergency Siren",
        artist: "SafeHer",
        albumTitle: "Emergency Alert",
      });
    }
    await sirenPlayer.seekTo(0);
    sirenPlayer.play();
    playing = true;
  } catch (error) {
    console.error("Could not start SafeHer siren:", error?.message || error);
  }
};

export const stopSOSAlarm = async () => {
  try {
    sirenPlayer.pause();
    await sirenPlayer.seekTo(0);
    if (typeof sirenPlayer.setActiveForLockScreen === "function") {
      sirenPlayer.setActiveForLockScreen(false);
    }
  } catch (error) {
    console.log("Could not stop SafeHer siren:", error?.message || error);
  } finally {
    playing = false;
  }
};
