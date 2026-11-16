import { storage } from '../store/storage.js';
import { renderHeader } from '../components/Header.js';
import { renderBottomNav } from '../components/BottomNav.js';
import { hapticTap } from '../utils/haptics.js';
import { setHtmlPreservingScroll } from '../utils/dom.js';

export function renderHomeHub(container, navigate) {

  const settings = storage.getSettings();
  const history = storage.getHistory();
  const lastWorkout = history.length > 0 ? history[0] : null;
  let bandStats = storage.getSmartBandStats();

  // Solicitar refresco de telemetría nativa a Health Connect si está disponible
  if (typeof window !== 'undefined' && window.ReactNativeWebView) {
    try {
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'HEALTH_CONNECT_GET_TODAY_STATS'
      }));
    } catch (e) {}
  }

  const stepsGoal = 10000;
  const stepsPercent = Math.min(100, Math.round(((bandStats.steps || 0) / stepsGoal) * 100));

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

          <!-- Xiaomi Smart Band 9 Telemetry Widget -->
          <div class="rounded-2xl bg-surface-container border border-outline-variant p-3.5 flex flex-col gap-2.5 relative overflow-hidden shadow-sm">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <div class="w-7 h-7 rounded-lg bg-surface-container-high border border-outline-variant flex items-center justify-center text-primary-container">
                  <span class="material-symbols-outlined text-[18px]">watch</span>
                </div>
                <div>
                  <span class="font-headline text-xs font-black uppercase tracking-wider text-primary flex items-center gap-1.5 leading-none">
                    XIAOMI SMART BAND 9
                    <span class="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse"></span>
                  </span>
                  <span id="band-sync-subtitle" class="text-[10px] text-on-surface-variant font-medium">Sincronizado con ${bandStats.sourceApp || 'Health Connect'}</span>
                </div>
              </div>
              <div class="flex items-center gap-1">
                <button id="btn-sync-band" class="p-1.5 rounded-lg bg-surface-container-high border border-outline-variant text-on-surface-variant hover:text-primary-container active:scale-95 transition-all" title="Sincronizar ahora">
                  <span class="material-symbols-outlined text-base">sync</span>
                </button>
                <button id="btn-health-settings" class="p-1.5 rounded-lg bg-surface-container-high border border-outline-variant text-on-surface-variant hover:text-primary-container active:scale-95 transition-all" title="Permisos de Health Connect">
                  <span class="material-symbols-outlined text-base">settings</span>
                </button>
              </div>
            </div>

            <div class="grid grid-cols-3 gap-2 pt-1 border-t border-outline-variant/30">
              <!-- Pasos -->
              <div class="flex flex-col">
                <span class="text-[10px] uppercase font-bold text-on-surface-variant tracking-wider flex items-center gap-1">
                  <span class="material-symbols-outlined text-xs text-primary-container">footprint</span>
                  Pasos
                </span>
                <span id="band-steps-val" class="font-headline text-base font-black text-white tabular-nums">
                  ${(bandStats.steps || 0).toLocaleString()}
                </span>
                <div class="w-full h-1 bg-surface-container-high rounded-full overflow-hidden mt-1">
                  <div id="band-steps-bar" class="h-full bg-primary-container rounded-full" style="width: ${stepsPercent}%"></div>
                </div>
              </div>

              <!-- Calorías -->
              <div class="flex flex-col">
                <span class="text-[10px] uppercase font-bold text-on-surface-variant tracking-wider flex items-center gap-1">
                  <span class="material-symbols-outlined text-xs text-amber-400">local_fire_department</span>
                  Calorías
                </span>
                <span id="band-cal-val" class="font-headline text-base font-black text-amber-400 tabular-nums">
                  ${(bandStats.calories || 0).toLocaleString()} <span class="text-[10px] text-on-surface-variant font-normal">kcal</span>
                </span>
              </div>

              <!-- Pulso / BPM -->
              <div class="flex flex-col">
                <span class="text-[10px] uppercase font-bold text-on-surface-variant tracking-wider flex items-center gap-1">
                  <span class="material-symbols-outlined text-xs text-rose-500">favorite</span>
                  Pulso
                </span>
                <span id="band-bpm-val" class="font-headline text-base font-black text-rose-400 tabular-nums">
                  ${bandStats.latestBpm || bandStats.avgBpm || '--'} <span class="text-[10px] text-on-surface-variant font-normal">BPM</span>
                </span>
              </div>
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

  // Sync Band button
  const syncBtn = document.getElementById('btn-sync-band');
  syncBtn?.addEventListener('click', () => {
    hapticTap();
    syncBtn.classList.add('animate-spin');
    if (typeof window !== 'undefined' && window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'HEALTH_CONNECT_GET_TODAY_STATS'
      }));
    }
    setTimeout(() => {
      syncBtn.classList.remove('animate-spin');
    }, 1200);
  });

  // Settings Band button (abre la pantalla de permisos de Health Connect)
  const healthSettingsBtn = document.getElementById('btn-health-settings');
  healthSettingsBtn?.addEventListener('click', () => {
    hapticTap();
    if (typeof window !== 'undefined' && window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'HEALTH_CONNECT_REQUEST_PERMISSIONS'
      }));
    }
  });

  // Listener para evento custom de actualización de Health Connect
  const onStatsUpdated = (e) => {
    const d = e.detail;
    if (!d) return;
    const stepsEl = document.getElementById('band-steps-val');
    const calEl = document.getElementById('band-cal-val');
    const bpmEl = document.getElementById('band-bpm-val');
    const barEl = document.getElementById('band-steps-bar');
    const subEl = document.getElementById('band-sync-subtitle');

    if (subEl && d.sourceApp) {
      subEl.textContent = `Sincronizado con ${d.sourceApp}`;
    }

    if (stepsEl && typeof d.steps === 'number') {
      stepsEl.textContent = d.steps.toLocaleString();
      if (barEl) {
        const pct = Math.min(100, Math.round((d.steps / 10000) * 100));
        barEl.style.width = `${pct}%`;
      }
    }
    if (calEl && typeof d.calories === 'number') calEl.innerHTML = `${d.calories.toLocaleString()} <span class="text-[10px] text-on-surface-variant font-normal">kcal</span>`;
    if (bpmEl) {
      const val = d.latestBpm || d.avgBpm || '--';
      bpmEl.innerHTML = `${val} <span class="text-[10px] text-on-surface-variant font-normal">BPM</span>`;
    }

    storage.saveSmartBandStats({
      connected: true,
      steps: d.steps || 0,
      calories: d.calories || 0,
      latestBpm: d.latestBpm || null,
      avgBpm: d.avgBpm || null,
      sourceApp: d.sourceApp || 'Health Connect',
      updatedAt: d.updatedAt || Date.now()
    });
  };

  window.addEventListener('healthConnectTodayStats', onStatsUpdated);

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
    navigate('tabata-config', { returnTo: 'home' });
  });

  document.getElementById('btn-mode-runner')?.addEventListener('click', () => {
    hapticTap();
    navigate('runner-catalog', { returnTo: 'home' });
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
