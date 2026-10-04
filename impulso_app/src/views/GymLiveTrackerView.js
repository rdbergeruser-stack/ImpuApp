import { storage } from '../store/storage.js';
import { formatTime, formatKg } from '../utils/formatters.js';
import { audio } from '../audio/audioService.js';
import { hapticTap, hapticSuccess } from '../utils/haptics.js';
import { requestWakeLock, releaseWakeLock } from '../utils/wakeLock.js';
import { setHtmlPreservingScroll } from '../utils/dom.js';

export function renderGymLiveTracker(container, navigate, params = {}) {
  const routine = params.routine || storage.getGymRoutines()[0];
  const exercises = routine.exercises;

  // Normalizar ejercicios existentes para compatibilidad total con N ejercicios en súper series
  function normalizeExercise(ex) {
    if (ex.isSuperset) {
      if (!Array.isArray(ex.subExercises) || ex.subExercises.length === 0) {
        ex.subExercises = [
          {
            id: (ex.id || 'ex') + '-sub-1',
            name: ex.name || 'Primer Ejercicio',
            defaultWeight: typeof ex.defaultWeight === 'number' ? ex.defaultWeight : 40,
            targetReps: ex.targetReps || '10'
          },
          {
            id: (ex.id || 'ex') + '-sub-2',
            name: ex.supersetName || 'Segundo Ejercicio',
            defaultWeight: typeof ex.supersetWeight === 'number' ? ex.supersetWeight : 16,
            targetReps: ex.supersetReps || '12'
          }
        ];
      }
    }
    return ex;
  }
  exercises.forEach(normalizeExercise);

  // Session State
  let currentExIdx = 0;
  let workoutElapsedSeconds = 0;
  let workoutTimerInterval = null;

  // Key: ex.id -> Array of completed sets
  const completedSets = {};
  exercises.forEach(e => {
    completedSets[e.id] = [];
  });

  // Interactive state for current active block
  // Single exercise values
  let currentSingleWeight = exercises[0].defaultWeight || 50;
  let currentSingleReps = parseInt(exercises[0].targetReps) || 10;

  // N-exercise Superset values: array of { weight, reps }
  let currentSupersetValues = [];

  function updateActiveValuesForCurrentEx() {
    const curEx = exercises[currentExIdx];
    if (curEx.isSuperset) {
      currentSupersetValues = curEx.subExercises.map(sub => ({
        weight: typeof sub.defaultWeight === 'number' ? sub.defaultWeight : 20,
        reps: parseInt(sub.targetReps) || 10
      }));
    } else {
      currentSingleWeight = typeof curEx.defaultWeight === 'number' ? curEx.defaultWeight : 50;
      currentSingleReps = parseInt(curEx.targetReps) || 10;
    }
  }
  updateActiveValuesForCurrentEx();

  // Rest Timer State
  let isResting = false;
  let restRemaining = 0;
  let restTotal = 0;
  let restTimeoutId = null;
  let nextExpectedRestTick = 0;
  let restWasLastSet = false;
  let restTargetEndTime = 0;
  let workoutStartTime = Date.now();

  // WakeLock
  requestWakeLock();

  // Background/Foreground synchronization
  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      // Sincronizar cronómetro transcurrido de rutina
      workoutElapsedSeconds = Math.max(workoutElapsedSeconds, Math.floor((Date.now() - workoutStartTime) / 1000));
      const timerElem = document.getElementById('ui-gym-elapsed');
      if (timerElem) timerElem.textContent = formatTime(workoutElapsedSeconds);

      // Sincronizar temporizador de descanso
      if (isResting && restTargetEndTime > 0) {
        const remaining = Math.max(0, Math.round((restTargetEndTime - Date.now()) / 1000));
        restRemaining = remaining;
        updateRestUI();
        if (restRemaining <= 0) {
          restTick();
        }
      }
    }
  };
  document.addEventListener('visibilitychange', handleVisibilityChange);

  const handleNativeRestCompleted = () => {
    if (isResting) {
      restRemaining = 0;
      restTick();
    }
  };
  window.addEventListener('nativeRestCompleted', handleNativeRestCompleted);

  // Voice announcement on initial load
  setTimeout(() => {
    announceCurrentExercise();
  }, 400);

  // Start workout elapsed chronometer
  workoutTimerInterval = setInterval(() => {
    workoutElapsedSeconds++;
    const timerElem = document.getElementById('ui-gym-elapsed');
    if (timerElem) timerElem.textContent = formatTime(workoutElapsedSeconds);
  }, 1000);

  function announceCurrentExercise() {
    const curEx = exercises[currentExIdx];
    const setNum = (completedSets[curEx.id]?.length || 0) + 1;
    if (curEx.isSuperset) {
      const count = curEx.subExercises.length;
      const names = curEx.subExercises.map(s => s.name).join(', seguido de ');
      audio.speak(`Súper Serie de ${count} ejercicios: ${names}. Serie ${setNum}`);
    } else {
      audio.speak(`Ejercicio: ${curEx.name}. Serie ${setNum}`);
    }
  }

  function scheduleNextRestTick() {
    if (!isResting) return;
    const now = Date.now();
    const delay = Math.max(0, nextExpectedRestTick - now);
    restTimeoutId = setTimeout(() => {
      if (!isResting) return;
      nextExpectedRestTick += 1000;
      restTick();
      scheduleNextRestTick();
    }, delay);
  }

  function restTick() {
    restRemaining--;
    // 1. Sincronización visual inmediata a los 0ms del segundo
    updateRestUI();

    // 2. Pre-calentar canal de audio a los 4s y conteo preciso 3-2-1
    if (restRemaining === 4) {
      audio.prewarm();
    } else if (restRemaining === 3) {
      audio.playCountdown();
      audio.speak('Tres', { rate: 1.25 });
    } else if (restRemaining === 2) {
      audio.playCountdown();
      audio.speak('Dos', { rate: 1.25 });
    } else if (restRemaining === 1) {
      audio.playCountdown();
      audio.speak('Uno', { rate: 1.25 });
    }

    if (restRemaining <= 0) {
      if (restTimeoutId) clearTimeout(restTimeoutId);
      isResting = false;
      if (typeof window !== 'undefined' && window.ReactNativeWebView) {
        try {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'REST_TIMER_CANCEL' }));
        } catch (e) {}
      }
      audio.playRestComplete();
      if (restWasLastSet) {
        if (currentExIdx < exercises.length - 1) {
          nextExercise();
          return;
        } else {
          finishGymWorkout();
          return;
        }
      } else {
        audio.speak('¡Descanso terminado! Siguiente serie.');
        render();
        return;
      }
    }
  }

  function startRestTimer(seconds, wasLastSet = false) {
    isResting = true;
    restTotal = seconds;
    restRemaining = seconds;
    restWasLastSet = wasLastSet;
    restTargetEndTime = Date.now() + (seconds * 1000);

    if (restTimeoutId) clearTimeout(restTimeoutId);
    nextExpectedRestTick = Date.now() + 1000;
    scheduleNextRestTick();

    if (typeof window !== 'undefined' && window.ReactNativeWebView) {
      try {
        const curEx = exercises[currentExIdx];
        const nextName = wasLastSet ? (currentExIdx < exercises.length - 1 ? exercises[currentExIdx + 1]?.name : 'Fin de rutina') : curEx?.name;
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'REST_TIMER_START',
          seconds: seconds,
          title: '⏰ ¡Descanso Terminado!',
          body: wasLastSet
            ? (currentExIdx < exercises.length - 1 ? `Siguiente ejercicio: ${nextName}` : '¡Último descanso concluido! Finaliza tu rutina.')
            : `Descanso finalizado. ¡A por la siguiente serie de ${curEx?.name || 'Gimnasio'}!`
        }));
      } catch (e) {}
    }

    render();
  }

  function skipRest() {
    hapticTap();
    if (restTimeoutId) clearTimeout(restTimeoutId);
    isResting = false;
    if (typeof window !== 'undefined' && window.ReactNativeWebView) {
      try {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'REST_TIMER_CANCEL' }));
      } catch (e) {}
    }
    const curEx = exercises[currentExIdx];
    const isExerciseDone = (completedSets[curEx.id]?.length || 0) >= curEx.targetSets;
    if (isExerciseDone || restWasLastSet) {
      if (currentExIdx < exercises.length - 1) {
        nextExercise();
        return;
      } else {
        finishGymWorkout();
        return;
      }
    }
    render();
  }

  function addRestTime(delta) {
    hapticTap();
    restRemaining = Math.max(0, restRemaining + delta);
    restTotal = Math.max(restRemaining, restTotal + delta);
    restTargetEndTime = Date.now() + (restRemaining * 1000);
    nextExpectedRestTick = Date.now() + 1000;

    if (typeof window !== 'undefined' && window.ReactNativeWebView) {
      try {
        const curEx = exercises[currentExIdx];
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'REST_TIMER_START',
          seconds: restRemaining,
          title: '⏰ ¡Descanso Terminado!',
          body: `Descanso finalizado. ¡Siguiente serie de ${curEx?.name || 'Gimnasio'}!`
        }));
      } catch (e) {}
    }

    updateRestUI();
  }

  function logActiveSet() {
    hapticSuccess();
    const curEx = exercises[currentExIdx];
    const setNum = (completedSets[curEx.id]?.length || 0) + 1;
    const isLastSetOfExercise = setNum >= curEx.targetSets;
    const isLastExerciseOfRoutine = currentExIdx === exercises.length - 1;

    if (curEx.isSuperset) {
      completedSets[curEx.id].push({
        setNumber: setNum,
        isSuperset: true,
        subExercises: curEx.subExercises.map((sub, idx) => ({
          name: sub.name,
          weight: currentSupersetValues[idx]?.weight || 0,
          reps: currentSupersetValues[idx]?.reps || 0
        })),
        completedAt: new Date().toISOString()
      });
      audio.playSetLogged();
      if (isLastSetOfExercise) {
        if (!isLastExerciseOfRoutine) {
          const nextEx = exercises[currentExIdx + 1];
          audio.speak(`¡Súper Serie ${setNum} completada! Todas las series listas. Descanso antes de ${nextEx.name}.`);
        } else {
          audio.speak(`¡Súper Serie final completada! Todas las series de la rutina listas.`);
        }
      } else {
        audio.speak(`Súper Serie ${setNum} registrada`);
      }
    } else {
      completedSets[curEx.id].push({
        setNumber: setNum,
        isSuperset: false,
        weight: currentSingleWeight,
        reps: currentSingleReps,
        completedAt: new Date().toISOString()
      });
      audio.playSetLogged();
      if (isLastSetOfExercise) {
        if (!isLastExerciseOfRoutine) {
          const nextEx = exercises[currentExIdx + 1];
          audio.speak(`¡Serie ${setNum} completada! Todas las series listas. Descanso antes de ${nextEx.name}.`);
        } else {
          audio.speak(`¡Última serie del entrenamiento completada! Excelente trabajo.`);
        }
      } else {
        audio.speak(`Serie ${setNum} registrada`);
      }
    }

    // Launch automated rest countdown (passing flag if this was the final set of the exercise)
    const restSeconds = curEx.restSeconds || 90;
    startRestTimer(restSeconds, isLastSetOfExercise);
  }

  function nextExercise() {
    hapticTap();
    if (currentExIdx < exercises.length - 1) {
      currentExIdx++;
      updateActiveValuesForCurrentEx();
      render();
      announceCurrentExercise();
    }
  }

  function prevExercise() {
    hapticTap();
    if (currentExIdx > 0) {
      currentExIdx--;
      updateActiveValuesForCurrentEx();
      render();
      announceCurrentExercise();
    }
  }

  function finishGymWorkout() {
    clearInterval(workoutTimerInterval);
    if (restTimeoutId) clearTimeout(restTimeoutId);
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    window.removeEventListener('nativeRestCompleted', handleNativeRestCompleted);
    if (typeof window !== 'undefined' && window.ReactNativeWebView) {
      try { window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'REST_TIMER_CANCEL' })); } catch (e) {}
    }
    releaseWakeLock();

    // Calculate totals across all exercises and supersets
    let totalVolume = 0;
    let totalSetsLogged = 0;

    Object.values(completedSets).forEach(sets => {
      sets.forEach(s => {
        if (s.isSuperset && Array.isArray(s.subExercises)) {
          s.subExercises.forEach(sub => {
            totalVolume += ((sub.weight || 0) * (sub.reps || 0));
          });
        } else if (s.isSuperset && s.weightB) {
          totalVolume += ((s.weight || 0) * (s.reps || 0)) + ((s.weightB || 0) * (s.repsB || 0));
        } else {
          totalVolume += ((s.weight || 0) * (s.reps || 0));
        }
        totalSetsLogged++;
      });
    });

    audio.playFanfare();
    audio.speak('¡Entrenamiento de gimnasio concluido! Excelente congestión muscular.');

    const summaryData = {
      type: 'gym',
      routineName: routine.title,
      durationSeconds: workoutElapsedSeconds,
      caloriesEst: Math.round((workoutElapsedSeconds / 60) * 8.5),
      totalVolumeKg: totalVolume,
      totalSets: totalSetsLogged,
      summary: `Completadas ${totalSetsLogged} series en ${exercises.length} bloques con un volumen de ${formatKg(totalVolume)}.`
    };

    navigate('summary', { workout: summaryData });
  }

  function updateRestUI() {
    const timeElem = document.getElementById('ui-rest-time');
    if (timeElem) timeElem.textContent = formatTime(restRemaining);

    const circle = document.getElementById('ui-rest-circle');
    if (circle && restTotal > 0) {
      const frac = 1 - (restRemaining / restTotal);
      circle.setAttribute('stroke-dashoffset', String(377 * (1 - frac)));
    }
  }

  function render() {
    const curEx = exercises[currentExIdx];
    const setsLogged = completedSets[curEx.id] || [];
    const currentSetNum = setsLogged.length + 1;
    const isExerciseDone = setsLogged.length >= curEx.targetSets;

    const html = `
      <div class="w-full h-full flex flex-col overflow-hidden bg-background select-none">
        
        <!-- Header -->
        <header class="w-full bg-surface border-b border-outline-variant px-4 h-16 flex items-center justify-between shrink-0 safe-area-top">
          <div class="flex items-center gap-3">
            <button id="btn-gym-exit" class="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center text-on-surface hover:text-error active:scale-95 transition-all" aria-label="Salir">
              <span class="material-symbols-outlined text-[20px]">close</span>
            </button>
            <div>
              <span class="font-montserrat text-sm font-black text-white uppercase block leading-tight truncate max-w-[180px]">ImpuApp</span>
              <span class="text-[10px] text-primary-container font-black uppercase tracking-widest font-headline">
                ${routine.title} • BLOQUE ${currentExIdx + 1} DE ${exercises.length} ${curEx.isSuperset ? '• SÚPER SERIE' : ''}
              </span>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <div class="flex items-center gap-1.5 bg-surface-container-high border border-outline-variant px-3 py-1.5 rounded-xl">
              <span class="material-symbols-outlined text-xs text-primary-container">timer</span>
              <span id="ui-gym-elapsed" class="font-headline text-xs font-black text-primary tabular-nums">
                ${formatTime(workoutElapsedSeconds)}
              </span>
            </div>
          </div>
        </header>

        <!-- Main Content -->
        <main class="w-full flex-1 min-h-0 px-4 py-3 overflow-y-auto no-scrollbar max-w-md mx-auto flex flex-col gap-3.5 pb-6">
          
          <!-- Current Exercise Banner (shrink-0) -->
          <section class="bg-surface-container rounded-2xl p-4 border border-outline-variant flex items-center justify-between shadow-sm shrink-0 w-full">
            <div>
              <div class="flex items-center gap-1.5 mb-0.5">
                ${curEx.isSuperset ? `
                  <span class="px-2 py-0.5 rounded bg-primary-container text-on-primary-container text-[9px] font-headline font-black uppercase flex items-center gap-0.5 shadow-sm">
                    <span class="material-symbols-outlined text-xs">bolt</span>
                    <span>SÚPER SERIE (${curEx.subExercises.length} EJERCICIOS)</span>
                  </span>
                ` : `
                  <span class="text-[10px] text-primary-container font-black uppercase tracking-widest font-headline">
                    ${curEx.muscle || 'MÚSCULO'}
                  </span>
                `}
              </div>

              <h2 class="font-headline text-xl font-black uppercase text-on-surface tracking-tight leading-tight">
                ${curEx.isSuperset ? (curEx.name || curEx.subExercises[0]?.name) : curEx.name}
              </h2>

              ${curEx.isSuperset && curEx.subExercises.length > 1 ? `
                <div class="flex flex-col gap-0.5 mt-1 text-xs text-secondary font-bold">
                  ${curEx.subExercises.slice(1).map((sub, i) => `
                    <div class="flex items-center gap-1">
                      <span class="material-symbols-outlined text-sm">sync_alt</span>
                      <span>+ ${sub.name}</span>
                    </div>
                  `).join('')}
                </div>
              ` : ''}
            </div>

            <div class="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-surface-container-high border border-outline-variant text-[11px] font-bold text-primary-container shrink-0">
              <span class="material-symbols-outlined text-sm">snooze</span>
              <span>${curEx.restSeconds || 90}s desc.</span>
            </div>
          </section>

          <!-- Active Set Interactive Card: Ventana fija con shrink-0 que NUNCA se achica -->
          <section class="bg-surface-container rounded-2xl border-2 ${curEx.isSuperset ? 'border-primary-container' : 'border-primary-container/80'} p-4 relative overflow-hidden neon-border-glow shadow-xl shrink-0 w-full">
            <!-- Set Progress Indicator Badge -->
            <div class="flex items-center justify-between pb-3 border-b border-outline-variant/40 shrink-0">
              <div class="flex items-center gap-2">
                <span class="px-2.5 py-1 rounded bg-primary-container text-on-primary font-headline font-black text-xs uppercase tracking-wide">
                  ${curEx.isSuperset ? 'Súper Serie' : 'Serie'} ${currentSetNum} / ${curEx.targetSets}
                </span>
                <span class="text-xs font-bold uppercase tracking-wider text-primary-dim">
                  ${isExerciseDone ? 'Objetivo alcanzado' : 'En curso'}
                </span>
              </div>
              <span class="text-xs text-on-surface-variant font-bold">
                ${curEx.isSuperset ? `${curEx.subExercises.length} ejercicios combinados` : `Meta: ${curEx.targetReps} reps`}
              </span>
            </div>

            ${curEx.isSuperset ? `
              <!-- N-EXERCISE SUPERSET INTERACTIVE CONTROLS -->
              <div class="flex flex-col gap-2.5 mt-3 shrink-0">
                ${curEx.subExercises.map((sub, sIdx) => {
                  const vals = currentSupersetValues[sIdx] || { weight: sub.defaultWeight || 20, reps: 10 };
                  return `
                    <div class="p-3 bg-surface-container-high/60 rounded-xl border border-primary-container/40 shrink-0">
                      <div class="flex items-center justify-between mb-2">
                        <span class="text-[10px] font-headline font-black uppercase text-primary flex items-center gap-1.5">
                          <span class="w-4 h-4 rounded-full bg-primary-container text-on-primary-container text-[9px] font-black flex items-center justify-center">${sIdx + 1}</span>
                          <span class="truncate max-w-[200px]">${sub.name}</span>
                        </span>
                        <span class="text-[9px] text-on-surface-variant font-bold">Meta: ${sub.targetReps} reps</span>
                      </div>

                      <div class="grid grid-cols-2 gap-2">
                        <!-- Weight -->
                        <div class="bg-surface-container-low p-2 rounded-lg border border-outline-variant text-center shrink-0">
                          <span class="text-[9px] font-bold text-on-surface-variant uppercase block">Carga</span>
                          <div id="ui-super-weight-${sIdx}" class="font-headline font-black text-2xl text-primary tabular-nums leading-tight">
                            ${vals.weight}<span class="text-xs font-sans text-primary-container ml-0.5">kg</span>
                          </div>
                          <div class="grid grid-cols-4 gap-0.5 mt-1">
                            <button data-action="super-weight" data-sub-idx="${sIdx}" data-delta="-2.5" class="btn-adjust h-7 rounded bg-surface-container border border-outline-variant/60 text-[8px] font-black active:scale-90">-2.5</button>
                            <button data-action="super-weight" data-sub-idx="${sIdx}" data-delta="-0.5" class="btn-adjust h-7 rounded bg-surface-container border border-outline-variant/60 text-[9px] font-black text-primary-container active:scale-90">-0.5</button>
                            <button data-action="super-weight" data-sub-idx="${sIdx}" data-delta="0.5" class="btn-adjust h-7 rounded bg-surface-container border border-outline-variant/60 text-[9px] font-black text-primary-container active:scale-90">+0.5</button>
                            <button data-action="super-weight" data-sub-idx="${sIdx}" data-delta="2.5" class="btn-adjust h-7 rounded bg-surface-container border border-outline-variant/60 text-[8px] font-black active:scale-90">+2.5</button>
                          </div>
                        </div>

                        <!-- Reps -->
                        <div class="bg-surface-container-low p-2 rounded-lg border border-outline-variant text-center shrink-0">
                          <span class="text-[9px] font-bold text-on-surface-variant uppercase block">Reps</span>
                          <div id="ui-super-reps-${sIdx}" class="font-headline font-black text-2xl text-primary tabular-nums leading-tight">
                            ${vals.reps}<span class="text-xs font-sans text-primary-container ml-0.5">reps</span>
                          </div>
                          <div class="flex justify-center gap-1 mt-1">
                            <button data-action="super-reps" data-sub-idx="${sIdx}" data-delta="-1" class="btn-adjust w-7 h-7 rounded bg-surface-container border text-[10px] font-black active:scale-90">-</button>
                            <button data-action="super-reps" data-sub-idx="${sIdx}" data-delta="1" class="btn-adjust w-7 h-7 rounded bg-surface-container border text-[10px] font-black text-primary-container active:scale-90">+</button>
                          </div>
                        </div>
                      </div>
                    </div>

                    ${sIdx < curEx.subExercises.length - 1 ? `
                      <div class="flex items-center justify-center -my-1 text-primary-container shrink-0">
                        <span class="px-2.5 py-0.5 rounded-full bg-surface-bright border border-primary-container/40 text-[9px] font-headline font-black uppercase flex items-center gap-1 shadow-sm">
                          <span class="material-symbols-outlined text-[13px]">sync_alt</span>
                          <span>SEGUIDO SIN PAUSA POR</span>
                        </span>
                      </div>
                    ` : ''}
                  `;
                }).join('')}
              </div>
            ` : `
              <!-- SINGLE EXERCISE TOUCH CONTROLS (TAMAÑO FIJO QUE NUNCA SE ACHICA) -->
              <div class="grid grid-cols-2 gap-3 mt-3 shrink-0">
                <!-- Weight Adjuster (min-h-[160px] shrink-0) -->
                <div class="bg-surface-container-low rounded-xl p-3 border border-outline-variant flex flex-col justify-between min-h-[160px] shrink-0">
                  <div class="flex items-center justify-between shrink-0">
                    <span class="text-[10px] font-bold tracking-wider uppercase text-on-surface-variant">CARGA (KG)</span>
                    <span class="text-[9px] text-primary-container bg-surface-container-high px-1.5 py-0.5 rounded font-mono font-bold">+ BARRA</span>
                  </div>

                  <div class="text-center my-2 shrink-0">
                    <div id="ui-single-weight" class="font-headline font-black text-3xl text-primary tracking-tight leading-none tabular-nums">
                      ${currentSingleWeight}<span class="text-sm text-primary-container font-sans font-bold ml-1">kg</span>
                    </div>
                  </div>

                  <div class="grid grid-cols-4 gap-1 shrink-0">
                    <button data-action="single-weight" data-delta="-2.5" class="btn-adjust h-9 rounded-lg bg-surface-container-high border border-outline-variant active:border-primary-container text-on-surface text-[10px] font-headline font-black flex items-center justify-center active:scale-95">-2.5</button>
                    <button data-action="single-weight" data-delta="-0.5" class="btn-adjust h-9 rounded-lg bg-surface-container-high border border-outline-variant active:border-primary-container text-primary-container text-xs font-headline font-black flex items-center justify-center active:scale-95">-0.5</button>
                    <button data-action="single-weight" data-delta="0.5" class="btn-adjust h-9 rounded-lg bg-surface-container-high border border-outline-variant active:border-primary-container text-primary-container text-xs font-headline font-black flex items-center justify-center active:scale-95">+0.5</button>
                    <button data-action="single-weight" data-delta="2.5" class="btn-adjust h-9 rounded-lg bg-surface-container-high border border-outline-variant active:border-primary-container text-on-surface text-[10px] font-headline font-black flex items-center justify-center active:scale-95">+2.5</button>
                  </div>
                </div>

                <!-- Reps Adjuster (min-h-[160px] shrink-0) -->
                <div class="bg-surface-container-low rounded-xl p-3 border border-outline-variant flex flex-col justify-between min-h-[160px] shrink-0">
                  <div class="flex items-center justify-between shrink-0">
                    <span class="text-[10px] font-bold tracking-wider uppercase text-on-surface-variant">REPETICIONES</span>
                    <span class="text-[9px] text-outline font-mono">Realizadas</span>
                  </div>

                  <div class="text-center my-2 shrink-0">
                    <div id="ui-single-reps" class="font-headline font-black text-3xl text-primary tracking-tight leading-none tabular-nums">
                      ${currentSingleReps}<span class="text-sm text-primary-container font-sans font-bold ml-1">reps</span>
                    </div>
                  </div>

                  <div class="grid grid-cols-2 gap-1.5 shrink-0">
                    <button data-action="single-reps" data-delta="-1" class="btn-adjust h-9 rounded-lg bg-surface-container-high border border-outline-variant active:border-primary-container text-on-surface text-sm font-headline font-black flex items-center justify-center active:scale-95">-1</button>
                    <button data-action="single-reps" data-delta="1" class="btn-adjust h-9 rounded-lg bg-surface-container-high border border-outline-variant active:border-primary-container text-on-surface text-sm font-headline font-black flex items-center justify-center active:scale-95">+1</button>
                  </div>
                </div>
              </div>
            `}
          </section>

          <!-- Completed Sets Table for this Exercise (shrink-0) -->
          <section class="bg-surface-container rounded-2xl border border-outline-variant p-3.5 flex flex-col gap-2 shrink-0 w-full">
            <div class="flex items-center justify-between pb-1">
              <span class="text-[10px] font-headline font-bold text-on-surface-variant uppercase tracking-wider">SERIES COMPLETADAS</span>
              <span class="text-xs text-primary-container font-bold">${setsLogged.length} / ${curEx.targetSets}</span>
            </div>

            ${setsLogged.length === 0 ? `
              <p class="text-xs text-on-surface-variant italic py-2 text-center">Aún no hay series registradas para este bloque.</p>
            ` : `
              <div class="flex flex-col gap-2">
                ${setsLogged.map(s => `
                  <div class="p-2.5 rounded-xl bg-surface-container-low border border-outline-variant/40 text-xs flex flex-col gap-1">
                    <div class="flex items-center justify-between pb-1 border-b border-outline-variant/20">
                      <div class="flex items-center gap-1.5">
                        <span class="w-5 h-5 rounded-md bg-surface-bright text-primary-container font-headline font-black text-[10px] flex items-center justify-center">
                          ${s.setNumber}
                        </span>
                        <span class="font-headline font-black text-[10px] uppercase text-primary-container">
                          ${s.isSuperset ? `SÚPER SERIE (${s.subExercises ? s.subExercises.length : 2} EJERCICIOS)` : 'SERIE INDIVIDUAL'}
                        </span>
                      </div>
                      <div class="flex items-center gap-1 text-primary-container font-bold text-[10px]">
                        <span class="material-symbols-outlined text-xs">check</span>
                        <span>COMPLETADA</span>
                      </div>
                    </div>

                    ${s.isSuperset && Array.isArray(s.subExercises) ? `
                      <div class="flex flex-col gap-1 pt-0.5">
                        ${s.subExercises.map((sub, i) => `
                          <div class="flex items-center justify-between text-on-surface pl-2 border-l-2 border-primary-container/50">
                            <span class="font-medium text-xs truncate max-w-[190px]">${i + 1}. ${sub.name}</span>
                            <span class="font-headline font-black text-xs text-primary tabular-nums">${sub.weight} kg × ${sub.reps} reps</span>
                          </div>
                        `).join('')}
                      </div>
                    ` : s.isSuperset ? `
                      <div class="flex flex-col gap-1 pt-0.5">
                        <div class="flex items-center justify-between text-on-surface pl-2 border-l-2 border-primary-container/50">
                          <span class="font-medium text-xs">1. Principal</span>
                          <span class="font-headline font-black text-xs text-primary tabular-nums">${s.weight} kg × ${s.reps} reps</span>
                        </div>
                        <div class="flex items-center justify-between text-on-surface pl-2 border-l-2 border-primary-container/50">
                          <span class="font-medium text-xs">2. Súper Serie</span>
                          <span class="font-headline font-black text-xs text-primary tabular-nums">${s.weightB || 0} kg × ${s.repsB || 0} reps</span>
                        </div>
                      </div>
                    ` : `
                      <div class="flex items-center justify-between text-on-surface pt-0.5">
                        <span class="font-medium text-xs">${curEx.name}</span>
                        <span class="font-headline font-black text-xs text-primary tabular-nums">${s.weight} kg × ${s.reps} reps</span>
                      </div>
                    `}
                  </div>
                `).join('')}
              </div>
            `}
          </section>

          <!-- Navigation between Exercises (shrink-0) -->
          <section class="flex items-center gap-2 pt-1 shrink-0 w-full">
            <button id="btn-prev-ex" class="flex-1 h-12 rounded-xl bg-surface-container border border-outline-variant text-on-surface font-headline text-xs font-black uppercase flex items-center justify-center gap-1 active:scale-95 transition-all ${currentExIdx === 0 ? 'opacity-40 cursor-not-allowed' : ''}">
              <span class="material-symbols-outlined text-base">chevron_left</span>
              <span>ANTERIOR</span>
            </button>

            <button id="btn-next-ex" class="flex-1 h-12 rounded-xl bg-surface-container border border-outline-variant text-primary-container font-headline text-xs font-black uppercase flex items-center justify-center gap-1 active:scale-95 transition-all ${currentExIdx === exercises.length - 1 ? 'opacity-40 cursor-not-allowed' : ''}">
              <span>SIGUIENTE</span>
              <span class="material-symbols-outlined text-base">chevron_right</span>
            </button>
          </section>

          <!-- Finalize Entire Workout CTA (shrink-0) -->
          <button id="btn-finish-gym" class="w-full h-12 rounded-xl bg-surface-container-high border border-outline-variant hover:border-error text-error font-headline text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 active:scale-95 transition-all mt-1 shrink-0">
            <span class="material-symbols-outlined text-base">stop_circle</span>
            <span>FINALIZAR ENTRENAMIENTO COMPLETO</span>
          </button>

        </main>

        <!-- Fixed Bottom Action Bar: Button is ALWAYS pinned and NEVER gets hidden -->
        <footer class="w-full shrink-0 bg-surface/95 backdrop-blur border-t border-outline-variant px-4 py-3 safe-area-bottom max-w-md mx-auto z-40">
          <button id="btn-log-set" class="w-full h-14 rounded-2xl bg-primary-container text-on-primary font-headline text-sm font-black uppercase tracking-wider flex items-center justify-center gap-2 glow-work active:scale-[0.98] transition-transform shadow-xl">
            <span class="material-symbols-outlined text-[24px]" style="font-variation-settings: 'FILL' 1;">
              ${isExerciseDone ? 'arrow_forward' : 'check_circle'}
            </span>
            <span>
              ${isExerciseDone 
                ? (currentExIdx < exercises.length - 1 ? `PASAR A: ${exercises[currentExIdx + 1].name}` : 'FINALIZAR ENTRENAMIENTO')
                : (curEx.isSuperset ? `REGISTRAR SÚPER SERIE ${currentSetNum} / ${curEx.targetSets}` : `REGISTRAR SERIE ${currentSetNum} / ${curEx.targetSets}`)}
            </span>
          </button>
        </footer>

        <!-- Automated Rest Stopwatch Modal / Overlay -->
        ${isResting ? `
          <div class="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center p-6 animate-fade-in">
            <div class="w-full max-w-sm bg-surface-container border-2 border-primary-container rounded-3xl p-6 flex flex-col items-center shadow-2xl relative overflow-hidden text-center glow-primary">
              <span class="text-[11px] font-headline font-black text-primary-container uppercase tracking-widest mb-1">
                ${isExerciseDone ? (currentExIdx < exercises.length - 1 ? 'CAMBIO DE EJERCICIO' : 'FINALIZANDO RUTINA') : 'TIEMPO DE RECUPERACIÓN'}
              </span>
              <h3 class="font-headline text-lg font-black text-on-surface uppercase tracking-tight">
                ${isExerciseDone ? (currentExIdx < exercises.length - 1 ? 'DESCANSO PREVIO AL SIGUIENTE' : 'DESCANSO FINAL') : (curEx.isSuperset ? 'DESCANSO POST SÚPER SERIE' : 'DESCANSO ENTRE SERIES')}
              </h3>
              ${isExerciseDone && currentExIdx < exercises.length - 1 ? `
                <div class="mt-1.5 px-3 py-1 rounded-xl bg-surface-container-high border border-primary-container/60 text-xs font-headline font-black text-primary uppercase truncate max-w-[260px]">
                  Siguiente: ${exercises[currentExIdx + 1].name}
                </div>
              ` : ''}

              <!-- Circular Progress -->
              <div class="relative w-44 h-44 flex items-center justify-center my-4">
                <svg class="w-full h-full circular-meter" viewBox="0 0 140 140">
                  <circle cx="70" cy="70" fill="none" r="60" stroke="#0e2b19" stroke-width="10"></circle>
                  <circle id="ui-rest-circle" cx="70" cy="70" fill="none" r="60" 
                    stroke="#00ff66" 
                    stroke-dasharray="377" 
                    stroke-dashoffset="${377 * (1 - (restRemaining / restTotal))}" 
                    stroke-linecap="round" 
                    stroke-width="10" 
                    class="transition-all duration-1000">
                  </circle>
                </svg>
                <div class="absolute inset-0 flex flex-col items-center justify-center">
                  <span id="ui-rest-time" class="font-headline text-4xl font-black text-primary tabular-nums">
                    ${formatTime(restRemaining)}
                  </span>
                  <span class="text-[10px] text-on-surface-variant uppercase font-bold tracking-wider mt-0.5">RESTANTES</span>
                </div>
              </div>

              <!-- Quick Time Adjusters -->
              <div class="flex items-center gap-2 mb-4 w-full">
                <button id="btn-rest-minus" class="flex-1 h-10 rounded-xl bg-surface-container-high border border-outline-variant text-xs font-headline font-black text-on-surface active:scale-95">
                  -15s
                </button>
                <button id="btn-rest-plus" class="flex-1 h-10 rounded-xl bg-surface-container-high border border-outline-variant text-xs font-headline font-black text-primary-container active:scale-95">
                  +30s
                </button>
              </div>

              <!-- Skip Rest Button -->
              <button id="btn-skip-rest" class="w-full h-12 rounded-xl bg-primary-container text-on-primary font-headline text-xs font-black uppercase tracking-wider active:scale-95 transition-transform shadow-md">
                ${isExerciseDone ? (currentExIdx < exercises.length - 1 ? 'PASAR AL SIGUIENTE EJERCICIO' : 'FINALIZAR ENTRENAMIENTO YA') : 'SALTAR DESCANSO & EMPEZAR'}
              </button>
            </div>
          </div>
        ` : ''}

      </div>
    `;

    setHtmlPreservingScroll(container, html);
    attachGymEvents();
  }

  function attachGymEvents() {
    // Touch Adjusters for Single and N-Exercise Superset - In-place DOM update prevents scroll jump
    container.querySelectorAll('.btn-adjust').forEach(btn => {
      btn.addEventListener('click', () => {
        hapticTap();
        const action = btn.getAttribute('data-action');
        const delta = parseFloat(btn.getAttribute('data-delta'));

        if (action === 'single-weight') {
          currentSingleWeight = Math.max(0, Math.min(500, Math.round((currentSingleWeight + delta) * 10) / 10));
          const el = document.getElementById('ui-single-weight');
          if (el) el.innerHTML = `${currentSingleWeight}<span class="text-sm text-primary-container font-sans font-bold ml-1">kg</span>`;
        } else if (action === 'single-reps') {
          currentSingleReps = Math.max(1, Math.min(100, currentSingleReps + delta));
          const el = document.getElementById('ui-single-reps');
          if (el) el.innerHTML = `${currentSingleReps}<span class="text-sm text-primary-container font-sans font-bold ml-1">reps</span>`;
        } else if (action === 'super-weight') {
          const sIdx = parseInt(btn.getAttribute('data-sub-idx'));
          if (currentSupersetValues[sIdx]) {
            currentSupersetValues[sIdx].weight = Math.max(0, Math.min(500, Math.round((currentSupersetValues[sIdx].weight + delta) * 10) / 10));
            const el = document.getElementById(`ui-super-weight-${sIdx}`);
            if (el) el.innerHTML = `${currentSupersetValues[sIdx].weight}<span class="text-xs font-sans text-primary-container ml-0.5">kg</span>`;
          }
        } else if (action === 'super-reps') {
          const sIdx = parseInt(btn.getAttribute('data-sub-idx'));
          if (currentSupersetValues[sIdx]) {
            currentSupersetValues[sIdx].reps = Math.max(1, Math.min(100, currentSupersetValues[sIdx].reps + delta));
            const el = document.getElementById(`ui-super-reps-${sIdx}`);
            if (el) el.innerHTML = `${currentSupersetValues[sIdx].reps}<span class="text-xs font-sans text-primary-container ml-0.5">reps</span>`;
          }
        }
      });
    });

    document.getElementById('btn-log-set')?.addEventListener('click', () => {
      const curEx = exercises[currentExIdx];
      const setsLogged = completedSets[curEx.id] || [];
      const isExerciseDone = setsLogged.length >= curEx.targetSets;
      if (isExerciseDone) {
        if (currentExIdx < exercises.length - 1) {
          nextExercise();
        } else {
          finishGymWorkout();
        }
      } else {
        logActiveSet();
      }
    });

    document.getElementById('btn-next-ex')?.addEventListener('click', nextExercise);
    document.getElementById('btn-prev-ex')?.addEventListener('click', prevExercise);
    document.getElementById('btn-finish-gym')?.addEventListener('click', finishGymWorkout);

    document.getElementById('btn-gym-exit')?.addEventListener('click', () => {
      hapticTap();
      if (confirm('¿Deseas salir del entrenamiento de gimnasio en curso?')) {
        clearInterval(workoutTimerInterval);
        if (restTimeoutId) clearTimeout(restTimeoutId);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('nativeRestCompleted', handleNativeRestCompleted);
        if (typeof window !== 'undefined' && window.ReactNativeWebView) {
          try { window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'REST_TIMER_CANCEL' })); } catch (e) {}
        }
        releaseWakeLock();
        navigate('routines-hub', { tab: 'gym' });
      }
    });

    // Rest overlay buttons
    document.getElementById('btn-skip-rest')?.addEventListener('click', skipRest);
    document.getElementById('btn-rest-plus')?.addEventListener('click', () => addRestTime(30));
    document.getElementById('btn-rest-minus')?.addEventListener('click', () => addRestTime(-15));
  }

  render();
}

