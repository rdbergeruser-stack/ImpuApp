export function formatTime(totalSeconds) {
  if (isNaN(totalSeconds) || totalSeconds < 0) totalSeconds = 0;
  const s = Math.floor(totalSeconds);
  const hours = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const seconds = s % 60;
  const pad = (n) => String(n).padStart(2, '0');
  if (hours > 0) {
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }
  return `${pad(minutes)}:${pad(seconds)}`;
}

export function formatDate(isoString) {
  if (!isoString) return '';
  const d = new Date(isoString);
  const options = { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' };
  return d.toLocaleDateString('es-ES', options);
}

export function formatKg(kg) {
  const num = parseFloat(kg);
  if (isNaN(num)) return '0 kg';
  return Number.isInteger(num) ? `${num} kg` : `${num.toFixed(1)} kg`;
}

