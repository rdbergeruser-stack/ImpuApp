// Haptic feedback utility using Vibration API and React Native WebView bridge

let isHapticsEnabled = true;

export function setHapticsEnabled(enabled) {
  isHapticsEnabled = !!enabled;
}

function notifyReactNative(type) {
  if (typeof window !== 'undefined' && window.ReactNativeWebView) {
    try {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type }));
    } catch (e) {}
  }
}

export function vibrate(pattern = 50) {
  if (!isHapticsEnabled) return;
  try {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  } catch (e) {}
}

export function hapticTap() {
  vibrate(30);
  notifyReactNative('HAPTIC_TAP');
}

export function hapticCountdown() {
  vibrate(80);
  notifyReactNative('HAPTIC_COUNTDOWN');
}

export function hapticPhaseChange() {
  vibrate([120, 80, 200]);
  notifyReactNative('HAPTIC_PHASE');
}

export function hapticSuccess() {
  vibrate([60, 50, 60, 50, 150]);
  notifyReactNative('HAPTIC_PHASE');
}

