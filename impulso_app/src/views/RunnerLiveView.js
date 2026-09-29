// Runner Live Execution View - Zone-based interval runner chronometer

import { storage } from '../store/storage.js';
import { formatTime } from '../utils/formatters.js';
import { audio } from '../audio/audioService.js';
import { hapticTap, hapticCountdown, hapticPhaseChange } from '../utils/haptics.js';
import { requestWakeLock, releaseWakeLock } from '../utils/wakeLock.js';

export function renderRunnerLive(container, navigate, params = {}) {
  const preset = params.preset || storage.getRunnerPresets()[0];
  const settings = storage.getSettings();
  const intervals = preset.intervals;

  let currentIdx = 0;
  let remainingInInterval = intervals[0].duration;
  let isPaused = false;
  let timerTimeoutId = null;
  let nextExpectedTick = 0;
  let totalDuration = intervals.reduce((acc, i) => acc + i.duration, 0);

  requestWakeLock();

  setTimeout(() => {
    announceInterval(intervals[0]);
  }, 400);

  function getRemainingTotal() {
    let rem = remainingInInterval;
    for (let i = currentIdx + 1; i < intervals.length; i++) {
      rem += intervals[i].duration;
    }
    return rem;
  }

  function announceInterval(item) {
    const cue = item.cue ? `. ${item.cue}` : '';
    if (item.zone === 'Z4' || item.zone === 'Z5') {
      audio.playGo();
      audio.speak(`¡${item.name}! ${item.zone}${cue}`);
      hapticPhaseChange();
    } else {
      audio.playRest();
      audio.speak(`${item.name}. ${item.zone}${cue}`);
      hapticPhaseChange();
    }
  }

  function tick() {
    if (isPaused) return;

    remainingInInterval--;
    // 1. Sincronización visual inmediata a los 0ms del segundo
    updateUI();

    // 2. Anuncio conciso del siguiente intervalo a los 6s para no chocar con el conteo
    if (remainingInInterval === 6 && currentIdx < intervals.length - 1) {
      audio.speak(`Siguiente: ${intervals[currentIdx + 1].name}`, { rate: 1.2 });
    } else if (remainingInInterval === 4) {
      audio.prewarm();
    } else if (remainingInInterval === 3) {
      audio.playCountdown();
      audio.speak('Tres', { rate: 1.25 });
      hapticCountdown();
    } else if (remainingInInterval === 2) {
      audio.playCountdown();
      audio.speak('Dos', { rate: 1.25 });
      hapticCountdown();
    } else if (remainingInInterval === 1) {
      audio.playCountdown();
      audio.speak('Uno', { rate: 1.25 });
      hapticCountdown();
    }

    if (remainingInInterval <= 0) {
      if (currentIdx < intervals.length - 1) {
        currentIdx++;
        remainingInInterval = intervals[currentIdx].duration;
        updateUI();
        announceInterval(intervals[currentIdx]);
      } else {
        finishRunner();
        return;
      }
    }
  }

  function scheduleNextTick() {
    if (isPaused) return;
    const now = Date.now();
    const delay = Math.max(0, nextExpectedTick - now);
    timerTimeoutId = setTimeout(() => {
      if (isPaused) return;
      nextExpectedTick += 1000;
      tick();
      scheduleNextTick();
    }, delay);
  }

  function startTimer() {
    if (timerTimeoutId) clearTimeout(timerTimeoutId);
    nextExpectedTick = Date.now() + 1000;
    scheduleNextTick();
  }

  function togglePlayPause() {
    hapticTap();
    isPaused = !isPaused;
    const btn = document.getElementById('btn-runner-play-pause');
    if (btn) {
      if (isPaused) {
        if (timerTimeoutId) clearTimeout(timerTimeoutId);
        btn.innerHTML = `<span class="material-symbols-outlined text-[42px]" style="font-variation-settings: 'FILL' 1;">play_arrow</span>`;
        btn.classList.add('bg-amber-500');
        btn.classList.remove('bg-primary-container');
      } else {
        btn.innerHTML = `<span class="material-symbols-outlined text-[42px]" style="font-variation-settings: 'FILL' 1;">pause</span>`;
        btn.classList.remove('bg-amber-500');
        btn.classList.add('bg-primary-container');
        nextExpectedTick = Date.now() + 1000;
        scheduleNextTick();
      }
    }
  }

  function skipNext() {
    hapticTap();
    if (currentIdx < intervals.length - 1) {
      currentIdx++;
      remainingInInterval = intervals[currentIdx].duration;
      announceInterval(intervals[currentIdx]);
      updateUI();
      if (!isPaused) {
        if (timerTimeoutId) clearTimeout(timerTimeoutId);
        nextExpectedTick = Date.now() + 1000;
        scheduleNextTick();
      }
    } else {
      finishRunner();
    }
  }

  function skipPrev() {
    hapticTap();
    if (currentIdx > 0) {
      currentIdx--;
      remainingInInterval = intervals[currentIdx].duration;
      announceInterval(intervals[currentIdx]);
      updateUI();
      if (!isPaused) {
        if (timerTimeoutId) clearTimeout(timerTimeoutId);
        nextExpectedTick = Date.now() + 1000;
        scheduleNextTick();
      }
    }
  }

  function finishRunner() {
    if (timerTimeoutId) clearTimeout(timerTimeoutId);
    releaseWakeLock();
    audio.playFanfare();
    audio.speak('¡Sesión Runner completada! Gran resistencia.');

    const summaryData = {
      type: 'runner',
      routineName: preset.title,
      durationSeconds: totalDuration,
      caloriesEst: Math.round((totalDuration / 60) * 12.5),
      summary: `Completados ${intervals.length} intervalos de carrera (${preset.totalDistanceEst || '4.5 km'}) con control de zonas.`
    };

    navigate('summary', { workout: summaryData });
  }

  function getZoneVisuals(zone) {
    switch (zone) {
      case 'Z5':
        return {
          stroke: '#fe7453',
          border: 'border-error',
          badgeBg: 'bg-error/20 text-error border-error',
          glow: 'pulse-glow'
        };
      case 'Z4':
        return {
          stroke: '#ffa276',
          border: 'border-tertiary',
          badgeBg: 'bg-tertiary/20 text-tertiary border-tertiary',
          glow: 'glow-tertiary'
        };
      case 'Z3':
        return {
          stroke: '#f59e0b',
          border: 'border-amber-500',
          badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500',
          glow: 'glow-primary'
        };
      default:
        return {
          stroke: 'var(--color-primary-accent, #00ff66)',
          border: 'border-outline-variant',
          badgeBg: 'bg-primary-container/20 text-primary-container border-primary-container',
          glow: 'glow-primary'
        };
    }
  }

  function renderView() {
    const cur = intervals[currentIdx];
    const next = intervals[currentIdx + 1] || null;
    const visuals = getZoneVisuals(cur.zone);
    const progressFrac = 1 - (remainingInInterval / cur.duration);
    const dashOffset = 640 * (1 - progressFrac);
    const totalProgFrac = Math.round(((currentIdx + progressFrac) / intervals.length) * 100);

    const html = `
      <div class="w-full h-full flex flex-col justify-between overflow-hidden bg-background select-none">
        
        <header class="w-full flex flex-col gap-2 px-4 pt-3 pb-1 shrink-0 safe-area-top">
          <div class="flex items-center justify-between">
            <button id="btn-runner-exit" class="h-10 w-10 rounded-full bg-surface-container-high border border-outline-variant flex items-center justify-center text-on-surface hover:text-error active:scale-95 transition-all" aria-label="Salir">
              <span class="material-symbols-outlined text-[20px]">close</span>
            </button>

            <div class="flex flex-col items-center text-center">
              <span class="font-montserrat text-lg uppercase tracking-wider text-white font-black leading-tight">
                ImpuApp
              </span>
              <div class="flex items-center gap-1.5 mt-0.5">
                <span class="w-1.5 h-1.5 rounded-full bg-tertiary-fixed animate-ping"></span>
                <span id="ui-runner-step-text" class="text-[10px] text-tertiary-fixed tracking-widest uppercase font-black font-headline">
                  ${preset.title} • PASO ${currentIdx + 1} DE ${intervals.length}
                </span>
              </div>
            </div>

            <button id="btn-runner-audio" class="h-10 w-10 rounded-full bg-surface-container-high border border-outline-variant flex items-center justify-center text-primary-container active:scale-95 transition-all" aria-label="Audio">
              <span class="material-symbols-outlined text-[20px]" id="runner-audio-icon">${settings.soundEnabled ? 'volume_up' : 'volume_off'}</span>
            </button>
          </div>

          <div class="bg-surface-container rounded-xl p-2.5 border border-outline-variant/60 mt-1">
            <div class="w-full h-1.5 bg-surface-container-highest rounded-full overflow-hidden flex">
              <div id="ui-total-progress-bar" class="h-full bg-primary-container rounded-full transition-all duration-300" style="width: ${totalProgFrac}%;"></div>
            </div>
            <div class="flex justify-between items-center mt-2 text-xs text-on-surface-variant font-medium">
              <span class="flex items-center gap-1">
                <span class="material-symbols-outlined text-sm text-tertiary">timer</span>
                Tiempo Total Restante: <strong id="ui-runner-total-rem" class="font-bold text-on-surface tabular-nums">${formatTime(getRemainingTotal())}</strong>
              </span>
              <span id="ui-runner-step-badge" class="bg-surface-variant px-2 py-0.5 rounded text-primary-container font-black tracking-wider text-[10px] font-headline">
                Paso ${currentIdx + 1} de ${intervals.length}
              </span>
            </div>
          </div>
        </header>

        <main class="flex-1 flex flex-col justify-between max-w-md mx-auto w-full px-4 py-1">
          
          <section id="ui-intensity-card" class="w-full bg-surface-container border-2 ${visuals.border} rounded-2xl p-4 flex flex-col items-center relative overflow-hidden shadow-2xl ${visuals.glow} my-auto">
            <div class="w-full flex items-center justify-between mb-2">
              <span id="ui-runner-phase-chip" class="inline-flex items-center gap-1.5 border px-3 py-1 rounded-full text-xs uppercase tracking-wider font-headline font-black ${visuals.badgeBg}">
                <span class="w-2 h-2 rounded-full bg-current animate-pulse"></span>
                <span id="ui-runner-phase-title">${cur.name.toUpperCase()}</span>
              </span>

              <span id="ui-runner-zone-chip" class="inline-flex items-center gap-1 bg-surface-container-highest border border-outline-variant px-2.5 py-1 rounded-full text-primary-container text-xs uppercase font-bold font-headline">
                <span class="material-symbols-outlined text-xs text-error" style="font-variation-settings: 'FILL' 1;">favorite</span>
                <span id="ui-runner-zone-text">${cur.zone} • ${cur.bpm} BPM</span>
              </span>
            </div>

            <div class="relative w-64 h-64 flex items-center justify-center my-1">
              <svg class="w-full h-full circular-meter" viewBox="0 0 240 240">
                <circle cx="120" cy="120" fill="none" r="102" stroke="#0e2b19" stroke-width="14"></circle>
                <circle id="ui-runner-progress-circle" cx="120" cy="120" fill="none" r="102" 
                  stroke="${visuals.stroke}" 
                  stroke-dasharray="640" 
                  stroke-dashoffset="${dashOffset}" 
                  stroke-linecap="round" 
                  stroke-width="14" 
                  class="transition-all duration-300">
                </circle>
              </svg>

              <div class="absolute inset-0 flex flex-col items-center justify-center text-center">
                <div id="ui-runner-timer" class="font-headline text-5xl sm:text-6xl font-black tracking-tight text-primary leading-none drop-shadow-md tabular-nums">
                  ${formatTime(remainingInInterval)}
                </div>
                <span class="text-[11px] text-on-surface-variant tracking-widest uppercase mt-2 font-bold">
                  TIEMPO RESTANTE
                </span>
              </div>
            </div>

            <div class="w-full bg-surface-container-low border border-outline-variant/60 rounded-xl px-3 py-2 mt-1 text-center">
              <p id="ui-runner-cue" class="text-xs text-on-surface-variant italic font-medium">
                ❝ ${cur.cue || 'Mantén el ritmo y la respiración fluida'} ❞
              </p>
            </div>
          </section>

          <section class="w-full my-2">
            <div class="w-full bg-surface-container-low border border-outline-variant rounded-xl p-3 flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-lg bg-surface-container-highest flex items-center justify-center text-primary-container border border-outline-variant">
                  <span class="material-symbols-outlined text-[20px]">skip_next</span>
                </div>
                <div class="flex flex-col">
                  <span class="text-[10px] text-on-surface-variant uppercase tracking-widest font-bold">SIGUIENTE INTERVALO</span>
                  <span id="ui-runner-next-title" class="font-headline text-sm text-primary font-black">
                    ${next ? next.name : 'Vuelta a la Calma'} <span id="ui-runner-next-time" class="text-primary-dim">• ${next ? formatTime(next.duration) : '00:00'}</span>
                  </span>
                  <span id="ui-runner-next-sub" class="text-[11px] text-on-surface-variant font-medium">
                    ${next ? next.cue : 'Final del entrenamiento'}
                  </span>
                </div>
              </div>
              <span id="ui-runner-next-zone" class="px-2 py-1 bg-surface-bright rounded text-primary-dim text-xs tracking-wider font-headline font-black">
                ${next ? next.zone : 'FIN'}
              </span>
            </div>
          </section>

          <footer class="w-full flex flex-col gap-3 pb-4 safe-area-bottom">
            <div class="w-full flex items-center justify-between px-2">
              <button id="btn-runner-prev" class="w-16 h-16 rounded-2xl bg-surface-container-high border border-outline-variant flex items-center justify-center text-on-surface active:scale-95 transition-transform shadow-md" aria-label="Anterior">
                <span class="material-symbols-outlined text-[30px]">skip_previous</span>
              </button>

              <button id="btn-runner-play-pause" class="flex-1 mx-4 h-16 rounded-2xl bg-primary-container text-on-primary font-headline text-base uppercase tracking-wider font-black flex items-center justify-center gap-2 glow-primary active:scale-[0.98] transition-transform shadow-2xl">
                <span class="material-symbols-outlined text-[34px]" style="font-variation-settings: 'FILL' 1;">pause</span>
                <span>PAUSAR</span>
              </button>

              <button id="btn-runner-next" class="w-16 h-16 rounded-2xl bg-surface-container-high border border-outline-variant flex items-center justify-center text-on-surface active:scale-95 transition-transform shadow-md" aria-label="Siguiente">
                <span class="material-symbols-outlined text-[30px]">skip_next</span>
              </button>
            </div>
          </footer>

        </main>
      </div>
    `;

    container.innerHTML = html;
    attachRunnerEvents();
  }

  function updateUI() {
    const cur = intervals[currentIdx];
    const next = intervals[currentIdx + 1] || null;
    const visuals = getZoneVisuals(cur.zone);
    const progressFrac = 1 - (remainingInInterval / cur.duration);
    const totalProgFrac = Math.round(((currentIdx + progressFrac) / intervals.length) * 100);

    const timerElem = document.getElementById('ui-runner-timer');
    if (timerElem) timerElem.textContent = formatTime(remainingInInterval);

    const totalRemElem = document.getElementById('ui-runner-total-rem');
    if (totalRemElem) totalRemElem.textContent = formatTime(getRemainingTotal());

    const progBar = document.getElementById('ui-total-progress-bar');
    if (progBar) progBar.style.width = `${totalProgFrac}%`;

    const stepText = document.getElementById('ui-runner-step-text');
    if (stepText) stepText.textContent = `EN PROGRESO • INTERVALO ${currentIdx + 1} DE ${intervals.length}`;

    const stepBadge = document.getElementById('ui-runner-step-badge');
    if (stepBadge) stepBadge.textContent = `Paso ${currentIdx + 1} de ${intervals.length}`;

    const phaseTitle = document.getElementById('ui-runner-phase-title');
    if (phaseTitle) phaseTitle.textContent = cur.name.toUpperCase();

    const phaseChip = document.getElementById('ui-runner-phase-chip');
    if (phaseChip) phaseChip.className = `inline-flex items-center gap-1.5 border px-3 py-1 rounded-full text-xs uppercase tracking-wider font-headline font-black ${visuals.badgeBg}`;

    const zoneText = document.getElementById('ui-runner-zone-text');
    if (zoneText) zoneText.textContent = `${cur.zone} • ${cur.bpm} BPM`;

    const cueElem = document.getElementById('ui-runner-cue');
    if (cueElem) cueElem.textContent = `❝ ${cur.cue || 'Mantén el ritmo y la respiración fluida'} ❞`;

    const circle = document.getElementById('ui-runner-progress-circle');
    if (circle) {
      circle.setAttribute('stroke', visuals.stroke);
      circle.setAttribute('stroke-dashoffset', String(640 * (1 - progressFrac)));
    }

    const nextTitle = document.getElementById('ui-runner-next-title');
    if (nextTitle) {
      nextTitle.innerHTML = `${next ? next.name : 'Vuelta a la Calma'} <span class="text-primary-dim">• ${next ? formatTime(next.duration) : '00:00'}</span>`;
    }

    const nextSub = document.getElementById('ui-runner-next-sub');
    if (nextSub) nextSub.textContent = next ? next.cue : 'Final del entrenamiento';

    const nextZone = document.getElementById('ui-runner-next-zone');
    if (nextZone) nextZone.textContent = next ? next.zone : 'FIN';
  }

  function attachRunnerEvents() {
    document.getElementById('btn-runner-play-pause')?.addEventListener('click', togglePlayPause);
    document.getElementById('btn-runner-next')?.addEventListener('click', skipNext);
    document.getElementById('btn-runner-prev')?.addEventListener('click', skipPrev);

    document.getElementById('btn-runner-audio')?.addEventListener('click', () => {
      hapticTap();
      settings.soundEnabled = !settings.soundEnabled;
      storage.saveSettings(settings);
      audio.setSoundEnabled(settings.soundEnabled);
      const icon = document.getElementById('runner-audio-icon');
      if (icon) icon.textContent = settings.soundEnabled ? 'volume_up' : 'volume_off';
    });

    document.getElementById('btn-runner-exit')?.addEventListener('click', () => {
      hapticTap();
      if (confirm('¿Deseas finalizar la sesión de carrera?')) {
        if (timerTimeoutId) clearTimeout(timerTimeoutId);
        releaseWakeLock();
        navigate('runner-catalog');
      }
    });
  }

  renderView();
  startTimer();
}
