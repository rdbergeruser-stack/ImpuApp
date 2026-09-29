// Tabata Configuration & Routine Editor View
// Complete implementation with Exercise Sequence Manager per cycle, Exercise Bank & Native Persistence

import { storage } from '../store/storage.js';
import { formatTime } from '../utils/formatters.js';
import { hapticTap, hapticSuccess } from '../utils/haptics.js';
import { audio } from '../audio/audioService.js';
import { setHtmlPreservingScroll } from '../utils/dom.js';

const DEFAULT_EXERCISE_BANK = [
  'Sentadillas',
  'Flexiones',
  'Burpees',
  'Mountain Climbers',
  'Jumping Jacks',
  'Plancha Abdominal',
  'Zancadas Alternas',
  'Skater Hops',
  'High Knees',
  'Abdominales Crunch',
  'Fondos de Tríceps',
  'Escaladores Cruzados',
  'Puente de Glúteos',
  'Shadow Boxing',
  'Trote en el Lugar'
];

export function renderTabataConfig(container, navigate, params = {}) {
  const presets = storage.getTabataPresets();
  const settings = storage.getSettings();
  const isNew = !!(params && params.isNew);

  let config;
  if (isNew) {
    config = {
      id: 'tabata-custom-' + Date.now(),
      title: 'Nueva Rutina Tabata',
      description: 'Rutina personalizada de intervalos HIIT',
      prep: 10,
      work: 20,
      rest: 10,
      cycles: 8,
      sets: 1,
      restBetweenSets: 60,
      cooldown: 30,
      workName: 'Sentadillas',
      restName: 'Descanso activo',
      exercises: [
        'Sentadillas', 'Flexiones', 'Burpees', 'Mountain Climbers',
        'Jumping Jacks', 'Plancha Abdominal', 'Zancadas Alternas', 'High Knees'
      ]
    };
  } else if (params && params.preset) {
    config = JSON.parse(JSON.stringify(params.preset));
  } else if (params && params.id) {
    const found = storage.getTabataPresetById(params.id);
    config = found ? JSON.parse(JSON.stringify(found)) : JSON.parse(JSON.stringify(presets[0]));
  } else {
    config = JSON.parse(JSON.stringify(presets[0]));
  }

  // Asegurar que config.exercises sea un arreglo válido con longitud suficiente
  if (!config.exercises || !Array.isArray(config.exercises)) {
    const splitExercises = config.workName && (config.workName.includes(',') || config.workName.includes('/'))
      ? config.workName.split(/[,/]/).map(s => s.trim()).filter(Boolean)
      : [];
    config.exercises = Array.from({ length: config.cycles || 8 }, (_, i) => {
      return splitExercises[i] || DEFAULT_EXERCISE_BANK[i % DEFAULT_EXERCISE_BANK.length];
    });
  }
  while (config.exercises.length < config.cycles) {
    const nextIdx = config.exercises.length;
    config.exercises.push(DEFAULT_EXERCISE_BANK[nextIdx % DEFAULT_EXERCISE_BANK.length]);
  }

  // Estado del modal de selección de ejercicio
  let modalActive = false;
  let editingCycleIndex = 0;

  function calculateTotalSeconds() {
    const cycleTime = config.work + config.rest;
    const seriesTime = cycleTime * config.cycles;
    const totalRestBetween = Math.max(0, config.sets - 1) * config.restBetweenSets;
    return config.prep + (seriesTime * config.sets) + totalRestBetween + config.cooldown;
  }

  function saveRoutine() {
    hapticSuccess();
    // Sincronizar workName con los ejercicios
    config.workName = config.exercises.slice(0, 3).join(' / ') + (config.exercises.length > 3 ? '...' : '');
    storage.saveTabataPreset(config);
    navigate('routines-hub', { tab: 'tabata' });
  }

  function render() {
    const totalSecs = calculateTotalSeconds();
    const totalIntervals = (config.cycles * 2) * config.sets;

    // Asegurar tamaño de ejercicios al cambiar ciclos
    while (config.exercises.length < config.cycles) {
      const idx = config.exercises.length;
      config.exercises.push(DEFAULT_EXERCISE_BANK[idx % DEFAULT_EXERCISE_BANK.length]);
    }

    const html = `
      <div class="w-full h-full flex flex-col overflow-hidden bg-background select-none">
        
        <!-- Header -->
        <header class="w-full z-40 bg-surface border-b border-outline-variant shrink-0 safe-area-top">
          <div class="flex justify-between items-center w-full px-4 h-16 max-w-md mx-auto">
            <div class="flex items-center gap-3">
              <button id="btn-back" class="w-10 h-10 rounded-xl bg-surface-container-high border border-outline-variant flex items-center justify-center text-primary-container active:scale-95 transition-transform" aria-label="Volver">
                <span class="material-symbols-outlined text-[22px]">arrow_back</span>
              </button>
              <div>
                <h1 class="font-montserrat text-lg font-black tracking-wider text-white uppercase leading-tight">
                  ImpuApp
                </h1>
                <span class="block text-[11px] text-on-surface-variant font-bold tracking-widest uppercase">
                  ${isNew ? 'NUEVA RUTINA TABATA' : 'CONFIGURACIÓN TABATA'}
                </span>
              </div>
            </div>

            <button id="btn-save-top" class="h-9 px-3.5 rounded-full bg-primary-container text-on-primary font-headline text-xs font-black flex items-center gap-1 active:scale-95 transition-transform shadow-md uppercase">
              <span class="material-symbols-outlined text-base font-bold">check</span>
              <span>GUARDAR</span>
            </button>
          </div>
        </header>

        <!-- Main Form -->
        <main class="w-full flex-1 min-h-0 px-4 py-3 overflow-y-auto no-scrollbar max-w-md mx-auto flex flex-col gap-4 pb-36">
          
          <!-- Routine Name -->
          <section class="bg-surface-container rounded-2xl p-4 border border-outline-variant flex flex-col gap-3 shadow-sm shrink-0 mt-1">
            <div>
              <label class="text-[10px] text-on-surface-variant uppercase font-bold tracking-wider block mb-1">
                NOMBRE DE LA RUTINA
              </label>
              <div class="flex items-center gap-2">
                <span class="material-symbols-outlined text-primary-container text-xl">fitness_center</span>
                <input id="input-routine-title" type="text" value="${config.title || ''}" class="w-full bg-surface-container-high rounded-xl px-3 py-2 border border-outline-variant font-headline text-sm font-black text-primary focus:outline-none focus:border-primary-container" placeholder="Ej. Tabata Quema Grasa Full Body" />
              </div>
            </div>
          </section>

          <!-- Session Summary Bento -->
          <section class="bg-surface-container rounded-2xl p-4 border border-outline-variant relative overflow-hidden shadow-sm">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="w-2.5 h-2.5 rounded-full bg-primary-container animate-pulse"></span>
                <span class="text-xs font-black tracking-widest text-on-surface-variant uppercase font-headline">RESUMEN DE SESIÓN</span>
              </div>
              <span class="px-2 py-0.5 rounded bg-surface-bright border border-outline-variant text-[10px] font-bold text-primary-container uppercase font-headline">TABATA</span>
            </div>

            <div class="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-outline-variant/40 text-center">
              <div>
                <span class="block text-[11px] text-on-surface-variant uppercase font-bold">Tiempo Total</span>
                <span id="ui-tabata-total-time" class="block font-headline text-2xl font-black text-primary tabular-nums mt-0.5">${formatTime(totalSecs)}</span>
              </div>
              <div class="border-x border-outline-variant/30">
                <span class="block text-[11px] text-on-surface-variant uppercase font-bold">Intervalos</span>
                <span id="ui-tabata-intervals" class="block font-headline text-2xl font-black text-primary-container tabular-nums mt-0.5">${totalIntervals}</span>
              </div>
              <div>
                <span class="block text-[11px] text-on-surface-variant uppercase font-bold">Series</span>
                <span id="ui-tabata-sets" class="block font-headline text-2xl font-black text-primary tabular-nums mt-0.5">${config.sets}</span>
              </div>
            </div>
          </section>

          <!-- Timers & Interval Steppers -->
          <section class="flex flex-col gap-3">
            <h3 class="text-xs font-headline font-black uppercase tracking-wider text-on-surface-variant px-1">
              PARÁMETROS DE INTERVALOS
            </h3>

            <!-- Preparación -->
            <div class="bg-surface-container rounded-2xl p-3.5 border border-outline-variant flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-surface-container-high border border-outline-variant flex items-center justify-center text-tertiary-fixed">
                  <span class="material-symbols-outlined text-[22px]">hourglass_top</span>
                </div>
                <div>
                  <span class="font-headline text-sm font-black uppercase text-on-surface block">PREPARACIÓN</span>
                  <span class="text-[11px] text-on-surface-variant font-medium">Cuenta regresiva inicial</span>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <button data-action="dec" data-param="prep" class="w-10 h-10 rounded-xl bg-surface-container-high border border-outline-variant text-on-surface font-headline text-lg font-black active:scale-95 flex items-center justify-center">-</button>
                <span id="val-prep" class="w-12 text-center font-headline text-xl font-black text-primary tabular-nums">${config.prep}s</span>
                <button data-action="inc" data-param="prep" class="w-10 h-10 rounded-xl bg-surface-container-high border border-outline-variant text-on-surface font-headline text-lg font-black active:scale-95 flex items-center justify-center">+</button>
              </div>
            </div>

            <!-- Trabajo -->
            <div class="bg-surface-container rounded-2xl p-3.5 border-2 border-primary-container/60 flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-primary-container text-on-primary-container flex items-center justify-center font-bold">
                  <span class="material-symbols-outlined text-[22px]">bolt</span>
                </div>
                <div>
                  <span class="font-headline text-sm font-black uppercase text-primary-container block">TRABAJO (ESFUERZO)</span>
                  <span class="text-[11px] text-on-surface-variant font-medium">Intervalo de alta intensidad</span>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <button data-action="dec" data-param="work" class="w-10 h-10 rounded-xl bg-surface-container-high border border-outline-variant text-on-surface font-headline text-lg font-black active:scale-95 flex items-center justify-center">-</button>
                <span id="val-work" class="w-12 text-center font-headline text-xl font-black text-primary-container tabular-nums">${config.work}s</span>
                <button data-action="inc" data-param="work" class="w-10 h-10 rounded-xl bg-surface-container-high border border-outline-variant text-on-surface font-headline text-lg font-black active:scale-95 flex items-center justify-center">+</button>
              </div>
            </div>

            <!-- Descanso -->
            <div class="bg-surface-container rounded-2xl p-3.5 border border-outline-variant flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-surface-container-high border border-outline-variant flex items-center justify-center text-secondary">
                  <span class="material-symbols-outlined text-[22px]">pause_circle</span>
                </div>
                <div>
                  <span class="font-headline text-sm font-black uppercase text-on-surface block">DESCANSO ACTIVO</span>
                  <span class="text-[11px] text-on-surface-variant font-medium">Recuperación entre intervalos</span>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <button data-action="dec" data-param="rest" class="w-10 h-10 rounded-xl bg-surface-container-high border border-outline-variant text-on-surface font-headline text-lg font-black active:scale-95 flex items-center justify-center">-</button>
                <span id="val-rest" class="w-12 text-center font-headline text-xl font-black text-secondary tabular-nums">${config.rest}s</span>
                <button data-action="inc" data-param="rest" class="w-10 h-10 rounded-xl bg-surface-container-high border border-outline-variant text-on-surface font-headline text-lg font-black active:scale-95 flex items-center justify-center">+</button>
              </div>
            </div>

            <!-- Ciclos por Serie -->
            <div class="bg-surface-container rounded-2xl p-3.5 border border-outline-variant flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-surface-container-high border border-outline-variant flex items-center justify-center text-primary-container">
                  <span class="material-symbols-outlined text-[22px]">repeat</span>
                </div>
                <div>
                  <span class="font-headline text-sm font-black uppercase text-on-surface block">CICLOS POR SERIE</span>
                  <span class="text-[11px] text-on-surface-variant font-medium">Rondas de Trabajo + Descanso</span>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <button data-action="dec" data-param="cycles" class="w-10 h-10 rounded-xl bg-surface-container-high border border-outline-variant text-on-surface font-headline text-lg font-black active:scale-95 flex items-center justify-center">-</button>
                <span id="val-cycles" class="w-12 text-center font-headline text-xl font-black text-primary tabular-nums">${config.cycles}</span>
                <button data-action="inc" data-param="cycles" class="w-10 h-10 rounded-xl bg-surface-container-high border border-outline-variant text-on-surface font-headline text-lg font-black active:scale-95 flex items-center justify-center">+</button>
              </div>
            </div>

            <!-- Series Totales -->
            <div class="bg-surface-container rounded-2xl p-3.5 border border-outline-variant flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-surface-container-high border border-outline-variant flex items-center justify-center text-primary-container">
                  <span class="material-symbols-outlined text-[22px]">layers</span>
                </div>
                <div>
                  <span class="font-headline text-sm font-black uppercase text-on-surface block">SERIES TOTALES</span>
                  <span class="text-[11px] text-on-surface-variant font-medium">Bloques de series</span>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <button data-action="dec" data-param="sets" class="w-10 h-10 rounded-xl bg-surface-container-high border border-outline-variant text-on-surface font-headline text-lg font-black active:scale-95 flex items-center justify-center">-</button>
                <span id="val-sets" class="w-12 text-center font-headline text-xl font-black text-primary tabular-nums">${config.sets}</span>
                <button data-action="inc" data-param="sets" class="w-10 h-10 rounded-xl bg-surface-container-high border border-outline-variant text-on-surface font-headline text-lg font-black active:scale-95 flex items-center justify-center">+</button>
              </div>
            </div>

            <!-- Descanso entre Series (si sets > 1) -->
            ${config.sets > 1 ? `
              <div class="bg-surface-container rounded-2xl p-3.5 border border-outline-variant flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-xl bg-surface-container-high border border-outline-variant flex items-center justify-center text-secondary">
                    <span class="material-symbols-outlined text-[22px]">snooze</span>
                  </div>
                  <div>
                    <span class="font-headline text-sm font-black uppercase text-on-surface block">ENTRE SERIES</span>
                    <span class="text-[11px] text-on-surface-variant font-medium">Pausa larga entre bloques</span>
                  </div>
                </div>
                <div class="flex items-center gap-2">
                  <button data-action="dec" data-param="restBetweenSets" class="w-10 h-10 rounded-xl bg-surface-container-high border border-outline-variant text-on-surface font-headline text-lg font-black active:scale-95 flex items-center justify-center">-</button>
                  <span id="val-restBetweenSets" class="w-12 text-center font-headline text-xl font-black text-secondary tabular-nums">${config.restBetweenSets}s</span>
                  <button data-action="inc" data-param="restBetweenSets" class="w-10 h-10 rounded-xl bg-surface-container-high border border-outline-variant text-on-surface font-headline text-lg font-black active:scale-95 flex items-center justify-center">+</button>
                </div>
              </div>
            ` : ''}

          </section>

          <!-- Exercise List Sequence per Cycle (Fiel al Workshop) -->
          <section class="bg-surface-container rounded-2xl p-4 border border-outline-variant flex flex-col gap-3 shadow-sm">
            <div class="flex items-center justify-between">
              <div>
                <h3 class="font-headline text-sm font-black uppercase tracking-tight text-primary">
                  LISTA DE EJERCICIOS (${config.cycles} RONDAS)
                </h3>
                <span class="text-[11px] text-on-surface-variant font-medium">
                  Toca un ejercicio para cambiarlo o escribir uno nuevo
                </span>
              </div>
              <span class="px-2 py-0.5 rounded-full bg-surface-bright border border-outline-variant text-primary-container text-[10px] font-black uppercase">
                COACH TTS
              </span>
            </div>

            <div class="flex flex-col gap-2 mt-1">
              ${Array.from({ length: config.cycles }, (_, i) => {
                const exName = config.exercises[i] || `Ejercicio ${i + 1}`;
                return `
                  <button data-open-exercise-picker="${i}" class="w-full bg-surface-container-high hover:border-primary-container/80 rounded-xl p-3 border border-outline-variant flex items-center justify-between text-left active:scale-[0.99] transition-all group">
                    <div class="flex items-center gap-3">
                      <div class="w-7 h-7 rounded-lg bg-surface-bright border border-outline-variant flex items-center justify-center text-xs font-headline font-black text-primary-container group-hover:bg-primary-container group-hover:text-on-primary-container transition-colors">
                        ${i + 1}
                      </div>
                      <span class="font-headline text-xs font-bold text-on-surface uppercase group-hover:text-primary transition-colors">
                        ${exName}
                      </span>
                    </div>
                    <span class="material-symbols-outlined text-on-surface-variant text-base group-hover:text-primary-container">edit</span>
                  </button>
                `;
              }).join('')}
            </div>
          </section>

          <!-- Audio & Feedback Toggles -->
          <section class="bg-surface-container-low rounded-2xl p-3.5 border border-outline-variant/60 flex items-center justify-around text-center">
            <button id="toggle-sound" class="flex flex-col items-center gap-1 text-xs font-bold ${settings.soundEnabled ? 'text-primary-container' : 'text-on-surface-variant'} active:scale-95">
              <span class="material-symbols-outlined text-[22px]">${settings.soundEnabled ? 'volume_up' : 'volume_off'}</span>
              <span>BEEPS 3-2-1</span>
            </button>
            <div class="w-px h-8 bg-outline-variant/40"></div>
            <button id="toggle-voice" class="flex flex-col items-center gap-1 text-xs font-bold ${settings.voiceEnabled ? 'text-primary-container' : 'text-on-surface-variant'} active:scale-95">
              <span class="material-symbols-outlined text-[22px]">${settings.voiceEnabled ? 'record_voice_over' : 'voice_over_off'}</span>
              <span>VOZ COACH</span>
            </button>
            <div class="w-px h-8 bg-outline-variant/40"></div>
            <button id="toggle-vibration" class="flex flex-col items-center gap-1 text-xs font-bold ${settings.hapticsEnabled ? 'text-primary-container' : 'text-on-surface-variant'} active:scale-95">
              <span class="material-symbols-outlined text-[22px]">${settings.hapticsEnabled ? 'vibration' : 'mobile_off'}</span>
              <span>VIBRACIÓN</span>
            </button>
          </section>

        </main>

        <!-- Sticky Bottom CTAs -->
        <footer class="w-full fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-t from-background via-background/95 to-transparent px-4 pb-4 pt-4 max-w-md mx-auto safe-area-bottom flex gap-2.5">
          <button id="btn-save-bottom" class="flex-1 h-14 rounded-2xl bg-surface-container-high border border-outline-variant text-primary font-headline text-xs uppercase tracking-wider font-black flex items-center justify-center gap-1.5 active:scale-[0.98] transition-all">
            <span class="material-symbols-outlined text-[20px]">save</span>
            <span>GUARDAR RUTINA</span>
          </button>

          <button id="btn-start-tabata" class="flex-1 h-14 rounded-2xl bg-primary-container text-on-primary font-headline text-xs uppercase tracking-wider font-black flex items-center justify-center gap-1.5 glow-primary active:scale-[0.98] transition-transform shadow-2xl">
            <span class="material-symbols-outlined text-[22px]" style="font-variation-settings: 'FILL' 1;">play_arrow</span>
            <span>INICIAR AHORA</span>
          </button>
        </footer>

        <!-- Modal Picker de Ejercicio (Fiel al Workshop) -->
        ${modalActive ? `
          <div id="modal-exercise-picker" class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-3 animate-fade-in">
            <div class="w-full max-w-md bg-surface border border-outline-variant rounded-3xl p-5 flex flex-col gap-4 shadow-2xl animate-slide-up max-h-[85vh] overflow-y-auto">
              
              <div class="flex items-center justify-between border-b border-outline-variant pb-3">
                <div>
                  <h3 class="font-headline text-base font-black uppercase text-primary">
                    RONDA #${editingCycleIndex + 1}
                  </h3>
                  <span class="text-xs text-on-surface-variant font-medium">Asignar o escribir ejercicio</span>
                </div>
                <button id="btn-close-modal" class="w-8 h-8 rounded-full bg-surface-container-high border border-outline-variant flex items-center justify-center text-on-surface-variant hover:text-on-surface">
                  <span class="material-symbols-outlined text-lg">close</span>
                </button>
              </div>

              <!-- Input para escribir nuevo -->
              <div class="flex items-center gap-2">
                <input id="input-custom-exercise" type="text" value="${config.exercises[editingCycleIndex] || ''}" placeholder="Escribe un ejercicio..." class="flex-1 bg-surface-container-high rounded-xl px-3.5 py-2.5 border border-outline-variant text-xs font-bold text-on-surface focus:outline-none focus:border-primary-container" />
                <button id="btn-apply-custom-exercise" class="h-10 px-4 rounded-xl bg-primary-container text-on-primary font-headline text-xs font-black uppercase active:scale-95 transition-transform flex items-center justify-center">
                  <span class="material-symbols-outlined text-lg">check</span>
                </button>
              </div>

              <!-- Banco de ejercicios rápidos -->
              <div>
                <span class="text-[10px] text-on-surface-variant uppercase font-bold tracking-wider block mb-2">
                  O ELIGE DE TU BANCO DE EJERCICIOS:
                </span>
                <div class="flex flex-wrap gap-2 max-h-56 overflow-y-auto no-scrollbar py-1">
                  ${DEFAULT_EXERCISE_BANK.map(item => `
                    <button data-select-bank-exercise="${item}" class="px-3 py-1.5 rounded-xl border border-outline-variant bg-surface-container text-xs font-bold text-on-surface-variant hover:text-primary hover:border-primary-container active:scale-95 transition-all text-left">
                      ${item}
                    </button>
                  `).join('')}
                </div>
              </div>

            </div>
          </div>
        ` : ''}

      </div>
    `;

    setHtmlPreservingScroll(container, html);
    attachEvents();
  }

  function attachEvents() {
    document.getElementById('btn-back')?.addEventListener('click', () => {
      hapticTap();
      navigate('routines-hub', { tab: 'tabata' });
    });

    document.getElementById('btn-save-top')?.addEventListener('click', () => {
      saveRoutine();
    });

    document.getElementById('btn-save-bottom')?.addEventListener('click', () => {
      saveRoutine();
    });

    // Routine Title change
    const titleInput = document.getElementById('input-routine-title');
    if (titleInput) {
      titleInput.addEventListener('input', (e) => {
        config.title = e.target.value.trim() || 'Rutina Tabata';
      });
    }

    // Helper to update summary Bento without full re-render
    const updateSummaryBento = () => {
      const totalSecs = calculateTotalSeconds();
      const totalIntervals = (config.cycles * 2) * config.sets;
      const elTotal = document.getElementById('ui-tabata-total-time');
      if (elTotal) elTotal.textContent = formatTime(totalSecs);
      const elInt = document.getElementById('ui-tabata-intervals');
      if (elInt) elInt.textContent = totalIntervals;
      const elSets = document.getElementById('ui-tabata-sets');
      if (elSets) elSets.textContent = config.sets;
    };

    // Steppers (+ / -) - In-place DOM updates prevent scroll jumps
    container.querySelectorAll('button[data-action]').forEach(btn => {
      btn.addEventListener('click', () => {
        hapticTap();
        const action = btn.getAttribute('data-action');
        const param = btn.getAttribute('data-param');
        const step = (param === 'work' || param === 'rest' || param === 'cooldown' || param === 'restBetweenSets') ? 5 : 1;
        const delta = action === 'inc' ? step : -step;

        if (param === 'prep') {
          config.prep = Math.max(0, Math.min(120, config.prep + delta));
          const el = document.getElementById('val-prep');
          if (el) el.textContent = `${config.prep}s`;
          updateSummaryBento();
          return;
        }
        if (param === 'work') {
          config.work = Math.max(5, Math.min(300, config.work + delta));
          const el = document.getElementById('val-work');
          if (el) el.textContent = `${config.work}s`;
          updateSummaryBento();
          return;
        }
        if (param === 'rest') {
          config.rest = Math.max(0, Math.min(180, config.rest + delta));
          const el = document.getElementById('val-rest');
          if (el) el.textContent = `${config.rest}s`;
          updateSummaryBento();
          return;
        }
        if (param === 'restBetweenSets') {
          config.restBetweenSets = Math.max(0, Math.min(300, config.restBetweenSets + delta));
          const el = document.getElementById('val-restBetweenSets');
          if (el) el.textContent = `${config.restBetweenSets}s`;
          updateSummaryBento();
          return;
        }
        if (param === 'cycles') {
          config.cycles = Math.max(1, Math.min(50, config.cycles + delta));
          render();
          return;
        }
        if (param === 'sets') {
          config.sets = Math.max(1, Math.min(20, config.sets + delta));
          render();
          return;
        }
      });
    });

    // Open Exercise Modal Picker
    container.querySelectorAll('[data-open-exercise-picker]').forEach(btn => {
      btn.addEventListener('click', () => {
        hapticTap();
        editingCycleIndex = parseInt(btn.getAttribute('data-open-exercise-picker'), 10);
        modalActive = true;
        render();
      });
    });

    // Modal Events
    if (modalActive) {
      document.getElementById('btn-close-modal')?.addEventListener('click', () => {
        hapticTap();
        modalActive = false;
        render();
      });

      const applyCustom = () => {
        const val = document.getElementById('input-custom-exercise')?.value.trim();
        if (val) {
          config.exercises[editingCycleIndex] = val;
          hapticSuccess();
          modalActive = false;
          render();
        }
      };

      document.getElementById('btn-apply-custom-exercise')?.addEventListener('click', applyCustom);
      document.getElementById('input-custom-exercise')?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') applyCustom();
      });

      container.querySelectorAll('[data-select-bank-exercise]').forEach(chip => {
        chip.addEventListener('click', () => {
          hapticSuccess();
          const name = chip.getAttribute('data-select-bank-exercise');
          config.exercises[editingCycleIndex] = name;
          modalActive = false;
          render();
        });
      });
    }

    // Toggle Audio Controls
    document.getElementById('toggle-sound')?.addEventListener('click', () => {
      hapticTap();
      settings.soundEnabled = !settings.soundEnabled;
      storage.saveSettings(settings);
      audio.setSoundEnabled(settings.soundEnabled);
      render();
    });

    document.getElementById('toggle-voice')?.addEventListener('click', () => {
      hapticTap();
      settings.voiceEnabled = !settings.voiceEnabled;
      storage.saveSettings(settings);
      audio.setVoiceEnabled(settings.voiceEnabled);
      render();
    });

    document.getElementById('toggle-vibration')?.addEventListener('click', () => {
      hapticTap();
      settings.hapticsEnabled = !settings.hapticsEnabled;
      storage.saveSettings(settings);
      render();
    });

    // Start Live Workout
    document.getElementById('btn-start-tabata')?.addEventListener('click', () => {
      hapticTap();
      audio.ensureContext();
      navigate('tabata-live', { config });
    });
  }

  render();
}
