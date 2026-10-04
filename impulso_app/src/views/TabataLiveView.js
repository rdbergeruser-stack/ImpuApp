// Tabata Live Execution View - High precision sports timer

import { storage } from '../store/storage.js';
import { formatTime } from '../utils/formatters.js';
import { audio } from '../audio/audioService.js';
import { hapticTap, hapticCountdown, hapticPhaseChange } from '../utils/haptics.js';
import { requestWakeLock, releaseWakeLock } from '../utils/wakeLock.js';

export function renderTabataLive(container, navigate, params = {}) {
  const config = params.config || storage.getTabataPresets()[0];
  const settings = storage.getSettings();

  const steps = [];

  // Parse exercises if comma-separated, slash-separated or array
  const exerciseList = config.exercises && Array.isArray(config.exercises) && config.exercises.length > 0
    ? config.exercises
    : (config.workName && (config.workName.includes(',') || config.workName.includes('/')))
      ? config.workName.split(/[,/]/).map(s => s.trim()).filter(Boolean)
      : null;

  if (config.prep > 0) {
    const firstEx = exerciseList ? exerciseList[0] : (config.workName || 'INTERVALO');
    steps.push({ type: 'prep', name: 'PREPARACIÓN', exerciseName: firstEx, duration: config.prep, cycle: 0, set: 1 });
  }

  for (let s = 1; s <= config.sets; s++) {
    for (let c = 1; c <= config.cycles; c++) {
      const exName = exerciseList ? exerciseList[(c - 1) % exerciseList.length] : (config.workName || 'INTERVALO DE TRABAJO');
      steps.push({
        type: 'work',
        name: exName,
        duration: config.work,
        cycle: c,
        set: s
      });
      if (c < config.cycles || (c === config.cycles && s < config.sets && config.restBetweenSets > 0)) {
        if (c === config.cycles && s < config.sets && config.restBetweenSets > 0) {
          steps.push({
            type: 'restBetween',
            name: 'DESCANSO ENTRE SERIES',
            duration: config.restBetweenSets,
            cycle: c,
            set: s
          });
        } else {
          steps.push({
            type: 'rest',
            name: config.restName || 'DESCANSO ACTIVO',
            duration: config.rest,
            cycle: c,
            set: s
          });
        }
      }
    }
  }

  if (config.cooldown > 0) {
    steps.push({
      type: 'cooldown',
      name: 'ENFRIAMIENTO FINAL',
      duration: config.cooldown,
      cycle: config.cycles,
      set: config.sets
    });
  }

  let currentStepIdx = 0;
  let remainingInStep = steps[0].duration;
  let isPaused = false;
  let timerTimeoutId = null;
  let nextExpectedTick = 0;
  let totalWorkoutDuration = steps.reduce((acc, s) => acc + s.duration, 0);

  requestWakeLock();

  setTimeout(() => {
    announceStep(steps[0]);
  }, 400);

  function getRemainingTotal() {
    let rem = remainingInStep;
    for (let i = currentStepIdx + 1; i < steps.length; i++) {
      rem += steps[i].duration;
    }
    return rem;
  }

  function announceStep(step) {
    if (step.type === 'prep') {
      const firstWork = steps.find(s => s.type === 'work');
      audio.speak('Preparación. Primer ejercicio: ' + (firstWork ? firstWork.name : 'comenzar'));
    } else if (step.type === 'work') {
      audio.playGo();
      audio.speak(`¡A trabajar! ${step.name}`);
      hapticPhaseChange();
    } else if (step.type === 'rest' || step.type === 'restBetween') {
      audio.playRest();
      const nextWork = steps.slice(currentStepIdx + 1).find(s => s.type === 'work');
      if (nextWork) {
        audio.speak(`Descanso. Siguiente: ${nextWork.name}`);
      } else {
        audio.speak('Descanso. ¡Última ronda completada!');
      }
      hapticPhaseChange();
    } else if (step.type === 'cooldown') {
      audio.speak('Enfriamiento final. Excelente trabajo.');
      hapticPhaseChange();
    }
  }

  function tick() {
    if (isPaused) return;

    remainingInStep--;
    // 1. Sincronización visual inmediata a los 0ms del segundo
    updateUI();

    // 2. Pre-calentar el canal de audio a los 4s para cero latencia al decir 'Tres'
    if (remainingInStep === 4) {
      audio.prewarm();
    } else if (remainingInStep === 3) {
      audio.playCountdown();
      audio.speak('Tres', { rate: 1.25 });
      hapticCountdown();
    } else if (remainingInStep === 2) {
      audio.playCountdown();
      audio.speak('Dos', { rate: 1.25 });
      hapticCountdown();
    } else if (remainingInStep === 1) {
      audio.playCountdown();
      audio.speak('Uno', { rate: 1.25 });
      hapticCountdown();
    }

    if (remainingInStep <= 0) {
      if (currentStepIdx < steps.length - 1) {
        currentStepIdx++;
        remainingInStep = steps[currentStepIdx].duration;
        updateUI();
        announceStep(steps[currentStepIdx]);
      } else {
        finishWorkout();
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
    const btn = document.getElementById('btn-play-pause');
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
    if (currentStepIdx < steps.length - 1) {
      currentStepIdx++;
      remainingInStep = steps[currentStepIdx].duration;
      announceStep(steps[currentStepIdx]);
      updateUI();
      if (!isPaused) {
        if (timerTimeoutId) clearTimeout(timerTimeoutId);
        nextExpectedTick = Date.now() + 1000;
        scheduleNextTick();
      }
    } else {
      finishWorkout();
    }
  }

  function skipPrev() {
    hapticTap();
    if (currentStepIdx > 0) {
      currentStepIdx--;
      remainingInStep = steps[currentStepIdx].duration;
      announceStep(steps[currentStepIdx]);
      updateUI();
      if (!isPaused) {
        if (timerTimeoutId) clearTimeout(timerTimeoutId);
        nextExpectedTick = Date.now() + 1000;
        scheduleNextTick();
      }
    }
  }

  function finishWorkout() {
    if (timerTimeoutId) clearTimeout(timerTimeoutId);
    releaseWakeLock();
    audio.playFanfare();
    audio.speak('¡Entrenamiento completado! Excelente trabajo.');

    const summaryData = {
      type: 'tabata',
      routineName: config.title || 'Tabata Personalizado',
      durationSeconds: totalWorkoutDuration,
      caloriesEst: Math.round((totalWorkoutDuration / 60) * 11),
      summary: `${config.cycles * config.sets} intervalos completados al 100%`
    };

    navigate('summary', { workout: summaryData });
  }

  function getStepStyle(type) {
    switch (type) {
      case 'work':
        return {
          badgeBg: 'bg-primary-container/20 border-primary-container text-primary-container',
          meterStroke: 'var(--color-primary-accent, #00ff66)',
          titleColor: 'text-primary-container',
          glow: 'glow-work'
        };
      case 'prep':
        return {
          badgeBg: 'bg-[#ffa276]/20 border-[#ffa276] text-[#ffa276]',
          meterStroke: '#ffa276',
          titleColor: 'text-[#ffa276]',
          glow: 'glow-tertiary'
        };
      case 'rest':
      case 'restBetween':
        return {
          badgeBg: 'bg-secondary/20 border-secondary text-secondary',
          meterStroke: '#e6beab',
          titleColor: 'text-secondary',
          glow: 'glow-rest'
        };
      case 'cooldown':
        return {
          badgeBg: 'bg-teal-500/20 border-teal-500 text-teal-300',
          meterStroke: '#2dd4bf',
          titleColor: 'text-teal-300',
          glow: 'glow-primary'
        };
      default:
        return {
          badgeBg: 'bg-surface-container border-outline text-on-surface',
          meterStroke: '#00ff66',
          titleColor: 'text-white',
          glow: 'glow-primary'
        };
    }
  }

  function renderView() {
    const step = steps[currentStepIdx];
    const nextStep = steps[currentStepIdx + 1] || null;
    const style = getStepStyle(step.type);
    const progressFrac = 1 - (remainingInStep / step.duration);
    const dashOffset = 615.75 * (1 - progressFrac);

    const html = `
      <div class="w-full h-full flex flex-col justify-between overflow-hidden bg-background select-none">
        <header class="w-full px-4 pt-3 pb-2 flex items-center justify-between z-20 shrink-0 safe-area-top">
          <button id="btn-exit" class="w-10 h-10 rounded-full border border-outline-variant bg-surface-container flex items-center justify-center text-on-surface hover:text-error active:scale-95 transition-all" aria-label="Salir">
            <span class="material-symbols-outlined text-[20px]">close</span>
          </button>

          <div class="flex flex-col items-center justify-center text-center">
            <span class="font-montserrat text-lg uppercase tracking-wider text-white font-black leading-tight">
              ImpuApp
            </span>
            <div class="flex items-center gap-1.5 justify-center mt-0.5">
              <span class="text-primary-dim text-[10px] tracking-widest font-black uppercase font-headline">${config.title || 'TABATA INTERVAL'}</span>
              <span class="w-1.5 h-1.5 rounded-full bg-primary-container animate-ping"></span>
            </div>
          </div>

          <button id="btn-toggle-audio" class="w-10 h-10 rounded-full border border-outline-variant bg-surface-container flex items-center justify-center text-primary-container active:scale-95 transition-all" aria-label="Audio">
            <span class="material-symbols-outlined text-[20px]" id="audio-icon">${settings.soundEnabled ? 'volume_up' : 'volume_off'}</span>
          </button>
        </header>

        <main class="flex-1 flex flex-col justify-between max-w-md mx-auto w-full px-4 py-1">
          
          <!-- Upper Card -->
          <section class="w-full bg-surface-container rounded-2xl p-3 border border-outline-variant flex flex-col gap-1 shadow-lg">
            <div class="flex items-center justify-center gap-2 text-center">
              <span class="material-symbols-outlined text-tertiary text-sm">timer</span>
              <span class="text-on-surface-variant text-[11px] tracking-widest uppercase font-bold">TIEMPO TOTAL RESTANTE</span>
            </div>
            
            <div class="flex flex-col items-center justify-center text-center my-0.5">
              <span id="ui-total-rem" class="font-headline text-3xl text-primary font-black tracking-tight leading-none tabular-nums">
                ${formatTime(getRemainingTotal())}
              </span>
            </div>

            <div class="flex items-center justify-center gap-3 text-center text-xs pt-1 border-t border-outline-variant/30">
              <div>
                <span class="text-on-surface-variant uppercase font-bold text-[10px]">Ciclo: </span>
                <span id="ui-cycle" class="text-on-surface font-black">${step.cycle} / ${config.cycles}</span>
              </div>
              <span class="text-outline-variant">•</span>
              <div>
                <span class="text-on-surface-variant uppercase font-bold text-[10px]">Serie: </span>
                <span id="ui-set" class="text-on-surface font-black">${step.set} / ${config.sets}</span>
              </div>
            </div>
          </section>

          <!-- Phase Badge & Exercise Name -->
          <section class="flex flex-col items-center justify-center text-center my-2">
            <div id="ui-phase-badge" class="inline-flex items-center gap-1.5 px-4 py-1 rounded-full border ${style.badgeBg} mb-2 shadow-sm">
              <span class="w-2 h-2 rounded-full bg-current animate-pulse"></span>
              <span id="ui-phase-text" class="text-[11px] font-black tracking-widest uppercase font-headline">
                ${step.type.toUpperCase()}
              </span>
            </div>

            <h2 id="ui-exercise-name" class="font-headline text-2xl sm:text-3xl font-black tracking-tight uppercase leading-tight ${style.titleColor}">
              ${step.name}
            </h2>
          </section>

          <!-- Circular Chronometer -->
          <section class="relative w-64 h-64 mx-auto my-auto flex items-center justify-center">
            <svg class="w-full h-full circular-meter" viewBox="0 0 240 240">
              <circle cx="120" cy="120" fill="none" r="98" stroke="#0e2b19" stroke-width="16"></circle>
              <circle id="ui-progress-circle" cx="120" cy="120" fill="none" r="98" 
                stroke="${style.meterStroke}" 
                stroke-dasharray="615.75" 
                stroke-dashoffset="${dashOffset}" 
                stroke-linecap="round" 
                stroke-width="16" 
                class="transition-all duration-300">
              </circle>
            </svg>

            <div class="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span id="ui-seconds" class="font-headline text-[76px] font-black text-primary tracking-tighter leading-none tabular-nums drop-shadow-md">
                ${remainingInStep}
              </span>
              <span class="text-on-surface-variant text-[11px] font-bold tracking-widest uppercase mt-1">
                SEGUNDOS
              </span>
            </div>
          </section>

          <!-- Next Interval Banner -->
          <section class="w-full my-2">
            <div class="w-full rounded-xl border border-outline-variant bg-surface-container py-2.5 px-4 flex items-center justify-between text-xs">
              <div class="flex items-center gap-2">
                <span class="material-symbols-outlined text-primary-container text-lg">fast_forward</span>
                <span class="text-on-surface-variant font-bold uppercase tracking-wider">SIGUIENTE:</span>
                <span id="ui-next-step" class="text-primary font-black uppercase">
                  ${nextStep ? `${nextStep.name} (${nextStep.duration}s)` : 'FINALIZAR ENTRENAMIENTO'}
                </span>
              </div>
            </div>
          </section>

          <!-- Sweat-proof Controls -->
          <section class="w-full flex flex-col gap-3 pb-4 safe-area-bottom">
            <div class="flex items-center justify-center gap-6">
              <button id="btn-step-prev" class="w-14 h-14 rounded-full bg-surface-container border border-outline-variant text-on-surface flex items-center justify-center hover:bg-surface-container-high active:scale-95 transition-all shadow-md" aria-label="Anterior">
                <span class="material-symbols-outlined text-[28px]">skip_previous</span>
              </button>

              <button id="btn-play-pause" class="w-22 h-22 p-5 rounded-full bg-primary-container text-on-primary flex items-center justify-center active:scale-95 transition-transform shadow-2xl ${style.glow}" aria-label="Pausar / Reanudar">
                <span class="material-symbols-outlined text-[44px]" style="font-variation-settings: 'FILL' 1;">pause</span>
              </button>

              <button id="btn-step-next" class="w-14 h-14 rounded-full bg-surface-container border border-outline-variant text-on-surface flex items-center justify-center hover:bg-surface-container-high active:scale-95 transition-all shadow-md" aria-label="Siguiente">
                <span class="material-symbols-outlined text-[28px]">skip_next</span>
              </button>
            </div>
          </section>

        </main>
      </div>
    `;

    container.innerHTML = html;
    attachLiveEvents();
  }

  function updateUI() {
    const step = steps[currentStepIdx];
    const nextStep = steps[currentStepIdx + 1] || null;
    const style = getStepStyle(step.type);

    const secElem = document.getElementById('ui-seconds');
    if (secElem) secElem.textContent = remainingInStep;

    const totalRemElem = document.getElementById('ui-total-rem');
    if (totalRemElem) totalRemElem.textContent = formatTime(getRemainingTotal());

    const cycleElem = document.getElementById('ui-cycle');
    if (cycleElem) cycleElem.textContent = `${step.cycle} / ${config.cycles}`;

    const setElem = document.getElementById('ui-set');
    if (setElem) setElem.textContent = `${step.set} / ${config.sets}`;

    const phaseBadge = document.getElementById('ui-phase-badge');
    if (phaseBadge) {
      phaseBadge.className = `inline-flex items-center gap-1.5 px-4 py-1 rounded-full border ${style.badgeBg} mb-2 shadow-sm`;
    }

    const phaseText = document.getElementById('ui-phase-text');
    if (phaseText) phaseText.textContent = step.type.toUpperCase();

    const exName = document.getElementById('ui-exercise-name');
    if (exName) {
      exName.textContent = step.name;
      exName.className = `font-headline text-2xl sm:text-3xl font-black tracking-tight uppercase leading-tight ${style.titleColor}`;
    }

    const nextElem = document.getElementById('ui-next-step');
    if (nextElem) {
      nextElem.textContent = nextStep ? `${nextStep.name} (${nextStep.duration}s)` : 'FINALIZAR ENTRENAMIENTO';
    }

    const circle = document.getElementById('ui-progress-circle');
    if (circle) {
      const progressFrac = 1 - (remainingInStep / step.duration);
      circle.setAttribute('stroke', style.meterStroke);
      circle.setAttribute('stroke-dashoffset', String(615.75 * (1 - progressFrac)));
    }
  }

  function attachLiveEvents() {
    document.getElementById('btn-play-pause')?.addEventListener('click', togglePlayPause);
    document.getElementById('btn-step-next')?.addEventListener('click', skipNext);
    document.getElementById('btn-step-prev')?.addEventListener('click', skipPrev);

    document.getElementById('btn-toggle-audio')?.addEventListener('click', () => {
      hapticTap();
      settings.soundEnabled = !settings.soundEnabled;
      storage.saveSettings(settings);
      audio.setSoundEnabled(settings.soundEnabled);
      const icon = document.getElementById('audio-icon');
      if (icon) icon.textContent = settings.soundEnabled ? 'volume_up' : 'volume_off';
    });

    document.getElementById('btn-exit')?.addEventListener('click', () => {
      hapticTap();
      if (confirm('¿Deseas salir del entrenamiento actual?')) {
        if (timerTimeoutId) clearTimeout(timerTimeoutId);
        releaseWakeLock();
        navigate('tabata-config', { preset: config, returnTo: params && params.returnTo ? params.returnTo : 'home' });
      }
    });
  }

  renderView();
  startTimer();
}
