import { storage } from '../store/storage.js';
import { renderHeader } from '../components/Header.js';
import { renderBottomNav } from '../components/BottomNav.js';
import { hapticTap } from '../utils/haptics.js';
import { setHtmlPreservingScroll } from '../utils/dom.js';

export function renderHomeHub(container, navigate) {

  const settings = storage.getSettings();
  const history = storage.getHistory();
  const lastWorkout = history.length > 0 ? history[0] : null;

  const html = `
    <div class="w-full h-full flex flex-col justify-between overflow-hidden bg-background select-none">
      ${renderHeader({ title: 'ImpuApp', subtitle: 'HOLA, ' + (settings.athleteName || 'ATLETA') })}


      <!-- Main Scrollable Area -->
      <main class="w-full flex-1 px-4 py-3 pb-24 flex flex-col overflow-y-auto no-scrollbar gap-3.5 max-w-md mx-auto">
        
        <!-- Status & Streak Header -->
        <section class="w-full shrink-0 flex flex-col gap-2.5">
          <div class="rounded-2xl bg-surface-container border border-outline-variant p-3.5 flex items-center justify-between relative overflow-hidden shadow-sm">
            <div class="flex items-center gap-3 relative z-10">
              <div class="w-10 h-10 rounded-xl bg-surface-container-high border border-outline-variant flex items-center justify-center text-primary-container shrink-0">
                <span class="material-symbols-outlined text-[24px]" style="font-variation-settings: 'FILL' 1;">bolt</span>
              </div>
              <div>
                <h2 class="font-headline text-base font-black uppercase text-primary tracking-tight leading-none">
                  ¡HOLA DE NUEVO, ${settings.athleteName || 'ATLETA'}!
                </h2>
                <p class="text-[12px] text-on-surface-variant tracking-wider uppercase mt-1 font-bold">
                  Listo para superar tus límites hoy
                </p>
              </div>
            </div>
            <div class="px-2.5 py-1 rounded-lg bg-surface-container-high border border-outline-variant shrink-0 relative z-10">
              <span class="text-[11px] uppercase text-primary-container font-black tracking-widest font-headline">
                RACHA: ${settings.athleteStreakDays ?? 0} DÍAS
              </span>
            </div>
          </div>

          <div class="px-1">
            <h1 class="font-headline text-2xl font-black uppercase text-primary tracking-tight leading-tight">
              MODO DE SESIÓN
            </h1>
            <p class="text-xs text-on-surface-variant tracking-wider uppercase font-bold mt-0.5">
              ELIGE TU ENTRENAMIENTO DE HOY
            </p>
          </div>
        </section>

        <!-- 3 Interactive Mode Selectors (Hero Cards) -->
        <section class="flex flex-col gap-3 w-full">
          
          <!-- 1. MODO TABATA (Featured Hero Card) -->
          <button id="btn-mode-tabata" class="w-full rounded-2xl bg-surface-container border-2 border-primary-container p-4 py-4.5 flex items-center justify-between text-left transition-all duration-200 active:scale-[0.98] group cursor-pointer glow-primary">
            <div class="flex items-center gap-3.5">
              <div class="w-12 h-12 p-2.5 rounded-xl bg-primary-container flex items-center justify-center text-on-primary-container shadow-md">
                <span class="material-symbols-outlined text-[28px]" style="font-variation-settings: 'FILL' 1;">timer</span>
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <span class="font-headline text-lg font-black uppercase text-primary tracking-tight">RELOJ TABATA</span>
                  <span class="px-2 py-0.5 rounded-full bg-primary-container/20 border border-primary-container/40 text-[10px] text-primary-container font-black uppercase tracking-wider">HIIT</span>
                </div>
                <span class="block text-xs text-on-surface-variant font-medium mt-0.5">Intervalos 20/10, EMOM, ciclos personalizables</span>
              </div>
            </div>
            <div class="w-9 h-9 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center transition-transform group-hover:scale-105 shrink-0">
              <span class="material-symbols-outlined text-[20px]">arrow_forward</span>
            </div>
          </button>

          <!-- 2. MODO RUNNER -->
          <button id="btn-mode-runner" class="w-full rounded-2xl bg-surface-container-low border border-outline-variant hover:border-primary-container/60 p-4 py-4.5 flex items-center justify-between text-left transition-all duration-200 active:scale-[0.98] group cursor-pointer">
            <div class="flex items-center gap-3.5">
              <div class="w-12 h-12 p-2.5 rounded-xl bg-surface-container-high border border-outline-variant flex items-center justify-center text-primary-container group-hover:bg-primary-container group-hover:text-on-primary-container transition-colors">
                <span class="material-symbols-outlined text-[28px]">directions_run</span>
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <span class="font-headline text-lg font-black uppercase text-primary tracking-tight">RELOJ RUNNER</span>
                  <span class="px-2 py-0.5 rounded-full bg-surface-bright border border-outline-variant text-[10px] text-primary-dim font-black uppercase tracking-wider">ZONAS Z1-Z5</span>
                </div>
                <span class="block text-xs text-on-surface-variant font-medium mt-0.5">Cuestas, sprints 400m, series de ritmo y fartlek</span>
              </div>
            </div>
            <div class="w-9 h-9 rounded-full bg-surface-container border border-outline-variant flex items-center justify-center text-primary group-hover:bg-primary-container group-hover:text-on-primary-container transition-colors shrink-0">
              <span class="material-symbols-outlined text-[18px]">arrow_forward</span>
            </div>
          </button>

          <!-- 3. RUTINAS GYM -->
          <button id="btn-mode-gym" class="w-full rounded-2xl bg-surface-container-low border border-outline-variant hover:border-primary-container/60 p-4 py-4.5 flex items-center justify-between text-left transition-all duration-200 active:scale-[0.98] group cursor-pointer">
            <div class="flex items-center gap-3.5">
              <div class="w-12 h-12 p-2.5 rounded-xl bg-surface-container-high border border-outline-variant flex items-center justify-center text-primary-container group-hover:bg-primary-container group-hover:text-on-primary-container transition-colors">
                <span class="material-symbols-outlined text-[28px]">fitness_center</span>
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <span class="font-headline text-lg font-black uppercase text-primary tracking-tight">RUTINAS GYM</span>
                  <span class="px-2 py-0.5 rounded-full bg-surface-bright border border-outline-variant text-[10px] text-primary-dim font-black uppercase tracking-wider">TRACKER</span>
                </div>
                <span class="block text-xs text-on-surface-variant font-medium mt-0.5">Series, cargas en KG, repeticiones y descanso cronometrado</span>
              </div>
            </div>
            <div class="w-9 h-9 rounded-full bg-surface-container border border-outline-variant flex items-center justify-center text-primary group-hover:bg-primary-container group-hover:text-on-primary-container transition-colors shrink-0">
              <span class="material-symbols-outlined text-[18px]">arrow_forward</span>
            </div>
          </button>

        </section>

        <!-- Daily Motivational Quote & Color Customizer Quick Action -->
        <section class="w-full shrink-0 flex flex-col gap-2 my-1">
          <div class="rounded-2xl bg-surface-container-low border border-outline-variant/80 p-3.5 flex items-start gap-3 relative overflow-hidden">
            <div class="w-8 h-8 rounded-lg bg-surface-container-high border border-outline-variant flex items-center justify-center text-tertiary-fixed shrink-0">
              <span class="material-symbols-outlined text-[20px]" style="font-variation-settings: 'FILL' 1;">local_fire_department</span>
            </div>
            <div class="flex-1">
              <p class="text-[12px] leading-snug text-on-background italic font-medium">
                “Cada segundo cuenta. La disciplina supera al talento cuando el talento no se esfuerza.”
              </p>
              <div class="flex items-center justify-between mt-2 pt-1 border-t border-outline-variant/30">
                <button id="btn-quick-colors" class="flex items-center gap-1.5 text-[11px] text-primary-container font-headline font-bold uppercase hover:underline">
                  <span class="material-symbols-outlined text-sm">palette</span>
                  <span>PERSONALIZAR COLORES</span>
                </button>
                ${lastWorkout ? `
                  <span class="text-[11px] text-on-surface-variant font-bold">Último: ${lastWorkout.routineName}</span>
                ` : ''}
              </div>
            </div>
          </div>
        </section>

      </main>

      ${renderBottomNav('timers')}
    </div>
  `;

  setHtmlPreservingScroll(container, html);

  // Header settings button

  document.getElementById('header-btn-settings')?.addEventListener('click', () => {
    hapticTap();
    navigate('settings', { subTab: 'colors' });
  });

  // Quick Colors button
  document.getElementById('btn-quick-colors')?.addEventListener('click', () => {
    hapticTap();
    navigate('settings', { subTab: 'colors' });
  });

  // Mode buttons
  document.getElementById('btn-mode-tabata')?.addEventListener('click', () => {
    hapticTap();
    navigate('tabata-config');
  });

  document.getElementById('btn-mode-runner')?.addEventListener('click', () => {
    hapticTap();
    navigate('runner-catalog');
  });

  document.getElementById('btn-mode-gym')?.addEventListener('click', () => {
    hapticTap();
    navigate('routines-hub', { tab: 'gym' });
  });

  // Bottom Navigation
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
