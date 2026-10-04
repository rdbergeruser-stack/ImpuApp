// Routines Hub View - Unified catalog for Gym Routines, Tabata HIIT and Runner Presets

import { storage } from '../store/storage.js';
import { formatTime } from '../utils/formatters.js';
import { hapticTap } from '../utils/haptics.js';
import { renderBottomNav } from '../components/BottomNav.js';

export function renderRoutinesHub(container, navigate, params = {}) {
  let activeTab = params.tab || 'gym'; // 'gym' | 'tabata' | 'runner'
  let gymRoutines = storage.getGymRoutines();
  let tabataPresets = storage.getTabataPresets();
  let runnerPresets = storage.getRunnerPresets();

  function render() {
    gymRoutines = storage.getGymRoutines();
    tabataPresets = storage.getTabataPresets();
    runnerPresets = storage.getRunnerPresets();

    const html = `
      <div class="w-full h-full flex flex-col justify-between overflow-hidden bg-background select-none">
        
        <!-- Header -->
        <header class="w-full z-40 bg-surface border-b border-outline-variant shrink-0 safe-area-top">
          <div class="flex justify-between items-center w-full px-4 h-16 max-w-md mx-auto">
            <div class="flex items-center gap-3">
              <button id="btn-back-hub" class="w-10 h-10 rounded-xl bg-surface-container-high border border-outline-variant flex items-center justify-center text-primary-container active:scale-95 transition-transform" aria-label="Volver">
                <span class="material-symbols-outlined text-[22px]">arrow_back</span>
              </button>
              <div>
                <h1 class="font-montserrat text-lg font-black tracking-wider text-white uppercase leading-tight">ImpuApp</h1>
                <span class="block text-[11px] text-on-surface-variant font-bold tracking-widest uppercase">MIS RUTINAS</span>
              </div>
            </div>

            <button id="btn-create-routine" class="flex items-center gap-1 px-3 py-1.5 rounded-full bg-primary-container text-on-primary font-headline text-xs font-black active:scale-95 transition-transform shadow-md">
              <span class="material-symbols-outlined text-base font-bold">add</span>
              <span>NUEVA</span>
            </button>
          </div>
        </header>

        <!-- Main Content -->
        <main class="w-full flex-1 px-4 py-3 overflow-y-auto no-scrollbar max-w-md mx-auto flex flex-col gap-3.5 pb-24">
          
          <!-- Category Tabs: GYM vs TABATA vs RUNNER -->
          <div class="grid grid-cols-3 p-1 bg-surface-container rounded-2xl border border-outline-variant gap-1 shadow-sm">
            <button id="tab-btn-gym" class="flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl font-headline text-[11px] font-black uppercase tracking-wider transition-all ${
              activeTab === 'gym'
                ? 'bg-primary-container text-on-primary-container shadow-md'
                : 'text-on-surface-variant hover:text-on-surface'
            }">
              <span class="material-symbols-outlined text-base">fitness_center</span>
              <span>GYM (${gymRoutines.length})</span>
            </button>

            <button id="tab-btn-tabata" class="flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl font-headline text-[11px] font-black uppercase tracking-wider transition-all ${
              activeTab === 'tabata'
                ? 'bg-primary-container text-on-primary-container shadow-md'
                : 'text-on-surface-variant hover:text-on-surface'
            }">
              <span class="material-symbols-outlined text-base">timer</span>
              <span>TABATA (${tabataPresets.length})</span>
            </button>

            <button id="tab-btn-runner" class="flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl font-headline text-[11px] font-black uppercase tracking-wider transition-all ${
              activeTab === 'runner'
                ? 'bg-primary-container text-on-primary-container shadow-md'
                : 'text-on-surface-variant hover:text-on-surface'
            }">
              <span class="material-symbols-outlined text-base">directions_run</span>
              <span>RUNNER (${runnerPresets.length})</span>
            </button>
          </div>

          <!-- TAB 1: RUTINAS GYM -->
          ${activeTab === 'gym' ? `
            <div class="flex flex-col gap-3.5 animate-fade-in">
              ${gymRoutines.map(r => {
                const totalSets = r.exercises.reduce((acc, e) => acc + (parseInt(e.targetSets) || 3), 0);
                return `
                  <article class="bg-surface-container rounded-2xl border border-outline-variant hover:border-primary-container/60 p-4 transition-all duration-200 flex flex-col gap-3 shadow-md group">
                    <div class="flex items-center justify-between">
                      <div class="flex items-center gap-2">
                        <span class="px-2.5 py-0.5 rounded-full bg-surface-bright border border-outline-variant text-primary-container text-[10px] font-headline font-black tracking-widest uppercase">
                          ${r.days || 'FLEXIBLE'}
                        </span>
                        <span class="px-2 py-0.5 rounded bg-surface-container-high border border-outline-variant text-on-surface-variant text-[10px] font-headline font-bold uppercase">
                          ${r.category || 'FUERZA'}
                        </span>
                      </div>

                      <div class="flex items-center gap-1">
                        <button data-edit-gym="${r.id}" class="p-1.5 rounded-lg text-on-surface-variant hover:text-primary-container active:scale-95" title="Editar">
                          <span class="material-symbols-outlined text-lg">edit</span>
                        </button>
                        <button data-delete-gym="${r.id}" class="p-1.5 rounded-lg text-on-surface-variant hover:text-error active:scale-95" title="Eliminar">
                          <span class="material-symbols-outlined text-lg">delete</span>
                        </button>
                      </div>
                    </div>

                    <div>
                      <h3 class="font-headline text-lg font-black text-primary uppercase tracking-tight">
                        ${r.title}
                      </h3>
                      <p class="text-xs text-on-surface-variant mt-0.5">
                        ${r.description || `${r.exercises.length} ejercicios planificados`}
                      </p>
                    </div>

                    <div class="flex items-center justify-between pt-1 border-t border-outline-variant/30">
                      <div class="flex items-center gap-2 text-xs text-on-surface-variant font-bold">
                        <span>${r.exercises.length} ejercicios</span>
                        <span>•</span>
                        <span>${totalSets} series</span>
                      </div>

                      <button data-start-gym="${r.id}" class="px-4 py-2.5 rounded-xl bg-primary-container text-on-primary font-headline text-xs font-black uppercase tracking-wider flex items-center gap-1.5 active:scale-95 transition-transform shadow-md">
                        <span class="material-symbols-outlined text-base" style="font-variation-settings: 'FILL' 1;">play_arrow</span>
                        <span>ENTRENAR</span>
                      </button>
                    </div>
                  </article>
                `;
              }).join('')}
            </div>
          ` : activeTab === 'tabata' ? `
            <!-- TAB 2: RUTINAS TABATA (mis_rutinas_tabata_gym from Stitch) -->
            <div class="flex flex-col gap-3.5 animate-fade-in">
              ${tabataPresets.map(p => {
                const totalSecs = p.prep + ((p.work + p.rest) * p.cycles * p.sets) + (p.cooldown || 0);
                return `
                  <article class="bg-surface-container rounded-2xl border border-outline-variant hover:border-primary-container/60 p-4 transition-all duration-200 flex flex-col gap-3 shadow-md group">
                    <div class="flex items-center justify-between">
                      <div class="flex items-center gap-2">
                        <span class="px-2.5 py-0.5 rounded-full bg-surface-bright border border-outline-variant text-primary-container text-[10px] font-headline font-black tracking-widest uppercase">
                          ${p.work}s TRABAJO / ${p.rest}s DESC.
                        </span>
                        <span class="px-2 py-0.5 rounded bg-surface-container-high border border-outline-variant text-on-surface-variant text-[10px] font-headline font-bold uppercase">
                          ${p.cycles} RONDAS
                        </span>
                      </div>

                      <div class="flex items-center gap-1">
                        <span class="font-headline text-base font-black text-primary tabular-nums mr-1">${formatTime(totalSecs)}</span>
                        <button data-delete-tabata="${p.id}" class="p-1 rounded-lg text-on-surface-variant hover:text-error active:scale-95" title="Eliminar">
                          <span class="material-symbols-outlined text-lg">delete</span>
                        </button>
                      </div>
                    </div>

                    <div>
                      <h3 class="font-headline text-lg font-black text-primary uppercase tracking-tight">
                        ${p.title}
                      </h3>
                      <p class="text-xs text-on-surface-variant mt-0.5">
                        ${p.description || p.workName || 'Entrenamiento de intervalos'}
                      </p>
                    </div>

                    <div class="flex items-center justify-between pt-1 border-t border-outline-variant/30">
                      <button data-config-tabata="${p.id}" class="text-xs font-headline font-bold text-on-surface-variant hover:text-primary-container flex items-center gap-1">
                        <span class="material-symbols-outlined text-base">tune</span>
                        <span>EDITAR TIEMPOS</span>
                      </button>

                      <button data-start-tabata="${p.id}" class="px-4 py-2.5 rounded-xl bg-primary-container text-on-primary font-headline text-xs font-black uppercase tracking-wider flex items-center gap-1.5 active:scale-95 transition-transform shadow-md">
                        <span class="material-symbols-outlined text-base" style="font-variation-settings: 'FILL' 1;">play_arrow</span>
                        <span>INICIAR</span>
                      </button>
                    </div>
                  </article>
                `;
              }).join('')}
            </div>
          ` : `
            <!-- TAB 3: RUTINAS RUNNER & INTERVALOS -->
            <div class="flex flex-col gap-3.5 animate-fade-in">
              ${runnerPresets.map(p => {
                const totalSecs = p.intervals.reduce((acc, it) => acc + (parseInt(it.duration) || 60), 0);
                return `
                  <article class="bg-surface-container rounded-2xl border border-outline-variant hover:border-primary-container/60 p-4 transition-all duration-200 flex flex-col gap-3 shadow-md group">
                    <div class="flex items-center justify-between">
                      <div class="flex items-center gap-2">
                        <span class="px-2.5 py-0.5 rounded-full bg-surface-bright border border-outline-variant text-primary-container text-[10px] font-headline font-black tracking-widest uppercase">
                          ${p.totalDistanceEst || 'RUNNER'}
                        </span>
                        <span class="px-2 py-0.5 rounded bg-surface-container-high border border-outline-variant text-on-surface-variant text-[10px] font-headline font-bold uppercase">
                          ${p.intervals.length} INTERVALOS
                        </span>
                      </div>

                      <div class="flex items-center gap-1">
                        <span class="font-headline text-base font-black text-primary tabular-nums mr-1">${formatTime(totalSecs)}</span>
                        <button data-delete-runner="${p.id}" class="p-1 rounded-lg text-on-surface-variant hover:text-error active:scale-95" title="Eliminar">
                          <span class="material-symbols-outlined text-lg">delete</span>
                        </button>
                      </div>
                    </div>

                    <div>
                      <h3 class="font-headline text-lg font-black text-primary uppercase tracking-tight">
                        ${p.title}
                      </h3>
                      <p class="text-xs text-on-surface-variant mt-0.5">
                        ${p.description || 'Programa de intervalos de carrera'}
                      </p>
                    </div>

                    <div class="flex items-center justify-between pt-1 border-t border-outline-variant/30">
                      <button data-edit-runner="${p.id}" class="text-xs font-headline font-bold text-on-surface-variant hover:text-primary-container flex items-center gap-1">
                        <span class="material-symbols-outlined text-base">edit</span>
                        <span>EDITAR RUTINA</span>
                      </button>

                      <button data-start-runner="${p.id}" class="px-4 py-2.5 rounded-xl bg-primary-container text-on-primary font-headline text-xs font-black uppercase tracking-wider flex items-center gap-1.5 active:scale-95 transition-transform shadow-md">
                        <span class="material-symbols-outlined text-base" style="font-variation-settings: 'FILL' 1;">play_arrow</span>
                        <span>CORRER</span>
                      </button>
                    </div>
                  </article>
                `;
              }).join('')}
            </div>
          `}

        </main>

        ${renderBottomNav('routines')}
      </div>
    `;

    container.innerHTML = html;
    attachEvents();
  }

  function attachEvents() {
    document.getElementById('btn-back-hub')?.addEventListener('click', () => {
      hapticTap();
      navigate('home');
    });

    document.getElementById('tab-btn-gym')?.addEventListener('click', () => {
      hapticTap();
      activeTab = 'gym';
      render();
    });

    document.getElementById('tab-btn-tabata')?.addEventListener('click', () => {
      hapticTap();
      activeTab = 'tabata';
      render();
    });

    document.getElementById('tab-btn-runner')?.addEventListener('click', () => {
      hapticTap();
      activeTab = 'runner';
      render();
    });

    document.getElementById('btn-create-routine')?.addEventListener('click', () => {
      hapticTap();
      if (activeTab === 'gym') {
        navigate('gym-editor', { isNew: true });
      } else if (activeTab === 'tabata') {
        navigate('tabata-config', { isNew: true, returnTo: 'routines-hub' });
      } else {
        navigate('runner-editor', { isNew: true });
      }
    });

    // Gym Handlers
    container.querySelectorAll('[data-start-gym]').forEach(btn => {
      btn.addEventListener('click', () => {
        hapticTap();
        const id = btn.getAttribute('data-start-gym');
        const routine = storage.getGymRoutineById(id);
        if (routine) navigate('gym-live', { routine });
      });
    });

    container.querySelectorAll('[data-edit-gym]').forEach(btn => {
      btn.addEventListener('click', () => {
        hapticTap();
        const id = btn.getAttribute('data-edit-gym');
        const routine = storage.getGymRoutineById(id);
        if (routine) navigate('gym-editor', { routine });
      });
    });

    container.querySelectorAll('[data-delete-gym]').forEach(btn => {
      btn.addEventListener('click', () => {
        hapticTap();
        const id = btn.getAttribute('data-delete-gym');
        if (confirm('¿Eliminar esta rutina de gimnasio?')) {
          storage.deleteGymRoutine(id);
          render();
        }
      });
    });

    // Tabata Handlers
    container.querySelectorAll('[data-start-tabata]').forEach(btn => {
      btn.addEventListener('click', () => {
        hapticTap();
        const id = btn.getAttribute('data-start-tabata');
        const preset = storage.getTabataPresetById(id);
        if (preset) navigate('tabata-live', { config: preset });
      });
    });

    container.querySelectorAll('[data-config-tabata]').forEach(btn => {
      btn.addEventListener('click', () => {
        hapticTap();
        const id = btn.getAttribute('data-config-tabata');
        const preset = storage.getTabataPresetById(id);
        if (preset) navigate('tabata-config', { preset, returnTo: 'routines-hub' });
      });
    });

    container.querySelectorAll('[data-delete-tabata]').forEach(btn => {
      btn.addEventListener('click', () => {
        hapticTap();
        const id = btn.getAttribute('data-delete-tabata');
        if (tabataPresets.length <= 1) {
          alert('Debes mantener al menos una rutina Tabata.');
          return;
        }
        if (confirm('¿Eliminar esta rutina Tabata?')) {
          storage.deleteTabataPreset(id);
          render();
        }
      });
    });

    // Runner Handlers
    container.querySelectorAll('[data-start-runner]').forEach(btn => {
      btn.addEventListener('click', () => {
        hapticTap();
        const id = btn.getAttribute('data-start-runner');
        const preset = storage.getRunnerPresetById(id);
        if (preset) navigate('runner-live', { preset });
      });
    });

    container.querySelectorAll('[data-edit-runner]').forEach(btn => {
      btn.addEventListener('click', () => {
        hapticTap();
        const id = btn.getAttribute('data-edit-runner');
        const preset = storage.getRunnerPresetById(id);
        if (preset) navigate('runner-editor', { preset });
      });
    });

    container.querySelectorAll('[data-delete-runner]').forEach(btn => {
      btn.addEventListener('click', () => {
        hapticTap();
        const id = btn.getAttribute('data-delete-runner');
        if (runnerPresets.length <= 1) {
          alert('Debes mantener al menos una rutina Runner.');
          return;
        }
        if (confirm('¿Eliminar esta rutina de Runner?')) {
          storage.deleteRunnerPreset(id);
          render();
        }
      });
    });

    container.querySelectorAll('.nav-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const navTarget = btn.getAttribute('data-nav');
        hapticTap();
        if (navTarget === 'timers') navigate('home');
        if (navTarget === 'routines') navigate('routines-hub');
        if (navTarget === 'history') navigate('history');
        if (navTarget === 'profile') navigate('profile');
      });
    });
  }

  render();
}
