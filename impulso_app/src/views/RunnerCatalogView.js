// Runner Catalog View - Select runner routine or interval program

import { storage } from '../store/storage.js';
import { formatTime } from '../utils/formatters.js';
import { hapticTap } from '../utils/haptics.js';
import { renderBottomNav } from '../components/BottomNav.js';

export function renderRunnerCatalog(container, navigate) {
  const runnerPresets = storage.getRunnerPresets();

  function getZoneBadge(zone) {
    switch (zone) {
      case 'Z5': return '<span class="px-1.5 py-0.5 rounded bg-error/20 border border-error/40 text-error text-[10px] font-black">Z5 SPRINT</span>';
      case 'Z4': return '<span class="px-1.5 py-0.5 rounded bg-tertiary/20 border border-tertiary/40 text-tertiary text-[10px] font-black">Z4 UMBRAL</span>';
      case 'Z3': return '<span class="px-1.5 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-black">Z3 TEMPO</span>';
      case 'Z2': return '<span class="px-1.5 py-0.5 rounded bg-primary-container/20 border border-primary-container/40 text-primary-container text-[10px] font-black">Z2 AERÓBICO</span>';
      default: return '<span class="px-1.5 py-0.5 rounded bg-surface-bright border border-outline-variant text-on-surface-variant text-[10px] font-black">Z1 RECOVERY</span>';
    }
  }

  const html = `
    <div class="w-full h-full flex flex-col justify-between overflow-hidden bg-background select-none">
      <header class="w-full z-40 bg-surface border-b border-outline-variant shrink-0 safe-area-top">
        <div class="flex justify-between items-center w-full px-4 h-16 max-w-md mx-auto">
          <div class="flex items-center gap-3">
            <button id="btn-back-hub" class="w-10 h-10 rounded-xl bg-surface-container-high border border-outline-variant flex items-center justify-center text-primary-container active:scale-95 transition-transform" aria-label="Volver">
              <span class="material-symbols-outlined text-[22px]">arrow_back</span>
            </button>
            <div>
              <h1 class="font-montserrat text-lg font-black tracking-wider text-white uppercase leading-tight">ImpuApp</h1>
              <span class="block text-[11px] text-on-surface-variant font-bold tracking-widest uppercase">MODO RUNNER & ZONAS</span>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <button id="btn-create-runner" class="flex items-center gap-1 px-3 py-1.5 rounded-full bg-primary-container text-on-primary font-headline text-xs font-black active:scale-95 transition-transform shadow-md">
              <span class="material-symbols-outlined text-base">add</span>
              <span>NUEVA</span>
            </button>
            <div class="w-10 h-10 rounded-xl bg-surface-container border border-outline-variant flex items-center justify-center text-primary-container">
              <span class="material-symbols-outlined text-[22px]">directions_run</span>
            </div>
          </div>
        </div>
      </header>

      <main class="w-full flex-1 px-4 py-3 overflow-y-auto no-scrollbar max-w-md mx-auto flex flex-col gap-3.5 pb-24">
        
        <section class="bg-surface-container rounded-2xl p-4 border border-outline-variant relative overflow-hidden shadow-sm">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-xl bg-surface-container-high border border-outline-variant flex items-center justify-center text-primary-container shrink-0">
              <span class="material-symbols-outlined text-[28px]">speed</span>
            </div>
            <div>
              <h2 class="font-headline text-base font-black uppercase text-primary tracking-tight leading-none">
                INTERVALOS & CUESTAS
              </h2>
              <p class="text-xs text-on-surface-variant font-medium mt-1">
                Audio-guía por zonas cardíacas (Z1 a Z5) con beeps y consejos de cadencia en tiempo real.
              </p>
            </div>
          </div>
        </section>

        <section class="flex flex-col gap-3.5">
          <div class="flex items-center justify-between px-1">
            <h3 class="font-headline text-xs font-black uppercase tracking-widest text-on-surface-variant">
              PROGRAMAS DISPONIBLES (${runnerPresets.length})
            </h3>
          </div>

          ${runnerPresets.map(preset => {
            const totalSecs = preset.intervals.reduce((acc, i) => acc + i.duration, 0);
            const zonesUsed = [...new Set(preset.intervals.map(i => i.zone))];

            return `
              <article class="bg-surface-container rounded-2xl border border-outline-variant hover:border-primary-container/60 p-4 transition-all duration-200 flex flex-col gap-3 shadow-md group">
                <div class="flex items-start justify-between">
                  <div>
                    <div class="flex items-center gap-2 mb-1">
                      <span class="px-2 py-0.5 rounded-full bg-surface-bright border border-outline-variant text-[10px] font-headline text-primary-container font-black uppercase">
                        ${preset.totalDistanceEst || 'RUN'}
                      </span>
                      <span class="text-xs text-on-surface-variant font-bold">${preset.intervals.length} INTERVALOS</span>
                    </div>
                    <h4 class="font-headline text-lg font-black text-primary uppercase tracking-tight">
                      ${preset.title}
                    </h4>
                    <p class="text-xs text-on-surface-variant mt-0.5">
                      ${preset.description}
                    </p>
                  </div>
                  <div class="text-right">
                    <span class="font-headline text-xl font-black text-primary-container tabular-nums">${formatTime(totalSecs)}</span>
                    <span class="block text-[10px] text-on-surface-variant font-bold uppercase">DURACIÓN</span>
                  </div>
                </div>

                <div class="flex items-center gap-1.5 pt-2 border-t border-outline-variant/30 flex-wrap">
                  <span class="text-[10px] text-on-surface-variant font-bold uppercase mr-1">ZONAS:</span>
                  ${zonesUsed.map(z => getZoneBadge(z)).join('')}
                </div>

                <button data-runner-id="${preset.id}" class="btn-start-runner w-full h-12 rounded-xl bg-surface-container-high border border-outline-variant hover:border-primary-container hover:bg-primary-container hover:text-on-primary font-headline text-xs uppercase tracking-wider font-black flex items-center justify-center gap-2 active:scale-95 transition-all text-primary">
                  <span class="material-symbols-outlined text-[20px]" style="font-variation-settings: 'FILL' 1;">play_arrow</span>
                  <span>INICIAR SESIÓN RUNNER</span>
                </button>
              </article>
            `;
          }).join('')}
        </section>

      </main>

      ${renderBottomNav('timers')}
    </div>
  `;

  container.innerHTML = html;

  document.getElementById('btn-back-hub')?.addEventListener('click', () => {
    hapticTap();
    navigate('home');
  });

  document.getElementById('btn-create-runner')?.addEventListener('click', () => {
    hapticTap();
    navigate('runner-editor', { isNew: true });
  });

  container.querySelectorAll('.btn-start-runner').forEach(btn => {
    btn.addEventListener('click', () => {
      hapticTap();
      const id = btn.getAttribute('data-runner-id');
      const preset = runnerPresets.find(p => p.id === id);
      if (preset) {
        navigate('runner-live', { preset });
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

