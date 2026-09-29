// Summary View - Celebratory workout completion screen

import { storage } from '../store/storage.js';
import { formatTime, formatKg } from '../utils/formatters.js';
import { hapticTap, hapticSuccess } from '../utils/haptics.js';

export function renderSummary(container, navigate, params = {}) {
  const workout = params.workout || {
    type: 'tabata',
    routineName: 'Entrenamiento Completado',
    durationSeconds: 300,
    caloriesEst: 85,
    summary: 'Sesión completada con éxito.'
  };

  // Automatically save to local history on render
  try {
    storage.addHistoryEntry(workout);
    hapticSuccess();
  } catch (e) {
    console.error('Error auto-saving workout to history:', e);
  }

  const html = `
    <div class="w-full h-full flex flex-col justify-between overflow-hidden bg-background select-none">
      
      <!-- Top Navigation Header -->
      <header class="w-full z-20 flex justify-between items-center px-4 h-16 border-b border-outline-variant bg-surface shrink-0 safe-area-top">
        <div class="flex items-center gap-2">
          <span class="font-montserrat text-lg uppercase tracking-wider text-white font-black leading-tight">ImpuApp</span>
          <span class="inline-flex items-center justify-center w-1.5 h-1.5 rounded-full bg-primary-container animate-ping"></span>
          <span class="text-[10px] tracking-widest text-primary-container uppercase font-headline font-black">RESUMEN DE SESIÓN</span>
        </div>

        <button id="btn-summary-close" class="w-10 h-10 rounded-full bg-surface-container border border-outline-variant flex items-center justify-center text-on-surface hover:text-primary-container active:scale-95 transition-all" aria-label="Cerrar">
          <span class="material-symbols-outlined text-[20px]">close</span>
        </button>
      </header>

      <!-- Main Content Scroll Area -->
      <main class="flex-1 px-4 py-4 flex flex-col justify-between overflow-y-auto no-scrollbar max-w-md mx-auto w-full gap-4">
        
        <!-- Celebratory Medal Emblem -->
        <section class="flex flex-col items-center text-center mt-2">
          <div class="relative mb-3 flex items-center justify-center">
            <div class="absolute inset-0 rounded-full bg-primary-container/20 radar-pulse blur-md"></div>
            <div class="relative w-20 h-20 rounded-full bg-surface-container-high border-2 border-primary-container flex items-center justify-center glow-work">
              <span class="material-symbols-outlined text-[42px] text-primary-container" style="font-variation-settings: 'FILL' 1;">
                emoji_events
              </span>
            </div>
            <!-- Micro Status Tag -->
            <div class="absolute -bottom-2 bg-surface-container-lowest border border-primary-container px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-lg">
              <span class="material-symbols-outlined text-primary-container text-xs" style="font-variation-settings: 'FILL' 1;">check_circle</span>
              <span class="text-[10px] text-primary-container tracking-wider font-headline font-black uppercase">100% EFECTIVIDAD</span>
            </div>
          </div>

          <span class="text-xs text-on-surface-variant tracking-widest uppercase font-bold mt-2">SESIÓN FINALIZADA</span>
          <h1 class="font-headline text-2xl font-black text-primary tracking-tight uppercase leading-tight mt-0.5">
            ¡ENTRENAMIENTO COMPLETADO!
          </h1>

          <!-- Routine Pill -->
          <div class="mt-2.5 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface-container border border-outline-variant">
            <span class="material-symbols-outlined text-primary-container text-base">
              ${workout.type === 'runner' ? 'directions_run' : workout.type === 'gym' ? 'fitness_center' : 'timer'}
            </span>
            <span class="font-headline text-xs text-primary-container tracking-wide font-black uppercase">
              ${workout.routineName}
            </span>
          </div>

          <p class="text-xs text-on-surface-variant max-w-xs mt-2 italic font-medium">
            ${workout.summary || 'Excelente trabajo. Has mantenido la disciplina y alcanzado tu meta con éxito.'}
          </p>
        </section>

        <!-- Key Metrics Bento Grid -->
        <section class="grid grid-cols-2 gap-2.5 my-auto">
          
          <!-- Giant Chrono Metric (Full Row) -->
          <div class="col-span-2 bg-surface-container border border-outline-variant rounded-2xl p-4 relative overflow-hidden flex flex-col justify-between shadow-md">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="material-symbols-outlined text-primary-container text-base">timer</span>
                <span class="text-[10px] text-on-surface-variant tracking-widest uppercase font-bold">TIEMPO TOTAL INVERTIDO</span>
              </div>
              <span class="px-2 py-0.5 rounded bg-primary-container/20 border border-primary-container/30 text-primary-container text-[10px] font-headline font-black uppercase">CONCLUIDO</span>
            </div>

            <div class="mt-2 flex items-baseline gap-2">
              <span class="font-headline text-4xl text-primary font-black tracking-tight tabular-nums">
                ${formatTime(workout.durationSeconds)}
              </span>
              <span class="text-xs text-on-surface-variant font-bold uppercase">MINUTOS</span>
            </div>

            <div class="mt-2 w-full bg-surface-container-lowest h-1.5 rounded-full overflow-hidden">
              <div class="bg-primary-container h-full w-full rounded-full"></div>
            </div>
          </div>

          <!-- Calories Metric Card -->
          <div class="bg-surface-container border border-outline-variant rounded-2xl p-3.5 flex flex-col justify-between shadow-sm">
            <div class="flex items-center gap-1.5 text-on-surface-variant">
              <span class="material-symbols-outlined text-tertiary-fixed text-base">local_fire_department</span>
              <span class="text-[10px] tracking-wider uppercase font-bold">CALORÍAS</span>
            </div>
            <div class="my-2">
              <span class="font-headline text-2xl font-black text-primary tabular-nums">
                ~${workout.caloriesEst || 120}
              </span>
              <span class="text-[10px] text-on-surface-variant font-bold ml-1">KCAL</span>
            </div>
            <span class="text-[9px] text-on-surface-variant font-medium">Gasto estimado</span>
          </div>

          <!-- Specific Metric Card (Volume or Type) -->
          <div class="bg-surface-container border border-outline-variant rounded-2xl p-3.5 flex flex-col justify-between shadow-sm">
            <div class="flex items-center gap-1.5 text-on-surface-variant">
              <span class="material-symbols-outlined text-primary-container text-base">
                ${workout.type === 'gym' ? 'fitness_center' : 'speed'}
              </span>
              <span class="text-[10px] tracking-wider uppercase font-bold">
                ${workout.type === 'gym' ? 'VOLUMEN TOTAL' : 'TIPO'}
              </span>
            </div>
            <div class="my-2">
              <span class="font-headline text-2xl font-black text-primary-container tabular-nums">
                ${workout.type === 'gym' ? formatKg(workout.totalVolumeKg || 0) : workout.type.toUpperCase()}
              </span>
            </div>
            <span class="text-[9px] text-on-surface-variant font-medium">
              ${workout.type === 'gym' ? `${workout.totalSets || 0} series registradas` : '100% completado'}
            </span>
          </div>

        </section>

        <!-- Bottom Action CTA -->
        <footer class="w-full flex flex-col gap-2 pb-4 safe-area-bottom">
          <button id="btn-summary-home" class="w-full h-15 rounded-2xl bg-primary-container text-on-primary font-headline text-sm font-black uppercase tracking-wider flex items-center justify-center gap-2 glow-primary active:scale-[0.98] transition-transform shadow-xl">
            <span class="material-symbols-outlined text-[22px]">home</span>
            <span>VOLVER AL INICIO</span>
          </button>
        </footer>

      </main>
    </div>
  `;

  container.innerHTML = html;

  document.getElementById('btn-summary-close')?.addEventListener('click', () => {
    hapticTap();
    navigate('home');
  });

  document.getElementById('btn-summary-home')?.addEventListener('click', () => {
    hapticTap();
    navigate('home');
  });
}
