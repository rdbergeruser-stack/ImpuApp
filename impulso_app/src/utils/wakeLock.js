// Screen WakeLock to keep mobile screen active during workouts

let wakeLock = null;
let isEnabled = true;

export async function requestWakeLock() {
  if (!isEnabled) return;
  if ('wakeLock' in navigator) {
    try {
      wakeLock = await navigator.wakeLock.request('screen');
      wakeLock.addEventListener('release', () => {});
    } catch (err) {}
  }
}

export async function releaseWakeLock() {
  if (wakeLock !== null) {
    try {
      await wakeLock.release();
      wakeLock = null;
    } catch (err) {}
  }
}

export function setWakeLockEnabled(enabled) {
  isEnabled = enabled;
  if (!isEnabled) {
    releaseWakeLock();
  }
}

if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', async () => {
    if (wakeLock !== null && document.visibilityState === 'visible') {
      await requestWakeLock();
    }
  });
}
