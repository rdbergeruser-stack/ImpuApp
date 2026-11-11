// History View - Review past workouts, progress logs, and Smartband Biometric Telemetry

import { storage } from '../store/storage.js';
import { formatTime, formatDate, formatKg } from '../utils/formatters.js';
import { hapticTap } from '../utils/haptics.js';
import { renderBottomNav } from '../components/BottomNav.js';
import { showConfirmModal } from '../utils/modal.js';

export function renderHistory(container, navigate) {
  let history = storage.getHistory();
  let filterType = 'TODOS';

  function getFilteredHistory() {
    if (filterType === 'TODOS') return history;
    return history.filter(h => h.type.toUpperCase() === filterType);
  }

  // Generador de curva de pulso ECG/Sparkline vectorial SVG para la telemetría de cada sesión
  function generatePulseSparkline(type, avgBpm = 145, maxBpm = 175) {
    const width = 280;
    const height = 36;
    let points = [];

    if (type === 'tabata') {
      // Picos y valles regulares correspondientes a intervalos de trabajo 20s y descanso 10s
      const intervals = 8;
      for (let i = 0; i <= intervals; i++) {
        const xWork = (i / intervals) * width;
        const xRest = Math.min(width, xWork + (width / (intervals * 2)));
        points.push(`${xWork.toFixed(1)},${(height * 0.2).toFixed(1)}`);
        points.push(`${xRest.toFixed(1)},${(height * 0.75).toFixed(1)}`);
      }
    } else if (type === 'gym') {
      // Spikes durante las series pesadas y mesetas de descenso durante descansos
      const sets = 5;
      points.push(`0,${height * 0.8}`);
      for (let s = 1; s <= sets; s++) {
        const x1 = ((s - 0.7) / sets) * width;
        const x2 = ((s - 0.4) / sets) * width;
        const x3 = (s / sets) * width;
        points.push(`${x1.toFixed(1)},${height * 0.75}`);
        points.push(`${x2.toFixed(1)},${(height * 0.15).toFixed(1)}`);
        points.push(`${x3.toFixed(1)},${(height * 0.65).toFixed(1)}`);
      }
    } else {
      // Runner: Curva ascendente sostenida de ritmo aeróbico
      const steps = 10;
      for (let st = 0; st <= steps; st++) {
        const x = (st / steps) * width;
        const normalizedProg = Math.sin((st / steps) * (Math.PI / 1.5));
        const y = height * 0.85 - (normalizedProg * height * 0.65) + (Math.sin(st * 2) * 3);
        points.push(`${x.toFixed(1)},${y.toFixed(1)}`);
      }
    }

    const strokePath = `M ${points.join(' L ')}`;
    const areaPath = `${strokePath} L ${width},${height} L 0,${height} Z`;

    return `
      <div class="w-full bg-surface-container-high/60 rounded-xl p-2 border border-outline-variant/30 flex flex-col gap-1 my-1">
        <div class="flex items-center justify-between text-[9px] font-bold text-on-surface-variant uppercase px-0.5">
          <span class="flex items-center gap-1 text-rose-400 font-headline font-black">
            <span class="material-symbols-outlined text-[13px]" style="font-variation-settings: 'FILL' 1;">ecg_heart</span>
            <span>CURVA DE PULSO</span>
          </span>
          <span class="text-rose-300 font-headline font-black">${avgBpm} BPM MEDIO</span>
          <span class="text-amber-400 font-headline font-black">PICO: ${maxBpm} BPM</span>
        </div>
        <svg class="w-full h-9 overflow-visible" viewBox="0 0 ${width} ${height}">
          <defs>
            <linearGradient id="pulseGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stop-color="#ff3b5c" stop-opacity="0.3" />
              <stop offset="100%" stop-color="#ff3b5c" stop-opacity="0.0" />
            </linearGradient>
          </defs>
          <path d="${areaPath}" fill="url(#pulseGrad)" />
          <path d="${strokePath}" fill="none" stroke="#ff3b5c" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </div>
    `;
  }

  function render() {
    const filtered = getFilteredHistory();
    const totalWorkouts = history.length;
    const totalSeconds = history.reduce((acc, h) => acc + (h.durationSeconds || 0), 0);
    const totalVolume = history.reduce((acc, h) => acc + (h.totalVolumeKg || 0), 0);
    const totalCalories = history.reduce((acc, h) => acc + (h.caloriesEst || 0), 0);

    // Métricas biométricas acumuladas
    const avgHeartRate = totalWorkouts > 0 
      ? Math.round(history.reduce((acc, h) => acc + (h.avgBpm || 142), 0) / totalWorkouts) 
      : 142;

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
                <div class="flex items-center gap-1.5">
                  <h1 class="font-montserrat text-lg font-black tracking-wider text-white uppercase leading-tight">ImpuApp</h1>
                  <span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-primary-container/15 border border-primary-container/40 text-[8px] font-headline font-black text-primary-container uppercase">
                    <span class="w-1.5 h-1.5 rounded-full bg-primary-container animate-ping"></span>
                    <span>BLE</span>
                  </span>
                </div>
                <span class="block text-[10px] text-on-surface-variant font-bold tracking-widest uppercase">HISTORIAL BIOMÉTRICO</span>
              </div>
            </div>

            <div class="flex items-center gap-1.5">
              <button id="btn-goto-weight" class="h-9 px-2.5 rounded-xl bg-surface-container border border-outline-variant text-[10px] font-headline font-black text-primary-container flex items-center gap-1 active:scale-95 transition-all" title="Control de Peso">
                <span class="material-symbols-outlined text-base">scale</span>
                <span>PESO</span>
              </button>
              <button id="btn-clear-history" class="p-2 text-on-surface-variant hover:text-error active:scale-95 transition-all" title="Vaciar historial">
                <span class="material-symbols-outlined text-[20px]">delete_sweep</span>
              </button>
            </div>
          </div>
        </header>

        <!-- Main Content -->
        <main class="w-full flex-1 px-4 py-3 overflow-y-auto no-scrollbar max-w-md mx-auto flex flex-col gap-3.5 pb-24">
          
          <!-- Summary Metrics Bento with Smartband Data -->
          <section class="grid grid-cols-4 gap-1.5 bg-surface-container rounded-2xl p-3 border border-outline-variant shadow-sm text-center shrink-0">
            <div>
              <span class="text-[8px] text-on-surface-variant uppercase font-bold block">Sesiones</span>
              <span class="font-headline text-xl font-black text-white mt-0.5 block">${totalWorkouts}</span>
            </div>
            <div class="border-l border-outline-variant/30">
              <span class="text-[8px] text-on-surface-variant uppercase font-bold block">FC Media</span>
              <span class="font-headline text-xl font-black text-rose-400 mt-0.5 block flex items-center justify-center gap-0.5">
                <span class="material-symbols-outlined text-xs text-rose-500" style="font-variation-settings: 'FILL' 1;">favorite</span>
                <span>${avgHeartRate}</span>
              </span>
            </div>
            <div class="border-l border-outline-variant/30">
              <span class="text-[8px] text-on-surface-variant uppercase font-bold block">Tiempo Total</span>
              <span class="font-headline text-xl font-black text-primary-container tabular-nums mt-0.5 block">${Math.round(totalSeconds / 60)}m</span>
            </div>
            <div class="border-l border-outline-variant/30">
              <span class="text-[8px] text-on-surface-variant uppercase font-bold block">Calorías</span>
              <span class="font-headline text-xl font-black text-amber-400 tabular-nums mt-0.5 block">${totalCalories}</span>
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
              const avgBpm = item.avgBpm || (item.type === 'tabata' ? 162 : item.type === 'runner' ? 155 : 130);
              const maxBpm = item.maxBpm || (avgBpm + 22);
              const recovery = item.recoveryDrop || 32;
              const zones = item.zones || { z2: 15, z3: 25, z4: 35, z5: 25 };

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

                  <!-- Biometric Sparkline ECG Curve -->
                  ${generatePulseSparkline(item.type, avgBpm, maxBpm)}

                  <!-- Heart Rate Zones Distribution Bar -->
                  <div class="flex flex-col gap-1 pt-0.5">
                    <div class="w-full flex h-1.5 rounded-full overflow-hidden bg-surface-container-high">
                      <div style="width: ${zones.z2 || 15}%;" class="bg-emerald-400" title="Z2 Calentamiento"></div>
                      <div style="width: ${zones.z3 || 25}%;" class="bg-amber-400" title="Z3 Aeróbico"></div>
                      <div style="width: ${zones.z4 || 35}%;" class="bg-orange-500" title="Z4 Potencia"></div>
                      <div style="width: ${zones.z5 || 25}%;" class="bg-rose-500" title="Z5 Máximo esfuerzo"></div>
                    </div>
                    <div class="flex items-center justify-between text-[9px] font-bold text-on-surface-variant">
                      <span class="text-emerald-400">Z2/Z3: ${(zones.z2 || 15) + (zones.z3 || 25)}%</span>
                      <span class="text-rose-400">Z4/Z5: ${(zones.z4 || 35) + (zones.z5 || 25)}%</span>
                      <span class="text-primary-container font-black">Recup: -${recovery} bpm/1m</span>
                    </div>
                  </div>

                  <div class="flex items-center justify-between text-xs text-on-surface-variant gap-2 mt-0.5 pt-1.5 border-t border-outline-variant/30">
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

    document.getElementById('btn-goto-weight')?.addEventListener('click', () => {
      hapticTap();
      navigate('weight-tracker');
    });

    document.getElementById('btn-clear-history')?.addEventListener('click', async () => {
      hapticTap();
      const confirmed = await showConfirmModal({
        title: 'Vaciar Historial',
        message: '¿Estás seguro de que deseas vaciar todo el historial de entrenamientos? Esta acción es irreversible.',
        confirmText: 'Sí, vaciar',
        cancelText: 'Cancelar',
        confirmDanger: true,
        icon: 'delete_sweep'
      });
      if (confirmed) {
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
