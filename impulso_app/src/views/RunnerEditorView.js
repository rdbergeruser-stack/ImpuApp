import { storage } from '../store/storage.js';
import { formatTime } from '../utils/formatters.js';
import { hapticTap, hapticSuccess } from '../utils/haptics.js';
import { setHtmlPreservingScroll } from '../utils/dom.js';

export function renderRunnerEditor(container, navigate, params = {}) {
  const isNew = !!(params && params.isNew);
  let routine;

  if (isNew) {
    routine = {
      id: 'runner-custom-' + Date.now(),
      title: 'Progresiones Cuestas & Intervalos',
      description: 'Rutina personalizada de running y cuestas por intervalos',
      totalDistanceEst: '4.5 km',
      intervals: [
        { name: 'Calentamiento Dinámico', duration: 180, zone: 'Z2', bpm: '130-140', cue: 'Trote suave y progresivo' },
        { name: 'Subida Fuerte', duration: 45, zone: 'Z4', bpm: '165-175', cue: 'Pasos cortos, tronco erguido y cadencia alta' },
        { name: 'Bajada Suave', duration: 75, zone: 'Z1', bpm: '125-135', cue: 'Trote regenerativo de bajada' },
        { name: 'Subida Fuerte', duration: 45, zone: 'Z4', bpm: '165-175', cue: 'Impulsa con los tobillos y braceo' },
        { name: 'Bajada Suave', duration: 75, zone: 'Z1', bpm: '125-135', cue: 'Respira hondo y relaja hombros' },
        { name: 'Sprint Final Cuesta', duration: 30, zone: 'Z5', bpm: '175-185', cue: '¡Todo lo que te queda hasta la cima!' },
        { name: 'Enfriamiento', duration: 180, zone: 'Z1', bpm: '115-125', cue: 'Caminar y trote de vuelta a la calma' }
      ]
    };
  } else if (params && params.preset) {
    routine = JSON.parse(JSON.stringify(params.preset));
  } else if (params && params.id) {
    const found = storage.getRunnerPresetById(params.id);
    routine = found ? JSON.parse(JSON.stringify(found)) : storage.getRunnerPresets()[0];
  } else {
    routine = JSON.parse(JSON.stringify(storage.getRunnerPresets()[0]));
  }

  function calculateTotalSeconds() {
    return routine.intervals.reduce((acc, it) => acc + (parseInt(it.duration) || 60), 0);
  }

  function getZoneClass(zone) {
    switch (zone) {
      case 'Z5': return 'bg-error/20 border-error/50 text-error';
      case 'Z4': return 'bg-tertiary/20 border-tertiary/50 text-tertiary';
      case 'Z3': return 'bg-amber-500/20 border-amber-500/50 text-amber-300';
      case 'Z2': return 'bg-primary-container/20 border-primary-container/50 text-primary-container';
      default: return 'bg-surface-bright border-outline-variant text-on-surface-variant';
    }
  }

  function render() {
    const totalSecs = calculateTotalSeconds();
    const workIntervals = routine.intervals.filter(it => it.zone === 'Z4' || it.zone === 'Z5').length;

    const html = `
      <div class="w-full h-full flex flex-col overflow-hidden bg-background select-none">
        
        <!-- Top App Bar -->
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
                  ${isNew ? 'NUEVA RUTINA RUNNER' : 'EDITAR RUNNER'}
                </span>
              </div>
            </div>

            <button id="btn-save-runner" class="h-9 px-4 rounded-full bg-primary-container text-on-primary font-headline text-xs font-black flex items-center gap-1 active:scale-95 transition-transform shadow-md uppercase">
              <span class="material-symbols-outlined text-base font-bold">check</span>
              <span>GUARDAR</span>
            </button>
          </div>
        </header>

        <!-- Main Content -->
        <main class="w-full flex-1 min-h-0 px-4 py-3 overflow-y-auto no-scrollbar max-w-md mx-auto flex flex-col gap-4 pb-36">
          
          <!-- General Routine Info -->
          <section class="bg-surface-container rounded-2xl p-4 border border-outline-variant flex flex-col gap-3 shadow-sm">
            <div>
              <label class="text-[10px] text-on-surface-variant uppercase font-bold tracking-wider block mb-1">NOMBRE DE LA RUTINA</label>
              <div class="flex items-center gap-2">
                <span class="material-symbols-outlined text-primary-container text-xl">edit_note</span>
                <input id="input-title" type="text" value="${routine.title}" class="w-full bg-surface-container-high rounded-xl px-3 py-2 border border-outline-variant font-headline text-base font-black text-primary focus:outline-none focus:border-primary-container" placeholder="Ej. Progresiones Cuestas & Fartlek" />
              </div>
            </div>

            <div>
              <label class="text-[10px] text-on-surface-variant uppercase font-bold tracking-wider block mb-1">DESCRIPCIÓN / OBJETIVO</label>
              <input id="input-desc" type="text" value="${routine.description || ''}" class="w-full bg-surface-container-high rounded-xl px-3 py-2 border border-outline-variant text-xs text-on-surface font-medium focus:outline-none focus:border-primary-container" placeholder="Ej. Potencia muscular en cuestas y series" />
            </div>
          </section>

          <!-- Dynamic Summary Card (From Stitch screen) -->
          <section class="bg-surface-container rounded-2xl p-4 border border-outline-variant relative overflow-hidden shadow-sm">
            <div class="flex items-baseline justify-between mb-2">
              <span class="text-[10px] tracking-widest text-on-surface-variant uppercase font-headline font-bold">DURACIÓN ESTIMADA</span>
              <span class="inline-flex items-center gap-1 text-[10px] text-primary-container font-headline font-bold bg-primary-container/10 px-2 py-0.5 rounded-full">
                <span class="w-1.5 h-1.5 rounded-full bg-primary-container animate-pulse"></span>
                SECUENCIA ACTIVA
              </span>
            </div>

            <div class="flex items-baseline gap-2 mb-3">
              <span id="ui-runner-total-time" class="font-headline text-4xl leading-none text-primary font-black tracking-tight tabular-nums">${formatTime(totalSecs)}</span>
              <span class="text-xs text-on-surface-variant font-bold uppercase tracking-wider">MINUTOS</span>
            </div>

            <!-- Secondary Metrics Strip -->
            <div class="grid grid-cols-3 gap-2 pt-3 border-t border-outline-variant/40 text-center">
              <div class="bg-surface-container-high rounded-xl py-2">
                <p class="text-[9px] text-on-surface-variant tracking-wider uppercase font-bold">TOTAL FASES</p>
                <p class="font-headline text-sm text-on-surface font-black mt-0.5">${routine.intervals.length}</p>
              </div>
              <div class="bg-surface-container-high rounded-xl py-2">
                <p class="text-[9px] text-on-surface-variant tracking-wider uppercase font-bold">SERIES FUERTES</p>
                <p class="font-headline text-sm text-primary-container font-black mt-0.5">${workIntervals}</p>
              </div>
              <div class="bg-surface-container-high rounded-xl py-2">
                <p class="text-[9px] text-on-surface-variant tracking-wider uppercase font-bold">INTENSIDAD</p>
                <p class="font-headline text-sm text-tertiary font-black mt-0.5">${workIntervals > 2 ? 'Alta (Z4-Z5)' : 'Media (Z2-Z3)'}</p>
              </div>
            </div>
          </section>

          <!-- Sequential Intervals List -->
          <section class="flex flex-col gap-3">
            <div class="flex items-center justify-between px-1">
              <span class="font-headline text-xs font-black text-on-surface-variant tracking-wider uppercase flex items-center gap-1.5">
                <span class="material-symbols-outlined text-primary-container text-base">format_list_numbered</span>
                <span>SECUENCIA DE EJECUCIÓN (${routine.intervals.length} BLOQUES)</span>
              </span>
            </div>

            ${routine.intervals.map((it, idx) => `
              <article class="bg-surface-container rounded-2xl border border-outline-variant p-3.5 flex flex-col gap-2.5 relative shadow-sm overflow-hidden">
                <!-- Zone Accent Bar -->
                <div class="absolute left-0 top-0 bottom-0 w-1.5 ${it.zone === 'Z5' ? 'bg-error' : it.zone === 'Z4' ? 'bg-tertiary' : it.zone === 'Z3' ? 'bg-amber-400' : it.zone === 'Z2' ? 'bg-primary-container' : 'bg-outline'}"></div>

                <div class="flex items-center justify-between pl-2">
                  <div class="flex items-center gap-2 flex-1 mr-2">
                    <span class="w-6 h-6 rounded-full bg-surface-bright border border-outline-variant text-[11px] font-headline font-black text-primary-container flex items-center justify-center shrink-0">
                      ${idx + 1}
                    </span>
                    <input data-idx="${idx}" data-field="name" type="text" value="${it.name}" class="it-input w-full bg-transparent font-headline text-sm font-bold text-on-surface focus:outline-none border-b border-dashed border-outline-variant/40" />
                  </div>

                  <button data-delete-idx="${idx}" class="btn-delete-it text-on-surface-variant hover:text-error p-1 active:scale-95 transition-all" title="Eliminar intervalo">
                    <span class="material-symbols-outlined text-lg">delete</span>
                  </button>
                </div>

                <!-- Parameters: Time Adjuster & Zone Badge -->
                <div class="grid grid-cols-2 gap-2 pl-2">
                  <!-- Stepper Time -->
                  <div class="flex items-center justify-between bg-surface-container-high rounded-xl p-1 border border-outline-variant">
                    <button data-idx="${idx}" data-delta="-15" class="btn-time-step w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-on-surface hover:text-primary-container active:scale-95 text-xs font-black">-15s</button>
                    <span id="val-runner-dur-${idx}" class="font-headline text-sm font-black text-primary tabular-nums">${formatTime(it.duration)}</span>
                    <button data-idx="${idx}" data-delta="15" class="btn-time-step w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-on-surface hover:text-primary-container active:scale-95 text-xs font-black">+15s</button>
                  </div>

                  <!-- Zone Selector -->
                  <div class="flex items-center justify-end gap-1">
                    <select data-idx="${idx}" class="sel-zone bg-surface-container-high border border-outline-variant text-xs font-headline font-black rounded-xl px-2 h-10 text-on-surface focus:outline-none focus:border-primary-container">
                      <option value="Z1" ${it.zone === 'Z1' ? 'selected' : ''}>Z1 (Recup)</option>
                      <option value="Z2" ${it.zone === 'Z2' ? 'selected' : ''}>Z2 (Aeróbico)</option>
                      <option value="Z3" ${it.zone === 'Z3' ? 'selected' : ''}>Z3 (Tempo)</option>
                      <option value="Z4" ${it.zone === 'Z4' ? 'selected' : ''}>Z4 (Umbral)</option>
                      <option value="Z5" ${it.zone === 'Z5' ? 'selected' : ''}>Z5 (Sprint)</option>
                    </select>
                  </div>
                </div>

                <!-- Coach Audio Cue Input -->
                <div class="pl-2">
                  <div class="flex items-center gap-1.5 bg-surface-container-low rounded-xl px-2.5 py-1.5 border border-outline-variant/40">
                    <span class="material-symbols-outlined text-xs text-primary-container">record_voice_over</span>
                    <input data-idx="${idx}" data-field="cue" type="text" value="${it.cue || ''}" class="it-input w-full bg-transparent text-[11px] text-on-surface-variant font-medium focus:outline-none placeholder:text-outline" placeholder="Indicación de voz del coach (ej. Subida con pasos cortos)" />
                  </div>
                </div>
              </article>
            `).join('')}

            <!-- Add Buttons Strip -->
            <div class="grid grid-cols-2 gap-2 pt-1">
              <button id="btn-add-simple" class="h-12 rounded-2xl border-2 border-dashed border-outline-variant hover:border-primary-container text-on-surface-variant hover:text-primary-container font-headline text-[11px] font-black uppercase flex items-center justify-center gap-1.5 active:scale-95 transition-all">
                <span class="material-symbols-outlined text-base">add_circle</span>
                <span>+ FASE SIMPLE</span>
              </button>

              <button id="btn-add-cuesta" class="h-12 rounded-2xl border-2 border-dashed border-primary-container/60 bg-primary-container/5 hover:border-primary-container text-primary-container font-headline text-[11px] font-black uppercase flex items-center justify-center gap-1.5 active:scale-95 transition-all">
                <span class="material-symbols-outlined text-base">terrain</span>
                <span>+ CUESTA + BAJADA</span>
              </button>
            </div>
          </section>

        </main>

        <!-- Sticky Bottom CTA -->
        <footer class="w-full fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-t from-background via-background/95 to-transparent px-4 pb-4 pt-4 max-w-md mx-auto safe-area-bottom flex flex-col gap-2">
          <button id="btn-start-runner" class="w-full h-14 rounded-2xl bg-primary-container text-on-primary font-headline text-sm uppercase tracking-wider font-black flex items-center justify-center gap-2 glow-primary active:scale-[0.98] transition-transform shadow-2xl">
            <span class="material-symbols-outlined text-[24px]" style="font-variation-settings: 'FILL' 1;">play_arrow</span>
            <span>GUARDAR & INICIAR RUNNER</span>
          </button>
        </footer>

      </div>
    `;

    setHtmlPreservingScroll(container, html);
    attachEvents();
  }

  function saveRoutineAndGo(targetRoute = 'runner-catalog') {
    hapticSuccess();
    const titleInput = document.getElementById('input-title');
    if (titleInput && titleInput.value.trim()) {
      routine.title = titleInput.value.trim();
    }
    const descInput = document.getElementById('input-desc');
    if (descInput) {
      routine.description = descInput.value.trim();
    }

    storage.saveRunnerPreset(routine);
    alert('¡Rutina de Runner guardada con éxito!');
    if (targetRoute === 'live') {
      navigate('runner-live', { preset: routine });
    } else {
      navigate('routines-hub', { tab: 'runner' });
    }
  }

  function attachEvents() {
    document.getElementById('btn-back')?.addEventListener('click', () => {
      hapticTap();
      navigate('runner-catalog');
    });

    document.getElementById('btn-save-runner')?.addEventListener('click', () => {
      saveRoutineAndGo('catalog');
    });

    document.getElementById('btn-start-runner')?.addEventListener('click', () => {
      saveRoutineAndGo('live');
    });

    document.getElementById('input-title')?.addEventListener('change', (e) => {
      routine.title = e.target.value.trim() || 'Rutina Runner';
    });

    document.getElementById('input-desc')?.addEventListener('change', (e) => {
      routine.description = e.target.value.trim();
    });

    // Time step buttons - In-place DOM update prevents scroll jump
    container.querySelectorAll('.btn-time-step').forEach(btn => {
      btn.addEventListener('click', () => {
        hapticTap();
        const idx = parseInt(btn.getAttribute('data-idx'));
        const delta = parseInt(btn.getAttribute('data-delta'));
        routine.intervals[idx].duration = Math.max(15, Math.min(3600, routine.intervals[idx].duration + delta));

        const durEl = document.getElementById(`val-runner-dur-${idx}`);
        if (durEl) durEl.textContent = formatTime(routine.intervals[idx].duration);
        const totalSecs = calculateTotalSeconds();
        const totEl = document.getElementById('ui-runner-total-time');
        if (totEl) totEl.textContent = formatTime(totalSecs);
      });
    });

    // Zone selects
    container.querySelectorAll('.sel-zone').forEach(sel => {
      sel.addEventListener('change', (e) => {
        const idx = parseInt(sel.getAttribute('data-idx'));
        routine.intervals[idx].zone = e.target.value;
        render();
      });
    });

    // Text inputs
    container.querySelectorAll('.it-input').forEach(input => {
      input.addEventListener('change', (e) => {
        const idx = parseInt(input.getAttribute('data-idx'));
        const field = input.getAttribute('data-field');
        routine.intervals[idx][field] = e.target.value.trim();
      });
    });

    // Delete interval
    container.querySelectorAll('.btn-delete-it').forEach(btn => {
      btn.addEventListener('click', () => {
        hapticTap();
        const idx = parseInt(btn.getAttribute('data-delete-idx'));
        if (routine.intervals.length > 1) {
          routine.intervals.splice(idx, 1);
          render();
        } else {
          alert('La rutina debe tener al menos un intervalo.');
        }
      });
    });

    // Add Simple Interval
    document.getElementById('btn-add-simple')?.addEventListener('click', () => {
      hapticTap();
      routine.intervals.push({
        name: 'Nuevo Intervalo',
        duration: 60,
        zone: 'Z3',
        bpm: '140-155',
        cue: 'Mantén el ritmo constante'
      });
      render();
      setTimeout(() => {
        const main = container.querySelector('main');
        if (main) main.scrollTo({ top: main.scrollHeight, behavior: 'smooth' });
      }, 50);
    });

    // Add Cuesta + Bajada Pair
    document.getElementById('btn-add-cuesta')?.addEventListener('click', () => {
      hapticTap();
      routine.intervals.push({
        name: 'Subida Cuesta Fuerte',
        duration: 45,
        zone: 'Z4',
        bpm: '165-175',
        cue: 'Tronco erguido, pasos cortos y braceo enérgico'
      });
      routine.intervals.push({
        name: 'Bajada Suave Recuperación',
        duration: 75,
        zone: 'Z1',
        bpm: '120-130',
        cue: 'Trote regenerativo de bajada'
      });
      render();
      setTimeout(() => {
        const main = container.querySelector('main');
        if (main) main.scrollTo({ top: main.scrollHeight, behavior: 'smooth' });
      }, 50);
    });

    // Save Runner Routine
    document.getElementById('btn-save-runner')?.addEventListener('click', () => {
      hapticSuccess();
      routine.title = document.getElementById('input-runner-title')?.value.trim() || routine.title;
      routine.totalDistanceEst = document.getElementById('input-runner-dist')?.value.trim() || routine.totalDistanceEst;
      storage.saveRunnerPreset(routine);
      alert(`¡Rutina Runner "${routine.title}" guardada con éxito!`);
      navigate('routines-hub', { tab: 'runner' });
    });
  }

  render();
}
