// History View - Review past workouts and progress logs

import { storage } from '../store/storage.js';
import { formatTime, formatDate, formatKg } from '../utils/formatters.js';
import { hapticTap } from '../utils/haptics.js';
import { renderBottomNav } from '../components/BottomNav.js';

export function renderHistory(container, navigate) {
  let history = storage.getHistory();
  let filterType = 'TODOS';

  function getFilteredHistory() {
    if (filterType === 'TODOS') return history;
    return history.filter(h => h.type.toUpperCase() === filterType);
  }

  function render() {
    const filtered = getFilteredHistory();
    const totalWorkouts = history.length;
    const totalSeconds = history.reduce((acc, h) => acc + (h.durationSeconds || 0), 0);
    const totalVolume = history.reduce((acc, h) => acc + (h.totalVolumeKg || 0), 0);

    const html = `
      <div class="w-full h-full flex flex-col justify-between overflow-hidden bg-background select-none">
        <!-- Top App Bar -->
        <header class="w-full z-40 bg-surface border-b border-outline-variant shrink-0 safe-area-top">
          <div class="flex justify-between items-center w-full px-4 h-16 max-w-md mx-auto">
            <div class="flex items-center gap-3">
              <button id="btn-back-hub" class="w-10 h-10 rounded-xl bg-surface-container-high border border-outline-variant flex items-center justify-center text-primary-container active:scale-95 transition-transform" aria-label="Volver">
                <span class="material-symbols-outlined text-[22px]">arrow_back</span>
              </button>
              <div>
                <h1 class="font-montserrat text-lg font-black tracking-wider text-white uppercase leading-tight">ImpuApp</h1>
                <span class="block text-[11px] text-on-surface-variant font-bold tracking-widest uppercase">HISTORIAL DE SESIONES</span>
              </div>
            </div>

            <button id="btn-clear-history" class="p-2 text-on-surface-variant hover:text-error active:scale-95 transition-all" title="Vaciar historial">
              <span class="material-symbols-outlined text-[20px]">delete_sweep</span>
            </button>
          </div>
        </header>

        <!-- Main Content -->
        <main class="w-full flex-1 px-4 py-3 overflow-y-auto no-scrollbar max-w-md mx-auto flex flex-col gap-3.5 pb-24">
          
          <!-- Summary Metrics Bento -->
          <section class="grid grid-cols-3 gap-2 bg-surface-container rounded-2xl p-3 border border-outline-variant shadow-sm text-center shrink-0">
            <div>
              <span class="text-[10px] text-on-surface-variant uppercase font-bold block">Sesiones</span>
              <span class="font-headline text-2xl font-black text-primary mt-0.5 block">${totalWorkouts}</span>
            </div>
            <div class="border-x border-outline-variant/30">
              <span class="text-[10px] text-on-surface-variant uppercase font-bold block">Tiempo Total</span>
              <span class="font-headline text-2xl font-black text-primary-container tabular-nums mt-0.5 block">${Math.round(totalSeconds / 60)}m</span>
            </div>
            <div>
              <span class="text-[10px] text-on-surface-variant uppercase font-bold block">Volumen Gym</span>
              <span class="font-headline text-2xl font-black text-primary tabular-nums mt-0.5 block">${formatKg(totalVolume)}</span>
            </div>
          </section>

          <!-- Type Filter Buttons -->
          <div class="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 shrink-0 min-h-[42px]">
            ${['TODOS', 'TABATA', 'RUNNER', 'GYM'].map(t => `
              <button data-type="${t}" class="btn-filter-type shrink-0 h-9 px-4 rounded-xl text-xs font-headline font-black flex items-center justify-center transition-all active:scale-95 ${
                filterType === t
                  ? 'bg-surface-bright border border-primary-container text-primary-container shadow-sm'
                  : 'bg-surface-container border border-outline-variant text-on-surface-variant hover:text-on-surface'
              }">
                ${t}
              </button>
            `).join('')}
          </div>

          <!-- History Records List -->
          <div class="flex flex-col gap-3">
            ${totalWorkouts === 0 ? `
              <div class="bg-surface-container rounded-3xl p-8 text-center border border-outline-variant flex flex-col items-center gap-3 shadow-sm my-4 shrink-0">
                <div class="w-14 h-14 rounded-2xl bg-surface-container-high border border-outline-variant flex items-center justify-center text-primary-container">
                  <span class="material-symbols-outlined text-3xl">fitness_center</span>
                </div>
                <div>
                  <h3 class="font-headline text-base font-black uppercase text-primary tracking-tight">Historial Listo para Empezar</h3>
                  <p class="text-xs text-on-surface-variant font-medium mt-1 max-w-[260px] mx-auto">
                    Completa tu primera sesión en Tabata, Runner o Gym para registrar tus tiempos, calorías y rachas aquí.
                  </p>
                </div>
              </div>
            ` : filtered.length === 0 ? `
              <div class="bg-surface-container rounded-2xl p-6 text-center border border-outline-variant shrink-0">
                <span class="material-symbols-outlined text-3xl text-on-surface-variant mb-2">history</span>
                <p class="text-xs text-on-surface-variant font-medium">Aún no hay entrenamientos registrados en esta categoría.</p>
              </div>
            ` : filtered.map(item => {
              const icon = item.type === 'runner' ? 'directions_run' : item.type === 'gym' ? 'fitness_center' : 'timer';
              return `
                <article class="bg-surface-container rounded-2xl border border-outline-variant p-3.5 flex flex-col gap-2.5 shadow-sm shrink-0">
                  <div class="flex items-center justify-between pb-2 border-b border-outline-variant/30">
                    <div class="flex items-center gap-2">
                      <div class="w-8 h-8 rounded-lg bg-surface-container-high border border-outline-variant flex items-center justify-center text-primary-container shrink-0">
                        <span class="material-symbols-outlined text-base">${icon}</span>
                      </div>
                      <div>
                        <span class="font-headline text-sm font-black text-primary uppercase block leading-tight">
                          ${item.routineName}
                        </span>
                        <span class="text-[10px] text-on-surface-variant font-medium block">
                          ${formatDate(item.date)}
                        </span>
                      </div>
                    </div>

                    <div class="text-right shrink-0">
                      <span class="font-headline text-base font-black text-primary-container tabular-nums block">
                        ${formatTime(item.durationSeconds)}
                      </span>
                      <span class="text-[9px] text-on-surface-variant font-bold uppercase block">
                        DURACIÓN
                      </span>
                    </div>
                  </div>

                  <div class="flex items-center justify-between text-xs text-on-surface-variant gap-2 mt-0.5">
                    <span class="text-[11px] font-medium leading-snug flex-1">${item.summary || 'Entrenamiento completado'}</span>
                    <div class="flex items-center gap-1 text-[11px] font-bold text-primary shrink-0 ml-2">
                      <span class="material-symbols-outlined text-sm text-tertiary-fixed">local_fire_department</span>
                      <span>~${item.caloriesEst || 100} kcal</span>
                    </div>
                  </div>
                </article>
              `;
            }).join('')}
          </div>

        </main>

        ${renderBottomNav('history')}
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

    document.getElementById('btn-clear-history')?.addEventListener('click', () => {
      hapticTap();
      if (confirm('¿Vaciar todo el historial de entrenamientos?')) {
        storage.clearHistory();
        history = [];
        render();
      }
    });

    container.querySelectorAll('.btn-filter-type').forEach(btn => {
      btn.addEventListener('click', () => {
        hapticTap();
        filterType = btn.getAttribute('data-type');
        render();
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
